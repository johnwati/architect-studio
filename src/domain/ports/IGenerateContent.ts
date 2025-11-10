import { ProjectContext, Section, UploadedFile } from '../entities/Section';

export interface IGenerateContent {
  generateSection(
    sectionId: string,
    sectionTitle: string,
    subsections: Section['subsections'],
    projectContext: ProjectContext,
    uploadedFiles: UploadedFile[]
  ): Promise<string>;
}


