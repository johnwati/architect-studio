import { AlignmentType, BorderStyle, Document, HeadingLevel, ImageRun, Packer, PageBreak, Paragraph, ShadingType, Table, TableCell, TableRow, TextRun, UnderlineType, WidthType } from 'docx';
import { saveAs } from 'file-saver';
import html2canvas from 'html2canvas';
import { Section } from '../../../domain/entities/Section';
import { IExportAdapter } from '../../../domain/ports/IExportAdapter';
import { generateTableOfContents } from '../../../domain/services/sectionUtils';

export class WordExportAdapter implements IExportAdapter {
  /**
   * Converts HTML content to docx Paragraph elements
   */
  private htmlToDocxElements(html: string): (Paragraph | Table)[] {
    if (!html) return [];

    const elements: (Paragraph | Table)[] = [];
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;

    // Process all child nodes
    Array.from(tempDiv.childNodes).forEach(node => {
      const converted = this.convertNodeToDocx(node);
      if (converted) {
        if (Array.isArray(converted)) {
          elements.push(...converted);
        } else {
          elements.push(converted);
        }
      }
    });

    return elements;
  }

  /**
   * Converts a DOM node to docx elements
   */
  private convertNodeToDocx(node: Node): (Paragraph | Table)[] | Paragraph | Table | null {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent?.trim();
      if (text) {
        return new Paragraph({
          children: [new TextRun(text)],
        });
      }
      return null;
    }

    if (node.nodeType !== Node.ELEMENT_NODE) {
      return null;
    }

    const element = node as Element;
    const tagName = element.tagName.toLowerCase();

    switch (tagName) {
      case 'h1':
        return this.convertHeading(element, HeadingLevel.HEADING_1, { after: 240 });

      case 'h2':
        return this.convertHeading(element, HeadingLevel.HEADING_2, { after: 240, before: 240 });

      case 'h3':
        return this.convertHeading(element, HeadingLevel.HEADING_3, { after: 180, before: 180 });

      case 'h4':
        return this.convertHeading(element, HeadingLevel.HEADING_4, { after: 120, before: 120 });

      case 'p':
        return this.convertParagraph(element);

      case 'ul':
      case 'ol':
        return this.convertList(element, tagName === 'ol');

      case 'table':
        return this.convertTable(element);

      case 'img':
        return this.convertImage(element);

      case 'div': {
        const divResult = this.convertDiv(element);
        return divResult;
      }

      case 'blockquote': {
        const quoteChildren = this.convertInlineElements(element);
        return new Paragraph({
          children: quoteChildren.length > 0 ? quoteChildren : [new TextRun({ text: this.getTextContent(element), italics: true })],
          indent: { left: 360 },
          shading: { fill: 'F9F9F9', type: ShadingType.SOLID },
        });
      }

      case 'pre':
      case 'code': {
        const codeChildren = this.convertInlineElements(element);
        return new Paragraph({
          children: codeChildren.length > 0 ? codeChildren : [new TextRun({ text: this.getTextContent(element), font: 'Courier New' })],
          shading: { fill: 'F5F5F5', type: ShadingType.SOLID },
          spacing: { after: 120 },
        });
      }

      default:
        // For unknown tags, try to extract text content
        const text = this.getTextContent(element);
        if (text) {
          return new Paragraph({
            children: [new TextRun(text)],
          });
        }
        return null;
    }
  }

  /**
   * Converts a heading element with formatting
   */
  private convertHeading(element: Element, level: (typeof HeadingLevel)[keyof typeof HeadingLevel], spacing: { after?: number; before?: number }): Paragraph {
    const style = element.getAttribute('style') || '';
    const headingColor = this.extractColorFromStyle(style) || '#8B1A1A'; // Default Equity Bank color
    const children = this.convertInlineElementsWithColor(element, headingColor);
    
    return new Paragraph({
      children: children.length > 0 ? children : [new TextRun({ text: this.getTextContent(element), color: this.hexToRgb(headingColor) })],
      heading: level,
      spacing,
      alignment: this.extractAlignmentFromStyle(style),
    });
  }

  /**
   * Converts inline elements with a default color applied
   */
  private convertInlineElementsWithColor(element: Element, defaultColor: string): TextRun[] {
    // Convert inline elements with color support
    // We'll modify convertInlineElements to accept an optional default color
    const children: TextRun[] = [];
    
    const processNode = (node: Node, inheritedFormat: { bold?: boolean; italic?: boolean; underline?: boolean; color?: string; fontSize?: number; font?: string } = {}) => {
      // Use default color if no color is specified
      if (!inheritedFormat.color) {
        inheritedFormat.color = defaultColor;
      }
      
      if (node.nodeType === Node.TEXT_NODE) {
        const text = node.textContent;
        if (text && text.trim()) {
          const format: any = {};
          if (inheritedFormat.bold) format.bold = true;
          if (inheritedFormat.italic) format.italics = true;
          if (inheritedFormat.underline) format.underline = { type: UnderlineType.SINGLE };
          if (inheritedFormat.color) format.color = this.hexToRgb(inheritedFormat.color);
          if (inheritedFormat.fontSize) format.size = inheritedFormat.fontSize * 2; // docx uses half-points
          if (inheritedFormat.font) format.font = inheritedFormat.font;
          
          children.push(new TextRun({ text, ...format }));
        }
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        const elem = node as Element;
        const tagName = elem.tagName.toLowerCase();
        const style = elem.getAttribute('style') || '';
        
        const newFormat = { ...inheritedFormat };
        
        // Apply tag-based formatting
        if (tagName === 'strong' || tagName === 'b') {
          newFormat.bold = true;
        } else if (tagName === 'em' || tagName === 'i') {
          newFormat.italic = true;
        } else if (tagName === 'u') {
          newFormat.underline = true;
        }
        
        // Extract color from style (overrides default)
        const color = this.extractColorFromStyle(style);
        if (color) newFormat.color = color;
        
        // Extract font size from style
        const fontSize = this.extractFontSizeFromStyle(style);
        if (fontSize) newFormat.fontSize = fontSize;
        
        // Extract font family from style
        const fontFamily = this.extractFontFamilyFromStyle(style);
        if (fontFamily) newFormat.font = fontFamily;
        
        // Handle links
        if (tagName === 'a') {
          const href = elem.getAttribute('href');
          const text = this.getTextContent(elem);
          if (href) {
            children.push(new TextRun({
              text: text || href,
              bold: newFormat.bold,
              italics: newFormat.italic,
              underline: newFormat.underline ? { type: UnderlineType.SINGLE } : undefined,
              color: newFormat.color ? this.hexToRgb(newFormat.color) : this.hexToRgb(defaultColor),
            }));
          } else {
            // Process as regular text
            Array.from(elem.childNodes).forEach(child => processNode(child, newFormat));
          }
        } else {
          // Recursively process child nodes
          Array.from(elem.childNodes).forEach(child => processNode(child, newFormat));
        }
      }
    };

    Array.from(element.childNodes).forEach(node => processNode(node, { color: defaultColor }));

    // If no children were created, create one with the default color
    if (children.length === 0) {
      const text = this.getTextContent(element);
      if (text && text.trim()) {
        children.push(new TextRun({ text, color: this.hexToRgb(defaultColor) }));
      }
    }

    return children;
  }

  /**
   * Converts a paragraph element with formatting
   */
  private convertParagraph(p: Element): Paragraph {
    const children = this.convertInlineElements(p);
    const style = p.getAttribute('style') || '';

    if (children.length === 0) {
      children.push(new TextRun(''));
    }

    return new Paragraph({
      children,
      spacing: { after: 120 },
      alignment: this.extractAlignmentFromStyle(style),
      indent: this.extractIndentFromStyle(style),
    });
  }

  /**
   * Converts inline elements (text with formatting) recursively
   */
  private convertInlineElements(element: Element): TextRun[] {
    const children: TextRun[] = [];
    
    const processNode = (node: Node, inheritedFormat: { bold?: boolean; italic?: boolean; underline?: boolean; color?: string; fontSize?: number; font?: string } = {}) => {
      if (node.nodeType === Node.TEXT_NODE) {
        const text = node.textContent;
        if (text) {
          const format: any = {};
          if (inheritedFormat.bold) format.bold = true;
          if (inheritedFormat.italic) format.italics = true;
          if (inheritedFormat.underline) format.underline = { type: UnderlineType.SINGLE };
          if (inheritedFormat.color) format.color = this.hexToRgb(inheritedFormat.color);
          if (inheritedFormat.fontSize) format.size = inheritedFormat.fontSize * 2; // docx uses half-points
          if (inheritedFormat.font) format.font = inheritedFormat.font;
          
          children.push(new TextRun({ text, ...format }));
        }
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        const elem = node as Element;
        const tagName = elem.tagName.toLowerCase();
        const style = elem.getAttribute('style') || '';
        
        const newFormat = { ...inheritedFormat };
        
        // Apply tag-based formatting
        if (tagName === 'strong' || tagName === 'b') {
          newFormat.bold = true;
        } else if (tagName === 'em' || tagName === 'i') {
          newFormat.italic = true;
        } else if (tagName === 'u') {
          newFormat.underline = true;
        }
        
        // Extract color from style
        const color = this.extractColorFromStyle(style);
        if (color) newFormat.color = color;
        
        // Extract font size from style
        const fontSize = this.extractFontSizeFromStyle(style);
        if (fontSize) newFormat.fontSize = fontSize;
        
        // Extract font family from style
        const fontFamily = this.extractFontFamilyFromStyle(style);
        if (fontFamily) newFormat.font = fontFamily;
        
        // Handle links
        if (tagName === 'a') {
          const href = elem.getAttribute('href');
          const text = this.getTextContent(elem);
          if (href) {
            children.push(new TextRun({
              text: text || href,
              bold: newFormat.bold,
              italics: newFormat.italic,
              underline: newFormat.underline ? { type: UnderlineType.SINGLE } : undefined,
              color: newFormat.color ? this.hexToRgb(newFormat.color) : '0563C1', // Blue for links
            }));
          } else {
            // Process as regular text
            Array.from(elem.childNodes).forEach(child => processNode(child, newFormat));
          }
        } else {
          // Recursively process child nodes
          Array.from(elem.childNodes).forEach(child => processNode(child, newFormat));
        }
      }
    };

    Array.from(element.childNodes).forEach(node => processNode(node));

    return children;
  }

  /**
   * Extracts color from style attribute
   */
  private extractColorFromStyle(style: string): string | null {
    const match = style.match(/color:\s*([^;]+)/i);
    if (match) {
      const color = match[1].trim();
      // Handle hex colors
      if (color.startsWith('#')) return color;
      // Handle rgb/rgba
      const rgbMatch = color.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
      if (rgbMatch) {
        const r = parseInt(rgbMatch[1]).toString(16).padStart(2, '0');
        const g = parseInt(rgbMatch[2]).toString(16).padStart(2, '0');
        const b = parseInt(rgbMatch[3]).toString(16).padStart(2, '0');
        return `#${r}${g}${b}`.toUpperCase();
      }
    }
    return null;
  }

  /**
   * Extracts font size from style attribute (in points)
   */
  private extractFontSizeFromStyle(style: string): number | null {
    const match = style.match(/font-size:\s*(\d+(?:\.\d+)?)pt/i);
    if (match) {
      return parseFloat(match[1]);
    }
    // Try px (convert roughly: 1pt ≈ 1.33px)
    const pxMatch = style.match(/font-size:\s*(\d+(?:\.\d+)?)px/i);
    if (pxMatch) {
      return parseFloat(pxMatch[1]) / 1.33;
    }
    return null;
  }

  /**
   * Extracts font family from style attribute
   */
  private extractFontFamilyFromStyle(style: string): string | null {
    const match = style.match(/font-family:\s*([^;]+)/i);
    if (match) {
      // Get first font (before comma)
      const fonts = match[1].split(',')[0].trim();
      // Remove quotes
      return fonts.replace(/['"]/g, '');
    }
    return null;
  }

  /**
   * Extracts alignment from style attribute
   */
  private extractAlignmentFromStyle(style: string): (typeof AlignmentType)[keyof typeof AlignmentType] | undefined {
    if (style.includes('text-align: center')) return AlignmentType.CENTER;
    if (style.includes('text-align: right')) return AlignmentType.RIGHT;
    if (style.includes('text-align: justify')) return AlignmentType.JUSTIFIED;
    return AlignmentType.LEFT; // Default is left
  }

  /**
   * Extracts indent from style attribute
   */
  private extractIndentFromStyle(style: string): { left?: number; right?: number; firstLine?: number } | undefined {
    const indent: { left?: number; right?: number; firstLine?: number } = {};
    
    // Extract left indent (convert px/em to twips: 1em ≈ 240 twips, 1px ≈ 15 twips)
    const leftMatch = style.match(/margin-left:\s*(\d+(?:\.\d+)?)(px|em|pt)/i);
    if (leftMatch) {
      const value = parseFloat(leftMatch[1]);
      const unit = leftMatch[2].toLowerCase();
      if (unit === 'px') indent.left = value * 15;
      else if (unit === 'em') indent.left = value * 240;
      else if (unit === 'pt') indent.left = value * 20;
    }
    
    // Extract text-indent (first line indent)
    const firstLineMatch = style.match(/text-indent:\s*(\d+(?:\.\d+)?)(px|em|pt)/i);
    if (firstLineMatch) {
      const value = parseFloat(firstLineMatch[1]);
      const unit = firstLineMatch[2].toLowerCase();
      if (unit === 'px') indent.firstLine = value * 15;
      else if (unit === 'em') indent.firstLine = value * 240;
      else if (unit === 'pt') indent.firstLine = value * 20;
    }
    
    return Object.keys(indent).length > 0 ? indent : undefined;
  }

  /**
   * Converts hex color to RGB format for docx
   */
  private hexToRgb(hex: string): string {
    // Remove # if present
    hex = hex.replace('#', '');
    
    // Handle 3-digit hex
    if (hex.length === 3) {
      hex = hex.split('').map(c => c + c).join('');
    }
    
    // Convert to uppercase (docx expects uppercase)
    return hex.toUpperCase();
  }

  /**
   * Converts a list element with proper formatting
   */
  private convertList(list: Element, ordered: boolean): Paragraph[] {
    const paragraphs: Paragraph[] = [];
    const items = list.querySelectorAll('li');
    const style = list.getAttribute('style') || '';
    const listIndent = this.extractIndentFromStyle(style)?.left || 360;

    items.forEach((item, index) => {
      const itemChildren = this.convertInlineElements(item);
      const prefix = ordered ? `${index + 1}. ` : '• ';
      
      paragraphs.push(new Paragraph({
        children: [
          new TextRun({ text: prefix, bold: true }),
          ...itemChildren,
        ],
        indent: { left: listIndent },
        spacing: { after: 60 },
      }));
    });

    return paragraphs;
  }

  /**
   * Converts a table element with proper formatting
   */
  private convertTable(table: Element): Table {
    const rows: TableRow[] = [];
    const tableRows = table.querySelectorAll('tr');

    tableRows.forEach(row => {
      const cells: TableCell[] = [];
      const rowCells = row.querySelectorAll('th, td');

      rowCells.forEach(cell => {
        const isHeader = cell.tagName.toLowerCase() === 'th';
        const cellStyle = cell.getAttribute('style') || '';
        const cellChildren = this.convertInlineElements(cell);
        
        // If no formatted children, use plain text
        if (cellChildren.length === 0) {
          cellChildren.push(new TextRun({ text: this.getTextContent(cell) }));
        }

        // Extract alignment from cell style
        const alignment = this.extractAlignmentFromStyle(cellStyle);
        
        // Extract background color
        const bgColor = this.extractBackgroundColorFromStyle(cellStyle);
        
        cells.push(new TableCell({
          children: [new Paragraph({
            children: cellChildren,
            alignment: alignment,
          })],
          shading: isHeader 
            ? { fill: 'F0F0F0', type: ShadingType.SOLID }
            : bgColor 
              ? { fill: this.hexToRgb(bgColor), type: ShadingType.SOLID }
              : undefined,
          verticalAlign: cellStyle.includes('vertical-align: top') ? 'top' : undefined,
        }));
      });

      if (cells.length > 0) {
        rows.push(new TableRow({ children: cells }));
      }
    });

    return new Table({
      rows,
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: {
        top: { style: BorderStyle.SINGLE, size: 4, color: '333333' },
        bottom: { style: BorderStyle.SINGLE, size: 4, color: '333333' },
        left: { style: BorderStyle.SINGLE, size: 4, color: '333333' },
        right: { style: BorderStyle.SINGLE, size: 4, color: '333333' },
        insideHorizontal: { style: BorderStyle.SINGLE, size: 4, color: '333333' },
        insideVertical: { style: BorderStyle.SINGLE, size: 4, color: '333333' },
      },
    });
  }

  /**
   * Extracts background color from style attribute
   */
  private extractBackgroundColorFromStyle(style: string): string | null {
    const match = style.match(/background-color:\s*([^;]+)/i);
    if (match) {
      const color = match[1].trim();
      if (color.startsWith('#')) return color;
      // Handle rgb/rgba
      const rgbMatch = color.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
      if (rgbMatch) {
        const r = parseInt(rgbMatch[1]).toString(16).padStart(2, '0');
        const g = parseInt(rgbMatch[2]).toString(16).padStart(2, '0');
        const b = parseInt(rgbMatch[3]).toString(16).padStart(2, '0');
        return `#${r}${g}${b}`.toUpperCase();
      }
      // Handle named colors
      const colorMap: { [key: string]: string } = {
        'lightgray': 'D3D3D3',
        'lightgrey': 'D3D3D3',
        'gray': '808080',
        'grey': '808080',
        'white': 'FFFFFF',
        'black': '000000',
      };
      const lowerColor = color.toLowerCase();
      if (colorMap[lowerColor]) return `#${colorMap[lowerColor]}`;
    }
    return null;
  }

  /**
   * Converts a div element
   */
  private convertDiv(div: Element): (Paragraph | Table)[] | Paragraph | Table | null {
    const elements: (Paragraph | Table)[] = [];

    Array.from(div.childNodes).forEach(node => {
      const converted = this.convertNodeToDocx(node);
      if (converted) {
        if (Array.isArray(converted)) {
          elements.push(...converted);
        } else {
          elements.push(converted);
        }
      }
    });

    if (elements.length === 0) return null;
    if (elements.length === 1) return elements[0];
    return elements;
  }

  /**
   * Gets plain text content from an element
   */
  private getTextContent(element: Element): string {
    return element.textContent?.trim() || '';
  }

  /**
   * Converts an image element (<img>) to a Paragraph with ImageRun
   */
  private convertImage(img: Element): Paragraph | null {
    const src = img.getAttribute('src');
    if (!src) {
      return null;
    }

    try {
      let imageData: Uint8Array | null = null;

      if (src.startsWith('data:image')) {
        imageData = this.dataUrlToUint8Array(src);
      } else {
        console.warn('Word export: skipping non-data URL image. Please use embedded (base64) images for Word exports.', src);
        return new Paragraph({
          children: [
            new TextRun({
              text: '[Image omitted: external image sources are not embedded in Word exports]',
              italics: true,
              color: '666666',
            }),
          ],
          spacing: { after: 120 },
        });
      }

      if (!imageData) {
        return null;
      }

      const style = img.getAttribute('style') || '';
      const alignment = style.includes('text-align')
        ? this.extractAlignmentFromStyle(style)
        : AlignmentType.CENTER;
      const { width, height } = this.extractImageDimensions(img);

      const arrayBuffer = this.uint8ArrayToArrayBuffer(imageData);
      const imageOptions: any = {
        data: arrayBuffer,
        transformation: {
          width,
          height,
        },
      };

      return new Paragraph({
        alignment,
        spacing: { after: 200 },
        children: [
          new ImageRun(imageOptions),
        ],
      });
    } catch (error) {
      console.error('Failed to convert image for Word export:', error);
      return null;
    }
  }

  private dataUrlToUint8Array(dataUrl: string): Uint8Array {
    const parts = dataUrl.split(',');
    if (parts.length < 2) {
      throw new Error('Invalid data URL format');
    }
    const base64 = parts[1];
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  }

  private uint8ArrayToArrayBuffer(bytes: Uint8Array): ArrayBuffer {
    return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
  }

  private extractImageDimensions(img: Element): { width: number; height: number } {
    const defaultWidth = 520; // Approx A4 width minus margins
    const defaultHeight = 320;

    const widthAttr = img.getAttribute('width');
    const heightAttr = img.getAttribute('height');
    const style = img.getAttribute('style') || '';

    const width = this.extractDimension(widthAttr) || this.extractDimensionFromStyle(style, 'width') || defaultWidth;
    const height = this.extractDimension(heightAttr) || this.extractDimensionFromStyle(style, 'height') || defaultHeight;

    // Guard against zero sizes
    const finalWidth = Math.max(80, Math.min(width, 640));
    const finalHeight = Math.max(80, Math.min(height, 900));

    return { width: finalWidth, height: finalHeight };
  }

  private extractDimension(value: string | null): number | null {
    if (!value) return null;
    const parsed = parseFloat(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  private extractDimensionFromStyle(style: string, property: 'width' | 'height'): number | null {
    const regex = new RegExp(`${property}:\\s*(\\d+(?:\\.\\d+)?)(px|pt|%)`, 'i');
    const match = style.match(regex);
    if (!match) return null;
    const value = parseFloat(match[1]);
    const unit = match[2].toLowerCase();
    if (unit === 'px') return value;
    if (unit === 'pt') return value * (4 / 3); // Rough conversion pt -> px
    if (unit === '%') return (value / 100) * 520; // Assume 520px content width
    return null;
  }

  /**
   * Removes duplicate section titles from content
   */
  private removeDuplicateSectionTitle(content: string, sectionTitle: string): string {
    if (!content || !sectionTitle) return content;
    
    const titleMatch = sectionTitle.match(/(\d+\.\s*)?(.+)/);
    const titleText = titleMatch ? titleMatch[2].trim() : sectionTitle.trim();
    const escapedTitleText = titleText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const escapedFullTitle = sectionTitle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    
    const patterns = [
      new RegExp(`<h[123][^>]*>\\s*${escapedFullTitle}\\s*</h[123]>`, 'gi'),
      new RegExp(`<h[123][^>]*>\\s*\\d+\\.\\s*${escapedTitleText}\\s*</h[123]>`, 'gi'),
      new RegExp(`<h[123][^>]*>\\s*${escapedTitleText}\\s*</h[123]>`, 'gi'),
    ];
    
    let cleaned = content;
    for (const pattern of patterns) {
      cleaned = cleaned.replace(pattern, '');
    }
    
    return cleaned.trim();
  }

  /**
   * Generates cover page content
   */
  private generateCoverPageElements(
    projectName: string,
    projectDescription: string,
    _version: string,
    _date: string,
    settings?: any
  ): Paragraph[] {
    const showProjectName = settings?.showProjectName !== false;
    const paragraphs: Paragraph[] = [];

    // Add spacing
    paragraphs.push(new Paragraph({ text: '', spacing: { before: 1440 } }));

    if (showProjectName) {
      paragraphs.push(
        new Paragraph({
          text: projectName || 'Solution Design Document',
          heading: HeadingLevel.HEADING_1,
          alignment: AlignmentType.CENTER,
          spacing: { after: 320 },
        })
      );

      if (projectDescription) {
        paragraphs.push(
          new Paragraph({
            text: projectDescription,
            alignment: AlignmentType.CENTER,
            spacing: { after: 480 },
          })
        );
      }
    }

    // Add page break after cover
    paragraphs.push(new Paragraph({ children: [new PageBreak()] }));

    return paragraphs;
  }

  private async renderCoverPageToImage(html: string): Promise<Paragraph | null> {
    if (typeof window === 'undefined') {
      return null;
    }

    const container = document.createElement('div');
    container.style.position = 'fixed';
    container.style.left = '-10000px';
    container.style.top = '0';
    container.style.width = '794px';
    container.style.padding = '32px';
    container.style.background = '#ffffff';
    container.style.fontFamily = `'Segoe UI', Arial, sans-serif`;
    container.style.boxSizing = 'border-box';
    container.innerHTML = html;
    document.body.appendChild(container);

    try {
      const canvas = await html2canvas(container, {
        backgroundColor: '#ffffff',
        scale: 2,
        useCORS: true,
      });

      const dataUrl = canvas.toDataURL('image/png', 0.95);
      const imageData = this.dataUrlToUint8Array(dataUrl);
      const arrayBuffer = this.uint8ArrayToArrayBuffer(imageData);

      const maxWidth = 620;
      const scale = canvas.width > maxWidth ? maxWidth / canvas.width : 1;
      const width = Math.max(320, Math.round(canvas.width * scale));
      const height = Math.max(240, Math.round(canvas.height * scale));

      const imageOptions: any = {
        data: arrayBuffer,
        transformation: {
          width,
          height,
        },
      };

      return new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [
          new ImageRun(imageOptions),
        ],
      });
    } catch (error) {
      console.error('Failed to render cover page HTML as image:', error);
      return null;
    } finally {
      if (container.parentNode) {
        container.parentNode.removeChild(container);
      }
    }
  }

  /**
   * Exports sections to Word document using docx library
   */
  async exportToWord(
    data: {
    sections: Section[];
    generatedContent: { [key: string]: string };
    projectContext: string;
    coverPageSettings?: any;
    },
    projectName: string
  ): Promise<void> {
    try {
      const { sections, generatedContent, projectContext, coverPageSettings } = data;
      const sectionsToExport = sections;
      
      console.log('📄 Word Export - Processing sections:', {
        totalSections: sectionsToExport.length,
        sectionsWithContent: sectionsToExport.filter(s => generatedContent[s.id]).length,
      });

      const children: (Paragraph | Table)[] = [];

      const coverHtml = generatedContent['cover-page'];
      if (coverHtml) {
        const coverImageParagraph = await this.renderCoverPageToImage(coverHtml);
        if (coverImageParagraph) {
          children.push(coverImageParagraph, new Paragraph({ children: [new PageBreak()] }));
        } else {
          const fallbackCover = this.generateCoverPageElements(
            projectContext || projectName || 'Solution Design Document',
            '',
            coverPageSettings?.version || '1.0',
            coverPageSettings?.date || new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' }),
            coverPageSettings
          );
          children.push(...fallbackCover);
        }
      } else {
        const fallbackCover = this.generateCoverPageElements(
          projectContext || projectName || 'Solution Design Document',
          '',
          coverPageSettings?.version || '1.0',
          coverPageSettings?.date || new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' }),
          coverPageSettings
        );
        children.push(...fallbackCover);
      }

    // Process each section
    for (const section of sectionsToExport) {
      try {
        // Add section title
        children.push(
          new Paragraph({
            text: section.title,
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 240, after: 240 },
          })
        );

        // Get section content
          let content = generatedContent[section.id];

        // Auto-generate Table of Contents if needed
          if (section.id === 'table-of-contents') {
            const sectionsForTOC = sectionsToExport.map(s => ({
              ...s,
            displayNumber: parseInt((s.title || '').match(/^(\d+)\./)?.[1] || '0'),
            }));
            content = generateTableOfContents(sectionsForTOC as any, generatedContent);
            if (!content || content.trim() === '') {
              content = '<p><em>Table of Contents will be generated once sections are created.</em></p>';
            }
          }
          
        // Process content
          if (content) {
          const cleanedContent = this.removeDuplicateSectionTitle(content, section.title);
          const docxElements = this.htmlToDocxElements(cleanedContent);
          children.push(...docxElements);
            } else {
          children.push(
            new Paragraph({
              children: [new TextRun({ text: 'Content pending generation.', italics: true })],
              spacing: { after: 120 },
            })
          );
        }
          } catch (error) {
        console.error(`❌ Error processing section ${section.title}:`, error);
        children.push(
          new Paragraph({
            children: [new TextRun({ text: 'Error loading content for this section.', italics: true })],
            spacing: { after: 120 },
          })
        );
      }
    }

    // Create the document
    const doc = new Document({
      sections: [
        {
          properties: {},
          children,
        },
      ],
      creator: 'Equity Group Holdings PLC',
      title: 'Solution Architecture Design Document',
      description: `Solution Design Document for ${projectName}`,
    });

    // Generate and save the document
    try {
      console.log('📄 Generating Word document blob...');
      const blob = await Packer.toBlob(doc);
      
      if (!blob || blob.size === 0) {
        throw new Error('Generated blob is empty');
      }
      
      console.log('📄 Blob generated successfully, size:', blob.size, 'bytes');
      
      const fileName = `Solution_Architecture_Design_${(projectName || 'Document').replace(/\s+/g, '_')}.docx`;
      
      console.log('📄 Saving file:', fileName);
      saveAs(blob, fileName);
      
      console.log('✅ Word export completed successfully');
    } catch (error) {
      console.error('❌ Error generating Word document:', error);
      
      // Provide more specific error messages
      if (error instanceof Error) {
        if (error.message.includes('blob')) {
          throw new Error(`Failed to generate document blob: ${error.message}`);
        } else if (error.message.includes('save')) {
          throw new Error(`Failed to save document: ${error.message}. Please check browser download permissions.`);
        } else {
          throw new Error(`Word export failed: ${error.message}`);
        }
      }
      
      throw new Error(`Failed to generate Word document: ${String(error)}`);
    }
    } catch (outerError) {
      // Catch any errors from the outer try block
      console.error('❌ Error in exportToWord:', outerError);
      throw outerError;
    }
  }
}
