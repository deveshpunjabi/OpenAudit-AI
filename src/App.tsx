import React, { useState, useEffect } from 'react';
import { TextInput } from './components/TextInput';
import { AIDetectionResults } from './components/AIDetectionResults';
import { PlagiarismResults } from './components/PlagiarismResults';
import { DeepResearchResults } from './components/DeepResearchResults';
import { ProgressTracker } from './components/ProgressTracker';
import { AIDetectionAPI, AIDetectionResult, AIDetectionStats } from './utils/aiDetectionAPI';
import { EnhancedGeminiDetector } from './utils/enhancedGeminiDetector';
import { DocumentParser } from './utils/documentParser';
import { StatsCalculator } from './utils/statsCalculator';
import { useProgressTracker } from './hooks/useProgressTracker';
import { PlagiarismResult, DetectionStats } from './types';
import { Paperclip, Bot, Search, Target, Zap, CheckCircle, AlertCircle, Wifi, WifiOff } from 'lucide-react';

function App() {
  const [selectedTool, setSelectedTool] = useState<'home' | 'ai' | 'plagiarism'>('home');
  const [isProcessing, setIsProcessing] = useState(false);
  const [backendStatus, setBackendStatus] = useState<{ connected: boolean; message: string; details?: any }>({
    connected: false,
    message: 'Checking backend connection...'
  });
  
  // AI Detection State
  const [aiResults, setAiResults] = useState<AIDetectionResult[]>([]);
  const [aiStats, setAiStats] = useState<AIDetectionStats | null>(null);
  const [aiText, setAiText] = useState('');
  const [aiMetadata, setAiMetadata] = useState<any>(null);
  
  // Plagiarism Detection State
  const [plagiarismResults, setPlagiarismResults] = useState<PlagiarismResult[]>([]);
  const [plagiarismStats, setPlagiarismStats] = useState<DetectionStats | null>(null);
  const [plagiarismText, setPlagiarismText] = useState('');
  const [deepResearchResults, setDeepResearchResults] = useState<any>(null);

  // Progress tracking
  const {
    isVisible: progressVisible,
    currentStep,
    steps,
    overallProgress,
    estimatedTimeRemaining,
    initializeProgress,
    updateStepProgress,
    completeStep,
    setStepError,
    hideProgress
  } = useProgressTracker();

  // Check backend status on component mount
  useEffect(() => {
    const checkBackend = async () => {
      try {
        const status = await AIDetectionAPI.testConnection();
        setBackendStatus(status);
        
        if (status.connected) {
          console.log('✅ Python backend connected successfully');
        } else {
          console.warn('⚠️ Python backend not available:', status.message);
        }
      } catch (error) {
        console.error('❌ Backend connection check failed:', error);
        setBackendStatus({
          connected: false,
          message: 'Backend connection failed'
        });
      }
    };

    checkBackend();
    
    // Check backend status every 30 seconds
    const interval = setInterval(checkBackend, 30000);
    return () => clearInterval(interval);
  }, []);

  // Initialize Gemini API for plagiarism detection
useEffect(() => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey || apiKey === 'your_gemini_api_key_here') {
    console.warn('⚠️ Gemini API key is missing or not set');
    return;
  }

  EnhancedGeminiDetector.initialize(apiKey);
  console.log('✅ Gemini detector initialized');
}, []);

  const handleAITextAnalysis = async (text: string) => {
    if (!backendStatus.connected) {
      alert('Python backend is not available. Please start the backend server first.');
      return;
    }

    setIsProcessing(true);
    
    // Initialize progress tracking for AI detection
    initializeProgress([
      { id: 'parsing', label: 'Parsing Text', details: 'Preparing text for analysis' },
      { id: 'analysis', label: 'AI Detection Analysis', details: 'ModernBERT ensemble analysis' },
      { id: 'finalizing', label: 'Finalizing Results', details: 'Compiling detection results' }
    ], text);

    try {
      updateStepProgress('parsing', 20, 'Preparing text for AI detection...');
      
      const sentences = text.split(/[.!?]+/).map(s => s.trim()).filter(s => s.length > 10);
      updateStepProgress('parsing', 50, `Found ${sentences.length} sentences`);
      
      completeStep('parsing');
      
      updateStepProgress('analysis', 10, 'Connecting to Python backend...');
      
      // Use Python backend for AI detection
      const response = await AIDetectionAPI.analyzeText(text);
      
      updateStepProgress('analysis', 80, 'Processing detection results...');
      
      setAiResults(response.results);
      setAiStats(response.stats);
      setAiText(text);
      setAiMetadata(response.metadata);
      
      completeStep('analysis');
      
      updateStepProgress('finalizing', 50, 'Compiling final results...');
      
      completeStep('finalizing');
      
      setTimeout(() => {
        hideProgress();
      }, 1000);
      
    } catch (error) {
      console.error('AI analysis failed:', error);
      setStepError('analysis', `Analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setTimeout(() => {
        hideProgress();
      }, 3000);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAIFileAnalysis = async (file: File) => {
    if (!backendStatus.connected) {
      alert('Python backend is not available. Please start the backend server first.');
      return;
    }

    setIsProcessing(true);
    
    initializeProgress([
      { id: 'parsing', label: 'Parsing Document', details: 'Extracting text from file' },
      { id: 'analysis', label: 'AI Detection Analysis', details: 'ModernBERT ensemble analysis' },
      { id: 'finalizing', label: 'Finalizing Results', details: 'Compiling detection results' }
    ]);

    try {
      updateStepProgress('parsing', 20, `Processing ${file.name}...`);
      
      const text = await DocumentParser.parseFile(file);
      
      updateStepProgress('parsing', 80, 'Text extraction complete');
      completeStep('parsing');
      
      updateStepProgress('analysis', 10, 'Connecting to Python backend...');
      
      const response = await AIDetectionAPI.analyzeText(text);
      
      updateStepProgress('analysis', 80, 'Processing detection results...');
      
      setAiResults(response.results);
      setAiStats(response.stats);
      setAiText(text);
      setAiMetadata(response.metadata);
      
      completeStep('analysis');
      
      updateStepProgress('finalizing', 50, 'Compiling final results...');
      
      completeStep('finalizing');
      
      setTimeout(() => {
        hideProgress();
      }, 1000);
      
    } catch (error) {
      console.error('AI file analysis failed:', error);
      setStepError('parsing', `File analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setTimeout(() => {
        hideProgress();
      }, 3000);
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePlagiarismTextAnalysis = async (text: string) => {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (!apiKey || apiKey === 'your_gemini_api_key_here') {
      alert('API configuration required. Please contact administrator.');
      return;
    }

    setIsProcessing(true);
    
    initializeProgress([
      { id: 'parsing', label: 'Parsing Text', details: 'Preparing text for analysis' },
      { id: 'analysis', label: 'Plagiarism Detection', details: 'Source analysis in progress' },
      { id: 'research', label: 'Deep Research', details: 'Comprehensive source investigation' },
      { id: 'finalizing', label: 'Finalizing Results', details: 'Compiling comprehensive report' }
    ], text);

    try {
      // Run plagiarism detection with progress tracking
      const results = await EnhancedGeminiDetector.detectPlagiarismWithProgress(
        text,
        (step, progress, details) => {
          updateStepProgress(step, progress, details);
          if (progress >= 100) {
            completeStep(step);
          }
        }
      );
      
      // Run deep research with progress tracking
      const deepResearch = await EnhancedGeminiDetector.performDeepResearchWithProgress(
        text,
        (step, progress, details) => {
          updateStepProgress(step, progress, details);
          if (progress >= 100) {
            completeStep(step);
          }
        }
      );
      
      updateStepProgress('finalizing', 50, 'Calculating statistics...');
      
      const stats = StatsCalculator.calculateStats(text, [], results);
      
      updateStepProgress('finalizing', 80, 'Preparing final report...');
      
      setPlagiarismResults(results);
      setPlagiarismStats(stats);
      setPlagiarismText(text);
      setDeepResearchResults(deepResearch);
      
      completeStep('finalizing');
      
      setTimeout(() => {
        hideProgress();
      }, 1000);
      
    } catch (error) {
      console.error('Plagiarism analysis failed:', error);
      setStepError('analysis', 'Analysis failed. Please try again.');
      setTimeout(() => {
        hideProgress();
      }, 3000);
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePlagiarismFileAnalysis = async (file: File) => {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (!apiKey || apiKey === 'your_gemini_api_key_here') {
      alert('API configuration required. Please contact administrator.');
      return;
    }

    setIsProcessing(true);
    
    initializeProgress([
      { id: 'parsing', label: 'Parsing Document', details: 'Extracting text from file' },
      { id: 'analysis', label: 'Plagiarism Detection', details: 'Source analysis in progress' },
      { id: 'research', label: 'Deep Research', details: 'Comprehensive source investigation' },
      { id: 'finalizing', label: 'Finalizing Results', details: 'Compiling comprehensive report' }
    ]);

    try {
      updateStepProgress('parsing', 20, `Processing ${file.name}...`);
      
      const text = await DocumentParser.parseFile(file);
      
      updateStepProgress('parsing', 80, 'Text extraction complete');
      completeStep('parsing');
      
      // Run plagiarism detection with progress tracking
      const results = await EnhancedGeminiDetector.detectPlagiarismWithProgress(
        text,
        (step, progress, details) => {
          updateStepProgress(step, progress, details);
          if (progress >= 100) {
            completeStep(step);
          }
        }
      );
      
      // Run deep research with progress tracking
      const deepResearch = await EnhancedGeminiDetector.performDeepResearchWithProgress(
        text,
        (step, progress, details) => {
          updateStepProgress(step, progress, details);
          if (progress >= 100) {
            completeStep(step);
          }
        }
      );
      
      updateStepProgress('finalizing', 50, 'Calculating statistics...');
      
      const stats = StatsCalculator.calculateStats(text, [], results);
      
      updateStepProgress('finalizing', 80, 'Preparing final report...');
      
      setPlagiarismResults(results);
      setPlagiarismStats(stats);
      setPlagiarismText(text);
      setDeepResearchResults(deepResearch);
      
      completeStep('finalizing');
      
      setTimeout(() => {
        hideProgress();
      }, 1000);
      
    } catch (error) {
      console.error('Plagiarism file analysis failed:', error);
      setStepError('parsing', 'File analysis failed. Please try again.');
      setTimeout(() => {
        hideProgress();
      }, 3000);
    } finally {
      setIsProcessing(false);
    }
  };

  const renderHomePage = () => (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-purple-700 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
                <Paperclip className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-xl font-bold">OpenAudit AI</h1>
            </div>
            {/* Backend Status Indicator */}
            <div className="flex items-center space-x-2 text-sm">
              {backendStatus.connected ? (
                <>
                  <Wifi className="w-4 h-4 text-green-400" />
                  <span>Backend Connected</span>
                </>
              ) : (
                <>
                  <WifiOff className="w-4 h-4 text-red-400" />
                  <span>Backend Offline</span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">OpenAudit AI Tools</h1>
          <p className="text-xl text-gray-600">Choose a tool to start your analysis.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* AI Content Detector */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8 text-center hover:shadow-xl transition-shadow">
            <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Bot className="w-8 h-8 text-purple-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-4">AI Content Detector</h3>
            <p className="text-gray-600 mb-6 leading-relaxed">
              Analyze text to determine if it was generated by an AI model using advanced ModernBERT ensemble.
            </p>
            
            {/* Backend Status */}
            <div className="mb-6 p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-center space-x-2 text-sm">
                {backendStatus.connected ? (
                  <>
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span className="text-green-700">Python Backend Ready</span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-4 h-4 text-red-500" />
                    <span className="text-red-700">Backend Offline</span>
                  </>
                )}
              </div>
              {!backendStatus.connected && (
                <p className="text-xs text-gray-600 mt-1">
                  Start the Python backend: <code>cd backend && python app.py</code>
                </p>
              )}
            </div>
            
            <button
              onClick={() => setSelectedTool('ai')}
              disabled={!backendStatus.connected}
              className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white py-3 px-6 rounded-xl font-semibold transition-colors"
            >
              {backendStatus.connected ? 'Use AI Detector' : 'Backend Required'}
            </button>
          </div>

          {/* Plagiarism Checker */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8 text-center hover:shadow-xl transition-shadow">
            <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Search className="w-8 h-8 text-purple-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Plagiarism Checker</h3>
            <p className="text-gray-600 mb-8 leading-relaxed">
              Check for potential plagiarism against web sources using advanced AI research.
            </p>
            <button
              onClick={() => setSelectedTool('plagiarism')}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 px-6 rounded-xl font-semibold transition-colors"
            >
              Use Plagiarism Checker
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderToolPage = () => (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
      {/* Progress Tracker Overlay */}
      <ProgressTracker
        isVisible={progressVisible}
        currentStep={currentStep}
        steps={steps}
        overallProgress={overallProgress}
        estimatedTimeRemaining={estimatedTimeRemaining}
      />

      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-purple-700 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setSelectedTool('home')}
                className="w-8 h-8 bg-white bg-opacity-20 rounded-lg flex items-center justify-center hover:bg-opacity-30 transition-colors"
              >
                <Paperclip className="w-5 h-5 text-white" />
              </button>
              <h1 className="text-xl font-bold">OpenAudit AI</h1>
            </div>
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-2 text-sm text-white">
                <Target className="w-4 h-4" />
                <span>95%+ Accuracy</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-white">
                <Zap className="w-4 h-4" />
                <span>Live Progress</span>
              </div>
              {selectedTool === 'ai' && (
                <div className="flex items-center space-x-2 text-sm text-white">
                  {backendStatus.connected ? (
                    <CheckCircle className="w-4 h-4 text-green-400" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-red-400" />
                  )}
                  <span>Python Backend {backendStatus.connected ? 'Ready' : 'Offline'}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
          <div className="flex">
            <button
              onClick={() => setSelectedTool('ai')}
              className={`flex-1 flex items-center justify-center space-x-3 py-4 px-6 font-semibold transition-all ${
                selectedTool === 'ai'
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Bot className="w-5 h-5" />
              <span>AI Content Detector</span>
              {selectedTool === 'ai' && backendStatus.connected && (
                <CheckCircle className="w-4 h-4 text-green-300" />
              )}
            </button>
            <button
              onClick={() => setSelectedTool('plagiarism')}
              className={`flex-1 flex items-center justify-center space-x-3 py-4 px-6 font-semibold transition-all ${
                selectedTool === 'plagiarism'
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Search className="w-5 h-5" />
              <span>Plagiarism Checker</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        <div className="space-y-8">
          {selectedTool === 'ai' && (
            <>
              <TextInput
                onTextSubmit={handleAITextAnalysis}
                onFileSubmit={handleAIFileAnalysis}
                isProcessing={isProcessing}
                placeholder="Enter text to check for AI-generated content..."
                title="AI Content Detection"
              />
              
              {aiResults.length > 0 && aiStats && (
                <AIDetectionResults
                  results={aiResults}
                  stats={aiStats}
                  originalText={aiText}
                  metadata={aiMetadata}
                />
              )}
            </>
          )}

          {selectedTool === 'plagiarism' && (
            <>
              <TextInput
                onTextSubmit={handlePlagiarismTextAnalysis}
                onFileSubmit={handlePlagiarismFileAnalysis}
                isProcessing={isProcessing}
                placeholder="Enter text to check for plagiarism..."
                title="Plagiarism Detection"
              />
              
              {deepResearchResults && (
                <DeepResearchResults analysis={deepResearchResults} />
              )}
              
              {plagiarismResults.length > 0 && plagiarismStats && (
                <PlagiarismResults
                  results={plagiarismResults}
                  stats={plagiarismStats}
                  originalText={plagiarismText}
                />
              )}
            </>
          )}

          {/* Features Section */}
          {((selectedTool === 'ai' && aiResults.length === 0) || 
            (selectedTool === 'plagiarism' && plagiarismResults.length === 0)) && (
            <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
                {selectedTool === 'ai' ? 'AI Content Detection Features' : 'Plagiarism Detection Features'}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {selectedTool === 'ai' ? (
                  <>
                    <div className="text-center">
                      <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Bot className="w-8 h-8 text-purple-600" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">ModernBERT Ensemble</h3>
                      <p className="text-gray-600">
                        Uses 3 fine-tuned ModernBERT models in ensemble for 95%+ accuracy across 40+ AI models including GPT, Claude, Llama.
                      </p>
                    </div>
                    <div className="text-center">
                      <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Target className="w-8 h-8 text-purple-600" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">Model Identification</h3>
                      <p className="text-gray-600">
                        Identifies the specific AI model used (GPT-4, Claude, Llama, etc.) with confidence scores and detailed reasoning.
                      </p>
                    </div>
                    <div className="text-center">
                      <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Zap className="w-8 h-8 text-purple-600" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">Python Backend</h3>
                      <p className="text-gray-600">
                        Powered by Python backend with real ModernBERT models for production-grade AI detection accuracy.
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="text-center">
                      <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Search className="w-8 h-8 text-purple-600" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">Advanced Source Detection</h3>
                      <p className="text-gray-600">
                        Leverages advanced AI for deep research and comprehensive source identification with live progress tracking.
                      </p>
                    </div>
                    <div className="text-center">
                      <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Target className="w-8 h-8 text-purple-600" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">Deep Research Analysis</h3>
                      <p className="text-gray-600">
                        Performs comprehensive research to identify potential sources with real-time progress updates and detailed analysis stages.
                      </p>
                    </div>
                    <div className="text-center">
                      <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Zap className="w-8 h-8 text-purple-600" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">PDF Export</h3>
                      <p className="text-gray-600">
                        Export detailed plagiarism reports as PDF with source links, similarity scores, and comprehensive analysis.
                      </p>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return selectedTool === 'home' ? renderHomePage() : renderToolPage();
}

export default App;