import { GoogleGenerativeAI } from '@google/generative-ai';
import { PlagiarismResult, PlagiarismSource } from '../types';

export class GeminiPlagiarismDetector {
  private static genAI: GoogleGenerativeAI | null = null;
  private static model: any = null;

  static initialize(apiKey: string) {
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
  }

  static async detectPlagiarism(text: string): Promise<PlagiarismResult[]> {
    if (!this.model) {
      throw new Error('Gemini API not initialized. Please provide API key.');
    }

    const sentences = this.splitIntoSentences(text);
    const results: PlagiarismResult[] = [];
    let currentIndex = 0;

    // Process sentences in batches for efficiency
    const batchSize = 5;
    for (let i = 0; i < sentences.length; i += batchSize) {
      const batch = sentences.slice(i, i + batchSize);
      const batchResults = await this.processBatch(batch, text, currentIndex);
      results.push(...batchResults);
      
      // Update current index
      batch.forEach(sentence => {
        currentIndex = text.indexOf(sentence, currentIndex) + sentence.length;
      });
    }

    return results;
  }

  private static async processBatch(
    sentences: string[], 
    fullText: string, 
    startIndex: number
  ): Promise<PlagiarismResult[]> {
    const results: PlagiarismResult[] = [];
    let currentIndex = startIndex;

    for (const sentence of sentences) {
      const sentenceStartIndex = fullText.indexOf(sentence, currentIndex);
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
        // Fallback to local detection
        const fallbackResult = await this.fallbackDetection(sentence, sentenceStartIndex, sentenceEndIndex);
        results.push(fallbackResult);
        currentIndex = sentenceEndIndex;
      }
    }

    return results;
  }

  private static async analyzeSentenceWithGemini(sentence: string): Promise<{
    isPlagiarized: boolean;
    confidence: number;
    sources: PlagiarismSource[];
  }> {
    const prompt = `
    Analyze the following text for potential plagiarism. Perform a deep research analysis to identify if this content appears to be copied from existing sources.

    Text to analyze: "${sentence}"

    Please provide your analysis in the following JSON format:
    {
      "isPlagiarized": boolean,
      "confidence": number (0-1),
      "reasoning": "explanation of your analysis",
      "sources": [
        {
          "title": "source title if found",
          "domain": "domain name",
          "url": "potential URL if identifiable",
          "similarity": number (0-1),
          "matchedText": "the matching portion"
        }
      ]
    }

    Consider these factors:
    1. Does this text appear to be from academic papers, books, or well-known publications?
    2. Is the language style consistent with copied content?
    3. Are there specific phrases or terminology that suggest academic or professional sources?
    4. Does the content match patterns of commonly plagiarized material?
    5. Can you identify potential source domains or publication types?

    If you cannot find specific sources, but the text appears potentially plagiarized based on style, structure, or content patterns, indicate this with appropriate confidence levels.
    `;

    const result = await this.model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    try {
      // Extract JSON from the response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }

      const analysis = JSON.parse(jsonMatch[0]);
      
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
      console.error('Error parsing Gemini response:', parseError);
      // Fallback analysis based on response content
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
    // Simple fallback detection logic
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
      .filter(s => s.length > 15); // Minimum length for meaningful analysis
  }

  static async performDeepResearch(text: string): Promise<{
    overallAssessment: string;
    riskLevel: 'low' | 'medium' | 'high';
    recommendations: string[];
    potentialSources: PlagiarismSource[];
  }> {
    if (!this.model) {
      throw new Error('Gemini API not initialized');
    }

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

    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const responseText = response.text();

      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }

      const analysis = JSON.parse(jsonMatch[0]);
      
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
      return {
        overallAssessment: 'Unable to complete deep analysis. Please check API connection.',
        riskLevel: 'medium',
        recommendations: ['Manual review recommended', 'Check for proper citations'],
        potentialSources: []
      };
    }
  }
}