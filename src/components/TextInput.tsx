import React, { useState } from 'react';
import { Type, Upload, X } from 'lucide-react';

interface TextInputProps {
  onTextSubmit: (text: string) => void;
  onFileSubmit: (file: File) => void;
  isProcessing: boolean;
  placeholder: string;
  title: string;
}

export const TextInput: React.FC<TextInputProps> = ({
  onTextSubmit,
  onFileSubmit,
  isProcessing,
  placeholder,
  title
}) => {
  const [text, setText] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [inputMode, setInputMode] = useState<'text' | 'file'>('text');

  const handleTextSubmit = () => {
    if (text.trim()) {
      onTextSubmit(text);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleFileSubmit = () => {
    if (selectedFile) {
      onFileSubmit(selectedFile);
    }
  };

  const clearFile = () => {
    setSelectedFile(null);
    const input = document.getElementById('file-input') as HTMLInputElement;
    if (input) input.value = '';
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
      <div className="p-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-4">{title}</h3>
        
        {/* Mode Toggle */}
        <div className="flex bg-gray-100 rounded-lg p-1 mb-4">
          <button
            onClick={() => setInputMode('text')}
            className={`flex-1 flex items-center justify-center space-x-2 py-2 px-4 rounded-md transition-all ${
              inputMode === 'text'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            <Type className="w-4 h-4" />
            <span>Text Input</span>
          </button>
          <button
            onClick={() => setInputMode('file')}
            className={`flex-1 flex items-center justify-center space-x-2 py-2 px-4 rounded-md transition-all ${
              inputMode === 'file'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            <Upload className="w-4 h-4" />
            <span>File Upload</span>
          </button>
        </div>

        {/* Text Input Mode */}
        {inputMode === 'text' && (
          <div className="space-y-4">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={placeholder}
              className="w-full h-40 p-4 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={isProcessing}
            />
            <button
              onClick={handleTextSubmit}
              disabled={!text.trim() || isProcessing}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-500 text-white py-3 px-6 rounded-lg font-semibold transition-all duration-200 transform hover:scale-105 disabled:scale-100 disabled:cursor-not-allowed"
            >
              {isProcessing ? 'Analyzing...' : 'Analyze Text'}
            </button>
          </div>
        )}

        {/* File Upload Mode */}
        {inputMode === 'file' && (
          <div className="space-y-4">
            {!selectedFile ? (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors">
                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-2">Choose a file to upload</p>
                <p className="text-sm text-gray-500 mb-4">Supports PDF, DOCX, TXT files</p>
                <input
                  id="file-input"
                  type="file"
                  accept=".pdf,.docx,.txt"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <label
                  htmlFor="file-input"
                  className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium cursor-pointer transition-colors"
                >
                  Choose File
                </label>
              </div>
            ) : (
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Upload className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{selectedFile.name}</p>
                      <p className="text-sm text-gray-500">
                        {(selectedFile.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={clearFile}
                    className="w-8 h-8 bg-red-100 hover:bg-red-200 rounded-full flex items-center justify-center transition-colors"
                  >
                    <X className="w-4 h-4 text-red-600" />
                  </button>
                </div>
              </div>
            )}
            
            {selectedFile && (
              <button
                onClick={handleFileSubmit}
                disabled={isProcessing}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-500 text-white py-3 px-6 rounded-lg font-semibold transition-all duration-200 transform hover:scale-105 disabled:scale-100 disabled:cursor-not-allowed"
              >
                {isProcessing ? 'Analyzing...' : 'Analyze File'}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};