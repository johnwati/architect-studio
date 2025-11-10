import Anthropic from '@anthropic-ai/sdk';
import { ProjectContext, Section, UploadedFile } from '../../../domain/entities/Section';
import { IGenerateContent } from '../../../domain/ports/IGenerateContent';

export class ClaudeApiAdapter implements IGenerateContent {
  private anthropic: Anthropic;

  constructor() {
    const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY;
    if (!apiKey) {
      console.error('❌ Anthropic API key not found in environment variables');
      console.error('   Please create a .env file in the root directory with:');
      console.error('   VITE_ANTHROPIC_API_KEY=your_api_key_here');
      throw new Error('Anthropic API key not configured. Please set VITE_ANTHROPIC_API_KEY in your .env file.');
    }
    console.log('✅ Anthropic API key found (length:', apiKey.length, 'characters)');
    this.anthropic = new Anthropic({ 
      apiKey,
      dangerouslyAllowBrowser: true 
    });
  }

  private getModel(): string {
    // Allow model override from environment, fallback to default
    // Using claude-3-5-sonnet-20241022 for better file support
    const envModel = import.meta.env.VITE_CLAUDE_MODEL;
    return envModel || 'claude-3-5-sonnet-20241022';
  }

  /**
   * Upload a file to Claude API and return the file ID
   */
  private async uploadFileToClaude(file: File): Promise<string> {
    try {
      console.log(`📤 Uploading file to Claude: ${file.name} (${file.size} bytes, type: ${file.type})`);
      
      // Determine MIME type
      let mimeType = file.type;
      if (!mimeType) {
        if (file.name.endsWith('.pdf')) mimeType = 'application/pdf';
        else if (file.name.endsWith('.docx')) mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
        else if (file.name.endsWith('.doc')) mimeType = 'application/msword';
        else mimeType = 'text/plain';
      }

      // Try using the SDK's beta files upload method with File object directly
      try {
        console.log('Attempting to upload via SDK beta.files.upload()...');
        const fileData = await this.anthropic.beta.files.upload({
          file: file  // Use File object directly
        });
        console.log(`✅ File uploaded successfully via SDK. File ID: ${fileData.id}`);
        
        // Wait a moment to ensure file is processed
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        return fileData.id;
      } catch (sdkError: any) {
        console.warn('SDK file upload failed:', sdkError);
        console.log('Error details:', {
          message: sdkError.message,
          status: sdkError.status,
          error: sdkError.error
        });
        
        // Fallback: Try with Blob
        try {
          console.log('Trying with Blob conversion...');
          const arrayBuffer = await file.arrayBuffer();
          const blob = new Blob([arrayBuffer], { type: mimeType });
          
          const fileData = await this.anthropic.beta.files.upload({
            file: blob
          });
          console.log(`✅ File uploaded successfully via SDK (Blob). File ID: ${fileData.id}`);
          
          // Wait a moment to ensure file is processed
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          return fileData.id;
        } catch (blobError: any) {
          console.error('Blob upload also failed:', blobError);
          
          // Final fallback: Direct API call
          console.log('Trying direct API call...');
          const arrayBuffer = await file.arrayBuffer();
          
          const response = await fetch('https://api.anthropic.com/v1/beta/files', {
            method: 'POST',
            headers: {
              'x-api-key': import.meta.env.VITE_ANTHROPIC_API_KEY,
              'anthropic-version': '2023-06-01',
              'content-type': mimeType,
            },
            body: arrayBuffer,
          });

          if (!response.ok) {
            const errorText = await response.text();
            console.error('Direct API upload failed:', response.status, errorText);
            throw new Error(`Failed to upload file (${response.status}): ${errorText}`);
          }

          const result = await response.json();
          console.log(`✅ File uploaded successfully via direct API. File ID: ${result.id}`);
          
          // Wait a moment to ensure file is processed
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          return result.id;
        }
      }
    } catch (error: any) {
      console.error('❌ All file upload methods failed:', error);
      throw new Error(`Failed to upload file ${file.name}: ${error.message}`);
    }
  }

  async generateSection(
    _sectionId: string,
    sectionTitle: string,
    subsections: Section['subsections'],
    projectContext: ProjectContext,
    uploadedFiles: UploadedFile[]
  ): Promise<string> {
    // Prepare file content blocks for Claude API
    const contentBlocks: Array<{ type: 'text' | 'file'; text?: string; source?: { type: string; data: string; media_type: string } }> = [];
    
    console.log(`📋 Processing ${uploadedFiles.length} file(s) for content generation...`);
    
    // Process files: upload PDFs/Word docs to Claude, include text files as text
    const filePromises = uploadedFiles.map(async (fileData) => {
      console.log(`📄 Processing file: ${fileData.name}`);
      console.log(`   - Status: ${fileData.status}`);
      console.log(`   - Has File object: ${!!fileData.file}`);
      console.log(`   - File size: ${fileData.size} bytes`);
      console.log(`   - File type: ${fileData.type}`);
      
      // If we have the original file and it's a PDF or Word doc, upload it to Claude
      if (fileData.file && (fileData.status === 'pdf' || fileData.status === 'limited')) {
        console.log(`🚀 Attempting to upload ${fileData.name} to Claude API...`);
        try {
          const fileId = await this.uploadFileToClaude(fileData.file);
          console.log(`✅ Successfully uploaded ${fileData.name} to Claude (File ID: ${fileId})`);
          return { type: 'file' as const, fileId, fileName: fileData.name };
        } catch (error: any) {
          console.error(`❌ Failed to upload ${fileData.name} to Claude:`, error);
          console.error(`   Error message: ${error.message}`);
          console.error(`   Error stack: ${error.stack}`);
          console.warn(`⚠️ Falling back to text content for ${fileData.name}`);
          // Fallback to text content if upload fails
          return { type: 'text' as const, content: fileData.content, fileName: fileData.name };
        }
      } else if (fileData.status === 'extracted' && fileData.content && fileData.content.length > 100) {
        // Text files with substantial content: include directly as text
        console.log(`📄 Including ${fileData.name} as text content (${fileData.content.length} chars)`);
        return { type: 'text' as const, content: fileData.content, fileName: fileData.name };
      } else {
        // Fallback for files without content
        console.warn(`⚠️ File ${fileData.name} has no extractable content, using placeholder`);
        console.warn(`   - Status: ${fileData.status}`);
        console.warn(`   - Has file: ${!!fileData.file}`);
        console.warn(`   - Content length: ${fileData.content?.length || 0}`);
        return { type: 'text' as const, content: fileData.content || `[File: ${fileData.name}] Content not available for extraction.`, fileName: fileData.name };
      }
    });

    const processedFiles = await Promise.all(filePromises);
    console.log(`✅ Processed ${processedFiles.length} files. Files uploaded to Claude: ${processedFiles.filter(f => f.type === 'file').length}`);
    
    // Build message content: first add text prompt, then add files
    const subsectionDetails = subsections.map(sub => `${sub.number} ${sub.title}: ${sub.description}`).join('\n');

    const basePrompt = `You are a Principal Enterprise Solutions Architect creating a Solution Architecture Design Document (SDD) for Equity Bank Limited's ${projectContext.name || 'project'}. 

Your role: Produce professional, enterprise-grade architecture documentation that demonstrates deep technical expertise and business understanding. Write as if this document will be presented to C-level executives, technical review boards, and implementation teams.

${uploadedFiles.length > 0 ? `\n=== PROJECT DOCUMENTATION ===\nThe following ${uploadedFiles.length} file(s) have been uploaded. Analyze ALL files thoroughly, especially any BRD (Business Requirements Document) files. Extract ALL specific details including requirement numbers, system names, actors, business rules, and integration points.\n=== END OF PROJECT DOCUMENTATION ===\n` : '\n[No project files uploaded - generate content based on enterprise architecture best practices]\n'}

CRITICAL INSTRUCTIONS:
1. ACT AS PRINCIPAL ARCHITECT: Write with authority, precision, and clarity. Your output should reflect senior-level architecture expertise.

2. EXTRACT ALL BRD DETAILS: Read and extract ALL specific information from uploaded BRD file(s):
   - Project name and description
   - All requirement IDs and descriptions (e.g., FR_1, FR_2)
   - System names (e.g., Johari, Newgen, RLOS, MLOS, etc.)
   - Actor names and roles
   - Business rules and workflows
   - Integration requirements
   - Error codes (e.g., JH-400, JH-401, JH-433)
   - Non-functional requirements

3. USE ACTUAL NAMES: Use the EXACT project name, system names, actors, and requirements from the BRD. Never use generic placeholders.

4. PROFESSIONAL FORMATTING:
   - Use proper paragraphing with clear topic sentences
   - Use headings (## for main sections, ### for subsections)
   - Use bullet points for lists
   - Use numbered lists for sequences or priorities
   - Maintain consistent formatting throughout
   - Use bold for emphasis on key terms/concepts only
   - Write in a clear, professional tone suitable for executive review

5. NO PREAMBLES OR METACOMMENTARY:
   - DO NOT start with phrases like "Based on the Business Requirements Document...", "Here's the Solution Architecture...", "This section is derived from...", "Here's the Introduction section...", "Here is the content...", "The following section...", "Below is..."
   - DO NOT include any introductory phrases, explanations, or meta-commentary
   - DO NOT include notes like "**Note:**", "**Important:**", or any disclaimers
   - DO NOT include phrases like "for the Solution Architecture Design Document" or "based on the provided Business Requirements Document"
   - START DIRECTLY with the actual section content - the first word should be the actual content, not an introduction
   - Output ONLY the section content itself, formatted as professional HTML

6. CONTENT STRUCTURE:
   - Begin immediately with the first heading or paragraph of the actual section content
   - NO introductory sentences, NO explanations, NO context-setting phrases
   - Present information directly and authoritatively as if it's already part of the document
   - Reference BRD details naturally within the content (e.g., "As per Section 4.1 of the BRD...", "According to requirement FR_3...")
   - If information is missing, state: "This aspect requires clarification from business stakeholders" without elaboration
   - Format the document appropriately using proper HTML structure - the AI should determine the best formatting

7. EXTRACT SPECIFICS FROM BRD:
- Project Name: Use exact name from BRD
   - Systems: Use actual system names (Johari, Newgen, RLOS, MLOS, etc.)
   - Actors: Use actual user types (Pension customers, Personal Banking customers, Branch Users)
   - Requirements: Reference specific IDs (FR_1, FR_2, etc.) with descriptions
   - Business Rules: Include exact rules verbatim when possible
   - Error Codes: Include specific codes (JH-400, JH-401, JH-433, JH-434, etc.)
   - Integrations: Include actual systems mentioned

SECTION TO GENERATE: ${sectionTitle}

This section must cover: ${subsectionDetails}

OUTPUT FORMAT - CRITICAL REQUIREMENTS:
- Start IMMEDIATELY with the actual section content - the very first character MUST be "<" (opening HTML tag)
- Output ONLY HTML format - NO plain text, NO markdown syntax
- EVERY piece of content must be wrapped in HTML tags - there should be NO bare text
- Format the document appropriately using proper HTML structure

HTML FORMATTING REQUIREMENTS - MANDATORY (CKEditor 5 Compatible):
1. Headings: Use <h1>, <h2>, <h3>, <h4> for headings - these are fully supported by CKEditor 5
   - Example: <h2>4. Introduction</h2> or <h3>4.1 Problem Statement</h3>
   - DO NOT use <h5> or <h6> unless necessary
   - DO NOT output plain text like "4. Introduction" - it MUST be <h2>4. Introduction</h2>

2. Paragraphs: EVERY paragraph must be wrapped in <p> tags
   - Example: <p>Equity Bank has identified a critical gap...</p>
   - DO NOT output plain text paragraphs - they MUST be wrapped in <p> tags
   - Use empty <p></p> tags for spacing between sections if needed

3. Lists: Use <ul> for unordered lists and <ol> for ordered lists, with <li> for each item
   - Example: <ul><li>Customer Master Data</li><li>Loan Product Master Data</li></ul>
   - DO NOT output plain text like "- Customer Master Data" - use proper HTML list tags
   - Lists can contain nested lists: <ul><li>Item 1<ul><li>Sub-item</li></ul></li></ul>

4. Formatting: Use semantic HTML tags that CKEditor 5 supports:
   - <strong> or <b> for bold text
   - <em> or <i> for italic text
   - <u> for underline (if needed)
   - <br> for line breaks within paragraphs
   - <blockquote> for quotes
   - <code> for inline code
   - <pre> for code blocks

5. Tables: Use proper HTML table structure (CKEditor 5 fully supports tables):
   - <table> with <thead>, <tbody>, <tfoot> (optional)
   - <tr> for rows
   - <th> for header cells
   - <td> for data cells
   - Example: <table><thead><tr><th>Header</th></tr></thead><tbody><tr><td>Data</td></tr></tbody></table>

6. Structure: Properly nest HTML elements - headings contain only text, paragraphs contain text, lists contain list items
   - DO NOT nest block elements inside inline elements
   - DO NOT put block elements inside <p> tags (except inline elements like <strong>, <em>)

7. CKEditor 5 Compatibility Requirements:
   - Use clean, semantic HTML5 - CKEditor 5 works best with standard HTML
   - Avoid inline styles unless necessary (CKEditor 5 may strip some styles)
   - Avoid deprecated HTML tags
   - Use proper closing tags for all elements
   - DO NOT use <div> inside <p> tags
   - DO NOT use <span> for block-level content
   - Keep HTML structure clean and well-formed

CORRECT OUTPUT EXAMPLE (CKEditor 5 Compatible):
<h2>4. Introduction</h2>

<h3>4.1 Problem Statement</h3>

<p>Equity Bank has identified a critical gap in its digital lending process where several customer loan applications are being automatically rejected by the Johari credit scoring system. These rejections occur due to various specific error conditions, potentially resulting in lost business opportunities and customer dissatisfaction.</p>

<h3>4.2 Solution Overview</h3>

<p>The Mobile Loan Refer solution introduces a streamlined workflow that enables rejected loan applications to be routed to branch users for manual review and potential approval. This approach transforms what would have been outright rejections into opportunities for personalized credit assessment.</p>

<h3>4.3 Solution Scope</h3>

<h4>4.3.1 Master Data Domains In Scope</h4>

<ul>
<li>Customer Master Data</li>
<li>Loan Product Master Data</li>
<li>Branch Master Data</li>
<li>Credit Scoring Master Data</li>
</ul>

<h4>4.3.2 Applications In Scope</h4>

<ul>
<li>Johari Credit Scoring System</li>
<li>Newgen Workflow Management System</li>
<li>RLOS (Retail Loan Origination System)</li>
<li>MLOS (Micro Loan Origination System)</li>
<li>Equity Mobile App</li>
<li>Equity Web Platform</li>
<li>USSD Channel</li>
<li>STK Channel</li>
</ul>

<h4>4.3.3 Countries In Scope</h4>

<ul>
<li>Kenya (Primary Implementation)</li>
</ul>

<p></p>

<p>This example shows proper CKEditor 5 compatible HTML structure with clean semantic tags, proper nesting, and no inline styles or deprecated elements.</p>

INCORRECT OUTPUT (DO NOT DO THIS):
4. Introduction

4.1 Problem Statement

Equity Bank has identified...

CRITICAL OUTPUT RULES:
1. The FIRST character of your output MUST be "<" (opening HTML tag)
2. EVERY piece of text must be inside an HTML tag - NO bare text
3. DO NOT include phrases like "Here's the...", "Below is...", "The following..."
4. DO NOT output plain text with just numbers and titles - use proper HTML headings
5. DO NOT output markdown-style lists with dashes - use <ul> and <li> tags
6. Output ONLY properly formatted HTML that can be directly rendered in a browser
7. Ensure HTML is CKEditor 5 compatible - use clean semantic HTML5 tags only

CKEditor 5 Compatibility Checklist:
- ✅ Use standard HTML5 semantic tags: <h1>-<h4>, <p>, <ul>, <ol>, <li>, <strong>, <em>, <table>, etc.
- ✅ Properly close all tags
- ✅ Avoid inline styles (use semantic tags instead)
- ✅ Avoid deprecated HTML tags
- ✅ Proper nesting (no block elements inside inline elements)
- ✅ Clean, well-formed HTML structure
- ❌ DO NOT use <div> inside <p> tags
- ❌ DO NOT use complex inline styles
- ❌ DO NOT use deprecated HTML4 tags

IMPORTANT: Your output must be valid, well-formatted HTML that is fully compatible with CKEditor 5. Every heading, paragraph, and list item must be properly wrapped in HTML tags. The HTML should be clean, semantic, and ready to be loaded directly into CKEditor 5 without any modifications. The output should render beautifully in a browser with proper formatting, spacing, and structure.`;

    // Start with the base prompt as text
    contentBlocks.push({ type: 'text', text: basePrompt });

    // Add processed files
    for (const file of processedFiles) {
      if (file.type === 'file') {
        // File uploaded to Claude - reference it
        contentBlocks.push({
          type: 'text',
          text: `\n[Reference: ${file.fileName} - This file has been uploaded to Claude for analysis]`
        });
      } else {
        // Text content - include directly
        contentBlocks.push({
          type: 'text',
          text: `\n=== FILE: ${file.fileName} ===\n${file.content}\n=== END OF FILE ===\n`
        });
      }
    }

    try {
      // Build messages array with file references
      const messageContent: any[] = contentBlocks.map(block => {
        if (block.type === 'text') {
          return { type: 'text', text: block.text || '' };
        }
        return block;
      });

      // Find files that were uploaded to Claude and add them to the message
      // Anthropic API format: { type: "file", source: { type: "file", file_id: "..." } }
      const fileBlocks = processedFiles
        .filter(f => f.type === 'file')
        .map(f => {
          const fileId = (f as any).fileId;
          console.log(`📎 Adding file to message: ${(f as any).fileName} (ID: ${fileId})`);
          return { 
            type: 'file' as const, 
            source: { 
              type: 'file' as const, 
              file_id: fileId 
            } 
          };
        });

      // Combine text blocks and file blocks
      // Text content should come first, then files
      const textBlocks = messageContent.filter(b => b.type === 'text').map(b => ({
        type: 'text' as const,
        text: (b as any).text || ''
      }));

      const finalContent: any[] = [
        ...textBlocks,
        ...fileBlocks
      ];

      console.log(`📤 Sending message to Claude with ${textBlocks.length} text block(s) and ${fileBlocks.length} file(s)`);
      console.log('Content structure:', finalContent.map(b => ({ type: b.type, ...(b.type === 'file' ? { file_id: (b as any).source?.file_id } : {}) })));

      // Validate file IDs before sending
      if (fileBlocks.length > 0) {
        console.log('📎 File blocks being sent:', fileBlocks.length);
        console.log('File IDs:', fileBlocks.map(f => (f as any).source?.file_id));
        console.log('File block structure:', JSON.stringify(fileBlocks, null, 2));
        
        // Verify file IDs are valid format (should start with "file_")
        for (const fileBlock of fileBlocks) {
          const fileId = (fileBlock as any).source?.file_id;
          if (!fileId || typeof fileId !== 'string') {
            console.error('❌ Invalid file ID format:', fileId);
            throw new Error('Invalid file ID format');
          }
          if (!fileId.startsWith('file_')) {
            console.warn('⚠️ File ID does not start with "file_":', fileId);
          }
        }
      } else {
        console.warn('⚠️ No files are being sent to Claude!');
        console.warn('   - Check if files were uploaded successfully');
        console.warn('   - Check if File objects were reconstructed from base64');
      }

      console.log(`📤 Sending message to Claude API...`);
      console.log(`📋 Final content structure:`, {
        totalBlocks: finalContent.length,
        textBlocks: finalContent.filter(b => b.type === 'text').length,
        fileBlocks: finalContent.filter(b => b.type === 'file').length,
        contentPreview: finalContent.map(b => ({
          type: b.type,
          ...(b.type === 'text' ? { textLength: (b as any).text?.length } : {}),
          ...(b.type === 'file' ? { fileId: (b as any).source?.file_id } : {})
        }))
      });
      
      const message = await this.anthropic.messages.create({
        model: this.getModel(),
        max_tokens: 8000,
        messages: [
          { role: 'user', content: finalContent }
        ]
      });

      console.log(`✅ Received response from Claude`);
      console.log('Response content blocks:', message.content.length);
      console.log('Response content structure:', message.content.map(b => ({
        type: b.type,
        ...(b.type === 'text' ? { textLength: (b as any).text?.length, textPreview: (b as any).text?.substring(0, 100) } : {})
      })));

      // Extract text content from the response
      let textContent = '';
      for (const block of message.content) {
        if (block.type === 'text') {
          const blockText = (block as any).text || '';
          if (blockText) {
            textContent += blockText + '\n';
          }
        } else {
          console.warn('Received non-text content block:', block.type);
        }
      }

      const trimmedContent = textContent.trim();
      
      if (!trimmedContent) {
        console.error('❌ Received empty response from Claude API');
        throw new Error('Received empty response from Claude API. The API returned no text content.');
      }

      console.log(`✅ Extracted ${trimmedContent.length} characters of content`);
      return trimmedContent;
    } catch (error: any) {
      console.error('Claude API Error:', error);
      
      // Provide more detailed error messages
      let errorMessage = 'Failed to generate content';
      
      if (error.message) {
        errorMessage = error.message;
      } else if (error.cause) {
        errorMessage = error.cause.message || error.cause.toString();
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
      
      // Check for specific error types
      if (errorMessage.includes('fetch') || errorMessage.includes('network') || errorMessage.includes('Connection')) {
        errorMessage = 'Connection error. Please check:\n- Your Claude API key is configured in .env\n- You have an active internet connection\n- Try refreshing the page';
      } else if (errorMessage.includes('401') || errorMessage.includes('authentication') || errorMessage.includes('API key')) {
        errorMessage = 'Authentication error. Please check your Claude API key in .env file (VITE_ANTHROPIC_API_KEY)';
      } else if (errorMessage.includes('429') || errorMessage.includes('rate limit')) {
        errorMessage = 'Rate limit exceeded. Please wait a moment and try again.';
      } else if (errorMessage.includes('500') || errorMessage.includes('server')) {
        errorMessage = 'Server error. Please try again in a moment.';
      }
      
      throw new Error(`Claude API Error: ${errorMessage}`);
    }
  }

  /**
   * Generate ADR content (Context, Decision, or Consequences) using AI
   */
  async generateADRContent(
    adrTitle: string,
    fieldType: 'context' | 'decision' | 'consequences',
    projectContext: ProjectContext,
    uploadedFiles: UploadedFile[],
    existingContext?: string,
    existingDecision?: string
  ): Promise<string> {
    // Prepare file content blocks for Claude API
    const contentBlocks: Array<{ type: 'text' | 'file'; text?: string; source?: { type: string; data: string; media_type: string } }> = [];
    
    console.log(`📋 Processing ${uploadedFiles.length} file(s) for ADR ${fieldType} generation...`);
    
    // Process files: upload PDFs/Word docs to Claude, include text files as text
    const filePromises = uploadedFiles.map(async (fileData) => {
      if (fileData.file && (fileData.status === 'pdf' || fileData.status === 'limited')) {
        try {
          const fileId = await this.uploadFileToClaude(fileData.file);
          console.log(`✅ Successfully uploaded ${fileData.name} to Claude (File ID: ${fileId})`);
          return { type: 'file' as const, fileId, fileName: fileData.name };
        } catch (error: any) {
          console.warn(`⚠️ Falling back to text content for ${fileData.name}`);
          return { type: 'text' as const, content: fileData.content, fileName: fileData.name };
        }
      } else if (fileData.status === 'extracted' && fileData.content && fileData.content.length > 100) {
        return { type: 'text' as const, content: fileData.content, fileName: fileData.name };
      } else {
        return { type: 'text' as const, content: fileData.content || `[File: ${fileData.name}] Content not available.`, fileName: fileData.name };
      }
    });

    const processedFiles = await Promise.all(filePromises);
    
    // Build prompt based on field type
    let fieldPrompt = '';
    let fieldDescription = '';
    
    switch (fieldType) {
      case 'context':
        fieldDescription = 'Context';
        fieldPrompt = `Generate the CONTEXT section for this Architecture Decision Record. The context should describe:
- The situation or problem that led to this decision
- The technical or business context in which this decision is being made
- Any constraints, requirements, or forces that influenced the decision
- The current state of the system or architecture
- Why this decision needs to be made now

The context should provide enough background for readers to understand why this decision was necessary.`;
        break;
      case 'decision':
        fieldDescription = 'Decision';
        fieldPrompt = `Generate the DECISION section for this Architecture Decision Record. The decision should clearly state:
- What decision was made
- The chosen approach or solution
- Any specific technologies, patterns, or frameworks selected
- Key design choices and their rationale

The decision should be clear, specific, and actionable.${existingContext ? `\n\nUse the following context as reference:\n${existingContext.substring(0, 1000)}` : ''}`;
        break;
      case 'consequences':
        fieldDescription = 'Consequences';
        fieldPrompt = `Generate the CONSEQUENCES section for this Architecture Decision Record. The consequences should describe:
- Positive outcomes and benefits of this decision
- Negative outcomes, trade-offs, and risks
- Impact on other systems, teams, or processes
- Long-term implications
- What becomes easier or harder as a result of this decision

The consequences should be honest and comprehensive, covering both positive and negative aspects.${existingDecision ? `\n\nUse the following decision as reference:\n${existingDecision.substring(0, 1000)}` : ''}`;
        break;
    }

    const basePrompt = `You are a Principal Enterprise Solutions Architect creating Architecture Decision Records (ADRs) for Equity Bank Limited's ${projectContext.name || 'project'}: ${projectContext.description || ''}.

${uploadedFiles.length > 0 ? `\n=== PROJECT DOCUMENTATION ===\nThe following ${uploadedFiles.length} file(s) have been uploaded. Analyze ALL files thoroughly, especially any BRD (Business Requirements Document) files, technical specifications, and architecture diagrams. Extract ALL specific details including requirement numbers, system names, actors, business rules, and integration points.\n=== END OF PROJECT DOCUMENTATION ===\n` : '\n[No project files uploaded - generate content based on enterprise architecture best practices]\n'}

ARCHITECTURE DECISION RECORD: ${adrTitle}

${fieldPrompt}

CRITICAL INSTRUCTIONS:
1. ACT AS PRINCIPAL ARCHITECT: Write with authority, precision, and clarity. Your output should reflect senior-level architecture expertise.

2. EXTRACT ALL BRD DETAILS: If BRD files are provided, read and extract ALL specific information:
   - Project name and description
   - All requirement IDs and descriptions
   - System names (e.g., Johari, Newgen, RLOS, MLOS, etc.)
   - Actor names and roles
   - Business rules and workflows
   - Integration requirements
   - Technical constraints

3. USE ACTUAL NAMES: Use the EXACT project name, system names, actors, and requirements from the documentation. Never use generic placeholders.

4. PROFESSIONAL FORMATTING:
   - Use proper HTML formatting with <p> tags for paragraphs
   - Use <ul> and <li> for lists
   - Use <h3> for subsections if needed
   - Use <strong> for emphasis on key terms
   - Write in a clear, professional tone suitable for technical review

5. NO PREAMBLES OR METACOMMENTARY:
   - DO NOT start with phrases like "Based on...", "Here's the...", "This section...", "The following..."
   - START DIRECTLY with the actual content - the first word should be the actual content
   - Output ONLY the ${fieldDescription} content itself, formatted as professional HTML

6. CONTENT STRUCTURE:
   - Begin immediately with the first paragraph of the actual content
   - NO introductory sentences, NO explanations, NO context-setting phrases
   - Present information directly and authoritatively
   - Reference project details naturally within the content
   - If information is missing, state it clearly without elaboration

OUTPUT FORMAT - CRITICAL REQUIREMENTS:
- Start IMMEDIATELY with the actual content - the very first character MUST be "<" (opening HTML tag)
- Output ONLY HTML format - NO plain text, NO markdown syntax
- EVERY piece of content must be wrapped in HTML tags - there should be NO bare text
- Format the document appropriately using proper HTML structure

HTML FORMATTING REQUIREMENTS - MANDATORY (CKEditor 5 Compatible):
1. Paragraphs: EVERY paragraph must be wrapped in <p> tags
   - Example: <p>The system requires a scalable architecture...</p>
   - DO NOT output plain text paragraphs

2. Lists: Use <ul> for unordered lists and <ol> for ordered lists, with <li> for each item
   - Example: <ul><li>Requirement 1</li><li>Requirement 2</li></ul>

3. Headings: Use <h3> for subsections if needed
   - Example: <h3>Technical Constraints</h3>

4. Formatting: Use semantic HTML tags:
   - <strong> or <b> for bold text
   - <em> or <i> for italic text

CRITICAL OUTPUT RULES:
1. The FIRST character of your output MUST be "<" (opening HTML tag)
2. EVERY piece of text must be inside an HTML tag - NO bare text
3. DO NOT include phrases like "Here's the...", "Below is...", "The following..."
4. Output ONLY properly formatted HTML that can be directly rendered in a browser
5. Ensure HTML is CKEditor 5 compatible - use clean semantic HTML5 tags only`;

    // Start with the base prompt as text
    contentBlocks.push({ type: 'text', text: basePrompt });

    // Add processed files
    for (const file of processedFiles) {
      if (file.type === 'file') {
        contentBlocks.push({
          type: 'text',
          text: `\n[Reference: ${file.fileName} - This file has been uploaded to Claude for analysis]`
        });
      } else {
        contentBlocks.push({
          type: 'text',
          text: `\n=== FILE: ${file.fileName} ===\n${file.content}\n=== END OF FILE ===\n`
        });
      }
    }

    try {
      // Build messages array with file references
      const messageContent: any[] = contentBlocks.map(block => {
        if (block.type === 'text') {
          return { type: 'text', text: block.text || '' };
        }
        return block;
      });

      // Find files that were uploaded to Claude and add them to the message
      const fileBlocks = processedFiles
        .filter(f => f.type === 'file')
        .map(f => {
          const fileId = (f as any).fileId;
          return { 
            type: 'file' as const, 
            source: { 
              type: 'file' as const, 
              file_id: fileId 
            } 
          };
        });

      const textBlocks = messageContent.filter(b => b.type === 'text').map(b => ({
        type: 'text' as const,
        text: (b as any).text || ''
      }));

      const finalContent: any[] = [
        ...textBlocks,
        ...fileBlocks
      ];

      console.log(`📤 Sending ADR ${fieldType} generation request to Claude...`);
      
      const message = await this.anthropic.messages.create({
        model: this.getModel(),
        max_tokens: 4000,
        messages: [
          { role: 'user', content: finalContent }
        ]
      });

      // Extract text content from the response
      let textContent = '';
      for (const block of message.content) {
        if (block.type === 'text') {
          const blockText = (block as any).text || '';
          if (blockText) {
            textContent += blockText + '\n';
          }
        }
      }

      const trimmedContent = textContent.trim();
      
      if (!trimmedContent) {
        throw new Error('Received empty response from Claude API.');
      }

      console.log(`✅ Generated ADR ${fieldType} content (${trimmedContent.length} characters)`);
      return trimmedContent;
    } catch (error: any) {
      console.error('Claude API Error:', error);
      
      let errorMessage = 'Failed to generate ADR content';
      if (error.message) {
        errorMessage = error.message;
      }
      
      throw new Error(`Claude API Error: ${errorMessage}`);
    }
  }

  async generateCoverPageTemplate(prompt: string): Promise<string> {
    try {
      const systemPrompt = `You are a senior brand designer crafting high-end enterprise cover pages for Solution Design Documents.Produce polished HTML snippets with inline styles only (no <script>, no external CSS).Each template must:
- Feature a hero treatment suitable for executive audiences
- Include prominent areas for project name, version, date, author and optional disclaimers
- Work on both light and dark backgrounds (use gradients, overlays, tasteful borders)
- Use web-safe fonts (e.g., 'Segoe UI', 'Helvetica Neue', 'Arial', 'Georgia')
- Remain responsive inside an A4/Letter portrait layout (max width 960px)
- Avoid absolute positioning that would break when exported to PDF
- Keep colour palette professional (banking/finance friendly)
- Return HTML only. No markdown fences, no explanations.
If placeholders are desired, use tokens like {{PROJECT_NAME}}, {{VERSION}}, {{DATE}}, {{AUTHOR}}, {{ORGANIZATION}}.`;

      const response = await this.anthropic.messages.create({
        model: this.getModel(),
        max_tokens: 2000,
        system: systemPrompt,
        messages: [
          {
            role: 'user',
            content: `Design a premium cover page for the Equity Bank Solution Design Document.

User guidance: ${prompt}

Return ONLY the HTML snippet.`
          }
        ]
      });

      let textContent = '';
      for (const block of response.content) {
        if (block.type === 'text') {
          const blockText = (block as any).text || '';
          if (blockText) {
            textContent += blockText;
          }
        }
      }

      const trimmedContent = textContent.trim();
      if (!trimmedContent) {
        throw new Error('Claude returned empty content');
      }

      const cleanedContent = trimmedContent
        .replace(/```html\s*/gi, '')
        .replace(/```/g, '')
        .trim();

      if (!cleanedContent.includes('<div')) {
        console.warn('AI cover page result does not contain a <div>; returning raw content');
      }

      return cleanedContent;
    } catch (error: any) {
      console.error('Claude API Error (cover template):', error);
      const message = error?.message || 'Unknown error';
      throw new Error(`Failed to generate cover page template: ${message}`);
    }
  }

  /**
   * Chat with Claude for architecture assistance
   * Supports conversational chat with context awareness
   */
  async chat(
    userMessage: string,
    conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }>,
    projectContext?: { name?: string; description?: string }
  ): Promise<string> {
    try {
      // Build system prompt for architecture assistance
      let systemPrompt = `You are an AI architecture assistant for Equity Bank Limited. You help architects and developers with:

1. **AI Modeler**: Generate draft architecture diagrams or data models from text or system documentation
2. **AI Reviewer**: Assess architectures for risks, compliance, or alignment with standards
3. **AI Mapper**: Auto-link systems and data flows using integration metadata
4. **Chat with Architecture**: Answer questions about system integrations, APIs, and architecture
5. **Pattern Recommender**: Suggest best-fit integration or cloud patterns based on use cases

Your responses should be:
- Clear, professional, and technically accurate
- Context-aware based on the project being discussed
- Actionable with specific recommendations when appropriate
- Formatted with markdown for better readability (use **bold**, *italic*, lists, code blocks, etc.)
- Conversational and helpful

When users ask about:
- Architecture diagrams/models: Provide structured descriptions with components, relationships, and data flows
- Reviews: Assess security, compliance, standards alignment, and provide recommendations
- System mapping: Identify connections, data flows, integration points, and dependencies
- Queries: Answer based on architecture knowledge, system names, and integration patterns
- Patterns: Suggest appropriate integration patterns (API Gateway, Event-Driven, etc.) and cloud patterns (Microservices, Serverless, etc.) with trade-offs

Be concise but thorough. If you need more information, ask clarifying questions.`;

      if (projectContext?.name) {
        systemPrompt += `\n\nCurrent Project Context:\n- Project Name: ${projectContext.name}`;
        
        // Check if description contains artifact content
        const description = projectContext.description || '';
        if (description.includes('=== BUSINESS ARTIFACTS ===') || description.includes('=== TECHNOLOGY ARTIFACTS ===')) {
          // Artifacts are included in description - add them to system prompt
          systemPrompt += `\n\nProject Artifacts Available:\n${description}`;
          systemPrompt += `\n\nWhen answering questions, you have access to the project's business and technology artifacts above. Use information from these artifacts to provide accurate, context-aware responses. Reference specific files, requirements, or technical details from the artifacts when relevant.`;
        } else if (description) {
          systemPrompt += `\n- Description: ${description}`;
        }
        systemPrompt += `\n\nWhen answering questions, consider this project context. Use actual system names and details from the project when relevant.`;
      }

      // Build messages array with conversation history
      const messages: Array<{ role: 'user' | 'assistant'; content: string }> = [];

      // Add conversation history (limit to last 10 messages to avoid token limits)
      const recentHistory = conversationHistory.slice(-10);
      for (const msg of recentHistory) {
        messages.push({
          role: msg.role,
          content: msg.content
        });
      }

      // Add current user message
      messages.push({
        role: 'user',
        content: userMessage
      });

      console.log(`💬 Sending chat message to Claude (${messages.length} messages in context)...`);

      const response = await this.anthropic.messages.create({
        model: this.getModel(),
        max_tokens: 4096,
        system: systemPrompt,
        messages: messages as any
      });

      // Extract text content from the response
      let textContent = '';
      for (const block of response.content) {
        if (block.type === 'text') {
          const blockText = (block as any).text || '';
          if (blockText) {
            textContent += blockText;
          }
        }
      }

      const trimmedContent = textContent.trim();

      if (!trimmedContent) {
        throw new Error('Received empty response from Claude API');
      }

      console.log(`✅ Received chat response from Claude (${trimmedContent.length} characters)`);
      return trimmedContent;
    } catch (error: any) {
      console.error('Claude Chat API Error:', error);

      let errorMessage = 'Failed to process your message';
      if (error.message) {
        errorMessage = error.message;
      }

      // Provide user-friendly error messages
      if (errorMessage.includes('401') || errorMessage.includes('authentication') || errorMessage.includes('API key')) {
        errorMessage = 'Authentication error. Please check your Claude API key in .env file (VITE_ANTHROPIC_API_KEY)';
      } else if (errorMessage.includes('429') || errorMessage.includes('rate limit')) {
        errorMessage = 'Rate limit exceeded. Please wait a moment and try again.';
      } else if (errorMessage.includes('500') || errorMessage.includes('server')) {
        errorMessage = 'Server error. Please try again in a moment.';
      } else if (errorMessage.includes('fetch') || errorMessage.includes('network')) {
        errorMessage = 'Connection error. Please check your internet connection and try again.';
      }

      throw new Error(errorMessage);
    }
  }

  /**
   * Stream chat with Claude for real-time responses
   * Supports streaming with callback for each chunk
   * Can include artifacts as file uploads or text content
   */
  async chatStream(
    userMessage: string,
    conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }>,
    projectContext: { name?: string; description?: string } | undefined,
    artifacts: Array<{ id: string; fileName: string; fileType: string; fileContent: string; artifactType: string }>,
    onChunk: (chunk: string) => void
  ): Promise<string> {
    try {
      // Build system prompt (same as regular chat)
      let systemPrompt = `You are an AI architecture assistant for Equity Bank Limited. You help architects and developers with:

1. **AI Modeler**: Generate draft architecture diagrams or data models from text or system documentation
2. **AI Reviewer**: Assess architectures for risks, compliance, or alignment with standards
3. **AI Mapper**: Auto-link systems and data flows using integration metadata
4. **Chat with Architecture**: Answer questions about system integrations, APIs, and architecture
5. **Pattern Recommender**: Suggest best-fit integration or cloud patterns based on use cases

Your responses should be:
- Clear, professional, and technically accurate
- Context-aware based on the project being discussed
- Actionable with specific recommendations when appropriate
- Formatted with markdown for better readability (use **bold**, *italic*, lists, code blocks, etc.)
- Conversational and helpful

When users ask about:
- Architecture diagrams/models: Provide structured descriptions with components, relationships, and data flows
- Reviews: Assess security, compliance, standards alignment, and provide recommendations
- System mapping: Identify connections, data flows, integration points, and dependencies
- Queries: Answer based on architecture knowledge, system names, and integration patterns
- Patterns: Suggest appropriate integration patterns (API Gateway, Event-Driven, etc.) and cloud patterns (Microservices, Serverless, etc.) with trade-offs

Be concise but thorough. If you need more information, ask clarifying questions.`;

      if (projectContext?.name) {
        systemPrompt += `\n\nCurrent Project Context:\n- Project Name: ${projectContext.name}`;
        if (projectContext.description) {
          systemPrompt += `\n- Description: ${projectContext.description}`;
        }
        systemPrompt += `\n\nWhen answering questions, consider this project context. Use actual system names and details from the project when relevant.`;
      }

      // Add information about artifacts if they're being included
      if (artifacts && artifacts.length > 0) {
        systemPrompt += `\n\nIMPORTANT: The user has included ${artifacts.length} project artifact(s) with their message. These artifacts contain critical information about the project including:
- Business requirements and specifications
- Technical documentation
- Architecture diagrams and flows
- System integration details

You MUST:
1. Analyze ALL provided artifacts thoroughly
2. Extract specific details, requirements, system names, and technical specifications
3. Reference information from the artifacts in your responses
4. Use exact names, IDs, and details from the artifacts (don't use placeholders)
5. If asked about something covered in the artifacts, provide detailed answers based on the artifact content

The artifacts will be provided as file attachments or text content in the user's message.`;
      }

      // Process artifacts: upload PDFs/Word docs to Claude, include text files as text
      const artifactContentBlocks: any[] = [];
      
      if (artifacts && artifacts.length > 0) {
        console.log(`📎 Processing ${artifacts.length} artifact(s) for chat...`);
        
        for (const artifact of artifacts) {
          try {
            // Check if this is a PDF with base64 data stored
            const pdfBase64Match = artifact.fileContent.match(/\[PDF_BASE64_START\]([\s\S]+?)\[PDF_BASE64_END\]/);
            
            if (pdfBase64Match && pdfBase64Match[1]) {
              // Recreate File object from base64 for PDF upload
              try {
                const base64 = pdfBase64Match[1].trim();
                const binaryString = atob(base64);
                const bytes = new Uint8Array(binaryString.length);
                for (let i = 0; i < binaryString.length; i++) {
                  bytes[i] = binaryString.charCodeAt(i);
                }
                const blob = new Blob([bytes], { type: 'application/pdf' });
                const file = new File([blob], artifact.fileName, { type: 'application/pdf' });
                
                // Upload PDF to Claude
                const fileId = await this.uploadFileToClaude(file);
                console.log(`✅ Uploaded artifact to Claude: ${artifact.fileName} (ID: ${fileId})`);
                
                artifactContentBlocks.push({
                  type: 'file',
                  source: {
                    type: 'file',
                    file_id: fileId
                  }
                });
              } catch (uploadError) {
                console.warn(`⚠️ Failed to upload ${artifact.fileName}, using text content instead:`, uploadError);
                // Fallback to text content
                const textContent = artifact.fileContent.replace(/\[PDF_BASE64_START\][\s\S]+?\[PDF_BASE64_END\]/, '').trim();
                if (textContent) {
                  artifactContentBlocks.push({
                    type: 'text',
                    text: `\n=== ARTIFACT: ${artifact.fileName} (${artifact.artifactType}) ===\n${textContent.substring(0, 10000)}\n=== END OF ARTIFACT ===\n`
                  });
                }
              }
            } else {
              // Text content - include directly
              const textContent = artifact.fileContent.trim();
              if (textContent && textContent.length > 0) {
                artifactContentBlocks.push({
                  type: 'text',
                  text: `\n=== ARTIFACT: ${artifact.fileName} (${artifact.artifactType}) ===\n${textContent.substring(0, 10000)}\n=== END OF ARTIFACT ===\n`
                });
              }
            }
          } catch (error) {
            console.error(`Error processing artifact ${artifact.fileName}:`, error);
          }
        }
      }

      // Build messages array
      const messages: Array<{ role: 'user' | 'assistant'; content: any }> = [];
      const recentHistory = conversationHistory.slice(-10);
      for (const msg of recentHistory) {
        messages.push({
          role: msg.role,
          content: msg.content
        });
      }

      // Build user message with artifacts
      const userMessageContent: any[] = [
        { type: 'text', text: userMessage }
      ];
      
      // Add artifact content blocks
      if (artifactContentBlocks.length > 0) {
        userMessageContent.push(...artifactContentBlocks);
        console.log(`📎 Added ${artifactContentBlocks.length} artifact(s) to message`);
      }

      messages.push({
        role: 'user',
        content: userMessageContent
      });

      console.log(`💬 Streaming chat message to Claude with ${artifactContentBlocks.length} artifact(s)...`);

      let fullResponse = '';

      // Use streaming API
      const stream = await this.anthropic.messages.stream({
        model: this.getModel(),
        max_tokens: 4096,
        system: systemPrompt,
        messages: messages as any
      });

      for await (const event of stream) {
        if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
          const chunk = event.delta.text || '';
          fullResponse += chunk;
          onChunk(chunk);
        }
      }

      const trimmedContent = fullResponse.trim();

      if (!trimmedContent) {
        throw new Error('Received empty response from Claude API');
      }

      console.log(`✅ Streamed chat response from Claude (${trimmedContent.length} characters)`);
      return trimmedContent;
    } catch (error: any) {
      console.error('Claude Chat Stream API Error:', error);

      let errorMessage = 'Failed to process your message';
      if (error.message) {
        errorMessage = error.message;
      }

      if (errorMessage.includes('401') || errorMessage.includes('authentication') || errorMessage.includes('API key')) {
        errorMessage = 'Authentication error. Please check your Claude API key in .env file (VITE_ANTHROPIC_API_KEY)';
      } else if (errorMessage.includes('429') || errorMessage.includes('rate limit')) {
        errorMessage = 'Rate limit exceeded. Please wait a moment and try again.';
      } else if (errorMessage.includes('500') || errorMessage.includes('server')) {
        errorMessage = 'Server error. Please try again in a moment.';
      } else if (errorMessage.includes('fetch') || errorMessage.includes('network')) {
        errorMessage = 'Connection error. Please check your internet connection and try again.';
      }

      throw new Error(errorMessage);
    }
  }

  /**
   * Review SDD document - Get all sections and send to AI for comprehensive review
   */
  async reviewSDDDocument(
    sections: Array<{ sectionId: string; sectionTitle: string; content: string }>,
    projectContext: { name?: string; description?: string } | undefined,
    artifacts: Array<{ id: string; fileName: string; fileType: string; fileContent: string; artifactType: string }> = []
  ): Promise<string> {
    try {
      // Build the complete SDD document from all sections
      let sddDocument = '';
      
      if (projectContext?.name) {
        sddDocument += `# Solution Design Document: ${projectContext.name}\n\n`;
        if (projectContext.description) {
          sddDocument += `**Project Description:** ${projectContext.description}\n\n`;
        }
        sddDocument += `---\n\n`;
      }

      sddDocument += `# Complete SDD Document Review\n\n`;
      sddDocument += `This document contains ${sections.length} section(s) for review.\n\n`;
      sddDocument += `---\n\n`;

      // Add each section with its content
      sections.forEach((section, index) => {
        sddDocument += `## Section ${index + 1}: ${section.sectionTitle}\n\n`;
        sddDocument += `**Section ID:** ${section.sectionId}\n\n`;
        sddDocument += `**Content:**\n\n${section.content}\n\n`;
        sddDocument += `---\n\n`;
      });

      // Build system prompt for review
      let systemPrompt = `You are a Principal Enterprise Solutions Architect conducting a comprehensive review of a Solution Design Document (SDD) for Equity Bank Limited.

Your role is to provide a thorough, professional review that assesses:

1. **Completeness**: Are all required sections present and adequately detailed?
2. **Technical Accuracy**: Are the technical specifications correct and feasible?
3. **Architecture Quality**: Does the architecture follow best practices and enterprise patterns?
4. **Security & Compliance**: Are security considerations and compliance requirements addressed?
5. **Clarity & Consistency**: Is the document clear, consistent, and well-structured?
6. **Risk Assessment**: What are the potential risks and how are they mitigated?
7. **Integration Points**: Are integration points clearly defined and documented?
8. **Non-Functional Requirements**: Are performance, scalability, availability requirements addressed?
9. **Alignment with Standards**: Does it align with Equity Bank's architecture standards and guidelines?
10. **Actionable Recommendations**: Provide specific, actionable recommendations for improvement

Your review should be:
- Professional and constructive
- Specific with references to sections and content
- Actionable with clear recommendations
- Prioritized (critical, high, medium, low)
- Formatted with clear headings and structure
- Balanced (highlight strengths as well as areas for improvement)

Format your review using markdown with clear sections:
- Executive Summary
- Strengths
- Areas for Improvement (by priority)
- Critical Issues (if any)
- Recommendations
- Overall Assessment`;

      if (projectContext?.name) {
        systemPrompt += `\n\n**Project Context:**\n- Project Name: ${projectContext.name}`;
        if (projectContext.description) {
          systemPrompt += `\n- Description: ${projectContext.description}`;
        }
      }

      // Process artifacts if provided
      const artifactContentBlocks: any[] = [];
      
      if (artifacts && artifacts.length > 0) {
        console.log(`📎 Processing ${artifacts.length} artifact(s) for SDD review...`);
        
        for (const artifact of artifacts) {
          try {
            // Check if this is a PDF with base64 data stored
            const pdfBase64Match = artifact.fileContent.match(/\[PDF_BASE64_START\]([\s\S]+?)\[PDF_BASE64_END\]/);
            
            if (pdfBase64Match && pdfBase64Match[1]) {
              // Recreate File object from base64 for PDF upload
              try {
                const base64 = pdfBase64Match[1].trim();
                const binaryString = atob(base64);
                const bytes = new Uint8Array(binaryString.length);
                for (let i = 0; i < binaryString.length; i++) {
                  bytes[i] = binaryString.charCodeAt(i);
                }
                const blob = new Blob([bytes], { type: 'application/pdf' });
                const file = new File([blob], artifact.fileName, { type: 'application/pdf' });
                
                // Upload PDF to Claude
                const fileId = await this.uploadFileToClaude(file);
                console.log(`✅ Uploaded artifact to Claude for review: ${artifact.fileName} (ID: ${fileId})`);
                
                artifactContentBlocks.push({
                  type: 'file',
                  source: {
                    type: 'file',
                    file_id: fileId
                  }
                });
              } catch (uploadError) {
                console.warn(`⚠️ Failed to upload ${artifact.fileName}, using text content instead:`, uploadError);
                // Fallback to text content
                const textContent = artifact.fileContent.replace(/\[PDF_BASE64_START\][\s\S]+?\[PDF_BASE64_END\]/, '').trim();
                if (textContent) {
                  artifactContentBlocks.push({
                    type: 'text',
                    text: `\n=== REFERENCE ARTIFACT: ${artifact.fileName} (${artifact.artifactType}) ===\n${textContent.substring(0, 10000)}\n=== END OF ARTIFACT ===\n`
                  });
                }
              }
            } else {
              // Text content - include directly
              const textContent = artifact.fileContent.trim();
              if (textContent && textContent.length > 0) {
                artifactContentBlocks.push({
                  type: 'text',
                  text: `\n=== REFERENCE ARTIFACT: ${artifact.fileName} (${artifact.artifactType}) ===\n${textContent.substring(0, 10000)}\n=== END OF ARTIFACT ===\n`
                });
              }
            }
          } catch (error) {
            console.error(`Error processing artifact ${artifact.fileName}:`, error);
          }
        }

        if (artifactContentBlocks.length > 0) {
          systemPrompt += `\n\n**Reference Artifacts:**\nThe following ${artifactContentBlocks.length} artifact(s) are provided as reference material. Use these to validate the SDD content against the original requirements and specifications.`;
        }
      }

      // Build user message
      const userMessageContent: any[] = [
        { 
          type: 'text', 
          text: `Please conduct a comprehensive review of the following Solution Design Document:\n\n${sddDocument}` 
        }
      ];
      
      // Add artifact content blocks
      if (artifactContentBlocks.length > 0) {
        userMessageContent.push(...artifactContentBlocks);
        console.log(`📎 Added ${artifactContentBlocks.length} reference artifact(s) to review`);
      }

      console.log(`📋 Sending SDD document for review (${sections.length} sections, ${artifactContentBlocks.length} artifacts)...`);

      const response = await this.anthropic.messages.create({
        model: this.getModel(),
        max_tokens: 8192, // Increased for comprehensive reviews
        system: systemPrompt,
        messages: [
          {
            role: 'user',
            content: userMessageContent
          }
        ] as any
      });

      // Extract text content from the response
      let textContent = '';
      for (const block of response.content) {
        if (block.type === 'text') {
          const blockText = (block as any).text || '';
          if (blockText) {
            textContent += blockText;
          }
        }
      }

      const trimmedContent = textContent.trim();

      if (!trimmedContent) {
        throw new Error('Received empty response from Claude API');
      }

      console.log(`✅ Received SDD review from Claude (${trimmedContent.length} characters)`);
      return trimmedContent;
    } catch (error: any) {
      console.error('SDD Review API Error:', error);

      let errorMessage = 'Failed to review SDD document';
      if (error.message) {
        errorMessage = error.message;
      }

      if (errorMessage.includes('401') || errorMessage.includes('authentication') || errorMessage.includes('API key')) {
        errorMessage = 'Authentication error. Please check your Claude API key in .env file (VITE_ANTHROPIC_API_KEY)';
      } else if (errorMessage.includes('429') || errorMessage.includes('rate limit')) {
        errorMessage = 'Rate limit exceeded. Please wait a moment and try again.';
      } else if (errorMessage.includes('500') || errorMessage.includes('server')) {
        errorMessage = 'Server error. Please try again in a moment.';
      } else if (errorMessage.includes('fetch') || errorMessage.includes('network')) {
        errorMessage = 'Connection error. Please check your internet connection and try again.';
      }

      throw new Error(errorMessage);
    }
  }
}

