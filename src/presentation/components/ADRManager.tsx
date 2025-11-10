import { BookOpen, Edit, FileText, Loader, Plus, Save, Search, Sparkles, Trash2, X } from 'lucide-react';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ADREntity, ADRStatus, ProjectArtifactEntity, ProjectEntity } from '../../domain/entities/Project';
import { UploadedFile } from '../../domain/entities/Section';
import { ADR_TEMPLATE_CATEGORIES, ADRTemplate, getTemplatesByCategory } from '../../domain/services/adrTemplates';
import { ClaudeApiAdapter } from '../../infrastructure/adapters/api/ClaudeApiAdapter';
import { PrismaProjectRepository } from '../../infrastructure/repositories/PrismaProjectRepository';
import TinyMCEEditor from './TinyMCEEditor';

interface ADRManagerProps {
  project: ProjectEntity | null;
  artifacts?: ProjectArtifactEntity[];
}

const ADRManager: React.FC<ADRManagerProps> = ({ project, artifacts = [] }) => {
  const [adrs, setAdrs] = useState<ADREntity[]>([]);
  const [selectedADR, setSelectedADR] = useState<ADREntity | null>(null);
  const [showEditor, setShowEditor] = useState(false);
  const [showTemplateSelector, setShowTemplateSelector] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [isEditing, setIsEditing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<ADRStatus | 'all'>('all');
  const [loadingField, setLoadingField] = useState<'context' | 'decision' | 'consequences' | null>(null);
  const repo = useMemo(() => new PrismaProjectRepository(), []);
  const aiGenerator = useMemo(() => new ClaudeApiAdapter(), []);

  // Form state
  const [formData, setFormData] = useState({
    number: 1,
    title: '',
    status: 'proposed' as ADRStatus,
    date: new Date().toISOString().split('T')[0],
    context: '',
    decision: '',
    consequences: '',
  });


  const loadADRs = useCallback(async () => {
    if (!project) {
      setAdrs([]);
      return;
    }
    const projectADRs = await repo.getADRsByProject(project.id);
    setAdrs(projectADRs);
  }, [project, repo]);

  useEffect(() => {
    loadADRs();
  }, [loadADRs]);

  const getNextADRNumber = useCallback(() => {
    if (adrs.length === 0) return 1;
    return Math.max(...adrs.map(adr => adr.number)) + 1;
  }, [adrs]);

  const handleNewADR = () => {
    setShowTemplateSelector(true);
  };

  const handleNewADRFromTemplate = (template?: ADRTemplate) => {
    if (!project) return;
    setFormData({
      number: getNextADRNumber(),
      title: template?.title || '',
      status: 'proposed',
      date: new Date().toISOString().split('T')[0],
      context: template?.context || '',
      decision: template?.decision || '',
      consequences: template?.consequences || '',
    });
    setSelectedADR(null);
    setIsEditing(false);
    setShowTemplateSelector(false);
    setShowEditor(true);
  };

  const handleNewADRBlank = () => {
    handleNewADRFromTemplate();
  };

  const handleEditADR = (adr: ADREntity) => {
    setFormData({
      number: adr.number,
      title: adr.title,
      status: adr.status,
      date: new Date(adr.date).toISOString().split('T')[0],
      context: adr.context,
      decision: adr.decision,
      consequences: adr.consequences,
    });
    setSelectedADR(adr);
    setIsEditing(true);
    setShowEditor(true);
  };

  const handleSaveADR = async () => {
    if (!project) return;

    try {
      // Get content from editors and clean it
      const getEditorContent = (content: string, fallback: string): string => {
        const result = content || fallback;
        return cleanHTMLContent(result);
      };

      const adrData = {
        projectId: project.id,
        number: formData.number,
        title: formData.title,
        status: formData.status,
        date: new Date(formData.date),
        context: getEditorContent(formData.context, ''),
        decision: getEditorContent(formData.decision, ''),
        consequences: getEditorContent(formData.consequences, ''),
      };

      if (isEditing && selectedADR) {
        await repo.updateADR(selectedADR.id, adrData);
      } else {
        await repo.createADR(adrData);
      }

      await loadADRs();
      setShowEditor(false);
      setSelectedADR(null);
      setIsEditing(false);
    } catch (error) {
      console.error('Error saving ADR:', error);
      alert('Error saving ADR. Please try again.');
    }
  };

  const handleDeleteADR = async (id: string) => {
    if (!confirm('Are you sure you want to delete this ADR?')) return;

    try {
      await repo.deleteADR(id);
      await loadADRs();
      if (selectedADR?.id === id) {
        setSelectedADR(null);
      }
    } catch (error) {
      console.error('Error deleting ADR:', error);
      alert('Error deleting ADR. Please try again.');
    }
  };

  const getStatusColor = (status: ADRStatus) => {
    switch (status) {
      case 'accepted':
        return 'bg-green-500/20 text-green-300 border border-green-500/30';
      case 'proposed':
        return 'bg-blue-500/20 text-blue-300 border border-blue-500/30';
      case 'deprecated':
        return 'bg-red-500/20 text-red-300 border border-red-500/30';
      case 'superseded':
        return 'bg-gray-500/20 text-gray-300 border border-gray-500/30';
      default:
        return 'bg-gray-500/20 text-gray-300 border border-gray-500/30';
    }
  };

  // Convert artifacts to UploadedFile format for AI generation
  const convertArtifactsToUploadedFiles = useCallback((artifacts: ProjectArtifactEntity[]): UploadedFile[] => {
    return artifacts.map(a => {
      const pdfBase64Match = a.fileContent.match(/\[PDF_BASE64_START\]([\s\S]+?)\[PDF_BASE64_END\]/);
      
      let file: File | undefined = undefined;
      let status: 'extracted' | 'pdf' | 'limited' | 'error' | 'ready' = 'extracted';
      let content = a.fileContent;
      
      if (pdfBase64Match && pdfBase64Match[1]) {
        try {
          const base64 = pdfBase64Match[1].trim();
          const binaryString = atob(base64);
          const bytes = new Uint8Array(binaryString.length);
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }
          const blob = new Blob([bytes], { type: a.fileType || 'application/pdf' });
          file = new File([blob], a.fileName, { type: a.fileType || 'application/pdf' });
          status = 'pdf';
          content = a.fileContent.replace(/\[PDF_BASE64_START\][\s\S]+?\[PDF_BASE64_END\]/, '').trim();
        } catch (error) {
          status = a.fileContent.includes('[PDF') ? 'pdf' : 'error';
        }
      } else if (a.fileContent.includes('[PDF') || a.fileType === 'application/pdf') {
        status = 'pdf';
      } else if (a.fileContent.includes('[Word')) {
        status = 'limited';
      }
      
      return {
        name: a.fileName,
        size: a.fileSize,
        type: a.fileType,
        content: content,
        status: status,
        file: file
      };
    });
  }, []);

  // Generate ADR content using AI
  const generateADRField = useCallback(async (fieldType: 'context' | 'decision' | 'consequences') => {
    if (!project || !formData.title.trim()) {
      alert('Please enter an ADR title first');
      return;
    }

    setLoadingField(fieldType);
    
    try {
      const uploadedFiles = convertArtifactsToUploadedFiles(artifacts);
      const projectContext = {
        name: project.name,
        description: project.description
      };

      const generatedContent = await aiGenerator.generateADRContent(
        formData.title,
        fieldType,
        projectContext,
        uploadedFiles,
        fieldType === 'decision' ? formData.context : undefined,
        fieldType === 'consequences' ? formData.decision : undefined
      );

      setFormData(prev => ({
        ...prev,
        [fieldType]: generatedContent
      }));
    } catch (error) {
      console.error(`Error generating ADR ${fieldType}:`, error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      alert(`Error generating ${fieldType}: ${errorMessage}\n\nPlease check:\n- Your Claude API key is configured in .env file\n- Restart the dev server after updating .env\n- You have an active internet connection`);
    } finally {
      setLoadingField(null);
    }
  }, [project, formData.title, formData.context, formData.decision, artifacts, aiGenerator, convertArtifactsToUploadedFiles]);

  // Generate all ADR fields at once
  const generateAllADRFields = useCallback(async () => {
    if (!project || !formData.title.trim()) {
      alert('Please enter an ADR title first');
      return;
    }

    if (!confirm('Generate all ADR fields (Context, Decision, and Consequences) with AI? This may take a minute.')) {
      return;
    }

    setLoadingField('context');
    
    try {
      const uploadedFiles = convertArtifactsToUploadedFiles(artifacts);
      const projectContext = {
        name: project.name,
        description: project.description
      };

      // Generate Context first
      const context = await aiGenerator.generateADRContent(
        formData.title,
        'context',
        projectContext,
        uploadedFiles
      );

      setFormData(prev => ({ ...prev, context }));
      setLoadingField('decision');

      // Generate Decision (using context)
      const decision = await aiGenerator.generateADRContent(
        formData.title,
        'decision',
        projectContext,
        uploadedFiles,
        context
      );

      setFormData(prev => ({ ...prev, decision }));
      setLoadingField('consequences');

      // Generate Consequences (using decision)
      const consequences = await aiGenerator.generateADRContent(
        formData.title,
        'consequences',
        projectContext,
        uploadedFiles,
        context,
        decision
      );

      setFormData(prev => ({ ...prev, consequences }));
    } catch (error) {
      console.error('Error generating ADR fields:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      alert(`Error generating ADR content: ${errorMessage}\n\nPlease check:\n- Your Claude API key is configured in .env file\n- Restart the dev server after updating .env\n- You have an active internet connection`);
    } finally {
      setLoadingField(null);
    }
  }, [project, formData.title, artifacts, aiGenerator, convertArtifactsToUploadedFiles]);

  // Clean HTML content to remove duplicates and normalize
  const cleanHTMLContent = (html: string): string => {
    if (!html) return '';
    
    let cleaned = html.trim();
    
    // Remove empty paragraphs and normalize whitespace
    cleaned = cleaned.replace(/<p>\s*<\/p>/gi, '');
    cleaned = cleaned.replace(/<p><\/p>/gi, '');
    cleaned = cleaned.replace(/\s+/g, ' ');
    
    // Remove duplicate consecutive sections
    // Split by headings and paragraphs to identify sections
    const lines = cleaned.split(/(<(?:h[1-6]|p)[^>]*>.*?<\/(?:h[1-6]|p)>)/gi);
    const seen = new Map<string, number>();
    const uniqueLines: string[] = [];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (!line || !line.trim()) {
        uniqueLines.push(line);
        continue;
      }
      
      // Extract text content for comparison (remove HTML tags)
      const textContent = line.replace(/<[^>]*>/g, '').trim();
      
      if (!textContent) {
        uniqueLines.push(line);
        continue;
      }
      
      // Create a normalized key (first 50 chars, lowercase, no extra spaces)
      const key = textContent.toLowerCase().replace(/\s+/g, ' ').substring(0, 50);
      
      // Check if we've seen this content recently (within last 5 lines)
      const lastSeen = seen.get(key);
      if (lastSeen !== undefined && (i - lastSeen) < 5) {
        // This is a duplicate, skip it
        continue;
      }
      
      // Update seen map and add the line
      seen.set(key, i);
      uniqueLines.push(line);
    }
    
    return uniqueLines.join('');
  };

  // Filter ADRs based on search and status
  const filteredADRs = useMemo(() => {
    let filtered = adrs;

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(adr => 
        adr.title.toLowerCase().includes(query) ||
        adr.context.toLowerCase().includes(query) ||
        adr.decision.toLowerCase().includes(query) ||
        `adr-${adr.number}`.includes(query)
      );
    }

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(adr => adr.status === statusFilter);
    }

    // Sort by number (descending)
    return filtered.sort((a, b) => b.number - a.number);
  }, [adrs, searchQuery, statusFilter]);

  if (!project) {
    return (
      <div className="glass rounded-xl shadow-xl p-8 text-center border border-white/10">
        <FileText size={48} className="mx-auto text-purple-300/50 mb-4" />
        <p className="text-purple-200/70">Please select a project to manage ADRs</p>
      </div>
    );
  }

  return (
    <div className="flex" style={{ height: 'calc(100vh - 200px)', minHeight: '600px' }}>
      {/* Side Menu - ADR List */}
      <div className="w-80 glass-dark border-r border-white/10 flex flex-col shadow-xl" style={{ height: '100%' }}>
        {/* Header */}
        <div className="p-4 border-b border-purple-500/30 bg-gradient-to-r from-purple-600/30 via-blue-600/30 to-purple-600/30 backdrop-blur-xl sticky top-0 z-10">
        <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-white flex items-center space-x-2">
              <FileText size={20} />
              <span>Architecture Decisions</span>
          </h2>
          <button
            onClick={handleNewADR}
              className="flex items-center space-x-1 bg-gradient-to-r from-purple-600 to-blue-600 text-white px-3 py-1.5 rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all font-semibold text-sm shadow-lg"
              title="New ADR"
          >
              <Plus size={16} />
              <span>New</span>
          </button>
        </div>

          {/* Search */}
          <div className="relative mb-3">
            <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-purple-200/70" />
            <input
              type="text"
              placeholder="Search ADRs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-lg focus:ring-2 focus:ring-purple-400 focus:border-purple-400 focus:bg-white/20 text-sm text-white placeholder-purple-200/50 backdrop-blur-sm"
            />
          </div>

          {/* Status Filter */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                statusFilter === 'all'
                  ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg'
                  : 'bg-white/10 text-purple-200 hover:bg-white/20 border border-white/20'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setStatusFilter('proposed')}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                statusFilter === 'proposed'
                  ? 'bg-blue-500/80 text-white shadow-lg'
                  : 'bg-white/10 text-purple-200 hover:bg-white/20 border border-white/20'
              }`}
            >
              Proposed
            </button>
            <button
              onClick={() => setStatusFilter('accepted')}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                statusFilter === 'accepted'
                  ? 'bg-green-500/80 text-white shadow-lg'
                  : 'bg-white/10 text-purple-200 hover:bg-white/20 border border-white/20'
              }`}
            >
              Accepted
            </button>
            <button
              onClick={() => setStatusFilter('deprecated')}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                statusFilter === 'deprecated'
                  ? 'bg-red-500/80 text-white shadow-lg'
                  : 'bg-white/10 text-purple-200 hover:bg-white/20 border border-white/20'
              }`}
            >
              Deprecated
            </button>
          </div>
        </div>

        {/* ADR List */}
        <div className="flex-1 overflow-y-auto p-2">
          {adrs.length === 0 ? (
            <div className="text-center py-8 px-4">
              <FileText size={48} className="mx-auto text-purple-300/50 mb-4" />
              <p className="text-purple-200/70 mb-4 text-sm">No ADRs yet.</p>
              <button
                onClick={handleNewADR}
                className="inline-flex items-center space-x-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white px-4 py-2 rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all font-semibold text-sm shadow-lg"
              >
                <Plus size={16} />
                <span>Create First ADR</span>
              </button>
            </div>
          ) : filteredADRs.length === 0 ? (
            <div className="text-center py-8 px-4">
              <Search size={48} className="mx-auto text-purple-300/50 mb-4" />
              <p className="text-purple-200/70 text-sm">No ADRs match your search.</p>
          </div>
        ) : (
            <div className="space-y-2">
              {filteredADRs.map((adr) => (
              <div
                key={adr.id}
                  className={`border rounded-lg p-3 cursor-pointer transition-all backdrop-blur-sm ${
                    selectedADR?.id === adr.id
                      ? 'border-purple-400 bg-gradient-to-r from-purple-600/30 via-blue-600/30 to-purple-600/30 shadow-lg'
                      : 'border-white/20 bg-white/5 hover:border-purple-400/50 hover:bg-white/10 hover:shadow-md'
                  }`}
                onClick={() => setSelectedADR(adr)}
              >
                  <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="text-sm font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">ADR-{adr.number}</span>
                        <span className={`px-2 py-0.5 rounded text-xs font-semibold backdrop-blur-sm ${getStatusColor(adr.status)}`}>
                        {adr.status.toUpperCase()}
                      </span>
                      </div>
                      <h3 className="text-sm font-semibold text-white line-clamp-2 mb-1">{adr.title}</h3>
                      <p className="text-xs text-purple-200/70">
                        {new Date(adr.date).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center space-x-1 ml-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditADR(adr);
                      }}
                        className="p-1.5 text-blue-300 hover:bg-blue-500/20 rounded transition-colors"
                      title="Edit"
                    >
                        <Edit size={14} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteADR(adr.id);
                      }}
                        className="p-1.5 text-red-300 hover:bg-red-500/20 rounded transition-colors"
                      title="Delete"
                    >
                        <Trash2 size={14} />
                    </button>
                    </div>
                  </div>
                  <p className="text-xs text-purple-200/60 line-clamp-2">
                    {adr.context.replace(/<[^>]*>/g, '').substring(0, 100)}...
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Main Body - ADR Detail View */}
      <div className="flex-1 overflow-y-auto glass-dark">
        {selectedADR && !showEditor ? (
          <div className="min-h-full p-8">
            <div className="max-w-4xl mx-auto">
              {/* Header */}
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-purple-500/30">
                <div className="flex items-center space-x-3">
                  <h3 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">ADR-{selectedADR.number}</h3>
                  <span className={`px-3 py-1 rounded text-sm font-semibold backdrop-blur-sm ${getStatusColor(selectedADR.status)}`}>
                    {selectedADR.status.toUpperCase()}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleEditADR(selectedADR)}
                    className="flex items-center space-x-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white px-4 py-2 rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all font-semibold shadow-lg"
                  >
                    <Edit size={16} />
                    <span>Edit</span>
                  </button>
                  <button
                    onClick={() => setSelectedADR(null)}
                    className="p-2 text-purple-200 hover:bg-white/10 rounded transition-colors"
                    title="Close"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="space-y-6">
                <div>
                  <h4 className="text-2xl font-semibold text-white mb-2">{selectedADR.title}</h4>
                  <p className="text-sm text-purple-200/70">
                    Date: {new Date(selectedADR.date).toLocaleDateString('en-US', { 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </p>
                </div>

                 <div className="glass rounded-lg p-6 border border-white/10">
                   <h5 className="text-lg font-semibold text-purple-200 mb-3 flex items-center space-x-2">
                     <span className="w-1 h-6 bg-gradient-to-b from-purple-400 to-blue-400 rounded"></span>
                     <span>Context</span>
                   </h5>
                   <div 
                     className="prose prose-sm max-w-none text-purple-100/80 prose-headings:text-purple-200 prose-strong:text-white prose-a:text-blue-300"
                     dangerouslySetInnerHTML={{ __html: cleanHTMLContent(selectedADR.context) }}
                   />
                 </div>

                 <div className="glass rounded-lg p-6 border border-blue-500/30 bg-gradient-to-br from-blue-600/10 to-purple-600/10">
                   <h5 className="text-lg font-semibold text-blue-200 mb-3 flex items-center space-x-2">
                     <span className="w-1 h-6 bg-gradient-to-b from-blue-400 to-purple-400 rounded"></span>
                     <span>Decision</span>
                   </h5>
                   <div 
                     className="prose prose-sm max-w-none text-purple-100/80 prose-headings:text-blue-200 prose-strong:text-white prose-a:text-blue-300"
                     dangerouslySetInnerHTML={{ __html: cleanHTMLContent(selectedADR.decision) }}
                   />
                 </div>

                 <div className="glass rounded-lg p-6 border border-green-500/30 bg-gradient-to-br from-green-600/10 to-emerald-600/10">
                   <h5 className="text-lg font-semibold text-green-200 mb-3 flex items-center space-x-2">
                     <span className="w-1 h-6 bg-gradient-to-b from-green-400 to-emerald-400 rounded"></span>
                     <span>Consequences</span>
                   </h5>
                   <div 
                     className="prose prose-sm max-w-none text-purple-100/80 prose-headings:text-green-200 prose-strong:text-white prose-a:text-green-300"
                     dangerouslySetInnerHTML={{ __html: cleanHTMLContent(selectedADR.consequences) }}
                   />
                 </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center glass rounded-xl p-8 border border-white/10">
              <FileText size={64} className="mx-auto text-purple-300/50 mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">No ADR Selected</h3>
              <p className="text-purple-200/70 mb-4">Select an ADR from the sidebar to view its details</p>
              {adrs.length === 0 && (
                <button
                  onClick={handleNewADR}
                  className="inline-flex items-center space-x-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-3 rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all font-semibold shadow-lg"
                >
                  <Plus size={20} />
                  <span>Create Your First ADR</span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ADR Editor Modal */}
      {showEditor && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="glass-dark rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col border border-white/20">
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-600/90 via-blue-600/90 to-purple-600/90 text-white p-4 flex items-center justify-between rounded-t-xl backdrop-blur-xl">
              <h3 className="text-xl font-bold">
                {isEditing ? `Edit ADR-${formData.number}` : 'New Architecture Decision Record'}
              </h3>
              <button
                onClick={() => {
                  setShowEditor(false);
                  setSelectedADR(null);
                  setIsEditing(false);
                }}
                className="text-white hover:text-purple-200 transition-colors p-1 hover:bg-white/10 rounded"
              >
                <X size={24} />
              </button>
            </div>

            {/* Form */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-white/5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-purple-200 mb-2">
                    ADR Number *
                  </label>
                  <input
                    type="number"
                    value={formData.number}
                    onChange={(e) => setFormData({ ...formData, number: parseInt(e.target.value) || 1 })}
                    className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg focus:ring-2 focus:ring-purple-400 focus:border-purple-400 text-white placeholder-purple-200/50 backdrop-blur-sm"
                    min="1"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-purple-200 mb-2">
                    Status *
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as ADRStatus })}
                    className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg focus:ring-2 focus:ring-purple-400 focus:border-purple-400 text-white backdrop-blur-sm"
                  >
                    <option value="proposed" className="bg-gray-800">Proposed</option>
                    <option value="accepted" className="bg-gray-800">Accepted</option>
                    <option value="deprecated" className="bg-gray-800">Deprecated</option>
                    <option value="superseded" className="bg-gray-800">Superseded</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-purple-200 mb-2">
                  Date *
                </label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg focus:ring-2 focus:ring-purple-400 focus:border-purple-400 text-white backdrop-blur-sm"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-semibold text-purple-200">
                  Title *
                </label>
                  {artifacts.length > 0 && (
                    <span className="text-xs text-purple-300/70">
                      {artifacts.length} artifact{artifacts.length !== 1 ? 's' : ''} available for AI
                    </span>
                  )}
                </div>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g., Use microservices architecture for the payment system"
                  className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg focus:ring-2 focus:ring-purple-400 focus:border-purple-400 text-white placeholder-purple-200/50 backdrop-blur-sm"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-semibold text-purple-200">
                  Context *
                </label>
                  <button
                    type="button"
                    onClick={() => generateADRField('context')}
                    disabled={loadingField !== null || !formData.title.trim()}
                    className="flex items-center space-x-1 bg-gradient-to-r from-purple-600/80 to-blue-600/80 text-white px-3 py-1.5 rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all font-semibold text-xs disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                    title="Generate context with AI"
                  >
                    {loadingField === 'context' ? (
                      <>
                        <Loader className="animate-spin" size={14} />
                        <span>Generating...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles size={14} />
                        <span>Generate with AI</span>
                      </>
                    )}
                  </button>
                </div>
                <div className="bg-white/5 rounded-lg border border-white/20">
                <TinyMCEEditor
                  value={formData.context}
                  onChange={(content) => setFormData({ ...formData, context: content })}
                  height={300}
                  placeholder="Enter context. Use the source code button to edit HTML directly. Or click 'Generate with AI' to create content automatically."
                />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-semibold text-purple-200">
                  Decision *
                </label>
                  <button
                    type="button"
                    onClick={() => generateADRField('decision')}
                    disabled={loadingField !== null || !formData.title.trim()}
                    className="flex items-center space-x-1 bg-gradient-to-r from-purple-600/80 to-blue-600/80 text-white px-3 py-1.5 rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all font-semibold text-xs disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                    title="Generate decision with AI"
                  >
                    {loadingField === 'decision' ? (
                      <>
                        <Loader className="animate-spin" size={14} />
                        <span>Generating...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles size={14} />
                        <span>Generate with AI</span>
                      </>
                    )}
                  </button>
                </div>
                <div className="bg-white/5 rounded-lg border border-white/20">
                <TinyMCEEditor
                  value={formData.decision}
                  onChange={(content) => setFormData({ ...formData, decision: content })}
                  height={300}
                  placeholder="Enter decision. Use the source code button to edit HTML directly. Or click 'Generate with AI' to create content automatically."
                />
              </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-semibold text-purple-200">
                  Consequences *
                </label>
                  <button
                    type="button"
                    onClick={() => generateADRField('consequences')}
                    disabled={loadingField !== null || !formData.title.trim()}
                    className="flex items-center space-x-1 bg-gradient-to-r from-purple-600/80 to-blue-600/80 text-white px-3 py-1.5 rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all font-semibold text-xs disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                    title="Generate consequences with AI"
                  >
                    {loadingField === 'consequences' ? (
                      <>
                        <Loader className="animate-spin" size={14} />
                        <span>Generating...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles size={14} />
                        <span>Generate with AI</span>
                      </>
                    )}
                  </button>
                </div>
                <div className="bg-white/5 rounded-lg border border-white/20">
                <TinyMCEEditor
                  value={formData.consequences}
                  onChange={(content) => setFormData({ ...formData, consequences: content })}
                  height={300}
                  placeholder="Enter consequences. Use the source code button to edit HTML directly. Or click 'Generate with AI' to create content automatically."
                />
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="border-t border-white/20 p-4 flex justify-between items-center bg-white/5">
              <button
                type="button"
                onClick={generateAllADRFields}
                disabled={loadingField !== null || !formData.title.trim()}
                className="flex items-center space-x-2 bg-gradient-to-r from-purple-500/80 to-blue-500/80 text-white px-4 py-2 rounded-lg hover:from-purple-600 hover:to-blue-600 transition-all font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                title="Generate all fields with AI"
              >
                {loadingField !== null ? (
                  <>
                    <Loader className="animate-spin" size={16} />
                    <span>Generating All Fields...</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={16} />
                    <span>Generate All with AI</span>
                  </>
                )}
              </button>
              <div className="flex space-x-2">
              <button
                onClick={() => {
                  setShowEditor(false);
                  setSelectedADR(null);
                  setIsEditing(false);
                }}
                  className="px-4 py-2 border border-white/20 rounded-lg hover:bg-white/10 transition-colors font-semibold text-purple-200"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveADR}
                disabled={!formData.title.trim()}
                  className="flex items-center space-x-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-2 rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
              >
                <Save size={16} />
                <span>Save ADR</span>
              </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Template Selector Modal */}
      {showTemplateSelector && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="glass-dark rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col border border-white/20">
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-600/90 via-blue-600/90 to-purple-600/90 text-white p-4 flex items-center justify-between rounded-t-xl backdrop-blur-xl">
              <div className="flex items-center space-x-2">
                <BookOpen size={24} />
                <h3 className="text-xl font-bold">Select ADR Template</h3>
              </div>
              <button
                onClick={() => setShowTemplateSelector(false)}
                className="text-white hover:text-purple-200 transition-colors p-1 hover:bg-white/10 rounded"
              >
                <X size={24} />
              </button>
            </div>

            {/* Category Filter */}
            <div className="border-b border-white/20 p-4 bg-white/5">
              <div className="flex flex-wrap gap-2">
                {ADR_TEMPLATE_CATEGORIES.map((category) => (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      selectedCategory === category
                        ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg'
                        : 'bg-white/10 text-purple-200 hover:bg-white/20 border border-white/20'
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>

            {/* Template List */}
            <div className="flex-1 overflow-y-auto p-4 bg-white/5">
              <div className="mb-4">
                <button
                  onClick={handleNewADRBlank}
                  className="w-full p-4 border-2 border-dashed border-white/30 rounded-lg hover:border-purple-400 hover:bg-gradient-to-r hover:from-purple-600/20 hover:to-blue-600/20 transition-all text-left backdrop-blur-sm"
                >
                  <div className="flex items-center space-x-2">
                    <Plus size={20} className="text-purple-300" />
                    <span className="font-semibold text-white">Create Blank ADR</span>
                  </div>
                  <p className="text-sm text-purple-200/70 mt-1">Start with an empty template</p>
                </button>
              </div>

              <div className="space-y-3">
                {getTemplatesByCategory(selectedCategory).map((template) => (
                  <div
                    key={template.id}
                    className="glass border border-white/20 rounded-lg p-4 hover:shadow-lg hover:border-purple-400/50 transition-all cursor-pointer"
                    onClick={() => handleNewADRFromTemplate(template)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <span className="px-2 py-1 bg-blue-500/20 text-blue-300 rounded text-xs font-semibold border border-blue-500/30 backdrop-blur-sm">
                            {template.category}
                          </span>
                        </div>
                        <h4 className="text-lg font-semibold text-white mb-2">{template.title}</h4>
                        <p className="text-sm text-purple-200/70 line-clamp-2">
                          {template.context.replace(/<[^>]*>/g, '').substring(0, 200)}...
                        </p>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleNewADRFromTemplate(template);
                        }}
                        className="ml-4 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all font-semibold text-sm shadow-lg"
                      >
                        Use Template
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ADRManager;

