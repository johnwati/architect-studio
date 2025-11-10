import {
    BarChart3,
    Building2,
    Cpu,
    Database,
    FileText,
    GitBranch,
    GitCompare,
    Globe,
    Layers,
    Map,
    Plus,
    Search,
    Settings,
    TrendingUp,
    Upload,
    Workflow,
    X
} from 'lucide-react';
import React, { useCallback, useMemo, useState } from 'react';
import {
    AnalyticsResult,
    ArchitectureDiagram,
    ArchitectureElement,
    ArchitectureLayer,
    ArchitectureState,
    Roadmap
} from '../../domain/entities/Architecture';
import { ProjectEntity } from '../../domain/entities/Project';
import ArchitectureMultiView from './ArchitectureMultiView';

interface EnterpriseArchitectureProps {
  selectedProject: ProjectEntity | null;
}

const EnterpriseArchitecture: React.FC<EnterpriseArchitectureProps> = ({ selectedProject }) => {
  const [activeTab, setActiveTab] = useState<'modeling' | 'diagrams' | 'roadmaps' | 'analytics' | 'query' | 'multi-view'>('modeling');
  const [selectedLayer, setSelectedLayer] = useState<ArchitectureLayer | null>(null);
  const [selectedState, setSelectedState] = useState<ArchitectureState>('AS_IS');
  const [elements, setElements] = useState<ArchitectureElement[]>([]);
  const [diagrams, setDiagrams] = useState<ArchitectureDiagram[]>([]);
  const [roadmaps, setRoadmaps] = useState<Roadmap[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [queryText, setQueryText] = useState('');
  const [queryResults, setQueryResults] = useState<AnalyticsResult | null>(null);

  const layers: { id: ArchitectureLayer; name: string; icon: React.ReactNode; color: string }[] = [
    { id: 'BUSINESS', name: 'Business Architecture', icon: <Building2 size={20} />, color: 'from-purple-500 to-purple-700' },
    { id: 'APPLICATION', name: 'Application Architecture', icon: <Layers size={20} />, color: 'from-blue-500 to-blue-700' },
    { id: 'DATA', name: 'Data Architecture', icon: <Database size={20} />, color: 'from-green-500 to-green-700' },
    { id: 'TECHNOLOGY', name: 'Technology Architecture', icon: <Cpu size={20} />, color: 'from-orange-500 to-orange-700' },
    { id: 'SOLUTION', name: 'Solution Architecture', icon: <Globe size={20} />, color: 'from-pink-500 to-pink-700' },
  ];

  const handleCreateElement = useCallback((layer: ArchitectureLayer, type: string) => {
    const newElement: ArchitectureElement = {
      id: `elem-${Date.now()}`,
      layer,
      name: `New ${type}`,
      description: '',
      type,
      metadata: {
        risk: 'MEDIUM',
        lifecycleStage: 'PLANNED',
      },
      relationships: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      version: '1.0',
      tags: [],
      state: selectedState,
    };
    setElements([...elements, newElement]);
    setShowCreateModal(false);
  }, [elements, selectedState]);

  const handleQuery = useCallback(async () => {
    if (!queryText.trim()) return;

    // Simulate AI-powered query processing
    const queryLower = queryText.toLowerCase();
    
    // Simple query processing - in production, this would use AI/NLP
    const filteredElements = elements.filter(el => {
      if (queryLower.includes('system') && el.layer === 'APPLICATION') return true;
      if (queryLower.includes('integration') && el.type.includes('integration')) return true;
      if (queryLower.includes('data') && el.layer === 'DATA') return true;
      if (el.name.toLowerCase().includes(queryLower)) return true;
      if (el.description?.toLowerCase().includes(queryLower)) return true;
      return false;
    });

    const result: AnalyticsResult = {
      elements: filteredElements,
      relationships: [],
      summary: {
        totalElements: filteredElements.length,
        byLayer: {
          BUSINESS: filteredElements.filter(e => e.layer === 'BUSINESS').length,
          APPLICATION: filteredElements.filter(e => e.layer === 'APPLICATION').length,
          DATA: filteredElements.filter(e => e.layer === 'DATA').length,
          TECHNOLOGY: filteredElements.filter(e => e.layer === 'TECHNOLOGY').length,
          SOLUTION: filteredElements.filter(e => e.layer === 'SOLUTION').length,
        },
        byState: {
          AS_IS: filteredElements.filter(e => e.state === 'AS_IS').length,
          TO_BE: filteredElements.filter(e => e.state === 'TO_BE').length,
          SCENARIO: filteredElements.filter(e => e.state === 'SCENARIO').length,
        },
        byLifecycle: {
          PLANNED: filteredElements.filter(e => e.metadata.lifecycleStage === 'PLANNED').length,
          IN_DEVELOPMENT: filteredElements.filter(e => e.metadata.lifecycleStage === 'IN_DEVELOPMENT').length,
          PRODUCTION: filteredElements.filter(e => e.metadata.lifecycleStage === 'PRODUCTION').length,
          DEPRECATED: filteredElements.filter(e => e.metadata.lifecycleStage === 'DEPRECATED').length,
          DECOMMISSIONED: filteredElements.filter(e => e.metadata.lifecycleStage === 'DECOMMISSIONED').length,
        },
        dependencies: {
          directDependencies: {},
          transitiveDependencies: {},
          criticalPaths: [],
          circularDependencies: [],
        },
        gaps: [],
      },
    };

    setQueryResults(result);
  }, [queryText, elements]);

  const filteredElements = useMemo(() => {
    return elements.filter(el => {
      if (selectedLayer && el.layer !== selectedLayer) return false;
      if (el.state !== selectedState) return false;
      return true;
    });
  }, [elements, selectedLayer, selectedState]);

  return (
    <div className="h-full flex flex-col glass-dark rounded-lg border border-white/10 overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-white/10 bg-gradient-to-r from-purple-600/30 via-blue-600/30 to-purple-600/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-gradient-to-br from-purple-500 to-blue-500 p-2 rounded-lg">
              <Map size={24} className="text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Enterprise Architecture</h2>
              <p className="text-sm text-purple-200/80">Modeling & Road-mapping Engine</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-lg transition-all shadow-lg"
            >
              <Plus size={16} />
              <span>Create Element</span>
            </button>
            <button className="p-2 glass hover:bg-white/10 rounded-lg border border-white/20 transition-all">
              <Settings size={18} className="text-purple-200" />
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-white/10 bg-white/5 overflow-x-auto">
        {[
          { id: 'multi-view', label: 'Multi-View', icon: <GitCompare size={16} /> },
          { id: 'modeling', label: 'Modeling', icon: <Building2 size={16} /> },
          { id: 'diagrams', label: 'Diagrams', icon: <Workflow size={16} /> },
          { id: 'roadmaps', label: 'Roadmaps', icon: <GitBranch size={16} /> },
          { id: 'analytics', label: 'Analytics', icon: <BarChart3 size={16} /> },
          { id: 'query', label: 'AI Query', icon: <Search size={16} /> },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center space-x-2 px-6 py-3 border-b-2 transition-all ${
              activeTab === tab.id
                ? 'border-purple-500 text-white bg-purple-500/10'
                : 'border-transparent text-purple-200/70 hover:text-purple-200 hover:bg-white/5'
            }`}
          >
            {tab.icon}
            <span className="font-medium">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-6">
        {activeTab === 'multi-view' && (
          <div className="h-full">
            <ArchitectureMultiView 
              project={selectedProject}
              asIsDiagram={diagrams.find(d => d.name.includes('As-Is'))}
              toBeDiagram={diagrams.find(d => d.name.includes('To-Be'))}
              scenarioDiagrams={diagrams.filter(d => d.name.includes('Scenario'))}
            />
          </div>
        )}

        {activeTab === 'modeling' && (
          <div className="space-y-6">
            {/* State Selector */}
            <div className="flex items-center space-x-4 glass p-4 rounded-lg border border-white/10">
              <span className="text-purple-200 font-medium">Architecture State:</span>
              {(['AS_IS', 'TO_BE', 'SCENARIO'] as ArchitectureState[]).map(state => (
                <button
                  key={state}
                  onClick={() => setSelectedState(state)}
                  className={`px-4 py-2 rounded-lg transition-all ${
                    selectedState === state
                      ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg'
                      : 'glass text-purple-200 hover:bg-white/10 border border-white/20'
                  }`}
                >
                  {state.replace('_', ' ')}
                </button>
              ))}
            </div>

            {/* Layer Selector */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              {layers.map(layer => (
                <button
                  key={layer.id}
                  onClick={() => setSelectedLayer(selectedLayer === layer.id ? null : layer.id)}
                  className={`glass p-4 rounded-lg border transition-all ${
                    selectedLayer === layer.id
                      ? `bg-gradient-to-br ${layer.color} border-purple-400/50 text-white shadow-lg`
                      : 'border-white/20 text-purple-200 hover:bg-white/5 hover:border-purple-500/30'
                  }`}
                >
                  <div className="flex items-center space-x-3 mb-2">
                    {layer.icon}
                    <span className="font-semibold">{layer.name}</span>
                  </div>
                  <p className="text-xs opacity-80">
                    {filteredElements.filter(e => e.layer === layer.id).length} elements
                  </p>
                </button>
              ))}
            </div>

            {/* Elements List */}
            <div className="glass rounded-lg border border-white/10 p-4">
              <h3 className="text-lg font-semibold text-white mb-4">
                Architecture Elements
                {selectedLayer && ` - ${layers.find(l => l.id === selectedLayer)?.name}`}
              </h3>
              {filteredElements.length === 0 ? (
                <div className="text-center py-12 text-purple-200/60">
                  <Building2 size={48} className="mx-auto mb-4 opacity-50" />
                  <p>No elements found. Create your first architecture element.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredElements.map(element => (
                    <div
                      key={element.id}
                      className="glass p-4 rounded-lg border border-white/10 hover:border-purple-500/30 transition-all"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-semibold text-white">{element.name}</h4>
                          <p className="text-sm text-purple-200/70 mt-1">{element.description || 'No description'}</p>
                          <div className="flex items-center space-x-2 mt-2">
                            <span className="text-xs px-2 py-1 glass rounded border border-purple-500/30 text-purple-200">
                              {element.layer}
                            </span>
                            <span className="text-xs px-2 py-1 glass rounded border border-blue-500/30 text-blue-200">
                              {element.type}
                            </span>
                            {element.metadata.risk && (
                              <span className={`text-xs px-2 py-1 rounded ${
                                element.metadata.risk === 'CRITICAL' ? 'bg-red-500/20 text-red-200 border border-red-500/30' :
                                element.metadata.risk === 'HIGH' ? 'bg-orange-500/20 text-orange-200 border border-orange-500/30' :
                                element.metadata.risk === 'MEDIUM' ? 'bg-yellow-500/20 text-yellow-200 border border-yellow-500/30' :
                                'bg-green-500/20 text-green-200 border border-green-500/30'
                              }`}>
                                {element.metadata.risk} Risk
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button className="p-2 glass hover:bg-white/10 rounded-lg border border-white/20 transition-all">
                            <Settings size={16} className="text-purple-200" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'diagrams' && (
          <div className="space-y-6">
            <div className="glass p-6 rounded-lg border border-white/10 text-center">
              <Workflow size={64} className="mx-auto mb-4 text-purple-400/50" />
              <h3 className="text-xl font-semibold text-white mb-2">Diagramming Interface</h3>
              <p className="text-purple-200/70 mb-6">
                Create visual diagrams with drag-and-drop canvas and stencil UI
              </p>
              <div className="flex items-center justify-center space-x-4">
                <button className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-lg transition-all shadow-lg">
                  <Plus size={16} className="inline mr-2" />
                  Create Diagram
                </button>
                <button className="px-6 py-3 glass border border-white/20 hover:bg-white/10 text-purple-200 rounded-lg transition-all">
                  <Upload size={16} className="inline mr-2" />
                  Import (Visio, JSON)
                </button>
              </div>
              <div className="mt-8 grid grid-cols-3 gap-4">
                {['BPMN', 'UML', 'ArchiMate'].map(template => (
                  <div key={template} className="glass p-4 rounded-lg border border-white/10">
                    <h4 className="font-semibold text-white mb-2">{template} Template</h4>
                    <p className="text-xs text-purple-200/60">Create from {template} template</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'roadmaps' && (
          <div className="space-y-6">
            <div className="glass p-6 rounded-lg border border-white/10">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-white">Transformation Roadmaps</h3>
                <button className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-lg transition-all">
                  <Plus size={16} className="inline mr-2" />
                  New Roadmap
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="glass p-4 rounded-lg border border-purple-500/30">
                  <h4 className="font-semibold text-white mb-2">As-Is Architecture</h4>
                  <p className="text-sm text-purple-200/70">Current state architecture model</p>
                </div>
                <div className="glass p-4 rounded-lg border border-blue-500/30">
                  <h4 className="font-semibold text-white mb-2">To-Be Architecture</h4>
                  <p className="text-sm text-purple-200/70">Target state architecture model</p>
                </div>
              </div>
              <div className="space-y-4">
                <div className="glass p-4 rounded-lg border border-white/10">
                  <h4 className="font-semibold text-white mb-3">Scenarios</h4>
                  <div className="grid grid-cols-2 gap-3">
                    {['Cloud Migration', 'Replatform', 'Modernization'].map(scenario => (
                      <button
                        key={scenario}
                        className="text-left p-3 glass rounded-lg border border-white/10 hover:border-purple-500/30 transition-all"
                      >
                        <h5 className="font-medium text-white">{scenario}</h5>
                        <p className="text-xs text-purple-200/60 mt-1">Create transformation scenario</p>
                      </button>
                    ))}
                  </div>
                </div>
                <div className="glass p-4 rounded-lg border border-white/10">
                  <h4 className="font-semibold text-white mb-3">Visualizations</h4>
                  <div className="flex items-center space-x-4">
                    <button className="px-4 py-2 glass border border-white/20 hover:bg-white/10 text-purple-200 rounded-lg transition-all">
                      <TrendingUp size={16} className="inline mr-2" />
                      Gantt Chart
                    </button>
                    <button className="px-4 py-2 glass border border-white/20 hover:bg-white/10 text-purple-200 rounded-lg transition-all">
                      <BarChart3 size={16} className="inline mr-2" />
                      Heatmap
                    </button>
                    <button className="px-4 py-2 glass border border-white/20 hover:bg-white/10 text-purple-200 rounded-lg transition-all">
                      <FileText size={16} className="inline mr-2" />
                      Timeline
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="glass p-4 rounded-lg border border-white/10">
                <h4 className="text-sm font-semibold text-purple-200/70 mb-2">Total Elements</h4>
                <p className="text-3xl font-bold text-white">{elements.length}</p>
              </div>
              <div className="glass p-4 rounded-lg border border-white/10">
                <h4 className="text-sm font-semibold text-purple-200/70 mb-2">Dependencies</h4>
                <p className="text-3xl font-bold text-white">0</p>
              </div>
              <div className="glass p-4 rounded-lg border border-white/10">
                <h4 className="text-sm font-semibold text-purple-200/70 mb-2">Gaps Identified</h4>
                <p className="text-3xl font-bold text-white">0</p>
              </div>
            </div>
            <div className="glass p-6 rounded-lg border border-white/10">
              <h3 className="text-lg font-semibold text-white mb-4">Impact Analysis</h3>
              <p className="text-purple-200/70">
                Automatically highlight dependencies and gaps between As-Is and To-Be architectures.
                Calculate transformation impact and generate summary reports.
              </p>
            </div>
          </div>
        )}

        {activeTab === 'query' && (
          <div className="space-y-6">
            <div className="glass p-6 rounded-lg border border-white/10">
              <h3 className="text-lg font-semibold text-white mb-4">AI-Powered Query</h3>
              <div className="flex space-x-2 mb-4">
                <input
                  type="text"
                  value={queryText}
                  onChange={(e) => setQueryText(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleQuery()}
                  placeholder="e.g., Show me all systems supporting loan origination"
                  className="flex-1 px-4 py-3 glass border border-white/20 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500/50 text-white placeholder-purple-300/50 transition-all outline-none"
                />
                <button
                  onClick={handleQuery}
                  className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-lg transition-all"
                >
                  <Search size={16} className="inline mr-2" />
                  Query
                </button>
              </div>
              <div className="text-sm text-purple-200/60">
                Examples: "Show me all systems supporting loan origination", "Generate the To-Be application roadmap for cloud migration", "Visualize Finacle integration in the current As-Is landscape"
              </div>
            </div>

            {queryResults && (
              <div className="glass p-6 rounded-lg border border-white/10">
                <h3 className="text-lg font-semibold text-white mb-4">Query Results</h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h4 className="text-sm font-semibold text-purple-200/70 mb-2">Total Elements Found</h4>
                      <p className="text-2xl font-bold text-white">{queryResults.summary.totalElements}</p>
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-purple-200/70 mb-2">By Layer</h4>
                      <div className="space-y-1">
                        {Object.entries(queryResults.summary.byLayer).map(([layer, count]) => (
                          <div key={layer} className="flex justify-between text-sm">
                            <span className="text-purple-200/70">{layer}:</span>
                            <span className="text-white font-semibold">{count}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  {queryResults.elements.length > 0 && (
                    <div className="mt-4">
                      <h4 className="text-sm font-semibold text-purple-200/70 mb-2">Elements</h4>
                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        {queryResults.elements.map(element => (
                          <div key={element.id} className="glass p-3 rounded-lg border border-white/10">
                            <h5 className="font-semibold text-white">{element.name}</h5>
                            <p className="text-xs text-purple-200/60 mt-1">{element.layer} • {element.type}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Create Element Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="glass-dark rounded-2xl border border-white/10 shadow-2xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white">Create Architecture Element</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-2 glass hover:bg-white/10 rounded-lg border border-white/20"
              >
                <X size={18} className="text-purple-200" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-purple-200 mb-2">Layer</label>
                <div className="grid grid-cols-2 gap-2">
                  {layers.map(layer => (
                    <button
                      key={layer.id}
                      onClick={() => setSelectedLayer(layer.id)}
                      className={`p-3 rounded-lg border transition-all ${
                        selectedLayer === layer.id
                          ? `bg-gradient-to-br ${layer.color} border-purple-400/50 text-white`
                          : 'glass border-white/20 text-purple-200 hover:bg-white/5'
                      }`}
                    >
                      {layer.name}
                    </button>
                  ))}
                </div>
              </div>
              {selectedLayer && (
                <div>
                  <label className="block text-sm font-semibold text-purple-200 mb-2">Element Type</label>
                  <div className="grid grid-cols-2 gap-2">
                    {selectedLayer === 'BUSINESS' && ['Capability', 'Value Stream', 'Process', 'Org Unit'].map(type => (
                      <button
                        key={type}
                        onClick={() => handleCreateElement(selectedLayer, type)}
                        className="p-3 glass border border-white/20 hover:bg-white/10 text-purple-200 rounded-lg transition-all"
                      >
                        {type}
                      </button>
                    ))}
                    {selectedLayer === 'APPLICATION' && ['System', 'Integration', 'API', 'Microservice'].map(type => (
                      <button
                        key={type}
                        onClick={() => handleCreateElement(selectedLayer, type)}
                        className="p-3 glass border border-white/20 hover:bg-white/10 text-purple-200 rounded-lg transition-all"
                      >
                        {type}
                      </button>
                    ))}
                    {selectedLayer === 'DATA' && ['Data Entity', 'Data Store', 'Data Flow', 'Data Lineage'].map(type => (
                      <button
                        key={type}
                        onClick={() => handleCreateElement(selectedLayer, type)}
                        className="p-3 glass border border-white/20 hover:bg-white/10 text-purple-200 rounded-lg transition-all"
                      >
                        {type}
                      </button>
                    ))}
                    {selectedLayer === 'TECHNOLOGY' && ['Server', 'Cloud Platform', 'Network', 'Tool'].map(type => (
                      <button
                        key={type}
                        onClick={() => handleCreateElement(selectedLayer, type)}
                        className="p-3 glass border border-white/20 hover:bg-white/10 text-purple-200 rounded-lg transition-all"
                      >
                        {type}
                      </button>
                    ))}
                    {selectedLayer === 'SOLUTION' && ['Solution', 'End-to-End Flow', 'Integration Pattern'].map(type => (
                      <button
                        key={type}
                        onClick={() => handleCreateElement(selectedLayer, type)}
                        className="p-3 glass border border-white/20 hover:bg-white/10 text-purple-200 rounded-lg transition-all"
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnterpriseArchitecture;

