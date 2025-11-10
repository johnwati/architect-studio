import { BarChart3, BookOpen, Bot, ChevronRight, Database, FileCheck, FileText, FolderOpen, Image, Layers, Map, Menu, Package, Palette, Plus, Sparkles, User, X } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { ProjectEntity } from '../../domain/entities/Project';
import { PrismaProjectRepository } from '../../infrastructure/repositories/PrismaProjectRepository';

import { ProjectArtifactEntity } from '../../domain/entities/Project';

interface SidebarProps {
  selectedProject: ProjectEntity | null;
  onProjectSelect: (project: ProjectEntity | null) => void;
  onViewChange: (view: 'sdd' | 'artifacts' | 'drawio' | 'uml' | 'adr' | 'approvers' | 'database' | 'templates' | 'cover-templates' | 'architecture' | 'modeling-studio' | 'repository-governance' | 'ai-capabilities' | 'analysis' | 'knowledge-base') => void;
  currentView: 'sdd' | 'artifacts' | 'drawio' | 'uml' | 'adr' | 'approvers' | 'database' | 'templates' | 'cover-templates' | 'architecture' | 'modeling-studio' | 'repository-governance' | 'ai-capabilities' | 'analysis' | 'knowledge-base';
  onProjectCreated?: () => void;
  onArtifactSelect?: (artifact: ProjectArtifactEntity) => void;
  artifacts?: ProjectArtifactEntity[];
}

type ViewType = 'sdd' | 'artifacts' | 'drawio' | 'uml' | 'adr' | 'approvers' | 'database' | 'templates' | 'cover-templates' | 'architecture' | 'modeling-studio' | 'repository-governance' | 'ai-capabilities' | 'analysis' | 'knowledge-base';

const Sidebar: React.FC<SidebarProps> = ({ selectedProject, onProjectSelect, onViewChange, currentView, onProjectCreated, onArtifactSelect, artifacts = [] }) => {
  const [projects, setProjects] = useState<ProjectEntity[]>([]);
  const [expandedProjects, setExpandedProjects] = useState<{ [key: string]: boolean }>({});
  const [expandedArtifacts, setExpandedArtifacts] = useState<{ [key: string]: boolean }>({});
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDesc, setNewProjectDesc] = useState('');
  const repo = new PrismaProjectRepository();

  useEffect(() => {
    loadProjects();
  }, []);

  // Reset expanded artifacts when project changes
  useEffect(() => {
    if (selectedProject) {
      setExpandedArtifacts({});
    }
  }, [selectedProject]);

  const loadProjects = async () => {
    const allProjects = await repo.getAllProjects();
    setProjects(allProjects);
    // Auto-expand selected project
    if (selectedProject) {
      setExpandedProjects(prev => ({ ...prev, [selectedProject.id]: true }));
    }
  };

  const handleProjectClick = (project: ProjectEntity) => {
    if (selectedProject?.id === project.id) {
      onProjectSelect(null);
    } else {
      onProjectSelect(project);
      setExpandedProjects(prev => ({ ...prev, [project.id]: true }));
    }
  };

  const handleViewClick = (view: ViewType, e: React.MouseEvent) => {
    e.stopPropagation();
    if (selectedProject) {
      onViewChange(view);
    }
  };

  const createProject = async () => {
    if (!newProjectName.trim()) return;
    
    await repo.createProject({
      name: newProjectName.trim(),
      description: newProjectDesc.trim()
    });
    
    setNewProjectName('');
    setNewProjectDesc('');
    setShowCreateModal(false);
    await loadProjects();
    if (onProjectCreated) onProjectCreated();
  };

  return (
    <>
      {/* Mobile toggle button */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="fixed top-4 left-4 z-50 lg:hidden glass p-2 rounded-lg shadow-lg border border-purple-500/30 hover:bg-white/10 transition-all"
      >
        {sidebarOpen ? <X size={20} className="text-purple-200" /> : <Menu size={20} className="text-purple-200" />}
      </button>

      {/* Sidebar - Futuristic Design */}
      <div
        className={`fixed left-0 top-0 h-full glass-dark border-r border-white/10 shadow-2xl z-40 transition-transform duration-300 backdrop-blur-xl ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0 w-72 overflow-y-auto`}
        style={{ isolation: 'isolate' }}
      >
        {/* Sidebar Header */}
        <div className="p-4 border-b border-purple-500/30 bg-gradient-to-r from-purple-600/30 via-blue-600/30 to-purple-600/30 text-white sticky top-0 z-10 backdrop-blur-xl">
          <div className="flex items-center space-x-3">
            <div className="bg-gradient-to-br from-purple-500 to-blue-500 p-2 rounded-lg shadow-lg">
              <FolderOpen size={18} className="text-white" />
            </div>
            <div>
              <h1 className="text-base font-bold leading-tight text-gradient bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent">Equity Bank</h1>
              <p className="text-xs text-purple-200/80 leading-tight">Architect Studio</p>
            </div>
          </div>
        </div>

        {/* Global Menu Items */}
        <div className="p-3 border-b border-white/10">
          <div className="space-y-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onViewChange('modeling-studio');
              }}
              className={`w-full flex items-center space-x-2 px-3 py-2 rounded-lg text-sm transition-all ${
                currentView === 'modeling-studio'
                  ? 'bg-gradient-to-r from-purple-600/30 to-blue-600/30 text-white border border-purple-400/50 font-medium shadow-lg'
                  : 'hover:bg-white/5 text-purple-200/80 hover:text-purple-200 border border-transparent'
              }`}
            >
              <Layers size={16} />
              <span>Architecture Modeling Studio</span>
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onViewChange('architecture');
                onProjectSelect(null);
              }}
              className={`w-full flex items-center space-x-2 px-3 py-2 rounded-lg text-sm transition-all ${
                currentView === 'architecture'
                  ? 'bg-gradient-to-r from-purple-600/30 to-blue-600/30 text-white border border-purple-400/50 font-medium shadow-lg'
                  : 'hover:bg-white/5 text-purple-200/80 hover:text-purple-200 border border-transparent'
              }`}
            >
              <Map size={16} />
              <span>Enterprise Architecture</span>
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onViewChange('templates');
                onProjectSelect(null);
              }}
              className={`w-full flex items-center space-x-2 px-3 py-2 rounded-lg text-sm transition-all ${
                currentView === 'templates'
                  ? 'bg-gradient-to-r from-purple-600/30 to-blue-600/30 text-white border border-purple-400/50 font-medium shadow-lg'
                  : 'hover:bg-white/5 text-purple-200/80 hover:text-purple-200 border border-transparent'
              }`}
            >
              <Sparkles size={16} />
              <span>Templates</span>
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onViewChange('cover-templates');
                onProjectSelect(null);
              }}
              className={`w-full flex items-center space-x-2 px-3 py-2 rounded-lg text-sm transition-all ${
                currentView === 'cover-templates'
                  ? 'bg-gradient-to-r from-purple-600/30 to-blue-600/30 text-white border border-purple-400/50 font-medium shadow-lg'
                  : 'hover:bg-white/5 text-purple-200/80 hover:text-purple-200 border border-transparent'
              }`}
            >
              <Palette size={16} />
              <span>Cover Page Designer</span>
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onViewChange('database');
                onProjectSelect(null);
              }}
              className={`w-full flex items-center space-x-2 px-3 py-2 rounded-lg text-sm transition-all ${
                currentView === 'database'
                  ? 'bg-gradient-to-r from-purple-600/30 to-blue-600/30 text-white border border-purple-400/50 font-medium shadow-lg'
                  : 'hover:bg-white/5 text-purple-200/80 hover:text-purple-200 border border-transparent'
              }`}
            >
              <Database size={16} />
              <span>Database</span>
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onViewChange('ai-capabilities');
              }}
              className={`w-full flex items-center space-x-2 px-3 py-2 rounded-lg text-sm transition-all ${
                currentView === 'ai-capabilities'
                  ? 'bg-gradient-to-r from-purple-600/30 to-blue-600/30 text-white border border-purple-400/50 font-medium shadow-lg'
                  : 'hover:bg-white/5 text-purple-200/80 hover:text-purple-200 border border-transparent'
              }`}
            >
              <Bot size={16} />
              <span>AI-Driven Capabilities</span>
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onViewChange('repository-governance');
              }}
              className={`w-full flex items-center space-x-2 px-3 py-2 rounded-lg text-sm transition-all ${
                currentView === 'repository-governance'
                  ? 'bg-gradient-to-r from-purple-600/30 to-blue-600/30 text-white border border-purple-400/50 font-medium shadow-lg'
                  : 'hover:bg-white/5 text-purple-200/80 hover:text-purple-200 border border-transparent'
              }`}
            >
              <FileCheck size={16} />
              <span>Repository & Governance</span>
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onViewChange('knowledge-base');
                onProjectSelect(null);
              }}
              className={`w-full flex items-center space-x-2 px-3 py-2 rounded-lg text-sm transition-all ${
                currentView === 'knowledge-base'
                  ? 'bg-gradient-to-r from-purple-600/30 to-blue-600/30 text-white border border-purple-400/50 font-medium shadow-lg'
                  : 'hover:bg-white/5 text-purple-200/80 hover:text-purple-200 border border-transparent'
              }`}
            >
              <BookOpen size={16} />
              <span>Architecture Knowledge Base</span>
            </button>
          </div>
        </div>

        {/* Projects Section */}
        <div className="p-3">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <FolderOpen size={16} className="text-purple-400" />
              <h2 className="text-sm font-semibold text-purple-200 uppercase tracking-wide">Projects</h2>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="p-1.5 text-purple-300 hover:bg-purple-500/20 rounded-lg transition-all border border-purple-500/30 hover:border-purple-400/50"
              title="Create New Project"
            >
              <Plus size={16} />
            </button>
          </div>

          {projects.length === 0 ? (
            <p className="text-xs text-purple-300/60 italic px-2">No projects yet</p>
          ) : (
            <div className="space-y-0.5">
              {projects.map((project) => (
                <div key={project.id}>
                  <button
                    onClick={() => handleProjectClick(project)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-all ${
                      selectedProject?.id === project.id
                        ? 'bg-gradient-to-r from-purple-600/30 to-blue-600/30 text-white font-semibold border border-purple-400/50 shadow-lg'
                        : 'hover:bg-white/5 text-purple-200/80 hover:text-purple-200 border border-transparent hover:border-purple-500/30'
                    }`}
                  >
                    <div className="flex items-center space-x-2 flex-1 min-w-0">
                      <ChevronRight
                        size={14}
                        className={`transition-transform flex-shrink-0 ${
                          expandedProjects[project.id] ? 'rotate-90' : ''
                        }`}
                      />
                      <span className="truncate text-sm">{project.name}</span>
                    </div>
                  </button>

                  {selectedProject?.id === project.id && expandedProjects[project.id] && (
                    <div className="ml-4 mt-2 space-y-1 border-l-2 border-purple-500/30 pl-3">
                      {/* SDD Document */}
                      <button
                        onClick={(e) => handleViewClick('sdd', e)}
                        className={`w-full flex items-center space-x-2 px-3 py-2 rounded-lg text-sm transition-all ${
                          currentView === 'sdd'
                            ? 'bg-gradient-to-r from-purple-600/30 to-blue-600/30 text-white border border-purple-400/50 font-medium'
                            : 'hover:bg-white/5 text-purple-200/70 hover:text-purple-200 border border-transparent'
                        }`}
                      >
                        <FileText size={14} />
                        <span>SDD Document</span>
                      </button>

                      {/* Project Artifacts - with nested list */}
                      <div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setExpandedArtifacts(prev => ({ ...prev, [project.id]: !prev[project.id] }));
                            if (!expandedArtifacts[project.id]) {
                              handleViewClick('artifacts', e);
                            }
                          }}
                          className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-all ${
                            currentView === 'artifacts'
                              ? 'bg-gradient-to-r from-purple-600/30 to-blue-600/30 text-white border border-purple-400/50 font-medium'
                              : 'hover:bg-white/5 text-purple-200/70 hover:text-purple-200 border border-transparent'
                          }`}
                        >
                          <div className="flex items-center space-x-2">
                            <Package size={14} />
                            <span>Business Artifacts</span>
                            {artifacts.length > 0 && (
                              <span className="text-xs glass text-purple-200 px-1.5 py-0.5 rounded-full border border-purple-500/30">
                                {artifacts.length}
                              </span>
                            )}
                          </div>
                          <ChevronRight
                            size={12}
                            className={`transition-transform flex-shrink-0 ${
                              expandedArtifacts[project.id] ? 'rotate-90' : ''
                            }`}
                          />
                        </button>
                        
                        {/* Artifacts List */}
                        {expandedArtifacts[project.id] && artifacts.length > 0 && (
                          <div className="ml-3 mt-1 space-y-1 border-l-2 border-purple-500/20 pl-3">
                            {artifacts.map((artifact) => (
                              <button
                                key={artifact.id}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (onArtifactSelect) {
                                    onArtifactSelect(artifact);
                                  }
                                  handleViewClick('artifacts', e);
                                }}
                                className="w-full flex items-center space-x-2 px-2 py-1.5 rounded-lg text-xs hover:bg-white/5 text-purple-200/70 hover:text-purple-200 transition-all text-left border border-transparent hover:border-purple-500/20"
                                title={artifact.fileName}
                              >
                                <FileText size={11} className="text-purple-400/60 flex-shrink-0" />
                                <span className="truncate flex-1">{artifact.fileName}</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Technology Artifacts */}
                      <button
                        onClick={(e) => handleViewClick('drawio', e)}
                        className={`w-full flex items-center space-x-2 px-3 py-2 rounded-lg text-sm transition-all ${
                          currentView === 'drawio'
                            ? 'bg-gradient-to-r from-purple-600/30 to-blue-600/30 text-white border border-purple-400/50 font-medium'
                            : 'hover:bg-white/5 text-purple-200/70 hover:text-purple-200 border border-transparent'
                        }`}
                      >
                        <Image size={14} />
                        <span>Technology Artifacts</span>
                      </button>

                      {/* UML (PlantUML) */}
                      <button
                        onClick={(e) => handleViewClick('uml', e)}
                        className={`w-full flex items-center space-x-2 px-3 py-2 rounded-lg text-sm transition-all ${
                          currentView === 'uml'
                            ? 'bg-gradient-to-r from-purple-600/30 to-blue-600/30 text-white border border-purple-400/50 font-medium'
                            : 'hover:bg-white/5 text-purple-200/70 hover:text-purple-200 border border-transparent'
                        }`}
                      >
                        <Layers size={14} />
                        <span>UML Diagrams</span>
                      </button>

                      {/* Architecture Decision Records */}
                      <button
                        onClick={(e) => handleViewClick('adr', e)}
                        className={`w-full flex items-center space-x-2 px-3 py-2 rounded-lg text-sm transition-all ${
                          currentView === 'adr'
                            ? 'bg-gradient-to-r from-purple-600/30 to-blue-600/30 text-white border border-purple-400/50 font-medium'
                            : 'hover:bg-white/5 text-purple-200/70 hover:text-purple-200 border border-transparent'
                        }`}
                      >
                        <FileText size={14} />
                        <span>ADRs</span>
                      </button>

                      {/* Approvers */}
                      <button
                        onClick={(e) => handleViewClick('approvers', e)}
                        className={`w-full flex items-center space-x-2 px-3 py-2 rounded-lg text-sm transition-all ${
                          currentView === 'approvers'
                            ? 'bg-gradient-to-r from-purple-600/30 to-blue-600/30 text-white border border-purple-400/50 font-medium'
                            : 'hover:bg-white/5 text-purple-200/70 hover:text-purple-200 border border-transparent'
                        }`}
                      >
                        <User size={14} />
                        <span>Approvers</span>
                      </button>

                      {/* Analysis & Reporting */}
                      <button
                        onClick={(e) => handleViewClick('analysis', e)}
                        className={`w-full flex items-center space-x-2 px-3 py-2 rounded-lg text-sm transition-all ${
                          currentView === 'analysis'
                            ? 'bg-gradient-to-r from-purple-600/30 to-blue-600/30 text-white border border-purple-400/50 font-medium'
                            : 'hover:bg-white/5 text-purple-200/70 hover:text-purple-200 border border-transparent'
                        }`}
                      >
                        <BarChart3 size={14} />
                        <span>Analysis & Reporting</span>
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Create Project Modal - Using Portal */}
      {showCreateModal && createPortal(
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowCreateModal(false);
              setNewProjectName('');
              setNewProjectDesc('');
            }
          }}
        >
          <div 
            className="glass-dark rounded-2xl border border-white/10 shadow-2xl p-6 w-full max-w-md backdrop-blur-xl animate-in fade-in zoom-in duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="bg-gradient-to-br from-purple-500 to-blue-500 p-2 rounded-lg">
                  <Plus size={20} className="text-white" />
                </div>
                <h3 className="text-xl font-bold text-gradient">Create New Project</h3>
              </div>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setNewProjectName('');
                  setNewProjectDesc('');
                }}
                className="glass hover:bg-white/10 p-2 rounded-lg transition-all border border-white/20 hover:border-red-500/50"
                aria-label="Close modal"
              >
                <X size={18} className="text-purple-200 hover:text-red-300" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-purple-200 mb-2">
                  Project Name *
                </label>
                <input
                  type="text"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  className="w-full px-4 py-3 glass border border-white/20 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500/50 text-white placeholder-purple-300/50 transition-all outline-none"
                  placeholder="e.g., Mobile Loan Refer"
                  autoFocus
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && newProjectName.trim()) {
                      createProject();
                    }
                  }}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-purple-200 mb-2">
                  Description
                </label>
                <textarea
                  value={newProjectDesc}
                  onChange={(e) => setNewProjectDesc(e.target.value)}
                  className="w-full px-4 py-3 glass border border-white/20 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500/50 text-white placeholder-purple-300/50 transition-all resize-none outline-none"
                  placeholder="Brief description of the project"
                  rows={3}
                />
              </div>
              <div className="flex gap-3 justify-end pt-2">
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    setNewProjectName('');
                    setNewProjectDesc('');
                  }}
                  className="px-4 py-2 glass border border-white/20 rounded-lg hover:bg-white/10 text-purple-200 transition-all font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={createProject}
                  disabled={!newProjectName.trim()}
                  className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-purple-500/50 font-medium"
                >
                  Create Project
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
};

export default Sidebar;

