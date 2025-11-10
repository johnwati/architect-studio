import { saveAs } from 'file-saver';
import JSZip from 'jszip';
import { Download, FileText, FolderOpen, Plus, Trash2, Upload as UploadIcon } from 'lucide-react';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ArtifactType, ProjectArtifactEntity, ProjectEntity } from '../../domain/entities/Project';
import { BrowserStorageAdapter } from '../../infrastructure/adapters/file-storage/BrowserStorageAdapter';
import { PrismaProjectRepository } from '../../infrastructure/repositories/PrismaProjectRepository';

interface ProjectManagerProps {
  selectedProject: ProjectEntity | null;
  onProjectSelect: (project: ProjectEntity | null) => void;
  onArtifactsChange: (artifacts: ProjectArtifactEntity[]) => void;
  hideProjectList?: boolean; // Hide project list when used in artifacts view
}

const ProjectManager: React.FC<ProjectManagerProps> = ({ selectedProject, onProjectSelect, onArtifactsChange, hideProjectList = false }) => {
  const [projects, setProjects] = useState<ProjectEntity[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDesc, setNewProjectDesc] = useState('');
  const [artifacts, setArtifacts] = useState<ProjectArtifactEntity[]>([]);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showPasteModal, setShowPasteModal] = useState(false);
  const [pastedContent, setPastedContent] = useState('');
  const [pasteFileName, setPasteFileName] = useState('');
  const [uploadType, setUploadType] = useState<ArtifactType>('BRD');
  
  // Create repository and storage adapter instances (stable references)
  const repo = useMemo(() => new PrismaProjectRepository(), []);
  const storageAdapter = useMemo(() => new BrowserStorageAdapter(), []);

  const loadProjects = async () => {
    const allProjects = await repo.getAllProjects();
    setProjects(allProjects);
  };

  const loadArtifacts = useCallback(async (projectId: string) => {
    const projectArtifacts = await repo.getArtifactsByProject(projectId);
    // Filter to only include artifacts for this specific project
    const filteredArtifacts = projectArtifacts.filter(a => a.projectId === projectId);
    setArtifacts(filteredArtifacts);
    onArtifactsChange(filteredArtifacts);
  }, [onArtifactsChange]);

  // Process files (shared by both file upload and paste)
  const processFiles = useCallback(async (files: File[]) => {
    if (!selectedProject) return;
    
    for (const file of files) {
      const uploadedFile = await storageAdapter.uploadFile(file);
      
      // For PDF files, store the file data as base64 so we can recreate it later for Claude upload
      let fileContent = uploadedFile.content;
      if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
        try {
          // Store PDF as base64 for later reconstruction
          const arrayBuffer = await file.arrayBuffer();
          const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
          fileContent = `[PDF_BASE64_START]${base64}[PDF_BASE64_END]${uploadedFile.content}`;
        } catch (error) {
          console.warn('Could not convert PDF to base64, storing text only:', error);
        }
      }
      
      // For images pasted, determine artifact type based on file type
      let artifactType = uploadType;
      if (file.type.startsWith('image/')) {
        artifactType = 'ARCHITECTURE'; // Default images to architecture diagrams
      }
      
      await repo.addArtifact({
        projectId: selectedProject.id,
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
        fileContent: fileContent,
        artifactType: artifactType
      });
    }
    
    await loadArtifacts(selectedProject.id);
    setShowUploadModal(false);
  }, [selectedProject, uploadType, loadArtifacts]);

  useEffect(() => {
    loadProjects();
    if (selectedProject) {
      loadArtifacts(selectedProject.id);
    }
  }, [selectedProject, loadArtifacts]);

  // Handle paste events for file attachments and text content
  useEffect(() => {
    const handlePaste = async (event: ClipboardEvent) => {
      // Only handle paste if a project is selected
      if (!selectedProject) return;
      
      // Don't handle if user is typing in an input/textarea
      const target = event.target as HTMLElement;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
        return; // Let normal paste work in input fields
      }
      
      const items = event.clipboardData?.items;
      if (!items) return;

      const files: File[] = [];
      let hasTextContent = false;
      
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        
        // Handle files
        if (item.kind === 'file') {
          const file = item.getAsFile();
          if (file) {
            // Check if it's a supported file type
            const fileName = file.name || `pasted-file-${Date.now()}.${file.type.split('/')[1] || 'bin'}`;
            const fileExtension = fileName.split('.').pop()?.toLowerCase();
            
            // Accept common document and image formats
            const supportedExtensions = ['pdf', 'doc', 'docx', 'txt', 'md', 'png', 'jpg', 'jpeg', 'gif', 'webp'];
            
            if (!fileExtension || supportedExtensions.includes(fileExtension) || file.type.startsWith('image/')) {
              // Create a proper File object with name if it doesn't have one
              const namedFile = file.name ? file : new File([file], fileName, { type: file.type });
              files.push(namedFile);
            }
          }
        }
        // Handle text content
        else if (item.kind === 'string' && item.type === 'text/plain') {
          hasTextContent = true;
        }
      }
      
      // Also handle pasted images (screenshots, copied images) that might not come as file items
      if (files.length === 0 && event.clipboardData) {
        // Try to get image from clipboard
        const clipboardItems = Array.from(items);
        const imageItem = clipboardItems.find(item => item.type.startsWith('image/'));
        
        if (imageItem && imageItem.kind === 'file') {
          const file = imageItem.getAsFile();
          if (file) {
            const imageFile = new File([file], `pasted-image-${Date.now()}.png`, { type: file.type || 'image/png' });
            files.push(imageFile);
          }
        }
      }
      
      // Handle file pastes
      if (files.length > 0) {
        event.preventDefault();
        console.log(`📋 Pasted ${files.length} file(s) from clipboard`);
        await processFiles(files);
      }
      // Handle text content paste (if no files were pasted)
      else if (hasTextContent && event.clipboardData) {
        const pastedText = event.clipboardData.getData('text/plain');
        // Only show modal if text is substantial (more than 50 characters)
        if (pastedText && pastedText.trim().length > 50) {
          event.preventDefault();
          setPastedContent(pastedText);
          // Try to extract a filename from the text (look for document title)
          const firstLine = pastedText.split('\n')[0]?.trim();
          const suggestedName = firstLine && firstLine.length < 100 
            ? `${firstLine.replace(/[^a-z0-9]/gi, '_').substring(0, 50)}.txt`
            : `pasted-document-${Date.now()}.txt`;
          setPasteFileName(suggestedName);
          setShowPasteModal(true);
          console.log(`📋 Pasted text content (${pastedText.length} characters)`);
        }
      }
    };

    // Add paste event listener
    window.addEventListener('paste', handlePaste);
    
    return () => {
      window.removeEventListener('paste', handlePaste);
    };
  }, [selectedProject, processFiles]);

  const createProject = async () => {
    if (!newProjectName.trim()) return;
    
    const project = await repo.createProject({
      name: newProjectName,
      description: newProjectDesc
    });
    
    setProjects([...projects, project]);
    setNewProjectName('');
    setNewProjectDesc('');
    setShowCreateModal(false);
    onProjectSelect(project);
  };

  const deleteProject = async (id: string) => {
    if (!confirm('Are you sure you want to delete this project and all its data?')) return;
    
    await repo.deleteProject(id);
    setProjects(projects.filter(p => p.id !== id));
    if (selectedProject?.id === id) {
      onProjectSelect(null);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!selectedProject || !event.target.files) return;
    
    const files = Array.from(event.target.files);
    await processFiles(files);
  };

  const handleSavePastedContent = async () => {
    if (!selectedProject || !pastedContent.trim()) return;
    
    // Create a File object from the pasted text
    const file = new File([pastedContent], pasteFileName || `pasted-document-${Date.now()}.txt`, {
      type: 'text/plain'
    });
    
    await processFiles([file]);
    setShowPasteModal(false);
    setPastedContent('');
    setPasteFileName('');
  };

  const deleteArtifact = async (id: string) => {
    await repo.deleteArtifact(id);
    if (selectedProject) {
      await loadArtifacts(selectedProject.id);
    }
  };

  const downloadAllArtifactsAsZip = async () => {
    if (!selectedProject || artifacts.length === 0) {
      alert('No artifacts to download');
      return;
    }

    try {
      const zip = new JSZip();
      
      // Process each artifact
      for (const artifact of artifacts) {
        let fileData: Blob | Uint8Array | string;
        
        // Check if the fileContent contains base64 PDF data
        const pdfBase64Match = artifact.fileContent.match(/\[PDF_BASE64_START\](.*?)\[PDF_BASE64_END\]/);
        
        if (pdfBase64Match) {
          // Extract base64 PDF data
          const base64Data = pdfBase64Match[1];
          try {
            // Convert base64 to binary
            const binaryString = atob(base64Data);
            const bytes = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) {
              bytes[i] = binaryString.charCodeAt(i);
            }
            fileData = bytes;
          } catch (error) {
            console.warn(`Failed to decode base64 for ${artifact.fileName}, using text content instead`);
            // Fallback to text content if base64 decode fails
            fileData = artifact.fileContent.replace(/\[PDF_BASE64_START\].*?\[PDF_BASE64_END\]/, '').trim() || 'Content unavailable';
          }
        } else if (artifact.fileType?.startsWith('image/')) {
          // For images, check if content is base64 data URL or plain base64
          const base64DataUrlMatch = artifact.fileContent.match(/^data:image\/[^;]+;base64,(.+)$/);
          const base64PlainMatch = artifact.fileContent.match(/^[A-Za-z0-9+\/]+=*$/);
          
          if (base64DataUrlMatch) {
            // Extract base64 from data URL
            const base64Data = base64DataUrlMatch[1];
            try {
              const binaryString = atob(base64Data);
              const bytes = new Uint8Array(binaryString.length);
              for (let i = 0; i < binaryString.length; i++) {
                bytes[i] = binaryString.charCodeAt(i);
              }
              fileData = bytes;
            } catch (error) {
              console.warn(`Failed to decode base64 image for ${artifact.fileName}`);
              fileData = `[Image file: ${artifact.fileName}]\nNote: Binary image data not available. Original file content was stored as text.`;
            }
          } else if (base64PlainMatch && artifact.fileContent.length > 100) {
            // Try to decode as plain base64
            try {
              const binaryString = atob(artifact.fileContent);
              const bytes = new Uint8Array(binaryString.length);
              for (let i = 0; i < binaryString.length; i++) {
                bytes[i] = binaryString.charCodeAt(i);
              }
              fileData = bytes;
            } catch (error) {
              // Not valid base64, use as text
              fileData = artifact.fileContent || '';
            }
          } else {
            // Image content is stored as text (extracted text or placeholder)
            fileData = artifact.fileContent || `[Image file: ${artifact.fileName}]\nNote: Binary image data not available.`;
          }
        } else {
          // Regular text content
          fileData = artifact.fileContent || '';
        }
        
        // Determine file extension based on fileType or fileName
        let fileName = artifact.fileName;
        if (!fileName.includes('.')) {
          // Add extension based on fileType if missing
          const mimeToExt: Record<string, string> = {
            'application/pdf': '.pdf',
            'text/plain': '.txt',
            'text/markdown': '.md',
            'application/msword': '.doc',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
            'image/png': '.png',
            'image/jpeg': '.jpg',
            'image/jpg': '.jpg',
            'image/gif': '.gif',
            'image/webp': '.webp',
          };
          const ext = mimeToExt[artifact.fileType] || '.txt';
          fileName = `${fileName}${ext}`;
        }
        
        // Add file to zip (sanitize filename to avoid path traversal issues)
        // Also handle duplicate filenames by adding a counter
        let safeFileName = fileName.replace(/[\/\\]/g, '_').replace(/\.\./g, '_');
        let counter = 1;
        const originalFileName = safeFileName;
        while (zip.files[safeFileName]) {
          const nameWithoutExt = originalFileName.replace(/\.[^/.]+$/, '');
          const ext = originalFileName.match(/\.[^/.]+$/)?.pop() || '';
          safeFileName = `${nameWithoutExt}_${counter}${ext}`;
          counter++;
        }
        
        zip.file(safeFileName, fileData);
      }
      
      // Generate zip file
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      
      // Download the zip file
      const zipFileName = `${selectedProject.name.replace(/[^a-z0-9]/gi, '_')}_artifacts_${new Date().toISOString().split('T')[0]}.zip`;
      saveAs(zipBlob, zipFileName);
    } catch (error) {
      console.error('Error creating zip file:', error);
      alert('Failed to create zip file. Please try again.');
    }
  };

  return (
    <div className={hideProjectList ? "w-full" : "bg-white rounded-lg shadow-md p-6 mb-6"}>
      {!hideProjectList && (
        <>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
              <FolderOpen size={24} />
              Projects
            </h2>
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white px-4 py-2 rounded-lg hover:from-purple-700 hover:to-blue-700 transition-colors"
            >
              <Plus size={20} />
              New Project
            </button>
          </div>

          {/* Project List */}
          <div className="space-y-2 mb-4">
            {projects.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No projects yet. Create one to get started!</p>
            ) : (
              projects.map(project => (
                <div
                  key={project.id}
                  className={`p-3 rounded-lg border-2 transition-all cursor-pointer ${
                    selectedProject?.id === project.id
                      ? 'border-purple-700 bg-purple-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => onProjectSelect(project)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-800">{project.name}</h3>
                      <p className="text-sm text-gray-600">{project.description || 'No description'}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(project.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteProject(project.id);
                      }}
                      className="p-2 text-purple-600 hover:text-purple-800 hover:bg-purple-50 rounded"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      )}

      {/* Artifacts Section */}
      {selectedProject && (
        <div className={hideProjectList ? "w-full" : "border-t pt-4"}>
          {!hideProjectList && (
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                <FileText size={18} />
                Business Artifacts
              </h3>
              <div className="flex items-center gap-2">
                {artifacts.length > 0 && (
                  <button
                    onClick={downloadAllArtifactsAsZip}
                    className="flex items-center gap-2 text-blue-700 px-3 py-1.5 rounded-lg hover:bg-blue-50 transition-colors text-sm font-medium"
                    title="Download all business artifacts as ZIP"
                  >
                    <Download size={16} />
                    Download All as ZIP
                  </button>
                )}
              <button
                onClick={() => setShowUploadModal(true)}
                className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white px-4 py-2.5 rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all shadow-md hover:shadow-lg font-semibold text-sm"
              >
                  <UploadIcon size={18} />
                  Upload Business Artifact
                </button>
              </div>
            </div>
          )}
          
          {/* Upload Button - Always show when hideProjectList is true */}
          {hideProjectList && (
            <div className="mb-3 flex gap-2">
              {artifacts.length > 0 && (
                <button
                  onClick={downloadAllArtifactsAsZip}
                  className="flex items-center justify-center gap-2 text-blue-700 px-4 py-2 rounded-lg hover:bg-blue-50 transition-colors text-sm font-medium border border-blue-200"
                  title="Download all artifacts as ZIP"
                >
                  <Download size={16} />
                  Download All as ZIP
                </button>
              )}
              <button
                onClick={() => setShowUploadModal(true)}
                className={`${artifacts.length > 0 ? 'flex-1' : 'w-full'} flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-3 rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all shadow-md hover:shadow-lg font-semibold text-base`}
              >
                <UploadIcon size={20} />
                Upload Business Artifact
              </button>
            </div>
          )}
          
          {/* Paste hint */}
          <div className="mb-3 bg-blue-50 border border-blue-200 rounded-lg p-2 text-xs text-blue-700">
            💡 <strong>Tip:</strong> You can paste files or text content directly (Ctrl+V / Cmd+V) when this project is selected. Supported: PDF, Word, images, and text documents.
          </div>
          
          {artifacts.length === 0 ? (
            <div className="text-center py-8 border-2 border-dashed border-purple-200 rounded-lg bg-gradient-to-br from-purple-50/50 to-blue-50/50">
              <UploadIcon size={48} className="mx-auto text-purple-400 mb-3" />
              <p className="text-gray-600 font-medium mb-2">No business artifacts uploaded yet</p>
              <p className="text-sm text-gray-500 mb-4">Upload BRDs, process flows, diagrams, and technical specs to get started</p>
              <button
                onClick={() => setShowUploadModal(true)}
                className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-3 rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all shadow-lg hover:shadow-xl font-semibold text-base"
              >
                <UploadIcon size={20} />
                Upload Business Artifact
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {artifacts.map(artifact => (
                <div key={artifact.id} className="flex items-center justify-between p-2 bg-gray-50 rounded border">
                  <div className="flex items-center gap-2">
                    <FileText size={16} className="text-blue-600" />
                    <div>
                      <p className="text-sm font-medium text-gray-800">{artifact.fileName}</p>
                      <p className="text-xs text-gray-600">
                        {artifact.artifactType} • {(artifact.fileSize / 1024).toFixed(2)} KB
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => deleteArtifact(artifact.id)}
                    className="p-1.5 text-purple-600 hover:text-purple-800 hover:bg-purple-50 rounded"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Create Project Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-xl font-semibold mb-4">Create New Project</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Project Name *
                </label>
                <input
                  type="text"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="e.g., Kilimo Biashara Loan System"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={newProjectDesc}
                  onChange={(e) => setNewProjectDesc(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Brief description of the project"
                  rows={3}
                />
              </div>
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    setNewProjectName('');
                    setNewProjectDesc('');
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={createProject}
                  className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700"
                >
                  Create
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-lg mx-4 border border-gray-200">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-200">
              <div className="p-2 bg-gradient-to-br from-purple-100 to-blue-100 rounded-lg">
                <UploadIcon size={24} className="text-purple-600" />
              </div>
              <h3 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                Upload Business Artifact
              </h3>
            </div>
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Business Artifact Type <span className="text-red-500">*</span>
                </label>
                <select
                  value={uploadType}
                  onChange={(e) => setUploadType(e.target.value as ArtifactType)}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all font-medium"
                >
                  <option value="BRD">Business Requirements Document (BRD)</option>
                  <option value="FLOW">Process Flow</option>
                  <option value="SEQUENCE">Sequence Diagram</option>
                  <option value="ARCHITECTURE">Architecture Diagram</option>
                  <option value="TECHNICAL_SPEC">Technical Specification</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Select Files <span className="text-red-500">*</span>
                </label>
                <div className="border-2 border-dashed border-purple-300 rounded-lg p-6 bg-gradient-to-br from-purple-50/50 to-blue-50/50 hover:border-purple-400 transition-colors">
                  <input
                    type="file"
                    multiple
                    onChange={handleFileUpload}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all cursor-pointer"
                    accept={uploadType === 'TECHNICAL_SPEC' ? undefined : ".pdf,.doc,.docx,.txt,.md,.png,.jpg,.jpeg"}
                  />
                  <p className="text-xs text-gray-500 mt-2 text-center">
                    {uploadType === 'TECHNICAL_SPEC' 
                      ? 'Any file type is supported for Technology Artifacts' 
                      : 'Supported formats: PDF, Word, Text, Images'}
                  </p>
                </div>
              </div>
              <div className="flex gap-3 justify-end pt-2">
                <button
                  onClick={() => setShowUploadModal(false)}
                  className="px-5 py-2.5 border-2 border-gray-300 rounded-lg hover:bg-gray-50 font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => setShowUploadModal(false)}
                  className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 font-semibold transition-all shadow-md hover:shadow-lg"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Paste Text Content Modal */}
      {showPasteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] flex flex-col">
            <h3 className="text-xl font-semibold mb-4">Save Pasted Content as Document</h3>
            <div className="space-y-4 flex-1 overflow-hidden flex flex-col">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Document Name
                </label>
                <input
                  type="text"
                  value={pasteFileName}
                  onChange={(e) => setPasteFileName(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="e.g., Mobile Loan Refer BRD.txt"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Business Artifact Type
                </label>
                <select
                  value={uploadType}
                  onChange={(e) => setUploadType(e.target.value as ArtifactType)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="BRD">Business Requirements Document (BRD)</option>
                  <option value="FLOW">Process Flow</option>
                  <option value="SEQUENCE">Sequence Diagram</option>
                  <option value="ARCHITECTURE">Architecture Diagram</option>
                  <option value="TECHNICAL_SPEC">Technical Specification</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
              <div className="flex-1 flex flex-col min-h-0">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Content Preview ({pastedContent.length} characters)
                </label>
                <textarea
                  value={pastedContent}
                  onChange={(e) => setPastedContent(e.target.value)}
                  className="w-full flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent font-mono text-xs resize-none"
                  placeholder="Pasted content will appear here..."
                  readOnly
                />
              </div>
              <div className="flex gap-2 justify-end pt-2 border-t">
                <button
                  onClick={() => {
                    setShowPasteModal(false);
                    setPastedContent('');
                    setPasteFileName('');
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSavePastedContent}
                  disabled={!pastedContent.trim() || !pasteFileName.trim()}
                  className="px-4 py-2 bg-red-700 text-white rounded-lg hover:bg-red-800 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Save as Document
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectManager;

