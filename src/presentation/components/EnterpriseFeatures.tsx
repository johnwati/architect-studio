import { Clock, FileCheck, Settings } from 'lucide-react';
import React, { useState } from 'react';
import { GeneratedSectionEntity, ProjectEntity } from '../../domain/entities/Project';
import AuditTrail from './AuditTrail';
import ComplianceChecker from './ComplianceChecker';
import DocumentStatusManager from './DocumentStatusManager';

interface EnterpriseFeaturesProps {
  project: ProjectEntity;
  sections: GeneratedSectionEntity[];
  generatedContent: { [sectionId: string]: string };
  onStatusChange: (status: string, version?: string) => Promise<void>;
  onProjectUpdate: (updates: Partial<ProjectEntity>) => Promise<void>;
}

const EnterpriseFeatures: React.FC<EnterpriseFeaturesProps> = ({
  project,
  sections,
  generatedContent,
  onStatusChange,
  onProjectUpdate
}) => {
  const [activeTab, setActiveTab] = useState<'status' | 'compliance' | 'audit'>('status');

  const tabs = [
    { id: 'status' as const, label: 'Status & Workflow', icon: <Settings size={18} /> },
    { id: 'compliance' as const, label: 'Compliance', icon: <FileCheck size={18} /> },
    { id: 'audit' as const, label: 'Audit Trail', icon: <Clock size={18} /> }
  ];

  return (
    <div className="space-y-4">
      {/* Tab Navigation */}
      <div className="bg-white rounded-lg shadow-md border border-gray-200">
        <div className="flex border-b border-gray-200">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center space-x-2 px-4 py-3 font-semibold transition-colors ${
                activeTab === tab.id
                  ? 'bg-purple-50 text-purple-700 border-b-2 border-purple-700'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'status' && (
            <DocumentStatusManager
              project={project}
              onStatusChange={async (status, version) => {
                await onStatusChange(status, version);
                if (version) {
                  await onProjectUpdate({ version, status });
                } else {
                  await onProjectUpdate({ status });
                }
              }}
            />
          )}

          {activeTab === 'compliance' && (
            <ComplianceChecker
              project={project}
              sections={sections}
              generatedContent={generatedContent}
            />
          )}

          {activeTab === 'audit' && (
            <AuditTrail
              project={project}
              sections={sections}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default EnterpriseFeatures;

