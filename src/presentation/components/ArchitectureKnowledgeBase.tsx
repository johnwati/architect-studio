import { BookOpen, Database, Download, FileText, Filter, Layers, Paperclip, Plus, Search, Tag, Upload, X } from 'lucide-react';
import React, { useEffect, useMemo, useState } from 'react';
import { BrowserStorageAdapter } from '../../infrastructure/adapters/file-storage/BrowserStorageAdapter';
import prisma from '../../infrastructure/database/prisma';
import { useAuth } from '../contexts/AuthContext';

interface ArchitectureKnowledgeBaseProps {
  selectedProject?: any;
}

interface ArchitecturePattern {
  id: string;
  name: string;
  category: string;
  description: string;
  problem?: string;
  solution: string;
  benefits?: string[];
  tradeoffs?: string[];
  useCases?: string[];
  examples?: string[];
  diagram?: string;
  relatedPatterns?: string[];
  createdBy?: string;
  createdAt: Date;
  updatedAt: Date;
  tags?: string[];
}

interface ReferenceArchitecture {
  id: string;
  name: string;
  domain: string;
  description: string;
  overview: string;
  components: string[];
  layers?: string[];
  patterns?: string[];
  technologies?: string[];
  bestPractices?: string[];
  diagrams?: string[];
  useCases?: string[];
  caseStudies?: string[];
  createdBy?: string;
  createdAt: Date;
  updatedAt: Date;
  tags?: string[];
}

interface ReusableComponent {
  id: string;
  name: string;
  componentType: string;
  description: string;
  category?: string;
  vendor?: string;
  version?: string;
  specifications?: any;
  capabilities?: string[];
  integrations?: string[];
  dependencies?: string[];
  documentation?: string;
  examples?: string[];
  reuseCount: number;
  lastUsedAt?: Date;
  createdBy?: string;
  createdAt: Date;
  updatedAt: Date;
  tags?: string[];
}

interface Tag {
  id: string;
  name: string;
  category: string;
  description?: string;
  color?: string;
}

interface KnowledgeBaseFile {
  id: string;
  entityType: string;
  entityId: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  fileContent: string;
  description?: string;
  uploadedBy?: string;
  uploadedAt: Date;
}

type TabType = 'patterns' | 'architectures' | 'components';
type EntityType = 'pattern' | 'architecture' | 'component';

const ArchitectureKnowledgeBase: React.FC<ArchitectureKnowledgeBaseProps> = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('patterns');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [patterns, setPatterns] = useState<ArchitecturePattern[]>([]);
  const [architectures, setArchitectures] = useState<ReferenceArchitecture[]>([]);
  const [components, setComponents] = useState<ReusableComponent[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<ArchitecturePattern | ReferenceArchitecture | ReusableComponent | null>(null);
  const [itemFiles, setItemFiles] = useState<{ [key: string]: KnowledgeBaseFile[] }>({});
  const [showFileModal, setShowFileModal] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<KnowledgeBaseFile[]>([]);
  const [selectedEntityId, setSelectedEntityId] = useState<string | null>(null);
  const [selectedEntityType, setSelectedEntityType] = useState<EntityType | null>(null);
  const storageAdapter = useMemo(() => new BrowserStorageAdapter(), []);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Load patterns
      const patternsData = await (prisma as any).architecturePattern.findMany({
        include: {
          tagMappings: {
            include: { tag: true }
          }
        }
      });
      setPatterns(patternsData.map((p: any) => ({
        ...p,
        tags: p.tagMappings?.map((tm: any) => tm.tag.name) || []
      })));

      // Load reference architectures
      const architecturesData = await (prisma as any).referenceArchitecture.findMany({
        include: {
          tagMappings: {
            include: { tag: true }
          }
        }
      });
      setArchitectures(architecturesData.map((a: any) => ({
        ...a,
        components: JSON.parse(a.components || '[]'),
        layers: a.layers ? JSON.parse(a.layers) : undefined,
        patterns: a.patterns ? JSON.parse(a.patterns) : undefined,
        technologies: a.technologies ? JSON.parse(a.technologies) : undefined,
        bestPractices: a.bestPractices ? JSON.parse(a.bestPractices) : undefined,
        diagrams: a.diagrams ? JSON.parse(a.diagrams) : undefined,
        useCases: a.useCases ? JSON.parse(a.useCases) : undefined,
        caseStudies: a.caseStudies ? JSON.parse(a.caseStudies) : undefined,
        tags: a.tagMappings?.map((tm: any) => tm.tag.name) || []
      })));

      // Load reusable components
      const componentsData = await (prisma as any).reusableComponent.findMany({
        include: {
          tagMappings: {
            include: { tag: true }
          }
        }
      });
      setComponents(componentsData.map((c: any) => ({
        ...c,
        specifications: c.specifications ? JSON.parse(c.specifications) : undefined,
        capabilities: c.capabilities ? JSON.parse(c.capabilities) : undefined,
        integrations: c.integrations ? JSON.parse(c.integrations) : undefined,
        dependencies: c.dependencies ? JSON.parse(c.dependencies) : undefined,
        examples: c.examples ? JSON.parse(c.examples) : undefined,
        tags: c.tagMappings?.map((tm: any) => tm.tag.name) || []
      })));

      // Load tags
      const tagsData = await (prisma as any).tag.findMany();
      setTags(tagsData);

      // Load files for all items
      const allFiles = await (prisma as any).knowledgeBaseFile.findMany();
      const filesMap: { [key: string]: KnowledgeBaseFile[] } = {};
      allFiles.forEach((file: any) => {
        const key = `${file.entityType}-${file.entityId}`;
        if (!filesMap[key]) {
          filesMap[key] = [];
        }
        filesMap[key].push(file as KnowledgeBaseFile);
      });
      setItemFiles(filesMap);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const filteredItems = useMemo(() => {
    let items: any[] = [];
    
    if (activeTab === 'patterns') {
      items = patterns;
    } else if (activeTab === 'architectures') {
      items = architectures;
    } else {
      items = components;
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      items = items.filter(item => 
        item.name.toLowerCase().includes(query) ||
        item.description.toLowerCase().includes(query) ||
        (item.category && item.category.toLowerCase().includes(query)) ||
        (item.tags && item.tags.some((tag: string) => tag.toLowerCase().includes(query)))
      );
    }

    // Filter by tags
    if (selectedTags.length > 0) {
      items = items.filter(item => 
        item.tags && selectedTags.every(tag => item.tags.includes(tag))
      );
    }

    // Filter by category
    if (selectedCategory !== 'all') {
      if (activeTab === 'patterns') {
        items = items.filter((item: ArchitecturePattern) => item.category === selectedCategory);
      } else if (activeTab === 'architectures') {
        items = items.filter((item: ReferenceArchitecture) => item.domain === selectedCategory);
      } else {
        items = items.filter((item: ReusableComponent) => item.componentType === selectedCategory);
      }
    }

    return items;
  }, [activeTab, patterns, architectures, components, searchQuery, selectedTags, selectedCategory]);

  const categories = useMemo(() => {
    if (activeTab === 'patterns') {
      return [
        { value: 'all', label: 'All Patterns' },
        { value: 'MICROSERVICES', label: 'Microservices' },
        { value: 'EVENT_DRIVEN', label: 'Event-Driven' },
        { value: 'API_GATEWAY', label: 'API Gateway' },
        { value: 'ETL', label: 'ETL' },
        { value: 'CQRS', label: 'CQRS' },
        { value: 'SAGA', label: 'Saga' },
        { value: 'CIRCUIT_BREAKER', label: 'Circuit Breaker' },
        { value: 'SERVICE_MESH', label: 'Service Mesh' },
        { value: 'STRANGLER_FIG', label: 'Strangler Fig' },
        { value: 'BACKEND_FOR_FRONTEND', label: 'Backend for Frontend' },
        { value: 'OTHER', label: 'Other' },
      ];
    } else if (activeTab === 'architectures') {
      return [
        { value: 'all', label: 'All Domains' },
        { value: 'CLOUD_NATIVE', label: 'Cloud-Native' },
        { value: 'BANKING', label: 'Banking' },
        { value: 'ERP_INTEGRATION', label: 'ERP Integration' },
        { value: 'E_COMMERCE', label: 'E-Commerce' },
        { value: 'FINANCIAL_SERVICES', label: 'Financial Services' },
        { value: 'HEALTHCARE', label: 'Healthcare' },
        { value: 'RETAIL', label: 'Retail' },
        { value: 'MANUFACTURING', label: 'Manufacturing' },
        { value: 'TELECOMMUNICATIONS', label: 'Telecommunications' },
        { value: 'GOVERNMENT', label: 'Government' },
        { value: 'EDUCATION', label: 'Education' },
        { value: 'OTHER', label: 'Other' },
      ];
    } else {
      return [
        { value: 'all', label: 'All Types' },
        { value: 'APPLICATION', label: 'Application' },
        { value: 'API', label: 'API' },
        { value: 'DATABASE', label: 'Database' },
        { value: 'VENDOR', label: 'Vendor' },
        { value: 'SERVICE', label: 'Service' },
        { value: 'LIBRARY', label: 'Library' },
        { value: 'FRAMEWORK', label: 'Framework' },
        { value: 'MIDDLEWARE', label: 'Middleware' },
        { value: 'INFRASTRUCTURE', label: 'Infrastructure' },
        { value: 'OTHER', label: 'Other' },
      ];
    }
  }, [activeTab]);

  const handleCreate = () => {
    setSelectedItem(null);
    setShowCreateModal(true);
  };

  const handleEdit = (item: ArchitecturePattern | ReferenceArchitecture | ReusableComponent) => {
    setSelectedItem(item);
    setShowCreateModal(true);
  };

  const handleDelete = async (id: string, type: EntityType) => {
    if (!confirm('Are you sure you want to delete this item?')) return;

    try {
      if (type === 'pattern') {
        await (prisma as any).architecturePattern.delete({ where: { id } });
        setPatterns(patterns.filter(p => p.id !== id));
      } else if (type === 'architecture') {
        await (prisma as any).referenceArchitecture.delete({ where: { id } });
        setArchitectures(architectures.filter(a => a.id !== id));
      } else {
        await (prisma as any).reusableComponent.delete({ where: { id } });
        setComponents(components.filter(c => c.id !== id));
      }
    } catch (error) {
      console.error('Error deleting item:', error);
      alert('Error deleting item');
    }
  };

  const toggleTag = (tagName: string) => {
    setSelectedTags(prev => 
      prev.includes(tagName) 
        ? prev.filter(t => t !== tagName)
        : [...prev, tagName]
    );
  };

  const handleViewFiles = (item: ArchitecturePattern | ReferenceArchitecture | ReusableComponent, type: EntityType) => {
    const key = `${type.toUpperCase()}-${item.id}`;
    const files = itemFiles[key] || [];
    setSelectedFiles(files);
    setSelectedEntityId(item.id);
    setSelectedEntityType(type);
    setShowFileModal(true);
  };

  const handleUploadFiles = async (files: File[]) => {
    if (!selectedEntityId || !selectedEntityType) return;

    try {
      for (const file of files) {
        const uploadedFile = await storageAdapter.uploadFile(file);
        
        // Convert file to base64 for storage
        let fileContent = uploadedFile.content;
        if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
          try {
            const arrayBuffer = await file.arrayBuffer();
            const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
            fileContent = `[PDF_BASE64_START]${base64}[PDF_BASE64_END]${uploadedFile.content}`;
          } catch (error) {
            console.warn('Could not convert PDF to base64:', error);
          }
        }

        await (prisma as any).knowledgeBaseFile.create({
          data: {
            entityType: selectedEntityType.toUpperCase() as any,
            entityId: selectedEntityId,
            fileName: file.name,
            fileType: file.type,
            fileSize: file.size,
            fileContent: fileContent,
            uploadedBy: user?.email,
          }
        });
      }

      await loadData();
      alert(`Successfully uploaded ${files.length} file(s)`);
    } catch (error) {
      console.error('Error uploading files:', error);
      alert('Error uploading files');
    }
  };

  const handleDeleteFile = async (fileId: string) => {
    if (!confirm('Are you sure you want to delete this file?')) return;

    try {
      await (prisma as any).knowledgeBaseFile.delete({ where: { id: fileId } });
      await loadData();
      setSelectedFiles(selectedFiles.filter(f => f.id !== fileId));
    } catch (error) {
      console.error('Error deleting file:', error);
      alert('Error deleting file');
    }
  };

  const handleDownloadFile = (file: KnowledgeBaseFile) => {
    try {
      // Check if it's a PDF with base64 data
      const pdfMatch = file.fileContent.match(/\[PDF_BASE64_START\]([\s\S]+?)\[PDF_BASE64_END\]/);
      
      if (pdfMatch && pdfMatch[1]) {
        // Recreate PDF from base64
        const binaryString = atob(pdfMatch[1]);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        const blob = new Blob([bytes], { type: file.fileType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = file.fileName;
        a.click();
        URL.revokeObjectURL(url);
      } else {
        // Text file
        const blob = new Blob([file.fileContent], { type: file.fileType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = file.fileName;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Error downloading file:', error);
      alert('Error downloading file');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="bg-gradient-to-br from-purple-500 to-blue-500 p-3 rounded-lg shadow-lg">
                <BookOpen size={24} className="text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gradient bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent">
                  Architecture Knowledge Base
                </h1>
                <p className="text-purple-200/80 mt-1">
                  Shared library of patterns, reference architectures, and reusable components • Available to all users
                </p>
              </div>
            </div>
            <button
              onClick={handleCreate}
              className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-lg shadow-lg hover:shadow-purple-500/50 transition-all flex items-center space-x-2"
            >
              <Plus size={18} />
              <span>Add New</span>
            </button>
          </div>

          {/* Tabs */}
          <div className="flex space-x-2 mb-4">
            {[
              { id: 'patterns' as TabType, label: 'Patterns', icon: Layers },
              { id: 'architectures' as TabType, label: 'Reference Architectures', icon: BookOpen },
              { id: 'components' as TabType, label: 'Reusable Components', icon: Database },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  setSelectedCategory('all');
                  setSearchQuery('');
                }}
                className={`px-4 py-2 rounded-lg transition-all flex items-center space-x-2 ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-purple-600/30 to-blue-600/30 text-white border border-purple-400/50'
                    : 'glass text-purple-200/80 hover:bg-white/5 hover:text-purple-200 border border-transparent'
                }`}
              >
                <tab.icon size={18} />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Search and Filters */}
          <div className="glass-dark rounded-lg p-4 border border-white/10 mb-4">
            <div className="flex flex-col md:flex-row gap-4">
              {/* Search */}
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-purple-300" size={18} />
                <input
                  type="text"
                  placeholder={`Search ${activeTab}...`}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 glass border border-white/20 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500/50 text-white placeholder-purple-300/50 outline-none"
                />
              </div>

              {/* Category Filter */}
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-purple-300" size={18} />
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="pl-10 pr-4 py-2 glass border border-white/20 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500/50 text-white outline-none appearance-none bg-transparent"
                >
                  {categories.map(cat => (
                    <option key={cat.value} value={cat.value} className="bg-slate-800">
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Tags */}
            {tags.length > 0 && (
              <div className="mt-4">
                <div className="flex items-center space-x-2 mb-2">
                  <Tag size={16} className="text-purple-300" />
                  <span className="text-sm text-purple-200/80">Filter by tags:</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {tags.map(tag => (
                    <button
                      key={tag.id}
                      onClick={() => toggleTag(tag.name)}
                      className={`px-3 py-1 rounded-full text-xs transition-all ${
                        selectedTags.includes(tag.name)
                          ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white border border-purple-400/50'
                          : 'glass text-purple-200/80 hover:bg-white/5 border border-white/20'
                      }`}
                      style={tag.color ? { borderColor: tag.color } : {}}
                    >
                      {tag.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Results */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredItems.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <p className="text-purple-200/60 text-lg">No items found. Try adjusting your filters.</p>
            </div>
          ) : (
            filteredItems.map((item) => (
              <div
                key={item.id}
                className="glass-dark rounded-lg p-4 border border-white/10 hover:border-purple-500/50 transition-all cursor-pointer"
                onClick={() => handleEdit(item)}
              >
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-lg font-semibold text-white">{item.name}</h3>
                  <div className="flex space-x-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleViewFiles(item, activeTab === 'patterns' ? 'pattern' : activeTab === 'architectures' ? 'architecture' : 'component');
                      }}
                      className="text-blue-300 hover:text-blue-200"
                      title="View Files"
                    >
                      <Paperclip size={16} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEdit(item);
                      }}
                      className="text-purple-300 hover:text-purple-200"
                    >
                      Edit
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(item.id, activeTab === 'patterns' ? 'pattern' : activeTab === 'architectures' ? 'architecture' : 'component');
                      }}
                      className="text-red-300 hover:text-red-200"
                    >
                      Delete
                    </button>
                  </div>
                </div>
                <p className="text-purple-200/70 text-sm mb-3 line-clamp-2">{item.description}</p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-purple-300/60">
                    {activeTab === 'patterns' && (item as ArchitecturePattern).category}
                    {activeTab === 'architectures' && (item as ReferenceArchitecture).domain}
                    {activeTab === 'components' && (item as ReusableComponent).componentType}
                  </span>
                  {item.tags && item.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {item.tags.slice(0, 3).map((tag: string, idx: number) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 text-xs glass rounded-full text-purple-200/80 border border-purple-500/30"
                        >
                          {tag}
                        </span>
                      ))}
                      {item.tags.length > 3 && (
                        <span className="px-2 py-0.5 text-xs text-purple-300/60">
                          +{item.tags.length - 3}
                        </span>
                      )}
                    </div>
                  )}
                </div>
                {/* File count indicator */}
                {(() => {
                  const key = `${activeTab === 'patterns' ? 'PATTERN' : activeTab === 'architectures' ? 'REFERENCE_ARCHITECTURE' : 'REUSABLE_COMPONENT'}-${item.id}`;
                  const files = itemFiles[key] || [];
                  if (files.length > 0) {
                    return (
                      <div className="mt-2 flex items-center space-x-1 text-xs text-purple-300/60">
                        <Paperclip size={12} />
                        <span>{files.length} file{files.length > 1 ? 's' : ''}</span>
                      </div>
                    );
                  }
                  return null;
                })()}
              </div>
            ))
          )}
        </div>
      </div>

      {/* File Management Modal */}
      {showFileModal && (
        <FileManagementModal
          files={selectedFiles}
          entityId={selectedEntityId}
          entityType={selectedEntityType}
          onClose={() => {
            setShowFileModal(false);
            setSelectedFiles([]);
            setSelectedEntityId(null);
            setSelectedEntityType(null);
          }}
          onUpload={handleUploadFiles}
          onDelete={handleDeleteFile}
          onDownload={handleDownloadFile}
        />
      )}

      {/* Create/Edit Modal */}
      {showCreateModal && (
        <CreateEditModal
          item={selectedItem}
          type={activeTab === 'patterns' ? 'pattern' : activeTab === 'architectures' ? 'architecture' : 'component'}
          tags={tags}
          onClose={() => {
            setShowCreateModal(false);
            setSelectedItem(null);
          }}
          onSave={async (data) => {
            try {
              if (activeTab === 'patterns') {
                if (selectedItem) {
                  await (prisma as any).architecturePattern.update({
                    where: { id: selectedItem.id },
                    data: {
                      name: data.name,
                      category: data.category,
                      description: data.description,
                      problem: data.problem,
                      solution: data.solution,
                      benefits: data.benefits ? JSON.stringify(data.benefits) : null,
                      tradeoffs: data.tradeoffs ? JSON.stringify(data.tradeoffs) : null,
                      useCases: data.useCases ? JSON.stringify(data.useCases) : null,
                      examples: data.examples ? JSON.stringify(data.examples) : null,
                      diagram: data.diagram,
                      relatedPatterns: data.relatedPatterns ? JSON.stringify(data.relatedPatterns) : null,
                    }
                  });
                } else {
                  await (prisma as any).architecturePattern.create({
                    data: {
                      name: data.name,
                      category: data.category,
                      description: data.description,
                      problem: data.problem,
                      solution: data.solution,
                      benefits: data.benefits ? JSON.stringify(data.benefits) : null,
                      tradeoffs: data.tradeoffs ? JSON.stringify(data.tradeoffs) : null,
                      useCases: data.useCases ? JSON.stringify(data.useCases) : null,
                      examples: data.examples ? JSON.stringify(data.examples) : null,
                      diagram: data.diagram,
                      relatedPatterns: data.relatedPatterns ? JSON.stringify(data.relatedPatterns) : null,
                      createdBy: user?.email,
                    }
                  });
                }
              } else if (activeTab === 'architectures') {
                if (selectedItem) {
                  await (prisma as any).referenceArchitecture.update({
                    where: { id: selectedItem.id },
                    data: {
                      name: data.name,
                      domain: data.domain,
                      description: data.description,
                      overview: data.overview,
                      components: JSON.stringify(data.components || []),
                      layers: data.layers ? JSON.stringify(data.layers) : null,
                      patterns: data.patterns ? JSON.stringify(data.patterns) : null,
                      technologies: data.technologies ? JSON.stringify(data.technologies) : null,
                      bestPractices: data.bestPractices ? JSON.stringify(data.bestPractices) : null,
                      diagrams: data.diagrams ? JSON.stringify(data.diagrams) : null,
                      useCases: data.useCases ? JSON.stringify(data.useCases) : null,
                      caseStudies: data.caseStudies ? JSON.stringify(data.caseStudies) : null,
                    }
                  });
                } else {
                  await (prisma as any).referenceArchitecture.create({
                    data: {
                      name: data.name,
                      domain: data.domain,
                      description: data.description,
                      overview: data.overview,
                      components: JSON.stringify(data.components || []),
                      layers: data.layers ? JSON.stringify(data.layers) : null,
                      patterns: data.patterns ? JSON.stringify(data.patterns) : null,
                      technologies: data.technologies ? JSON.stringify(data.technologies) : null,
                      bestPractices: data.bestPractices ? JSON.stringify(data.bestPractices) : null,
                      diagrams: data.diagrams ? JSON.stringify(data.diagrams) : null,
                      useCases: data.useCases ? JSON.stringify(data.useCases) : null,
                      caseStudies: data.caseStudies ? JSON.stringify(data.caseStudies) : null,
                      createdBy: user?.email,
                    }
                  });
                }
              } else {
                if (selectedItem) {
                  await (prisma as any).reusableComponent.update({
                    where: { id: selectedItem.id },
                    data: {
                      name: data.name,
                      componentType: data.componentType,
                      description: data.description,
                      category: data.category,
                      vendor: data.vendor,
                      version: data.version,
                      specifications: data.specifications ? JSON.stringify(data.specifications) : null,
                      capabilities: data.capabilities ? JSON.stringify(data.capabilities) : null,
                      integrations: data.integrations ? JSON.stringify(data.integrations) : null,
                      dependencies: data.dependencies ? JSON.stringify(data.dependencies) : null,
                      documentation: data.documentation,
                      examples: data.examples ? JSON.stringify(data.examples) : null,
                    }
                  });
                } else {
                  await (prisma as any).reusableComponent.create({
                    data: {
                      name: data.name,
                      componentType: data.componentType,
                      description: data.description,
                      category: data.category,
                      vendor: data.vendor,
                      version: data.version,
                      specifications: data.specifications ? JSON.stringify(data.specifications) : null,
                      capabilities: data.capabilities ? JSON.stringify(data.capabilities) : null,
                      integrations: data.integrations ? JSON.stringify(data.integrations) : null,
                      dependencies: data.dependencies ? JSON.stringify(data.dependencies) : null,
                      documentation: data.documentation,
                      examples: data.examples ? JSON.stringify(data.examples) : null,
                      createdBy: user?.email,
                    }
                  });
                }
              }

              // Handle tags
              if (data.tags && data.tags.length > 0) {
                // This would need to be implemented to create/update tag mappings
                // For now, we'll skip tag management in the modal
              }

              await loadData();
              setShowCreateModal(false);
              setSelectedItem(null);
            } catch (error) {
              console.error('Error saving item:', error);
              alert('Error saving item');
            }
          }}
        />
      )}
    </div>
  );
};

// Create/Edit Modal Component
interface CreateEditModalProps {
  item: ArchitecturePattern | ReferenceArchitecture | ReusableComponent | null;
  type: EntityType;
  tags: Tag[];
  onClose: () => void;
  onSave: (data: any) => Promise<void>;
}

const CreateEditModal: React.FC<CreateEditModalProps> = ({ item, type, onClose, onSave }) => {
  const [formData, setFormData] = useState<any>({});

  useEffect(() => {
    if (item) {
      setFormData(item);
    } else {
      // Initialize empty form based on type
      if (type === 'pattern') {
        setFormData({
          name: '',
          category: 'MICROSERVICES',
          description: '',
          problem: '',
          solution: '',
          benefits: [],
          tradeoffs: [],
          useCases: [],
          examples: [],
        });
      } else if (type === 'architecture') {
        setFormData({
          name: '',
          domain: 'CLOUD_NATIVE',
          description: '',
          overview: '',
          components: [],
          layers: [],
          patterns: [],
          technologies: [],
          bestPractices: [],
          diagrams: [],
          useCases: [],
          caseStudies: [],
        });
      } else {
        setFormData({
          name: '',
          componentType: 'APPLICATION',
          description: '',
          category: '',
          vendor: '',
          version: '',
          specifications: {},
          capabilities: [],
          integrations: [],
          dependencies: [],
          documentation: '',
          examples: [],
        });
      }
    }
  }, [item, type]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
      <div className="glass-dark rounded-2xl border border-white/10 shadow-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gradient">
            {item ? 'Edit' : 'Create'} {type === 'pattern' ? 'Pattern' : type === 'architecture' ? 'Reference Architecture' : 'Reusable Component'}
          </h2>
          <button
            onClick={onClose}
            className="glass hover:bg-white/10 p-2 rounded-lg transition-all border border-white/20"
          >
            <X size={18} className="text-purple-200" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Common fields */}
          <div>
            <label className="block text-sm font-semibold text-purple-200 mb-2">Name *</label>
            <input
              type="text"
              value={formData.name || ''}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2 glass border border-white/20 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500/50 text-white placeholder-purple-300/50 outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-purple-200 mb-2">Description *</label>
            <textarea
              value={formData.description || ''}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-2 glass border border-white/20 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500/50 text-white placeholder-purple-300/50 resize-none outline-none"
              rows={3}
              required
            />
          </div>

          {/* Type-specific fields */}
          {type === 'pattern' && (
            <>
              <div>
                <label className="block text-sm font-semibold text-purple-200 mb-2">Category *</label>
                <select
                  value={formData.category || 'MICROSERVICES'}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-4 py-2 glass border border-white/20 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500/50 text-white outline-none bg-transparent"
                >
                  <option value="MICROSERVICES" className="bg-slate-800">Microservices</option>
                  <option value="EVENT_DRIVEN" className="bg-slate-800">Event-Driven</option>
                  <option value="API_GATEWAY" className="bg-slate-800">API Gateway</option>
                  <option value="ETL" className="bg-slate-800">ETL</option>
                  <option value="CQRS" className="bg-slate-800">CQRS</option>
                  <option value="SAGA" className="bg-slate-800">Saga</option>
                  <option value="CIRCUIT_BREAKER" className="bg-slate-800">Circuit Breaker</option>
                  <option value="SERVICE_MESH" className="bg-slate-800">Service Mesh</option>
                  <option value="STRANGLER_FIG" className="bg-slate-800">Strangler Fig</option>
                  <option value="BACKEND_FOR_FRONTEND" className="bg-slate-800">Backend for Frontend</option>
                  <option value="OTHER" className="bg-slate-800">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-purple-200 mb-2">Problem</label>
                <textarea
                  value={formData.problem || ''}
                  onChange={(e) => setFormData({ ...formData, problem: e.target.value })}
                  className="w-full px-4 py-2 glass border border-white/20 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500/50 text-white placeholder-purple-300/50 resize-none outline-none"
                  rows={2}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-purple-200 mb-2">Solution *</label>
                <textarea
                  value={formData.solution || ''}
                  onChange={(e) => setFormData({ ...formData, solution: e.target.value })}
                  className="w-full px-4 py-2 glass border border-white/20 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500/50 text-white placeholder-purple-300/50 resize-none outline-none"
                  rows={4}
                  required
                />
              </div>
            </>
          )}

          {type === 'architecture' && (
            <>
              <div>
                <label className="block text-sm font-semibold text-purple-200 mb-2">Domain *</label>
                <select
                  value={formData.domain || 'CLOUD_NATIVE'}
                  onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
                  className="w-full px-4 py-2 glass border border-white/20 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500/50 text-white outline-none bg-transparent"
                >
                  <option value="CLOUD_NATIVE" className="bg-slate-800">Cloud-Native</option>
                  <option value="BANKING" className="bg-slate-800">Banking</option>
                  <option value="ERP_INTEGRATION" className="bg-slate-800">ERP Integration</option>
                  <option value="E_COMMERCE" className="bg-slate-800">E-Commerce</option>
                  <option value="FINANCIAL_SERVICES" className="bg-slate-800">Financial Services</option>
                  <option value="HEALTHCARE" className="bg-slate-800">Healthcare</option>
                  <option value="RETAIL" className="bg-slate-800">Retail</option>
                  <option value="MANUFACTURING" className="bg-slate-800">Manufacturing</option>
                  <option value="TELECOMMUNICATIONS" className="bg-slate-800">Telecommunications</option>
                  <option value="GOVERNMENT" className="bg-slate-800">Government</option>
                  <option value="EDUCATION" className="bg-slate-800">Education</option>
                  <option value="OTHER" className="bg-slate-800">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-purple-200 mb-2">Overview *</label>
                <textarea
                  value={formData.overview || ''}
                  onChange={(e) => setFormData({ ...formData, overview: e.target.value })}
                  className="w-full px-4 py-2 glass border border-white/20 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500/50 text-white placeholder-purple-300/50 resize-none outline-none"
                  rows={4}
                  required
                />
              </div>
            </>
          )}

          {type === 'component' && (
            <>
              <div>
                <label className="block text-sm font-semibold text-purple-200 mb-2">Component Type *</label>
                <select
                  value={formData.componentType || 'APPLICATION'}
                  onChange={(e) => setFormData({ ...formData, componentType: e.target.value })}
                  className="w-full px-4 py-2 glass border border-white/20 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500/50 text-white outline-none bg-transparent"
                >
                  <option value="APPLICATION" className="bg-slate-800">Application</option>
                  <option value="API" className="bg-slate-800">API</option>
                  <option value="DATABASE" className="bg-slate-800">Database</option>
                  <option value="VENDOR" className="bg-slate-800">Vendor</option>
                  <option value="SERVICE" className="bg-slate-800">Service</option>
                  <option value="LIBRARY" className="bg-slate-800">Library</option>
                  <option value="FRAMEWORK" className="bg-slate-800">Framework</option>
                  <option value="MIDDLEWARE" className="bg-slate-800">Middleware</option>
                  <option value="INFRASTRUCTURE" className="bg-slate-800">Infrastructure</option>
                  <option value="OTHER" className="bg-slate-800">Other</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-purple-200 mb-2">Category</label>
                  <input
                    type="text"
                    value={formData.category || ''}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-4 py-2 glass border border-white/20 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500/50 text-white placeholder-purple-300/50 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-purple-200 mb-2">Vendor</label>
                  <input
                    type="text"
                    value={formData.vendor || ''}
                    onChange={(e) => setFormData({ ...formData, vendor: e.target.value })}
                    className="w-full px-4 py-2 glass border border-white/20 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500/50 text-white placeholder-purple-300/50 outline-none"
                  />
                </div>
              </div>
            </>
          )}

          <div className="flex gap-3 justify-end pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 glass border border-white/20 rounded-lg hover:bg-white/10 text-purple-200 transition-all font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-lg transition-all shadow-lg hover:shadow-purple-500/50 font-medium"
            >
              {item ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// File Management Modal Component
interface FileManagementModalProps {
  files: KnowledgeBaseFile[];
  entityId: string | null;
  entityType: EntityType | null;
  onClose: () => void;
  onUpload: (files: File[]) => Promise<void>;
  onDelete: (fileId: string) => Promise<void>;
  onDownload: (file: KnowledgeBaseFile) => void;
}

const FileManagementModal: React.FC<FileManagementModalProps> = ({ files, onClose, onUpload, onDelete, onDownload }) => {
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const fileArray = Array.from(e.dataTransfer.files);
      onUpload(fileArray);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const fileArray = Array.from(e.target.files);
      onUpload(fileArray);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
      <div className="glass-dark rounded-2xl border border-white/10 shadow-2xl p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gradient">File Management</h2>
          <button
            onClick={onClose}
            className="glass hover:bg-white/10 p-2 rounded-lg transition-all border border-white/20"
          >
            <X size={18} className="text-purple-200" />
          </button>
        </div>

        {/* Upload Area */}
        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-all mb-6 ${
            dragActive
              ? 'border-purple-500 bg-purple-500/10'
              : 'border-purple-500/30 hover:border-purple-500/50'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <Upload size={48} className="mx-auto text-purple-300 mb-4" />
          <p className="text-purple-200 mb-2">Drag and drop files here, or click to browse</p>
          <p className="text-sm text-purple-300/60 mb-4">Supports PDF, Word, images, and text files</p>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            onChange={handleFileInput}
            className="hidden"
            id="file-upload"
          />
          <label
            htmlFor="file-upload"
            className="inline-block px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-lg cursor-pointer transition-all"
          >
            <Upload size={16} className="inline mr-2" />
            Select Files
          </label>
        </div>

        {/* Files List */}
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-purple-200 mb-3">Attached Files ({files.length})</h3>
          {files.length === 0 ? (
            <p className="text-purple-300/60 text-center py-8">No files attached yet</p>
          ) : (
            files.map((file) => (
              <div
                key={file.id}
                className="glass-dark rounded-lg p-4 border border-white/10 flex items-center justify-between hover:border-purple-500/50 transition-all"
              >
                <div className="flex items-center space-x-3 flex-1 min-w-0">
                  <FileText size={20} className="text-purple-300 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-medium truncate">{file.fileName}</p>
                    <p className="text-xs text-purple-300/60">
                      {formatFileSize(file.fileSize)} • {new Date(file.uploadedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => onDownload(file)}
                    className="p-2 glass hover:bg-white/10 rounded-lg transition-all border border-white/20"
                    title="Download"
                  >
                    <Download size={16} className="text-purple-300" />
                  </button>
                  <button
                    onClick={() => onDelete(file.id)}
                    className="p-2 glass hover:bg-red-500/20 rounded-lg transition-all border border-white/20"
                    title="Delete"
                  >
                    <X size={16} className="text-red-300" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default ArchitectureKnowledgeBase;

