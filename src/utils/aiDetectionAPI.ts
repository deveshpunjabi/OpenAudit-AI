/**
 * AI Detection API Client
 * Connects React frontend to Python backend for AI detection
 * Author: deveshpunjabi
 * Date: 2025-01-15 07:07:03 UTC
 */

export interface AIDetectionResult {
  text: string;
  isAI: boolean;
  confidence: number;
  startIndex: number;
  endIndex: number;
  reasons: string[];
}

export interface AIDetectionStats {
  totalSentences: number;
  aiSentences: number;
  humanSentences: number;
  aiPercentage: number;
  humanPercentage: number;
}

export interface AIAnalysisResponse {
  results: AIDetectionResult[];
  stats: AIDetectionStats;
  metadata: {
    textLength: number;
    wordCount: number;
    detectionMethod: string;
    timestamp: string;
    author: string;
  };
  status: string;
}

export interface SingleAnalysisResponse {
  isAI: boolean;
  confidence: number;
  humanProb: number;
  aiProb: number;
  mostLikelyModel: string;
  textLength: number;
  wordCount: number;
  detectionMethod: string;
  analysis: string;
  user: string;
  timestamp: string;
  status: string;
}

export class AIDetectionAPI {
  private static readonly BASE_URL = 'http://localhost:5000/api';
  
  /**
   * Check if the Python backend is available
   */
  static async checkBackendStatus(): Promise<boolean> {
    try {
      const response = await fetch(`${this.BASE_URL}/status`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        return data.status === 'running' && data.ai_detection?.available === true;
      }
      
      return false;
    } catch (error) {
      console.error('Backend status check failed:', error);
      return false;
    }
  }
  
  /**
   * Get model information from the backend
   */
  static async getModelInfo(): Promise<any> {
    try {
      const response = await fetch(`${this.BASE_URL}/model-info`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Failed to get model info:', error);
      throw new Error('Unable to connect to AI detection backend');
    }
  }
  
  /**
   * Analyze text for AI detection (sentence by sentence)
   */
  static async analyzeText(text: string): Promise<AIAnalysisResponse> {
    try {
      const response = await fetch(`${this.BASE_URL}/ai-detect/sentences`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data.status !== 'success') {
        throw new Error(data.error || 'Analysis failed');
      }
      
      return data;
    } catch (error) {
      console.error('AI detection analysis failed:', error);
      throw new Error(error instanceof Error ? error.message : 'AI detection analysis failed');
    }
  }
  
  /**
   * Analyze single text block (for overall analysis)
   */
  static async analyzeSingleText(text: string): Promise<SingleAnalysisResponse> {
    try {
      const response = await fetch(`${this.BASE_URL}/ai-detect`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data.status !== 'success') {
        throw new Error(data.error || 'Analysis failed');
      }
      
      return data;
    } catch (error) {
      console.error('Single text analysis failed:', error);
      throw new Error(error instanceof Error ? error.message : 'Single text analysis failed');
    }
  }
  
  /**
   * Test backend connectivity
   */
  static async testConnection(): Promise<{ connected: boolean; message: string; details?: any }> {
    try {
      const response = await fetch(`${this.BASE_URL}/status`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        return {
          connected: true,
          message: 'Backend connected successfully',
          details: data
        };
      } else {
        return {
          connected: false,
          message: `Backend responded with status ${response.status}`
        };
      }
    } catch (error) {
      return {
        connected: false,
        message: 'Unable to connect to Python backend. Please ensure the backend server is running on port 5000.'
      };
    }
  }
}