import React from 'react';
import { Loader2, Brain, Search } from 'lucide-react';

interface AnalysisProgressProps {
  isProcessing: boolean;
  progress?: number;
  stage?: string;
}

export const AnalysisProgress: React.FC<AnalysisProgressProps> = ({
  isProcessing,
  progress = 0,
  stage = 'Initializing...'
}) => {
  if (!isProcessing) return null;

  return (
    <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-200">
      <div className="text-center">
        <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <Loader2 className="w-8 h-8 text-white animate-spin" />
        </div>
        
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          Analyzing Document
        </h3>
        
        <p className="text-gray-600 mb-6">{stage}</p>
        
        <div className="space-y-4">
          <div className="flex items-center justify-center space-x-8">
            <div className="flex items-center space-x-2">
              <Brain className="w-5 h-5 text-blue-600" />
              <span className="text-sm font-medium text-gray-700">AI Detection</span>
            </div>
            <div className="flex items-center space-x-2">
              <Search className="w-5 h-5 text-purple-600" />
              <span className="text-sm font-medium text-gray-700">Plagiarism Check</span>
            </div>
          </div>
          
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          
          <p className="text-sm text-gray-500">{progress}% Complete</p>
        </div>
      </div>
    </div>
  );
};