import { Check, Mail, Plus, Trash2, User, X } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { ApproverEntity, ProjectEntity } from '../../domain/entities/Project';
import { CreateApproverInput, IProjectRepository } from '../../domain/ports/IProjectRepository';

interface ApproverManagerProps {
  project: ProjectEntity;
  repository: IProjectRepository;
  onApproversChange?: () => void;
}

const ApproverManager: React.FC<ApproverManagerProps> = ({ project, repository, onApproversChange }) => {
  const [approvers, setApprovers] = useState<ApproverEntity[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    name: '',
    role: '',
  });

  useEffect(() => {
    loadApprovers();
  }, [project.id]);

  const loadApprovers = async () => {
    try {
      setLoading(true);
      const approversList = await repository.getApproversByProject(project.id);
      setApprovers(approversList);
    } catch (error) {
      console.error('Error loading approvers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddApprover = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.email || !formData.name) {
      alert('Please provide email and name');
      return;
    }

    try {
      const input: CreateApproverInput = {
        projectId: project.id,
        email: formData.email.trim(),
        name: formData.name.trim(),
        role: formData.role.trim() || undefined,
      };
      
      await repository.addApprover(input);
      setFormData({ email: '', name: '', role: '' });
      setShowAddForm(false);
      await loadApprovers();
      onApproversChange?.();
    } catch (error: any) {
      console.error('Error adding approver:', error);
      alert(error.message || 'Failed to add approver. Email might already be added.');
    }
  };

  const handleDeleteApprover = async (id: string) => {
    if (!confirm('Are you sure you want to remove this approver?')) {
      return;
    }

    try {
      await repository.deleteApprover(id);
      await loadApprovers();
      onApproversChange?.();
    } catch (error) {
      console.error('Error deleting approver:', error);
      alert('Failed to delete approver');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
          <User className="w-5 h-5" />
          Approvers ({approvers.length})
        </h3>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Approver
        </button>
      </div>

      {showAddForm && (
        <form onSubmit={handleAddApprover} className="bg-gray-50 p-4 rounded-lg border border-gray-200">
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="approver@example.com"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="John Doe"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Role (Optional)
              </label>
              <input
                type="text"
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Technical Lead, Business Owner, etc."
              />
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
              >
                <Check className="w-4 h-4" />
                Add
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowAddForm(false);
                  setFormData({ email: '', name: '', role: '' });
                }}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors flex items-center justify-center gap-2"
              >
                <X className="w-4 h-4" />
                Cancel
              </button>
            </div>
          </div>
        </form>
      )}

      {loading ? (
        <div className="text-center py-8 text-gray-500">Loading approvers...</div>
      ) : approvers.length === 0 ? (
        <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg border border-gray-200">
          <User className="w-12 h-12 mx-auto mb-2 text-gray-400" />
          <p>No approvers added yet</p>
          <p className="text-sm">Add approvers who will review and approve this document</p>
        </div>
      ) : (
        <div className="space-y-2">
          {approvers.map((approver) => (
            <div
              key={approver.id}
              className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg hover:shadow-sm transition-shadow"
            >
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <User className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">{approver.name}</div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Mail className="w-3 h-3" />
                      {approver.email}
                    </div>
                    {approver.role && (
                      <div className="text-xs text-gray-500 mt-1">{approver.role}</div>
                    )}
                  </div>
                </div>
              </div>
              <button
                onClick={() => handleDeleteApprover(approver.id)}
                className="p-2 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                title="Remove approver"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ApproverManager;

