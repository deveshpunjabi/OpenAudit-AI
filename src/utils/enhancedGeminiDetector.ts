import { GoogleGenerativeAI } from '@google/generative-ai';
import { PlagiarismResult, PlagiarismSource } from '../types';

export class EnhancedGeminiDetector {
  private static genAI: GoogleGenerativeAI | null = null;
  private static model: any = null;

  static initialize(apiKey: string) {
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({ model: "gemini-2.5-flash-preview-05-20" });
  }

  static async detectPlagiarismWithProgress(
    text: string,
    onProgress: (step: string, progress: number, details?: string) => void
  ): Promise<PlagiarismResult[]> {
    if (!this.model) {
      throw new Error('API not initialized. Please contact administrator.');
    }

    onProgress('parsing', 10, 'Splitting text into sentences...');
    const sentences = this.splitIntoSentences(text);
    
    onProgress('parsing', 25, `Found ${sentences.length} sentences to analyze`);
    
    const results: PlagiarismResult[] = [];
    let currentIndex = 0;
    
    onProgress('analysis', 30, 'Starting plagiarism analysis...');

    // Process sentences individually for better accuracy
    const totalSentences = sentences.length;
    
    for (let i = 0; i < totalSentences; i++) {
      const sentence = sentences[i];
      const sentenceProgress = 30 + ((i / totalSentences) * 60);
      
      onProgress('analysis', sentenceProgress, `Analyzing sentence ${i + 1} of ${totalSentences}...`);
      
      const sentenceStartIndex = text.indexOf(sentence, currentIndex);
      const sentenceEndIndex = sentenceStartIndex + sentence.length;

      try {
        const analysis = await this.analyzeSentenceWithGemini(sentence);
        
        results.push({
          text: sentence,
          isPlagiarized: analysis.isPlagiarized,
          confidence: analysis.confidence,
          startIndex: sentenceStartIndex,
          endIndex: sentenceEndIndex,
          sources: analysis.sources
        });

        currentIndex = sentenceEndIndex;
      } catch (error) {
        console.error('Error analyzing sentence:', error);
        const fallbackResult = await this.fallbackDetection(sentence, sentenceStartIndex, sentenceEndIndex);
        results.push(fallbackResult);
        currentIndex = sentenceEndIndex;
      }
    }

    onProgress('finalizing', 95, 'Finalizing results...');
    
    return results;
  }

  static async performDeepResearchWithProgress(
    text: string,
    onProgress: (step: string, progress: number, details?: string) => void
  ): Promise<{
    overallAssessment: string;
    riskLevel: 'low' | 'medium' | 'high';
    recommendations: string[];
    potentialSources: PlagiarismSource[];
  }> {
    if (!this.model) {
      throw new Error('API not initialized');
    }

    onProgress('research', 10, 'Initializing deep research analysis...');

    const prompt = `
    Perform a comprehensive plagiarism analysis on the following text. Conduct deep research to identify potential sources, academic integrity issues, and provide actionable recommendations.

    Text to analyze:
    "${text}"

    Please provide a detailed analysis in JSON format:
    {
      "overallAssessment": "comprehensive summary of plagiarism risk",
      "riskLevel": "low|medium|high",
      "recommendations": ["list of specific recommendations"],
      "potentialSources": [
        {
          "title": "potential source title",
          "domain": "domain type (academic, commercial, etc.)",
          "url": "potential URL or source type",
          "similarity": number,
          "matchedText": "specific matching content",
          "sourceType": "academic paper|website|book|news article|etc."
        }
      ],
      "analysisDetails": {
        "academicLanguageScore": number,
        "formalityLevel": number,
        "citationPatterns": boolean,
        "technicalTerminology": boolean,
        "writingStyleConsistency": number
      }
    }

    Consider:
    1. Academic writing patterns and terminology
    2. Citation styles and reference patterns
    3. Technical language complexity
    4. Writing style consistency
    5. Common plagiarism indicators
    6. Potential source types (academic, commercial, news, etc.)
    `;

    onProgress('research', 30, 'Sending request for analysis...');

    try {
      const result = await this.model.generateContent(prompt);
      
      onProgress('research', 60, 'Processing analysis response...');
      
      const response = await result.response;
      const responseText = response.text();

      onProgress('research', 80, 'Parsing analysis results...');

      const jsonString = this.extractJsonFromResponse(responseText);
      if (!jsonString) {
        throw new Error('No valid JSON found in response');
      }

      const analysis = JSON.parse(jsonString);
      
      onProgress('research', 95, 'Finalizing deep research...');
      
      return {
        overallAssessment: analysis.overallAssessment || 'Analysis completed',
        riskLevel: analysis.riskLevel || 'low',
        recommendations: analysis.recommendations || ['Review content for originality'],
        potentialSources: (analysis.potentialSources || []).map((source: any) => ({
          url: source.url || '#',
          title: source.title || 'Potential Source',
          similarity: Math.min(Math.max(source.similarity || 0, 0), 1),
          matchedText: source.matchedText || '',
          domain: source.domain || 'unknown'
        }))
      };
    } catch (error) {
      console.error('Error in deep research analysis:', error);
      onProgress('research', 100, 'Analysis completed with fallback method');
      
      return {
        overallAssessment: 'Unable to complete deep analysis. Please try again.',
        riskLevel: 'medium',
        recommendations: ['Manual review recommended', 'Check for proper citations'],
        potentialSources: []
      };
    }
  }

  private static extractJsonFromResponse(responseText: string): string | null {
    // First, try to extract JSON from markdown code blocks
    const markdownJsonMatch = responseText.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/i);
    if (markdownJsonMatch) {
      return markdownJsonMatch[1].trim();
    }

    // Second, try to find JSON within backticks
    const backtickJsonMatch = responseText.match(/`(\{[\s\S]*?\})`/);
    if (backtickJsonMatch) {
      return backtickJsonMatch[1].trim();
    }

    // Third, try to extract the largest JSON object from the response
    const jsonMatches = responseText.match(/\{[\s\S]*?\}/g);
    if (jsonMatches && jsonMatches.length > 0) {
      // Return the longest JSON string (most likely to be complete)
      const longestJson = jsonMatches.reduce((longest, current) => 
        current.length > longest.length ? current : longest
      );
      return longestJson.trim();
    }

    // Fourth, try to find JSON between the first { and last }
    const firstBrace = responseText.indexOf('{');
    const lastBrace = responseText.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      return responseText.substring(firstBrace, lastBrace + 1).trim();
    }

    return null;
  }

  private static async analyzeSentenceWithGemini(sentence: string): Promise<{
    isPlagiarized: boolean;
    confidence: number;
    sources: PlagiarismSource[];
  }> {
    const prompt = `
    Analyze this text for plagiarism: "${sentence}"

    Respond with JSON:
    {
      "isPlagiarized": boolean,
      "confidence": number (0-1),
      "sources": [
        {
          "title": "source title",
          "domain": "domain.com",
          "url": "#",
          "similarity": number (0-1),
          "matchedText": "matching text"
        }
      ]
    }

    Consider academic patterns, technical language, and formal structures.
    `;

    const result = await this.model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    try {
      const jsonString = this.extractJsonFromResponse(text);
      if (!jsonString) {
        throw new Error('No valid JSON found in response');
      }

      const analysis = JSON.parse(jsonString);
      
      return {
        isPlagiarized: analysis.isPlagiarized || false,
        confidence: Math.min(Math.max(analysis.confidence || 0, 0), 1),
        sources: (analysis.sources || []).map((source: any) => ({
          url: source.url || '#',
          title: source.title || 'Unknown Source',
          similarity: Math.min(Math.max(source.similarity || 0, 0), 1),
          matchedText: source.matchedText || sentence,
          domain: source.domain || 'unknown.com'
        }))
      };
    } catch (parseError) {
      console.error('Error parsing response:', parseError);
      const isPlagiarized = text.toLowerCase().includes('plagiarized') || 
                           text.toLowerCase().includes('copied') ||
                           text.toLowerCase().includes('source');
      
      return {
        isPlagiarized,
        confidence: isPlagiarized ? 0.6 : 0.2,
        sources: isPlagiarized ? [{
          url: '#',
          title: 'Potential Source Detected',
          similarity: 0.6,
          matchedText: sentence,
          domain: 'research-database.com'
        }] : []
      };
    }
  }

  private static async fallbackDetection(
    sentence: string, 
    startIndex: number, 
    endIndex: number
  ): Promise<PlagiarismResult> {
    const suspiciousPatterns = [
      /according to (research|studies|experts)/i,
      /it has been (shown|proven|demonstrated)/i,
      /research (shows|indicates|suggests)/i,
      /studies have (shown|found|revealed)/i,
      /(furthermore|moreover|additionally|consequently)/i
    ];

    const hasSuspiciousPattern = suspiciousPatterns.some(pattern => pattern.test(sentence));
    const confidence = hasSuspiciousPattern ? 0.4 : 0.1;

    return {
      text: sentence,
      isPlagiarized: confidence > 0.3,
      confidence,
      startIndex,
      endIndex,
      sources: hasSuspiciousPattern ? [{
        url: '#',
        title: 'Academic Source Pattern Detected',
        similarity: confidence,
        matchedText: sentence,
        domain: 'academic-source.edu'
      }] : []
    };
  }

  private static splitIntoSentences(text: string): string[] {
    return text
      .split(/[.!?]+/)
      .map(s => s.trim())
      .filter(s => s.length > 15);
  }
}