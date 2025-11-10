import { BookOpen, ChevronRight, Code, Edit, Eye, EyeOff, FileText, FileUp, Layers, Loader, Plus, Save, Sparkles, Trash2, X } from 'lucide-react';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ProjectArtifactEntity, ProjectEntity, UMLDiagramEntity, UMLDiagramType } from '../../domain/entities/Project';
import { UMLDiagramTool, UMLDiagramType as UMLGenDiagramType } from '../../domain/ports/IGenerateUMLDiagram';
import { UMLDiagramGenerator } from '../../infrastructure/adapters/api/UMLDiagramGenerator';
import { PrismaProjectRepository } from '../../infrastructure/repositories/PrismaProjectRepository';

// Extend window type for Mermaid
declare global {
  interface Window {
    mermaid?: {
      render: (id: string, content: string) => Promise<{ svg: string } | string>;
      initialize: (config: any) => void;
      run: (options?: { nodes?: Node[] }) => Promise<void>;
    };
  }
}

interface UMLManagerProps {
  project: ProjectEntity | null;
}

// Component for rendering PlantUML diagrams with proper DEFLATE encoding
const PlantUMLDiagram: React.FC<{ content: string; name: string }> = ({ content, name }) => {
  const [encoded, setEncoded] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Encode PlantUML content using DEFLATE compression
  const encodePlantUML = async (diagramContent: string): Promise<string> => {
    try {
      // Check if CompressionStream API is available (modern browsers)
      if (typeof CompressionStream === 'undefined') {
        throw new Error('CompressionStream API not available. Please use a modern browser (Chrome 80+, Firefox 113+, Safari 16.4+).');
      }

      // Convert string to UTF-8 bytes
      const encoder = new TextEncoder();
      const data = encoder.encode(diagramContent);
      
      // Compress using DEFLATE
      const stream = new CompressionStream('deflate');
      const writer = stream.writable.getWriter();
      writer.write(data);
      writer.close();
      
      const compressed = await new Response(stream.readable).arrayBuffer();
      
      // Convert to Base64
      const base64 = btoa(String.fromCharCode(...new Uint8Array(compressed)));
      
      // Add ~1 header to indicate DEFLATE encoding (fixes PlantUML HUFFMAN error)
      // This tells PlantUML to use DEFLATE instead of HUFFMAN encoding
      return `~1${base64}`;
    } catch (err: any) {
      console.error('Error encoding PlantUML:', err);
      setError(err.message || 'Error encoding diagram');
      throw err; // Re-throw to let component handle it
    }
  };

  useEffect(() => {
    encodePlantUML(content).then(enc => {
      setEncoded(enc);
      setLoading(false);
    }).catch(err => {
      setError(err.message || 'Error encoding PlantUML diagram');
      setLoading(false);
    });
  }, [content]);

  if (loading) {
    return (
      <div className="w-full bg-white border border-gray-200 rounded-lg p-4 overflow-auto">
        <div className="text-gray-500 text-center py-4">Rendering PlantUML diagram...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full bg-white border border-gray-200 rounded-lg p-4 overflow-auto">
        <div className="text-purple-600 p-4 bg-purple-50 rounded-lg">
          Error encoding PlantUML diagram: {error}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full bg-white border border-gray-200 rounded-lg p-4 overflow-auto">
      <img
        src={`https://www.plantuml.com/plantuml/svg/${encoded}`}
        alt={name}
        className="max-w-full h-auto"
        onError={(e) => {
          const target = e.target as HTMLImageElement;
          target.style.display = 'none';
          const parent = target.parentElement;
          if (parent && !parent.querySelector('.error-message')) {
            const errorDiv = document.createElement('div');
            errorDiv.className = 'error-message text-purple-600 p-4 bg-purple-50 rounded-lg';
            errorDiv.textContent = 'Error rendering PlantUML diagram. Please check the syntax.';
            parent.appendChild(errorDiv);
          }
        }}
      />
    </div>
  );
};

// Component for rendering Mermaid diagrams
const MermaidDiagram: React.FC<{ content: string; id: string }> = ({ content, id }) => {
  const mermaidRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!mermaidRef.current) return;

    const renderMermaid = async () => {
      if (window.mermaid) {
        try {
          // Clear previous content
          if (mermaidRef.current) {
            mermaidRef.current.textContent = content;
            mermaidRef.current.className = 'mermaid';
            
            // Use Mermaid's run method to render all mermaid diagrams on the page
            // This is the standard way to use Mermaid v10+
            await window.mermaid.run({
              nodes: [mermaidRef.current],
            });
            setError(null);
          }
        } catch (err: any) {
          console.error('Mermaid rendering error:', err);
          setError(err.message || 'Error rendering Mermaid diagram');
        }
      } else {
        // Wait for Mermaid to load
        const checkMermaid = setInterval(() => {
          if (window.mermaid && mermaidRef.current) {
            clearInterval(checkMermaid);
            mermaidRef.current.textContent = content;
            mermaidRef.current.className = 'mermaid';
            window.mermaid.run({
              nodes: [mermaidRef.current],
            }).catch((err: any) => {
              console.error('Mermaid error:', err);
              setError(err.message || 'Error rendering Mermaid diagram');
            });
          }
        }, 100);
        
        // Stop checking after 5 seconds
        setTimeout(() => {
          clearInterval(checkMermaid);
          if (!window.mermaid) {
            setError('Mermaid library not loaded. Please refresh the page.');
          }
        }, 5000);

        return () => clearInterval(checkMermaid);
      }
    };

    renderMermaid();
  }, [content, id]);

  if (error) {
    return (
      <div className="text-red-600 p-4 bg-red-50 rounded-lg">
        Error rendering Mermaid diagram: {error}
      </div>
    );
  }

  return (
    <div className="w-full bg-white border border-gray-200 rounded-lg p-4">
      <div ref={mermaidRef} className="mermaid">
        {content}
      </div>
    </div>
  );
};

const UMLManager: React.FC<UMLManagerProps> = ({ project }) => {
  const [diagrams, setDiagrams] = useState<UMLDiagramEntity[]>([]);
  const [selectedDiagram, setSelectedDiagram] = useState<UMLDiagramEntity | null>(null);
  const [showEditor, setShowEditor] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showPreview, setShowPreview] = useState(true);
  const [uploadMode, setUploadMode] = useState<'file' | 'paste' | 'ai'>('paste');
  const [expandedCategories, setExpandedCategories] = useState<{ [key: string]: boolean }>({});
  const fileInputRef = useRef<HTMLInputElement>(null);
  const repo = useMemo(() => new PrismaProjectRepository(), []);
  const [artifacts, setArtifacts] = useState<ProjectArtifactEntity[]>([]);
  const [selectedArtifacts, setSelectedArtifacts] = useState<string[]>([]); // IDs of selected artifacts for knowledge base
  const [aiDiagramTool, setAiDiagramTool] = useState<UMLDiagramTool>('PLANTUML');
  const [aiDiagramType, setAiDiagramType] = useState<UMLGenDiagramType>('CLASS');
  const [aiDescription, setAiDescription] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const umlGenerator = useMemo(() => {
    try {
      return new UMLDiagramGenerator();
    } catch (error) {
      console.error('Failed to initialize UML generator:', error);
      return null;
    }
  }, []);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    diagramType: 'PLANTUML' as UMLDiagramType,
    format: 'class',
    content: '',
  });

  const loadDiagrams = useCallback(async () => {
    if (!project) {
      setDiagrams([]);
      return;
    }
    const projectDiagrams = await repo.getUMLDiagramsByProject(project.id);
    setDiagrams(projectDiagrams);
  }, [project, repo]);

  const loadArtifacts = useCallback(async () => {
    if (!project) {
      setArtifacts([]);
      return;
    }
    const projectArtifacts = await repo.getArtifactsByProject(project.id);
    setArtifacts(projectArtifacts);
  }, [project, repo]);

  useEffect(() => {
    loadDiagrams();
    loadArtifacts();
  }, [loadDiagrams, loadArtifacts]);

  const handleNewDiagram = () => {
    setFormData({
      name: '',
      description: '',
      diagramType: 'PLANTUML',
      format: 'class',
      content: '',
    });
    setSelectedDiagram(null);
    setIsEditing(false);
    setShowEditor(true);
    setUploadMode('paste');
    setSelectedArtifacts([]);
    setAiDescription('');
    setAiDiagramTool('PLANTUML');
    setAiDiagramType('CLASS');
  };

  const handleGenerateWithAI = async () => {
    if (!project || !umlGenerator) {
      alert('AI generation is not available. Please check your API key configuration.');
      return;
    }

    if (!formData.name.trim()) {
      alert('Please provide a diagram name');
      return;
    }

    setIsGenerating(true);
    try {
      const selectedArtifactEntities = artifacts.filter(a => selectedArtifacts.includes(a.id));
      
      const diagramCode = await umlGenerator.generateDiagram({
        diagramTool: aiDiagramTool,
        diagramType: aiDiagramType,
        description: aiDescription || `Generate a ${aiDiagramType} diagram for ${formData.name}`,
        context: {
          projectName: project.name,
          projectDescription: project.description,
          selectedArtifacts: selectedArtifactEntities,
        },
      });

      // Map UMLDiagramTool to UMLDiagramType
      const diagramTypeMap: Record<UMLDiagramTool, UMLDiagramType> = {
        PLANTUML: 'PLANTUML',
        MERMAID: 'MERMAID',
        DIAGRAMS_PYTHON: 'DIAGRAMS_PYTHON',
        GRAPHVIZ_DOT: 'GRAPHVIZ_DOT',
        STRUCTURIZR_DSL: 'STRUCTURIZR_DSL',
        C4_PLANTUML: 'C4_PLANTUML',
        C4_MERMAID: 'C4_MERMAID',
        ARCHIMATE: 'ARCHIMATE',
        D2: 'D2',
        KROKI: 'KROKI',
      };

      // Map UMLGenDiagramType to format string
      const formatMap: Record<UMLGenDiagramType, string> = {
        CLASS: 'class',
        SEQUENCE: 'sequence',
        ACTIVITY: 'activity',
        COMPONENT: 'component',
        USECASE: 'usecase',
        STATE: 'state',
        ER: 'er',
        FLOWCHART: 'flowchart',
        ARCHITECTURE: 'architecture',
        DEPLOYMENT: 'deployment',
        PACKAGE: 'package',
        OBJECT: 'object',
        COMMUNICATION: 'communication',
        TIMING: 'timing',
        INTERACTION_OVERVIEW: 'interaction_overview',
        COMPOSITE_STRUCTURE: 'composite_structure',
      };

      setFormData({
        ...formData,
        diagramType: diagramTypeMap[aiDiagramTool] || 'PLANTUML',
        format: formatMap[aiDiagramType] || 'class',
        content: diagramCode,
        description: formData.description || `AI-generated ${aiDiagramType} diagram`,
      });

      setUploadMode('paste');
      alert('Diagram generated successfully! Review and save when ready.');
    } catch (error: any) {
      console.error('Error generating diagram:', error);
      alert(`Error generating diagram: ${error.message || 'Unknown error'}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleEditDiagram = (diagram: UMLDiagramEntity) => {
    setFormData({
      name: diagram.name,
      description: diagram.description,
      diagramType: diagram.diagramType,
      format: diagram.format,
      content: diagram.content,
    });
    setSelectedDiagram(diagram);
    setIsEditing(true);
    setShowEditor(true);
    setUploadMode('paste');
  };

  const handleSaveDiagram = async () => {
    if (!project || !formData.name.trim() || !formData.content.trim()) {
      alert('Please provide a name and diagram content');
      return;
    }

    try {
      const diagramData = {
        projectId: project.id,
        name: formData.name.trim(),
        description: formData.description.trim(),
        diagramType: formData.diagramType,
        content: formData.content.trim(),
        format: formData.format,
      };

      if (isEditing && selectedDiagram) {
        await repo.updateUMLDiagram(selectedDiagram.id, diagramData);
      } else {
        await repo.createUMLDiagram(diagramData);
      }

      await loadDiagrams();
      setShowEditor(false);
      setSelectedDiagram(null);
      setIsEditing(false);
    } catch (error) {
      console.error('Error saving UML diagram:', error);
      alert('Error saving diagram. Please try again.');
    }
  };

  const handleDeleteDiagram = async (id: string) => {
    if (!confirm('Are you sure you want to delete this diagram?')) return;

    try {
      await repo.deleteUMLDiagram(id);
      await loadDiagrams();
      if (selectedDiagram?.id === id) {
        setSelectedDiagram(null);
      }
    } catch (error) {
      console.error('Error deleting diagram:', error);
      alert('Error deleting diagram. Please try again.');
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !project) return;

    try {
      const content = await file.text();
      const fileName = file.name.toLowerCase();
      
      // Detect diagram type from file extension or content
      let diagramType: UMLDiagramType = 'OTHER';
      let format = 'generic';
      
      if (fileName.endsWith('.puml') || fileName.endsWith('.plantuml') || content.trim().startsWith('@startuml')) {
        diagramType = 'PLANTUML';
        // Detect format from content
        if (content.includes('class')) format = 'class';
        else if (content.includes('sequence')) format = 'sequence';
        else if (content.includes('activity')) format = 'activity';
        else if (content.includes('component')) format = 'component';
        else if (content.includes('usecase')) format = 'usecase';
      } else if (fileName.endsWith('.mmd') || fileName.endsWith('.mermaid') || content.trim().startsWith('graph') || content.trim().startsWith('sequenceDiagram')) {
        diagramType = 'MERMAID';
        if (content.includes('sequenceDiagram')) format = 'sequence';
        else if (content.includes('classDiagram')) format = 'class';
        else if (content.includes('stateDiagram')) format = 'state';
        else if (content.includes('erDiagram')) format = 'er';
        else format = 'flowchart';
      } else if (fileName.endsWith('.json')) {
        diagramType = 'JSON';
        format = 'json';
      } else if (fileName.endsWith('.xml')) {
        diagramType = 'XML';
        format = 'xml';
      }

      setFormData({
        name: file.name.replace(/\.[^/.]+$/, ''),
        description: `Uploaded from ${file.name}`,
        diagramType,
        format,
        content,
      });
      setShowEditor(true);
      setIsEditing(false);
      setUploadMode('file');
    } catch (error) {
      console.error('Error reading file:', error);
      alert('Error reading file. Please try again.');
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const getDiagramTypeLabel = (type: UMLDiagramType): string => {
    const labels: Record<UMLDiagramType, string> = {
      PLANTUML: 'PlantUML',
      MERMAID: 'Mermaid',
      JSON: 'JSON',
      XML: 'XML',
      DIAGRAMS_PYTHON: 'Diagrams Python',
      GRAPHVIZ_DOT: 'Graphviz DOT',
      STRUCTURIZR_DSL: 'Structurizr DSL',
      C4_PLANTUML: 'C4 Model (PlantUML)',
      C4_MERMAID: 'C4 Model (Mermaid)',
      ARCHIMATE: 'ArchiMate',
      D2: 'D2',
      KROKI: 'Kroki',
      OTHER: 'Other',
    };
    return labels[type] || type;
  };


  const getFormatLabel = (format: string): string => {
    return format.charAt(0).toUpperCase() + format.slice(1);
  };

  // Group diagrams by type
  const diagramsByType: { [key: string]: UMLDiagramEntity[] } = {};
  diagrams.forEach(diagram => {
    const type = diagram.diagramType;
    if (!diagramsByType[type]) {
      diagramsByType[type] = [];
    }
    diagramsByType[type].push(diagram);
  });

  const toggleCategory = (type: string) => {
    setExpandedCategories(prev => ({ ...prev, [type]: !prev[type] }));
  };

  // Render diagram preview
  const renderDiagramPreview = (diagram: UMLDiagramEntity) => {
    if (diagram.diagramType === 'PLANTUML') {
      // Use PlantUML component with proper DEFLATE encoding
      return <PlantUMLDiagram content={diagram.content} name={diagram.name} />;
    } else if (diagram.diagramType === 'MERMAID') {
      return <MermaidDiagram content={diagram.content} id={diagram.id} />;
    } else {
      // For JSON, XML, and other formats, show formatted code
      return (
        <div className="w-full bg-gray-900 text-green-400 p-4 rounded-lg overflow-auto font-mono text-sm">
          <pre className="whitespace-pre-wrap">{diagram.content}</pre>
        </div>
      );
    }
  };

  if (!project) {
    return (
      <div className="bg-white rounded-lg shadow-md p-8 text-center">
        <Layers size={48} className="mx-auto text-gray-300 mb-4" />
        <p className="text-gray-600">Please select a project to manage UML diagrams</p>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-180px)] gap-0">
      {/* Inner Sidebar - Diagram List */}
      <div className="w-80 bg-white rounded-lg shadow-md flex flex-col border-r border-gray-200">
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-800 flex items-center space-x-2">
              <Layers size={20} />
              <span>UML Diagrams</span>
            </h2>
            <button
              onClick={handleNewDiagram}
              className="p-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-colors"
              title="New Diagram"
            >
              <Plus size={18} />
            </button>
          </div>
        </div>

        {/* Diagrams List */}
        <div className="flex-1 overflow-y-auto">
          {diagrams.length === 0 ? (
            <div className="p-8 text-center">
              <Layers size={32} className="mx-auto text-gray-300 mb-2" />
              <p className="text-sm text-gray-500">No diagrams yet</p>
              <button
                onClick={handleNewDiagram}
                className="mt-4 inline-flex items-center space-x-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white px-4 py-2 rounded-lg hover:from-purple-700 hover:to-blue-700 transition-colors text-sm font-semibold"
              >
                <Plus size={16} />
                <span>Create First Diagram</span>
              </button>
            </div>
          ) : (
            <div className="p-2">
              {Object.entries(diagramsByType).map(([type, typeDiagrams]) => (
                <div key={type} className="mb-2">
                  <button
                    onClick={() => toggleCategory(type)}
                    className="w-full flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg transition-colors"
                  >
                    <div className="flex items-center space-x-2 flex-1 min-w-0">
                      <ChevronRight
                        size={16}
                        className={`transition-transform text-gray-500 flex-shrink-0 ${
                          expandedCategories[type] ? 'rotate-90' : ''
                        }`}
                      />
                      <span className="text-sm font-medium text-gray-700 truncate">
                        {getDiagramTypeLabel(type as UMLDiagramType)}
                      </span>
                      <span className="text-xs text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded-full flex-shrink-0">
                        {typeDiagrams.length}
                      </span>
                    </div>
                  </button>

                  {expandedCategories[type] && (
                    <div className="ml-4 mt-1 space-y-1">
                      {typeDiagrams.map((diagram) => (
                        <button
                          key={diagram.id}
                          onClick={() => setSelectedDiagram(diagram)}
                          className={`w-full flex items-center space-x-2 p-2 rounded-lg text-sm transition-colors text-left ${
                            selectedDiagram?.id === diagram.id
                              ? 'bg-purple-100 text-purple-700 font-medium'
                              : 'hover:bg-gray-50 text-gray-600'
                          }`}
                          title={diagram.name}
                        >
                          <FileText size={14} className="flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="truncate">{diagram.name}</p>
                            <p className="text-xs text-gray-500 truncate">
                              {getFormatLabel(diagram.format)}
                            </p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 bg-white rounded-lg shadow-md overflow-hidden flex flex-col border-l border-gray-200">
        {selectedDiagram ? (
          <div className="flex flex-col h-full">
            {/* Diagram Header */}
            <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-purple-600 to-blue-600 text-white">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-xl font-bold">{selectedDiagram.name}</h3>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center text-xs bg-white text-purple-700 px-2.5 py-1 rounded-md font-medium">
                      {getDiagramTypeLabel(selectedDiagram.diagramType)}
                    </span>
                    <span className="inline-flex items-center text-xs bg-white text-purple-700 px-2.5 py-1 rounded-md font-medium">
                      {getFormatLabel(selectedDiagram.format)}
                    </span>
                    <span className="inline-flex items-center text-xs text-white bg-purple-600 bg-opacity-40 px-2.5 py-1 rounded-md">
                      Updated: {new Date(selectedDiagram.updatedAt).toLocaleDateString()}
                    </span>
                  </div>
                  {selectedDiagram.description && (
                    <p className="text-sm text-purple-100 mt-2">{selectedDiagram.description}</p>
                  )}
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => setShowPreview(!showPreview)}
                    className="p-2 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg transition-colors text-white"
                    title={showPreview ? 'Hide Preview' : 'Show Preview'}
                  >
                    {showPreview ? <EyeOff size={18} className="text-white" /> : <Eye size={18} className="text-white" />}
                  </button>
                  <button
                    onClick={() => handleEditDiagram(selectedDiagram)}
                    className="flex items-center gap-2 bg-white text-purple-700 px-4 py-2 rounded-lg hover:bg-purple-50 transition-colors font-semibold whitespace-nowrap"
                  >
                    <Edit size={16} className="text-purple-700" />
                    <span>Edit</span>
                  </button>
                  <button
                    onClick={() => handleDeleteDiagram(selectedDiagram.id)}
                    className="p-2 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg transition-colors text-white"
                    title="Delete"
                  >
                    <Trash2 size={18} className="text-white" />
                  </button>
                  <button
                    onClick={() => setSelectedDiagram(null)}
                    className="p-2 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg transition-colors text-white"
                    title="Close"
                  >
                    <X size={18} className="text-white" />
                  </button>
                </div>
              </div>
            </div>

            {/* Diagram Content */}
            <div className="flex-1 overflow-auto p-6">
              {showPreview ? (
                <div className="space-y-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="text-sm font-semibold text-gray-700 mb-2">Preview</h4>
                    {renderDiagramPreview(selectedDiagram)}
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="text-sm font-semibold text-gray-700 mb-2">Source Code</h4>
                    <pre className="bg-gray-900 text-green-400 p-4 rounded-lg overflow-auto font-mono text-xs whitespace-pre-wrap">
                      {selectedDiagram.content}
                    </pre>
                  </div>
                </div>
              ) : (
                <div className="bg-gray-50 rounded-lg p-4 h-full">
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">Source Code</h4>
                  <pre className="bg-gray-900 text-green-400 p-4 rounded-lg overflow-auto font-mono text-xs whitespace-pre-wrap h-full">
                    {selectedDiagram.content}
                  </pre>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <Layers size={48} className="mx-auto text-gray-300 mb-4" />
              <p className="text-gray-600">Select a diagram to view</p>
              <p className="text-sm text-gray-500 mt-2">
                Choose a diagram from the list on the left
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Diagram Editor Modal */}
      {showEditor && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-4 flex items-center justify-between rounded-t-lg">
              <h3 className="text-xl font-bold">
                {isEditing ? `Edit Diagram: ${formData.name}` : 'New UML Diagram'}
              </h3>
              <button
                onClick={() => {
                  setShowEditor(false);
                  setSelectedDiagram(null);
                  setIsEditing(false);
                }}
                className="text-white hover:text-purple-200 transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            {/* Form */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {/* Upload Mode Toggle */}
              <div className="flex items-center space-x-4 border-b border-gray-200 pb-4">
                <button
                  onClick={() => setUploadMode('paste')}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                    uploadMode === 'paste'
                      ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white'
                      : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                  }`}
                >
                  <Code size={18} />
                  <span>Paste Code</span>
                </button>
                <button
                  onClick={() => {
                    setUploadMode('file');
                    fileInputRef.current?.click();
                  }}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                    uploadMode === 'file'
                      ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white'
                      : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                  }`}
                >
                  <FileUp size={18} />
                  <span>Upload File</span>
                </button>
                <button
                  onClick={() => setUploadMode('ai')}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                    uploadMode === 'ai'
                      ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white'
                      : !umlGenerator
                      ? 'bg-gray-100 text-gray-500 hover:bg-gray-200 cursor-not-allowed'
                      : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                  }`}
                  disabled={!umlGenerator}
                  title={!umlGenerator ? 'AI generation requires API key configuration' : 'Generate with AI'}
                >
                  <Sparkles size={18} />
                  <span>Generate with AI</span>
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".puml,.plantuml,.mmd,.mermaid,.json,.xml,.txt"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </div>

              {/* AI Generation Panel */}
              {uploadMode === 'ai' && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-4">
                  <div className="flex items-center space-x-2 text-blue-800 font-semibold">
                    <Sparkles size={18} />
                    <span>AI Diagram Generation</span>
                  </div>
                  
                  {/* Knowledge Base Selection */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      <BookOpen size={16} className="inline mr-1" />
                      Knowledge Base (Select business artifacts to use as context)
                    </label>
                    {artifacts.length === 0 ? (
                      <p className="text-sm text-gray-500 italic">No business artifacts available. Upload some business artifacts first to use as knowledge base.</p>
                    ) : (
                      <div className="max-h-40 overflow-y-auto border border-gray-300 rounded-lg p-2 space-y-2">
                        {artifacts.map((artifact) => (
                          <label key={artifact.id} className="flex items-center space-x-2 p-2 hover:bg-blue-100 rounded cursor-pointer">
                            <input
                              type="checkbox"
                              checked={selectedArtifacts.includes(artifact.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedArtifacts([...selectedArtifacts, artifact.id]);
                                } else {
                                  setSelectedArtifacts(selectedArtifacts.filter(id => id !== artifact.id));
                                }
                              }}
                              className="rounded"
                            />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-700 truncate">{artifact.fileName}</p>
                              <p className="text-xs text-gray-500">{artifact.artifactType}</p>
                            </div>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Diagram Tool Selection */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Diagram Tool/Language *
                      </label>
                      <select
                        value={aiDiagramTool}
                        onChange={(e) => setAiDiagramTool(e.target.value as UMLDiagramTool)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900 bg-white"
                      >
                        <option value="PLANTUML">PlantUML</option>
                        <option value="MERMAID">Mermaid</option>
                        <option value="DIAGRAMS_PYTHON">Diagrams Python</option>
                        <option value="GRAPHVIZ_DOT">Graphviz DOT</option>
                        <option value="STRUCTURIZR_DSL">Structurizr DSL</option>
                        <option value="C4_PLANTUML">C4 Model (PlantUML)</option>
                        <option value="C4_MERMAID">C4 Model (Mermaid)</option>
                        <option value="ARCHIMATE">ArchiMate</option>
                        <option value="D2">D2</option>
                        <option value="KROKI">Kroki</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        UML Diagram Type *
                      </label>
                      <select
                        value={aiDiagramType}
                        onChange={(e) => setAiDiagramType(e.target.value as UMLGenDiagramType)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900 bg-white"
                      >
                        <option value="CLASS">Class Diagram</option>
                        <option value="SEQUENCE">Sequence Diagram</option>
                        <option value="ACTIVITY">Activity Diagram</option>
                        <option value="COMPONENT">Component Diagram</option>
                        <option value="USECASE">Use Case Diagram</option>
                        <option value="STATE">State Diagram</option>
                        <option value="ER">Entity-Relationship Diagram</option>
                        <option value="FLOWCHART">Flowchart</option>
                        <option value="ARCHITECTURE">Architecture Diagram</option>
                        <option value="DEPLOYMENT">Deployment Diagram</option>
                        <option value="PACKAGE">Package Diagram</option>
                        <option value="OBJECT">Object Diagram</option>
                        <option value="COMMUNICATION">Communication Diagram</option>
                        <option value="TIMING">Timing Diagram</option>
                        <option value="INTERACTION_OVERVIEW">Interaction Overview</option>
                        <option value="COMPOSITE_STRUCTURE">Composite Structure</option>
                      </select>
                    </div>
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Description (Optional - describe what you want in the diagram)
                    </label>
                    <textarea
                      value={aiDescription}
                      onChange={(e) => setAiDescription(e.target.value)}
                      placeholder="e.g., Show the payment processing flow with integration to external systems"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-gray-900 bg-white"
                      rows={3}
                    />
                  </div>

                  {/* Generate Button */}
                  <button
                    onClick={handleGenerateWithAI}
                    disabled={isGenerating || !formData.name.trim()}
                    className="w-full flex items-center justify-center space-x-2 bg-blue-700 text-white px-6 py-3 rounded-lg hover:bg-blue-800 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isGenerating ? (
                      <>
                        <Loader size={18} className="animate-spin" />
                        <span>Generating Diagram...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles size={18} />
                        <span>Generate Diagram with AI</span>
                      </>
                    )}
                  </button>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Diagram Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Payment System Class Diagram"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-gray-900 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Diagram Type *
                  </label>
                  <select
                    value={formData.diagramType}
                    onChange={(e) => setFormData({ ...formData, diagramType: e.target.value as UMLDiagramType })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-gray-900 bg-white disabled:bg-gray-100 disabled:text-gray-500"
                    disabled={uploadMode === 'ai'}
                  >
                    <option value="PLANTUML">PlantUML</option>
                    <option value="MERMAID">Mermaid</option>
                    <option value="DIAGRAMS_PYTHON">Diagrams Python</option>
                    <option value="GRAPHVIZ_DOT">Graphviz DOT</option>
                    <option value="STRUCTURIZR_DSL">Structurizr DSL</option>
                    <option value="C4_PLANTUML">C4 Model (PlantUML)</option>
                    <option value="C4_MERMAID">C4 Model (Mermaid)</option>
                    <option value="ARCHIMATE">ArchiMate</option>
                    <option value="D2">D2</option>
                    <option value="KROKI">Kroki</option>
                    <option value="JSON">JSON</option>
                    <option value="XML">XML</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Format
                  </label>
                  <select
                    value={formData.format}
                    onChange={(e) => setFormData({ ...formData, format: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-gray-900 bg-white"
                  >
                    <option value="class">Class</option>
                    <option value="sequence">Sequence</option>
                    <option value="activity">Activity</option>
                    <option value="component">Component</option>
                    <option value="usecase">Use Case</option>
                    <option value="state">State</option>
                    <option value="er">ER Diagram</option>
                    <option value="flowchart">Flowchart</option>
                    <option value="generic">Generic</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Description
                  </label>
                  <input
                    type="text"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Brief description of the diagram"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-gray-900 bg-white"
                  />
                </div>
              </div>

              {uploadMode !== 'ai' && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Diagram Code/Content *
                  </label>
                  <textarea
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    placeholder={
                      formData.diagramType === 'PLANTUML'
                        ? '@startuml\nclass PaymentService {\n  +processPayment()\n}\n@enduml'
                        : formData.diagramType === 'MERMAID'
                        ? 'graph TD\n    A[Start] --> B[Process]\n    B --> C[End]'
                        : 'Paste or type your diagram code here...'
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent font-mono text-sm text-gray-900 bg-white"
                    rows={20}
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    {formData.diagramType === 'PLANTUML' && 'PlantUML syntax is supported. Use @startuml and @enduml tags.'}
                    {formData.diagramType === 'MERMAID' && 'Mermaid syntax is supported. Use graph, sequenceDiagram, classDiagram, etc.'}
                    {formData.diagramType === 'DIAGRAMS_PYTHON' && 'Diagrams Python syntax. Use the diagrams library to create architecture diagrams.'}
                    {formData.diagramType === 'GRAPHVIZ_DOT' && 'Graphviz DOT syntax. Use digraph or graph declarations.'}
                    {formData.diagramType === 'STRUCTURIZR_DSL' && 'Structurizr DSL syntax. Use workspace, model, and relationship definitions.'}
                    {formData.diagramType === 'C4_PLANTUML' && 'C4 Model with PlantUML. Include C4_Container or C4_Component diagrams.'}
                    {formData.diagramType === 'C4_MERMAID' && 'C4 Model with Mermaid. Use C4 notation for architecture diagrams.'}
                  </p>
                </div>
              )}

              {uploadMode === 'ai' && formData.content && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Generated Diagram Code (Review and edit if needed)
                  </label>
                  <textarea
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent font-mono text-sm text-gray-900 bg-white"
                    rows={20}
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    Review the generated code. You can edit it before saving.
                  </p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="border-t border-gray-200 p-4 flex justify-end space-x-2">
              <button
                onClick={() => {
                  setShowEditor(false);
                  setSelectedDiagram(null);
                  setIsEditing(false);
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-semibold text-gray-900 bg-white"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveDiagram}
                disabled={!formData.name.trim() || (!formData.content.trim() && uploadMode !== 'ai')}
                className="flex items-center space-x-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-2 rounded-lg hover:from-purple-700 hover:to-blue-700 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save size={16} />
                <span>Save Diagram</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UMLManager;

