import { ChevronRight, Download, ExternalLink, FileText, Image, Plus, Trash2, Upload, X } from 'lucide-react';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ArtifactType, ProjectArtifactEntity, ProjectEntity } from '../../domain/entities/Project';
import { PrismaProjectRepository } from '../../infrastructure/repositories/PrismaProjectRepository';

interface DrawIOFileManagerProps {
  project: ProjectEntity | null;
}

const DrawIOFileManager: React.FC<DrawIOFileManagerProps> = ({ project }) => {
  const [diagrams, setDiagrams] = useState<ProjectArtifactEntity[]>([]);
  const [selectedDiagram, setSelectedDiagram] = useState<ProjectArtifactEntity | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<{ [key: string]: boolean }>({});
  const fileInputRef = useRef<HTMLInputElement>(null);
  const repo = useMemo(() => new PrismaProjectRepository(), []);

  const loadDiagrams = useCallback(async () => {
    if (!project) {
      setDiagrams([]);
      return;
    }
    const projectArtifacts = await repo.getArtifactsByProject(project.id);
    // Show all ARCHITECTURE type artifacts (technology artifacts)
    const architectureArtifacts = projectArtifacts.filter(a => 
      a.artifactType === 'ARCHITECTURE'
    );
    setDiagrams(architectureArtifacts);
  }, [project, repo]);

  useEffect(() => {
    loadDiagrams();
  }, [loadDiagrams]);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0 || !project) return;

    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        // Accept any file type - read as text for text files, or convert to base64 for binary files
        let content: string;
        
        try {
          // Try to read as text first (for text-based files like .drawio, .xml, .txt, etc.)
          content = await file.text();
        } catch (error) {
          // If reading as text fails, convert to base64 for binary files
          const arrayBuffer = await file.arrayBuffer();
          const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
          content = base64;
        }
        
        await repo.addArtifact({
          projectId: project.id,
          fileName: file.name,
          fileType: file.type || 'application/octet-stream',
          fileSize: file.size,
          fileContent: content,
          artifactType: 'ARCHITECTURE'
        });
      }
      
      await loadDiagrams();
      setShowUploadModal(false);
    } catch (error) {
      console.error('Error uploading file:', error);
      alert('Error uploading file. Please try again.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDownload = (diagram: ProjectArtifactEntity) => {
    // Determine if content is base64 encoded or plain text
    let blob: Blob;
    try {
      // Try to decode as base64 first (for binary files)
      const binaryString = atob(diagram.fileContent);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      blob = new Blob([bytes], { type: diagram.fileType || 'application/octet-stream' });
    } catch (error) {
      // If base64 decode fails, treat as plain text
      blob = new Blob([diagram.fileContent], { type: diagram.fileType || 'text/plain' });
    }
    
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = diagram.fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleDelete = async (diagram: ProjectArtifactEntity) => {
    if (!confirm(`Are you sure you want to delete "${diagram.fileName}"?`)) return;

    try {
      await repo.deleteArtifact(diagram.id);
      await loadDiagrams();
      if (selectedDiagram?.id === diagram.id) {
        setSelectedDiagram(null);
      }
    } catch (error) {
      console.error('Error deleting diagram:', error);
      alert('Error deleting diagram. Please try again.');
    }
  };

  const handleOpenInDrawIO = (diagram: ProjectArtifactEntity) => {
    // Only open Draw.io for .drawio or .xml files
    const isDrawIOFile = diagram.fileName.endsWith('.drawio') || 
                         diagram.fileName.endsWith('.xml') || 
                         diagram.fileType === 'application/xml';
    
    if (!isDrawIOFile) {
      alert(`This file (${diagram.fileName}) is not a Draw.io file. Please download it and open with the appropriate application.`);
      handleDownload(diagram);
      return;
    }
    
    // Create a blob URL and open in draw.io web app
    let blob: Blob;
    try {
      // Try to decode as base64 first
      const binaryString = atob(diagram.fileContent);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      blob = new Blob([bytes], { type: 'application/xml' });
    } catch (error) {
      // If base64 decode fails, treat as plain text
      blob = new Blob([diagram.fileContent], { type: 'application/xml' });
    }
    
    const url = URL.createObjectURL(blob);
    
    // Open draw.io in new tab
    window.open('https://app.diagrams.net/', '_blank');
    
    // Show instructions
    setTimeout(() => {
      alert(`To edit this diagram:\n\n1. The Draw.io app should open in a new tab\n2. Click "File" → "Open from..." → "Device"\n3. Download this file first, then open it in Draw.io\n\nOr download the file and open it directly with Draw.io desktop app.`);
      handleDownload(diagram);
    }, 500);
    
    URL.revokeObjectURL(url);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  // Group diagrams by artifact type
  const diagramsByType: { [key: string]: ProjectArtifactEntity[] } = {};
  diagrams.forEach(diagram => {
    const type = diagram.artifactType;
    if (!diagramsByType[type]) {
      diagramsByType[type] = [];
    }
    diagramsByType[type].push(diagram);
  });

  const toggleCategory = (type: string) => {
    setExpandedCategories(prev => ({ ...prev, [type]: !prev[type] }));
  };

  const getArtifactTypeLabel = (type: ArtifactType): string => {
    const labels: Record<ArtifactType, string> = {
      BRD: 'Business Requirements',
      FLOW: 'Process Flow',
      SEQUENCE: 'Sequence Diagram',
      ARCHITECTURE: 'Architecture Diagrams',
      TECHNICAL_SPEC: 'Technical Specification',
      OTHER: 'Other Documents'
    };
    return labels[type] || type;
  };

  if (!project) {
    return (
      <div className="bg-white rounded-lg shadow-md p-8 text-center">
        <Image size={48} className="mx-auto text-gray-300 mb-4" />
        <p className="text-gray-600">Please select a project to manage Technology Artifacts</p>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-180px)] gap-0">
      {/* Inner Sidebar - File List */}
      <div className="w-80 bg-white rounded-lg shadow-md flex flex-col border-r border-gray-200">
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-800 flex items-center space-x-2">
              <Image size={20} />
              <span>Technology Artifacts</span>
            </h2>
            <button
              onClick={() => setShowUploadModal(true)}
              className="p-2 bg-red-700 text-white rounded-lg hover:bg-red-800 transition-colors"
              title="Upload File"
            >
              <Plus size={18} />
            </button>
          </div>
        </div>

        {/* Files List */}
        <div className="flex-1 overflow-y-auto">
          {diagrams.length === 0 ? (
            <div className="p-8 text-center">
              <Image size={32} className="mx-auto text-gray-300 mb-2" />
              <p className="text-sm text-gray-500 mb-4">No technology artifacts yet</p>
              <button
                onClick={() => setShowUploadModal(true)}
                className="inline-flex items-center space-x-2 bg-red-700 text-white px-4 py-2 rounded-lg hover:bg-red-800 transition-colors text-sm font-semibold"
              >
                <Upload size={16} />
                <span>Upload First File</span>
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
                        {getArtifactTypeLabel(type as ArtifactType)}
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
                              ? 'bg-red-100 text-red-700 font-medium'
                              : 'hover:bg-gray-50 text-gray-600'
                          }`}
                          title={diagram.fileName}
                        >
                          <FileText size={14} className="flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="truncate">{diagram.fileName}</p>
                            <p className="text-xs text-gray-500 truncate">
                              {formatFileSize(diagram.fileSize)}
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
            {/* File Header */}
            <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-red-700 to-red-800 text-white">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-xl font-bold">{selectedDiagram.fileName}</h3>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center text-xs bg-white text-red-700 px-2.5 py-1 rounded-md font-medium">
                      {getArtifactTypeLabel(selectedDiagram.artifactType)}
                    </span>
                    <span className="inline-flex items-center text-xs text-white bg-red-600 bg-opacity-40 px-2.5 py-1 rounded-md">
                      {formatFileSize(selectedDiagram.fileSize)}
                    </span>
                    <span className="inline-flex items-center text-xs text-white bg-red-600 bg-opacity-40 px-2.5 py-1 rounded-md">
                      Uploaded: {new Date(selectedDiagram.uploadedAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => handleOpenInDrawIO(selectedDiagram)}
                    className="flex items-center gap-2 bg-white text-red-700 px-4 py-2 rounded-lg hover:bg-red-50 transition-colors font-semibold whitespace-nowrap"
                    title="Open in Draw.io Editor"
                  >
                    <ExternalLink size={16} className="text-red-700" />
                    <span>Open in Draw.io</span>
                  </button>
                  <button
                    onClick={() => handleDownload(selectedDiagram)}
                    className="flex items-center gap-2 bg-white text-red-700 px-4 py-2 rounded-lg hover:bg-red-50 transition-colors font-semibold whitespace-nowrap"
                    title="Download File"
                  >
                    <Download size={16} className="text-red-700" />
                    <span>Download</span>
                  </button>
                  <button
                    onClick={() => handleDelete(selectedDiagram)}
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

            {/* File Content Preview */}
            <div className="flex-1 overflow-auto p-6">
              <div className="space-y-4">
                <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-5 border border-gray-200 shadow-sm">
                  <h4 className="text-sm font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <FileText size={16} className="text-gray-600" />
                    <span>File Information</span>
                  </h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="bg-white rounded-lg p-3 border border-gray-200">
                      <p className="text-gray-500 font-medium mb-1.5 text-xs uppercase tracking-wide">Name</p>
                      <p className="text-gray-900 font-semibold truncate">{selectedDiagram.fileName}</p>
                    </div>
                    <div className="bg-white rounded-lg p-3 border border-gray-200">
                      <p className="text-gray-500 font-medium mb-1.5 text-xs uppercase tracking-wide">Type</p>
                      <p className="text-gray-900">{selectedDiagram.fileType || 'application/xml'}</p>
                    </div>
                    <div className="bg-white rounded-lg p-3 border border-gray-200">
                      <p className="text-gray-500 font-medium mb-1.5 text-xs uppercase tracking-wide">Size</p>
                      <p className="text-gray-900 font-semibold">{formatFileSize(selectedDiagram.fileSize)}</p>
                    </div>
                    <div className="bg-white rounded-lg p-3 border border-gray-200">
                      <p className="text-gray-500 font-medium mb-1.5 text-xs uppercase tracking-wide">Uploaded</p>
                      <p className="text-gray-900">{new Date(selectedDiagram.uploadedAt).toLocaleString()}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 rounded-lg p-5 border border-blue-200 shadow-sm">
                  <h4 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
                    <ExternalLink size={16} className="text-blue-600" />
                    <span>Quick Actions</span>
                  </h4>
                  <div className="space-y-3 text-sm text-gray-700">
                    <p className="font-semibold text-gray-800 mb-2">To edit this file:</p>
                    <ol className="list-decimal list-inside space-y-2 ml-2">
                      <li>Click <strong className="text-blue-700">"Download"</strong> to save the file to your computer</li>
                      <li>Open the file with Draw.io desktop app or visit <a href="https://app.diagrams.net" target="_blank" rel="noopener noreferrer" className="text-blue-700 hover:text-blue-800 underline font-semibold">app.diagrams.net</a></li>
                      <li>Make your edits and save the updated file</li>
                      <li>Upload the updated file here to replace the current version</li>
                    </ol>
                    <div className="mt-4 p-3 bg-gradient-to-r from-blue-100 to-indigo-100 rounded-lg border border-blue-200 text-xs text-blue-900 font-medium">
                      <strong>💡 Tip:</strong> This is a file management system. To edit diagrams, use the Draw.io application separately.
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-5 border border-gray-200 shadow-sm">
                  <h4 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
                    <FileText size={16} className="text-gray-600" />
                    <span>File Content Preview</span>
                  </h4>
                  <div className="bg-gradient-to-br from-gray-900 to-black text-green-400 p-5 rounded-lg overflow-auto font-mono text-xs max-h-96 border-2 border-gray-700 shadow-inner">
                    <pre className="whitespace-pre-wrap leading-relaxed">{selectedDiagram.fileContent.substring(0, 2000)}{selectedDiagram.fileContent.length > 2000 ? '\n\n... (truncated)' : ''}</pre>
                  </div>
                  {selectedDiagram.fileContent.length > 2000 && (
                    <div className="mt-3 p-2 bg-blue-50 border border-blue-200 rounded text-xs text-blue-700 italic">
                      Showing first 2000 characters. Full content available when downloaded.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <Image size={48} className="mx-auto text-gray-300 mb-4" />
              <p className="text-gray-600">Select a file to view details</p>
              <p className="text-sm text-gray-500 mt-2">
                Choose a technology artifact from the list on the left
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            {/* Header */}
            <div className="bg-red-700 text-white p-4 flex items-center justify-between rounded-t-lg">
              <h3 className="text-xl font-bold">Upload Technology Artifact</h3>
              <button
                onClick={() => {
                  setShowUploadModal(false);
                  if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                  }
                }}
                className="text-white hover:text-red-200 transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            {/* Form */}
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Select Technology Artifact Files (Any file type)
                </label>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  onChange={handleFileUpload}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  disabled={uploading}
                />
                <p className="text-xs text-gray-500 mt-2">
                  You can upload multiple files of any type at once. Files will be saved as Technology Artifacts.
                </p>
              </div>

              {uploading && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-sm text-blue-700">Uploading files... Please wait.</p>
                </div>
              )}

              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-gray-700 mb-2">How to use:</h4>
                <ol className="list-decimal list-inside space-y-1 text-xs text-gray-600">
                  <li>Create or edit your diagram in Draw.io</li>
                  <li>Save the file as .drawio or .xml</li>
                  <li>Upload it here for storage and version control</li>
                  <li>Download it later to edit again</li>
                </ol>
              </div>
            </div>

            {/* Footer */}
            <div className="border-t border-gray-200 p-4 flex justify-end">
              <button
                onClick={() => {
                  setShowUploadModal(false);
                  if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                  }
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-semibold text-gray-900 bg-white"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DrawIOFileManager;

