// Collaboration Domain Models

export interface CommentEntity {
  id: string;
  projectId: string;
  sectionId?: string; // Optional: comment on specific section
  artifactId?: string; // Optional: comment on artifact
  parentCommentId?: string; // For threaded comments/replies
  content: string;
  authorId: string;
  authorName: string;
  authorEmail: string;
  mentions?: string[]; // Array of user emails mentioned
  createdAt: Date;
  updatedAt: Date;
  editedAt?: Date;
  isResolved: boolean;
  resolvedAt?: Date;
  resolvedBy?: string;
}

export interface NotificationEntity {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  projectId?: string;
  sectionId?: string;
  commentId?: string;
  approvalId?: string;
  isRead: boolean;
  readAt?: Date;
  createdAt: Date;
  actionUrl?: string; // URL to navigate to relevant content
}

export type NotificationType =
  | 'COMMENT_MENTION'
  | 'COMMENT_REPLY'
  | 'COMMENT_RESOLVED'
  | 'APPROVAL_REQUESTED'
  | 'APPROVAL_APPROVED'
  | 'APPROVAL_REJECTED'
  | 'STATUS_CHANGED'
  | 'PROJECT_SHARED'
  | 'SECTION_GENERATED'
  | 'ARTIFACT_UPLOADED'
  | 'PROJECT_UPDATED';

export interface ActivityFeedEntity {
  id: string;
  projectId: string;
  userId: string;
  userName: string;
  userEmail: string;
  action: ActivityAction;
  entityType: 'project' | 'section' | 'artifact' | 'comment' | 'approval' | 'status';
  entityId: string;
  entityName?: string;
  description: string;
  metadata?: Record<string, any>;
  createdAt: Date;
}

export type ActivityAction =
  | 'PROJECT_CREATED'
  | 'PROJECT_UPDATED'
  | 'PROJECT_DELETED'
  | 'PROJECT_SHARED'
  | 'SECTION_CREATED'
  | 'SECTION_UPDATED'
  | 'SECTION_DELETED'
  | 'SECTION_GENERATED'
  | 'ARTIFACT_UPLOADED'
  | 'ARTIFACT_DELETED'
  | 'COMMENT_ADDED'
  | 'COMMENT_EDITED'
  | 'COMMENT_DELETED'
  | 'COMMENT_RESOLVED'
  | 'APPROVAL_REQUESTED'
  | 'APPROVAL_APPROVED'
  | 'APPROVAL_REJECTED'
  | 'STATUS_CHANGED'
  | 'USER_ADDED'
  | 'USER_REMOVED';

