import { ProjectArtifactEntity } from '../entities/Project';

export interface UMLGenerationContext {
  projectName: string;
  projectDescription?: string;
  selectedArtifacts?: ProjectArtifactEntity[]; // Knowledge base artifacts
}

export interface UMLGenerationRequest {
  diagramTool: UMLDiagramTool;
  diagramType: UMLDiagramType;
  description?: string; // User's description of what they want
  context: UMLGenerationContext;
}

export interface IGenerateUMLDiagram {
  generateDiagram(request: UMLGenerationRequest): Promise<string>;
}

// Supported diagram tools/languages
export type UMLDiagramTool =
  | 'PLANTUML'
  | 'MERMAID'
  | 'DIAGRAMS_PYTHON'
  | 'GRAPHVIZ_DOT'
  | 'STRUCTURIZR_DSL'
  | 'C4_PLANTUML'
  | 'C4_MERMAID'
  | 'ARCHIMATE'
  | 'D2'
  | 'KROKI';

// Supported UML diagram types
export type UMLDiagramType =
  | 'CLASS'
  | 'SEQUENCE'
  | 'ACTIVITY'
  | 'COMPONENT'
  | 'USECASE'
  | 'STATE'
  | 'ER'
  | 'FLOWCHART'
  | 'ARCHITECTURE'
  | 'DEPLOYMENT'
  | 'PACKAGE'
  | 'OBJECT'
  | 'COMMUNICATION'
  | 'TIMING'
  | 'INTERACTION_OVERVIEW'
  | 'COMPOSITE_STRUCTURE';

