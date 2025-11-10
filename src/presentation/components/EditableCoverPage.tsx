import { Edit2, Save, X } from 'lucide-react';
import React, { useState } from 'react';
import { CoverPageSettings } from '../../domain/entities/Project';
import TinyMCEEditor from './TinyMCEEditor';

interface EditableCoverPageProps {
  projectName: string;
  projectDescription: string;
  coverPageSettings?: CoverPageSettings;
  coverPageContent?: string;
  onSave: (settings: CoverPageSettings, content?: string) => Promise<void>;
  isEditable?: boolean;
  onImageUpload?: (file: File) => Promise<string>;
}

const EditableCoverPage: React.FC<EditableCoverPageProps> = ({
  projectName,
  projectDescription,
  coverPageSettings = {},
  coverPageContent,
  onSave,
  isEditable = true,
  onImageUpload,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState('');

  // Default static content for cover page
  const getDefaultCoverPageContent = () => {
    return `
      <div style="background-color: #000000; min-height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 60px 40px; color: #ffffff;">
        <div style="text-align: center; max-width: 800px; width: 100%;">
          <h1 style="color: #8B1A1A; font-size: 48px; font-weight: bold; margin-bottom: 40px; font-family: Arial, sans-serif;">
            Solution Architecture Design Document
          </h1>
          <div style="text-align: left; margin-top: 60px;">
            <p style="color: #666666; font-size: 18px; font-weight: 600; margin: 0; font-family: Arial, sans-serif;">
              CONFIDENTIALITY DISCLAIMER
            </p>
          </div>
        </div>
      </div>
    `;
  };

  const handleSave = async () => {
    try {
      // Get HTML content directly from editContent
      await onSave(coverPageSettings, editContent);
      setIsEditing(false);
    } catch (error) {
      console.error('Error saving cover page:', error);
      alert('Error saving cover page. Please try again.');
    }
  };

  const handleCancel = () => {
    const defaultContent = getDefaultCoverPageContent();
    setEditContent(coverPageContent || defaultContent);
    setIsEditing(false);
  };

  const startEditing = () => {
    const defaultContent = getDefaultCoverPageContent();
    setEditContent(coverPageContent || defaultContent);
    setIsEditing(true);
  };

  // Handle image uploads - convert to base64 data URLs
  const handleImageUpload = (file: File): Promise<string> => {
    if (onImageUpload) {
      return onImageUpload(file);
    }
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        resolve(reader.result as string);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  // If editing, show CKEditor
  if (isEditing) {
    return (
      <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6 mb-4">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-gray-800">Edit Cover Page</h3>
          <div className="flex space-x-2">
            <button
              onClick={handleSave}
              className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors font-semibold"
            >
              <Save size={16} />
              <span>Save</span>
            </button>
            <button
              onClick={handleCancel}
              className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors font-semibold"
            >
              <X size={16} />
              <span>Cancel</span>
            </button>
          </div>
        </div>

        <div className="border border-gray-300 rounded-lg overflow-hidden">
          <TinyMCEEditor
            value={editContent}
            onChange={setEditContent}
            height={500}
            placeholder="Enter your cover page HTML content here. Use the source code button to edit HTML directly."
            onImageUpload={handleImageUpload}
          />
        </div>
      </div>
    );
  }

  // If there's custom content, render it; otherwise show default content
  const contentToRender = coverPageContent || getDefaultCoverPageContent();
  
  return (
    <div className="relative group">
      {isEditable && (
        <button
          onClick={startEditing}
          className="absolute top-4 right-4 z-20 flex items-center space-x-2 bg-white text-red-700 px-4 py-2 rounded-lg shadow-lg hover:bg-red-50 transition-colors font-semibold"
          title="Edit Cover Page"
        >
          <Edit2 size={16} />
          <span>Edit</span>
        </button>
      )}
      <div 
        className="cover-page min-h-[600px] relative bg-white rounded-lg overflow-hidden border border-gray-200"
        style={{ pageBreakAfter: 'always' }}
      >
        <div 
          className="ck-content w-full"
          dangerouslySetInnerHTML={{ __html: contentToRender }}
          style={{ backgroundColor: 'transparent' }}
        />
      </div>
    </div>
  );
};

export default EditableCoverPage;
