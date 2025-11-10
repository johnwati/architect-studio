import { GitBranch, GitCompare, Plus, Save, X } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { ProjectEntity } from '../../domain/entities/Project';
import { ArchitectureVersionEntity, BaselineEntity } from '../../domain/entities/Repository';
import { PrismaProjectRepository } from '../../infrastructure/repositories/PrismaProjectRepository';

interface VersioningBaselinesProps {
  selectedProject?: ProjectEntity | null;
}

const VersioningBaselines: React.FC<VersioningBaselinesProps> = ({ selectedProject }) => {
  const [baselines, setBaselines] = useState<BaselineEntity[]>([]);
  const [versions, setVersions] = useState<ArchitectureVersionEntity[]>([]);
  const [selectedBaseline, setSelectedBaseline] = useState<BaselineEntity | null>(null);
  const [comparisonBaseline, setComparisonBaseline] = useState<BaselineEntity | null>(null);
  const [showCreateBaseline, setShowCreateBaseline] = useState(false);
  const [showCreateVersion, setShowCreateVersion] = useState(false);
  const [newBaseline, setNewBaseline] = useState({
    name: '',
    description: '',
    releaseVersion: ''
  });
  const [newVersion, setNewVersion] = useState({
    version: '',
    description: '',
    repositoryId: ''
  });
  const repo = new PrismaProjectRepository();

  useEffect(() => {
    loadBaselines();
    loadVersions();
  }, [selectedProject]);

  const loadBaselines = async () => {
    try {
      // In a real implementation, this would fetch from the database
      const allBaselines: BaselineEntity[] = [];
      setBaselines(allBaselines);
    } catch (error) {
      console.error('Error loading baselines:', error);
    }
  };

  const loadVersions = async () => {
    try {
      // In a real implementation, this would fetch from the database
      const allVersions: ArchitectureVersionEntity[] = [];
      setVersions(allVersions);
    } catch (error) {
      console.error('Error loading versions:', error);
    }
  };

  const handleCreateBaseline = async () => {
    if (!newBaseline.name.trim() || !newBaseline.releaseVersion.trim()) {
      alert('Please provide a name and release version');
      return;
    }

    if (!selectedProject) {
      alert('Please select a project first');
      return;
    }

    try {
      const baseline: BaselineEntity = {
        id: `baseline-${Date.now()}`,
        name: newBaseline.name,
        description: newBaseline.description,
        releaseVersion: newBaseline.releaseVersion,
        projectId: selectedProject.id,
        createdAt: new Date(),
        isActive: true
      };

      setBaselines([...baselines, baseline]);
      setShowCreateBaseline(false);
      setNewBaseline({ name: '', description: '', releaseVersion: '' });
      alert(`Baseline "${baseline.name}" created successfully`);
    } catch (error) {
      console.error('Error creating baseline:', error);
      alert('Error creating baseline. Please try again.');
    }
  };

  const handleCreateVersion = async () => {
    if (!newVersion.version.trim() || !newVersion.repositoryId.trim()) {
      alert('Please provide a version and repository ID');
      return;
    }

    try {
      const version: ArchitectureVersionEntity = {
        id: `version-${Date.now()}`,
        repositoryId: newVersion.repositoryId,
        version: newVersion.version,
        description: newVersion.description,
        metadata: {},
        createdAt: new Date()
      };

      setVersions([...versions, version]);
      setShowCreateVersion(false);
      setNewVersion({ version: '', description: '', repositoryId: '' });
      alert(`Version "${version.version}" created successfully`);
    } catch (error) {
      console.error('Error creating version:', error);
      alert('Error creating version. Please try again.');
    }
  };

  const handleCompareBaselines = (baseline1: BaselineEntity, baseline2: BaselineEntity) => {
    setSelectedBaseline(baseline1);
    setComparisonBaseline(baseline2);
  };

  return (
    <div className="space-y-6">
      {/* Baselines Section */}
      <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-gray-800 flex items-center space-x-2">
              <GitBranch size={24} className="text-purple-600" />
              <span>Architecture Baselines</span>
            </h2>
            <p className="text-sm text-gray-600 mt-1">Create and manage architecture release baselines</p>
          </div>
          <button
            onClick={() => setShowCreateBaseline(true)}
            className="flex items-center space-x-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white px-4 py-2 rounded-lg hover:from-purple-700 hover:to-blue-700 transition-colors font-semibold"
          >
            <Plus size={18} />
            <span>Create Baseline</span>
          </button>
        </div>

        {baselines.length === 0 ? (
          <div className="text-center py-12">
            <GitBranch size={48} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-600 mb-2">No baselines created yet</p>
            <p className="text-sm text-gray-500">Create a baseline to capture the current state of your architecture</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {baselines.map((baseline) => (
              <div
                key={baseline.id}
                className="border border-gray-200 rounded-lg p-4 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-semibold text-gray-800">{baseline.name}</h3>
                    <p className="text-xs text-gray-500">Release {baseline.releaseVersion}</p>
                  </div>
                  {baseline.isActive && (
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                      Active
                    </span>
                  )}
                </div>
                {baseline.description && (
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">{baseline.description}</p>
                )}
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>{baseline.items?.length || 0} items</span>
                  <span>{new Date(baseline.createdAt).toLocaleDateString()}</span>
                </div>
                <div className="mt-3 flex space-x-2">
                  <button
                    onClick={() => setSelectedBaseline(baseline)}
                    className="flex-1 text-sm px-3 py-1.5 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors"
                  >
                    View
                  </button>
                  {baselines.length > 1 && (
                    <button
                      onClick={() => {
                        const otherBaseline = baselines.find(b => b.id !== baseline.id);
                        if (otherBaseline) {
                          handleCompareBaselines(baseline, otherBaseline);
                        }
                      }}
                      className="flex-1 text-sm px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors flex items-center justify-center space-x-1"
                    >
                      <GitCompare size={14} />
                      <span>Compare</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Versions Section */}
      <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-gray-800 flex items-center space-x-2">
              <Save size={24} className="text-blue-600" />
              <span>Version History</span>
            </h2>
            <p className="text-sm text-gray-600 mt-1">Track versions of models, views, and diagrams</p>
          </div>
          <button
            onClick={() => setShowCreateVersion(true)}
            className="flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-colors font-semibold"
          >
            <Plus size={18} />
            <span>Create Version</span>
          </button>
        </div>

        {versions.length === 0 ? (
          <div className="text-center py-12">
            <Save size={48} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-600 mb-2">No versions created yet</p>
            <p className="text-sm text-gray-500">Create versions to track changes to your architecture objects</p>
          </div>
        ) : (
          <div className="space-y-3">
            {versions.map((version) => (
              <div
                key={version.id}
                className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="font-semibold text-gray-800">v{version.version}</span>
                      <span className="text-xs text-gray-500">Repository: {version.repositoryId.substring(0, 8)}...</span>
                    </div>
                    {version.description && (
                      <p className="text-sm text-gray-600 mb-2">{version.description}</p>
                    )}
                    <div className="flex items-center space-x-4 text-xs text-gray-500">
                      <span>Created: {new Date(version.createdAt).toLocaleString()}</span>
                      {version.createdBy && <span>By: {version.createdBy}</span>}
                    </div>
                  </div>
                  {version.baselineId && (
                    <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">
                      In Baseline
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Baseline Modal */}
      {showCreateBaseline && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-800">Create Architecture Baseline</h2>
              <button
                onClick={() => setShowCreateBaseline(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Baseline Name *
                </label>
                <input
                  type="text"
                  value={newBaseline.name}
                  onChange={(e) => setNewBaseline({ ...newBaseline, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  placeholder="e.g., Architecture Release 1.0"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Release Version *
                </label>
                <input
                  type="text"
                  value={newBaseline.releaseVersion}
                  onChange={(e) => setNewBaseline({ ...newBaseline, releaseVersion: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  placeholder="e.g., 1.0"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={newBaseline.description}
                  onChange={(e) => setNewBaseline({ ...newBaseline, description: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  rows={3}
                  placeholder="Describe what this baseline represents..."
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  onClick={() => setShowCreateBaseline(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 font-semibold"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateBaseline}
                  disabled={!newBaseline.name.trim() || !newBaseline.releaseVersion.trim()}
                  className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
                >
                  Create Baseline
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Version Modal */}
      {showCreateVersion && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-800">Create Version</h2>
              <button
                onClick={() => setShowCreateVersion(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Repository ID *
                </label>
                <input
                  type="text"
                  value={newVersion.repositoryId}
                  onChange={(e) => setNewVersion({ ...newVersion, repositoryId: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  placeholder="Enter repository ID"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Version *
                </label>
                <input
                  type="text"
                  value={newVersion.version}
                  onChange={(e) => setNewVersion({ ...newVersion, version: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  placeholder="e.g., 1.0, 1.1, 2.0"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={newVersion.description}
                  onChange={(e) => setNewVersion({ ...newVersion, description: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  rows={3}
                  placeholder="Describe the changes in this version..."
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  onClick={() => setShowCreateVersion(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 font-semibold"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateVersion}
                  disabled={!newVersion.version.trim() || !newVersion.repositoryId.trim()}
                  className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
                >
                  Create Version
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Comparison View */}
      {selectedBaseline && comparisonBaseline && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-800">Baseline Comparison</h2>
              <button
                onClick={() => {
                  setSelectedBaseline(null);
                  setComparisonBaseline(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold text-gray-800 mb-3">{selectedBaseline.name}</h3>
                <div className="space-y-2">
                  <p className="text-sm text-gray-600"><strong>Release:</strong> {selectedBaseline.releaseVersion}</p>
                  <p className="text-sm text-gray-600"><strong>Items:</strong> {selectedBaseline.items?.length || 0}</p>
                  <p className="text-sm text-gray-600"><strong>Created:</strong> {new Date(selectedBaseline.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
              <div>
                <h3 className="font-semibold text-gray-800 mb-3">{comparisonBaseline.name}</h3>
                <div className="space-y-2">
                  <p className="text-sm text-gray-600"><strong>Release:</strong> {comparisonBaseline.releaseVersion}</p>
                  <p className="text-sm text-gray-600"><strong>Items:</strong> {comparisonBaseline.items?.length || 0}</p>
                  <p className="text-sm text-gray-600"><strong>Created:</strong> {new Date(comparisonBaseline.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
            </div>

            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Note:</strong> Detailed comparison of items and changes will be displayed here in a full implementation.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VersioningBaselines;

