import { CustomSectionEntity } from '../entities/Project';
import { Section } from '../entities/Section';
import { SECTIONS } from './sections';

export interface SectionWithNumbering extends Section {
  displayNumber: number; // The sequential number in the document (e.g., 1, 2, 3)
  originalNumber: string; // The original number from SECTIONS (if any)
}

export interface CustomSectionWithNumbering extends CustomSectionEntity {
  displayNumber: number;
}

export interface NumberedSubsection {
  number: string;
  title: string;
  description: string;
  miniSections?: NumberedSubsection[]; // For nested subsections (e.g., 4.3.1)
}

/**
 * Auto-numbers subsections based on their position and hierarchy
 * Handles nested subsections (mini-sections) like 4.3.1, 4.3.2, etc.
 */
function autoNumberSubsections(
  subsections: Section['subsections'],
  sectionNumber: number
): NumberedSubsection[] {
  if (!subsections || subsections.length === 0) return [];
  
  // Group subsections by their hierarchy level
  // First level subsections (4.1, 4.2, etc.)
  // Second level subsections (4.3.1, 4.3.2, etc.) - identified by being children of a subsection
  
  const numbered: NumberedSubsection[] = [];
  let subsectionIndex = 1;
  
  // Process subsections and detect hierarchy
  for (let i = 0; i < subsections.length; i++) {
    const sub = subsections[i];
    
    // Check if this is a child of the previous subsection
    // This is a simple heuristic: if the title suggests it's a sub-item, treat it as nested
    // For now, we'll use a flat structure but can be enhanced to detect actual hierarchy
    
    // For flat structure: assign sequential numbers
    const number = `${sectionNumber}.${subsectionIndex}`;
    
    numbered.push({
      number,
      title: sub.title,
      description: sub.description
    });
    
    subsectionIndex++;
  }
  
  return numbered;
}

/**
 * Gets all sections (standard + custom) for a project with proper auto-numbering
 */
export function getProjectSections(
  selectedSectionIds: string[] = [],
  customSections: CustomSectionEntity[] = [],
  customSectionSubsections?: { [sectionId: string]: Array<{ number: string; title: string; description: string }> }
): {
  standardSections: SectionWithNumbering[];
  customSections: CustomSectionWithNumbering[];
  allSections: Array<SectionWithNumbering | CustomSectionWithNumbering>;
} {
  // Get selected standard sections in the order they appear in selectedSectionIds
  const selectedStandardSections = selectedSectionIds
    .map(id => SECTIONS.find(s => s.id === id))
    .filter((s): s is Section => s !== undefined);
  
  // Sort custom sections by order if specified
  const sortedCustomSections = [...customSections].sort((a, b) => {
    if (a.order !== undefined && b.order !== undefined) return a.order - b.order;
    if (a.order !== undefined) return -1;
    if (b.order !== undefined) return 1;
    return 0;
  });

  // Auto-number sections starting from 1
  let displayNumber = 1;
  
  const standardSectionsWithNumbering: SectionWithNumbering[] = selectedStandardSections.map(section => {
    // Extract any existing number from title (for backward compatibility)
    const originalMatch = section.title.match(/^(\d+)\.\s*(.+)/);
    const originalNumber = originalMatch ? originalMatch[1] : '';
    const cleanTitle = originalMatch ? originalMatch[2] : section.title;
    
    // Merge predefined subsections with custom ones
    const predefinedSubsections = section.subsections || [];
    const customSubsections = customSectionSubsections?.[section.id] || [];
    const mergedSubsections = [...predefinedSubsections, ...customSubsections];
    
    const sectionWithNumbering: SectionWithNumbering = {
      ...section,
      title: cleanTitle, // Store clean title without number
      displayNumber,
      originalNumber,
      subsections: mergedSubsections, // Use merged subsections
    };
    
    displayNumber++;
    return sectionWithNumbering;
  });

  const customSectionsWithNumbering: CustomSectionWithNumbering[] = sortedCustomSections.map(custom => ({
    ...custom,
    displayNumber: displayNumber++,
  }));

  // Combine and sort all sections
  const allSections = [...standardSectionsWithNumbering, ...customSectionsWithNumbering]
    .sort((a, b) => a.displayNumber - b.displayNumber);

  return {
    standardSections: standardSectionsWithNumbering,
    customSections: customSectionsWithNumbering,
    allSections,
  };
}

/**
 * Renumbers subsections based on the section's display number
 * Auto-numbers all subsections sequentially based on their position
 */
export function renumberSubsections(
  section: SectionWithNumbering | CustomSectionWithNumbering
): Array<{ number: string; title: string; description: string }> {
  const baseNumber = section.displayNumber;
  
  if (!section.subsections || section.subsections.length === 0) {
    return [];
  }
  
  return section.subsections.map((sub, index) => {
    // Auto-number based on position: baseNumber.1, baseNumber.2, etc.
    const number = `${baseNumber}.${index + 1}`;
    
    return {
      ...sub,
      number,
    };
  });
}

/**
 * Gets the title with auto-numbering for display
 */
export function getSectionTitleWithNumbering(
  section: SectionWithNumbering | CustomSectionWithNumbering
): string {
  // Always use displayNumber for numbering
  return `${section.displayNumber}. ${section.title}`;
}

/**
 * Generates Table of Contents HTML from numbered sections
 */
export function generateTableOfContents(
  sections: Array<SectionWithNumbering | CustomSectionWithNumbering>,
  generatedContent: { [key: string]: string } = {}
): string {
  // Filter out sections that shouldn't appear in TOC
  const sectionsForTOC = sections.filter(s => 
    s.id !== 'cover-page' && 
    s.id !== 'table-of-contents' &&
    generatedContent[s.id] // Only include sections with content
  );
  
  if (sectionsForTOC.length === 0) {
    return '<p><em>Table of Contents will be generated once sections are created.</em></p>';
  }
  
  let tocHtml = '<div class="table-of-contents" style="font-size: 14px;">';
  tocHtml += '<div style="display: flex; flex-wrap: wrap; gap: 12px 24px; align-items: center;">';
  
  sectionsForTOC.forEach((section) => {
    const numberedTitle = getSectionTitleWithNumbering(section);
    const renumberedSubs = renumberSubsections(section);
    
    // Add section entry (inline)
    tocHtml += `<span style="display: inline-flex; align-items: center;">
      <a href="#section-${section.id}" style="text-decoration: none; color: #1f2937; font-weight: 600;">
        ${numberedTitle}
      </a>
    </span>`;

    // Add subsections inline immediately after the parent
    if (renumberedSubs.length > 0) {
      renumberedSubs.forEach((sub) => {
        tocHtml += `<span style="display: inline-flex; align-items: center; font-size: 0.92em; color: #4b5563;">
          <a href="#section-${section.id}-${sub.number.replace(/\./g, '-')}" style="text-decoration: none; color: inherit;">
            ${sub.number} ${sub.title}
          </a>
        </span>`;
      });
    }
  });
  
  tocHtml += '</div>';
  tocHtml += '</div>';
  
  return tocHtml;
}
