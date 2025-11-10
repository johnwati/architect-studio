import { Database, GitBranch, Plus, Search, Tag, X } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { ProjectEntity } from '../../domain/entities/Project';
import { ArchitectureRepositoryEntity } from '../../domain/entities/Repository';
import { PrismaProjectRepository } from '../../infrastructure/repositories/PrismaProjectRepository';

interface CentralArchitectureRepositoryProps {
  selectedProject?: ProjectEntity | null;
}

const CentralArchitectureRepository: React.FC<CentralArchitectureRepositoryProps> = ({ selectedProject }) => {
  const [repositories, setRepositories] = useState<ArchitectureRepositoryEntity[]>([]);
  const [filteredRepositories, setFilteredRepositories] = useState<ArchitectureRepositoryEntity[]>([]);
  const [selectedRepository, setSelectedRepository] = useState<ArchitectureRepositoryEntity | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showReuseModal, setShowReuseModal] = useState(false);
  const [newRepository, setNewRepository] = useState({
    name: '',
    description: '',
    objectType: 'component',
    objectId: '',
    tags: [] as string[],
    isReusable: true
  });
  const [newTag, setNewTag] = useState('');
  const repo = new PrismaProjectRepository();

  useEffect(() => {
    loadRepositories();
  }, [selectedProject]);

  useEffect(() => {
    filterRepositories();
  }, [searchQuery, filterType, repositories]);

  const loadRepositories = async () => {
    try {
      // In a real implementation, this would fetch from the database
      // For now, we'll use mock data structure
      const allRepos: ArchitectureRepositoryEntity[] = [];
      setRepositories(allRepos);
    } catch (error) {
      console.error('Error loading repositories:', error);
    }
  };

  const filterRepositories = () => {
    let filtered = repositories;

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(r => 
        r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    // Filter by type
    if (filterType !== 'all') {
      filtered = filtered.filter(r => r.objectType === filterType);
    }

    setFilteredRepositories(filtered);
  };

  const handleCreateRepository = async () => {
    if (!newRepository.name.trim()) return;

    try {
      // In a real implementation, this would save to the database
      const repository: ArchitectureRepositoryEntity = {
        id: `repo-${Date.now()}`,
        name: newRepository.name,
        description: newRepository.description,
        metadata: {},
        objectType: newRepository.objectType,
        objectId: newRepository.objectId || `obj-${Date.now()}`,
        tags: newRepository.tags,
        isReusable: newRepository.isReusable,
        reuseCount: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      setRepositories([...repositories, repository]);
      setShowCreateModal(false);
      setNewRepository({
        name: '',
        description: '',
        objectType: 'component',
        objectId: '',
        tags: [],
        isReusable: true
      });
    } catch (error) {
      console.error('Error creating repository:', error);
      alert('Error creating repository. Please try again.');
    }
  };

  const handleAddTag = () => {
    if (newTag.trim() && !newRepository.tags.includes(newTag.trim())) {
      setNewRepository({
        ...newRepository,
        tags: [...newRepository.tags, newTag.trim()]
      });
      setNewTag('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    setNewRepository({
      ...newRepository,
      tags: newRepository.tags.filter(t => t !== tag)
    });
  };

  const handleReuseRepository = (repository: ArchitectureRepositoryEntity) => {
    if (!selectedProject) {
      alert('Please select a project first');
      return;
    }

    // In a real implementation, this would increment reuse count and create a reference
    const updated = repositories.map(r => 
      r.id === repository.id 
        ? { ...r, reuseCount: r.reuseCount + 1 }
        : r
    );
    setRepositories(updated);
    setShowReuseModal(false);
    alert(`Repository "${repository.name}" has been reused in project "${selectedProject.name}"`);
  };

  const objectTypes = [
    { value: 'all', label: 'All Types' },
    { value: 'diagram', label: 'Diagrams' },
    { value: 'component', label: 'Components' },
    { value: 'relationship', label: 'Relationships' },
    { value: 'pattern', label: 'Patterns' },
    { value: 'service', label: 'Services' },
    { value: 'api', label: 'APIs' }
  ];

  return (
    <div className="space-y-4">
      {/* Search and Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Search repositories by name, description, or tags..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
          />
        </div>
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
        >
          {objectTypes.map(type => (
            <option key={type.value} value={type.value}>{type.label}</option>
          ))}
        </select>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center space-x-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white px-4 py-2 rounded-lg hover:from-purple-700 hover:to-blue-700 transition-colors font-semibold"
        >
          <Plus size={18} />
          <span>Add to Repository</span>
        </button>
      </div>

      {/* Repository Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredRepositories.map((repository) => (
          <div
            key={repository.id}
            className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => setSelectedRepository(repository)}
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center space-x-2">
                <div className="bg-purple-100 p-2 rounded-lg">
                  <Database size={18} className="text-purple-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800">{repository.name}</h3>
                  <p className="text-xs text-gray-500">{repository.objectType}</p>
                </div>
              </div>
              {repository.isReusable && (
                <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                  Reusable
                </span>
              )}
            </div>
            
            {repository.description && (
              <p className="text-sm text-gray-600 mb-3 line-clamp-2">{repository.description}</p>
            )}

            <div className="flex items-center justify-between text-xs text-gray-500">
              <div className="flex items-center space-x-1">
                <GitBranch size={14} />
                <span>{repository.reuseCount} uses</span>
              </div>
              {repository.tags && repository.tags.length > 0 && (
                <div className="flex items-center space-x-1">
                  <Tag size={14} />
                  <span>{repository.tags.length} tags</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {filteredRepositories.length === 0 && (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <Database size={48} className="mx-auto text-gray-300 mb-4" />
          <p className="text-gray-600 mb-2">No repositories found</p>
          <p className="text-sm text-gray-500">
            {searchQuery ? 'Try adjusting your search criteria' : 'Start by adding diagrams, components, or patterns to the repository'}
          </p>
        </div>
      )}

      {/* Create Repository Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-800">Add to Architecture Repository</h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Name *
                </label>
                <input
                  type="text"
                  value={newRepository.name}
                  onChange={(e) => setNewRepository({ ...newRepository, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  placeholder="e.g., Payment Service Component"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={newRepository.description}
                  onChange={(e) => setNewRepository({ ...newRepository, description: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  rows={3}
                  placeholder="Describe this architecture object..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Object Type *
                  </label>
                  <select
                    value={newRepository.objectType}
                    onChange={(e) => setNewRepository({ ...newRepository, objectType: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  >
                    {objectTypes.slice(1).map(type => (
                      <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Object ID
                  </label>
                  <input
                    type="text"
                    value={newRepository.objectId}
                    onChange={(e) => setNewRepository({ ...newRepository, objectId: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    placeholder="Auto-generated if empty"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Tags
                </label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    placeholder="Add a tag and press Enter"
                  />
                  <button
                    onClick={handleAddTag}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                  >
                    Add
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {newRepository.tags.map(tag => (
                    <span
                      key={tag}
                      className="inline-flex items-center space-x-1 bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-sm"
                    >
                      <span>{tag}</span>
                      <button
                        onClick={() => handleRemoveTag(tag)}
                        className="hover:text-purple-900"
                      >
                        <X size={14} />
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="isReusable"
                  checked={newRepository.isReusable}
                  onChange={(e) => setNewRepository({ ...newRepository, isReusable: e.target.checked })}
                  className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                />
                <label htmlFor="isReusable" className="text-sm text-gray-700">
                  Mark as reusable across projects
                </label>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 font-semibold"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateRepository}
                  disabled={!newRepository.name.trim()}
                  className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
                >
                  Add to Repository
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Repository Detail Modal */}
      {selectedRepository && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-800">{selectedRepository.name}</h2>
              <button
                onClick={() => setSelectedRepository(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>

            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Description</h3>
                <p className="text-gray-600">{selectedRepository.description || 'No description provided'}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">Object Type</h3>
                  <p className="text-gray-600">{selectedRepository.objectType}</p>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">Reuse Count</h3>
                  <p className="text-gray-600">{selectedRepository.reuseCount} projects</p>
                </div>
              </div>

              {selectedRepository.tags && selectedRepository.tags.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">Tags</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedRepository.tags.map(tag => (
                      <span
                        key={tag}
                        className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-sm"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {selectedRepository.relationships && selectedRepository.relationships.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">Relationships</h3>
                  <div className="space-y-2">
                    {selectedRepository.relationships.map((rel, idx) => (
                      <div key={idx} className="bg-gray-50 p-3 rounded-lg">
                        <p className="text-sm text-gray-700">
                          <span className="font-semibold">{rel.type}</span> → {rel.targetType} ({rel.targetId})
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-end space-x-3 pt-4 border-t">
                <button
                  onClick={() => {
                    setShowReuseModal(true);
                    setSelectedRepository(null);
                  }}
                  className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 font-semibold"
                >
                  Reuse in Current Project
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CentralArchitectureRepository;

