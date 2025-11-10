export interface IExportAdapter {
  exportToWord(content: any, projectName: string): void | Promise<void>;
  exportToPdf?(content: any, projectName: string): Promise<void>;
}


