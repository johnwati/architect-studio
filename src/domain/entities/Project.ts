export type ArtifactType = 
  | 'BRD'
  | 'FLOW'
  | 'SEQUENCE'
  | 'ARCHITECTURE'
  | 'TECHNICAL_SPEC'
  | 'OTHER';

export interface CoverPageSettings {
  version?: string;
  date?: string; // Custom date string, if not provided uses current date
  showOrganization?: boolean; // Whether to show "Equity Group Holdings PLC"
  organizationName?: string; // Custom organization name
  footerText?: string; // Custom footer text
  showOrangeLine?: boolean; // Whether to show the orange vertical line
  logoText?: string; // Custom logo text (default: "EQUITY")
  showProjectName?: boolean; // Whether to show the project name on the cover page
}

export interface CoverPageTemplateEntity {
  id: string;
  userId: string;
  name: string;
  description?: string;
  content: string;
  coverPageSettings?: CoverPageSettings;
  previewImage?: string;
  createdAt: Date;
  updatedAt: Date;
}

export type DocumentStatus = 'DRAFT' | 'REVIEW' | 'APPROVED' | 'PUBLISHED' | 'ARCHIVED';

export interface ProjectEntity {
  id: string;
  name: string;
  description: string;
  userId: string; // ID of the user who owns this project
  status?: DocumentStatus; // Document workflow status
  version?: string; // Document version (e.g., "1.0", "1.1")
  createdAt: Date;
  updatedAt: Date;
  selectedSectionIds?: string[]; // IDs of sections selected for this project
  customSections?: CustomSectionEntity[]; // Custom sections added by user
  customSectionSubsections?: { [sectionId: string]: Array<{ number: string; title: string; description: string }> }; // Custom subsections added to default sections
  coverPageSettings?: CoverPageSettings; // Cover page customization settings
  coverPageTemplateId?: string; // Selected cover page template
  documentOwner?: string; // Email of document owner
  documentClassification?: string; // e.g., "CONFIDENTIAL", "INTERNAL", "PUBLIC"
  publishedAt?: Date; // When document was published
  publishedBy?: string; // Email of person who published
}

export interface CustomSectionEntity {
  id: string;
  title: string;
  subsections: Array<{
    number: string;
    title: string;
    description: string;
  }>;
  order?: number; // Order in the document
}

export interface ProjectArtifactEntity {
  id: string;
  projectId: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  fileContent: string;
  artifactType: ArtifactType;
  uploadedAt: Date;
}

export interface GeneratedSectionEntity {
  id: string;
  projectId: string;
  sectionId: string;
  sectionTitle: string;
  content: string;
  parentSectionId?: string; // ID of parent section if this is a sub-section
  order?: number; // Order within parent section or top-level sections
  generatedAt: Date;
  updatedAt: Date;
}

export type ADRStatus = 'proposed' | 'accepted' | 'deprecated' | 'superseded';

export interface ADREntity {
  id: string;
  projectId: string;
  number: number;
  title: string;
  status: ADRStatus;
  date: Date;
  context: string;
  decision: string;
  consequences: string;
  createdAt: Date;
  updatedAt: Date;
}

export type UMLDiagramType = 'PLANTUML' | 'MERMAID' | 'JSON' | 'XML' | 'DIAGRAMS_PYTHON' | 'GRAPHVIZ_DOT' | 'STRUCTURIZR_DSL' | 'C4_PLANTUML' | 'C4_MERMAID' | 'ARCHIMATE' | 'D2' | 'KROKI' | 'OTHER';

export interface UMLDiagramEntity {
  id: string;
  projectId: string;
  name: string;
  description: string;
  diagramType: UMLDiagramType;
  content: string; // The source code/content of the diagram
  format: string; // e.g., 'class', 'sequence', 'activity', 'component', etc.
  createdAt: Date;
  updatedAt: Date;
}

export type ApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'SIGNED';

export interface ApproverEntity {
  id: string;
  projectId: string;
  email: string;
  name: string;
  role?: string; // e.g., "Technical Lead", "Business Owner", "Architect"
  addedAt: Date;
  addedBy?: string; // Email of person who added this approver
}

export interface ApprovalEntity {
  id: string;
  projectId: string;
  approverId: string;
  approver?: ApproverEntity; // Optional loaded approver data
  status: ApprovalStatus;
  signature?: string; // Base64 encoded signature image or text signature
  comments?: string; // Optional comments from approver
  signedAt?: Date; // When signature was added
  approvedAt?: Date; // When approval was given
  createdAt: Date;
  updatedAt: Date;
}

export interface ChatMessageEntity {
  id: string;
  projectId: string | null; // null for global chats, projectId for project-specific chats
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  capabilityType?: 'modeler' | 'reviewer' | 'mapper' | 'chat' | 'pattern' | null; // Which AI capability was used
  createdAt: Date;
}

