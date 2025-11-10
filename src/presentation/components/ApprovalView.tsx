import { Check, FileText, PenTool, Save, X } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import { ApprovalEntity, ApproverEntity, GeneratedSectionEntity, ProjectEntity } from '../../domain/entities/Project';
import { Section } from '../../domain/entities/Section';
import { CreateApprovalInput, IProjectRepository } from '../../domain/ports/IProjectRepository';
import { SECTIONS } from '../../domain/services/sections';
import { getProjectSections, getSectionTitleWithNumbering } from '../../domain/services/sectionUtils';
import CoverPage from './CoverPage';

interface ApprovalViewProps {
  project: ProjectEntity;
  approver: ApproverEntity;
  repository: IProjectRepository;
  generatedSections: GeneratedSectionEntity[];
  onApprovalChange?: () => void;
}

const ApprovalView: React.FC<ApprovalViewProps> = ({
  project,
  approver,
  repository,
  generatedSections,
  onApprovalChange,
}) => {
  const [approval, setApproval] = useState<ApprovalEntity | null>(null);
  const [loading, setLoading] = useState(false);
  const [signature, setSignature] = useState<string>('');
  const [comments, setComments] = useState('');
  const [isDrawing, setIsDrawing] = useState(false);
  const [signatureMode, setSignatureMode] = useState<'draw' | 'text'>('draw');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [sections, setSections] = useState<Section[]>([]);

  useEffect(() => {
    loadApproval();
    loadSections();
  }, [project.id, approver.id]);

  const loadSections = () => {
    const projectSections = getProjectSections(project, SECTIONS);
    setSections(projectSections);
  };

  const loadApproval = async () => {
    try {
      const existing = await repository.getApprovalByApprover(project.id, approver.id);
      if (existing) {
        setApproval(existing);
        setSignature(existing.signature || '');
        setComments(existing.comments || '');
      } else {
        // Create initial approval record
        const newApproval = await repository.createApproval({
          projectId: project.id,
          approverId: approver.id,
          status: 'PENDING',
        });
        setApproval(newApproval);
      }
    } catch (error) {
      console.error('Error loading approval:', error);
    }
  };

  const initializeCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.width = 400;
    canvas.height = 150;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Draw signature line
    ctx.beginPath();
    ctx.moveTo(20, 140);
    ctx.lineTo(380, 140);
    ctx.stroke();

    // If signature exists, draw it
    if (signature && signature.startsWith('data:image')) {
      const img = new Image();
      img.onload = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        ctx.beginPath();
        ctx.moveTo(20, 140);
        ctx.lineTo(380, 140);
        ctx.stroke();
      };
      img.src = signature;
    }
  };

  useEffect(() => {
    initializeCanvas();
  }, [signature]);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (signatureMode !== 'draw') return;
    setIsDrawing(true);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    ctx.beginPath();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || signatureMode !== 'draw') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const signatureData = canvas.toDataURL();
    setSignature(signatureData);
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.beginPath();
    ctx.moveTo(20, 140);
    ctx.lineTo(380, 140);
    ctx.stroke();
    setSignature('');
  };

  const handleSaveApproval = async (status: 'APPROVED' | 'REJECTED' | 'SIGNED') => {
    if (!approval) return;

    try {
      setLoading(true);
      const input: Partial<CreateApprovalInput> = {
        status,
        signature: signature || undefined,
        comments: comments || undefined,
      };
      await repository.updateApproval(approval.id, input);
      await loadApproval();
      onApprovalChange?.();
      alert(`Approval ${status.toLowerCase()} successfully!`);
    } catch (error) {
      console.error('Error saving approval:', error);
      alert('Failed to save approval');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'APPROVED':
      case 'SIGNED':
        return 'bg-green-100 text-green-800';
      case 'REJECTED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  // Create content map from generated sections
  const contentMap: { [key: string]: string } = {};
  generatedSections.forEach((s) => {
    contentMap[s.sectionId] = s.content;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{project.name}</h1>
              <p className="text-sm text-gray-600 mt-1">Approval View - {approver.name}</p>
            </div>
            {approval && (
              <div className={`px-4 py-2 rounded-lg font-medium ${getStatusColor(approval.status)}`}>
                {approval.status}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Document Preview */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-8">
          <div className="p-8">
            {/* Cover Page */}
            <CoverPage project={project} />

            {/* Document Content */}
            <div className="mt-12 space-y-8">
              {sections.map((section, sectionIndex) => {
                const sectionNumber = sectionIndex + 1;
                const content = contentMap[section.id];
                
                if (!content) return null;

                return (
                  <div key={section.id} className="border-b border-gray-200 pb-8 last:border-b-0">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">
                      {getSectionTitleWithNumbering(section, sectionNumber)}
                    </h2>
                    <div
                      className="prose prose-lg max-w-none"
                      dangerouslySetInnerHTML={{ __html: content }}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Approval Section */}
        {approval && approval.status === 'PENDING' && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Review & Approval
            </h3>

            {/* Signature Section */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Signature
              </label>
              <div className="flex gap-4 mb-4">
                <button
                  onClick={() => setSignatureMode('draw')}
                  className={`px-4 py-2 rounded-md ${
                    signatureMode === 'draw'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  <PenTool className="w-4 h-4 inline mr-2" />
                  Draw
                </button>
                <button
                  onClick={() => setSignatureMode('text')}
                  className={`px-4 py-2 rounded-md ${
                    signatureMode === 'text'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  Text
                </button>
              </div>

              {signatureMode === 'draw' ? (
                <div className="border-2 border-gray-300 rounded-lg p-4 bg-white">
                  <canvas
                    ref={canvasRef}
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    className="border border-gray-300 rounded cursor-crosshair w-full"
                    style={{ maxWidth: '400px' }}
                  />
                  <button
                    onClick={clearSignature}
                    className="mt-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
                  >
                    Clear
                  </button>
                </div>
              ) : (
                <input
                  type="text"
                  value={signature}
                  onChange={(e) => setSignature(e.target.value)}
                  placeholder="Enter your name"
                  className="w-full max-w-md px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              )}
            </div>

            {/* Comments Section */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Comments (Optional)
              </label>
              <textarea
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Add any comments or feedback..."
              />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4">
              <button
                onClick={() => handleSaveApproval('APPROVED')}
                disabled={loading || !signature}
                className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Check className="w-5 h-5" />
                Approve
              </button>
              <button
                onClick={() => handleSaveApproval('SIGNED')}
                disabled={loading || !signature}
                className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Save className="w-5 h-5" />
                Sign & Approve
              </button>
              <button
                onClick={() => handleSaveApproval('REJECTED')}
                disabled={loading}
                className="flex items-center gap-2 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <X className="w-5 h-5" />
                Reject
              </button>
            </div>
          </div>
        )}

        {/* Approval Status (if already approved) */}
        {approval && approval.status !== 'PENDING' && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Approval Status</h3>
            <div className="space-y-4">
              <div>
                <span className="text-sm font-medium text-gray-700">Status: </span>
                <span className={`px-3 py-1 rounded-md font-medium ${getStatusColor(approval.status)}`}>
                  {approval.status}
                </span>
              </div>
              {approval.signature && (
                <div>
                  <span className="text-sm font-medium text-gray-700 block mb-2">Signature:</span>
                  {approval.signature.startsWith('data:image') ? (
                    <img
                      src={approval.signature}
                      alt="Signature"
                      className="border border-gray-300 rounded max-w-md"
                    />
                  ) : (
                    <div className="px-4 py-2 bg-gray-50 border border-gray-300 rounded-md inline-block">
                      {approval.signature}
                    </div>
                  )}
                </div>
              )}
              {approval.comments && (
                <div>
                  <span className="text-sm font-medium text-gray-700 block mb-2">Comments:</span>
                  <div className="px-4 py-2 bg-gray-50 border border-gray-300 rounded-md">
                    {approval.comments}
                  </div>
                </div>
              )}
              {approval.approvedAt && (
                <div className="text-sm text-gray-600">
                  Approved on: {new Date(approval.approvedAt).toLocaleString()}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ApprovalView;

