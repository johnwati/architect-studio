import { ArrowDown, ArrowUp, ChevronDown, ChevronRight, Edit2, GripVertical, Plus, Save, Trash2, X } from 'lucide-react';
import React, { useState } from 'react';
import { CustomSectionEntity, ProjectEntity } from '../../domain/entities/Project';
import { SECTIONS } from '../../domain/services/sections';
import { PrismaProjectRepository } from '../../infrastructure/repositories/PrismaProjectRepository';

interface SectionManagerProps {
  project: ProjectEntity;
  onProjectUpdate: (project: ProjectEntity) => void;
  onClose: () => void;
}

const SectionManager: React.FC<SectionManagerProps> = ({
  project,
  onProjectUpdate,
  onClose,
}) => {
  const repo = new PrismaProjectRepository();
  
  const [selectedSectionIds, setSelectedSectionIds] = useState<string[]>(
    project.selectedSectionIds || SECTIONS.map(s => s.id) // Default: all sections selected
  );
  const [customSections, setCustomSections] = useState<CustomSectionEntity[]>(
    project.customSections || []
  );
  const [customSectionSubsections, setCustomSectionSubsections] = useState<{ [sectionId: string]: Array<{ number: string; title: string; description: string }> }>(
    project.customSectionSubsections || {}
  );
  const [expandedSections, setExpandedSections] = useState<{ [key: string]: boolean }>({});
  const [editingCustomSection, setEditingCustomSection] = useState<string | null>(null);
  const [showAddCustomSection, setShowAddCustomSection] = useState(false);
  const [editingSubsection, setEditingSubsection] = useState<{ sectionId: string; index: number } | null>(null);
  const [addingSubsection, setAddingSubsection] = useState<string | null>(null);
  const [newSubsection, setNewSubsection] = useState({ title: '', description: '' });
  
  // New custom section form state
  const [newSectionTitle, setNewSectionTitle] = useState('');
  const [newSectionSubsections, setNewSectionSubsections] = useState<Array<{
    number: string;
    title: string;
    description: string;
  }>>([{ number: '1', title: '', description: '' }]);

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => ({ ...prev, [sectionId]: !prev[sectionId] }));
  };

  const toggleSectionSelection = (sectionId: string) => {
    setSelectedSectionIds(prev => {
      if (prev.includes(sectionId)) {
        return prev.filter(id => id !== sectionId);
      } else {
        return [...prev, sectionId];
      }
    });
  };

  const handleSave = async () => {
    try {
      const updatedProject = await repo.updateProject(project.id, {
        selectedSectionIds,
        customSections: customSections.map((cs, index) => ({
          ...cs,
          order: index,
        })),
        customSectionSubsections,
      });
      onProjectUpdate(updatedProject);
      alert('Section configuration saved successfully!');
      onClose();
    } catch (error) {
      console.error('Error saving section configuration:', error);
      alert('Error saving section configuration. Please try again.');
    }
  };

  // Get merged subsections (predefined + custom) for a section
  const getMergedSubsections = (sectionId: string) => {
    const section = SECTIONS.find(s => s.id === sectionId);
    const predefined = section?.subsections || [];
    const custom = customSectionSubsections[sectionId] || [];
    return [...predefined, ...custom];
  };

  // Add custom subsection to a default section
  const handleAddSubsection = (sectionId: string) => {
    if (!newSubsection.title.trim() || !newSubsection.description.trim()) {
      alert('Please fill in both title and description');
      return;
    }

    const existing = customSectionSubsections[sectionId] || [];
    const section = SECTIONS.find(s => s.id === sectionId);
    const predefinedCount = section?.subsections.length || 0;
    const customCount = existing.length;
    const subsectionNumber = `${predefinedCount + customCount + 1}`;

    setCustomSectionSubsections(prev => ({
      ...prev,
      [sectionId]: [...existing, { number: subsectionNumber, title: newSubsection.title.trim(), description: newSubsection.description.trim() }]
    }));

    setNewSubsection({ title: '', description: '' });
    setAddingSubsection(null);
  };

  // Edit custom subsection
  const handleEditSubsection = (sectionId: string, index: number) => {
    const custom = customSectionSubsections[sectionId] || [];
    const subsection = custom[index];
    if (subsection) {
      setNewSubsection({ title: subsection.title, description: subsection.description });
      setEditingSubsection({ sectionId, index });
      setAddingSubsection(null);
    }
  };

  // Save edited subsection
  const handleSaveSubsection = () => {
    if (!editingSubsection) return;
    if (!newSubsection.title.trim() || !newSubsection.description.trim()) {
      alert('Please fill in both title and description');
      return;
    }

    const { sectionId, index } = editingSubsection;
    const existing = customSectionSubsections[sectionId] || [];
    const updated = [...existing];
    updated[index] = { ...updated[index], title: newSubsection.title.trim(), description: newSubsection.description.trim() };

    setCustomSectionSubsections(prev => ({
      ...prev,
      [sectionId]: updated
    }));

    setNewSubsection({ title: '', description: '' });
    setEditingSubsection(null);
  };

  // Delete custom subsection
  const handleDeleteSubsection = (sectionId: string, index: number) => {
    if (!confirm('Are you sure you want to delete this custom subsection?')) {
      return;
    }

    const existing = customSectionSubsections[sectionId] || [];
    const updated = existing.filter((_, i) => i !== index);
    
    if (updated.length === 0) {
      const { [sectionId]: _, ...rest } = customSectionSubsections;
      setCustomSectionSubsections(rest);
    } else {
      setCustomSectionSubsections(prev => ({
        ...prev,
        [sectionId]: updated
      }));
    }
  };

  // Cancel adding/editing subsection
  const handleCancelSubsection = () => {
    setNewSubsection({ title: '', description: '' });
    setAddingSubsection(null);
    setEditingSubsection(null);
  };

  const addNewSubsection = () => {
    setNewSectionSubsections(prev => [
      ...prev,
      { number: `${prev.length + 1}`, title: '', description: '' }
    ]);
  };

  const removeSubsection = (index: number) => {
    setNewSectionSubsections(prev => prev.filter((_, i) => i !== index));
  };

  const updateSubsection = (index: number, field: 'title' | 'description', value: string) => {
    setNewSectionSubsections(prev =>
      prev.map((sub, i) => (i === index ? { ...sub, [field]: value } : sub))
    );
  };

  const saveCustomSection = () => {
    if (!newSectionTitle.trim()) {
      alert('Please enter a section title');
      return;
    }

    const hasEmptySubsections = newSectionSubsections.some(
      sub => !sub.title.trim() || !sub.description.trim()
    );

    if (hasEmptySubsections) {
      alert('Please fill in all subsection fields');
      return;
    }

    const newCustomSection: CustomSectionEntity = {
      id: crypto.randomUUID(),
      title: newSectionTitle.trim(),
      subsections: newSectionSubsections.map((sub, index) => ({
        number: `${index + 1}`,
        title: sub.title.trim(),
        description: sub.description.trim(),
      })),
      order: customSections.length,
    };

    setCustomSections(prev => [...prev, newCustomSection]);
    setNewSectionTitle('');
    setNewSectionSubsections([{ number: '1', title: '', description: '' }]);
    setShowAddCustomSection(false);
  };

  const deleteCustomSection = (sectionId: string) => {
    if (confirm('Are you sure you want to delete this custom section?')) {
      setCustomSections(prev => prev.filter(s => s.id !== sectionId));
    }
  };

  const editCustomSection = (section: CustomSectionEntity) => {
    setEditingCustomSection(section.id);
    setNewSectionTitle(section.title);
    setNewSectionSubsections(section.subsections);
    setShowAddCustomSection(true);
  };

  const updateCustomSection = () => {
    if (!editingCustomSection) return;
    
    if (!newSectionTitle.trim()) {
      alert('Please enter a section title');
      return;
    }

    const updatedSection: CustomSectionEntity = {
      id: editingCustomSection,
      title: newSectionTitle.trim(),
      subsections: newSectionSubsections.map((sub, index) => ({
        number: `${index + 1}`,
        title: sub.title.trim(),
        description: sub.description.trim(),
      })),
      order: customSections.findIndex(s => s.id === editingCustomSection),
    };

    setCustomSections(prev =>
      prev.map(s => (s.id === editingCustomSection ? updatedSection : s))
    );
    setEditingCustomSection(null);
    setNewSectionTitle('');
    setNewSectionSubsections([{ number: '1', title: '', description: '' }]);
    setShowAddCustomSection(false);
  };

  const cancelEdit = () => {
    setEditingCustomSection(null);
    setShowAddCustomSection(false);
    setNewSectionTitle('');
    setNewSectionSubsections([{ number: '1', title: '', description: '' }]);
  };

  // Reorder functions for standard sections
  const moveStandardSectionUp = (sectionId: string) => {
    const currentIndex = selectedSectionIds.indexOf(sectionId);
    if (currentIndex > 0) {
      const newIds = [...selectedSectionIds];
      [newIds[currentIndex - 1], newIds[currentIndex]] = [newIds[currentIndex], newIds[currentIndex - 1]];
      setSelectedSectionIds(newIds);
    }
  };

  const moveStandardSectionDown = (sectionId: string) => {
    const currentIndex = selectedSectionIds.indexOf(sectionId);
    if (currentIndex >= 0 && currentIndex < selectedSectionIds.length - 1) {
      const newIds = [...selectedSectionIds];
      [newIds[currentIndex], newIds[currentIndex + 1]] = [newIds[currentIndex + 1], newIds[currentIndex]];
      setSelectedSectionIds(newIds);
    }
  };

  // Reorder functions for custom sections
  const moveCustomSectionUp = (sectionId: string) => {
    const currentIndex = customSections.findIndex(s => s.id === sectionId);
    if (currentIndex > 0) {
      const newSections = [...customSections];
      [newSections[currentIndex - 1], newSections[currentIndex]] = [newSections[currentIndex], newSections[currentIndex - 1]];
      setCustomSections(newSections);
    }
  };

  const moveCustomSectionDown = (sectionId: string) => {
    const currentIndex = customSections.findIndex(s => s.id === sectionId);
    if (currentIndex >= 0 && currentIndex < customSections.length - 1) {
      const newSections = [...customSections];
      [newSections[currentIndex], newSections[currentIndex + 1]] = [newSections[currentIndex + 1], newSections[currentIndex]];
      setCustomSections(newSections);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-6 rounded-t-lg">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Manage Sections</h2>
            <button
              onClick={onClose}
              className="text-white hover:text-purple-200 transition-colors"
            >
              <X size={24} />
            </button>
          </div>
          <p className="text-purple-100 mt-1">Select sections and add custom sections for {project.name}</p>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Standard Sections */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold text-gray-800">Standard Sections</h3>
              <p className="text-sm text-gray-500">{selectedSectionIds.length} selected</p>
            </div>
            
            {/* Selected Sections (in order) */}
            {selectedSectionIds.length > 0 && (
              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Selected Sections (in order)</h4>
                <div className="space-y-2">
                  {selectedSectionIds.map((sectionId, index) => {
                    const section = SECTIONS.find(s => s.id === sectionId);
                    if (!section) return null;
                    
                    return (
                      <div
                        key={section.id}
                        className="bg-green-50 rounded-lg border border-green-200 overflow-hidden"
                      >
                        <div className="flex items-center p-3 hover:bg-green-100 transition-colors">
                          <GripVertical size={20} className="text-gray-400 mr-2 cursor-move" />
                          <button
                            onClick={() => toggleSection(section.id)}
                            className="flex items-center space-x-2 flex-1 text-left"
                          >
                            {expandedSections[section.id] ? (
                              <ChevronDown size={20} className="text-gray-600" />
                            ) : (
                              <ChevronRight size={20} className="text-gray-600" />
                            )}
                            <span className="font-medium text-gray-800">
                              {index + 1}. {section.title}
                            </span>
                          </button>
                          <div className="flex items-center space-x-1">
                            <button
                              onClick={() => moveStandardSectionUp(section.id)}
                              disabled={index === 0}
                              className={`p-1.5 rounded transition-colors ${
                                index === 0
                                  ? 'text-gray-300 cursor-not-allowed'
                                  : 'text-gray-600 hover:bg-green-200'
                              }`}
                              title="Move up"
                            >
                              <ArrowUp size={16} />
                            </button>
                            <button
                              onClick={() => moveStandardSectionDown(section.id)}
                              disabled={index === selectedSectionIds.length - 1}
                              className={`p-1.5 rounded transition-colors ${
                                index === selectedSectionIds.length - 1
                                  ? 'text-gray-300 cursor-not-allowed'
                                  : 'text-gray-600 hover:bg-green-200'
                              }`}
                              title="Move down"
                            >
                              <ArrowDown size={16} />
                            </button>
                            <button
                              onClick={() => toggleSectionSelection(section.id)}
                              className="ml-2 p-2 rounded transition-colors bg-green-100 text-green-700 hover:bg-green-200"
                              title="Deselect"
                            >
                              <X size={16} />
                            </button>
                          </div>
                        </div>
                        
                        {expandedSections[section.id] && (
                          <div className="border-t border-green-200 bg-white p-4">
                            <div className="space-y-2">
                              {getMergedSubsections(section.id).map((sub, index) => {
                                const sectionSubsections = getMergedSubsections(section.id);
                                const predefinedCount = section.subsections.length;
                                const isCustom = index >= predefinedCount;
                                
                                return (
                                  <div key={`${sub.number}-${index}`} className={`p-3 rounded border ${isCustom ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-200'}`}>
                                    <div className="flex items-start justify-between">
                                      <div className="flex-1">
                                        <p className="text-sm font-semibold text-gray-800">
                                          {sub.number || `${index + 1}`} {sub.title}
                                          {isCustom && (
                                            <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">Custom</span>
                                          )}
                                        </p>
                                        <p className="text-xs text-gray-600 mt-1">{sub.description}</p>
                                      </div>
                                      {isCustom && (
                                        <div className="flex items-center space-x-1 ml-2">
                                          <button
                                            onClick={() => handleEditSubsection(section.id, index - predefinedCount)}
                                            className="p-1 text-blue-700 hover:bg-blue-100 rounded transition-colors"
                                            title="Edit subsection"
                                          >
                                            <Edit2 size={14} />
                                          </button>
                                          <button
                                            onClick={() => handleDeleteSubsection(section.id, index - predefinedCount)}
                                            className="p-1 text-red-700 hover:bg-red-100 rounded transition-colors"
                                            title="Delete subsection"
                                          >
                                            <Trash2 size={14} />
                                          </button>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                            <div className="mt-3 pt-3 border-t border-gray-200">
                              {addingSubsection === section.id || editingSubsection?.sectionId === section.id ? (
                                <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
                                  <div className="space-y-2">
                                    <input
                                      type="text"
                                      value={newSubsection.title}
                                      onChange={(e) => setNewSubsection(prev => ({ ...prev, title: e.target.value }))}
                                      placeholder="Subsection title"
                                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                                    />
                                    <textarea
                                      value={newSubsection.description}
                                      onChange={(e) => setNewSubsection(prev => ({ ...prev, description: e.target.value }))}
                                      placeholder="Subsection description"
                                      rows={2}
                                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                                    />
                                    <div className="flex space-x-2">
                                      <button
                                        onClick={editingSubsection ? handleSaveSubsection : () => handleAddSubsection(section.id)}
                                        className="flex items-center space-x-2 bg-green-600 text-white px-3 py-1.5 rounded-lg hover:bg-green-700 transition-colors text-sm font-semibold"
                                      >
                                        <Save size={14} />
                                        <span>{editingSubsection ? 'Update' : 'Add'} Subsection</span>
                                      </button>
                                      <button
                                        onClick={handleCancelSubsection}
                                        className="flex items-center space-x-2 px-3 py-1.5 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors text-sm font-semibold"
                                      >
                                        <X size={14} />
                                        <span>Cancel</span>
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              ) : (
                                <button
                                  onClick={() => {
                                    setAddingSubsection(section.id);
                                    setEditingSubsection(null);
                                    setNewSubsection({ title: '', description: '' });
                                  }}
                                  className="flex items-center space-x-2 text-sm text-purple-700 hover:text-purple-800 font-semibold"
                                >
                                  <Plus size={16} />
                                  <span>Add Custom Subsection</span>
                                </button>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            
            {/* Available Sections (not selected) */}
            {SECTIONS.filter(s => !selectedSectionIds.includes(s.id)).length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Available Sections</h4>
                <div className="space-y-2">
                  {SECTIONS.filter(s => !selectedSectionIds.includes(s.id)).map((section) => (
                    <div
                      key={section.id}
                      className="bg-gray-50 rounded-lg border border-gray-200 overflow-hidden"
                    >
                      <div className="flex items-center p-3 hover:bg-gray-100 transition-colors">
                        <button
                          onClick={() => toggleSection(section.id)}
                          className="flex items-center space-x-2 flex-1 text-left"
                        >
                          {expandedSections[section.id] ? (
                            <ChevronDown size={20} className="text-gray-600" />
                          ) : (
                            <ChevronRight size={20} className="text-gray-600" />
                          )}
                          <span className="font-medium text-gray-800">{section.title}</span>
                        </button>
                        <button
                          onClick={() => toggleSectionSelection(section.id)}
                          className="ml-2 p-2 rounded transition-colors bg-gray-200 text-gray-600 hover:bg-gray-300"
                          title="Select"
                        >
                          <Plus size={18} />
                        </button>
                      </div>
                      
                      {expandedSections[section.id] && (
                        <div className="border-t border-gray-200 bg-white p-4">
                          <div className="space-y-2">
                            {getMergedSubsections(section.id).map((sub, index) => {
                              const sectionSubsections = getMergedSubsections(section.id);
                              const predefinedCount = section.subsections.length;
                              const isCustom = index >= predefinedCount;
                              
                              return (
                                <div key={`${sub.number}-${index}`} className={`p-3 rounded border ${isCustom ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-200'}`}>
                                  <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                      <p className="text-sm font-semibold text-gray-800">
                                        {sub.number || `${index + 1}`} {sub.title}
                                        {isCustom && (
                                          <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">Custom</span>
                                        )}
                                      </p>
                                      <p className="text-xs text-gray-600 mt-1">{sub.description}</p>
                                    </div>
                                    {isCustom && (
                                      <div className="flex items-center space-x-1 ml-2">
                                        <button
                                          onClick={() => handleEditSubsection(section.id, index - predefinedCount)}
                                          className="p-1 text-blue-700 hover:bg-blue-100 rounded transition-colors"
                                          title="Edit subsection"
                                        >
                                          <Edit2 size={14} />
                                        </button>
                                        <button
                                          onClick={() => handleDeleteSubsection(section.id, index - predefinedCount)}
                                          className="p-1 text-red-700 hover:bg-red-100 rounded transition-colors"
                                          title="Delete subsection"
                                        >
                                          <Trash2 size={14} />
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                          <div className="mt-3 pt-3 border-t border-gray-200">
                            {addingSubsection === section.id || editingSubsection?.sectionId === section.id ? (
                              <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
                                <div className="space-y-2">
                                  <input
                                    type="text"
                                    value={newSubsection.title}
                                    onChange={(e) => setNewSubsection(prev => ({ ...prev, title: e.target.value }))}
                                    placeholder="Subsection title"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                                  />
                                  <textarea
                                    value={newSubsection.description}
                                    onChange={(e) => setNewSubsection(prev => ({ ...prev, description: e.target.value }))}
                                    placeholder="Subsection description"
                                    rows={2}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                                  />
                                  <div className="flex space-x-2">
                                    <button
                                      onClick={editingSubsection ? handleSaveSubsection : () => handleAddSubsection(section.id)}
                                      className="flex items-center space-x-2 bg-green-600 text-white px-3 py-1.5 rounded-lg hover:bg-green-700 transition-colors text-sm font-semibold"
                                    >
                                      <Save size={14} />
                                      <span>{editingSubsection ? 'Update' : 'Add'} Subsection</span>
                                    </button>
                                    <button
                                      onClick={handleCancelSubsection}
                                      className="flex items-center space-x-2 px-3 py-1.5 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors text-sm font-semibold"
                                    >
                                      <X size={14} />
                                      <span>Cancel</span>
                                    </button>
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <button
                                onClick={() => {
                                  setAddingSubsection(section.id);
                                  setEditingSubsection(null);
                                  setNewSubsection({ title: '', description: '' });
                                }}
                                className="flex items-center space-x-2 text-sm text-purple-700 hover:text-purple-800 font-semibold"
                              >
                                <Plus size={16} />
                                <span>Add Custom Subsection</span>
                              </button>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Custom Sections */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold text-gray-800">Custom Sections</h3>
              <button
                onClick={() => setShowAddCustomSection(true)}
                className="flex items-center space-x-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white px-4 py-2 rounded-lg hover:from-purple-700 hover:to-blue-700 transition-colors font-semibold"
              >
                <Plus size={18} />
                <span>Add Custom Section</span>
              </button>
            </div>

            {customSections.length > 0 ? (
              <div className="space-y-2">
                {customSections.map((customSection, index) => (
                  <div
                    key={customSection.id}
                    className="bg-blue-50 rounded-lg border border-blue-200 p-4"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2 flex-1">
                        <GripVertical size={20} className="text-gray-400 cursor-move" />
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-800">
                            {index + 1}. {customSection.title}
                          </h4>
                          <p className="text-xs text-gray-600 mt-1">
                            {customSection.subsections.length} subsection{customSection.subsections.length !== 1 ? 's' : ''}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-1">
                        <button
                          onClick={() => moveCustomSectionUp(customSection.id)}
                          disabled={index === 0}
                          className={`p-1.5 rounded transition-colors ${
                            index === 0
                              ? 'text-gray-300 cursor-not-allowed'
                              : 'text-gray-600 hover:bg-blue-200'
                          }`}
                          title="Move up"
                        >
                          <ArrowUp size={16} />
                        </button>
                        <button
                          onClick={() => moveCustomSectionDown(customSection.id)}
                          disabled={index === customSections.length - 1}
                          className={`p-1.5 rounded transition-colors ${
                            index === customSections.length - 1
                              ? 'text-gray-300 cursor-not-allowed'
                              : 'text-gray-600 hover:bg-blue-200'
                          }`}
                          title="Move down"
                        >
                          <ArrowDown size={16} />
                        </button>
                        <button
                          onClick={() => editCustomSection(customSection)}
                          className="p-2 text-blue-700 hover:bg-blue-100 rounded transition-colors ml-1"
                          title="Edit section"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button
                          onClick={() => deleteCustomSection(customSection.id)}
                          className="p-2 text-purple-700 hover:bg-purple-100 rounded transition-colors"
                          title="Delete section"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                    {expandedSections[`custom-${customSection.id}`] && (
                      <div className="mt-3 space-y-2">
                        {customSection.subsections.map((sub) => (
                          <div key={sub.number} className="bg-white p-3 rounded border border-gray-200">
                            <p className="text-sm font-semibold text-gray-800">
                              {sub.number} {sub.title}
                            </p>
                            <p className="text-xs text-gray-600 mt-1">{sub.description}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">No custom sections added yet.</p>
            )}
          </div>

          {/* Add/Edit Custom Section Form */}
          {showAddCustomSection && (
            <div className="bg-yellow-50 rounded-lg border border-yellow-200 p-6 mb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                {editingCustomSection ? 'Edit Custom Section' : 'Add Custom Section'}
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Section Title
                  </label>
                  <input
                    type="text"
                    value={newSectionTitle}
                    onChange={(e) => setNewSectionTitle(e.target.value)}
                    placeholder="e.g., Implementation Plan"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Subsections
                    </label>
                    <button
                      onClick={addNewSubsection}
                      className="text-sm text-purple-700 hover:text-purple-800 font-semibold"
                    >
                      + Add Subsection
                    </button>
                  </div>
                  <div className="space-y-3">
                    {newSectionSubsections.map((sub, index) => (
                      <div key={index} className="bg-white p-4 rounded-lg border border-gray-200">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-700">
                            Subsection {index + 1}
                          </span>
                          {newSectionSubsections.length > 1 && (
                            <button
                              onClick={() => removeSubsection(index)}
                              className="text-purple-700 hover:text-purple-800"
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                        </div>
                        <input
                          type="text"
                          value={sub.title}
                          onChange={(e) => updateSubsection(index, 'title', e.target.value)}
                          placeholder="Subsection title"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-2 focus:ring-2 focus:ring-red-500 focus:border-red-500"
                        />
                        <textarea
                          value={sub.description}
                          onChange={(e) => updateSubsection(index, 'description', e.target.value)}
                          placeholder="Subsection description"
                          rows={2}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex space-x-2">
                  <button
                    onClick={editingCustomSection ? updateCustomSection : saveCustomSection}
                    className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors font-semibold"
                  >
                    <Save size={18} />
                    <span>{editingCustomSection ? 'Update' : 'Save'} Section</span>
                  </button>
                  <button
                    onClick={cancelEdit}
                    className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors font-semibold"
                  >
                    <X size={18} />
                    <span>Cancel</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 bg-gray-50 p-4 flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors font-semibold"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-6 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-colors font-semibold"
          >
            Save Configuration
          </button>
        </div>
      </div>
    </div>
  );
};

export default SectionManager;

