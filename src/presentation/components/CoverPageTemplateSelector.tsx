import { Check, Plus, Sparkles } from 'lucide-react';
import React from 'react';
import { CoverPageTemplateEntity } from '../../domain/entities/Project';

interface CoverPageTemplateSelectorProps {
  templates: CoverPageTemplateEntity[];
  selectedTemplateId?: string;
  onApply: (template: CoverPageTemplateEntity) => void;
  onManageTemplates?: () => void;
  isLoading?: boolean;
}

const CoverPageTemplateSelector: React.FC<CoverPageTemplateSelectorProps> = ({
  templates,
  selectedTemplateId,
  onApply,
  onManageTemplates,
  isLoading = false,
}) => {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-6">
        <div className="flex items-center space-x-2 text-purple-600">
          <Sparkles className="animate-spin" size={18} />
          <span className="font-medium">Loading cover page templates...</span>
        </div>
      </div>
    );
  }

  if (!templates.length) {
    return (
      <div className="border border-dashed border-purple-300 rounded-lg p-6 text-center bg-purple-50/60">
        <Sparkles size={28} className="mx-auto text-purple-500 mb-3" />
        <h3 className="text-lg font-semibold text-purple-700 mb-1">No cover page templates yet</h3>
        <p className="text-sm text-purple-600 mb-4">
          Create reusable cover page templates to quickly style your project documents.
        </p>
        {onManageTemplates && (
          <button
            onClick={onManageTemplates}
            className="inline-flex items-center space-x-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
          >
            <Plus size={16} />
            <span>Create Template</span>
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-800">Cover Page Templates</h3>
        {onManageTemplates && (
          <button
            onClick={onManageTemplates}
            className="text-sm text-purple-600 hover:text-purple-700 font-medium"
          >
            Manage Templates
          </button>
        )}
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {templates.map((template) => {
          const isSelected = template.id === selectedTemplateId;
          return (
            <div
              key={template.id}
              className={`relative border rounded-lg shadow-sm bg-white flex flex-col h-full transition-all ${
                isSelected ? 'border-purple-500 ring-2 ring-purple-200' : 'border-gray-200 hover:border-purple-300'
              }`}
            >
              {isSelected && (
                <span className="absolute top-2 right-2 inline-flex items-center space-x-1 bg-purple-600 text-white text-xs font-semibold px-2 py-1 rounded-full">
                  <Check size={12} />
                  <span>Selected</span>
                </span>
              )}
              <div className="p-4 flex-1 flex flex-col">
                <h4 className="text-base font-semibold text-gray-800 mb-1 truncate" title={template.name}>
                  {template.name}
                </h4>
                {template.description && (
                  <p className="text-sm text-gray-500 mb-3 line-clamp-2" title={template.description}>
                    {template.description}
                  </p>
                )}
                <div className="border border-gray-200 rounded-md overflow-hidden bg-gray-50 flex-1">
                  <div
                    className="h-40 overflow-hidden text-[10px] leading-tight p-2 bg-white"
                    dangerouslySetInnerHTML={{ __html: template.content }}
                  />
                </div>
              </div>
              <div className="p-4 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
                <span className="text-xs text-gray-500">
                  Updated {template.updatedAt.toLocaleDateString()}
                </span>
                <button
                  onClick={() => onApply(template)}
                  className={`inline-flex items-center space-x-2 px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
                    isSelected
                      ? 'bg-purple-100 text-purple-700 border border-purple-300'
                      : 'bg-purple-600 text-white hover:bg-purple-700'
                  }`}
                >
                  <Sparkles size={14} />
                  <span>{isSelected ? 'Reapply' : 'Apply'}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CoverPageTemplateSelector;





