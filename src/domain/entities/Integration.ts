// Integration Domain Models

export interface IntegrationEntity {
  id: string;
  type: IntegrationType;
  name: string;
  description?: string;
  isActive: boolean;
  config: Record<string, any>; // Integration-specific configuration
  credentials?: Record<string, string>; // Encrypted credentials
  projectId?: string; // Optional: project-specific integration
  createdAt: Date;
  updatedAt: Date;
  lastSyncAt?: Date;
  lastSyncStatus?: 'SUCCESS' | 'FAILURE';
  lastSyncError?: string;
}

export type IntegrationType =
  | 'SHAREPOINT'
  | 'JIRA'
  | 'CONFLUENCE'
  | 'AZURE_DEVOPS'
  | 'SLACK'
  | 'TEAMS'
  | 'EMAIL'
  | 'WEBHOOK'
  | 'REST_API'
  | 'GRAPHQL_API';

export interface SharePointIntegrationConfig {
  siteUrl: string;
  libraryName: string;
  folderPath?: string;
  syncDirection: 'UPLOAD' | 'DOWNLOAD' | 'BIDIRECTIONAL';
  syncOnPublish: boolean;
  documentSetName?: string;
}

export interface JiraIntegrationConfig {
  serverUrl: string;
  projectKey: string;
  issueType?: string;
  syncDirection: 'UPLOAD' | 'DOWNLOAD' | 'BIDIRECTIONAL';
  createIssueOnPublish: boolean;
  updateIssueOnStatusChange: boolean;
  linkField?: string;
}

export interface WebhookIntegrationConfig {
  url: string;
  method: 'POST' | 'PUT' | 'PATCH';
  headers?: Record<string, string>;
  events: WebhookEvent[];
  secret?: string; // For signature verification
  retryOnFailure: boolean;
  maxRetries?: number;
}

export type WebhookEvent =
  | 'PROJECT_CREATED'
  | 'PROJECT_UPDATED'
  | 'PROJECT_PUBLISHED'
  | 'SECTION_GENERATED'
  | 'STATUS_CHANGED'
  | 'APPROVAL_APPROVED'
  | 'APPROVAL_REJECTED'
  | 'COMMENT_ADDED'
  | 'ARTIFACT_UPLOADED';

export interface IntegrationSyncResult {
  integrationId: string;
  syncType: 'UPLOAD' | 'DOWNLOAD' | 'BIDIRECTIONAL';
  status: 'SUCCESS' | 'FAILURE' | 'PARTIAL';
  itemsProcessed: number;
  itemsSucceeded: number;
  itemsFailed: number;
  errors?: string[];
  startedAt: Date;
  completedAt: Date;
  duration: number; // milliseconds
}

export interface IntegrationMapping {
  projectId: string;
  integrationId: string;
  externalId: string; // ID in external system (e.g., SharePoint item ID, Jira issue key)
  externalType: string; // Type in external system
  syncMetadata?: Record<string, any>;
  lastSyncedAt: Date;
}

