import {
    Activity,
    ArrowRight,
    Building2,
    Cpu,
    Database,
    Download,
    FileText,
    GitBranch,
    Globe,
    Layers,
    Layout,
    Loader,
    Map,
    Plus,
    Save,
    Settings,
    Sparkles,
    TrendingUp,
    Upload,
    Workflow,
    X,
    Zap
} from 'lucide-react';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ArchitectureLayer, ArchitectureState } from '../../domain/entities/Architecture';
import { ProjectArtifactEntity, ProjectEntity } from '../../domain/entities/Project';
import { PrismaProjectRepository } from '../../infrastructure/repositories/PrismaProjectRepository';

interface ArchitectureModelingStudioProps {
  project: ProjectEntity | null;
}

type ArchitectureDiagramType = 'BPMN' | 'UML' | 'ARCHIMATE' | 'C4' | 'DATA_FLOW' | 'INTEGRATION' | 'BUSINESS_PROCESS' | 'APPLICATION_ARCHITECTURE' | 'TECHNOLOGY_INFRASTRUCTURE' | 'CUSTOM';

interface StencilItem {
  id: string;
  name: string;
  icon: React.ReactNode;
  layer: ArchitectureLayer;
  type: string;
  shape: 'rectangle' | 'circle' | 'diamond' | 'hexagon' | 'cylinder';
  color: string;
}

const ArchitectureModelingStudio: React.FC<ArchitectureModelingStudioProps> = ({ project }) => {
  const [diagrams, setDiagrams] = useState<ProjectArtifactEntity[]>([]);
  const [selectedDiagram, setSelectedDiagram] = useState<ProjectArtifactEntity | null>(null);
  const [diagramType, setDiagramType] = useState<ArchitectureDiagramType>('BUSINESS_PROCESS');
  const [architectureState, setArchitectureState] = useState<ArchitectureState>('AS_IS');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showAIModal, setShowAIModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [diagramName, setDiagramName] = useState('');
  const [diagramDescription, setDiagramDescription] = useState('');
  const [stencilLibrary, setStencilLibrary] = useState<ArchitectureLayer | null>(null);
  const [aiPrompt, setAiPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [editorReady, setEditorReady] = useState(false);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const messageHandlerRef = useRef<((event: MessageEvent) => void) | null>(null);
  const currentDiagramIdRef = useRef<string | null>(null);
  const currentDiagramRef = useRef<ProjectArtifactEntity | null>(null);
  const repo = useMemo(() => new PrismaProjectRepository(), []);

  // Stencil libraries for each layer
  const stencilLibraries: Record<ArchitectureLayer, StencilItem[]> = {
    BUSINESS: [
      { id: 'capability', name: 'Capability', icon: <Building2 size={16} />, layer: 'BUSINESS', type: 'Capability', shape: 'rectangle', color: '#9333ea' },
      { id: 'process', name: 'Process', icon: <Workflow size={16} />, layer: 'BUSINESS', type: 'Process', shape: 'rectangle', color: '#7c3aed' },
      { id: 'value-stream', name: 'Value Stream', icon: <TrendingUp size={16} />, layer: 'BUSINESS', type: 'ValueStream', shape: 'hexagon', color: '#a855f7' },
      { id: 'org-unit', name: 'Org Unit', icon: <Layers size={16} />, layer: 'BUSINESS', type: 'OrgUnit', shape: 'rectangle', color: '#c084fc' },
    ],
    APPLICATION: [
      { id: 'system', name: 'System', icon: <Cpu size={16} />, layer: 'APPLICATION', type: 'System', shape: 'rectangle', color: '#3b82f6' },
      { id: 'api', name: 'API', icon: <Zap size={16} />, layer: 'APPLICATION', type: 'API', shape: 'hexagon', color: '#2563eb' },
      { id: 'microservice', name: 'Microservice', icon: <Activity size={16} />, layer: 'APPLICATION', type: 'Microservice', shape: 'circle', color: '#1d4ed8' },
      { id: 'integration', name: 'Integration', icon: <ArrowRight size={16} />, layer: 'APPLICATION', type: 'Integration', shape: 'rectangle', color: '#60a5fa' },
    ],
    DATA: [
      { id: 'data-entity', name: 'Data Entity', icon: <Database size={16} />, layer: 'DATA', type: 'DataEntity', shape: 'cylinder', color: '#10b981' },
      { id: 'data-store', name: 'Data Store', icon: <Database size={16} />, layer: 'DATA', type: 'DataStore', shape: 'cylinder', color: '#059669' },
      { id: 'data-flow', name: 'Data Flow', icon: <ArrowRight size={16} />, layer: 'DATA', type: 'DataFlow', shape: 'rectangle', color: '#34d399' },
      { id: 'data-lineage', name: 'Data Lineage', icon: <GitBranch size={16} />, layer: 'DATA', type: 'DataLineage', shape: 'hexagon', color: '#6ee7b7' },
    ],
    TECHNOLOGY: [
      { id: 'server', name: 'Server', icon: <Cpu size={16} />, layer: 'TECHNOLOGY', type: 'Server', shape: 'rectangle', color: '#f97316' },
      { id: 'cloud', name: 'Cloud Platform', icon: <Globe size={16} />, layer: 'TECHNOLOGY', type: 'CloudPlatform', shape: 'hexagon', color: '#ea580c' },
      { id: 'network', name: 'Network', icon: <Layout size={16} />, layer: 'TECHNOLOGY', type: 'Network', shape: 'rectangle', color: '#fb923c' },
      { id: 'storage', name: 'Storage', icon: <Database size={16} />, layer: 'TECHNOLOGY', type: 'Storage', shape: 'cylinder', color: '#fdba74' },
    ],
    SOLUTION: [
      { id: 'solution', name: 'Solution', icon: <Globe size={16} />, layer: 'SOLUTION', type: 'Solution', shape: 'hexagon', color: '#ec4899' },
      { id: 'end-to-end', name: 'End-to-End Flow', icon: <Workflow size={16} />, layer: 'SOLUTION', type: 'EndToEndFlow', shape: 'rectangle', color: '#f472b6' },
      { id: 'integration-pattern', name: 'Integration Pattern', icon: <ArrowRight size={16} />, layer: 'SOLUTION', type: 'IntegrationPattern', shape: 'diamond', color: '#f9a8d4' },
    ],
  };

  const diagramTypeOptions = [
    { value: 'BPMN', label: 'BPMN', icon: <Workflow size={16} /> },
    { value: 'UML', label: 'UML', icon: <Layers size={16} /> },
    { value: 'ARCHIMATE', label: 'ArchiMate', icon: <Map size={16} /> },
    { value: 'C4', label: 'C4 Model', icon: <Building2 size={16} /> },
    { value: 'DATA_FLOW', label: 'Data Flow', icon: <ArrowRight size={16} /> },
    { value: 'INTEGRATION', label: 'Integration', icon: <Zap size={16} /> },
    { value: 'BUSINESS_PROCESS', label: 'Business Process', icon: <Workflow size={16} /> },
    { value: 'APPLICATION_ARCHITECTURE', label: 'Application Architecture', icon: <Cpu size={16} /> },
    { value: 'TECHNOLOGY_INFRASTRUCTURE', label: 'Technology Infrastructure', icon: <Globe size={16} /> },
    { value: 'CUSTOM', label: 'Custom', icon: <Settings size={16} /> },
  ];

  useEffect(() => {
    if (project) {
      loadDiagrams();
    }
  }, [project]);

  const loadDiagrams = useCallback(async () => {
    if (!project) return;
    setIsLoading(true);
    try {
      const artifacts = await repo.getArtifactsByProject(project.id);
      // Filter for ARCHITECTURE type artifacts (diagrams)
      const architectureDiagrams = artifacts.filter(a => a.artifactType === 'ARCHITECTURE');
      setDiagrams(architectureDiagrams);
    } catch (error) {
      console.error('Error loading diagrams:', error);
    } finally {
      setIsLoading(false);
    }
  }, [project, repo]);

  const handleSaveDiagramContent = useCallback(async (xmlpngData: string, diagramToSave?: ProjectArtifactEntity) => {
    if (!project) {
      console.error('No project selected');
      return;
    }
    
    // Get current selected diagram (might be a new one not yet saved)
    const currentDiagram = diagramToSave || selectedDiagram;
    if (!currentDiagram) {
      console.error('No diagram selected');
      return;
    }
    
    try {
      // Ensure fileName has proper extension
      const fileName = currentDiagram.fileName.endsWith('.drawio') || currentDiagram.fileName.endsWith('.xml')
        ? currentDiagram.fileName
        : `${currentDiagram.fileName}.drawio`;
      
      // Delete old artifact if it exists in DB (for updates)
      // Check if this is an existing artifact by trying to find it
      const existingArtifacts = await repo.getArtifactsByProject(project.id);
      const existingArtifact = existingArtifacts.find(a => a.id === currentDiagram.id);
      
      if (existingArtifact) {
        // Update existing artifact
        await repo.deleteArtifact(existingArtifact.id);
      }
      
      // Create/update artifact (always create new to ensure clean state)
      const updatedArtifact = await repo.addArtifact({
        projectId: project.id,
        fileName: fileName,
        fileType: 'image/png', // xmlpng format
        fileSize: new Blob([xmlpngData]).size,
        fileContent: xmlpngData,
        artifactType: 'ARCHITECTURE'
      });
      
      // Update state with the saved artifact
      setSelectedDiagram(updatedArtifact);
      // Update refs to point to the updated artifact
      currentDiagramIdRef.current = updatedArtifact.id;
      currentDiagramRef.current = updatedArtifact;
      await loadDiagrams();
      setHasUnsavedChanges(false);
      setIsSaving(false);
    } catch (error) {
      console.error('Error saving diagram:', error);
      setIsSaving(false);
      throw error; // Re-throw so caller can handle
    }
  }, [project, repo, loadDiagrams]);

  const initializeDrawIO = useCallback(async (diagram: ProjectArtifactEntity | null) => {
    if (!containerRef.current) {
      console.warn('Container ref not available');
      return;
    }

    // Check if we're already initialized for this diagram
    const diagramId = diagram?.id || 'new';
    if (currentDiagramIdRef.current === diagramId && iframeRef.current) {
      console.log('Editor already initialized for this diagram, skipping reinitialization');
      return;
    }

    // Clear existing iframe and message handler
    if (iframeRef.current && containerRef.current.contains(iframeRef.current)) {
      containerRef.current.removeChild(iframeRef.current);
    }
    if (messageHandlerRef.current) {
      window.removeEventListener('message', messageHandlerRef.current);
      messageHandlerRef.current = null;
    }

    // Update current diagram ID and reference
    currentDiagramIdRef.current = diagramId;
    currentDiagramRef.current = diagram;

    setEditorReady(false);
    setIsLoading(true);

    try {
      // Create draw.io iframe with embedded URL (like PHP)
      const iframe = document.createElement('iframe');
      iframe.style.width = '100%';
      iframe.style.height = '100%';
      iframe.style.border = 'none';
      iframe.style.background = '#ffffff';
      iframe.setAttribute('frameborder', '0');
      iframe.setAttribute('id', 'drawio-iframe');
      
      // Use embedded draw.io URL (matching PHP implementation)
      const editorUrl = 'https://embed.diagrams.net/?embed=1&spin=1&ui=atlas&proto=json&saveAndExit=0&noSaveBtn=1&noExitBtn=1&modified=1';
      iframe.src = editorUrl;
      iframe.allowFullscreen = true;
      
      // Generate draft key for localStorage
      const draftKey = `.draft-${diagramId}`;
      
      // Create message handler (matching PHP pattern)
      const handleMessage = (evt: MessageEvent) => {
        // Accept messages from draw.io domains
        if (!evt.origin.includes('diagrams.net') && !evt.origin.includes('draw.io')) {
          return;
        }

        if (evt.data && typeof evt.data === 'string' && evt.data.length > 0) {
          try {
            const msg = JSON.parse(evt.data);
            
            if (msg.event === 'init') {
              console.log('✅ draw.io editor initialized');
              setEditorReady(true);
              setIsLoading(false);
              
              // Load existing diagram or draft
              const draft = localStorage.getItem(draftKey);
              if (draft) {
                try {
                  const draftData = JSON.parse(draft);
                  if (draftData.xml && iframe.contentWindow) {
                    iframe.contentWindow.postMessage(JSON.stringify({
                      action: 'load',
                      autosave: 1,
                      xml: draftData.xml
                    }), '*');
                    iframe.contentWindow.postMessage(JSON.stringify({
                      action: 'status',
                      modified: true
                    }), '*');
                  }
                } catch (e) {
                  console.warn('Error loading draft:', e);
                }
              } else if (diagram && diagram.fileContent) {
                // Load existing diagram
                if (iframe.contentWindow) {
                  iframe.contentWindow.postMessage(JSON.stringify({
                    action: 'load',
                    autosave: 1,
                    xmlpng: diagram.fileContent
                  }), '*');
                }
              }
            } else if (msg.event === 'export') {
              // Diagram exported (xmlpng format)
              const xmlpngData = msg.data;
              
              // Get current diagram from ref to avoid stale closure
              const currentDiagram = currentDiagramRef.current;
              if (!currentDiagram) {
                console.warn('No diagram selected for export');
                setIsSaving(false);
                return;
              }
              
              if (xmlpngData && currentDiagram) {
                // Save to artifact (this handles both new and existing diagrams)
                handleSaveDiagramContent(xmlpngData, currentDiagram).then(() => {
                  // Show success message after save completes
                  setTimeout(() => {
                    alert('Diagram saved successfully!');
                  }, 100);
                }).catch((error) => {
                  console.error('Error in save callback:', error);
                  alert('Error saving diagram: ' + (error instanceof Error ? error.message : 'Unknown error'));
                });
              } else if (!xmlpngData) {
                console.warn('Export returned empty data');
                alert('Cannot save empty diagram. Please draw something first.');
                setIsSaving(false);
              }
              
              // Store in localStorage
              if (currentDiagram) {
                const storageKey = currentDiagram.id || 'default';
                localStorage.setItem(storageKey, JSON.stringify({
                  lastModified: new Date().toISOString(),
                  data: xmlpngData || ''
                }));
              }
            } else if (msg.event === 'autosave') {
              // Auto-save draft - DO NOT trigger reload
              setHasUnsavedChanges(true);
              if (msg.xml) {
                // Store draft XML only - don't request export during autosave
                localStorage.setItem(draftKey, JSON.stringify({
                  lastModified: new Date().toISOString(),
                  xml: msg.xml
                }));
              }
            } else if (msg.event === 'save') {
              // User saved
              setHasUnsavedChanges(false);
              if (msg.xml && iframe.contentWindow) {
                // Request export to get xmlpng
                iframe.contentWindow.postMessage(JSON.stringify({
                  action: 'export',
                  format: 'xmlpng',
                  xml: msg.xml,
                  spin: 'Updating page'
                }), '*');
                // Store draft XML
                localStorage.setItem(draftKey, JSON.stringify({
                  lastModified: new Date().toISOString(),
                  xml: msg.xml
                }));
              }
            } else if (msg.event === 'exit') {
              // User exited editor
              localStorage.removeItem(draftKey);
              setHasUnsavedChanges(false);
            }
          } catch (error) {
            // Not a JSON message, ignore
          }
        }
      };
      
      messageHandlerRef.current = handleMessage;
      window.addEventListener('message', handleMessage);
      
      iframe.onerror = (error) => {
        console.error('❌ Error loading draw.io:', error);
        setIsLoading(false);
        setEditorReady(false);
        if (containerRef.current) {
          containerRef.current.innerHTML = `
            <div style="padding: 40px; text-align: center; color: #666;">
              <h3 style="color: #dc2626; margin-bottom: 16px;">⚠️ Editor Loading Error</h3>
              <p style="margin-bottom: 8px;">Failed to load draw.io editor</p>
              <p style="font-size: 14px; color: #999;">Please check your internet connection and try again.</p>
            </div>
          `;
        }
      };
      
      containerRef.current.appendChild(iframe);
      iframeRef.current = iframe;
    } catch (error) {
      console.error('❌ Error initializing draw.io:', error);
      setIsLoading(false);
      setEditorReady(false);
      if (containerRef.current) {
        containerRef.current.innerHTML = `
          <div style="padding: 40px; text-align: center; color: #666;">
            <h3 style="color: #dc2626; margin-bottom: 16px;">⚠️ Editor Initialization Error</h3>
            <p style="margin-bottom: 8px;">${error instanceof Error ? error.message : 'Unknown error'}</p>
            <p style="font-size: 14px; color: #999;">Please check the browser console for details.</p>
          </div>
        `;
      }
    }
  }, [handleSaveDiagramContent]);

  useEffect(() => {
    // Initialize draw.io editor when diagram is selected
    // Only initialize if we have a diagram and it's different from the current one
    const diagramId = selectedDiagram?.id || (diagramName ? 'new' : null);
    const shouldInitialize = diagramId && diagramId !== currentDiagramIdRef.current;
    
    if (containerRef.current && shouldInitialize) {
      initializeDrawIO(selectedDiagram);
    }
    return () => {
      // Cleanup iframe and message handler on unmount
      if (messageHandlerRef.current) {
        window.removeEventListener('message', messageHandlerRef.current);
        messageHandlerRef.current = null;
      }
      if (iframeRef.current && containerRef.current) {
        try {
          if (containerRef.current.contains(iframeRef.current)) {
          containerRef.current.removeChild(iframeRef.current);
          }
        } catch (e) {
          // Ignore if already removed
        }
        iframeRef.current = null;
      }
    };
  }, [initializeDrawIO, selectedDiagram?.id, diagramName]);

  const handleCreateDiagram = async () => {
    if (!project || !diagramType) return;

    const name = diagramName.trim() || `New ${diagramType} Diagram`;
    const fileName = `${name.replace(/[^a-z0-9]/gi, '_')}.drawio`;

    // Create a new artifact entity (not saved yet - will be saved when user clicks Save)
    const newDiagram: ProjectArtifactEntity = {
      id: crypto.randomUUID(),
      projectId: project.id,
      fileName: fileName,
      fileType: 'image/png',
      fileSize: 0,
      fileContent: '', // Will be populated when saved
      artifactType: 'ARCHITECTURE',
      uploadedAt: new Date(),
    };

    setSelectedDiagram(newDiagram);
    setShowCreateModal(false);
    setDiagramName(name);
    setDiagramDescription('');
    setHasUnsavedChanges(false);
    
    // Editor will initialize automatically via useEffect when selectedDiagram changes
  };

  const handleSaveDiagram = async () => {
    if (!project || !selectedDiagram) {
      alert('Please create or select a diagram first.');
      return;
    }

    if (!iframeRef.current || !iframeRef.current.contentWindow) {
      alert('Editor is not ready yet. Please wait for the editor to load.');
      return;
    }

    if (!editorReady) {
      alert('Editor is still loading. Please wait a moment and try again.');
      return;
    }

    try {
      setIsSaving(true);
      // Request export in xmlpng format (matching PHP implementation)
      // This will trigger the 'export' event which will call handleSaveDiagramContent
        iframeRef.current.contentWindow.postMessage(JSON.stringify({
          action: 'export',
        format: 'xmlpng'
      }), '*');
      
      // Note: The actual save happens in the message handler when 'export' event is received
      // We'll show success message after a delay if save completes
    } catch (error) {
      console.error('Error saving diagram:', error);
      alert('Error saving diagram. Please try again.');
      setIsSaving(false);
    }
  };

  const handleAutoLayout = () => {
    // Draw.io has built-in layout features
    alert('To auto-arrange shapes, use the Arrange menu in the draw.io editor (Arrange → Layout) or select shapes and use the layout options in the toolbar.');
  };

  const handleAddStencil = (stencil: StencilItem) => {
    // Draw.io has a comprehensive shapes panel
    // Guide users to use the shapes from the left panel
    alert(`To add "${stencil.name}", use the draw.io shapes panel on the left side of the editor. Draw.io provides a full-featured shape library with ${stencil.layer} layer shapes.`);
  };

  const handleAIGenerate = async () => {
    if (!project || !aiPrompt.trim()) return;

    setIsGenerating(true);
    try {
      // AI generation would create a diagram structure
      // For now, just show a message
      alert('AI diagram generation feature coming soon. For now, you can create diagrams manually using the draw.io editor.');
      setShowAIModal(false);
      setAiPrompt('');
    } catch (error) {
      console.error('Error generating diagram:', error);
      alert('Error generating diagram with AI');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleImport = async (file: File) => {
    if (!project) return;
    
    try {
      const content = await file.text();
      const fileName = file.name;

      // Create artifact from imported file
      const importedArtifact = await repo.addArtifact({
        projectId: project.id,
        fileName: fileName,
        fileType: file.type || 'application/xml',
        fileSize: file.size,
        fileContent: content,
        artifactType: 'ARCHITECTURE'
      });

      // Select the imported diagram
      setSelectedDiagram(importedArtifact);
      setShowImportModal(false);
      await loadDiagrams();
    } catch (error) {
      console.error('Error importing file:', error);
      alert('Error importing file. Please try again.');
    }
  };

  const handleExport = (format: 'PNG' | 'SVG' | 'JSON') => {
    if (!iframeRef.current || !iframeRef.current.contentWindow) {
      alert('Please create or select a diagram first.');
      return;
    }

    try {
      // Request export from draw.io
      iframeRef.current.contentWindow.postMessage(JSON.stringify({
          action: 'export',
          format: format.toLowerCase()
      }), '*');
        
      // Note: The actual export/download will be handled by draw.io
      // User can also use File → Export as in the editor
    } catch (error) {
      console.error('Error exporting:', error);
      alert('Error exporting diagram. Please use the File menu in the draw.io editor.');
    }
  };

  const handleCreateQuickProject = async () => {
    if (!project) {
      try {
        const newProject = await repo.createProject({
          name: `Architecture Project ${new Date().toLocaleDateString()}`,
          description: 'Quick project for architecture modeling',
        });
        // Note: In a real implementation, you'd want to call a callback to update the parent
        // For now, we'll reload the page or show a message
        alert(`Project "${newProject.name}" created! Please select it from the sidebar to continue.`);
        window.location.reload();
      } catch (error) {
        console.error('Error creating project:', error);
        alert('Error creating project. Please try again.');
      }
    }
  };

  if (!project) {
    return (
      <div className="bg-white rounded-lg shadow-md p-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-purple-100 to-blue-100 rounded-full mb-4">
            <Map size={40} className="text-purple-600" />
          </div>
          <h3 className="text-2xl font-bold text-gray-800 mb-2">Architecture Modeling Studio</h3>
          <p className="text-gray-600">Create and manage architecture diagrams with drag-and-drop</p>
        </div>
        
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h4 className="font-semibold text-blue-900 mb-2 flex items-center">
              <Map size={20} className="mr-2" />
              Get Started
            </h4>
            <p className="text-blue-800 mb-4">
              To use the Architecture Modeling Studio, you need to select or create a project first.
            </p>
            <div className="space-y-3">
              <button
                onClick={handleCreateQuickProject}
                className="w-full flex items-center justify-center space-x-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-3 rounded-lg hover:from-purple-700 hover:to-blue-700 transition-colors font-semibold"
              >
                <Plus size={20} />
                <span>Create Quick Project</span>
              </button>
              <div className="text-center">
                <p className="text-sm text-blue-700">or</p>
              </div>
              <div className="bg-white border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800 font-medium mb-2">Select an existing project:</p>
                <ol className="text-sm text-blue-700 space-y-1 list-decimal list-inside">
                  <li>Look at the sidebar on the left</li>
                  <li>Click on an existing project</li>
                  <li>Or click "New Project" to create one</li>
                </ol>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
            <h4 className="font-semibold text-gray-800 mb-3">What you can do:</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="flex items-start space-x-2">
                <div className="mt-1 w-2 h-2 bg-purple-600 rounded-full"></div>
                <div>
                  <p className="font-medium text-gray-800">Canvas-based Modeling</p>
                  <p className="text-gray-600">Powerful diagramming with draw.io editor</p>
                </div>
              </div>
              <div className="flex items-start space-x-2">
                <div className="mt-1 w-2 h-2 bg-blue-600 rounded-full"></div>
                <div>
                  <p className="font-medium text-gray-800">Multiple Diagram Types</p>
                  <p className="text-gray-600">BPMN, UML, ArchiMate, C4, Data Flow, Integration</p>
                </div>
              </div>
              <div className="flex items-start space-x-2">
                <div className="mt-1 w-2 h-2 bg-green-600 rounded-full"></div>
                <div>
                  <p className="font-medium text-gray-800">Stencil Libraries</p>
                  <p className="text-gray-600">Business, Application, Data, Technology layers</p>
                </div>
              </div>
              <div className="flex items-start space-x-2">
                <div className="mt-1 w-2 h-2 bg-orange-600 rounded-full"></div>
                <div>
                  <p className="font-medium text-gray-800">AI-Assisted Creation</p>
                  <p className="text-gray-600">Generate diagrams from text descriptions</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-white rounded-lg shadow-md overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Map size={24} />
          <div>
            <h2 className="text-xl font-bold">Architecture Modeling Studio</h2>
            <p className="text-sm text-purple-100">Canvas-based diagramming with drag-and-drop</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center space-x-2 bg-white text-purple-700 px-4 py-2 rounded-lg hover:bg-purple-50 transition-colors font-semibold"
          >
            <Plus size={16} />
            <span>New Diagram</span>
          </button>
          <button
            onClick={() => setShowImportModal(true)}
            className="flex items-center space-x-2 bg-white text-purple-700 px-4 py-2 rounded-lg hover:bg-purple-50 transition-colors"
          >
            <Upload size={16} />
            <span>Import</span>
          </button>
          {selectedDiagram && (
            <div className="ml-4 px-3 py-1 bg-white bg-opacity-20 rounded text-sm">
              <span className="font-medium">{selectedDiagram.fileName}</span>
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar - Diagram List & Stencil Library */}
        <div className="w-64 bg-gray-50 border-r border-gray-200 flex flex-col">
          <div className="p-4 border-b border-gray-200">
            <h3 className="font-semibold text-gray-800 mb-2">Saved Diagrams</h3>
            {isLoading ? (
              <div className="text-sm text-gray-500">Loading...</div>
            ) : diagrams.length === 0 ? (
              <div className="text-sm text-gray-500">No diagrams yet</div>
            ) : (
              <div className="space-y-1 max-h-40 overflow-y-auto">
                {diagrams.map(diagram => (
                  <button
                    key={diagram.id}
                    onClick={() => {
                      setSelectedDiagram(diagram);
                      setDiagramName(diagram.fileName.replace('.drawio', '').replace('.xml', ''));
                    }}
                    className={`w-full text-left px-2 py-1 rounded text-sm transition-colors ${
                      selectedDiagram?.id === diagram.id
                        ? 'bg-purple-600 text-white'
                        : 'bg-white text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <FileText size={12} className="inline mr-1" />
                    {diagram.fileName}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="p-4 border-b border-gray-200">
            <h3 className="font-semibold text-gray-800 mb-2">Stencil Library</h3>
            <div className="flex flex-wrap gap-2">
              {(['BUSINESS', 'APPLICATION', 'DATA', 'TECHNOLOGY', 'SOLUTION'] as ArchitectureLayer[]).map(layer => (
                <button
                  key={layer}
                  onClick={() => setStencilLibrary(stencilLibrary === layer ? null : layer)}
                  className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                    stencilLibrary === layer
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {layer}
                </button>
              ))}
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            {stencilLibrary && (
              <div className="space-y-2">
                {stencilLibraries[stencilLibrary].map(stencil => (
                  <button
                    key={stencil.id}
                    onClick={() => handleAddStencil(stencil)}
                    className="w-full flex items-center space-x-3 p-3 bg-white rounded-lg border border-gray-200 hover:border-purple-500 hover:shadow-md transition-all text-left"
                  >
                    <div style={{ color: stencil.color }}>{stencil.icon}</div>
                    <div>
                      <div className="font-medium text-gray-800">{stencil.name}</div>
                      <div className="text-xs text-gray-500">{stencil.type}</div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Main Canvas Area */}
        <div className="flex-1 flex flex-col">
          {/* Toolbar */}
          <div className="bg-gray-100 border-b border-gray-200 p-2 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <select
                value={architectureState}
                onChange={(e) => setArchitectureState(e.target.value as ArchitectureState)}
                className="px-3 py-1 border border-gray-300 rounded text-sm"
              >
                <option value="AS_IS">As-Is</option>
                <option value="TO_BE">To-Be</option>
                <option value="SCENARIO">Scenario</option>
              </select>
              <button
                onClick={handleAutoLayout}
                className="flex items-center space-x-1 px-3 py-1 bg-white border border-gray-300 rounded hover:bg-gray-50 text-sm"
              >
                <Layout size={14} />
                <span>Auto Layout</span>
              </button>
              <button
                onClick={() => setShowAIModal(true)}
                className="flex items-center space-x-1 px-3 py-1 bg-white border border-gray-300 rounded hover:bg-gray-50 text-sm"
              >
                <Sparkles size={14} />
                <span>AI Generate</span>
              </button>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => handleExport('PNG')}
                className="flex items-center space-x-1 px-3 py-1 bg-white border border-gray-300 rounded hover:bg-gray-50 text-sm"
              >
                <Download size={14} />
                <span>PNG</span>
              </button>
              <button
                onClick={() => handleExport('SVG')}
                className="flex items-center space-x-1 px-3 py-1 bg-white border border-gray-300 rounded hover:bg-gray-50 text-sm"
              >
                <Download size={14} />
                <span>SVG</span>
              </button>
              <button
                onClick={handleSaveDiagram}
                disabled={!selectedDiagram || isSaving}
                className="flex items-center space-x-1 px-3 py-1 bg-purple-600 text-white rounded hover:bg-purple-700 text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving ? (
                  <>
                    <Loader className="animate-spin" size={14} />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                <Save size={14} />
                <span>Save</span>
                  </>
                )}
              </button>
              {hasUnsavedChanges && (
                <span className="text-xs text-yellow-600 font-medium">● Unsaved changes</span>
              )}
            </div>
          </div>

          {/* Canvas */}
          <div 
            ref={containerRef} 
            className="flex-1 bg-white border border-gray-300" 
            style={{ 
              minHeight: '500px', 
              position: 'relative',
              overflow: 'auto'
            }}
          >
            {!editorReady && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-50 z-10">
                <div className="text-center">
                  <Loader className="animate-spin mx-auto mb-4 text-purple-600" size={32} />
                  <p className="text-gray-600">Loading draw.io editor...</p>
                  <p className="text-sm text-gray-500 mt-2">The editor will appear here shortly</p>
                </div>
              </div>
            )}
            {!selectedDiagram && !diagramName && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-50 z-10">
                <div className="text-center">
                  <Map size={48} className="mx-auto mb-4 text-gray-400" />
                  <p className="text-gray-600 font-semibold">No diagram selected</p>
                  <p className="text-sm text-gray-500 mt-2">Create a new diagram or select an existing one</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Create Diagram Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-800">Create New Diagram</h3>
              <button onClick={() => setShowCreateModal(false)} className="text-gray-500 hover:text-gray-700">
                <X size={20} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Diagram Name</label>
                <input
                  type="text"
                  value={diagramName}
                  onChange={(e) => setDiagramName(e.target.value)}
                  placeholder={`New ${diagramType} Diagram`}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Diagram Type</label>
                <select
                  value={diagramType}
                  onChange={(e) => setDiagramType(e.target.value as ArchitectureDiagramType)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                >
                  {diagramTypeOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Description (Optional)</label>
                <textarea
                  value={diagramDescription}
                  onChange={(e) => setDiagramDescription(e.target.value)}
                  placeholder="Brief description of the diagram"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  rows={3}
                />
              </div>
              <button
                onClick={handleCreateDiagram}
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white px-4 py-2 rounded-lg hover:from-purple-700 hover:to-blue-700 transition-colors font-semibold"
              >
                Create Diagram
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-800">Import Diagram</h3>
              <button onClick={() => setShowImportModal(false)} className="text-gray-500 hover:text-gray-700">
                <X size={20} />
              </button>
            </div>
            <div className="space-y-4">
              <p className="text-sm text-gray-600">Supported formats: Visio (.vsdx), draw.io (.drawio), Lucidchart (.json), PlantUML (.puml), BPMN XML (.bpmn)</p>
              <input
                type="file"
                accept=".vsdx,.drawio,.xml,.json,.puml,.bpmn"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleImport(file);
                }}
                className="w-full"
              />
            </div>
          </div>
        </div>
      )}

      {/* AI Generate Modal */}
      {showAIModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-lg">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-800">AI-Assisted Diagram Creation</h3>
              <button onClick={() => setShowAIModal(false)} className="text-gray-500 hover:text-gray-700">
                <X size={20} />
              </button>
            </div>
            <div className="space-y-4">
              <p className="text-sm text-gray-600">Describe the architecture diagram you want to generate</p>
              <textarea
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                placeholder="e.g., Generate architecture from this text: Payment processing system with API gateway, database, and external payment provider integration"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                rows={5}
              />
              <button
                onClick={handleAIGenerate}
                disabled={isGenerating || !aiPrompt.trim()}
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white px-4 py-2 rounded-lg hover:from-purple-700 hover:to-blue-700 transition-colors font-semibold disabled:opacity-50"
              >
                {isGenerating ? (
                  <>
                    <Loader className="animate-spin inline mr-2" size={16} />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles size={16} className="inline mr-2" />
                    Generate Diagram
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ArchitectureModelingStudio;

