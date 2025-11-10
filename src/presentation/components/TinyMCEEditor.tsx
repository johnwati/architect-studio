import { Editor } from '@tinymce/tinymce-react';
import React, { useRef, useState } from 'react';

interface TinyMCEEditorProps {
  value: string;
  onChange: (content: string) => void;
  height?: number;
  placeholder?: string;
  onImageUpload?: (file: File) => Promise<string>;
}

const TinyMCEEditor: React.FC<TinyMCEEditorProps> = ({
  value,
  onChange,
  height = 500,
  placeholder = 'Enter your content here...',
  onImageUpload,
}) => {
  const editorRef = useRef<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const tinyMCEApiKey = import.meta.env.VITE_TINYMCE_API_KEY;

  return (
    <div>
      {isLoading && (
        <div className="p-4 border border-gray-300 rounded-lg bg-gray-50">
          <p className="text-gray-600">Loading editor...</p>
        </div>
      )}
      {hasError && (
        <div className="p-4 border border-red-300 rounded-lg bg-red-50">
          <p className="text-red-700 font-semibold mb-2">⚠️ Editor Error</p>
          <p className="text-red-600 text-sm">TinyMCE failed to load. Using fallback textarea.</p>
          <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-full h-96 p-4 border border-gray-300 rounded-lg font-mono text-sm mt-2"
            placeholder={placeholder}
          />
        </div>
      )}
      <Editor
        apiKey={tinyMCEApiKey}
        onInit={(evt, editor) => {
          editorRef.current = editor;
          setIsLoading(false);
          console.log('✅ TinyMCE editor initialized:', editor);
        }}
        onLoadContent={() => {
          setIsLoading(false);
        }}
        onFailure={(err) => {
          console.error('❌ TinyMCE failed to load:', err);
          if (!tinyMCEApiKey) {
            console.warn('ℹ️ TinyMCE API key not configured. Provide VITE_TINYMCE_API_KEY in .env for full editor features.');
          }
          setHasError(true);
          setIsLoading(false);
        }}
        value={value}
        onEditorChange={(content) => {
          onChange(content);
        }}
        init={{
        height: height,
        // Show menubar - set to true for all menus or specify which ones
        menubar: true,
        // Alternative: specify menus explicitly
        // menubar: 'file edit view insert format tools table help',
        plugins: [
          'advlist', 'autolink', 'lists', 'link', 'image', 'charmap', 'preview',
          'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen',
          'insertdatetime', 'media', 'table', 'codesample', 'help', 'wordcount'
        ],
        toolbar: 'undo redo | blocks | ' +
          'bold italic underline strikethrough | forecolor backcolor | ' +
          'alignleft aligncenter alignright alignjustify | ' +
          'bullist numlist outdent indent | ' +
          'removeformat | link image | code | fullscreen | help',
        content_style: 'body { font-family:Helvetica,Arial,sans-serif; font-size:14px }',
        placeholder: placeholder,
        branding: false,
        promotion: false,
        // Enable source code editing - the 'code' plugin provides source view
        allow_script_urls: true,
        convert_urls: false,
        automatic_uploads: false,
        images_upload_handler: async (blobInfo, success, failure) => {
          try {
            const file = blobInfo.blob();
            let dataUrl: string;
            if (onImageUpload) {
              // Wrap Blob as File to preserve name/type where possible
              const fileLike = new File([file], blobInfo.filename(), { type: file.type });
              dataUrl = await onImageUpload(fileLike);
            } else {
              dataUrl = await new Promise<string>((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => resolve(reader.result as string);
                reader.onerror = () => reject(new Error('Failed to read image data'));
                reader.readAsDataURL(file);
              });
            }
            success(dataUrl);
          } catch (error: any) {
            console.error('TinyMCE image upload error:', error);
            failure(error?.message || 'Image upload failed');
          }
        },
        // Better HTML handling
        valid_elements: '*[*]',
        extended_valid_elements: '*[*]',
        // Source code editor settings
        toolbar_mode: 'sliding',
        toolbar_sticky: true,
        // Make sure menubar is visible
        menu: {
          file: { title: 'File', items: 'newdocument restoredraft | preview | print ' },
          edit: { title: 'Edit', items: 'undo redo | cut copy paste | selectall | searchreplace' },
          view: { title: 'View', items: 'code | visualaid visualchars visualblocks | preview fullscreen' },
          insert: { title: 'Insert', items: 'image link media template codesample inserttable | charmap emoticons hr | pagebreak nonbreaking anchor toc | insertdatetime' },
          format: { title: 'Format', items: 'bold italic underline strikethrough superscript subscript codeformat | formats blockformats fontformats fontsizes align | forecolor backcolor | removeformat' },
          tools: { title: 'Tools', items: 'spellchecker spellcheckerlanguage | code wordcount' },
          table: { title: 'Table', items: 'inserttable | cell row column | tableprops deletetable' },
          help: { title: 'Help', items: 'help' }
        },
        // Use default skin and content CSS from cloud
        skin: 'oxide',
        content_css: 'default',
      }}
      style={{ display: isLoading || hasError ? 'none' : 'block' }}
    />
    </div>
  );
};

export default TinyMCEEditor;

