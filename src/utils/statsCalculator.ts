import { PlagiarismResult, DetectionStats } from '../types';

export class StatsCalculator {
  static calculateStats(
    text: string,
    aiResults: any[],
    plagiarismResults: PlagiarismResult[]
  ): DetectionStats {
    const totalWords = text.split(/\s+/).filter(word => word.length > 0).length;
    
    // Calculate plagiarism stats
    let plagiarizedWords = 0;
    plagiarismResults.forEach(result => {
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