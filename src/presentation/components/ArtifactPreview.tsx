import { Download, FileText, Loader, X } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import { ArtifactType, ProjectArtifactEntity } from '../../domain/entities/Project';

interface ArtifactPreviewProps {
  artifact: ProjectArtifactEntity;
  onClose: () => void;
  isSidePanel?: boolean;
}

const ArtifactPreview: React.FC<ArtifactPreviewProps> = ({ artifact, onClose, isSidePanel = false }) => {
  const viewerRef = useRef<HTMLDivElement>(null);
  const instanceRef = useRef<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!viewerRef.current || !artifact) return;

    let objectUrl: string | null = null;
    let timeoutId: number | null = null;

    const initializeViewer = async () => {
      try {
        setLoading(true);
        setError(null);

        // Check if file has base64 data
        const pdfBase64Match = artifact.fileContent.match(/\[PDF_BASE64_START\]([\s\S]+?)\[PDF_BASE64_END\]/);
        
        if (!pdfBase64Match || !pdfBase64Match[1]) {
          // File was uploaded before base64 storage
          setError('This file was uploaded before the preview feature was added. Please re-upload to enable preview.');
          setLoading(false);
          return;
        }

        // Extract base64 data
        const base64 = pdfBase64Match[1].trim().replace(/\s/g, '');
        
        // Convert base64 to blob
        const binaryString = atob(base64);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        
        // Determine MIME type based on file extension
        const fileName = artifact.fileName.toLowerCase();
        let mimeType = artifact.fileType || 'application/pdf';
        
        if (fileName.endsWith('.doc') || fileName.endsWith('.docx')) {
          mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
        } else if (fileName.endsWith('.xls') || fileName.endsWith('.xlsx')) {
          mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
        } else if (fileName.endsWith('.ppt') || fileName.endsWith('.pptx')) {
          mimeType = 'application/vnd.openxmlformats-officedocument.presentationml.presentation';
        }
        
        const blob = new Blob([bytes], { type: mimeType });
        
        // Create object URL
        objectUrl = URL.createObjectURL(blob);

        // Set a timeout to detect if WebViewer is hanging
        timeoutId = setTimeout(() => {
          console.error('PDFTron WebViewer initialization timeout');
          setError('Preview is taking too long to load. The file may be too large or corrupted. Please try downloading the file.');
          setLoading(false);
        }, 30000); // 30 second timeout

        // Ensure viewer container has dimensions
        if (viewerRef.current) {
          const rect = viewerRef.current.getBoundingClientRect();
          if (rect.width === 0 || rect.height === 0) {
            console.warn('Viewer container has no dimensions, waiting...');
            // Wait a bit for layout to complete
            await new Promise(resolve => setTimeout(resolve, 100));
          }
        }

        // Initialize PDFTron WebViewer - use dynamic import
        console.log('Initializing PDFTron WebViewer with document:', artifact.fileName);
        console.log('Blob URL:', objectUrl);
        console.log('File size:', artifact.fileSize, 'bytes');
        console.log('Viewer container dimensions:', viewerRef.current?.getBoundingClientRect());
        
        // Dynamically import WebViewer to avoid SSR issues
        const WebViewerModule = await import('@pdftron/webviewer');
        const WebViewer = WebViewerModule.default || WebViewerModule;
        
        if (!viewerRef.current) {
          throw new Error('Viewer container not available');
        }

        const viewerInstance = await WebViewer(
          {
            path: '/lib', // Path to PDFTron WebViewer library
            initialDoc: objectUrl,
            licenseKey: '', // You can add a license key here if needed
            disabledElements: [
              'toolsHeader',
              'ribbonsDropdown',
              'toolsOverlay',
              'viewControlsOverlay',
            ],
            enableAnnotations: false,
            enableMeasurement: false,
            fullAPI: true,
            streaming: true,
          },
          viewerRef.current
        ).catch((error) => {
          console.error('WebViewer initialization error:', error);
          throw error;
        });

        // Clear timeout on success
        if (timeoutId) {
          clearTimeout(timeoutId);
          timeoutId = null;
        }

        console.log('PDFTron WebViewer initialized successfully');

        instanceRef.current = viewerInstance;
        setLoading(false);
      } catch (err) {
        console.error('Error initializing PDFTron WebViewer:', err);
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
        setError(`Error loading file preview: ${err instanceof Error ? err.message : 'Unknown error'}. Please download the file to view it.`);
        setLoading(false);
      }
    };

    initializeViewer();

    // Cleanup function
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
      if (instanceRef.current) {
        try {
          instanceRef.current.UI.dispose();
        } catch (e) {
          console.warn('Error disposing WebViewer:', e);
        }
        instanceRef.current = null;
      }
    };
  }, [artifact?.id, artifact?.fileName]);

  const downloadArtifact = () => {
    // Recreate file from stored data
    const pdfBase64Match = artifact.fileContent.match(/\[PDF_BASE64_START\]([\s\S]+?)\[PDF_BASE64_END\]/);
    if (pdfBase64Match && pdfBase64Match[1]) {
      const binaryString = atob(pdfBase64Match[1]);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      const blob = new Blob([bytes], { type: artifact.fileType });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = artifact.fileName;
      link.click();
      URL.revokeObjectURL(url);
    } else {
      // Text file download
      const blob = new Blob([artifact.fileContent], { type: artifact.fileType });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = artifact.fileName;
      link.click();
      URL.revokeObjectURL(url);
    }
  };

  const getArtifactTypeLabel = (type: ArtifactType): string => {
    const labels: Record<ArtifactType, string> = {
      BRD: 'Business Requirements Document',
      FLOW: 'Process Flow',
      SEQUENCE: 'Sequence Diagram',
      ARCHITECTURE: 'Architecture Diagram',
      TECHNICAL_SPEC: 'Technical Specification',
      OTHER: 'Other Document'
    };
    return labels[type];
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  if (isSidePanel) {
    return (
      <div className="d-flex flex-column h-100 bg-light">
        {/* Bootstrap Command Bar - Matching Footer Spacing */}
        <div className="bg-white border-bottom border-light shadow-md rounded-top">
          <div className="d-flex align-items-center justify-content-between p-6 mx-4 mx-lg-8">
            <div className="d-flex align-items-center gap-2 flex-grow-1 min-w-0">
              <div className="flex-shrink-0">
                <div className="d-flex align-items-center justify-content-center bg-danger rounded" style={{ width: '32px', height: '32px' }}>
                  <FileText size={14} className="text-white" />
                </div>
              </div>
              <div className="flex-grow-1 min-w-0">
                <h6 className="mb-0 text-truncate fw-semibold text-dark" style={{ fontSize: '13px', lineHeight: '1.2' }}>
                  {artifact.fileName}
                </h6>
                <div className="d-flex align-items-center gap-1 mt-1">
                  <small className="text-muted" style={{ fontSize: '11px' }}>
                    {getArtifactTypeLabel(artifact.artifactType)}
                  </small>
                  <span className="text-muted">•</span>
                  <small className="text-muted" style={{ fontSize: '11px' }}>
                    {formatFileSize(artifact.fileSize)}
                  </small>
                </div>
              </div>
            </div>
            <div className="d-flex align-items-center gap-1 flex-shrink-0">
              <button
                onClick={downloadArtifact}
                className="btn btn-sm btn-link text-decoration-none p-1 d-flex align-items-center gap-1"
                title="Download"
                style={{ fontSize: '12px' }}
              >
                <Download size={14} />
                <span className="d-none d-sm-inline">Download</span>
              </button>
              <button
                onClick={onClose}
                className="btn btn-sm btn-link text-decoration-none p-1"
                title="Close"
              >
                <X size={14} />
              </button>
            </div>
          </div>
        </div>

        {/* Preview Content - Matching Footer Spacing */}
        <div className="flex-grow-1 overflow-hidden position-relative bg-white">
          {loading ? (
            <div className="d-flex align-items-center justify-content-center h-100 position-absolute top-0 start-0 end-0 bottom-0 bg-light p-6 mx-4 mx-lg-8">
              <div className="text-center">
                <Loader className="animate-spin text-danger mx-auto" size={24} />
                <p className="text-muted small mt-2 mb-0">Loading preview...</p>
              </div>
            </div>
          ) : error ? (
            <div className="d-flex align-items-center justify-content-center h-100 p-6 mx-4 mx-lg-8 bg-light">
              <div className="text-center" style={{ maxWidth: '300px' }}>
                <div className="d-inline-flex p-2 bg-light rounded-circle mb-3">
                  <FileText size={24} className="text-secondary" />
                </div>
                <p className="text-dark small mb-3 lh-sm">{error}</p>
                <button
                  onClick={downloadArtifact}
                  className="btn btn-danger btn-sm d-inline-flex align-items-center gap-1"
                >
                  <Download size={14} />
                  <span>Download File</span>
                </button>
              </div>
            </div>
          ) : (
            <div ref={viewerRef} className="h-100 w-100" style={{ padding: 0, margin: 0 }} />
          )}
        </div>
      </div>
    );
  }

  // Modal version - Bootstrap Enterprise Style
  return (
    <div className="position-fixed top-0 start-0 end-0 bottom-0 bg-dark bg-opacity-50 d-flex align-items-center justify-content-center" style={{ zIndex: 1050 }} onClick={onClose}>
      <div className="bg-white shadow-lg rounded-lg w-100" style={{ maxWidth: '1400px', maxHeight: '90vh', margin: '1rem' }} onClick={(e) => e.stopPropagation()}>
        {/* Bootstrap Command Bar - Matching Footer Spacing */}
        <div className="bg-white border-bottom border-light rounded-top">
          <div className="d-flex align-items-center justify-content-between p-6 mx-4 mx-lg-8">
            <div className="d-flex align-items-center gap-3 flex-grow-1 min-w-0">
              <div className="flex-shrink-0">
                <div className="d-flex align-items-center justify-content-center bg-danger rounded" style={{ width: '40px', height: '40px' }}>
                  <FileText size={18} className="text-white" />
                </div>
              </div>
              <div className="flex-grow-1 min-w-0">
                <h5 className="mb-0 text-truncate fw-semibold text-dark">
                  {artifact.fileName}
                </h5>
                <div className="d-flex align-items-center gap-2 mt-1">
                  <small className="text-muted">
                    {getArtifactTypeLabel(artifact.artifactType)}
                  </small>
                  <span className="text-muted">•</span>
                  <small className="text-muted">
                    {formatFileSize(artifact.fileSize)}
                  </small>
                </div>
              </div>
            </div>
            <div className="d-flex align-items-center gap-1 flex-shrink-0">
              <button
                onClick={downloadArtifact}
                className="btn btn-sm btn-link text-decoration-none d-flex align-items-center gap-2"
                title="Download"
              >
                <Download size={16} />
                <span>Download</span>
              </button>
              <button
                onClick={onClose}
                className="btn btn-sm btn-link text-decoration-none"
                title="Close"
              >
                <X size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* Preview Content - Matching Footer Spacing */}
        <div className="flex-grow-1 overflow-hidden position-relative bg-light" style={{ height: 'calc(90vh - 70px)' }}>
          {loading ? (
            <div className="d-flex align-items-center justify-content-center h-100 position-absolute top-0 start-0 end-0 bottom-0 bg-light p-6 mx-4 mx-lg-8">
              <div className="text-center">
                <Loader className="animate-spin text-danger mx-auto" size={28} />
                <p className="text-muted small mt-3 mb-0">Loading preview...</p>
              </div>
            </div>
          ) : error ? (
            <div className="d-flex align-items-center justify-content-center h-100 p-6 mx-4 mx-lg-8 bg-light">
              <div className="text-center" style={{ maxWidth: '400px' }}>
                <div className="d-inline-flex p-3 bg-light rounded-circle mb-3">
                  <FileText size={32} className="text-secondary" />
                </div>
                <p className="text-dark small mb-4 lh-sm">{error}</p>
                <button
                  onClick={downloadArtifact}
                  className="btn btn-danger btn-sm d-inline-flex align-items-center gap-2"
                >
                  <Download size={16} />
                  <span>Download File</span>
                </button>
              </div>
            </div>
          ) : (
            <div ref={viewerRef} className="h-100 w-100 bg-white" style={{ padding: 0, margin: 0 }} />
          )}
        </div>
      </div>
    </div>
  );
};

export default ArtifactPreview;
