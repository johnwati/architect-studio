export interface Subsection {
  number: string;
  title: string;
  description: string;
}

export interface Section {
  id: string;
  title: string;
  subsections: Subsection[];
}

export interface UploadedFile {
  name: string;
  size: number;
  type: string;
  content: string;
  status: 'extracted' | 'pdf' | 'limited' | 'error' | 'ready';
  file?: File;
}

export interface GeneratedContent {
  [sectionId: string]: string;
}

export interface ProjectContext {
  name: string;
  description: string;
}


