import { Clock, FileEdit, Tag, User } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { GeneratedSectionEntity, ProjectEntity } from '../../domain/entities/Project';

interface AuditEntry {
  id: string;
  timestamp: Date;
  action: string;
  user?: string;
  entity: 'project' | 'section' | 'artifact' | 'approval';
  entityId: string;
  changes?: {
    field: string;
    oldValue: string;
    newValue: string;
  }[];
  metadata?: Record<string, any>;
}

interface AuditTrailProps {
  project: ProjectEntity;
  sections: GeneratedSectionEntity[];
}

const AuditTrail: React.FC<AuditTrailProps> = ({ project, sections }) => {
  const [auditEntries, setAuditEntries] = useState<AuditEntry[]>([]);

  useEffect(() => {
    // Generate audit trail from project and sections
    const entries: AuditEntry[] = [];

    // Project creation
    entries.push({
      id: crypto.randomUUID(),
      timestamp: project.createdAt,
      action: 'Project Created',
      entity: 'project',
      entityId: project.id,
      metadata: {
        name: project.name,
        description: project.description
      }
    });

    // Project updates
    if (project.updatedAt && project.updatedAt.getTime() !== project.createdAt.getTime()) {
      entries.push({
        id: crypto.randomUUID(),
        timestamp: project.updatedAt,
        action: 'Project Updated',
        entity: 'project',
        entityId: project.id,
        metadata: {
          version: project.version,
          status: project.status
        }
      });
    }

    // Status changes
    if (project.status) {
      entries.push({
        id: crypto.randomUUID(),
        timestamp: project.updatedAt,
        action: `Status Changed to ${project.status}`,
        entity: 'project',
        entityId: project.id,
        changes: [{
          field: 'status',
          oldValue: 'DRAFT',
          newValue: project.status
        }]
      });
    }

    // Section generations
    sections.forEach(section => {
      entries.push({
        id: crypto.randomUUID(),
        timestamp: section.generatedAt,
        action: 'Section Generated',
        entity: 'section',
        entityId: section.id,
        metadata: {
          sectionId: section.sectionId,
          sectionTitle: section.sectionTitle
        }
      });

      if (section.updatedAt && section.updatedAt.getTime() !== section.generatedAt.getTime()) {
        entries.push({
          id: crypto.randomUUID(),
          timestamp: section.updatedAt,
          action: 'Section Updated',
          entity: 'section',
          entityId: section.id,
          metadata: {
            sectionId: section.sectionId
          }
        });
      }
    });

    // Sort by timestamp (newest first)
    entries.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    setAuditEntries(entries);
  }, [project, sections]);

  const formatTimestamp = (date: Date) => {
    return new Intl.DateTimeFormat('en-GB', {
      dateStyle: 'medium',
      timeStyle: 'short'
    }).format(date);
  };

  const getActionIcon = (action: string) => {
    if (action.includes('Created')) return <FileEdit size={16} />;
    if (action.includes('Updated')) return <FileEdit size={16} />;
    if (action.includes('Status')) return <Tag size={16} />;
    return <Clock size={16} />;
  };

  const getActionColor = (action: string) => {
    if (action.includes('Created')) return 'text-blue-600 bg-blue-50';
    if (action.includes('Updated')) return 'text-green-600 bg-green-50';
    if (action.includes('Status')) return 'text-purple-600 bg-purple-50';
    return 'text-gray-600 bg-gray-50';
  };

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
      <div className="flex items-center space-x-3 mb-4">
        <Clock className="text-red-700" size={24} />
        <h3 className="text-lg font-semibold text-gray-800">Audit Trail</h3>
      </div>

      <div className="space-y-3 max-h-96 overflow-y-auto">
        {auditEntries.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-8">No audit entries available</p>
        ) : (
          auditEntries.map((entry) => (
            <div
              key={entry.id}
              className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-start space-x-3">
                <div className={`p-2 rounded-lg ${getActionColor(entry.action)}`}>
                  {getActionIcon(entry.action)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="font-semibold text-gray-800 text-sm">{entry.action}</h4>
                    <span className="text-xs text-gray-500">{formatTimestamp(entry.timestamp)}</span>
                  </div>
                  
                  {entry.user && (
                    <div className="flex items-center space-x-1 text-xs text-gray-600 mb-2">
                      <User size={12} />
                      <span>{entry.user}</span>
                    </div>
                  )}

                  {entry.changes && entry.changes.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {entry.changes.map((change, idx) => (
                        <div key={idx} className="text-xs text-gray-600">
                          <span className="font-medium">{change.field}:</span>{' '}
                          <span className="line-through text-red-600">{change.oldValue}</span>{' '}
                          → <span className="text-green-600">{change.newValue}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {entry.metadata && (
                    <div className="mt-2 text-xs text-gray-500">
                      {Object.entries(entry.metadata).map(([key, value]) => (
                        <span key={key} className="mr-3">
                          <span className="font-medium">{key}:</span> {String(value)}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="mt-2 text-xs">
                    <span className="px-2 py-1 bg-gray-100 rounded text-gray-600">
                      {entry.entity}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="mt-4 pt-4 border-t border-gray-200 text-xs text-gray-500 text-center">
        Showing {auditEntries.length} audit entry(ies)
      </div>
    </div>
  );
};

export default AuditTrail;

