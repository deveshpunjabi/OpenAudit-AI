import jsPDF from 'jspdf';
import { PlagiarismResult, DetectionStats } from '../types';

export class ExportUtils {
  static exportPlagiarismToPDF(
    results: PlagiarismResult[], 
    stats: DetectionStats, 
    originalText: string,
    filename: string = 'plagiarism-report.pdf'
  ) {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    const margin = 20;
    let yPosition = margin;

    // Title
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('Plagiarism Detection Report', pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 20;

    // Date
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, margin, yPosition);
    yPosition += 15;

    // Summary
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('Summary', margin, yPosition);
    yPosition += 10;

    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    const summaryText = [
      `Plagiarized Content: ${stats.plagiarismPercentage.toFixed(1)}%`,
      `Original Content: ${(100 - stats.plagiarismPercentage).toFixed(1)}%`,
      `Total Words: ${stats.totalWords.toLocaleString()}`,
      `Sources Found: ${results.reduce((acc, r) => acc + r.sources.length, 0)}`
    ];

    summaryText.forEach(text => {
      doc.text(text, margin, yPosition);
      yPosition += 8;
    });

    yPosition += 10;

    // Detailed Results
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('Detailed Analysis', margin, yPosition);
    yPosition += 10;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');

    results.forEach((result, index) => {
      if (yPosition > doc.internal.pageSize.height - 40) {
        doc.addPage();
        yPosition = margin;
      }

      // Result header
      doc.setFont('helvetica', 'bold');
      const status = result.isPlagiarized ? 'PLAGIARIZED' : 'ORIGINAL';
      const confidence = `(${(result.confidence * 100).toFixed(0)}% confidence)`;
      doc.text(`${index + 1}. ${status} ${confidence}`, margin, yPosition);
      yPosition += 6;

      // Text content
      doc.setFont('helvetica', 'normal');
      const textLines = doc.splitTextToSize(result.text, pageWidth - 2 * margin);
      doc.text(textLines, margin, yPosition);
      yPosition += textLines.length * 4 + 4;

      // Sources
      if (result.sources && result.sources.length > 0) {
        doc.setFont('helvetica', 'bold');
        doc.text('Sources:', margin, yPosition);
        yPosition += 4;
        
        doc.setFont('helvetica', 'normal');
        result.sources.forEach(source => {
          const sourceText = `• ${source.title} - ${source.domain} (${(source.similarity * 100).toFixed(0)}% match)`;
          const sourceLines = doc.splitTextToSize(sourceText, pageWidth - 2 * margin - 10);
          doc.text(sourceLines, margin + 5, yPosition);
          yPosition += sourceLines.length * 4;
        });
        yPosition += 4;
      }

      yPosition += 6;
    });

    doc.save(filename);
  }

  static exportToMarkdown(
    results: PlagiarismResult[], 
    stats: DetectionStats, 
    originalText: string
  ): string {
    let markdown = `# Plagiarism Detection Report\n\n`;
    
    markdown += `## Summary\n\n`;
    markdown += `- **Total Words**: ${stats.totalWords}\n`;
    markdown += `- **Plagiarized**: ${stats.plagiarismPercentage.toFixed(1)}%\n`;
    markdown += `- **Original**: ${(100 - stats.plagiarismPercentage).toFixed(1)}%\n`;
    markdown += `- **Sources Found**: ${results.reduce((acc, r) => acc + r.sources.length, 0)}\n\n`;

    markdown += `## Detailed Analysis\n\n`;

    results.forEach((result, index) => {
      markdown += `### Segment ${index + 1}\n\n`;
      
      if (result.isPlagiarized) {
        markdown += `**Status**: Plagiarized (${(result.confidence * 100).toFixed(0)}% confidence)\n\n`;
      } else {
        markdown += `**Status**: Original\n\n`;
      }

      markdown += `**Text**: ${result.text}\n\n`;

      if (result.sources && result.sources.length > 0) {
        markdown += `**Sources**:\n`;
        result.sources.forEach(source => {
          markdown += `- ${source.title} (${(source.similarity * 100).toFixed(0)}% match)\n`;
          markdown += `  - Domain: ${source.domain}\n`;
          if (source.url && source.url !== '#') {
            markdown += `  - [Link](${source.url})\n`;
          }
        });
        markdown += '\n';
      }

      markdown += '---\n\n';
    });

    return markdown;
  }

  static downloadMarkdown(
    results: PlagiarismResult[], 
    stats: DetectionStats, 
    originalText: string,
    filename: string = 'plagiarism-report.md'
  ) {
    const markdown = this.exportToMarkdown(results, stats, originalText);
    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}