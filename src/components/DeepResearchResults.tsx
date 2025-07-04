import React from 'react';
import { Search, AlertTriangle, CheckCircle, Info, ExternalLink } from 'lucide-react';

interface DeepResearchResultsProps {
  analysis: {
    overallAssessment: string;
    riskLevel: 'low' | 'medium' | 'high';
    recommendations: string[];
    potentialSources: Array<{
      title: string;
      domain: string;
      url: string;
      similarity: number;
      matchedText: string;
    }>;
  };
}

export const DeepResearchResults: React.FC<DeepResearchResultsProps> = ({ analysis }) => {
  const getRiskColor = (level: string) => {
    switch (level) {
      case 'high': return 'text-red-600 bg-red-50 border-red-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low': return 'text-green-600 bg-green-50 border-green-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getRiskIcon = (level: string) => {
    switch (level) {
      case 'high': return <AlertTriangle className="w-5 h-5" />;
      case 'medium': return <Info className="w-5 h-5" />;
      case 'low': return <CheckCircle className="w-5 h-5" />;
      default: return <Info className="w-5 h-5" />;
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200 mb-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
        <Search className="w-5 h-5 text-purple-600" />
        <span>Deep Research Analysis</span>
      </h3>

      {/* Risk Level */}
      <div className={`p-4 rounded-lg border mb-6 ${getRiskColor(analysis.riskLevel)}`}>
        <div className="flex items-center space-x-2 mb-2">
          {getRiskIcon(analysis.riskLevel)}
          <span className="font-semibold capitalize">Risk Level: {analysis.riskLevel}</span>
        </div>
        <p className="text-sm">{analysis.overallAssessment}</p>
      </div>

      {/* Recommendations */}
      {analysis.recommendations.length > 0 && (
        <div className="mb-6">
          <h4 className="text-md font-semibold text-gray-900 mb-3">Recommendations</h4>
          <ul className="space-y-2">
            {analysis.recommendations.map((recommendation, index) => (
              <li key={index} className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                <span className="text-gray-700">{recommendation}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Potential Sources */}
      {analysis.potentialSources.length > 0 && (
        <div>
          <h4 className="text-md font-semibold text-gray-900 mb-3">Potential Sources Identified</h4>
          <div className="space-y-3">
            {analysis.potentialSources.map((source, index) => (
              <div key={index} className="bg-gray-50 p-4 rounded-lg border">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h5 className="font-medium text-gray-900">{source.title}</h5>
                    <p className="text-sm text-gray-600 mb-2">{source.domain}</p>
                    <p className="text-xs text-gray-500 mb-2">
                      Similarity: {(source.similarity * 100).toFixed(0)}%
                    </p>
                    {source.matchedText && (
                      <p className="text-sm text-gray-700 italic">
                        "{source.matchedText.substring(0, 100)}..."
                      </p>
                    )}
                  </div>
                  {source.url !== '#' && (
                    <a
                      href={source.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ml-2 p-1 text-blue-600 hover:text-blue-800 transition-colors"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};