// Enhanced Audit Logging Domain Models

export interface AuditLogEntity {
  id: string;
  timestamp: Date;
  userId: string; // User who performed the action
  userEmail: string;
  userName: string;
  action: AuditAction;
  entityType: AuditEntityType;
  entityId: string;
  entityName?: string;
  projectId?: string;
  ipAddress?: string;
  userAgent?: string;
  changes?: AuditChange[];
  metadata?: Record<string, any>;
  severity: AuditSeverity;
  result: 'SUCCESS' | 'FAILURE' | 'PARTIAL';
  errorMessage?: string;
}

export type AuditAction =
  | 'LOGIN'
  | 'LOGOUT'
  | 'LOGIN_FAILED'
  | 'PROJECT_CREATED'
  | 'PROJECT_UPDATED'
  | 'PROJECT_DELETED'
  | 'PROJECT_VIEWED'
  | 'PROJECT_EXPORTED'
  | 'SECTION_CREATED'
  | 'SECTION_UPDATED'
  | 'SECTION_DELETED'
  | 'SECTION_GENERATED'
  | 'ARTIFACT_UPLOADED'
  | 'ARTIFACT_DELETED'
  | 'ARTIFACT_VIEWED'
  | 'COMMENT_ADDED'
  | 'COMMENT_EDITED'
  | 'COMMENT_DELETED'
  | 'APPROVAL_REQUESTED'
  | 'APPROVAL_APPROVED'
  | 'APPROVAL_REJECTED'
  | 'STATUS_CHANGED'
  | 'USER_CREATED'
  | 'USER_UPDATED'
  | 'USER_DELETED'
  | 'ROLE_CHANGED'
  | 'PERMISSION_GRANTED'
  | 'PERMISSION_REVOKED'
  | 'ACCESS_DENIED'
  | 'EXPORT_GENERATED'
  | 'API_CALLED'
  | 'CONFIGURATION_CHANGED';

export type AuditEntityType =
  | 'USER'
  | 'PROJECT'
  | 'SECTION'
  | 'ARTIFACT'
  | 'COMMENT'
  | 'APPROVAL'
  | 'PERMISSION'
  | 'ROLE'
  | 'SYSTEM';

export type AuditSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface AuditChange {
  field: string;
  oldValue: string;
  newValue: string;
  dataType?: 'string' | 'number' | 'boolean' | 'date' | 'object';
}

export interface AuditLogFilter {
  userId?: string;
  projectId?: string;
  action?: AuditAction;
  entityType?: AuditEntityType;
  severity?: AuditSeverity;
  startDate?: Date;
  endDate?: Date;
  result?: 'SUCCESS' | 'FAILURE' | 'PARTIAL';
}

export interface AuditLogExport {
  format: 'CSV' | 'JSON' | 'PDF';
  filters?: AuditLogFilter;
  includeMetadata?: boolean;
}

