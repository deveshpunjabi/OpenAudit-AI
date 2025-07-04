import React from 'react';
import { PlagiarismResult, DetectionStats } from '../types';
import { Brain, Search, AlertCircle, CheckCircle, Download } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

interface AnalysisResultsProps {
  results: PlagiarismResult[];
  stats: DetectionStats;
  onExport: () => void;
}

const COLORS = {
  plagiarized: '#EF4444',
  original: '#8B5CF6'
};

export const AnalysisResults: React.FC<AnalysisResultsProps> = ({
  results,
  stats,
  onExport
}) => {
  const plagiarismData = [
    { name: 'Plagiarized', value: stats.plagiarismPercentage, color: COLORS.plagiarized },
    { name: 'Original', value: 100 - stats.plagiarismPercentage, color: COLORS.original }
  ];

  const confidenceData = results.map((result, index) => ({
    segment: index + 1,
    confidence: result.confidence * 100
  }));

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Words</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalWords}</p>
            </div>
            <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-gray-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Plagiarized</p>
              <p className="text-2xl font-bold text-red-600">
                {stats.plagiarismPercentage.toFixed(1)}%
              </p>
            </div>
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
              <Search className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Sources Found</p>
              <p className="text-2xl font-bold text-purple-600">
                {results.reduce((acc, r) => acc + r.sources.length, 0)}
              </p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Plagiarism Analysis</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={plagiarismData}
                cx="50%"
                cy="50%"
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
                label={({ name, value }) => `${name}: ${value.toFixed(1)}%`}
              >
                {plagiarismData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Confidence Scores</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={confidenceData.slice(0, 10)}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="segment" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="confidence" fill={COLORS.plagiarized} name="Confidence %" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Detailed Results */}
      <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Detailed Analysis</h3>
          <button
            onClick={onExport}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2"
          >
            <Download className="w-4 h-4" />
            <span>Export Report</span>
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
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="text-sm font-medium text-gray-600">
                      Segment {index + 1}
                    </span>
                    {result.isPlagiarized && (
                      <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full">
                        Plagiarized ({(result.confidence * 100).toFixed(0)}%)
                      </span>
                    )}
                  </div>
                  <p className="text-gray-800 mb-2">{result.text}</p>
                  {result.sources && result.sources.length > 0 && (
                    <div className="text-sm text-gray-600">
                      <strong>Sources:</strong>
                      {result.sources.map((source, idx) => (
                        <div key={idx} className="ml-2">
                          • {source.title} ({(source.similarity * 100).toFixed(0)}% match)
                          {source.url && source.url !== '#' && (
                            <a href={source.url} className="text-blue-600 hover:underline ml-1">
                              [Link]
                            </a>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};