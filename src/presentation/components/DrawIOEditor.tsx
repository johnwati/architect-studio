import * as joint from '@joint/core';
import { shapes } from '@joint/core';
import '@joint/core/joint.css';
import { Download, FileText, Loader, Save, X } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import { ArtifactType, ProjectArtifactEntity, ProjectEntity } from '../../domain/entities/Project';
import { PrismaProjectRepository } from '../../infrastructure/repositories/PrismaProjectRepository';

interface DrawIOEditorProps {
  project: ProjectEntity;
  existingDiagram?: ProjectArtifactEntity | null;
  onSave: (diagram: ProjectArtifactEntity) => void;
  onClose: () => void;
  onDelete?: () => void;
}

const DrawIOEditor: React.FC<DrawIOEditorProps> = ({
  project,
  existingDiagram,
  onSave,
  onClose,
  onDelete
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [diagramName, setDiagramName] = useState(
    existingDiagram?.fileName.replace('.drawio', '').replace('.xml', '') || 
    `diagram-${Date.now()}`
  );
  const [diagramType, setDiagramType] = useState<ArtifactType>(
    existingDiagram?.artifactType || 'ARCHITECTURE'
  );
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const repo = useRef(new PrismaProjectRepository());
  const graphRef = useRef<joint.dia.Graph | null>(null);
  const paperRef = useRef<joint.dia.Paper | null>(null);
  const selectedCellsRef = useRef<joint.dia.Cell[]>([]);

  useEffect(() => {
    if (!containerRef.current) return;

    const initializeGraph = async () => {
      try {
        // Create JointJS graph
        const graph = new joint.dia.Graph();
        graphRef.current = graph;

        // Create paper (canvas)
        if (!containerRef.current) {
          throw new Error('Container element not found');
        }

        const container = containerRef.current;
        const paper = new joint.dia.Paper({
          el: container,
          model: graph,
          width: container.clientWidth,
          height: container.clientHeight,
          gridSize: 10,
          drawGrid: true,
          background: {
            color: '#f8f9fa'
          },
          async: true,
          snapLinks: true,
          linkPinning: false,
          defaultLink: new joint.shapes.standard.Link(),
          validateConnection: (cellViewS, _magnetS, cellViewT, _magnetT) => {
            // Prevent connecting link to itself
            return cellViewS !== cellViewT;
          },
          highlighting: {
            connecting: {
              name: 'stroke',
              options: {
                padding: 4,
                attrs: {
                  'stroke-width': 2,
                  stroke: '#3498db'
                }
              }
            }
          }
        });

        paperRef.current = paper;

        // Handle window resize
        const handleResize = () => {
          if (containerRef.current && paper) {
            paper.setDimensions(
              containerRef.current.clientWidth,
              containerRef.current.clientHeight
            );
          }
        };
        window.addEventListener('resize', handleResize);

        // Load existing diagram if provided
        if (existingDiagram && existingDiagram.fileContent && !existingDiagram.fileContent.includes('[PDF_BASE64_START]')) {
          try {
            const jsonContent = JSON.parse(existingDiagram.fileContent);
            graph.fromJSON(jsonContent);
          } catch (error) {
            // Try to parse as XML (for backward compatibility)
            try {
              const parser = new DOMParser();
              parser.parseFromString(existingDiagram.fileContent, 'text/xml');
              // If it's valid XML but not JSON, create a simple shape with the content
              const rect = new shapes.standard.Rectangle({
                position: { x: 100, y: 100 },
                size: { width: 200, height: 100 },
                attrs: {
                  body: {
                    fill: '#ffffff',
                    stroke: '#000000',
                    strokeWidth: 2
                  },
                  label: {
                    text: existingDiagram.fileName,
                    fill: '#000000'
                  }
                }
              });
              graph.addCell(rect);
            } catch (xmlError) {
            console.error('Error loading diagram:', error);
              // Create a default shape
              const rect = new shapes.standard.Rectangle({
                position: { x: 100, y: 100 },
                size: { width: 200, height: 100 },
                attrs: {
                  body: {
                    fill: '#3498db',
                    stroke: '#2980b9',
                    strokeWidth: 2
                  },
                  label: {
                    text: 'New Diagram',
                    fill: '#ffffff'
                  }
                }
              });
              graph.addCell(rect);
            }
          }
        }

        // Track changes
        graph.on('change', () => {
          setHasUnsavedChanges(true);
        });

        // Track selection
        paper.on('cell:pointerdown', (cellView) => {
          if (cellView.model) {
            if (!selectedCellsRef.current.includes(cellView.model)) {
              selectedCellsRef.current.push(cellView.model);
            }
          }
        });

        paper.on('blank:pointerdown', () => {
          selectedCellsRef.current = [];
        });

        setIsLoading(false);

        return () => {
          window.removeEventListener('resize', handleResize);
          if (paper) {
            paper.remove();
          }
          if (graph) {
            graph.clear();
          }
        };
      } catch (error) {
        console.error('Error initializing JointJS:', error);
        setIsLoading(false);
        alert('Error initializing diagram editor. Please check the console for details. Error: ' + (error instanceof Error ? error.message : String(error)));
      }
    };

    initializeGraph();
  }, [existingDiagram]);

  const handleSaveDiagram = async () => {
    if (!graphRef.current) return;

    setIsSaving(true);
    try {
      // Export graph as JSON
      const json = graphRef.current.toJSON();

      const fileName = diagramName.endsWith('.json') 
        ? diagramName 
        : `${diagramName}.json`;
      
      const artifact: ProjectArtifactEntity = {
        id: existingDiagram?.id || crypto.randomUUID(),
        projectId: project.id,
        fileName: fileName,
        fileType: 'application/json',
        fileSize: new Blob([JSON.stringify(json, null, 2)]).size,
        fileContent: JSON.stringify(json, null, 2),
        artifactType: diagramType,
        uploadedAt: existingDiagram?.uploadedAt || new Date()
      };

      if (existingDiagram) {
        await repo.current.deleteArtifact(existingDiagram.id);
      }
      
      await repo.current.addArtifact({
        projectId: artifact.projectId,
        fileName: artifact.fileName,
        fileType: artifact.fileType,
        fileSize: artifact.fileSize,
        fileContent: artifact.fileContent,
        artifactType: artifact.artifactType
      });

      setIsSaving(false);
      setHasUnsavedChanges(false);
      onSave(artifact);
    } catch (error) {
      console.error('Error saving diagram:', error);
      setIsSaving(false);
      alert('Error saving diagram. Please try again.');
    }
  };

  const handleExportPNG = () => {
    if (!paperRef.current) return;

    try {
      // Export paper as PNG
      const svg = paperRef.current.svg;
      const svgData = new XMLSerializer().serializeToString(svg);
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(svgBlob);

      img.onload = () => {
        if (ctx) {
          canvas.width = img.width;
          canvas.height = img.height;
          ctx.drawImage(img, 0, 0);
          canvas.toBlob((blob) => {
            if (blob) {
              const downloadUrl = URL.createObjectURL(blob);
              const link = document.createElement('a');
              link.href = downloadUrl;
              link.download = `${diagramName}.png`;
              link.click();
              URL.revokeObjectURL(downloadUrl);
            }
          }, 'image/png');
        }
        URL.revokeObjectURL(url);
      };

      img.src = url;
    } catch (error) {
      console.error('Error exporting PNG:', error);
      alert('Error exporting PNG. Please try again.');
    }
  };

  const handleExportSVG = () => {
    if (!paperRef.current) return;

    try {
      // Export as SVG
      const svg = paperRef.current.svg;
      const svgString = new XMLSerializer().serializeToString(svg);
        const blob = new Blob([svgString], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${diagramName}.svg`;
        link.click();
        URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting SVG:', error);
      alert('Error exporting SVG. Please try again.');
    }
  };

  const handleClose = () => {
    if (hasUnsavedChanges) {
      if (!confirm('You have unsaved changes. Are you sure you want to close?')) {
        return;
      }
    }
    onClose();
  };

  const addShape = (type: string) => {
    if (!graphRef.current) return;

    const shapesMap: { [key: string]: any } = {
      rectangle: shapes.standard.Rectangle,
      circle: shapes.standard.Circle,
      ellipse: shapes.standard.Ellipse,
      path: shapes.standard.Path,
      text: shapes.standard.TextBlock
    };

    const ShapeClass = shapesMap[type] || shapes.standard.Rectangle;
    
    const shape = new ShapeClass({
      position: { x: 100, y: 100 },
      size: { width: 100, height: 50 },
      attrs: {
        body: {
          fill: '#3498db',
          stroke: '#2980b9',
          strokeWidth: 2
        },
        label: {
          text: type.charAt(0).toUpperCase() + type.slice(1),
          fill: '#ffffff'
        }
      }
    });

    graphRef.current.addCell(shape);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white w-full h-full flex flex-col" style={{ maxWidth: '100vw', maxHeight: '100vh' }}>
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-4 flex items-center justify-between shadow-md">
          <div className="flex items-center space-x-4 flex-1">
            <FileText size={24} />
            <div className="flex-1">
              <input
                type="text"
                value={diagramName}
                onChange={(e) => setDiagramName(e.target.value)}
                className="bg-white text-gray-800 px-3 py-1 rounded text-lg font-semibold w-full max-w-md"
                placeholder="Diagram Name"
              />
              <div className="mt-2 flex items-center space-x-3">
                <select
                  value={diagramType}
                  onChange={(e) => setDiagramType(e.target.value as ArtifactType)}
                  className="bg-white text-gray-800 px-3 py-1 rounded text-sm border border-gray-300"
                >
                  <option value="ARCHITECTURE">Architecture Diagram</option>
                  <option value="FLOW">Process Flow</option>
                  <option value="SEQUENCE">Sequence Diagram</option>
                  <option value="OTHER">Other</option>
                </select>
                {hasUnsavedChanges && (
                  <span className="text-yellow-300 text-xs">● Unsaved changes</span>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleExportPNG}
              className="flex items-center space-x-2 bg-white text-purple-700 px-3 py-2 rounded hover:bg-purple-50 transition-colors text-sm font-medium"
              title="Export as PNG"
            >
              <Download size={16} />
              <span className="hidden sm:inline">PNG</span>
            </button>
            <button
              onClick={handleExportSVG}
              className="flex items-center space-x-2 bg-white text-purple-700 px-3 py-2 rounded hover:bg-purple-50 transition-colors text-sm font-medium"
              title="Export as SVG"
            >
              <Download size={16} />
              <span className="hidden sm:inline">SVG</span>
            </button>
            <button
              onClick={handleSaveDiagram}
              disabled={isSaving || !diagramName.trim()}
              className="flex items-center space-x-2 bg-white text-purple-700 px-4 py-2 rounded hover:bg-purple-50 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? (
                <>
                  <Loader className="animate-spin" size={16} />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save size={16} />
                  <span>Save</span>
                </>
              )}
            </button>
            {onDelete && existingDiagram && (
              <button
                onClick={() => {
                  if (confirm('Are you sure you want to delete this diagram?')) {
                    onDelete();
                  }
                }}
                className="flex items-center space-x-2 bg-purple-800 text-white px-3 py-2 rounded hover:bg-purple-900 transition-colors text-sm"
              >
                <X size={16} />
              </button>
            )}
            <button
              onClick={handleClose}
              className="flex items-center space-x-2 bg-purple-800 text-white px-3 py-2 rounded hover:bg-purple-900 transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Graph Editor */}
        <div className="flex-1 relative bg-gray-100">
          {isLoading && (
            <div className="absolute inset-0 bg-gray-100 flex items-center justify-center z-10">
              <div className="text-center">
                <Loader className="animate-spin text-purple-700 mx-auto mb-4" size={32} />
                <p className="text-gray-600 font-semibold mb-2">Loading JointJS diagram editor...</p>
                <p className="text-sm text-gray-500">Initializing local JointJS library</p>
              </div>
            </div>
          )}
          <div 
            ref={containerRef} 
            className="w-full h-full"
            style={{ minHeight: '500px' }}
          />
        </div>

        {/* Toolbar */}
        <div className="bg-white border-t border-gray-200 p-2 flex items-center space-x-2 overflow-x-auto">
          <button
            onClick={() => addShape('rectangle')}
            className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded text-sm"
          >
            Add Rectangle
          </button>
          <button
            onClick={() => addShape('circle')}
            className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded text-sm"
          >
            Add Circle
          </button>
          <button
            onClick={() => addShape('ellipse')}
            className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded text-sm"
          >
            Add Ellipse
          </button>
          <button
            onClick={() => {
              if (graphRef.current && selectedCellsRef.current.length > 0) {
                graphRef.current.removeCells(selectedCellsRef.current);
                selectedCellsRef.current = [];
              }
            }}
            className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded text-sm"
            disabled={selectedCellsRef.current.length === 0}
          >
            Delete Selected
          </button>
          <div className="flex-1" />
          <span className="text-xs text-gray-500">
            Click and drag to create shapes • Click to select • Drag shapes to move • Connect shapes
          </span>
        </div>
      </div>
    </div>
  );
};

export default DrawIOEditor;
