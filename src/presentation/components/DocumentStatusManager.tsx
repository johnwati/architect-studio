import { AlertCircle, Archive, CheckCircle2, Clock, FileCheck, FileX } from 'lucide-react';
import React, { useState } from 'react';
import { DocumentStatus, ProjectEntity } from '../../domain/entities/Project';

interface DocumentStatusManagerProps {
  project: ProjectEntity;
  onStatusChange: (status: DocumentStatus, version?: string) => Promise<void>;
}

const DocumentStatusManager: React.FC<DocumentStatusManagerProps> = ({ project, onStatusChange }) => {
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const statusConfig: Record<DocumentStatus, { label: string; icon: React.ReactNode; color: string; description: string }> = {
    DRAFT: {
      label: 'Draft',
      icon: <FileX size={20} />,
      color: 'bg-gray-500',
      description: 'Document is being created and edited'
    },
    REVIEW: {
      label: 'In Review',
      icon: <Clock size={20} />,
      color: 'bg-yellow-500',
      description: 'Document is under review by stakeholders'
    },
    APPROVED: {
      label: 'Approved',
      icon: <CheckCircle2 size={20} />,
      color: 'bg-green-500',
      description: 'Document has been approved and is ready for publication'
    },
    PUBLISHED: {
      label: 'Published',
      icon: <FileCheck size={20} />,
      color: 'bg-blue-500',
      description: 'Document is published and available for use'
    },
    ARCHIVED: {
      label: 'Archived',
      icon: <Archive size={20} />,
      color: 'bg-gray-400',
      description: 'Document is archived and no longer active'
    }
  };

  const currentStatus = project.status || 'DRAFT';
  const currentConfig = statusConfig[currentStatus];

  const handleStatusChange = async (newStatus: DocumentStatus) => {
    if (newStatus === currentStatus) return;

    try {
      setIsUpdating(true);
      setError(null);

      // Determine version increment logic
      let newVersion = project.version || '1.0';
      if (newStatus === 'PUBLISHED' && currentStatus !== 'PUBLISHED') {
        // Increment version when publishing
        const versionParts = newVersion.split('.');
        const minor = parseInt(versionParts[1] || '0') + 1;
        newVersion = `${versionParts[0]}.${minor}`;
      } else if (newStatus === 'APPROVED' && currentStatus === 'DRAFT') {
        // Minor version bump for approval
        const versionParts = newVersion.split('.');
        const minor = parseInt(versionParts[1] || '0') + 1;
        newVersion = `${versionParts[0]}.${minor}`;
      }

      await onStatusChange(newStatus, newVersion);
    } catch (err: any) {
      setError(err.message || 'Failed to update document status');
    } finally {
      setIsUpdating(false);
    }
  };

  const getNextValidStatuses = (current: DocumentStatus): DocumentStatus[] => {
    const workflow: Record<DocumentStatus, DocumentStatus[]> = {
      DRAFT: ['REVIEW'],
      REVIEW: ['DRAFT', 'APPROVED'],
      APPROVED: ['PUBLISHED', 'DRAFT'],
      PUBLISHED: ['ARCHIVED', 'DRAFT'],
      ARCHIVED: ['DRAFT']
    };
    return workflow[current] || [];
  };

  const nextStatuses = getNextValidStatuses(currentStatus);

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Document Status & Workflow</h3>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start space-x-2">
          <AlertCircle className="text-red-600 flex-shrink-0 mt-0.5" size={20} />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Current Status */}
      <div className="mb-6">
        <div className="flex items-center space-x-3 mb-2">
          <div className={`p-2 rounded-lg ${currentConfig.color} text-white`}>
            {currentConfig.icon}
          </div>
          <div>
            <h4 className="font-semibold text-gray-800">Current Status: {currentConfig.label}</h4>
            <p className="text-sm text-gray-600">{currentConfig.description}</p>
          </div>
        </div>
        <div className="ml-12 text-sm text-gray-600">
          <p><strong>Version:</strong> {project.version || '1.0'}</p>
          {project.documentOwner && <p><strong>Owner:</strong> {project.documentOwner}</p>}
          {project.documentClassification && (
            <p><strong>Classification:</strong> {project.documentClassification}</p>
          )}
        </div>
      </div>

      {/* Status Workflow */}
      <div>
        <h4 className="text-sm font-semibold text-gray-700 mb-3">Change Status</h4>
        <div className="flex flex-wrap gap-2">
          {nextStatuses.map((status) => {
            const config = statusConfig[status];
            return (
              <button
                key={status}
                onClick={() => handleStatusChange(status)}
                disabled={isUpdating}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-white font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${config.color} hover:opacity-90`}
              >
                {config.icon}
                <span>Move to {config.label}</span>
              </button>
            );
          })}
        </div>
        {nextStatuses.length === 0 && (
          <p className="text-sm text-gray-500 italic">No status transitions available from current state.</p>
        )}
      </div>

      {/* Status Workflow Diagram */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <h4 className="text-sm font-semibold text-gray-700 mb-3">Workflow</h4>
        <div className="flex items-center space-x-2 text-xs text-gray-600">
          <span className={`px-2 py-1 rounded ${currentStatus === 'DRAFT' ? 'bg-gray-200 font-semibold' : 'bg-gray-100'}`}>
            Draft
          </span>
          <span>→</span>
          <span className={`px-2 py-1 rounded ${currentStatus === 'REVIEW' ? 'bg-yellow-200 font-semibold' : 'bg-gray-100'}`}>
            Review
          </span>
          <span>→</span>
          <span className={`px-2 py-1 rounded ${currentStatus === 'APPROVED' ? 'bg-green-200 font-semibold' : 'bg-gray-100'}`}>
            Approved
          </span>
          <span>→</span>
          <span className={`px-2 py-1 rounded ${currentStatus === 'PUBLISHED' ? 'bg-blue-200 font-semibold' : 'bg-gray-100'}`}>
            Published
          </span>
          <span>→</span>
          <span className={`px-2 py-1 rounded ${currentStatus === 'ARCHIVED' ? 'bg-gray-300 font-semibold' : 'bg-gray-100'}`}>
            Archived
          </span>
        </div>
      </div>
    </div>
  );
};

export default DocumentStatusManager;

