import { AlignLeft, Bold, ChevronDown, ChevronRight, Download, FileText, Italic, List, Loader, Save, Sparkles, Type, Upload, X } from 'lucide-react';
import React, { useState } from 'react';
import { GeneratedContent, Section, UploadedFile } from '../../domain/entities/Section';
import { SECTIONS } from '../../domain/services/sections';
import { ClaudeApiAdapter } from '../../infrastructure/adapters/api/ClaudeApiAdapter';
import { BrowserStorageAdapter } from '../../infrastructure/adapters/file-storage/BrowserStorageAdapter';
import { WordExportAdapter } from '../../infrastructure/adapters/file-storage/WordExportAdapter';

const SDDGenerator = () => {
  const [expandedSections, setExpandedSections] = useState<{ [key: string]: boolean }>({});
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [generatedContent, setGeneratedContent] = useState<GeneratedContent>({});
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [loadingSection, setLoadingSection] = useState<string | null>(null);
  const [projectContext, setProjectContext] = useState('');
  const [editContent, setEditContent] = useState('');

  // Dependency injection - adapters
  const contentGenerator = new ClaudeApiAdapter();
  const storageAdapter = new BrowserStorageAdapter();
  const exportAdapter = new WordExportAdapter();

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    const newFiles = [];
    
    for (const file of files) {
      const uploadedFile = await storageAdapter.uploadFile(file);
      newFiles.push(uploadedFile);
    }
    
    setUploadedFiles(prev => [...prev, ...newFiles]);
  };

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const startEditing = (sectionId: string) => {
    setEditContent(generatedContent[sectionId] || '');
    setEditingSection(sectionId);
  };

  const saveContent = (sectionId: string) => {
    setGeneratedContent(prev => ({
      ...prev,
      [sectionId]: editContent
    }));
    setEditingSection(null);
    setEditContent('');
  };

  const cancelEditing = () => {
    setEditingSection(null);
    setEditContent('');
  };

  const applyFormatting = (format: string) => {
    const textarea = document.getElementById('content-editor');
    if (!textarea) return;

    const textareaElement = textarea as HTMLTextAreaElement;
    const start = textareaElement.selectionStart;
    const end = textareaElement.selectionEnd;
    const selectedText = editContent.substring(start, end);
    
    let formattedText = '';
    switch(format) {
      case 'bold':
        formattedText = `**${selectedText}**`;
        break;
      case 'italic':
        formattedText = `*${selectedText}*`;
        break;
      case 'heading':
        formattedText = `\n## ${selectedText}\n`;
        break;
      case 'bullet':
        formattedText = `\n- ${selectedText}`;
        break;
      default:
        formattedText = selectedText;
    }

    const newContent = editContent.substring(0, start) + formattedText + editContent.substring(end);
    setEditContent(newContent);
  };

  const generateSectionContent = async (sectionId: string, sectionTitle: string, subsections: Section['subsections']) => {
    setLoadingSection(sectionId);
    
    try {
      const content = await contentGenerator.generateSection(
        sectionId,
        sectionTitle,
        subsections,
        { name: projectContext, description: projectContext },
        uploadedFiles
      );

      setGeneratedContent(prev => ({
        ...prev,
        [sectionId]: content
      }));
      
      setExpandedSections(prev => ({
        ...prev,
        [sectionId]: true
      }));
    } catch (error) {
      console.error('Error generating content:', error);
      setGeneratedContent(prev => ({
        ...prev,
        [sectionId]: 'Error generating content. Please check your connection and try again. The AI service may be temporarily unavailable.'
      }));
    } finally {
      setLoadingSection(null);
    }
  };

  const generateAllSections = async () => {
    for (const section of SECTIONS) {
      if (!generatedContent[section.id]) {
        await generateSectionContent(section.id, section.title, section.subsections);
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
  };

  const downloadAsWord = async () => {
    try {
      await exportAdapter.exportToWord(
        {
          sections: SECTIONS,
          generatedContent,
          projectContext
        },
        projectContext
      );
    } catch (error) {
      console.error('Error exporting to Word:', error);
      alert('Failed to export document. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white shadow-md rounded-lg overflow-hidden mb-6">
          <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <FileText size={40} />
                <div>
                  <h1 className="text-3xl font-bold">Architect Studio</h1>
                  <p className="text-purple-100">AI-Powered Solution Design Documentation for Equity Bank Limited</p>
                </div>
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={generateAllSections}
                  disabled={loadingSection !== null}
                  className="flex items-center space-x-2 bg-white text-purple-700 px-4 py-2 rounded-lg hover:bg-purple-50 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                  title={uploadedFiles.length > 0 ? `Generate all sections using ${uploadedFiles.length} uploaded file(s)` : 'Upload project files for better results'}
                >
                  <Sparkles size={20} />
                  <span>Generate All Sections</span>
                </button>
                <button
                  onClick={downloadAsWord}
                  className="flex items-center space-x-2 bg-white text-purple-700 px-4 py-2 rounded-lg hover:bg-purple-50 transition-colors font-semibold"
                  title="Download complete document as Word file"
                >
                  <Download size={20} />
                  <span>Download Word Document</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">Project Configuration</h2>
          
          <div className="mb-4">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Project Name and Context
            </label>
            <input
              type="text"
              value={projectContext}
              onChange={(e) => setProjectContext(e.target.value)}
              placeholder="Enter the project name and brief description (e.g., Kilimo Biashara Loan System, Digital Banking Platform)"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
            <p className="text-xs text-gray-500 mt-1">
              This information will be used to generate contextually relevant content for all sections
            </p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Upload Project Documents
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-purple-500 transition-colors cursor-pointer">
              <input
                type="file"
                multiple
                onChange={handleFileUpload}
                className="hidden"
                id="file-upload"
                accept=".pdf,.doc,.docx,.txt,.md"
              />
              <label htmlFor="file-upload" className="cursor-pointer">
                <Upload className="mx-auto mb-2 text-gray-400" size={32} />
                <p className="text-sm text-gray-600">
                  Click to upload project documents, requirements, business cases, or technical specifications
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Supported formats: PDF, DOC, DOCX, TXT, MD (Maximum 10 files)
                </p>
                <p className="text-xs text-blue-600 mt-2 font-medium">
                  💡 Tip: Text files (.txt, .md, .doc, .docx) work best for full content extraction. PDF filenames and context will be used.
                </p>
              </label>
            </div>
            
            {uploadedFiles.length > 0 && (
              <div className="mt-4 space-y-2">
                <p className="text-sm font-semibold text-gray-700">Uploaded Files ({uploadedFiles.length}):</p>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-2">
                  <p className="text-xs text-blue-800 font-medium">
                    📄 {uploadedFiles.filter(f => f.status === 'extracted').length} file(s) with full content extraction • 
                    {uploadedFiles.filter(f => f.status === 'pdf' || f.status === 'limited').length > 0 && 
                      ` ${uploadedFiles.filter(f => f.status === 'pdf' || f.status === 'limited').length} file(s) with metadata only`}
                  </p>
                  <p className="text-xs text-blue-700 mt-1">
                    AI will analyze these files and use their content to generate accurate, project-specific documentation
                  </p>
                </div>
                {uploadedFiles.map((file, index) => (
                  <div key={index} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg border border-gray-200">
                    <div className="flex items-center space-x-3">
                      <FileText size={20} className={
                        file.status === 'extracted' ? 'text-green-600' :
                        file.status === 'pdf' || file.status === 'limited' ? 'text-amber-600' :
                        'text-purple-600'
                      } />
                      <div>
                        <p className="text-sm font-medium text-gray-800">{file.name}</p>
                        <p className="text-xs text-gray-600">
                          {(file.size / 1024).toFixed(2)} KB • 
                          {file.status === 'extracted' && ` ✓ Content extracted (${file.content.length} chars)`}
                          {file.status === 'pdf' && ' ⚠ PDF (metadata only)'}
                          {file.status === 'limited' && ' ⚠ Limited extraction'}
                          {file.status === 'error' && ' ✗ Extraction failed'}
                          {file.status === 'ready' && ' Ready'}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => removeFile(index)}
                      className="text-purple-600 hover:text-purple-800 text-sm font-medium"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-3">
          {SECTIONS.map((section) => (
            <div key={section.id} className="bg-white rounded-lg shadow-md overflow-hidden">
              <button
                onClick={() => toggleSection(section.id)}
                className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex-1 text-left">
                  <h2 className="text-lg font-semibold text-gray-800">{section.title}</h2>
                  <p className="text-xs text-gray-500 mt-1">
                    {section.subsections.map(sub => sub.title).join(', ')}
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  {generatedContent[section.id] && (
                    <span className="text-xs bg-green-100 text-green-700 px-3 py-1 rounded-full font-medium">
                      Generated
                    </span>
                  )}
                  {expandedSections[section.id] ? (
                    <ChevronDown className="text-purple-700" size={24} />
                  ) : (
                    <ChevronRight className="text-purple-700" size={24} />
                  )}
                </div>
              </button>
              
              {expandedSections[section.id] && (
                <div className="border-t border-gray-200 bg-gray-50">
                  {editingSection === section.id ? (
                    <div className="p-6">
                      <div className="mb-4 flex items-center space-x-2 bg-gray-100 p-2 rounded-lg">
                        <button
                          onClick={() => applyFormatting('bold')}
                          className="p-2 hover:bg-gray-200 rounded"
                          title="Bold"
                        >
                          <Bold size={18} />
                        </button>
                        <button
                          onClick={() => applyFormatting('italic')}
                          className="p-2 hover:bg-gray-200 rounded"
                          title="Italic"
                        >
                          <Italic size={18} />
                        </button>
                        <button
                          onClick={() => applyFormatting('heading')}
                          className="p-2 hover:bg-gray-200 rounded"
                          title="Heading"
                        >
                          <Type size={18} />
                        </button>
                        <button
                          onClick={() => applyFormatting('bullet')}
                          className="p-2 hover:bg-gray-200 rounded"
                          title="Bullet Point"
                        >
                          <List size={18} />
                        </button>
                        <div className="flex-1" />
                        <span className="text-xs text-gray-600">
                          Use ** for bold, * for italic, ## for headings
                        </span>
                      </div>
                      <textarea
                        id="content-editor"
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        className="w-full h-96 p-4 border border-gray-300 rounded-lg font-mono text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                        placeholder="Enter your content here. Use markdown formatting for better structure."
                      />
                      <div className="mt-4 flex space-x-2">
                        <button
                          onClick={() => saveContent(section.id)}
                          className="flex items-center space-x-2 bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors font-semibold"
                        >
                          <Save size={16} />
                          <span>Save Changes</span>
                        </button>
                        <button
                          onClick={cancelEditing}
                          className="flex items-center space-x-2 px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors font-semibold"
                        >
                          <X size={16} />
                          <span>Cancel</span>
                        </button>
                      </div>
                    </div>
                  ) : !generatedContent[section.id] ? (
                    <div className="p-8 text-center">
                      <div className="mb-4">
                        <h3 className="text-md font-semibold text-gray-800 mb-2">Section Subsections:</h3>
                        <div className="space-y-2 text-left max-w-3xl mx-auto">
                          {section.subsections.map(sub => (
                            <div key={sub.number} className="bg-white p-3 rounded-lg border border-gray-200">
                              <p className="text-sm font-semibold text-gray-800">{sub.number} {sub.title}</p>
                              <p className="text-xs text-gray-600 mt-1">{sub.description}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                      <button
                        onClick={() => generateSectionContent(section.id, section.title, section.subsections)}
                        disabled={loadingSection === section.id}
                        className="inline-flex items-center space-x-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-3 rounded-lg hover:from-purple-700 hover:to-blue-700 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {loadingSection === section.id ? (
                          <>
                            <Loader className="animate-spin" size={20} />
                            <span>Generating Content...</span>
                          </>
                        ) : (
                          <>
                            <Sparkles size={20} />
                            <span>Generate Section with AI</span>
                          </>
                        )}
                      </button>
                      {uploadedFiles.length > 0 ? (
                        <p className="text-xs text-green-600 mt-4 font-medium">
                          ✓ Will analyze {uploadedFiles.length} uploaded file{uploadedFiles.length > 1 ? 's' : ''} to generate accurate, project-specific content
                        </p>
                      ) : (
                        <p className="text-xs text-amber-600 mt-4 font-medium">
                          ⚠ No files uploaded. Content will be based on general best practices. Upload project documents for more accurate results.
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="p-6">
                      <div className="bg-white p-6 rounded-lg border border-gray-200 prose max-w-none">
                        <div className="whitespace-pre-wrap text-sm leading-relaxed">{generatedContent[section.id]}</div>
                      </div>
                      <div className="mt-4 flex space-x-2">
                        <button
                          onClick={() => startEditing(section.id)}
                          className="flex items-center space-x-2 text-white bg-blue-600 px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-semibold"
                        >
                          <AlignLeft size={16} />
                          <span>Edit Content</span>
                        </button>
                        <button
                          onClick={() => generateSectionContent(section.id, section.title, section.subsections)}
                          disabled={loadingSection === section.id}
                          className="flex items-center space-x-2 text-purple-700 px-4 py-2 border border-purple-700 rounded-lg hover:bg-purple-50 transition-colors font-semibold disabled:opacity-50"
                        >
                          <Sparkles size={16} />
                          <span>Regenerate Content</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Footer - Removed */}
      </div>
    </div>
  );
};

export default SDDGenerator;


