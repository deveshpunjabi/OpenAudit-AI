import React from 'react';
import { AIDetectionResult, AIDetectionStats } from '../utils/aiDetectionAPI';
import { Brain, AlertCircle, CheckCircle, Download, ExternalLink } from 'lucide-react';
import jsPDF from 'jspdf';

interface AIDetectionResultsProps {
  results: AIDetectionResult[];
  stats: AIDetectionStats;
  originalText: string;
  metadata?: {
    textLength: number;
    wordCount: number;
    detectionMethod: string;
    timestamp: string;
    author: string;
  };
}

export const AIDetectionResults: React.FC<AIDetectionResultsProps> = ({
  results,
  stats,
  originalText,
  metadata
}) => {
  const renderHighlightedText = () => {
    let highlightedText = originalText;
    let offset = 0;

    // Sort results by start index to process in order
    const sortedResults = [...results].sort((a, b) => a.startIndex - b.startIndex);

    sortedResults.forEach((result) => {
      if (result.isAI) {
        const startTag = `<span class="bg-red-200 border-l-4 border-red-500 px-1 rounded" title="AI Generated (${(result.confidence * 100).toFixed(0)}% confidence): ${result.reasons.join(', ')}">`;
        const endTag = '</span>';
        
        const adjustedStart = result.startIndex + offset;
        const adjustedEnd = result.endIndex + offset;
        
        highlightedText = 
          highlightedText.slice(0, adjustedStart) +
          startTag +
          highlightedText.slice(adjustedStart, adjustedEnd) +
          endTag +
          highlightedText.slice(adjustedEnd);
        
        offset += startTag.length + endTag.length;
      }
    });

    return highlightedText;
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    const margin = 20;
    let yPosition = margin;

    // Title
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('AI Detection Report', pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 20;

    // Metadata
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, margin, yPosition);
    yPosition += 8;
    if (metadata) {
      doc.text(`Detection Method: ${metadata.detectionMethod}`, margin, yPosition);
      yPosition += 8;
      doc.text(`Author: ${metadata.author}`, margin, yPosition);
      yPosition += 15;
    }

    // Summary
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('Summary', margin, yPosition);
    yPosition += 10;

    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    const summaryText = [
      `AI Generated: ${stats.aiPercentage.toFixed(1)}%`,
      `Human Written: ${stats.humanPercentage.toFixed(1)}%`,
      `Total Sentences: ${stats.totalSentences}`,
      `AI Sentences: ${stats.aiSentences}`,
      `Human Sentences: ${stats.humanSentences}`
    ];

    summaryText.forEach(text => {
      doc.text(text, margin, yPosition);
      yPosition += 8;
    });

    yPosition += 10;

    // Detailed Results
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('Detailed Analysis', margin, yPosition);
    yPosition += 10;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');

    results.forEach((result, index) => {
      if (yPosition > doc.internal.pageSize.height - 40) {
        doc.addPage();
        yPosition = margin;
      }

      // Result header
      doc.setFont('helvetica', 'bold');
      const status = result.isAI ? 'AI GENERATED' : 'HUMAN WRITTEN';
      const confidence = `(${(result.confidence * 100).toFixed(0)}% confidence)`;
      doc.text(`${index + 1}. ${status} ${confidence}`, margin, yPosition);
      yPosition += 6;

      // Text content
      doc.setFont('helvetica', 'normal');
      const textLines = doc.splitTextToSize(result.text, pageWidth - 2 * margin);
      doc.text(textLines, margin, yPosition);
      yPosition += textLines.length * 4 + 4;

      // Reasons
      if (result.reasons.length > 0) {
        doc.setFont('helvetica', 'bold');
        doc.text('Detection Details:', margin, yPosition);
        yPosition += 4;
        
        doc.setFont('helvetica', 'normal');
        result.reasons.forEach(reason => {
          const reasonLines = doc.splitTextToSize(`• ${reason}`, pageWidth - 2 * margin - 10);
          doc.text(reasonLines, margin + 5, yPosition);
          yPosition += reasonLines.length * 4;
        });
        yPosition += 4;
      }

      yPosition += 6;
    });

    doc.save('ai-detection-report.pdf');
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">AI Generated</p>
              <p className="text-2xl font-bold text-red-600">
                {stats.aiPercentage.toFixed(1)}%
              </p>
            </div>
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
              <Brain className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Human Written</p>
              <p className="text-2xl font-bold text-green-600">
                {stats.humanPercentage.toFixed(1)}%
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Sentences</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats.totalSentences}
              </p>
            </div>
            <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-gray-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Detection Method Info */}
      {metadata && (
        <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
          <div className="flex items-center space-x-2 mb-2">
            <Brain className="w-5 h-5 text-blue-600" />
            <span className="font-semibold text-blue-900">Detection Method</span>
          </div>
          <p className="text-blue-800 text-sm">
            <strong>{metadata.detectionMethod}</strong> • 
            Analyzed {metadata.wordCount} words in {metadata.textLength} characters • 
            By {metadata.author} • {new Date(metadata.timestamp).toLocaleString()}
          </p>
        </div>
      )}

      {/* Highlighted Text */}
      <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
            <Brain className="w-5 h-5 text-red-600" />
            <span>AI Detection Results</span>
          </h3>
          <button
            onClick={exportToPDF}
            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2"
          >
            <Download className="w-4 h-4" />
            <span>Export PDF</span>
          </button>
        </div>
        <div className="bg-gray-50 rounded-lg p-4 max-h-96 overflow-y-auto">
          <div 
            className="text-gray-800 leading-relaxed whitespace-pre-wrap"
            dangerouslySetInnerHTML={{ __html: renderHighlightedText() }}
          />
        </div>
        <div className="mt-4 flex items-center space-x-4 text-sm text-gray-600">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-red-200 border-l-2 border-red-500 rounded"></div>
            <span>AI Generated Content</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-gray-100 rounded"></div>
            <span>Human Written Content</span>
          </div>
        </div>
      </div>

      {/* Detailed Results */}
      <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Detailed Analysis</h3>
        <div className="space-y-4 max-h-96 overflow-y-auto">
          {results.map((result, index) => (
            <div
              key={index}
              className={`p-4 rounded-lg border-l-4 ${
                result.isAI
                  ? 'border-red-500 bg-red-50'
                  : 'border-green-500 bg-green-50'
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center space-x-2">
                  {result.isAI ? (
                    <Brain className="w-4 h-4 text-red-600" />
                  ) : (
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  )}
                  <span className="text-sm font-medium">
                    {result.isAI ? 'AI Generated' : 'Human Written'}
                  </span>
                  <span className="bg-gray-200 text-gray-700 text-xs px-2 py-1 rounded-full">
                    {(result.confidence * 100).toFixed(0)}% confidence
                  </span>
                </div>
              </div>
              <p className="text-gray-800 mb-2">{result.text}</p>
              {result.reasons.length > 0 && (
                <div className="text-sm text-gray-600">
                  <strong>Detection details:</strong>
                  <ul className="list-disc list-inside ml-2">
                    {result.reasons.map((reason, idx) => (
                      <li key={idx}>{reason}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Backend Info */}
      <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <ExternalLink className="w-4 h-4" />
          <span>Powered by Python ModernBERT Backend • Real-time AI Detection • High Accuracy Analysis</span>
        </div>
      </div>
    </div>
  );
};