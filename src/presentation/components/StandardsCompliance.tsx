import { CheckCircle, FileCheck, Plus, Shield, X } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { ProjectEntity } from '../../domain/entities/Project';
import { ArchitectureStandardEntity, ComplianceCheckEntity, GovernanceWorkflowEntity } from '../../domain/entities/Repository';
import { PrismaProjectRepository } from '../../infrastructure/repositories/PrismaProjectRepository';

interface StandardsComplianceProps {
  selectedProject?: ProjectEntity | null;
}

const StandardsCompliance: React.FC<StandardsComplianceProps> = ({ selectedProject }) => {
  const [standards, setStandards] = useState<ArchitectureStandardEntity[]>([]);
  const [complianceChecks, setComplianceChecks] = useState<ComplianceCheckEntity[]>([]);
  const [workflows, setWorkflows] = useState<GovernanceWorkflowEntity[]>([]);
  const [activeTab, setActiveTab] = useState<'standards' | 'compliance' | 'workflows'>('standards');
  const [showCreateStandard, setShowCreateStandard] = useState(false);
  const [showRunCheck, setShowRunCheck] = useState(false);
  const [showCreateWorkflow, setShowCreateWorkflow] = useState(false);
  const [selectedStandard, setSelectedStandard] = useState<ArchitectureStandardEntity | null>(null);
  const [newStandard, setNewStandard] = useState({
    name: '',
    type: 'PRINCIPLE' as const,
    category: '',
    description: '',
    framework: '',
    content: ''
  });
  const [selectedCheckType, setSelectedCheckType] = useState<'TOGAF' | 'SABSA' | 'ZACHMAN' | 'CUSTOM'>('TOGAF');
  const [newWorkflow, setNewWorkflow] = useState({
    name: '',
    type: 'ARCHITECTURE_REVIEW' as const,
    approvers: [] as string[],
    newApprover: ''
  });
  const repo = new PrismaProjectRepository();

  useEffect(() => {
    loadStandards();
    loadComplianceChecks();
    loadWorkflows();
  }, [selectedProject]);

  const loadStandards = async () => {
    try {
      // In a real implementation, this would fetch from the database
      const allStandards: ArchitectureStandardEntity[] = [];
      setStandards(allStandards);
    } catch (error) {
      console.error('Error loading standards:', error);
    }
  };

  const loadComplianceChecks = async () => {
    try {
      // In a real implementation, this would fetch from the database
      const allChecks: ComplianceCheckEntity[] = [];
      setComplianceChecks(allChecks);
    } catch (error) {
      console.error('Error loading compliance checks:', error);
    }
  };

  const loadWorkflows = async () => {
    try {
      // In a real implementation, this would fetch from the database
      const allWorkflows: GovernanceWorkflowEntity[] = [];
      setWorkflows(allWorkflows);
    } catch (error) {
      console.error('Error loading workflows:', error);
    }
  };

  const handleCreateStandard = async () => {
    if (!newStandard.name.trim() || !newStandard.description.trim()) {
      alert('Please provide a name and description');
      return;
    }

    try {
      const standard: ArchitectureStandardEntity = {
        id: `standard-${Date.now()}`,
        name: newStandard.name,
        type: newStandard.type,
        category: newStandard.category || undefined,
        description: newStandard.description,
        content: newStandard.content || {},
        framework: newStandard.framework || undefined,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      setStandards([...standards, standard]);
      setShowCreateStandard(false);
      setNewStandard({
        name: '',
        type: 'PRINCIPLE',
        category: '',
        description: '',
        framework: '',
        content: ''
      });
      alert(`Standard "${standard.name}" created successfully`);
    } catch (error) {
      console.error('Error creating standard:', error);
      alert('Error creating standard. Please try again.');
    }
  };

  const handleRunComplianceCheck = async () => {
    if (!selectedProject) {
      alert('Please select a project first');
      return;
    }

    try {
      const check: ComplianceCheckEntity = {
        id: `check-${Date.now()}`,
        standardId: selectedStandard?.id || '',
        projectId: selectedProject.id,
        checkType: selectedCheckType,
        status: 'PENDING',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Simulate check execution
      setTimeout(() => {
        check.status = 'PASSED';
        check.checkedAt = new Date();
        setComplianceChecks([...complianceChecks, check]);
        setShowRunCheck(false);
        alert(`Compliance check completed: ${check.status}`);
      }, 1000);
    } catch (error) {
      console.error('Error running compliance check:', error);
      alert('Error running compliance check. Please try again.');
    }
  };

  const handleCreateWorkflow = async () => {
    if (!newWorkflow.name.trim() || newWorkflow.approvers.length === 0) {
      alert('Please provide a name and at least one approver');
      return;
    }

    if (!selectedProject) {
      alert('Please select a project first');
      return;
    }

    try {
      const workflow: GovernanceWorkflowEntity = {
        id: `workflow-${Date.now()}`,
        name: newWorkflow.name,
        type: newWorkflow.type,
        projectId: selectedProject.id,
        status: 'DRAFT',
        stages: [],
        approvers: newWorkflow.approvers,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      setWorkflows([...workflows, workflow]);
      setShowCreateWorkflow(false);
      setNewWorkflow({
        name: '',
        type: 'ARCHITECTURE_REVIEW',
        approvers: [],
        newApprover: ''
      });
      alert(`Workflow "${workflow.name}" created successfully`);
    } catch (error) {
      console.error('Error creating workflow:', error);
      alert('Error creating workflow. Please try again.');
    }
  };

  const handleAddApprover = () => {
    if (newWorkflow.newApprover.trim() && !newWorkflow.approvers.includes(newWorkflow.newApprover.trim())) {
      setNewWorkflow({
        ...newWorkflow,
        approvers: [...newWorkflow.approvers, newWorkflow.newApprover.trim()],
        newApprover: ''
      });
    }
  };

  const handleRemoveApprover = (email: string) => {
    setNewWorkflow({
      ...newWorkflow,
      approvers: newWorkflow.approvers.filter(a => a !== email)
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PASSED':
      case 'APPROVED':
        return 'bg-green-100 text-green-700';
      case 'FAILED':
      case 'REJECTED':
        return 'bg-red-100 text-red-700';
      case 'WARNING':
        return 'bg-yellow-100 text-yellow-700';
      case 'PENDING':
      case 'IN_REVIEW':
        return 'bg-blue-100 text-blue-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const tabs = [
    { id: 'standards' as const, label: 'Standards', icon: <Shield size={18} /> },
    { id: 'compliance' as const, label: 'Compliance Checks', icon: <CheckCircle size={18} /> },
    { id: 'workflows' as const, label: 'ARB Workflows', icon: <FileCheck size={18} /> }
  ];

  return (
    <div className="space-y-4">
      {/* Tab Navigation */}
      <div className="bg-white rounded-lg shadow-md border border-gray-200">
        <div className="flex border-b border-gray-200">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center space-x-2 px-4 py-3 font-semibold transition-colors ${
                activeTab === tab.id
                  ? 'bg-gradient-to-r from-purple-50 to-blue-50 text-purple-700 border-b-2 border-purple-700'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {/* Standards Tab */}
          {activeTab === 'standards' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-gray-800">Architecture Standards</h3>
                  <p className="text-sm text-gray-600">Principles, reference models, and reusable patterns</p>
                </div>
                <button
                  onClick={() => setShowCreateStandard(true)}
                  className="flex items-center space-x-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white px-4 py-2 rounded-lg hover:from-purple-700 hover:to-blue-700 transition-colors font-semibold"
                >
                  <Plus size={18} />
                  <span>Add Standard</span>
                </button>
              </div>

              {standards.length === 0 ? (
                <div className="text-center py-12">
                  <Shield size={48} className="mx-auto text-gray-300 mb-4" />
                  <p className="text-gray-600 mb-2">No standards defined yet</p>
                  <p className="text-sm text-gray-500">Create architecture principles, reference models, and patterns</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {standards.map((standard) => (
                    <div
                      key={standard.id}
                      className="border border-gray-200 rounded-lg p-4 hover:shadow-lg transition-shadow cursor-pointer"
                      onClick={() => setSelectedStandard(standard)}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h4 className="font-semibold text-gray-800">{standard.name}</h4>
                          <p className="text-xs text-gray-500">{standard.type} • {standard.framework || 'Custom'}</p>
                        </div>
                        {standard.isActive && (
                          <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                            Active
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 line-clamp-2">{standard.description}</p>
                      {standard.category && (
                        <span className="inline-block mt-2 text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">
                          {standard.category}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Compliance Checks Tab */}
          {activeTab === 'compliance' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-gray-800">Compliance Checks</h3>
                  <p className="text-sm text-gray-600">TOGAF, SABSA, Zachman framework compliance</p>
                </div>
                <button
                  onClick={() => {
                    if (standards.length === 0) {
                      alert('Please create standards first');
                      return;
                    }
                    setShowRunCheck(true);
                  }}
                  className="flex items-center space-x-2 bg-gradient-to-r from-green-600 to-blue-600 text-white px-4 py-2 rounded-lg hover:from-green-700 hover:to-blue-700 transition-colors font-semibold"
                >
                  <CheckCircle size={18} />
                  <span>Run Compliance Check</span>
                </button>
              </div>

              {complianceChecks.length === 0 ? (
                <div className="text-center py-12">
                  <CheckCircle size={48} className="mx-auto text-gray-300 mb-4" />
                  <p className="text-gray-600 mb-2">No compliance checks run yet</p>
                  <p className="text-sm text-gray-500">Run checks against TOGAF, SABSA, or Zachman frameworks</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {complianceChecks.map((check) => (
                    <div
                      key={check.id}
                      className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <span className="font-semibold text-gray-800">{check.checkType}</span>
                            <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(check.status)}`}>
                              {check.status}
                            </span>
                          </div>
                          {check.findings && check.findings.length > 0 && (
                            <p className="text-sm text-gray-600 mt-2">
                              {check.findings.length} finding{check.findings.length > 1 ? 's' : ''}
                            </p>
                          )}
                          <div className="flex items-center space-x-4 text-xs text-gray-500 mt-2">
                            {check.checkedAt && (
                              <span>Checked: {new Date(check.checkedAt).toLocaleString()}</span>
                            )}
                            {check.checkedBy && <span>By: {check.checkedBy}</span>}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Workflows Tab */}
          {activeTab === 'workflows' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-gray-800">Architecture Review Board Workflows</h3>
                  <p className="text-sm text-gray-600">Governance workflows for ARB approvals</p>
                </div>
                <button
                  onClick={() => setShowCreateWorkflow(true)}
                  className="flex items-center space-x-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white px-4 py-2 rounded-lg hover:from-purple-700 hover:to-blue-700 transition-colors font-semibold"
                >
                  <Plus size={18} />
                  <span>Create Workflow</span>
                </button>
              </div>

              {workflows.length === 0 ? (
                <div className="text-center py-12">
                  <FileCheck size={48} className="mx-auto text-gray-300 mb-4" />
                  <p className="text-gray-600 mb-2">No workflows created yet</p>
                  <p className="text-sm text-gray-500">Create governance workflows for architecture review board approvals</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {workflows.map((workflow) => (
                    <div
                      key={workflow.id}
                      className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <span className="font-semibold text-gray-800">{workflow.name}</span>
                            <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(workflow.status)}`}>
                              {workflow.status}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mb-2">{workflow.type.replace('_', ' ')}</p>
                          <div className="flex items-center space-x-4 text-xs text-gray-500">
                            <span>{workflow.approvers.length} approver{workflow.approvers.length > 1 ? 's' : ''}</span>
                            {workflow.currentStage && <span>Stage: {workflow.currentStage}</span>}
                            <span>Created: {new Date(workflow.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Create Standard Modal */}
      {showCreateStandard && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-800">Create Architecture Standard</h2>
              <button
                onClick={() => setShowCreateStandard(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Name *
                </label>
                <input
                  type="text"
                  value={newStandard.name}
                  onChange={(e) => setNewStandard({ ...newStandard, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  placeholder="e.g., Security First Principle"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Type *
                  </label>
                  <select
                    value={newStandard.type}
                    onChange={(e) => setNewStandard({ ...newStandard, type: e.target.value as any })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  >
                    <option value="PRINCIPLE">Principle</option>
                    <option value="REFERENCE_MODEL">Reference Model</option>
                    <option value="PATTERN">Pattern</option>
                    <option value="COMPLIANCE_RULE">Compliance Rule</option>
                    <option value="BEST_PRACTICE">Best Practice</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Framework
                  </label>
                  <select
                    value={newStandard.framework}
                    onChange={(e) => setNewStandard({ ...newStandard, framework: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  >
                    <option value="">Select Framework</option>
                    <option value="TOGAF">TOGAF</option>
                    <option value="SABSA">SABSA</option>
                    <option value="Zachman">Zachman</option>
                    <option value="Custom">Custom</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Category
                </label>
                <input
                  type="text"
                  value={newStandard.category}
                  onChange={(e) => setNewStandard({ ...newStandard, category: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  placeholder="e.g., Security, Performance, Integration"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Description *
                </label>
                <textarea
                  value={newStandard.description}
                  onChange={(e) => setNewStandard({ ...newStandard, description: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  rows={4}
                  placeholder="Describe the standard..."
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  onClick={() => setShowCreateStandard(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 font-semibold"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateStandard}
                  disabled={!newStandard.name.trim() || !newStandard.description.trim()}
                  className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
                >
                  Create Standard
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Run Compliance Check Modal */}
      {showRunCheck && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-800">Run Compliance Check</h2>
              <button
                onClick={() => setShowRunCheck(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Standard
                </label>
                <select
                  value={selectedStandard?.id || ''}
                  onChange={(e) => {
                    const standard = standards.find(s => s.id === e.target.value);
                    setSelectedStandard(standard || null);
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                >
                  <option value="">Select a standard</option>
                  {standards.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Check Type *
                </label>
                <select
                  value={selectedCheckType}
                  onChange={(e) => setSelectedCheckType(e.target.value as any)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                >
                  <option value="TOGAF">TOGAF</option>
                  <option value="SABSA">SABSA</option>
                  <option value="ZACHMAN">Zachman</option>
                  <option value="CUSTOM">Custom</option>
                </select>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  onClick={() => setShowRunCheck(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 font-semibold"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRunComplianceCheck}
                  disabled={!selectedStandard}
                  className="px-4 py-2 bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-lg hover:from-green-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
                >
                  Run Check
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Workflow Modal */}
      {showCreateWorkflow && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-800">Create ARB Workflow</h2>
              <button
                onClick={() => setShowCreateWorkflow(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Workflow Name *
                </label>
                <input
                  type="text"
                  value={newWorkflow.name}
                  onChange={(e) => setNewWorkflow({ ...newWorkflow, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  placeholder="e.g., Architecture Review for Payment System"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Workflow Type *
                </label>
                <select
                  value={newWorkflow.type}
                  onChange={(e) => setNewWorkflow({ ...newWorkflow, type: e.target.value as any })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                >
                  <option value="ARCHITECTURE_REVIEW">Architecture Review</option>
                  <option value="STANDARD_APPROVAL">Standard Approval</option>
                  <option value="COMPONENT_REUSE">Component Reuse</option>
                  <option value="PATTERN_APPROVAL">Pattern Approval</option>
                  <option value="COMPLIANCE_REVIEW">Compliance Review</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Approvers *
                </label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="email"
                    value={newWorkflow.newApprover}
                    onChange={(e) => setNewWorkflow({ ...newWorkflow, newApprover: e.target.value })}
                    onKeyPress={(e) => e.key === 'Enter' && handleAddApprover()}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    placeholder="Enter approver email and press Enter"
                  />
                  <button
                    onClick={handleAddApprover}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                  >
                    Add
                  </button>
                </div>
                <div className="space-y-2">
                  {newWorkflow.approvers.map((email) => (
                    <div key={email} className="flex items-center justify-between bg-gray-50 p-2 rounded-lg">
                      <span className="text-sm text-gray-700">{email}</span>
                      <button
                        onClick={() => handleRemoveApprover(email)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  onClick={() => setShowCreateWorkflow(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 font-semibold"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateWorkflow}
                  disabled={!newWorkflow.name.trim() || newWorkflow.approvers.length === 0}
                  className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
                >
                  Create Workflow
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StandardsCompliance;

