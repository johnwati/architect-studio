// Repository & Governance Domain Entities

export interface ArchitectureRepositoryEntity {
  id: string;
  name: string;
  description?: string;
  metadata: Record<string, any>; // JSON object
  objectType: string; // 'diagram', 'component', 'relationship', 'pattern', etc.
  objectId: string; // ID of the object
  projectId?: string;
  tags?: string[];
  relationships?: RelationshipMetadata[];
  graphData?: Record<string, any>; // Graph DB data
  sqlData?: Record<string, any>; // SQL metadata
  isReusable: boolean;
  reuseCount: number;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;
}

export interface RelationshipMetadata {
  id: string;
  type: string; // 'depends-on', 'implements', 'uses', etc.
  targetId: string;
  targetType: string;
  properties?: Record<string, any>;
}

export interface ArchitectureVersionEntity {
  id: string;
  repositoryId: string;
  version: string; // e.g., "1.0", "1.1", "2.0"
  description?: string;
  metadata: Record<string, any>;
  content?: string;
  createdBy?: string;
  createdAt: Date;
  baselineId?: string;
}

export interface BaselineEntity {
  id: string;
  name: string; // e.g., "Architecture Release 1.0"
  description?: string;
  releaseVersion: string; // e.g., "1.0"
  projectId?: string;
  createdAt: Date;
  createdBy?: string;
  isActive: boolean;
  items?: BaselineItemEntity[];
}

export interface BaselineItemEntity {
  id: string;
  baselineId: string;
  repositoryId: string;
  versionId?: string;
  snapshot: Record<string, any>;
  createdAt: Date;
}

export interface ArchitectureStandardEntity {
  id: string;
  name: string;
  type: 'PRINCIPLE' | 'REFERENCE_MODEL' | 'PATTERN' | 'COMPLIANCE_RULE' | 'BEST_PRACTICE';
  category?: string;
  description: string;
  content: string | Record<string, any>;
  framework?: string; // e.g., "TOGAF", "SABSA", "Zachman"
  principle?: Record<string, any>;
  referenceModel?: Record<string, any>;
  pattern?: Record<string, any>;
  complianceRules?: ComplianceRule[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;
}

export interface ComplianceRule {
  id: string;
  name: string;
  description: string;
  framework: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  checkFunction?: string; // JavaScript function as string for custom checks
}

export interface ComplianceCheckEntity {
  id: string;
  standardId: string;
  projectId?: string;
  repositoryId?: string;
  checkType: 'TOGAF' | 'SABSA' | 'ZACHMAN' | 'CUSTOM';
  status: 'PENDING' | 'PASSED' | 'FAILED' | 'WARNING' | 'NOT_APPLICABLE';
  findings?: Finding[];
  recommendations?: Recommendation[];
  checkedBy?: string;
  checkedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Finding {
  id: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  message: string;
  ruleId?: string;
  location?: string;
  details?: Record<string, any>;
}

export interface Recommendation {
  id: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  message: string;
  actionItems?: string[];
}

export interface GovernanceWorkflowEntity {
  id: string;
  name: string;
  type: 'ARCHITECTURE_REVIEW' | 'STANDARD_APPROVAL' | 'COMPONENT_REUSE' | 'PATTERN_APPROVAL' | 'COMPLIANCE_REVIEW';
  projectId?: string;
  repositoryId?: string;
  status: 'DRAFT' | 'SUBMITTED' | 'IN_REVIEW' | 'APPROVED' | 'REJECTED' | 'REVISED';
  currentStage?: string;
  stages: WorkflowStage[];
  approvers: string[]; // Email addresses
  approvals?: WorkflowApprovalEntity[];
  comments?: WorkflowComment[];
  submittedBy?: string;
  submittedAt?: Date;
  approvedAt?: Date;
  rejectedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface WorkflowStage {
  id: string;
  name: string;
  order: number;
  requiredApprovers?: string[];
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'SKIPPED';
}

export interface WorkflowApprovalEntity {
  id: string;
  workflowId: string;
  approverEmail: string;
  approverName?: string;
  role?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  comments?: string;
  approvedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface WorkflowComment {
  id: string;
  author: string;
  authorName?: string;
  content: string;
  createdAt: Date;
  stageId?: string;
}

