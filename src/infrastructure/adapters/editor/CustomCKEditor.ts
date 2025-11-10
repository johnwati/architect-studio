import { Alignment } from '@ckeditor/ckeditor5-alignment';
import { Autoformat } from '@ckeditor/ckeditor5-autoformat';
import { Bold, Code, Italic, Strikethrough, Subscript, Superscript, Underline } from '@ckeditor/ckeditor5-basic-styles';
import { BlockQuote } from '@ckeditor/ckeditor5-block-quote';
import { CodeBlock } from '@ckeditor/ckeditor5-code-block';
import { ClassicEditor as ClassicEditorBase, ClassicEditorConfig } from '@ckeditor/ckeditor5-editor-classic';
import { Essentials } from '@ckeditor/ckeditor5-essentials';
import { FindAndReplace } from '@ckeditor/ckeditor5-find-and-replace';
import { Font } from '@ckeditor/ckeditor5-font';
import { Heading } from '@ckeditor/ckeditor5-heading';
import {
    Image,
    ImageCaption,
    ImageInsert,
    ImageStyle,
    ImageTextAlternative,
    ImageToolbar,
    ImageUpload,
    PictureEditing
} from '@ckeditor/ckeditor5-image';
import { ImageResize } from '@ckeditor/ckeditor5-image/src/imageresize';
import { Indent } from '@ckeditor/ckeditor5-indent';
import { Link, LinkImage } from '@ckeditor/ckeditor5-link';
import { List, ListProperties } from '@ckeditor/ckeditor5-list';
import { Paragraph } from '@ckeditor/ckeditor5-paragraph';
import { SourceEditing } from '@ckeditor/ckeditor5-source-editing';
import { Table, TableCellProperties, TableProperties, TableToolbar } from '@ckeditor/ckeditor5-table';
import { Typing } from '@ckeditor/ckeditor5-typing';
import { Undo } from '@ckeditor/ckeditor5-undo';
import { SimpleUploadAdapter } from '@ckeditor/ckeditor5-upload';
import { Widget } from '@ckeditor/ckeditor5-widget';

export default class CustomCKEditor extends ClassicEditorBase {}

// Build the editor
CustomCKEditor.builtinPlugins = [
  Essentials,
  Alignment,
  Autoformat,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Code,
  Subscript,
  Superscript,
  BlockQuote,
  CodeBlock,
  Font,
  Heading,
  Image,
  ImageToolbar,
  ImageCaption,
  ImageStyle,
  ImageResize,
  ImageUpload,
  PictureEditing,
  ImageInsert,
  ImageTextAlternative,
  Link,
  LinkImage,
  Indent,
  List,
  ListProperties,
  Paragraph,
  Table,
  TableToolbar,
  TableProperties,
  TableCellProperties,
  Typing,
  Undo,
  SimpleUploadAdapter,
  Widget,
  FindAndReplace,
  SourceEditing
];

CustomCKEditor.defaultConfig = {
  toolbar: {
    items: [
      'heading', '|',
      'bold', 'italic', 'underline', 'strikethrough', 'subscript', 'superscript', '|',
      'fontSize', 'fontFamily', 'fontColor', 'fontBackgroundColor', '|',
      'alignment', '|',
      'numberedList', 'bulletedList', '|',
      'outdent', 'indent', '|',
      'link', 'imageUpload', 'insertTable', '|',
      'blockQuote', 'codeBlock', '|',
      'undo', 'redo', '|',
      'sourceEditing'
    ],
    shouldNotGroupWhenFull: true
  },
  image: {
    toolbar: [
      'imageStyle:inline',
      'imageStyle:wrapText',
      'imageStyle:breakText',
      '|',
      'imageTextAlternative',
      'toggleImageCaption',
      '|',
      'resizeImage:50',
      'resizeImage:75',
      'resizeImage:original',
      'resizeImage:custom'
    ],
    resizeUnit: 'px',
    resizeOptions: [
      {
        name: 'resizeImage:original',
        label: 'Original',
        value: null
      },
      {
        name: 'resizeImage:50',
        label: '50%',
        value: '50'
      },
      {
        name: 'resizeImage:75',
        label: '75%',
        value: '75'
      },
      {
        name: 'resizeImage:custom',
        label: 'Custom',
        value: 'custom'
      }
    ]
  },
  table: {
    contentToolbar: [
      'tableColumn',
      'tableRow',
      'mergeTableCells',
      'tableCellProperties',
      'tableProperties'
    ]
  },
  fontSize: {
    options: [9, 11, 13, 'default', 17, 19, 21, 27, 35]
  },
  fontFamily: {
    options: [
      'default',
      'Arial, Helvetica, sans-serif',
      'Courier New, Courier, monospace',
      'Georgia, serif',
      'Lucida Sans Unicode, Lucida Grande, sans-serif',
      'Tahoma, Geneva, sans-serif',
      'Times New Roman, Times, serif',
      'Trebuchet MS, Helvetica, sans-serif',
      'Verdana, Geneva, sans-serif'
    ]
  },
  heading: {
    options: [
      { model: 'paragraph', title: 'Paragraph', class: 'ck-heading_paragraph' },
      { model: 'heading1', view: 'h1', title: 'Heading 1', class: 'ck-heading_heading1' },
      { model: 'heading2', view: 'h2', title: 'Heading 2', class: 'ck-heading_heading2' },
      { model: 'heading3', view: 'h3', title: 'Heading 3', class: 'ck-heading_heading3' },
      { model: 'heading4', view: 'h4', title: 'Heading 4', class: 'ck-heading_heading4' },
      { model: 'heading5', view: 'h5', title: 'Heading 5', class: 'ck-heading_heading5' },
      { model: 'heading6', view: 'h6', title: 'Heading 6', class: 'ck-heading_heading6' }
    ]
  },
  simpleUpload: {
    uploadUrl: '', // We'll handle uploads manually via adapter
    withCredentials: false
  }
} as ClassicEditorConfig;

