import { UploadedFile } from '../../../domain/entities/Section';
import { IStorageAdapter } from '../../../domain/ports/IStorageAdapter';

export class BrowserStorageAdapter implements IStorageAdapter {
  async uploadFile(file: File): Promise<UploadedFile> {
    let content = '';
    let status: 'extracted' | 'pdf' | 'limited' | 'error' | 'ready' = 'ready';
    
    try {
      if (file.type === 'application/pdf') {
        content = `[PDF Document: ${file.name}]\nNote: This is a PDF file. While full text extraction is not available in the browser, the AI will use the filename, project context, and any information you provide about this document to generate relevant content.`;
        status = 'pdf';
      } else if (file.type.includes('word') || file.name.endsWith('.doc') || file.name.endsWith('.docx')) {
        try {
          const text = await file.text();
          if (text && text.length > 100) {
            content = text;
            status = 'extracted';
          } else {
            content = `[Word Document: ${file.name}]\nNote: Limited content extraction available for Word documents. Please ensure key information is also provided in the project context or as text files.`;
            status = 'limited';
          }
        } catch (e) {
          content = `[Word Document: ${file.name}]\nNote: Content extraction not available for this Word format. The AI will use the filename and project context.`;
          status = 'limited';
        }
      } else {
        content = await file.text();
        status = 'extracted';
      }
    } catch (e) {
      console.error(`Error reading ${file.name}:`, e);
      content = `[File: ${file.name}]\nError reading file content. The filename and project context will be used.`;
      status = 'error';
    }

    return {
      name: file.name,
      size: file.size,
      type: file.type,
      content: content,
      status: status,
      file: file
    };
  }

  async readFileContent(file: File): Promise<string> {
    return this.uploadFile(file).then(f => f.content);
  }
}


