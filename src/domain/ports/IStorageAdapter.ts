import { UploadedFile } from '../entities/Section';

export interface IStorageAdapter {
  uploadFile(file: File): Promise<UploadedFile>;
  readFileContent(file: File): Promise<string>;
}


