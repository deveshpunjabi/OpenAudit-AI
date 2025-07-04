import mammoth from 'mammoth';
import * as pdfjsLib from 'pdfjs-dist';

// Set up PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

export class DocumentParser {
  static async parseFile(file: File): Promise<string> {
    const fileType = this.getFileType(file.name);
    
    switch (fileType) {
      case 'txt':
        return this.parseTxt(file);
      case 'pdf':
        return this.parsePdf(file);
      case 'docx':
        return this.parseDocx(file);
      default:
        throw new Error(`Unsupported file type: ${fileType}`);
    }
  }

  private static getFileType(filename: string): 'txt' | 'pdf' | 'docx' {
    const extension = filename.toLowerCase().split('.').pop();
    if (extension === 'pdf') return 'pdf';
    if (extension === 'docx') return 'docx';
    return 'txt';
  }

  private static async parseTxt(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.onerror = reject;
      reader.readAsText(file);
    });
  }

  private static async parsePdf(file: File): Promise<string> {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let fullText = '';

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(' ');
      fullText += pageText + '\n';
    }

    return fullText;
  }

  private static async parseDocx(file: File): Promise<string> {
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });
    return result.value;
  }
}