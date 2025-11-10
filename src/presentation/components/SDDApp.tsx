import { AlignLeft, ChevronDown, ChevronRight, Download, Edit as EditIcon, Eye, FileText, Loader, LogOut, Package, Plus, Save, Settings, Sparkles, User, X } from 'lucide-react';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ApproverEntity, CoverPageTemplateEntity, GeneratedSectionEntity, ProjectArtifactEntity, ProjectEntity } from '../../domain/entities/Project';
import { Section, UploadedFile } from '../../domain/entities/Section';
import { SECTIONS } from '../../domain/services/sections';
import { generateTableOfContents, getProjectSections, getSectionTitleWithNumbering, renumberSubsections } from '../../domain/services/sectionUtils';
import { ClaudeApiAdapter } from '../../infrastructure/adapters/api/ClaudeApiAdapter';
import { PdfExportAdapter } from '../../infrastructure/adapters/file-storage/PDFExportAdapter';
import { WordExportAdapter } from '../../infrastructure/adapters/file-storage/WordExportAdapter';
import { isMigrationComplete, migrateIndexedDBToSQLite } from '../../infrastructure/database/migrate';
import { initDatabase } from '../../infrastructure/database/sqlite';
// Import recovery utility to make it available
import '../../infrastructure/database/recovery';
import { PrismaProjectRepository } from '../../infrastructure/repositories/PrismaProjectRepository';
import { useAuth } from '../contexts/AuthContext';
import ADRManager from './ADRManager';
import AIDrivenCapabilities from './AIDrivenCapabilities';
import AnalysisReporting from './AnalysisReporting';
import ApprovalView from './ApprovalView';
import ApproverManager from './ApproverManager';
import ArchitectureKnowledgeBase from './ArchitectureKnowledgeBase';
import ArchitectureModelingStudio from './ArchitectureModelingStudio';
import ArtifactPreview from './ArtifactPreview';
import CoverPageTemplateDesigner from './CoverPageTemplateDesigner';
import CoverPageTemplateSelector from './CoverPageTemplateSelector';
import DatabaseManager from './DatabaseManager';
import DrawIOFileManager from './DrawIOFileManager';
import EditableCoverPage from './EditableCoverPage';
import EnterpriseArchitecture from './EnterpriseArchitecture';
import ProjectManager from './ProjectManager';
import RepositoryGovernance from './RepositoryGovernance';
import SectionManager from './SectionManager';
import Sidebar from './Sidebar';
import TemplateManager from './TemplateManager';
import TinyMCEEditor from './TinyMCEEditor';
import UMLManager from './UMLManager';

const SDDApp: React.FC = () => {
  const { user, logout } = useAuth();
  const [selectedProject, setSelectedProject] = useState<ProjectEntity | null>(null);
  const [artifacts, setArtifacts] = useState<ProjectArtifactEntity[]>([]);
  const [expandedSections, setExpandedSections] = useState<{ [key: string]: boolean }>({});
  const [generatedContent, setGeneratedContent] = useState<{ [key: string]: string }>({});
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [loadingSection, setLoadingSection] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [currentView, setCurrentView] = useState<'sdd' | 'artifacts' | 'drawio' | 'uml' | 'adr' | 'approvers' | 'database' | 'templates' | 'cover-templates' | 'architecture' | 'modeling-studio' | 'repository-governance' | 'ai-capabilities' | 'analysis' | 'knowledge-base'>('sdd');
  const [selectedApproverEmail, setSelectedApproverEmail] = useState<string | null>(null);
  const [generatedSections, setGeneratedSections] = useState<GeneratedSectionEntity[]>([]);
  const [subSections, setSubSections] = useState<{ [parentId: string]: GeneratedSectionEntity[] }>({});
  const [sddMode, setSddMode] = useState<'edit' | 'preview'>('edit');
  const [selectedArtifact, setSelectedArtifact] = useState<ProjectArtifactEntity | null>(null);
  const [expandedArtifactTypes, setExpandedArtifactTypes] = useState<{ [key: string]: boolean }>({});
  const [showSectionManager, setShowSectionManager] = useState(false);
  const [showAddSubSection, setShowAddSubSection] = useState<{ [sectionId: string]: boolean }>({});
  const [newSubSectionTitle, setNewSubSectionTitle] = useState('');
  const [coverTemplates, setCoverTemplates] = useState<CoverPageTemplateEntity[]>([]);
  const [coverTemplatesLoading, setCoverTemplatesLoading] = useState<boolean>(false);
  
  // Initialize adapters - use useMemo to ensure stable references
  const exportAdapter = useMemo(() => new WordExportAdapter(), []);
  const pdfExportAdapter = useMemo(() => new PdfExportAdapter(), []);
  const [repo, setRepo] = useState<PrismaProjectRepository | null>(null);

  // Initialize SQLite database (default storage) and repository
  useEffect(() => {
    let isMounted = true;
    
    (async () => {
      try {
        // Initialize SQLite database (default storage)
        console.log('📦 Initializing SQLite database (default storage)...');
        await initDatabase();
        
        // One-time migration from IndexedDB to SQLite (if needed)
        if (!isMigrationComplete()) {
          console.log('🔄 Running one-time migration from IndexedDB to SQLite...');
          await migrateIndexedDBToSQLite();
        }
        
        if (isMounted) {
          // Create SQLite repository instance
          setRepo(new PrismaProjectRepository());
          console.log('✅ SQLite database initialized and ready');
        }
      } catch (error) {
        console.error('❌ Error initializing SQLite database:', error);
        if (isMounted) {
          // Still create repo even if migration fails - SQLite will be used
          setRepo(new PrismaProjectRepository());
        }
      }
    })();

    return () => {
      isMounted = false;
    };
  }, []);

  // Create SQLite repository instance (default storage)
  const repoInstance = useMemo(() => repo || new PrismaProjectRepository(), [repo]);

  // Store project ID in ref to avoid dependency issues
  const projectIdRef = useRef<string | null>(null);
  
  useEffect(() => {
    projectIdRef.current = selectedProject?.id || null;
  }, [selectedProject?.id]);

  const loadArtifacts = useCallback(async () => {
    const currentProjectId = projectIdRef.current;
    if (!currentProjectId) {
      setArtifacts([]);
      return;
    }
    // Only load artifacts for the selected project
    const projectArtifacts = await repoInstance.getArtifactsByProject(currentProjectId);
    // Double-check: filter by project ID to ensure only selected project artifacts
    const filteredArtifacts = projectArtifacts.filter(a => a.projectId === currentProjectId);
    setArtifacts(filteredArtifacts);
  }, [repoInstance]);

  const loadGeneratedSections = useCallback(async () => {
    const currentProjectId = projectIdRef.current;
    if (!currentProjectId) return;
    const sections = await repoInstance.getGeneratedSectionsByProject(currentProjectId);
    setGeneratedSections(sections);
    const contentMap: { [key: string]: string } = {};
    const subSectionsMap: { [parentId: string]: GeneratedSectionEntity[] } = {};
    
    // Load sub-sections for each section
    for (const section of sections) {
      contentMap[section.sectionId] = section.content;
      const subSectionsList = await repoInstance.getSubSections(section.id);
      if (subSectionsList.length > 0) {
        subSectionsMap[section.id] = subSectionsList;
        // Also add sub-section content to content map
        subSectionsList.forEach(sub => {
          contentMap[`${section.sectionId}-${sub.id}`] = sub.content;
        });
      }
    }
    
    setSubSections(subSectionsMap);
    setGeneratedContent(contentMap);
  }, [repoInstance]);

  const handleCoverPageSave = useCallback(async (
    coverPageSettings: ProjectEntity['coverPageSettings'],
    coverPageContent?: string,
    templateId?: string | null
  ) => {
    if (!selectedProject) return;
    
    try {
      const nextTemplateId = templateId === undefined
        ? selectedProject.coverPageTemplateId
        : templateId || undefined;

      const updatedProject = await repoInstance.updateProject(selectedProject.id, {
        coverPageSettings,
        coverPageTemplateId: nextTemplateId
      });

      if (coverPageContent !== undefined) {
        await repoInstance.saveGeneratedSection(
          selectedProject.id,
          'cover-page',
          '1. Cover Page',
          coverPageContent
        );
        await loadGeneratedSections();
      }

      setSelectedProject(updatedProject);
    } catch (error) {
      console.error('Error saving cover page:', error);
      throw error;
    }
  }, [selectedProject, repoInstance, loadGeneratedSections]);

  const loadCoverTemplates = useCallback(async () => {
    setCoverTemplatesLoading(true);
    try {
      const templates = await repoInstance.getCoverPageTemplates();
      setCoverTemplates(templates);
    } catch (error) {
      console.error('Error loading cover page templates:', error);
    } finally {
      setCoverTemplatesLoading(false);
    }
  }, [repoInstance]);

  const handleTemplatesChanged = useCallback(() => {
    loadCoverTemplates();
  }, [loadCoverTemplates]);

  const handleApplyCoverTemplate = useCallback(async (template: CoverPageTemplateEntity) => {
    const settings = template.coverPageSettings ? { ...template.coverPageSettings } : undefined;
    await handleCoverPageSave(settings, template.content, template.id);
    alert(`Cover page template "${template.name}" applied to this project.`);
  }, [handleCoverPageSave]);

  const handleArtifactsChange = useCallback(async (newArtifacts: ProjectArtifactEntity[]) => {
    const currentProjectId = projectIdRef.current;
    if (!currentProjectId) return;
    // Filter to only include artifacts for the selected project
    const filtered = newArtifacts.filter(a => a.projectId === currentProjectId);
    setArtifacts(filtered);
    // Clear selected artifact when artifacts change
    setSelectedArtifact(null);
  }, []);

  const handleProjectSelect = useCallback((project: ProjectEntity | null) => {
    setSelectedProject(project);
  }, []);

  const handleViewChange = useCallback((view: 'sdd' | 'artifacts' | 'drawio' | 'uml' | 'adr' | 'approvers' | 'database' | 'templates' | 'cover-templates' | 'architecture' | 'modeling-studio' | 'repository-governance' | 'analysis' | 'ai-capabilities' | 'knowledge-base') => {
    setCurrentView(view);
  }, []);

  const handleArtifactSelect = useCallback((artifact: ProjectArtifactEntity) => {
    setSelectedArtifact(artifact);
  }, []);

  const handleProjectCreated = useCallback(async () => {
    // Reload artifacts when project is created
    const currentProjectId = projectIdRef.current;
    if (currentProjectId) {
      const projectArtifacts = await repoInstance.getArtifactsByProject(currentProjectId);
      setArtifacts(projectArtifacts.filter(a => a.projectId === currentProjectId));
    }
  }, [repoInstance]);

  useEffect(() => {
    const currentProjectId = projectIdRef.current;
    if (currentProjectId) {
      loadGeneratedSections();
      loadArtifacts();
    } else {
      setGeneratedContent({});
      setArtifacts([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedProject?.id]); // Only depend on project ID

  useEffect(() => {
    loadCoverTemplates();
  }, [loadCoverTemplates]);

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const convertArtifactsToUploadedFiles = (artifacts: ProjectArtifactEntity[]): UploadedFile[] => {
    console.log(`🔄 Converting ${artifacts.length} artifact(s) to uploaded files...`);
    
    return artifacts.map(a => {
      // Check if this is a PDF with base64 data stored
      // Try both greedy and non-greedy patterns
      const pdfBase64Match = a.fileContent.match(/\[PDF_BASE64_START\]([\s\S]+?)\[PDF_BASE64_END\]/);
      
      let file: File | undefined = undefined;
      let status: 'extracted' | 'pdf' | 'limited' | 'error' | 'ready' = 'extracted';
      let content = a.fileContent;
      
      if (pdfBase64Match && pdfBase64Match[1]) {
        // Recreate File object from base64
        try {
          console.log(`📄 Reconstructing PDF file from base64: ${a.fileName}`);
          const base64 = pdfBase64Match[1].trim();
          console.log(`Base64 length: ${base64.length} characters`);
          
          if (base64.length === 0) {
            throw new Error('Base64 data is empty');
          }
          
          const binaryString = atob(base64);
          const bytes = new Uint8Array(binaryString.length);
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }
          const blob = new Blob([bytes], { type: a.fileType || 'application/pdf' });
          file = new File([blob], a.fileName, { type: a.fileType || 'application/pdf' });
          status = 'pdf';
          console.log(`✅ Successfully reconstructed PDF: ${a.fileName} (${file.size} bytes, original: ${a.fileSize} bytes)`);
          // Remove base64 from content, keep only the note
          content = a.fileContent.replace(/\[PDF_BASE64_START\][\s\S]+?\[PDF_BASE64_END\]/, '').trim();
        } catch (error) {
          console.error('❌ Could not recreate PDF file from base64:', error);
          console.error('Error details:', error instanceof Error ? error.message : String(error));
          status = a.fileContent.includes('[PDF') ? 'pdf' : 'error';
        }
      } else if (a.fileContent.includes('[PDF') || a.fileType === 'application/pdf') {
        console.warn(`⚠️ PDF file ${a.fileName} found but no base64 data stored.`);
        console.warn(`⚠️ This PDF was uploaded before the base64 storage feature was added.`);
        console.warn(`⚠️ Please delete this artifact and re-upload the PDF file to enable Claude analysis.`);
        console.warn(`⚠️ File content preview: ${a.fileContent.substring(0, 200)}...`);
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
  };

  const generateSectionContent = async (sectionId: string, sectionTitle: string, subsections: Section['subsections']) => {
    if (!selectedProject) {
      alert('Please select a project first');
      return;
    }
    
    setLoadingSection(sectionId);
    
    try {
      const contentGenerator = new ClaudeApiAdapter();
      const uploadedFiles = convertArtifactsToUploadedFiles(artifacts);
      const content = await contentGenerator.generateSection(
        sectionId,
        sectionTitle,
        subsections,
        { name: selectedProject.name, description: selectedProject.description },
        uploadedFiles
      );

      // Validate content before saving
      if (!content || content.trim().length === 0) {
        throw new Error('Generated content is empty. Please try again.');
      }

      // Save to database
      await repoInstance.saveGeneratedSection(selectedProject.id, sectionId, sectionTitle, content);
      
      setGeneratedContent(prev => ({ ...prev, [sectionId]: content }));
      setExpandedSections(prev => ({ ...prev, [sectionId]: true }));
    } catch (error) {
      console.error('Error generating content:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      // Show user-friendly error message
      alert(`Error: ${errorMessage}\n\nPlease check:\n- Your Claude API key is configured in .env file\n- Restart the dev server after updating .env\n- You have an active internet connection\n\nSee API_SETUP.md for detailed instructions.`);
      
      setGeneratedContent(prev => ({
        ...prev,
        [sectionId]: `<div style="padding: 20px; background: #fee; border: 1px solid #fcc; border-radius: 8px;">
          <h3 style="color: #c00; margin-top: 0;">Error Generating Content</h3>
          <p><strong>Error:</strong> ${errorMessage}</p>
          <p><strong>Please check:</strong></p>
          <ul>
            <li>Your Claude API key is configured in <code>.env</code> file as <code>VITE_ANTHROPIC_API_KEY</code></li>
            <li>You restarted the dev server after updating .env</li>
            <li>You have an active internet connection</li>
            <li>Check browser console (F12) for detailed error messages</li>
          </ul>
          <p>See <code>API_SETUP.md</code> in the project root for detailed setup instructions.</p>
        </div>`
      }));
    } finally {
      setLoadingSection(null);
    }
  };

  // Get sections to display based on project configuration
  const getDisplaySections = useMemo(() => {
    if (!selectedProject) return { standardSections: [], customSections: [], allSections: [] };
    
    const selectedIds = selectedProject.selectedSectionIds || SECTIONS.map(s => s.id);
    const customSections = selectedProject.customSections || [];
    const customSectionSubsections = selectedProject.customSectionSubsections || {};
    
    return getProjectSections(selectedIds, customSections, customSectionSubsections);
  }, [selectedProject]);

  const generateAllSections = async () => {
    if (!selectedProject) {
      alert('Please select a project first');
      return;
    }
    
    for (const section of getDisplaySections.standardSections) {
      if (!generatedContent[section.id]) {
        // Use renumbered subsections for generation
        const renumberedSubsections = renumberSubsections(section);
        await generateSectionContent(section.id, getSectionTitleWithNumbering(section), renumberedSubsections);
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
    
    // Generate custom sections
    for (const customSection of getDisplaySections.customSections) {
      if (!generatedContent[customSection.id]) {
        const renumberedSubsections = renumberSubsections(customSection);
        await generateSectionContent(customSection.id, getSectionTitleWithNumbering(customSection), renumberedSubsections);
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
  };

  const generateSDDAsMarkdown = async () => {
    if (!selectedProject) {
      alert('Please select a project first');
      return;
    }

    if (loadingSection !== null) {
      alert('Please wait for the current generation to complete');
      return;
    }

    setLoadingSection('sdd-markdown');
    
    try {
      const apiAdapter = new ClaudeApiAdapter();
      
      // Collect all generated sections content
      const sectionsContent: Array<{ title: string; content: string }> = [];
      
      for (const section of getDisplaySections.allSections) {
        const content = generatedContent[section.id];
        if (content) {
          sectionsContent.push({
            title: getSectionTitleWithNumbering(section),
            content: content
          });
        }
      }

      // Prepare artifact context
      const uploadedFiles = convertArtifactsToUploadedFiles(artifacts);
      let artifactContext = '';
      if (uploadedFiles.length > 0) {
        artifactContext = '\n\n=== PROJECT ARTIFACTS ===\n';
        uploadedFiles.forEach(file => {
          const truncatedContent = file.content.length > 5000 ? file.content.substring(0, 5000) + '... [truncated]' : file.content;
          artifactContext += `\nFile: ${file.name}\nContent:\n${truncatedContent}\n---\n`;
        });
        artifactContext += '\n=== END OF ARTIFACTS ===\n';
      }

      // Build SDD content from existing sections
      let existingSDDContent = '';
      if (sectionsContent.length > 0) {
        existingSDDContent = '\n\n=== EXISTING SDD SECTIONS ===\n';
        sectionsContent.forEach(section => {
          // Convert HTML to plain text for markdown conversion
          const tempDiv = document.createElement('div');
          tempDiv.innerHTML = section.content;
          const textContent = tempDiv.textContent || tempDiv.innerText || '';
          existingSDDContent += `\n## ${section.title}\n\n${textContent.substring(0, 3000)}\n---\n`;
        });
        existingSDDContent += '\n=== END OF EXISTING SECTIONS ===\n';
      }

      const sddPrompt = `Generate a complete Solution Design Document (SDD) in Markdown format for the project "${selectedProject.name}".

Project Description: ${selectedProject.description || 'No description provided'}
${artifactContext}
${existingSDDContent}

The SDD should be comprehensive and include all standard sections:
1. Cover Page / Title Page
2. Document Control (Version History, Distribution List, Review & Approval)
3. Table of Contents
4. Introduction (Problem Statement, Solution Overview, Scope)
5. Business Requirements
6. Solution Architecture
7. Technical Design
8. Integration Architecture
9. Data Architecture
10. Security Architecture
11. Non-Functional Requirements
12. Implementation Plan
13. Risk Assessment
14. Appendices

Format Requirements:
- Use proper Markdown syntax
- Include headings (##, ###, ####)
- Use lists, tables, and code blocks where appropriate
- Be detailed and professional
- Reference specific details from the artifacts and existing sections provided
- Use actual system names, requirements, and technical details
- If existing sections are provided, incorporate and expand on that content
- Ensure the document is complete and ready for use

Output the complete SDD as a single Markdown document. Start with the document title and proceed through all sections systematically.`;

      // Generate SDD using chat API with artifacts
      const sddContent = await apiAdapter.chat(
        sddPrompt,
        [],
        {
          name: selectedProject.name,
          description: `${selectedProject.description || ''}${artifactContext}`
        }
      );

      // Save as markdown artifact
      const fileName = `${selectedProject.name.replace(/[^a-z0-9]/gi, '_')}_SDD_${new Date().toISOString().split('T')[0]}.md`;
      const fileSize = new Blob([sddContent]).size;

      await repoInstance.addArtifact({
        projectId: selectedProject.id,
        fileName: fileName,
        fileType: 'text/markdown',
        fileSize: fileSize,
        fileContent: sddContent,
        artifactType: 'TECHNICAL_SPEC'
      });

      // Reload artifacts
      await loadArtifacts();

      alert(`✅ SDD Generated Successfully!\n\nFile: ${fileName}\nSize: ${(fileSize / 1024).toFixed(2)} KB\n\nThe SDD has been saved to Technology Artifacts and can be used in AI queries.`);
    } catch (error) {
      console.error('Error generating SDD:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      alert(`Error generating SDD: ${errorMessage}\n\nPlease check:\n- Your Claude API key is configured\n- You have an active internet connection`);
    } finally {
      setLoadingSection(null);
    }
  };

  const handleProjectUpdate = useCallback(async (updatedProject: ProjectEntity) => {
    // Reload the full project from database to ensure we have all updated fields
    const reloadedProject = await repoInstance.getProjectById(updatedProject.id);
    if (reloadedProject) {
      setSelectedProject(reloadedProject);
      // Reload sections to reflect changes
      await loadGeneratedSections();
    }
  }, [repoInstance, loadGeneratedSections]);

  const startEditing = (sectionId: string) => {
    // Get HTML content directly - no markdown conversion needed
    const content = generatedContent[sectionId] || '';
    setEditContent(content);
    setEditingSection(sectionId);
  };

  const saveContent = async (sectionId: string) => {
    if (!selectedProject) return;
    
    // Check if this is a sub-section (format: sectionId-subId)
    const isSubSection = sectionId.includes('-') && !['cover-page', 'table-of-contents', 'document-control'].includes(sectionId);
    
    if (isSubSection) {
      // Handle sub-section save (already handled in handleSaveSubSection)
      // This shouldn't be called for sub-sections, but keep for safety
      return;
    }
    
    // Get HTML content directly from editContent
    let contentToSave = editContent;
    
    // Get the section entity to preserve order and title
    const sectionEntity = generatedSections.find(s => s.sectionId === sectionId);
    const sectionTitle = sectionEntity?.sectionTitle || 
                        SECTIONS.find(s => s.id === sectionId)?.title || 
                        sectionId;
    
    // Store as HTML
    await repoInstance.saveGeneratedSection(
      selectedProject.id, 
      sectionId, 
      sectionTitle, 
      contentToSave,
      undefined, // No parent for top-level sections
      sectionEntity?.order
    );
    
    setGeneratedContent(prev => ({ ...prev, [sectionId]: contentToSave }));
    setEditingSection(null);
    setEditContent('');
    // Reload sections to refresh data
    await loadGeneratedSections();
  };

  const cancelEditing = () => {
    setEditingSection(null);
    setEditContent('');
  };

  const handleAddSubSection = async (parentSectionId: string, parentSectionEntity: GeneratedSectionEntity) => {
    if (!selectedProject || !newSubSectionTitle.trim()) {
      alert('Please enter a sub-section title');
      return;
    }

    try {
      // Get the current sub-sections to determine order
      const existingSubSections = subSections[parentSectionId] || [];
      const order = existingSubSections.length;

      // Create new sub-section
      await repoInstance.saveGeneratedSection(
        selectedProject.id,
        `sub-${parentSectionEntity.sectionId}-${Date.now()}`,
        newSubSectionTitle.trim(),
        '<p>New sub-section content. Click Edit to add content.</p>',
        parentSectionId,
        order
      );

      // Reload sections to get updated data
      await loadGeneratedSections();
      
      // Reset form
      setNewSubSectionTitle('');
      setShowAddSubSection(prev => ({ ...prev, [parentSectionId]: false }));
    } catch (error) {
      console.error('Error adding sub-section:', error);
      alert('Error adding sub-section. Please try again.');
    }
  };

  const handleDeleteSubSection = async (subSectionId: string) => {
    if (!confirm('Are you sure you want to delete this sub-section?')) {
      return;
    }

    try {
      await repoInstance.deleteGeneratedSection(subSectionId);
      await loadGeneratedSections();
    } catch (error) {
      console.error('Error deleting sub-section:', error);
      alert('Error deleting sub-section. Please try again.');
    }
  };

  const handleEditSubSection = (subSectionId: string, parentSectionId: string) => {
    const subSection = subSections[parentSectionId]?.find(s => s.id === subSectionId);
    if (subSection) {
      const contentKey = `${subSection.sectionId}-${subSectionId}`;
      const content = generatedContent[contentKey] || subSection.content;
      setEditContent(content);
      setEditingSection(contentKey);
    }
  };

  const handleSaveSubSection = async (subSectionId: string, parentSectionId: string) => {
    if (!selectedProject) return;

    const subSection = subSections[parentSectionId]?.find(s => s.id === subSectionId);
    if (!subSection) return;

    try {
      await repoInstance.saveGeneratedSection(
        selectedProject.id,
        subSection.sectionId,
        subSection.sectionTitle,
        editContent,
        parentSectionId,
        subSection.order
      );

      await loadGeneratedSections();
      setEditingSection(null);
      setEditContent('');
    } catch (error) {
      console.error('Error saving sub-section:', error);
      alert('Error saving sub-section. Please try again.');
    }
  };

  
  // Handle image uploads - convert to base64 data URLs
  const handleImageUpload = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        resolve(reader.result as string);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const downloadAsWord = async () => {
    if (!selectedProject) {
      alert('Please select a project first');
      return;
    }
    
    // Reload project to ensure we have the latest section configuration
    const freshProject = await repoInstance.getProjectById(selectedProject.id);
    if (!freshProject) {
      alert('Error: Could not load project data');
      return;
    }
    
      // Always export ALL standard sections, not just selected ones
      // This ensures the complete document is exported regardless of UI selection
      const allStandardSectionIds = SECTIONS.map(s => s.id);
      const customSections = freshProject.customSections || [];
      const customSectionSubsections = freshProject.customSectionSubsections || {};
      const projectSections = getProjectSections(allStandardSectionIds, customSections, customSectionSubsections);
    
    const sectionsToExport = projectSections.allSections.map(section => {
      const renumberedSubsections = renumberSubsections(section);
      return {
        ...section, // Include all properties including displayNumber
        title: getSectionTitleWithNumbering(section),
        subsections: renumberedSubsections,
      };
    });
    
    // Debug: Log what we're exporting
    const sectionNumbers = sectionsToExport.map(s => {
      const match = s.title.match(/^(\d+)\./);
      return match ? parseInt(match[1]) : null;
    });
    const sectionsFrom18 = sectionsToExport.filter(s => {
      const match = s.title.match(/^(\d+)\./);
      return match && parseInt(match[1]) >= 18;
    });
    
    console.log('📤 Exporting ALL sections:', {
      totalSections: sectionsToExport.length,
      sectionIds: sectionsToExport.map(s => s.id),
      sectionTitles: sectionsToExport.map(s => s.title),
      sectionNumbers: sectionNumbers,
      maxSectionNumber: Math.max(...sectionNumbers.filter(n => n !== null) as number[]),
      sectionsFrom18Count: sectionsFrom18.length,
      sectionsFrom18Titles: sectionsFrom18.map(s => s.title),
      standardSectionsCount: projectSections.standardSections.length,
      customSectionsCount: customSections.length,
      allStandardSectionsAvailable: SECTIONS.length,
      note: 'Exporting ALL sections regardless of UI selection'
    });
    
    try {
      await exportAdapter.exportToWord(
        {
          sections: sectionsToExport as Section[],
          generatedContent,
          projectContext: freshProject.name,
          coverPageSettings: freshProject.coverPageSettings
        },
        freshProject.name
      );
    } catch (error) {
      console.error('Error exporting to Word:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      alert(`Failed to export document: ${errorMessage}\n\nPlease check the browser console for more details.`);
    }
  };

  const downloadAsPdf = async () => {
    if (!selectedProject) {
      alert('Please select a project first');
      return;
    }
    
    try {
      // Reload project to ensure we have the latest section configuration
      const freshProject = await repoInstance.getProjectById(selectedProject.id);
      if (!freshProject) {
        alert('Error: Could not load project data');
        return;
      }
      
      // Always export ALL standard sections, not just selected ones
      // This ensures the complete document is exported regardless of UI selection
      const allStandardSectionIds = SECTIONS.map(s => s.id);
      const customSections = freshProject.customSections || [];
      const customSectionSubsections = freshProject.customSectionSubsections || {};
      const projectSections = getProjectSections(allStandardSectionIds, customSections, customSectionSubsections);
      
      const sectionsToExport = projectSections.allSections.map(section => {
        const renumberedSubsections = renumberSubsections(section);
        return {
          ...section, // Include all properties including displayNumber
          title: getSectionTitleWithNumbering(section),
          subsections: renumberedSubsections,
        };
      });
      
      console.log('📤 Exporting ALL sections to PDF:', {
        totalSections: sectionsToExport.length,
        sectionIds: sectionsToExport.map(s => s.id),
        sectionTitles: sectionsToExport.map(s => s.title),
      });
      
      await pdfExportAdapter.exportToPdf(
        {
          sections: sectionsToExport as Section[],
          generatedContent,
          projectContext: freshProject.name,
          coverPageSettings: freshProject.coverPageSettings
        },
        freshProject.name
      );
    } catch (error) {
      console.error('Error exporting to PDF:', error);
      alert(`Error exporting to PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // Render different views based on currentView
  const renderView = () => {
    // Handle views that don't require a project
    if (currentView === 'database' || currentView === 'templates' || currentView === 'cover-templates' || currentView === 'architecture' || currentView === 'modeling-studio' || currentView === 'repository-governance' || currentView === 'ai-capabilities' || currentView === 'analysis' || currentView === 'knowledge-base') {
      switch (currentView) {
        case 'database':
          return <DatabaseManager />;
        case 'templates':
          return <TemplateManager onCreateProjectFromTemplate={handleProjectCreated} />;
      case 'cover-templates':
        return (
          <CoverPageTemplateDesigner
            onBack={() => setCurrentView(selectedProject ? 'sdd' : 'templates')}
            onTemplatesChanged={handleTemplatesChanged}
          />
        );
        case 'architecture':
          return <EnterpriseArchitecture selectedProject={selectedProject} />;
        case 'modeling-studio':
          return <ArchitectureModelingStudio project={selectedProject} />;
        case 'repository-governance':
          return <RepositoryGovernance selectedProject={selectedProject} />;
        case 'analysis':
          return <AnalysisReporting project={selectedProject} />;
        case 'ai-capabilities':
          return <AIDrivenCapabilities selectedProject={selectedProject} />;
        case 'knowledge-base':
          return <ArchitectureKnowledgeBase selectedProject={selectedProject} />;
        default:
          return null;
      }
    }

    if (!selectedProject) {
      return (
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <FileText size={64} className="mx-auto text-gray-300 mb-4" />
            <h2 className="text-2xl font-semibold text-gray-600 mb-2">No Project Selected</h2>
            <p className="text-gray-500">Select a project from the sidebar to get started</p>
          </div>
        </div>
      );
    }

    switch (currentView) {
      case 'sdd':
        return renderSDDView();
      case 'artifacts':
        return renderArtifactsView();
      case 'drawio':
        return renderDrawIOView();
      case 'uml':
        return renderUMLView();
      case 'adr':
        return renderADRView();
      case 'approvers':
        return renderApproversView();
      default:
        return renderSDDView();
    }
  };

  const renderSDDPreview = () => {
    if (!selectedProject) {
      return (
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <FileText size={64} className="mx-auto text-gray-300 mb-4" />
            <h2 className="text-2xl font-semibold text-gray-600 mb-2">No Project Selected</h2>
            <p className="text-gray-500">Select a project from the sidebar to preview the SDD</p>
          </div>
        </div>
      );
    }

    // Get sections with content using selected sections
    const sectionsWithContent = getDisplaySections.allSections.filter(s => generatedContent[s.id]);

    return (
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 min-h-[600px]">
        {/* Cover Page */}
        <div className="mb-8">
            <EditableCoverPage
              projectName={selectedProject.name}
              projectDescription={selectedProject.description}
              coverPageSettings={selectedProject.coverPageSettings}
            coverPageContent={generatedContent['cover-page']}
              onSave={(settings, content) => handleCoverPageSave(settings, content, null)}
            isEditable={sddMode === 'edit'}
            onImageUpload={handleImageUpload}
          />
        </div>

        {/* Static sections removed - using dynamic sections from sections list instead */}

        {/* Document Content */}
        <div className="p-6 bg-white">
          <div className="max-w-4xl mx-auto">

            {/* Sections */}
            {getDisplaySections.allSections.map((section) => {
              // Skip cover page section in preview since it's already shown at the top
              if (section.id === 'cover-page') return null;
              
              // Auto-generate Table of Contents if it's the TOC section
              let content = generatedContent[section.id];
              if (section.id === 'table-of-contents') {
                // Always generate TOC, even if not saved
                content = generateTableOfContents(getDisplaySections.allSections, generatedContent);
                // Ensure TOC always has content (even if it's just a placeholder)
                if (!content || content.trim() === '') {
                  content = '<p><em>Table of Contents will be generated once sections are created.</em></p>';
                }
              }
              
              // Skip sections without content, except TOC which is always generated
              if (!content && section.id !== 'table-of-contents') return null;

              // Remove duplicate section titles from content
              const sectionTitle = getSectionTitleWithNumbering(section);
              const titleMatch = sectionTitle.match(/(\d+\.\s*)?(.+)/);
              const titleText = titleMatch ? titleMatch[2].trim() : sectionTitle.trim();
              
              // Remove any h1/h2/h3 tags that match the section title (regardless of number)
              const cleanedContent = content.replace(
                new RegExp(`<h[123][^>]*>\\s*(\\d+\\.\\s*)?${titleText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*</h[123]>`, 'gi'),
                ''
              ).trim();

              return (
                <div 
                  key={section.id} 
                  id={`section-${section.id}`}
                  className="mb-12 pb-10 border-b border-gray-200 last:border-b-0 scroll-mt-4"
                >
                  <h2 className="text-2xl font-bold text-purple-700 mb-4">
                    {sectionTitle}
                  </h2>
                  <div 
                    className="ck-content sdd-preview-content"
                    dangerouslySetInnerHTML={{ __html: cleanedContent }}
                    style={{ backgroundColor: 'white', color: '#1f2937' }}
                  />
                </div>
              );
            })}

            {/* Footer for sections without content */}
            {sectionsWithContent.length === 0 && (
              <div className="text-center py-12">
                <FileText size={48} className="mx-auto text-gray-300 mb-4" />
                <p className="text-gray-600 mb-2">No sections generated yet</p>
                <p className="text-sm text-gray-500">Generate sections in Edit mode to see the preview</p>
              </div>
            )}
          </div>
        </div>

        {/* Document Footer - Removed */}
      </div>
    );
  };

  const renderSDDView = () => {
    if (!selectedProject) {
      return (
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <FileText size={64} className="mx-auto text-gray-300 mb-4" />
            <h2 className="text-2xl font-semibold text-gray-600 mb-2">No Project Selected</h2>
            <p className="text-gray-500">Select a project from the sidebar to get started</p>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {/* Tabs for Edit/Preview */}
        <div className="glass rounded-xl border border-white/10 overflow-hidden">
          <div className="flex border-b border-white/10">
            <button
              onClick={() => setSddMode('edit')}
              className={`flex-1 flex items-center justify-center space-x-2 px-4 py-3 font-semibold transition-all ${
                sddMode === 'edit'
                  ? 'bg-gradient-to-r from-purple-600/30 to-blue-600/30 text-white border-b-2 border-purple-400'
                  : 'text-purple-200/70 hover:bg-white/5'
              }`}
            >
              <EditIcon size={18} />
              <span>Edit</span>
            </button>
            <button
              onClick={() => setSddMode('preview')}
              className={`flex-1 flex items-center justify-center space-x-2 px-4 py-3 font-semibold transition-all ${
                sddMode === 'preview'
                  ? 'bg-gradient-to-r from-purple-600/30 to-blue-600/30 text-white border-b-2 border-purple-400'
                  : 'text-purple-200/70 hover:bg-white/5'
              }`}
            >
              <Eye size={18} />
              <span>Preview</span>
            </button>
          </div>

          {/* Tab Content */}
          <div className="p-3">
            {sddMode === 'preview' ? (
              renderSDDPreview()
            ) : (
          <div className="space-y-3">
            <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-4">
              <CoverPageTemplateSelector
                templates={coverTemplates}
                selectedTemplateId={selectedProject.coverPageTemplateId}
                onApply={handleApplyCoverTemplate}
                onManageTemplates={() => setCurrentView('cover-templates')}
                isLoading={coverTemplatesLoading}
              />
            </div>
            {/* Cover Page - Editable */}
            <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-4">
              <EditableCoverPage
                projectName={selectedProject.name || 'Solution Design Document'}
                projectDescription={selectedProject.description || ''}
                coverPageSettings={selectedProject.coverPageSettings}
                coverPageContent={generatedContent['cover-page']}
                onSave={(settings, content) => handleCoverPageSave(settings, content, null)}
                isEditable={sddMode === 'edit'}
                onImageUpload={handleImageUpload}
              />
            </div>
            
            {/* Standard Sections */}
            {getDisplaySections.standardSections.map((section) => {
              const renumberedSubsections = renumberSubsections(section);
              
              // Skip cover page section - it's rendered separately above
              if (section.id === 'cover-page') {
                return null;
              }
              
              return (
              <div key={section.id} className="bg-white rounded-lg shadow-md overflow-hidden">
                <button
                  onClick={() => toggleSection(section.id)}
                  className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex-1 text-left">
                    <h2 className="text-lg font-semibold text-gray-800">{getSectionTitleWithNumbering(section)}</h2>
                    <p className="text-xs text-gray-500 mt-1">
                      {renumberedSubsections.map(sub => `${sub.number} ${sub.title}`).join(', ')}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    {generatedContent[section.id] && (
                      <span className="text-xs bg-green-100 text-green-700 px-3 py-1 rounded-full font-medium">
                        Generated
                      </span>
                    )}
                    {expandedSections[section.id] ? (
                      <ChevronDown className="text-purple-700" size={24} />
                      ) : (
                      <ChevronRight className="text-purple-700" size={24} />
                    )}
                  </div>
                </button>
                
                {expandedSections[section.id] && (
                  <div className="border-t border-gray-200 bg-gray-50">
                    {/* Special handling for Table of Contents - auto-generate */}
                    {section.id === 'table-of-contents' ? (
                      <div className="p-6">
                        <div className="bg-white p-6 rounded-lg border border-gray-200">
                          <div 
                            className="text-sm leading-relaxed ck-content"
                            dangerouslySetInnerHTML={{ 
                              __html: generatedContent[section.id] || generateTableOfContents(getDisplaySections.allSections, generatedContent)
                            }}
                            style={{
                              fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
                              fontSize: '14px',
                              lineHeight: '1.6'
                            }}
                          />
                        </div>
                        <div className="mt-4 flex space-x-2">
                          <button
                            onClick={() => {
                              const tocContent = generateTableOfContents(getDisplaySections.allSections, generatedContent);
                              setEditContent(tocContent);
                              setEditingSection(section.id);
                            }}
                            className="flex items-center space-x-2 text-white bg-blue-600 px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-semibold"
                          >
                            <AlignLeft size={16} />
                            <span>Edit Table of Contents</span>
                          </button>
                          <button
                            onClick={async () => {
                              const tocContent = generateTableOfContents(getDisplaySections.allSections, generatedContent);
                              await repoInstance.saveGeneratedSection(
                                selectedProject!.id,
                                'table-of-contents',
                                getSectionTitleWithNumbering(section),
                                tocContent
                              );
                              await loadGeneratedSections();
                            }}
                            className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors font-semibold"
                          >
                            <Save size={16} />
                            <span>Regenerate & Save</span>
                          </button>
                        </div>
                      </div>
                    ) : editingSection === section.id ? (
                      <div className="p-6">
                        <div className="mb-2 border border-gray-300 rounded-lg">
                          <TinyMCEEditor
                            value={editContent}
                            onChange={setEditContent}
                            height={400}
                            placeholder="Enter your content here. Use the source code button to edit HTML directly."
                            onImageUpload={handleImageUpload}
                          />
                        </div>
                        <div className="mt-4 flex space-x-2">
                          <button
                            onClick={() => saveContent(section.id)}
                            className="flex items-center space-x-2 bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors font-semibold"
                          >
                            <Save size={16} />
                            <span>Save Changes</span>
                          </button>
                          <button
                            onClick={cancelEditing}
                            className="flex items-center space-x-2 px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors font-semibold"
                          >
                            <X size={16} />
                            <span>Cancel</span>
                          </button>
                        </div>
                      </div>
                    ) : !generatedContent[section.id] ? (
                      <div className="p-8 text-center">
                        {section.id === 'table-of-contents' ? (
                          <div>
                            <p className="text-gray-600 mb-4">Table of Contents will be automatically generated based on all sections in the document.</p>
                            <button
                              onClick={async () => {
                                const tocContent = generateTableOfContents(getDisplaySections.allSections, generatedContent);
                                await repoInstance.saveGeneratedSection(
                                  selectedProject!.id,
                                  'table-of-contents',
                                  getSectionTitleWithNumbering(section),
                                  tocContent
                                );
                                await loadGeneratedSections();
                              }}
                              className="inline-flex items-center space-x-2 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors font-semibold"
                            >
                              <Sparkles size={20} />
                              <span>Generate Table of Contents</span>
                            </button>
                          </div>
                        ) : (
                          <>
                        <div className="mb-4">
                          <h3 className="text-md font-semibold text-gray-800 mb-2">Section Subsections:</h3>
                          <div className="space-y-2 text-left max-w-3xl mx-auto">
                            {renumberedSubsections.map(sub => (
                              <div key={sub.number} className="bg-white p-3 rounded-lg border border-gray-200">
                                <p className="text-sm font-semibold text-gray-800">{sub.number} {sub.title}</p>
                                <p className="text-xs text-gray-600 mt-1">{sub.description}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                        <button
                          onClick={() => generateSectionContent(section.id, getSectionTitleWithNumbering(section), renumberedSubsections)}
                          disabled={loadingSection === section.id}
                          className="inline-flex items-center space-x-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-3 rounded-lg hover:from-purple-700 hover:to-blue-700 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {loadingSection === section.id ? (
                            <>
                              <Loader className="animate-spin" size={20} />
                              <span>Generating Content...</span>
                            </>
                          ) : (
                            <>
                              <Sparkles size={20} />
                              <span>Generate Section with AI</span>
                            </>
                          )}
                        </button>
                          </>
                        )}
                        {artifacts.length > 0 ? (() => {
                          // Check if any PDFs don't have base64 data
                          const pdfsWithoutData = artifacts.filter(a => 
                            (a.fileType === 'application/pdf' || a.fileName.endsWith('.pdf')) &&
                            !a.fileContent.match(/\[PDF_BASE64_START\]/)
                          );
                          
                          if (pdfsWithoutData.length > 0) {
                            return (
                              <div className="mt-4 space-y-2">
                                <p className="text-xs text-green-600 font-medium">
                                  ✓ Will analyze {artifacts.length} uploaded business artifact{artifacts.length > 1 ? 's' : ''} to generate accurate, project-specific content
                                </p>
                                <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                                  <p className="text-xs text-purple-700 font-semibold mb-1">
                                    ⚠️ PDF Files Need Re-upload
                                  </p>
                                  <p className="text-xs text-purple-600">
                                    {pdfsWithoutData.length} PDF file{pdfsWithoutData.length > 1 ? 's' : ''} ({pdfsWithoutData.map(a => a.fileName).join(', ')}) {pdfsWithoutData.length > 1 ? 'were' : 'was'} uploaded before the file analysis feature was added. Please delete and re-upload {pdfsWithoutData.length > 1 ? 'them' : 'it'} so Claude can read the full content.
                                  </p>
                                </div>
                              </div>
                            );
                          }
                          
                          return (
                          <p className="text-xs text-green-600 mt-4 font-medium">
                            ✓ Will analyze {artifacts.length} uploaded artifact{artifacts.length > 1 ? 's' : ''} to generate accurate, project-specific content
                          </p>
                          );
                        })() : (
                          <p className="text-xs text-amber-600 mt-4 font-medium">
                            ⚠ No business artifacts uploaded. Content will be based on general best practices. Upload business artifacts for more accurate results.
                          </p>
                        )}
                      </div>
                    ) : (
                      <div className="p-6">
                        <div className="bg-white p-6 rounded-lg border border-gray-200 prose prose-sm max-w-none">
                          <div 
                            className="text-sm leading-relaxed ck-content"
                            dangerouslySetInnerHTML={{ __html: generatedContent[section.id] }}
                            style={{
                              fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
                              fontSize: '14px',
                              lineHeight: '1.6'
                            }}
                          />
                        </div>
                        <div className="mt-4 flex space-x-2">
                          <button
                            onClick={() => startEditing(section.id)}
                            className="flex items-center space-x-2 text-white bg-blue-600 px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-semibold"
                          >
                            <AlignLeft size={16} />
                            <span>Edit Content</span>
                          </button>
                          <button
                            onClick={() => generateSectionContent(section.id, getSectionTitleWithNumbering(section), renumberedSubsections)}
                            disabled={loadingSection === section.id}
                            className="flex items-center space-x-2 text-purple-700 px-4 py-2 border border-purple-700 rounded-lg hover:bg-purple-50 transition-colors font-semibold disabled:opacity-50"
                          >
                            <Sparkles size={16} />
                            <span>Regenerate</span>
                          </button>
                        </div>
                        
                        {/* Sub-sections */}
                        {(() => {
                          const sectionEntity = generatedSections.find(s => s.sectionId === section.id);
                          if (!sectionEntity) return null;
                          
                          const sectionSubSections = subSections[sectionEntity.id] || [];
                          
                          return (
                            <div className="mt-6 border-t border-gray-200 pt-4">
                              <div className="flex items-center justify-between mb-3">
                                <h3 className="text-md font-semibold text-gray-800">Sub-sections</h3>
                                <button
                                  onClick={() => {
                                    setShowAddSubSection(prev => ({ ...prev, [sectionEntity.id]: !prev[sectionEntity.id] }));
                                  }}
                                  className="flex items-center space-x-1 text-sm text-purple-700 hover:text-purple-800 font-medium"
                                >
                                  <Plus size={16} />
                                  <span>Add Sub-section</span>
                                </button>
                              </div>
                              
                              {/* Add sub-section form */}
                              {showAddSubSection[sectionEntity.id] && (
                                <div className="mb-4 p-3 bg-purple-50 rounded-lg border border-purple-200">
                                  <input
                                    type="text"
                                    value={newSubSectionTitle}
                                    onChange={(e) => setNewSubSectionTitle(e.target.value)}
                                    placeholder="Enter sub-section title"
                                    className="w-full px-3 py-2 border border-purple-300 rounded-lg mb-2 focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                                    onKeyPress={(e) => {
                                      if (e.key === 'Enter') {
                                        handleAddSubSection(sectionEntity.id, sectionEntity);
                                      }
                                    }}
                                  />
                                  <div className="flex space-x-2">
                                    <button
                                      onClick={() => handleAddSubSection(sectionEntity.id, sectionEntity)}
                                      className="px-4 py-2 bg-purple-700 text-white rounded-lg hover:bg-purple-800 transition-colors font-semibold"
                                    >
                                      Add
                                    </button>
                                    <button
                                      onClick={() => {
                                        setShowAddSubSection(prev => ({ ...prev, [sectionEntity.id]: false }));
                                        setNewSubSectionTitle('');
                                      }}
                                      className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors font-semibold"
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                </div>
                              )}
                              
                              {/* Sub-sections list */}
                              {sectionSubSections.length > 0 ? (
                                <div className="space-y-3">
                                  {sectionSubSections.map((subSection) => {
                                    const contentKey = `${subSection.sectionId}-${subSection.id}`;
                                    const isEditing = editingSection === contentKey;
                                    const subContent = generatedContent[contentKey] || subSection.content;
                                    
                                    return (
                                      <div key={subSection.id} className="bg-gray-50 rounded-lg border border-gray-200 p-4">
                                        <div className="flex items-center justify-between mb-2">
                                          <h4 className="font-semibold text-gray-800">{subSection.sectionTitle}</h4>
                                          <div className="flex space-x-2">
                                            <button
                                              onClick={() => handleEditSubSection(subSection.id, sectionEntity.id)}
                                              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                                            >
                                              Edit
                                            </button>
                                            <button
                                              onClick={() => handleDeleteSubSection(subSection.id)}
                                              className="text-red-600 hover:text-red-800 text-sm font-medium"
                                            >
                                              Delete
                                            </button>
                                          </div>
                                        </div>
                                        
                                        {isEditing ? (
                                          <div>
                                            <TinyMCEEditor
                                              value={editContent}
                                              onChange={setEditContent}
                                              height={300}
                                              placeholder="Enter sub-section content"
                                             onImageUpload={handleImageUpload}
                                            />
                                            <div className="mt-2 flex space-x-2">
                                              <button
                                                onClick={() => handleSaveSubSection(subSection.id, sectionEntity.id)}
                                                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold"
                                              >
                                                Save
                                              </button>
                                              <button
                                                onClick={cancelEditing}
                                                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors font-semibold"
                                              >
                                                Cancel
                                              </button>
                                            </div>
                                          </div>
                                        ) : (
                                          <div 
                                            className="text-sm text-gray-700 prose prose-sm max-w-none"
                                            dangerouslySetInnerHTML={{ __html: subContent }}
                                          />
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              ) : (
                                <p className="text-sm text-gray-500 italic">No sub-sections added yet.</p>
                              )}
                            </div>
                          );
                        })()}
                      </div>
                    )}
                  </div>
                )}
              </div>
              );
            })}
            
            {/* Custom Sections */}
            {getDisplaySections.customSections.map((customSection) => {
              const renumberedSubsections = renumberSubsections(customSection);
              return (
              <div key={customSection.id} className="bg-blue-50 rounded-lg shadow-md overflow-hidden border border-blue-200">
                <button
                  onClick={() => toggleSection(customSection.id)}
                  className="w-full flex items-center justify-between p-4 hover:bg-blue-100 transition-colors"
                >
                  <div className="flex-1 text-left">
                    <h2 className="text-lg font-semibold text-gray-800">{getSectionTitleWithNumbering(customSection)}</h2>
                    <p className="text-xs text-gray-600 mt-1">
                      {renumberedSubsections.map(sub => sub.title).join(', ')}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    {generatedContent[customSection.id] && (
                      <span className="text-xs bg-green-100 text-green-700 px-3 py-1 rounded-full font-medium">
                        Generated
                      </span>
                    )}
                    {expandedSections[customSection.id] ? (
                      <ChevronDown className="text-blue-700" size={24} />
                    ) : (
                      <ChevronRight className="text-blue-700" size={24} />
                    )}
                  </div>
                </button>
                
                {expandedSections[customSection.id] && (
                  <div className="border-t border-blue-200 bg-white">
                    {editingSection === customSection.id ? (
                      <div className="p-6">
                        <div className="mb-2 border border-gray-300 rounded-lg">
                          <TinyMCEEditor
                            value={editContent}
                            onChange={setEditContent}
                            height={400}
                            placeholder="Enter your content here. Use the source code button to edit HTML directly."
                          />
                        </div>
                        <div className="mt-4 flex space-x-2">
                          <button
                            onClick={() => saveContent(customSection.id)}
                            className="flex items-center space-x-2 bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors font-semibold"
                          >
                            <Save size={16} />
                            <span>Save Changes</span>
                          </button>
                          <button
                            onClick={cancelEditing}
                            className="flex items-center space-x-2 px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors font-semibold"
                          >
                            <X size={16} />
                            <span>Cancel</span>
                          </button>
                        </div>
                      </div>
                    ) : !generatedContent[customSection.id] ? (
                      <div className="p-8 text-center">
                        <div className="mb-4">
                          <h3 className="text-md font-semibold text-gray-800 mb-2">Section Subsections:</h3>
                          <div className="space-y-2 text-left max-w-3xl mx-auto">
                            {renumberedSubsections.map(sub => (
                              <div key={sub.number} className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                                <p className="text-sm font-semibold text-gray-800">{sub.number} {sub.title}</p>
                                <p className="text-xs text-gray-600 mt-1">{sub.description}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                        <button
                          onClick={() => generateSectionContent(customSection.id, getSectionTitleWithNumbering(customSection), renumberedSubsections)}
                          disabled={loadingSection === customSection.id}
                          className="inline-flex items-center space-x-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-3 rounded-lg hover:from-purple-700 hover:to-blue-700 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {loadingSection === customSection.id ? (
                            <>
                              <Loader className="animate-spin" size={20} />
                              <span>Generating Content...</span>
                            </>
                          ) : (
                            <>
                              <Sparkles size={20} />
                              <span>Generate Section with AI</span>
                            </>
                          )}
                        </button>
                        {artifacts.length > 0 ? (
                          <p className="text-xs text-green-600 mt-4 font-medium">
                            ✓ Will analyze {artifacts.length} uploaded artifact{artifacts.length > 1 ? 's' : ''} to generate accurate, project-specific content
                          </p>
                        ) : (
                          <p className="text-xs text-amber-600 mt-4 font-medium">
                            ⚠ No business artifacts uploaded. Content will be based on general best practices. Upload business artifacts for more accurate results.
                          </p>
                        )}
                      </div>
                    ) : (
                      <div className="p-6">
                        <div className="bg-white p-6 rounded-lg border border-gray-200 prose prose-sm max-w-none">
                          <div 
                            className="text-sm leading-relaxed ck-content"
                            dangerouslySetInnerHTML={{ __html: generatedContent[customSection.id] }}
                            style={{
                              fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
                              fontSize: '14px',
                              lineHeight: '1.6'
                            }}
                          />
                        </div>
                        <div className="mt-4 flex space-x-2">
                          <button
                            onClick={() => startEditing(customSection.id)}
                            className="flex items-center space-x-2 text-white bg-blue-600 px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-semibold"
                          >
                            <AlignLeft size={16} />
                            <span>Edit Content</span>
                          </button>
                          <button
                            onClick={() => generateSectionContent(customSection.id, getSectionTitleWithNumbering(customSection), renumberedSubsections)}
                            disabled={loadingSection === customSection.id}
                            className="flex items-center space-x-2 text-purple-700 px-4 py-2 border border-purple-700 rounded-lg hover:bg-purple-50 transition-colors font-semibold disabled:opacity-50"
                          >
                            <Sparkles size={16} />
                            <span>Regenerate</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
              );
            })}
              </div>
            )}
          </div>
        </div>
    </div>
  );
  };

  const renderArtifactsView = () => {
    // Filter artifacts to only show those for the selected project
    const filteredArtifacts = selectedProject 
      ? artifacts.filter(a => a.projectId === selectedProject.id)
      : [];

    // Group artifacts by type
    const artifactsByType: { [key: string]: ProjectArtifactEntity[] } = {};
    filteredArtifacts.forEach(artifact => {
      const type = artifact.artifactType;
      if (!artifactsByType[type]) {
        artifactsByType[type] = [];
      }
      artifactsByType[type].push(artifact);
    });

    const getArtifactTypeLabel = (type: string): string => {
      const labels: Record<string, string> = {
        BRD: 'Business Requirements Documents',
        FLOW: 'Process Flows',
        SEQUENCE: 'Sequence Diagrams',
        ARCHITECTURE: 'Architecture Diagrams',
        TECHNICAL_SPEC: 'Technical Specifications',
        OTHER: 'Other Documents'
      };
      return labels[type] || type;
    };

    const formatFileSize = (bytes: number): string => {
      if (bytes < 1024) return bytes + ' B';
      if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
      return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
    };

    const toggleType = (type: string) => {
      setExpandedArtifactTypes(prev => ({ ...prev, [type]: !prev[type] }));
    };

    if (!selectedProject) {
      return (
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <Package size={48} className="mx-auto text-gray-300 mb-4" />
          <p className="text-gray-600">Please select a project to view business artifacts</p>
        </div>
      );
    }

    return (
      <div className="flex h-[calc(100vh-120px)] gap-4">
        {/* Inner Sidebar - Artifact List */}
        <div className="w-80 bg-white rounded-lg shadow-md flex flex-col">
          {/* Upload Section */}
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-lg font-bold text-gray-800 mb-3 flex items-center space-x-2">
              <Package size={20} />
              <span>Business Artifacts</span>
            </h2>
            <ProjectManager
              selectedProject={selectedProject}
              onProjectSelect={setSelectedProject}
              onArtifactsChange={handleArtifactsChange}
              hideProjectList={true}
            />
          </div>

          {/* Artifacts List */}
          <div className="flex-1 overflow-y-auto">
            {filteredArtifacts.length > 0 ? (
              <div className="p-2">
                {Object.entries(artifactsByType).map(([type, typeArtifacts]) => (
                  <div key={type} className="mb-2">
                    <button
                      onClick={() => toggleType(type)}
                      className="w-full flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg transition-colors"
                    >
                      <div className="flex items-center space-x-2 flex-1 min-w-0">
                        <ChevronRight
                          size={16}
                          className={`transition-transform text-gray-500 flex-shrink-0 ${
                            expandedArtifactTypes[type] ? 'rotate-90' : ''
                          }`}
                        />
                        <span className="text-sm font-medium text-gray-700 truncate">
                          {getArtifactTypeLabel(type)}
                        </span>
                        <span className="text-xs text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded-full flex-shrink-0">
                          {typeArtifacts.length}
                        </span>
                      </div>
                    </button>

                    {expandedArtifactTypes[type] && (
                      <div className="ml-4 mt-1 space-y-1">
                        {typeArtifacts.map((artifact) => (
                          <button
                            key={artifact.id}
                            onClick={() => setSelectedArtifact(artifact)}
                            className={`w-full flex items-center space-x-2 p-2 rounded-lg text-sm transition-colors text-left ${
                              selectedArtifact?.id === artifact.id
                                ? 'bg-purple-100 text-purple-700 font-medium'
                                : 'hover:bg-gray-50 text-gray-600'
                            }`}
                            title={artifact.fileName}
                          >
                            <FileText size={14} className="flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="truncate">{artifact.fileName}</p>
                              <p className="text-xs text-gray-500 truncate">
                                {formatFileSize(artifact.fileSize)}
                              </p>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center">
                <Package size={32} className="mx-auto text-gray-300 mb-2" />
                <p className="text-sm text-gray-500">No business artifacts yet</p>
              </div>
            )}
          </div>
        </div>

        {/* Preview Panel */}
        <div className="flex-1 bg-white rounded-lg shadow-md overflow-hidden flex flex-col">
          {selectedArtifact ? (
            <ArtifactPreview
              artifact={selectedArtifact}
              onClose={() => setSelectedArtifact(null)}
              isSidePanel={true}
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <FileText size={48} className="mx-auto text-gray-300 mb-4" />
                <p className="text-gray-600">Select a business artifact to preview</p>
                <p className="text-sm text-gray-500 mt-2">
                  Choose a business artifact from the list on the left
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderDrawIOView = () => {
    return <DrawIOFileManager project={selectedProject} />;
  };

  const renderUMLView = () => (
    <UMLManager project={selectedProject} />
  );

  const renderADRView = () => (
    <ADRManager project={selectedProject} artifacts={artifacts} />
  );

  const renderApproversView = () => {
    if (!selectedProject) return null;

    // If an approver email is selected, show approval view
    if (selectedApproverEmail) {
      // Find the approver by email
      return (
        <div className="space-y-4">
          <button
            onClick={() => setSelectedApproverEmail(null)}
            className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors mb-4"
          >
            ← Back to Approvers
          </button>
          <ApproverApprovalView
            project={selectedProject}
            approverEmail={selectedApproverEmail}
            repository={repoInstance}
            generatedSections={generatedSections}
            onBack={() => setSelectedApproverEmail(null)}
          />
        </div>
      );
    }

    // Otherwise show approver management
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <ApproverManager
          project={selectedProject}
          repository={repoInstance}
          onApproversChange={loadApprovers}
        />
      </div>
    );
  };

  // Helper component for approver's approval view
  const ApproverApprovalView: React.FC<{
    project: ProjectEntity;
    approverEmail: string;
    repository: typeof repoInstance;
    generatedSections: GeneratedSectionEntity[];
    onBack: () => void;
  }> = ({ project, approverEmail, repository, generatedSections, onBack }) => {
    const [approver, setApprover] = useState<ApproverEntity | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
      const loadApprover = async () => {
        try {
          const found = await repository.getApproverByEmail(project.id, approverEmail);
          setApprover(found);
        } catch (error) {
          console.error('Error loading approver:', error);
        } finally {
          setLoading(false);
        }
      };
      loadApprover();
    }, [project.id, approverEmail]);

    if (loading) {
      return <div className="text-center py-8">Loading...</div>;
    }

    if (!approver) {
      return (
        <div className="text-center py-8">
          <p className="text-purple-600">Approver not found</p>
          <button onClick={onBack} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg">
            Back
          </button>
        </div>
      );
    }

    return (
      <ApprovalView
        project={project}
        approver={approver}
        repository={repository}
        generatedSections={generatedSections}
        onApprovalChange={() => {}}
      />
    );
  };

  const loadApprovers = async () => {
    // This will be called when approvers change
    // For now, just reload if needed
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex relative">
      {/* Animated background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      {/* Grid overlay */}
      <div className="fixed inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none"></div>

      {/* Sidebar */}
      <div className="relative z-10">
        <Sidebar
          selectedProject={selectedProject}
          onProjectSelect={handleProjectSelect}
          onViewChange={handleViewChange}
          currentView={currentView}
          artifacts={artifacts}
          onArtifactSelect={handleArtifactSelect}
          onProjectCreated={handleProjectCreated}
        />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 lg:ml-72 relative z-10 flex flex-col h-screen">
        {/* Header - Futuristic Design - Sticky */}
        <div className="glass-dark shadow-2xl border-b border-white/10 sticky top-0 z-30 backdrop-blur-xl flex-shrink-0" style={{ position: 'sticky' }}>
            <div className="bg-gradient-to-r from-purple-600/20 via-blue-600/20 to-purple-600/20 border-b border-purple-500/30">
              <div className="px-4 py-3 lg:px-6 lg:py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="bg-gradient-to-br from-purple-500 to-blue-500 p-2 rounded-lg shadow-lg">
                      <Sparkles size={24} className="text-white" />
                    </div>
                    <div>
                      <h1 className="text-lg lg:text-2xl font-bold text-gradient">Architect Studio</h1>
                      <p className="text-purple-200/80 text-xs lg:text-sm">AI-Powered Solution Design Platform</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    {selectedProject && (
                      <>
                        <div className="hidden lg:block text-sm text-purple-200 glass px-3 py-1.5 rounded-lg border border-purple-500/30">
                          <span className="font-medium">{selectedProject.name}</span>
                        </div>
                        {currentView === 'sdd' && (
                          <>
                            <button
                              onClick={() => setShowSectionManager(true)}
                              className="flex items-center space-x-2 glass hover:bg-white/10 text-purple-200 px-3 py-1.5 rounded-lg transition-all font-semibold text-sm border border-purple-500/30 hover:border-purple-400/50"
                            >
                              <Settings size={16} />
                              <span className="hidden sm:inline">Sections</span>
                            </button>
                            <button
                              onClick={generateAllSections}
                              disabled={loadingSection !== null}
                              className="flex items-center space-x-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-3 py-1.5 rounded-lg transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed text-sm shadow-lg hover:shadow-purple-500/50"
                            >
                              <Sparkles size={16} />
                              <span className="hidden sm:inline">Generate All</span>
                            </button>
                            <button
                              onClick={generateSDDAsMarkdown}
                              disabled={loadingSection !== null}
                              className="flex items-center space-x-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-3 py-1.5 rounded-lg transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed text-sm shadow-lg hover:shadow-green-500/50"
                              title="Generate complete SDD as markdown and save to Technology Artifacts"
                            >
                              <FileText size={16} />
                              <span className="hidden sm:inline">Save as Markdown</span>
                            </button>
                            <button
                              onClick={downloadAsWord}
                              className="flex items-center space-x-2 glass hover:bg-white/10 text-purple-200 px-3 py-1.5 rounded-lg transition-all font-semibold text-sm border border-purple-500/30 hover:border-purple-400/50"
                            >
                              <Download size={16} />
                              <span className="hidden sm:inline">Word</span>
                            </button>
                            <button
                              onClick={downloadAsPdf}
                              className="flex items-center space-x-2 glass hover:bg-white/10 text-purple-200 px-3 py-1.5 rounded-lg transition-all font-semibold text-sm border border-purple-500/30 hover:border-purple-400/50"
                            >
                              <FileText size={16} />
                              <span className="hidden sm:inline">PDF</span>
                            </button>
                          </>
                        )}
                      </>
                    )}
                    {/* User Menu */}
                    <div className="flex items-center space-x-2 ml-2 pl-3 border-l border-white/20">
                      <div className="hidden sm:flex items-center space-x-2 glass px-3 py-1.5 rounded-lg border border-purple-500/30">
                        <User size={16} className="text-purple-300" />
                        <span className="text-sm text-purple-200">{user?.name || user?.email}</span>
                      </div>
                      <button
                        onClick={logout}
                        className="flex items-center space-x-2 glass hover:bg-purple-500/20 text-purple-300 hover:text-purple-200 px-3 py-1.5 rounded-lg transition-all text-sm border border-purple-500/30 hover:border-purple-400/50"
                        title="Logout"
                      >
                        <LogOut size={16} />
                        <span className="hidden sm:inline">Logout</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

        {/* Content Area - Futuristic Styling - Scrollable */}
        <div className="flex-1 overflow-y-auto">
          {currentView === 'modeling-studio' ? (
            <div className="h-full">
              {renderView()}
            </div>
          ) : (
            <div className="p-3 lg:p-4">
              <div className="w-full">
                <div className="glass-dark rounded-xl border border-white/10 shadow-2xl p-4 lg:p-6">
                  {renderView()}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Section Manager Modal */}
      {showSectionManager && selectedProject && (
        <SectionManager
          project={selectedProject}
          onProjectUpdate={handleProjectUpdate}
          onClose={() => setShowSectionManager(false)}
        />
      )}
    </div>
  );
};

export default SDDApp;

