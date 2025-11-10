// User and Role-Based Access Control (RBAC) Domain Models

export type UserRole = 'ADMIN' | 'ARCHITECT' | 'REVIEWER' | 'VIEWER';

export interface UserEntity {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  department?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt?: Date;
}

export interface ProjectPermission {
  projectId: string;
  userId: string;
  permissions: Permission[];
  grantedAt: Date;
  grantedBy: string;
}

export type Permission =
  | 'VIEW_PROJECT'
  | 'EDIT_PROJECT'
  | 'DELETE_PROJECT'
  | 'CREATE_SECTION'
  | 'EDIT_SECTION'
  | 'DELETE_SECTION'
  | 'GENERATE_CONTENT'
  | 'UPLOAD_ARTIFACT'
  | 'DELETE_ARTIFACT'
  | 'MANAGE_APPROVERS'
  | 'APPROVE_DOCUMENT'
  | 'CHANGE_STATUS'
  | 'EXPORT_DOCUMENT'
  | 'VIEW_AUDIT_LOG'
  | 'MANAGE_USERS'
  | 'ADD_COMMENT'
  | 'EDIT_COMMENT'
  | 'DELETE_COMMENT';

// Role-based default permissions
export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  ADMIN: [
    'VIEW_PROJECT',
    'EDIT_PROJECT',
    'DELETE_PROJECT',
    'CREATE_SECTION',
    'EDIT_SECTION',
    'DELETE_SECTION',
    'GENERATE_CONTENT',
    'UPLOAD_ARTIFACT',
    'DELETE_ARTIFACT',
    'MANAGE_APPROVERS',
    'APPROVE_DOCUMENT',
    'CHANGE_STATUS',
    'EXPORT_DOCUMENT',
    'VIEW_AUDIT_LOG',
    'MANAGE_USERS',
    'ADD_COMMENT',
    'EDIT_COMMENT',
    'DELETE_COMMENT',
  ],
  ARCHITECT: [
    'VIEW_PROJECT',
    'EDIT_PROJECT',
    'CREATE_SECTION',
    'EDIT_SECTION',
    'DELETE_SECTION',
    'GENERATE_CONTENT',
    'UPLOAD_ARTIFACT',
    'DELETE_ARTIFACT',
    'MANAGE_APPROVERS',
    'APPROVE_DOCUMENT',
    'CHANGE_STATUS',
    'EXPORT_DOCUMENT',
    'VIEW_AUDIT_LOG',
    'ADD_COMMENT',
    'EDIT_COMMENT',
    'DELETE_COMMENT',
  ],
  REVIEWER: [
    'VIEW_PROJECT',
    'APPROVE_DOCUMENT',
    'VIEW_AUDIT_LOG',
    'ADD_COMMENT',
    'EDIT_COMMENT',
  ],
  VIEWER: [
    'VIEW_PROJECT',
    'VIEW_AUDIT_LOG',
    'ADD_COMMENT',
  ],
};

export function hasPermission(userRole: UserRole, permission: Permission): boolean {
  return ROLE_PERMISSIONS[userRole].includes(permission);
}

export function canAccessProject(
  userRole: UserRole,
  projectOwner?: string,
  userEmail?: string,
  customPermissions?: Permission[]
): boolean {
  // Admins can access all projects
  if (userRole === 'ADMIN') return true;
  
  // Project owners can always access their projects
  if (projectOwner && userEmail && projectOwner === userEmail) return true;
  
  // Check custom permissions if provided
  if (customPermissions && customPermissions.includes('VIEW_PROJECT')) return true;
  
  // Default role-based check
  return hasPermission(userRole, 'VIEW_PROJECT');
}

