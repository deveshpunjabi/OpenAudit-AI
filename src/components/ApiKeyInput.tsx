import React, { useState } from 'react';
import { Key, Eye, EyeOff, CheckCircle, AlertCircle } from 'lucide-react';

interface ApiKeyInputProps {
  onApiKeySubmit: (apiKey: string) => void;
  isValid: boolean | null;
  isLoading: boolean;
}

export const ApiKeyInput: React.FC<ApiKeyInputProps> = ({
  onApiKeySubmit,
  isValid,
  isLoading
}) => {
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (apiKey.trim()) {
      onApiKeySubmit(apiKey.trim());
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200 mb-6">
      <div className="flex items-center space-x-3 mb-4">
        <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
          <Key className="w-5 h-5 text-purple-600" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Gemini API Configuration</h3>
          <p className="text-sm text-gray-600">Enter your Google Gemini API key for enhanced plagiarism detection</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="relative">
          <input
            type={showKey ? 'text' : 'password'}
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="Enter your Gemini API key (AIza...)"
            className="w-full p-3 pr-20 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            disabled={isLoading}
          />
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center space-x-2">
            <button
              type="button"
              onClick={() => setShowKey(!showKey)}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
            {isValid === true && (
              <CheckCircle className="w-4 h-4 text-green-500" />
            )}
            {isValid === false && (
              <AlertCircle className="w-4 h-4 text-red-500" />
            )}
          </div>
        </div>

        <button
          type="submit"
          disabled={!apiKey.trim() || isLoading}
          className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:from-gray-400 disabled:to-gray-500 text-white py-3 px-6 rounded-lg font-semibold transition-all duration-200 transform hover:scale-105 disabled:scale-100 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Validating...' : 'Configure API Key'}
        </button>
      </form>

      {isValid === false && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-700">
            Invalid API key. Please check your key and try again.
          </p>
        </div>
      )}

      <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h4 className="text-sm font-semibold text-blue-900 mb-2">How to get your API key:</h4>
        <ol className="text-sm text-blue-800 space-y-1">
          <li>1. Visit <a href="https://makersuite.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="underline">Google AI Studio</a></li>
          <li>2. Sign in with your Google account</li>
          <li>3. Click "Create API Key"</li>
          <li>4. Copy the generated key and paste it above</li>
        </ol>
      </div>
    </div>
  );
};