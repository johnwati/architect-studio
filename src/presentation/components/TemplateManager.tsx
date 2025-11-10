import { Check, Eye, FileText, Plus } from 'lucide-react';
import React, { useState } from 'react';
import { ProjectEntity } from '../../domain/entities/Project';
import { DOCUMENT_TEMPLATES, DocumentTemplate } from '../../domain/services/templates';
import { PrismaProjectRepository } from '../../infrastructure/repositories/PrismaProjectRepository';

interface TemplateManagerProps {
  onCreateProjectFromTemplate?: (project: ProjectEntity) => void;
}

const TemplateManager: React.FC<TemplateManagerProps> = ({ onCreateProjectFromTemplate }) => {
  const [selectedTemplate, setSelectedTemplate] = useState<DocumentTemplate | null>(null);
  const [expandedSections, setExpandedSections] = useState<{ [key: string]: boolean }>({});
  const [isCreating, setIsCreating] = useState(false);
  const [createdProjectId, setCreatedProjectId] = useState<string | null>(null);
  const repo = new PrismaProjectRepository();

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }));
  };

  const handleCreateProject = async (template: DocumentTemplate) => {
    if (isCreating) return;

    setIsCreating(true);
    try {
      const projectName = `${template.name} - ${new Date().toLocaleDateString()}`;
      const projectDescription = template.description;

      // Create project with template sections
      const project = await repo.createProject({
        name: projectName,
        description: projectDescription,
        selectedSectionIds: template.sections.map(s => s.id),
        customSections: []
      });

      setCreatedProjectId(project.id);
      
      if (onCreateProjectFromTemplate) {
        onCreateProjectFromTemplate(project);
      }

      // Show success message
      setTimeout(() => {
        setCreatedProjectId(null);
        setIsCreating(false);
      }, 3000);
    } catch (error) {
      console.error('Error creating project from template:', error);
      alert('Failed to create project from template. Please try again.');
      setIsCreating(false);
    }
  };

  const viewTemplateDetails = (template: DocumentTemplate) => {
    setSelectedTemplate(template);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-200px)] min-h-[500px] max-h-[calc(100vh-200px)]">
      <div className="bg-white rounded-lg shadow-md border border-gray-200 flex flex-col h-full overflow-hidden">
        {/* Header Section - Fixed */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 flex-shrink-0">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Document Templates</h2>
            <p className="text-gray-600 mt-1">Create new projects from pre-configured document templates</p>
          </div>
        </div>

        {/* Template Grid - Scrollable */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4">
            {DOCUMENT_TEMPLATES.map((template) => (
              <div
                key={template.id}
                className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow flex flex-col"
              >
                <div className="flex items-start justify-between mb-3 flex-shrink-0">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <FileText className="text-red-700" size={20} />
                      <h3 className="text-lg font-semibold text-gray-800">{template.name}</h3>
                      <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded">
                        {template.type}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">{template.description}</p>
                    <p className="text-xs text-gray-500">
                      {template.sections.length} sections configured
                    </p>
                  </div>
                </div>

                <div className="flex space-x-2 mt-auto pt-4">
                  <button
                    onClick={() => handleCreateProject(template)}
                    disabled={isCreating}
                    className="flex-1 flex items-center justify-center space-x-2 bg-red-700 text-white px-4 py-2 rounded-lg hover:bg-red-800 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isCreating && createdProjectId === template.id ? (
                      <>
                        <Check size={16} />
                        <span>Created!</span>
                      </>
                    ) : (
                      <>
                        <Plus size={16} />
                        <span>Create Project</span>
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => viewTemplateDetails(template)}
                    className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-semibold"
                  >
                    <Eye size={16} />
                    <span>View Details</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Template Details Modal */}
      {selectedTemplate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div>
                <h3 className="text-2xl font-bold text-gray-800">{selectedTemplate.name}</h3>
                <p className="text-gray-600 mt-1">{selectedTemplate.description}</p>
              </div>
              <button
                onClick={() => setSelectedTemplate(null)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <span className="text-2xl">&times;</span>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-4">
                  This template includes {selectedTemplate.sections.length} sections with pre-configured subsections.
                  Creating a project from this template will automatically set up all sections.
                </p>
              </div>

              <div className="space-y-3">
                {selectedTemplate.sections.map((section) => (
                  <div key={section.id} className="border border-gray-200 rounded-lg overflow-hidden">
                    <button
                      onClick={() => toggleSection(section.id)}
                      className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors text-left"
                    >
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-800">{section.title}</h4>
                        {section.subsections.length > 0 && (
                          <p className="text-xs text-gray-500 mt-1">
                            {section.subsections.length} subsection{section.subsections.length !== 1 ? 's' : ''}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        {expandedSections[section.id] ? (
                          <span className="text-gray-400">▼</span>
                        ) : (
                          <span className="text-gray-400">▶</span>
                        )}
                      </div>
                    </button>

                    {expandedSections[section.id] && section.subsections.length > 0 && (
                      <div className="border-t border-gray-200 bg-gray-50 p-4">
                        <div className="space-y-2">
                          {section.subsections.map((sub, index) => (
                            <div key={index} className="bg-white p-3 rounded border border-gray-200">
                              <p className="text-sm font-medium text-gray-800">{sub.title}</p>
                              <p className="text-xs text-gray-600 mt-1">{sub.description}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t border-gray-200 p-6 bg-gray-50">
              <div className="flex space-x-3">
                <button
                  onClick={() => handleCreateProject(selectedTemplate)}
                  disabled={isCreating}
                  className="flex-1 flex items-center justify-center space-x-2 bg-red-700 text-white px-6 py-3 rounded-lg hover:bg-red-800 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isCreating && createdProjectId === selectedTemplate.id ? (
                    <>
                      <Check size={18} />
                      <span>Project Created!</span>
                    </>
                  ) : (
                    <>
                      <Plus size={18} />
                      <span>Create Project from Template</span>
                    </>
                  )}
                </button>
                <button
                  onClick={() => setSelectedTemplate(null)}
                  className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-white transition-colors font-semibold"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TemplateManager;

