import React from 'react';
import { Loader2, Bot, Search, FileText, CheckCircle, Clock } from 'lucide-react';

interface ProgressStep {
  id: string;
  label: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  progress: number;
  details?: string;
}

interface ProgressTrackerProps {
  isVisible: boolean;
  currentStep: string;
  steps: ProgressStep[];
  overallProgress: number;
  estimatedTimeRemaining?: number;
}

export const ProgressTracker: React.FC<ProgressTrackerProps> = ({
  isVisible,
  currentStep,
  steps,
  overallProgress,
  estimatedTimeRemaining
}) => {
  if (!isVisible) return null;

  const getStepIcon = (step: ProgressStep) => {
    switch (step.status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'processing':
        return <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />;
      case 'error':
        return <div className="w-5 h-5 bg-red-500 rounded-full" />;
      default:
        return <div className="w-5 h-5 bg-gray-300 rounded-full" />;
    }
  };

  const getStepColor = (step: ProgressStep) => {
    switch (step.status) {
      case 'completed':
        return 'border-green-200 bg-green-50';
      case 'processing':
        return 'border-blue-200 bg-blue-50';
      case 'error':
        return 'border-red-200 bg-red-50';
      default:
        return 'border-gray-200 bg-gray-50';
    }
  };

  const formatTime = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return remainingSeconds > 0 ? `${minutes}m ${remainingSeconds}s` : `${minutes}m`;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl p-8 max-w-md w-full mx-4">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4 relative">
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-500 to-purple-600 animate-pulse opacity-75"></div>
            <div className="absolute inset-2 rounded-full bg-gradient-to-r from-purple-400 to-purple-500 animate-ping opacity-50"></div>
            <Loader2 className="w-8 h-8 text-white animate-spin relative z-10" />
          </div>
          
          <h3 className="text-xl font-semibold text-gray-900 mb-2 relative">
            <span className="inline-block animate-pulse">Scanning Content</span>
            <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-16 h-0.5 bg-gradient-to-r from-purple-500 to-purple-600 animate-pulse"></div>
          </h3>
          
          {/* Overall Progress Bar */}
          <div className="w-full bg-gray-200 rounded-full h-3 mb-2 relative overflow-hidden">
            <div
              className="bg-gradient-to-r from-purple-500 to-purple-600 h-3 rounded-full transition-all duration-500 ease-out relative"
              style={{ width: `${overallProgress}%` }}
            >
              <div className="absolute inset-0 bg-white opacity-30 animate-pulse"></div>
            </div>
          </div>
          
          <div className="flex justify-between text-sm text-gray-600 mb-4">
            <span>{overallProgress.toFixed(0)}% Complete</span>
            {estimatedTimeRemaining && estimatedTimeRemaining > 0 && (
              <span className="flex items-center space-x-1 text-purple-600 font-medium">
                <Clock className="w-4 h-4" />
                <span>{formatTime(estimatedTimeRemaining)} remaining</span>
              </span>
            )}
          </div>
        </div>

        {/* Step Progress */}
        <div className="space-y-3">
          {steps.map((step, index) => (
            <div
              key={step.id}
              className={`p-3 rounded-lg border transition-all duration-300 ${getStepColor(step)}`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-3">
                  {getStepIcon(step)}
                  <span className="font-medium text-gray-900">{step.label}</span>
                </div>
                <span className="text-sm text-gray-600">
                  {step.progress.toFixed(0)}%
                </span>
              </div>
              
              {step.status === 'processing' && (
                <div className="w-full bg-gray-200 rounded-full h-2 relative overflow-hidden">
                  <div
                    className="bg-blue-500 h-2 rounded-full transition-all duration-300 relative"
                    style={{ width: `${step.progress}%` }}
                  >
                    <div className="absolute inset-0 bg-white opacity-30 animate-pulse"></div>
                  </div>
                </div>
              )}
              
              {step.details && (
                <p className="text-xs text-gray-600 mt-2">{step.details}</p>
              )}
            </div>
          ))}
        </div>

        {/* Current Activity */}
        <div className="mt-6 p-3 bg-purple-50 rounded-lg border border-purple-200">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-purple-600 rounded-full animate-pulse"></div>
            <span className="text-sm font-medium text-purple-900">
              Currently: {steps.find(s => s.id === currentStep)?.label || 'Processing...'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};