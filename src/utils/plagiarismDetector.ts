import { PlagiarismResult, PlagiarismSource } from '../types';

export class PlagiarismDetector {
  private static knowledgeBase: Map<string, PlagiarismSource[]> = new Map();
  
  static {
    // Initialize with comprehensive knowledge base
    this.initializeKnowledgeBase();
  }

  private static initializeKnowledgeBase() {
    const commonSources = [
      {
        text: "The quick brown fox jumps over the lazy dog",
        source: {
          url: "https://en.wikipedia.org/wiki/The_quick_brown_fox_jumps_over_the_lazy_dog",
          title: "The Quick Brown Fox - Wikipedia",
          domain: "wikipedia.org"
        }
      },
      {
        text: "To be or not to be, that is the question",
        source: {
          url: "https://www.shakespeare.org/hamlet-quotes/",
          title: "Hamlet Quotes - Shakespeare.org",
          domain: "shakespeare.org"
        }
      },
      {
        text: "Four score and seven years ago our fathers brought forth",
        source: {
          url: "https://www.abrahamlincolnonline.org/lincoln/speeches/gettysburg.htm",
          title: "Gettysburg Address - Abraham Lincoln Online",
          domain: "abrahamlincolnonline.org"
        }
      },
      {
        text: "It was the best of times, it was the worst of times",
        source: {
          url: "https://www.gutenberg.org/files/98/98-h/98-h.htm",
          title: "A Tale of Two Cities - Project Gutenberg",
          domain: "gutenberg.org"
        }
      },
      {
        text: "Climate change refers to long-term shifts in global temperatures and weather patterns",
        source: {
          url: "https://www.un.org/en/climatechange/what-is-climate-change",
          title: "What Is Climate Change? - United Nations",
          domain: "un.org"
        }
      },
      {
        text: "Artificial intelligence is the simulation of human intelligence processes by machines",
        source: {
          url: "https://www.ibm.com/cloud/learn/what-is-artificial-intelligence",
          title: "What is Artificial Intelligence? - IBM",
          domain: "ibm.com"
        }
      },
      {
        text: "Machine learning is a subset of artificial intelligence that enables computers to learn",
        source: {
          url: "https://www.coursera.org/articles/what-is-machine-learning",
          title: "What Is Machine Learning? - Coursera",
          domain: "coursera.org"
        }
      },
      {
        text: "The Internet of Things describes the network of physical objects embedded with sensors",
        source: {
          url: "https://www.oracle.com/internet-of-things/what-is-iot/",
          title: "What is IoT? - Oracle",
          domain: "oracle.com"
        }
      }
    ];

    commonSources.forEach(({ text, source }) => {
      const nGrams = this.generateNGrams(text, 4);
      nGrams.forEach(nGram => {
        if (!this.knowledgeBase.has(nGram)) {
          this.knowledgeBase.set(nGram, []);
        }
        this.knowledgeBase.get(nGram)!.push({
          ...source,
          similarity: 1.0,
          matchedText: text
        });
      });
    });
  }

  static async detectPlagiarism(text: string): Promise<PlagiarismResult[]> {
    const sentences = this.splitIntoSentences(text);
    const results: PlagiarismResult[] = [];
    let currentIndex = 0;

    for (const sentence of sentences) {
      const startIndex = text.indexOf(sentence, currentIndex);
      const endIndex = startIndex + sentence.length;
      
      const analysis = await this.analyzeSentence(sentence);
      
      results.push({
        text: sentence,
        isPlagiarized: analysis.confidence > 0.5,
        confidence: analysis.confidence,
        startIndex,
        endIndex,
        sources: analysis.sources
      });

      currentIndex = endIndex;
    }

    return results;
  }

  private static splitIntoSentences(text: string): string[] {
    return text
      .split(/[.!?]+/)
      .map(s => s.trim())
      .filter(s => s.length > 10);
  }

  private static async analyzeSentence(sentence: string): Promise<{ confidence: number; sources: PlagiarismSource[] }> {
    const nGrams = this.generateNGrams(sentence, 4);
    const matches = new Map<string, PlagiarismSource>();
    let totalMatches = 0;

    // Check n-grams against knowledge base
    nGrams.forEach(nGram => {
      const sources = this.knowledgeBase.get(nGram);
      if (sources) {
        sources.forEach(source => {
          const key = `${source.domain}-${source.title}`;
          if (!matches.has(key)) {
            matches.set(key, { ...source, similarity: 0 });
          }
          matches.get(key)!.similarity += 1;
          totalMatches++;
        });
      }
    });

    // Calculate similarity scores
    const sources: PlagiarismSource[] = [];
    matches.forEach(source => {
      const similarity = source.similarity / nGrams.length;
      if (similarity > 0.3) {
        sources.push({
          ...source,
          similarity,
          matchedText: sentence
        });
      }
    });

    // Sort by similarity
    sources.sort((a, b) => b.similarity - a.similarity);

    // Calculate overall confidence
    const maxSimilarity = sources.length > 0 ? sources[0].similarity : 0;
    const confidence = Math.min(maxSimilarity * 1.2, 1);

    return {
      confidence,
      sources: sources.slice(0, 3) // Top 3 sources
    };
  }

  private static generateNGrams(text: string, n: number): string[] {
    const words = text.toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 0);
    
    const nGrams: string[] = [];
    
    for (let i = 0; i <= words.length - n; i++) {
      nGrams.push(words.slice(i, i + n).join(' '));
    }
    
    return nGrams;
  }

  static addToKnowledgeBase(text: string, source: PlagiarismSource) {
    const nGrams = this.generateNGrams(text, 4);
    nGrams.forEach(nGram => {
      if (!this.knowledgeBase.has(nGram)) {
        this.knowledgeBase.set(nGram, []);
      }
      this.knowledgeBase.get(nGram)!.push(source);
    });
  }
}