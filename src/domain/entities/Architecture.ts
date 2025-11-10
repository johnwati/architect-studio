// Enterprise Architecture Domain Models

export type ArchitectureLayer = 'BUSINESS' | 'APPLICATION' | 'DATA' | 'TECHNOLOGY' | 'SOLUTION';

export type LifecycleStage = 'PLANNED' | 'IN_DEVELOPMENT' | 'PRODUCTION' | 'DEPRECATED' | 'DECOMMISSIONED';

export type ArchitectureState = 'AS_IS' | 'TO_BE' | 'SCENARIO';

export interface ArchitectureElement {
  id: string;
  layer: ArchitectureLayer;
  name: string;
  description?: string;
  type: string; // e.g., 'System', 'Capability', 'Data Entity', 'Infrastructure', 'Solution'
  metadata: ArchitectureMetadata;
  relationships: ArchitectureRelationship[];
  createdAt: Date;
  updatedAt: Date;
  version: string;
  tags: string[];
  state: ArchitectureState;
  scenarioId?: string; // For scenario-based modeling
}

export interface ArchitectureMetadata {
  owner?: string;
  cost?: number;
  risk?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  lifecycleStage?: LifecycleStage;
  customFields?: Record<string, any>;
}

export interface ArchitectureRelationship {
  id: string;
  sourceId: string;
  targetId: string;
  type: RelationshipType;
  description?: string;
  metadata?: Record<string, any>;
}

export type RelationshipType = 
  | 'DEPENDS_ON'
  | 'INTEGRATES_WITH'
  | 'CONTAINS'
  | 'GENERATES'
  | 'CONSUMES'
  | 'PROVIDES'
  | 'TRANSFORMS_TO'
  | 'MIGRATES_TO';

export interface BusinessCapability {
  id: string;
  name: string;
  description?: string;
  valueStream?: string;
  orgUnit?: string;
  processes: string[];
  metadata: ArchitectureMetadata;
}

export interface ApplicationSystem {
  id: string;
  name: string;
  description?: string;
  systemType: 'CORE' | 'INTEGRATION' | 'API' | 'MICROSERVICE' | 'LEGACY';
  integrations: IntegrationReference[];
  apis: APIReference[];
  softwareComponents: SoftwareComponent[];
  metadata: ArchitectureMetadata;
}

export interface IntegrationReference {
  id: string;
  name: string;
  type: 'API' | 'MESSAGE_QUEUE' | 'DATABASE' | 'FILE' | 'WEBHOOK';
  sourceSystemId: string;
  targetSystemId: string;
  protocol?: string;
  metadata?: Record<string, any>;
}

export interface APIReference {
  id: string;
  name: string;
  endpoint: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  description?: string;
  version?: string;
}

export interface SoftwareComponent {
  id: string;
  name: string;
  type: 'MODULE' | 'SERVICE' | 'LIBRARY' | 'FRAMEWORK';
  description?: string;
}

export interface DataEntity {
  id: string;
  name: string;
  description?: string;
  dataType: 'MASTER_DATA' | 'TRANSACTIONAL' | 'REFERENCE' | 'ANALYTICAL';
  dataStore: DataStore;
  lineage: DataLineage;
  metadata: ArchitectureMetadata;
}

export interface DataStore {
  id: string;
  name: string;
  type: 'DATABASE' | 'DATA_WAREHOUSE' | 'DATA_LAKE' | 'FILE_STORAGE' | 'CACHE';
  technology?: string;
  location?: string;
}

export interface DataLineage {
  sources: string[]; // IDs of source entities
  transformations: Transformation[];
  targets: string[]; // IDs of target entities
}

export interface Transformation {
  id: string;
  name: string;
  type: 'EXTRACT' | 'TRANSFORM' | 'LOAD' | 'AGGREGATE';
  description?: string;
}

export interface TechnologyInfrastructure {
  id: string;
  name: string;
  description?: string;
  infrastructureType: 'SERVER' | 'CLOUD_PLATFORM' | 'NETWORK' | 'STORAGE' | 'TOOL';
  platform?: string; // e.g., 'AWS', 'Azure', 'On-Premise'
  specifications?: Record<string, any>;
  metadata: ArchitectureMetadata;
}

export interface SolutionArchitecture {
  id: string;
  name: string;
  description?: string;
  businessCapabilities: string[]; // Business capability IDs
  applications: string[]; // Application system IDs
  dataEntities: string[]; // Data entity IDs
  technologies: string[]; // Technology infrastructure IDs
  endToEndFlows: EndToEndFlow[];
  metadata: ArchitectureMetadata;
}

export interface EndToEndFlow {
  id: string;
  name: string;
  description?: string;
  steps: FlowStep[];
  triggers: string[];
  outcomes: string[];
}

export interface FlowStep {
  id: string;
  sequence: number;
  componentId: string;
  componentType: ArchitectureLayer;
  action: string;
  description?: string;
}

export interface ArchitectureRepository {
  elements: ArchitectureElement[];
  diagrams: ArchitectureDiagram[];
  roadmaps: Roadmap[];
  scenarios: Scenario[];
}

export interface ArchitectureDiagram {
  id: string;
  name: string;
  description?: string;
  diagramType: DiagramType;
  template?: DiagramTemplate;
  canvasData: CanvasData; // JSON representation of diagram
  elements: string[]; // IDs of architecture elements in diagram
  createdAt: Date;
  updatedAt: Date;
  version: string;
}

export type DiagramType = 'BPMN' | 'UML' | 'ARCHIMATE' | 'CUSTOM' | 'VISIO' | 'JSON';

export type DiagramTemplate = 'BPMN_BASIC' | 'UML_CLASS' | 'UML_SEQUENCE' | 'ARCHIMATE_FULL' | 'CUSTOM';

export interface CanvasData {
  nodes: CanvasNode[];
  edges: CanvasEdge[];
  metadata: {
    viewport?: { x: number; y: number; zoom: number };
    background?: string;
    [key: string]: any;
  };
}

export interface CanvasNode {
  id: string;
  type: string;
  position: { x: number; y: number };
  data: {
    elementId?: string; // Link to ArchitectureElement
    label: string;
    layer?: ArchitectureLayer;
    [key: string]: any;
  };
  style?: Record<string, any>;
}

export interface CanvasEdge {
  id: string;
  source: string;
  target: string;
  type?: string;
  data?: {
    relationshipId?: string; // Link to ArchitectureRelationship
    label?: string;
    [key: string]: any;
  };
  style?: Record<string, any>;
}

export interface Roadmap {
  id: string;
  name: string;
  description?: string;
  asIsArchitectureId: string; // Reference to ArchitectureRepository state
  toBeArchitectureId: string; // Reference to ArchitectureRepository state
  scenarios: Scenario[];
  timeline: RoadmapTimeline;
  ganttData?: GanttData;
  createdAt: Date;
  updatedAt: Date;
}

export interface RoadmapTimeline {
  startDate: Date;
  endDate: Date;
  milestones: Milestone[];
  phases: Phase[];
}

export interface Milestone {
  id: string;
  name: string;
  description?: string;
  date: Date;
  type: 'GO_LIVE' | 'DECOMMISSION' | 'MIGRATION' | 'CUSTOM';
}

export interface Phase {
  id: string;
  name: string;
  description?: string;
  startDate: Date;
  endDate: Date;
  activities: Activity[];
}

export interface Activity {
  id: string;
  name: string;
  description?: string;
  startDate: Date;
  endDate: Date;
  dependencies: string[]; // Activity IDs
  resources?: string[];
  status: 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED' | 'BLOCKED';
  impact: ImpactAnalysis;
}

export interface ImpactAnalysis {
  systemsAffected: string[]; // Architecture element IDs
  costImpact: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  complexity: 'LOW' | 'MEDIUM' | 'HIGH';
  dependencies: string[];
  gaps: string[];
}

export interface GanttData {
  tasks: GanttTask[];
  dependencies: GanttDependency[];
}

export interface GanttTask {
  id: string;
  name: string;
  start: Date;
  end: Date;
  progress: number; // 0-100
  type?: string;
  resource?: string;
}

export interface GanttDependency {
  id: string;
  from: string; // Task ID
  to: string; // Task ID
  type: 'FINISH_TO_START' | 'START_TO_START' | 'FINISH_TO_FINISH' | 'START_TO_FINISH';
}

export interface Scenario {
  id: string;
  name: string;
  description?: string;
  type: 'CLOUD_MIGRATION' | 'REPLATFORM' | 'MODERNIZATION' | 'CONSOLIDATION' | 'CUSTOM';
  architectureId: string; // Reference to ArchitectureRepository state
  comparison: ScenarioComparison;
  createdAt: Date;
  updatedAt: Date;
}

export interface ScenarioComparison {
  cost: number;
  risk: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  complexity: 'LOW' | 'MEDIUM' | 'HIGH';
  fit: 'LOW' | 'MEDIUM' | 'HIGH'; // How well it fits requirements
  timeline: { months: number };
  benefits: string[];
  risks: string[];
  dependencies: string[];
  gaps: string[];
}

export interface AnalyticsQuery {
  query: string;
  filters?: {
    layer?: ArchitectureLayer;
    state?: ArchitectureState;
    lifecycleStage?: LifecycleStage;
    tags?: string[];
    [key: string]: any;
  };
}

export interface AnalyticsResult {
  elements: ArchitectureElement[];
  relationships: ArchitectureRelationship[];
  summary: {
    totalElements: number;
    byLayer: Record<ArchitectureLayer, number>;
    byState: Record<ArchitectureState, number>;
    byLifecycle: Record<LifecycleStage, number>;
    dependencies: DependencyAnalysis;
    gaps: string[];
  };
  visualizations?: {
    diagram?: CanvasData;
    heatmap?: HeatmapData;
    timeline?: TimelineData;
  };
}

export interface DependencyAnalysis {
  directDependencies: Record<string, string[]>; // Element ID -> Dependency IDs
  transitiveDependencies: Record<string, string[]>; // Element ID -> Transitive dependency IDs
  criticalPaths: string[][]; // Arrays of element IDs forming critical paths
  circularDependencies: string[][];
}

export interface HeatmapData {
  dimensions: string[];
  data: HeatmapCell[];
}

export interface HeatmapCell {
  x: string;
  y: string;
  value: number;
  label?: string;
}

export interface TimelineData {
  events: TimelineEvent[];
  phases: Phase[];
}

export interface TimelineEvent {
  id: string;
  date: Date;
  type: 'DEPLOYMENT' | 'DECOMMISSION' | 'MIGRATION' | 'UPDATE';
  elementId: string;
  description: string;
}

