import { Database, FileCheck, GitBranch } from 'lucide-react';
import React, { useState } from 'react';
import { ProjectEntity } from '../../domain/entities/Project';
import CentralArchitectureRepository from './CentralArchitectureRepository';
import StandardsCompliance from './StandardsCompliance';
import VersioningBaselines from './VersioningBaselines';

interface RepositoryGovernanceProps {
  selectedProject?: ProjectEntity | null;
}

const RepositoryGovernance: React.FC<RepositoryGovernanceProps> = ({ selectedProject }) => {
  const [activeTab, setActiveTab] = useState<'repository' | 'versioning' | 'standards'>('repository');

  const tabs = [
    { 
      id: 'repository' as const, 
      label: 'Central Architecture Repository', 
      icon: <Database size={18} />,
      description: 'Metadata-driven repository with SQL + Graph DB hybrid storage'
    },
    { 
      id: 'versioning' as const, 
      label: 'Versioning & Baselines', 
      icon: <GitBranch size={18} />,
      description: 'Version control, baselines, and comparisons'
    },
    { 
      id: 'standards' as const, 
      label: 'Standards & Compliance', 
      icon: <FileCheck size={18} />,
      description: 'Principles, reference models, patterns, and compliance checks'
    }
  ];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
        <div className="flex items-center space-x-3 mb-2">
          <div className="bg-gradient-to-br from-purple-500 to-blue-500 p-2 rounded-lg">
            <Database size={24} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Repository & Governance</h1>
            <p className="text-sm text-gray-600">Central architecture repository, versioning, and compliance management</p>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white rounded-lg shadow-md border border-gray-200">
        <div className="flex border-b border-gray-200">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex flex-col items-center justify-center space-y-1 px-4 py-4 font-semibold transition-colors ${
                activeTab === tab.id
                  ? 'bg-gradient-to-r from-purple-50 to-blue-50 text-purple-700 border-b-2 border-purple-700'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center space-x-2">
                {tab.icon}
                <span>{tab.label}</span>
              </div>
              <p className="text-xs text-gray-500 font-normal">{tab.description}</p>
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'repository' && (
            <CentralArchitectureRepository selectedProject={selectedProject} />
          )}

          {activeTab === 'versioning' && (
            <VersioningBaselines selectedProject={selectedProject} />
          )}

          {activeTab === 'standards' && (
            <StandardsCompliance selectedProject={selectedProject} />
          )}
        </div>
      </div>
    </div>
  );
};

export default RepositoryGovernance;

