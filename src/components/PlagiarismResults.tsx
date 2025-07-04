import React from 'react';
import { PlagiarismResult, DetectionStats } from '../types';
import { Search, ExternalLink, AlertTriangle, CheckCircle, Download } from 'lucide-react';
import jsPDF from 'jspdf';

interface PlagiarismResultsProps {
  results: PlagiarismResult[];
  stats: DetectionStats;
  originalText: string;
}

export const PlagiarismResults: React.FC<PlagiarismResultsProps> = ({
  results,
  stats,
  originalText
}) => {
  const renderHighlightedText = () => {
    let highlightedText = originalText;
    let offset = 0;

    // Sort results by start index to process in order
    const sortedResults = [...results].sort((a, b) => a.startIndex - b.startIndex);

    sortedResults.forEach((result) => {
      if (result.isPlagiarized) {
        const sources = result.sources.slice(0, 2); // Show top 2 sources
        const sourceInfo = sources.map(s => `${s.domain} (${(s.similarity * 100).toFixed(0)}%)`).join(', ');
        
        const startTag = `<span class="bg-red-200 border-l-4 border-red-500 px-1 rounded" title="Plagiarized (${(result.confidence * 100).toFixed(0)}% confidence): Found in ${sourceInfo}">`;
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
    doc.text('Plagiarism Detection Report', pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 20;

    // Date
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, margin, yPosition);
    yPosition += 15;

    // Summary
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('Summary', margin, yPosition);
    yPosition += 10;

    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    const summaryText = [
      `Plagiarized Content: ${stats.plagiarismPercentage.toFixed(1)}%`,
      `Original Content: ${(100 - stats.plagiarismPercentage).toFixed(1)}%`,
      `Total Words: ${stats.totalWords.toLocaleString()}`,
      `Sources Found: ${results.reduce((acc, r) => acc + r.sources.length, 0)}`
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
      const status = result.isPlagiarized ? 'PLAGIARIZED' : 'ORIGINAL';
      const confidence = `(${(result.confidence * 100).toFixed(0)}% confidence)`;
      doc.text(`${index + 1}. ${status} ${confidence}`, margin, yPosition);
      yPosition += 6;

      // Text content
      doc.setFont('helvetica', 'normal');
      const textLines = doc.splitTextToSize(result.text, pageWidth - 2 * margin);
      doc.text(textLines, margin, yPosition);
      yPosition += textLines.length * 4 + 4;

      // Sources
      if (result.sources && result.sources.length > 0) {
        doc.setFont('helvetica', 'bold');
        doc.text('Sources:', margin, yPosition);
        yPosition += 4;
        
        doc.setFont('helvetica', 'normal');
        result.sources.forEach(source => {
          const sourceText = `• ${source.title} - ${source.domain} (${(source.similarity * 100).toFixed(0)}% match)`;
          const sourceLines = doc.splitTextToSize(sourceText, pageWidth - 2 * margin - 10);
          doc.text(sourceLines, margin + 5, yPosition);
          yPosition += sourceLines.length * 4;
        });
        yPosition += 4;
      }

      yPosition += 6;
    });

    doc.save('plagiarism-report.pdf');
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Plagiarized</p>
              <p className="text-2xl font-bold text-red-600">
                {stats.plagiarismPercentage.toFixed(1)}%
              </p>
            </div>
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Original</p>
              <p className="text-2xl font-bold text-green-600">
                {(100 - stats.plagiarismPercentage).toFixed(1)}%
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
              <p className="text-sm font-medium text-gray-600">Sources Found</p>
              <p className="text-2xl font-bold text-gray-900">
                {results.reduce((acc, r) => acc + r.sources.length, 0)}
              </p>
            </div>
            <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
              <Search className="w-6 h-6 text-gray-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Highlighted Text */}
      <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
            <Search className="w-5 h-5 text-red-600" />
            <span>Plagiarism Detection Results</span>
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
            <span>Plagiarized Content</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-gray-100 rounded"></div>
            <span>Original Content</span>
          </div>
        </div>
      </div>

      {/* Detailed Results */}
      <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Detailed Analysis</h3>
          <button
            onClick={exportToPDF}
            className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center space-x-1"
          >
            <Download className="w-3 h-3" />
            <span>PDF</span>
          </button>
        </div>
        <div className="space-y-4 max-h-96 overflow-y-auto">
          {results.map((result, index) => (
            <div
              key={index}
              className={`p-4 rounded-lg border-l-4 ${
                result.isPlagiarized
                  ? 'border-red-500 bg-red-50'
                  : 'border-green-500 bg-green-50'
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center space-x-2">
                  {result.isPlagiarized ? (
                    <AlertTriangle className="w-4 h-4 text-red-600" />
                  ) : (
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  )}
                  <span className="text-sm font-medium">
                    {result.isPlagiarized ? 'Plagiarized' : 'Original'}
                  </span>
                  <span className="bg-gray-200 text-gray-700 text-xs px-2 py-1 rounded-full">
                    {(result.confidence * 100).toFixed(0)}% confidence
                  </span>
                </div>
              </div>
              <p className="text-gray-800 mb-2">{result.text}</p>
              {result.sources.length > 0 && (
                <div className="text-sm text-gray-600">
                  <strong>Sources found:</strong>
                  <div className="mt-2 space-y-2">
                    {result.sources.map((source, idx) => (
                      <div key={idx} className="bg-white p-3 rounded border">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="font-medium text-gray-900">{source.title}</p>
                            <p className="text-sm text-gray-600">{source.domain}</p>
                            <p className="text-xs text-gray-500 mt-1">
                              {(source.similarity * 100).toFixed(0)}% similarity match
                            </p>
                          </div>
                          <a
                            href={source.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="ml-2 p-1 text-blue-600 hover:text-blue-800 transition-colors"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};