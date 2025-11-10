import { ADREntity, ADRStatus, ApprovalEntity, ApprovalStatus, ApproverEntity, ArtifactType, ChatMessageEntity, CoverPageSettings, CoverPageTemplateEntity, GeneratedSectionEntity, ProjectArtifactEntity, ProjectEntity, UMLDiagramEntity, UMLDiagramType } from '../entities/Project';

export interface CreateProjectInput {
  name: string;
  description: string;
  selectedSectionIds?: string[];
  customSections?: Array<{
    id: string;
    title: string;
    subsections: Array<{
      number: string;
      title: string;
      description: string;
    }>;
    order?: number;
  }>;
  customSectionSubsections?: { [sectionId: string]: Array<{ number: string; title: string; description: string }> };
  coverPageSettings?: CoverPageSettings;
  coverPageTemplateId?: string;
}

export interface CreateCoverPageTemplateInput {
  name: string;
  description?: string;
  content: string;
  coverPageSettings?: CoverPageSettings;
  previewImage?: string;
}

export interface UpdateCoverPageTemplateInput {
  name?: string;
  description?: string;
  content?: string;
  coverPageSettings?: CoverPageSettings;
  previewImage?: string | null;
}

export interface CreateArtifactInput {
  projectId: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  fileContent: string;
  artifactType: ArtifactType;
}

export interface IProjectRepository {
  // Project operations
  createProject(input: CreateProjectInput): Promise<ProjectEntity>;
  getAllProjects(): Promise<ProjectEntity[]>;
  getProjectById(id: string): Promise<ProjectEntity | null>;
  updateProject(id: string, input: Partial<CreateProjectInput>): Promise<ProjectEntity>;
  deleteProject(id: string): Promise<void>;

  // Cover page templates
  createCoverPageTemplate(input: CreateCoverPageTemplateInput): Promise<CoverPageTemplateEntity>;
  getCoverPageTemplates(): Promise<CoverPageTemplateEntity[]>;
  getCoverPageTemplateById(id: string): Promise<CoverPageTemplateEntity | null>;
  updateCoverPageTemplate(id: string, input: UpdateCoverPageTemplateInput): Promise<CoverPageTemplateEntity>;
  deleteCoverPageTemplate(id: string): Promise<void>;
  
  // Artifact operations
  addArtifact(input: CreateArtifactInput): Promise<ProjectArtifactEntity>;
  getArtifactsByProject(projectId: string): Promise<ProjectArtifactEntity[]>;
  deleteArtifact(id: string): Promise<void>;
  
  // Generated sections operations
  saveGeneratedSection(
    projectId: string,
    sectionId: string,
    sectionTitle: string,
    content: string,
    parentSectionId?: string,
    order?: number
  ): Promise<GeneratedSectionEntity>;
  getGeneratedSectionsByProject(projectId: string): Promise<GeneratedSectionEntity[]>;
  getGeneratedSection(projectId: string, sectionId: string): Promise<GeneratedSectionEntity | null>;
  getSubSections(parentSectionId: string): Promise<GeneratedSectionEntity[]>;
  deleteGeneratedSection(id: string): Promise<void>;
  
  // ADR operations
  createADR(input: CreateADRInput): Promise<ADREntity>;
  getADRsByProject(projectId: string): Promise<ADREntity[]>;
  getADRById(id: string): Promise<ADREntity | null>;
  updateADR(id: string, input: Partial<CreateADRInput>): Promise<ADREntity>;
  deleteADR(id: string): Promise<void>;
  
  // UML Diagram operations
  createUMLDiagram(input: CreateUMLDiagramInput): Promise<UMLDiagramEntity>;
  getUMLDiagramsByProject(projectId: string): Promise<UMLDiagramEntity[]>;
  getUMLDiagramById(id: string): Promise<UMLDiagramEntity | null>;
  updateUMLDiagram(id: string, input: Partial<CreateUMLDiagramInput>): Promise<UMLDiagramEntity>;
  deleteUMLDiagram(id: string): Promise<void>;
  
  // Approver operations
  addApprover(input: CreateApproverInput): Promise<ApproverEntity>;
  getApproversByProject(projectId: string): Promise<ApproverEntity[]>;
  getApproverById(id: string): Promise<ApproverEntity | null>;
  getApproverByEmail(projectId: string, email: string): Promise<ApproverEntity | null>;
  updateApprover(id: string, input: Partial<CreateApproverInput>): Promise<ApproverEntity>;
  deleteApprover(id: string): Promise<void>;
  
  // Approval operations
  createApproval(input: CreateApprovalInput): Promise<ApprovalEntity>;
  getApprovalsByProject(projectId: string): Promise<ApprovalEntity[]>;
  getApprovalById(id: string): Promise<ApprovalEntity | null>;
  getApprovalByApprover(projectId: string, approverId: string): Promise<ApprovalEntity | null>;
  updateApproval(id: string, input: Partial<CreateApprovalInput>): Promise<ApprovalEntity>;
  deleteApproval(id: string): Promise<void>;
  
  // Chat message operations
  addChatMessage(input: CreateChatMessageInput): Promise<ChatMessageEntity>;
  getChatMessagesByProject(projectId: string | null): Promise<ChatMessageEntity[]>;
  deleteChatMessagesByProject(projectId: string | null): Promise<void>;
  deleteChatMessage(id: string): Promise<void>;
}

export interface CreateADRInput {
  projectId: string;
  number: number;
  title: string;
  status: ADRStatus;
  date: Date;
  context: string;
  decision: string;
  consequences: string;
}

export interface CreateUMLDiagramInput {
  projectId: string;
  name: string;
  description: string;
  diagramType: UMLDiagramType;
  content: string;
  format: string;
}

export interface CreateApproverInput {
  projectId: string;
  email: string;
  name: string;
  role?: string;
  addedBy?: string;
}

export interface CreateApprovalInput {
  projectId: string;
  approverId: string;
  status?: ApprovalStatus;
  signature?: string;
  comments?: string;
}

export interface CreateChatMessageInput {
  projectId: string | null; // null for global chats
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  capabilityType?: 'modeler' | 'reviewer' | 'mapper' | 'chat' | 'pattern' | null;
}

