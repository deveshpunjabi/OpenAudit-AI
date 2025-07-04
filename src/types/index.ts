export interface PlagiarismResult {
  text: string;
  isPlagiarized: boolean;
  confidence: number;
  startIndex: number;
  endIndex: number;
  sources: PlagiarismSource[];
}

export interface PlagiarismSource {
  url: string;
  title: string;
  similarity: number;
  matchedText: string;
  domain: string;
}

export interface DetectionStats {
  totalWords: number;
  plagiarizedWords: number;
  originalWords: number;
  plagiarismPercentage: number;
}