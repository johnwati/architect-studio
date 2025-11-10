import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { Section } from '../../../domain/entities/Section';
import { IExportAdapter } from '../../../domain/ports/IExportAdapter';
import { generateTableOfContents } from '../../../domain/services/sectionUtils';

export class PdfExportAdapter implements IExportAdapter {
  /**
   * Escapes HTML special characters in text content
   */
  private escapeHtml(text: string): string {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Generates HTML for the cover page
   */
  private generateCoverPage(projectName: string, projectDescription: string, version: string, date: string, settings?: any): string {
    const showOrangeLine = settings?.showOrangeLine !== false;
    const showOrganization = settings?.showOrganization !== false;
    const showProjectName = settings?.showProjectName !== false;
    const organizationName = settings?.organizationName || 'Equity Group Holdings PLC';
    const logoText = settings?.logoText || 'EQUITY';
    
    return `
      <div style="min-height: 800px; display: flex; flex-direction: column; align-items: center; justify-content: center; position: relative; background-color: #FFFFFF; padding: 40px; margin-bottom: 40px;">
        ${showOrangeLine ? '<div style="position: absolute; top: 0; bottom: 0; right: 20%; width: 4px; background-color: #FF6B35;"></div>' : ''}
        
        ${showProjectName ? `
        <div style="text-align: center; margin-bottom: 40pt; width: 80%; max-width: 600px;">
          <h2 style="font-size: 36pt; font-weight: bold; color: #1F2937; margin-bottom: 16pt; margin-top: 0;">${this.escapeHtml(projectName)}</h2>
          ${projectDescription ? `<p style="font-size: 20pt; color: #4B5563; margin-bottom: 24pt;">${this.escapeHtml(projectDescription)}</p>` : ''}
        </div>
        ` : ''}
      </div>
    `;
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
      new RegExp(`<h[123][^>]*>\\s*(\\d+\\.\\s*)?${escapedTitleText}\\s*</h[123]>`, 'gi'),
    ];
    
    let cleaned = content;
    for (const pattern of patterns) {
      cleaned = cleaned.replace(pattern, '');
    }
    
    return cleaned.trim();
  }

  /**
   * Formats HTML content for PDF export
   */
  private formatContentForPdf(content: string): string {
    if (!content) return '';
    
    let cleaned = content.trim();
    cleaned = cleaned.replace(/<p>\s*<\/p>/gi, '');
    cleaned = cleaned.replace(/<p><\/p>/gi, '');
    cleaned = cleaned.replace(/>\s+</g, '><');
    cleaned = cleaned.replace(/\n\s*\n\s*\n+/g, '\n');
    cleaned = cleaned.replace(/<div[^>]*>\s*<\/div>/gi, '');
    
    return cleaned.trim();
  }

  /**
   * Creates a temporary HTML element for PDF generation
   */
  private createTempHtmlElement(htmlContent: string): HTMLElement {
    // Create a container div that will hold our content
    const container = document.createElement('div');
    container.style.position = 'fixed';
    container.style.top = '0';
    container.style.left = '0';
    container.style.width = '100vw';
    container.style.height = '100vh';
    container.style.overflow = 'auto';
    container.style.zIndex = '999999';
    container.style.backgroundColor = '#FFFFFF';
    container.style.pointerEvents = 'none';
    
    // Create the actual content div
    const tempDiv = document.createElement('div');
    tempDiv.style.width = '794px'; // A4 width in pixels
    tempDiv.style.maxWidth = '794px';
    tempDiv.style.margin = '0 auto';
    tempDiv.style.padding = '76px'; // 20mm in pixels
    tempDiv.style.fontFamily = 'Arial, sans-serif';
    tempDiv.style.fontSize = '11pt';
    tempDiv.style.lineHeight = '1.5';
    tempDiv.style.color = '#000000';
    tempDiv.style.backgroundColor = '#FFFFFF';
    tempDiv.style.boxSizing = 'border-box';
    tempDiv.style.minHeight = '1123px'; // A4 height
    
    // Set the HTML content
    tempDiv.innerHTML = htmlContent;
    
    // Append to container, then container to body
    container.appendChild(tempDiv);
    document.body.appendChild(container);
    
    // Force multiple reflows to ensure rendering
    void tempDiv.offsetHeight;
    void tempDiv.offsetWidth;
    void tempDiv.scrollHeight;
    void tempDiv.scrollWidth;
    
    // Return the content div (html2canvas will work with it)
    return tempDiv;
  }

  /**
   * Generates the full HTML document for PDF export
   */
  private generateHtmlDocument(data: {
    sections: Section[];
    generatedContent: { [key: string]: string };
    projectContext: string;
    coverPageSettings?: any;
  }): string {
    const { sections, generatedContent, projectContext, coverPageSettings } = data;
    
    const sectionsToExport = sections;
    
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          * {
            box-sizing: border-box;
          }
          
          body {
            font-family: 'Arial', 'Calibri', sans-serif;
            font-size: 11pt;
            line-height: 1.5;
            color: #000000;
            margin: 0;
            padding: 0;
            background-color: #FFFFFF;
            width: 100%;
            min-height: 100vh;
          }
          
          .page-container {
            width: 794px;
            min-height: 1123px;
            padding: 76px;
            background-color: #FFFFFF;
            margin: 0 auto;
          }
          
          h1 {
            color: #8B1A1A;
            font-size: 24pt;
            font-weight: bold;
            margin-top: 0;
            margin-bottom: 12pt;
            page-break-after: avoid;
          }
          
          h2 {
            color: #8B1A1A;
            font-size: 18pt;
            font-weight: bold;
            margin-top: 24pt;
            margin-bottom: 12pt;
            page-break-after: avoid;
            page-break-inside: avoid;
          }
          
          h2:first-of-type {
            margin-top: 0;
          }
          
          h3 {
            color: #333333;
            font-size: 14pt;
            font-weight: bold;
            margin-top: 16pt;
            margin-bottom: 8pt;
            page-break-after: avoid;
          }
          
          h4 {
            color: #555555;
            font-size: 12pt;
            font-weight: bold;
            margin-top: 12pt;
            margin-bottom: 6pt;
          }
          
          p {
            font-size: 11pt;
            margin-top: 0;
            margin-bottom: 12pt;
            text-align: justify;
          }
          
          ul, ol {
            margin-top: 0;
            margin-bottom: 12pt;
            padding-left: 36pt;
          }
          
          li {
            font-size: 11pt;
            margin-top: 0;
            margin-bottom: 6pt;
            line-height: 1.5;
          }
          
          table {
            border-collapse: collapse;
            width: 100%;
            margin-top: 12pt;
            margin-bottom: 12pt;
            page-break-inside: avoid;
          }
          
          th, td {
            border: 1px solid #333333;
            padding: 6pt;
            text-align: left;
            font-size: 10pt;
            vertical-align: top;
          }
          
          th {
            background-color: #f0f0f0;
            font-weight: bold;
            text-align: center;
          }
          
          .section-container {
            page-break-inside: avoid;
            margin-top: 24pt;
            margin-bottom: 24pt;
          }
          
          .section-content {
            margin-top: 12pt;
          }
          
          blockquote {
            margin: 12pt 24pt;
            padding-left: 12pt;
            border-left: 3px solid #8B1A1A;
            font-style: italic;
          }
          
          code {
            font-family: 'Courier New', monospace;
            font-size: 10pt;
            background-color: #f5f5f5;
            padding: 2pt 4pt;
          }
          
          pre {
            font-family: 'Courier New', monospace;
            font-size: 10pt;
            background-color: #f5f5f5;
            padding: 12pt;
            border: 1px solid #ddd;
            overflow-x: auto;
            page-break-inside: avoid;
            margin-top: 0;
            margin-bottom: 12pt;
          }
        </style>
      </head>
      <body>
        <div class="page-container">
        ${this.generateCoverPage(
          projectContext || 'Solution Design Document',
          '',
          coverPageSettings?.version || '1.0',
          coverPageSettings?.date || new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' }),
          coverPageSettings
        )}
        
        <div style="margin-top: 0;">
          ${sectionsToExport.map((section, index) => {
            try {
              let content = generatedContent[section.id];
              
              if (section.id === 'table-of-contents') {
                const sectionsForTOC = sectionsToExport.map(s => ({
                  ...s,
                  displayNumber: typeof s === 'object' && 'displayNumber' in s 
                    ? (s as any).displayNumber 
                    : parseInt((s.title || '').match(/^(\d+)\./)?.[1] || '0')
                }));
                content = generateTableOfContents(sectionsForTOC as any, generatedContent);
                if (!content || content.trim() === '') {
                  content = '<p><em>Table of Contents will be generated once sections are created.</em></p>';
                }
              }
              
              // Skip cover page section in main content (it's already added above)
              if (section.id === 'cover-page') {
                return '';
              }
              
              let sectionHtml = '';
              
              if (index > 0) {
                sectionHtml += '<!-- Section Break -->\n';
              }
              
              sectionHtml += `<div class="section-container" data-section-id="${section.id}" style="margin-bottom: 30px; padding-bottom: 20px; border-bottom: 1px solid #e5e5e5;">`;
              sectionHtml += `<h2 style="color: #8B1A1A; font-size: 18pt; font-weight: bold; margin-top: 24px; margin-bottom: 12px;">${this.escapeHtml(section.title)}</h2>`;
              
              if (content) {
                const cleanedContent = this.removeDuplicateSectionTitle(content, section.title);
                let formattedContent = this.formatContentForPdf(cleanedContent);
                
                if (formattedContent && formattedContent.trim() !== '') {
                  sectionHtml += `<div class="section-content" style="line-height: 1.6;">${formattedContent}</div>`;
                } else {
                  sectionHtml += '<p style="color: #666; font-style: italic;">Content pending generation.</p>';
                }
              } else {
                sectionHtml += '<p style="color: #666; font-style: italic;">Content pending generation.</p>';
              }
              
              sectionHtml += '</div>';
              
              return sectionHtml;
            } catch (error) {
              console.error(`Error processing section ${section.title}:`, error);
              return `<div class="section-container" data-section-id="${section.id}" style="margin-bottom: 30px;">
                <h2 style="color: #8B1A1A; font-size: 18pt; font-weight: bold; margin-top: 24px; margin-bottom: 12px;">${this.escapeHtml(section.title)}</h2>
                <p style="color: #d00; font-style: italic;">Error loading content for this section.</p>
              </div>`;
            }
          }).filter(html => html !== '').join('\n')}
        </div>
        </div>
      </body>
      </html>
    `;
    
    return htmlContent;
  }

  exportToWord(data: {
    sections: Section[];
    generatedContent: { [key: string]: string };
    projectContext: string;
    coverPageSettings?: any;
  }, projectName: string): void {
    // This method is required by IExportAdapter interface but not used for PDF
    // PDF export uses exportToPdf instead
    throw new Error('Use exportToPdf method for PDF export');
  }

  /**
   * Waits for all images in an element to load
   */
  private async waitForImages(element: HTMLElement): Promise<void> {
    const images = element.querySelectorAll('img');
    const imagePromises: Promise<void>[] = [];
    
    images.forEach((img) => {
      if (img.complete) {
        return;
      }
      
      const promise = new Promise<void>((resolve) => {
        img.onload = () => resolve();
        img.onerror = () => {
          // If image fails to load, replace with placeholder or continue
          console.warn('Image failed to load:', img.src);
          resolve(); // Continue even if image fails
        };
        // Timeout after 5 seconds
        setTimeout(() => {
          console.warn('Image load timeout:', img.src);
          resolve();
        }, 5000);
      });
      
      imagePromises.push(promise);
    });
    
    await Promise.all(imagePromises);
    // Additional wait to ensure rendering is complete
    await new Promise(resolve => setTimeout(resolve, 300));
  }

  /**
   * Exports all sections to PDF
   */
  async exportToPdf(data: {
    sections: Section[];
    generatedContent: { [key: string]: string };
    projectContext: string;
    coverPageSettings?: any;
  }, projectName: string): Promise<void> {
    // Variables are used in generateHtmlDocument(data)
    let tempElement: HTMLElement | null = null;
    
    try {
      // Generate HTML document
      const htmlContent = this.generateHtmlDocument(data);
      
      // Validate HTML content
      if (!htmlContent || htmlContent.length < 100) {
        throw new Error('Generated HTML content is too short or empty');
      }
      
      console.log('Generated HTML length:', htmlContent.length);
      console.log('HTML preview:', htmlContent.substring(0, 500));
      
      // Create temporary element
      tempElement = this.createTempHtmlElement(htmlContent);
      
      // Validate element was created
      if (!tempElement || !tempElement.parentNode) {
        throw new Error('Failed to create temporary element');
      }
      
      // Ensure element is visible
      if (!tempElement) {
        throw new Error('Temporary element is null after creation');
      }
      
      tempElement.style.opacity = '1';
      tempElement.style.visibility = 'visible';
      tempElement.style.display = 'block';
      
      // Wait for images to load
      await this.waitForImages(tempElement);
      
      // Force layout recalculation
      const forceReflow = () => {
        if (!tempElement) return;
        void tempElement.offsetHeight;
        void tempElement.offsetWidth;
        void tempElement.scrollHeight;
        void tempElement.scrollWidth;
      };
      
      forceReflow();
      await new Promise(resolve => setTimeout(resolve, 200));
      forceReflow();
      
      // Get actual dimensions (ensure tempElement is not null)
      if (!tempElement) {
        throw new Error('Temporary element became null during processing');
      }
      
      const rect = tempElement.getBoundingClientRect();
      const computedWidth = tempElement.scrollWidth || rect.width || 794;
      const computedHeight = tempElement.scrollHeight || rect.height;
      
      // Log dimensions for debugging
      console.log('Element dimensions:', {
        scrollWidth: tempElement.scrollWidth,
        scrollHeight: tempElement.scrollHeight,
        clientWidth: tempElement.clientWidth,
        clientHeight: tempElement.clientHeight,
        rectWidth: rect.width,
        rectHeight: rect.height,
        computedWidth,
        computedHeight,
        innerHTMLLength: tempElement.innerHTML.length
      });
      
      // Validate that we have content
      if (tempElement.scrollHeight === 0 || computedHeight === 0) {
        console.error('Element has no height. Checking content...');
        console.error('Element innerHTML length:', tempElement.innerHTML.length);
        console.error('Element text content:', tempElement.textContent?.substring(0, 200));
        console.error('Element children count:', tempElement.children.length);
        throw new Error('Element has no height - content may not be rendering. Check console for details.');
      }
      
      // Additional check: ensure we have actual text content
      const textContent = tempElement.textContent || '';
      if (textContent.trim().length < 10) {
        console.warn('Warning: Element has very little text content:', textContent.length, 'characters');
      }
      
      // Additional wait to ensure all resources are loaded and rendered
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Convert to canvas with better error handling
      const canvas = await html2canvas(tempElement, {
        scale: 1.5, // Good balance between quality and performance
        useCORS: true,
        allowTaint: false,
        logging: false, // Disable verbose logging
        backgroundColor: '#FFFFFF',
        width: computedWidth,
        height: computedHeight,
        windowWidth: computedWidth,
        windowHeight: computedHeight,
        removeContainer: false,
        imageTimeout: 15000,
        onclone: (clonedDoc, element) => {
          // Ensure the cloned element is properly styled
          const clonedElement = element as HTMLElement;
          clonedElement.style.opacity = '1';
          clonedElement.style.visibility = 'visible';
          clonedElement.style.display = 'block';
          clonedElement.style.position = 'static';
          clonedElement.style.width = `${computedWidth}px`;
          clonedElement.style.height = 'auto';
          clonedElement.style.minHeight = `${computedHeight}px`;
          
          // Ensure all styles are applied
          const allElements = clonedElement.querySelectorAll('*');
          allElements.forEach((el: Element) => {
            const htmlEl = el as HTMLElement;
            if (htmlEl.style) {
              // Ensure visibility
              if (htmlEl.style.display === 'none') {
                htmlEl.style.display = 'block';
              }
              if (htmlEl.style.visibility === 'hidden') {
                htmlEl.style.visibility = 'visible';
              }
              if (htmlEl.style.opacity === '0') {
                htmlEl.style.opacity = '1';
              }
            }
          });
          
          // Fix any images that might cause issues
          const clonedImages = clonedDoc.querySelectorAll('img');
          clonedImages.forEach((img) => {
            if (!img.complete || !img.naturalWidth) {
              // Replace broken images with placeholder
              img.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iI2VlZSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTQiIGZpbGw9IiM5OTkiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5JbWFnZSBub3QgYXZhaWxhYmxlPC90ZXh0Pjwvc3ZnPg==';
            }
          });
        }
      });
      
      // Validate canvas
      if (!canvas) {
        throw new Error('Canvas is null - html2canvas failed to create canvas');
      }
      
      if (canvas.width === 0 || canvas.height === 0) {
        console.error('Canvas dimensions:', { width: canvas.width, height: canvas.height });
        console.error('Element dimensions:', { 
          scrollWidth: tempElement.scrollWidth, 
          scrollHeight: tempElement.scrollHeight,
          clientWidth: tempElement.clientWidth,
          clientHeight: tempElement.clientHeight
        });
        throw new Error(`Canvas is empty: width=${canvas.width}, height=${canvas.height}`);
      }
      
      console.log('Canvas created successfully:', {
        width: canvas.width,
        height: canvas.height,
        elementWidth: tempElement.scrollWidth,
        elementHeight: tempElement.scrollHeight
      });
      
      // Clean up temporary element and container
      if (tempElement && tempElement.parentNode) {
        const container = tempElement.parentNode;
        if (container && container.parentNode === document.body) {
          document.body.removeChild(container);
        } else if (tempElement.parentNode === document.body) {
      document.body.removeChild(tempElement);
        }
        tempElement = null;
      }
      
      // Get canvas data URL with validation
      let imgData: string;
      try {
        imgData = canvas.toDataURL('image/png', 0.95);
        // Validate the data URL
        if (!imgData || imgData.length < 100 || !imgData.startsWith('data:image/png')) {
          throw new Error('Invalid PNG data generated');
        }
      } catch (dataUrlError) {
        console.error('Error generating data URL:', dataUrlError);
        // Fallback: try with JPEG
        imgData = canvas.toDataURL('image/jpeg', 0.95);
      }
      
      // Calculate PDF dimensions (A4: 210mm x 297mm)
      const pdfWidth = 210; // A4 width in mm
      const pdfHeight = 297; // A4 height in mm
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      
      // Create PDF
      const pdf = new jsPDF('portrait', 'mm', 'a4');
      
      // Calculate how many pages we need
      const pageHeight = pdfHeight;
      const pageWidth = pdfWidth;
      const imgHeightInMM = (imgHeight * pageWidth) / imgWidth;
      let heightLeft = imgHeightInMM;
      let position = 0;
      
      // Determine image format from data URL
      const imageFormat = imgData.startsWith('data:image/png') ? 'PNG' : 'JPEG';
      
      // Add first page
      pdf.addImage(imgData, imageFormat, 0, position, pageWidth, imgHeightInMM);
      heightLeft -= pageHeight;
      
      // Add additional pages if needed
      while (heightLeft > 0) {
        position = heightLeft - imgHeightInMM;
        pdf.addPage();
        pdf.addImage(imgData, imageFormat, 0, position, pageWidth, imgHeightInMM);
        heightLeft -= pageHeight;
      }
      
      // Save PDF
      const fileName = `Solution_Architecture_Design_${(projectName || 'Document').replace(/\s+/g, '_')}.pdf`;
      pdf.save(fileName);
      
      console.log('✅ PDF export completed:', {
        fileName,
        pages: pdf.getNumberOfPages(),
        imageHeight: imgHeightInMM,
        canvasHeight: imgHeight,
        canvasWidth: imgWidth
      });
    } catch (error) {
      // Clean up temporary element and container if it still exists
      if (tempElement && tempElement.parentNode) {
        try {
          const container = tempElement.parentNode;
          if (container && container.parentNode === document.body) {
            document.body.removeChild(container);
          } else if (tempElement.parentNode === document.body) {
            document.body.removeChild(tempElement);
          }
        } catch (cleanupError) {
          console.warn('Error cleaning up temporary element:', cleanupError);
        }
      }
      
      console.error('Error exporting to PDF:', error);
      throw error;
    }
  }
}
