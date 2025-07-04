import { PlagiarismResult, DetectionStats } from '../types';
import { PlagiarismDetector } from './plagiarismDetector';
import { DocumentParser } from './documentParser';

export class DocumentAnalyzer {
  static async analyzePlagiarism(text: string): Promise<{
    results: PlagiarismResult[];
    stats: DetectionStats;
  }> {
    // Analyze for plagiarism
    const results = await PlagiarismDetector.detectPlagiarism(text);
    
    // Calculate statistics
    const stats = this.calculateStats(text, results);
    
    return { results, stats };
  }

  static async analyzeFile(file: File): Promise<{
    text: string;
    results: PlagiarismResult[];
    stats: DetectionStats;
  }> {
    // Parse document
    const text = await DocumentParser.parseFile(file);
    
    // Analyze for plagiarism
    const results = await PlagiarismDetector.detectPlagiarism(text);
    
    // Calculate statistics
    const stats = this.calculateStats(text, results);
    
    return { text, results, stats };
  }

  private static calculateStats(text: string, results: PlagiarismResult[]): DetectionStats {
    const totalWords = text.split(/\s+/).filter(word => word.length > 0).length;
    
    let plagiarizedWords = 0;
    results.forEach(result => {
      if (result.isPlagiarized) {
        const words = result.text.split(/\s+/).filter(word => word.length > 0).length;
        plagiarizedWords += words;
      }
    });
    
    const originalWords = totalWords - plagiarizedWords;
    
    return {
      totalWords,
      plagiarizedWords,
      originalWords,
      plagiarismPercentage: totalWords > 0 ? (plagiarizedWords / totalWords) * 100 : 0
    };
  }
}