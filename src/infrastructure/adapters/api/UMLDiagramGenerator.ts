import Anthropic from '@anthropic-ai/sdk';
import { IGenerateUMLDiagram, UMLDiagramTool, UMLDiagramType, UMLGenerationRequest } from '../../../domain/ports/IGenerateUMLDiagram';

export class UMLDiagramGenerator implements IGenerateUMLDiagram {
  private anthropic: Anthropic;

  constructor() {
    const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error('Anthropic API key not configured. Please set VITE_ANTHROPIC_API_KEY in your .env file.');
    }
    this.anthropic = new Anthropic({ 
      apiKey,
      dangerouslyAllowBrowser: true 
    });
  }

  private getModel(): string {
    const envModel = import.meta.env.VITE_CLAUDE_MODEL;
    return envModel || 'claude-3-5-sonnet-20241022';
  }

  private async uploadFileToClaude(file: File): Promise<string> {
    try {
      const mimeType = file.type || 'text/plain';
      
      try {
        const fileData = await this.anthropic.beta.files.upload({
          file: file
        });
        await new Promise(resolve => setTimeout(resolve, 1000));
        return fileData.id;
      } catch (sdkError: any) {
        // Fallback: Try with Blob
        const arrayBuffer = await file.arrayBuffer();
        const blob = new Blob([arrayBuffer], { type: mimeType });
        
        const fileData = await this.anthropic.beta.files.upload({
          file: blob
        });
        await new Promise(resolve => setTimeout(resolve, 1000));
        return fileData.id;
      }
    } catch (error: any) {
      throw new Error(`Failed to upload file ${file.name}: ${error.message}`);
    }
  }

  private getToolSyntaxGuide(tool: UMLDiagramTool, diagramType: UMLDiagramType): string {
    const guides: Record<string, string> = {
      'PLANTUML_CLASS': `PlantUML Class Diagram Syntax:
@startuml
class ClassName {
  +publicField: Type
  -privateField: Type
  +publicMethod(): ReturnType
  -privateMethod(): ReturnType
}
ClassName1 --> ClassName2 : association
@enduml`,

      'PLANTUML_SEQUENCE': `PlantUML Sequence Diagram Syntax:
@startuml
actor User
participant "System A" as A
participant "System B" as B
User -> A: request
A -> B: call
B --> A: response
A --> User: result
@enduml`,

      'MERMAID_CLASS': `Mermaid Class Diagram Syntax:
classDiagram
    class ClassName {
        +Type publicField
        -Type privateField
        +ReturnType publicMethod()
        -ReturnType privateMethod()
    }
    ClassName1 --> ClassName2 : association`,

      'MERMAID_SEQUENCE': `Mermaid Sequence Diagram Syntax:
sequenceDiagram
    actor User
    participant SystemA
    participant SystemB
    User->>SystemA: request
    SystemA->>SystemB: call
    SystemB-->>SystemA: response
    SystemA-->>User: result`,

      'DIAGRAMS_PYTHON_CLASS': `Diagrams Python Class Diagram Syntax:
from diagrams import Diagram, Cluster, Edge
from diagrams.onprem.client import Users, Client
from diagrams.onprem.compute import Server
from diagrams.onprem.database import PostgreSQL

with Diagram("System Architecture", show=False):
    users = Users("Users")
    app = Server("Application")
    db = PostgreSQL("Database")
    users >> app >> db`,

      'GRAPHVIZ_DOT_CLASS': `Graphviz DOT Syntax:
digraph G {
    node [shape=box];
    ClassA [label="ClassA"];
    ClassB [label="ClassB"];
    ClassA -> ClassB [label="association"];
}`,

      'STRUCTURIZR_DSL_ARCHITECTURE': `Structurizr DSL Syntax:
workspace {
    model {
        user = person "User"
        softwareSystem = softwareSystem "System" {
            webapp = container "Web Application"
            database = container "Database"
        }
        user -> webapp "Uses"
        webapp -> database "Stores data in"
    }
}`,

      'C4_PLANTUML_ARCHITECTURE': `C4 Model with PlantUML Syntax:
@startuml
!include https://raw.githubusercontent.com/plantuml-stdlib/C4-PlantUML/master/C4_Container.puml

Person(user, "User", "A user of the system")
System_Boundary(system, "System") {
    Container(webapp, "Web Application", "Java", "Handles requests")
    ContainerDb(database, "Database", "PostgreSQL", "Stores data")
}
Rel(user, webapp, "Uses")
Rel(webapp, database, "Stores data in")
@enduml`,
    };

    const key = `${tool}_${diagramType}`;
    return guides[key] || guides[`${tool}_CLASS`] || `Generate ${diagramType} diagram using ${tool} syntax.`;
  }

  private getDiagramTypeDescription(diagramType: UMLDiagramType): string {
    const descriptions: Record<UMLDiagramType, string> = {
      CLASS: 'Class diagrams show the structure of systems by displaying classes, their attributes, methods, and relationships.',
      SEQUENCE: 'Sequence diagrams show how objects interact in a particular scenario, with messages flowing between objects over time.',
      ACTIVITY: 'Activity diagrams show the flow of control from activity to activity, representing business or technical processes.',
      COMPONENT: 'Component diagrams show the physical components of a system and their relationships.',
      USECASE: 'Use case diagrams show the interactions between actors and the system, representing functional requirements.',
      STATE: 'State diagrams show the state transitions of an object during its lifetime.',
      ER: 'Entity-Relationship diagrams show the structure of a database, including entities, attributes, and relationships.',
      FLOWCHART: 'Flowcharts show the flow of a process or algorithm using different shapes and connectors.',
      ARCHITECTURE: 'Architecture diagrams show the high-level structure of a system, including components and their relationships.',
      DEPLOYMENT: 'Deployment diagrams show the physical deployment of artifacts on nodes.',
      PACKAGE: 'Package diagrams show the organization of packages and their dependencies.',
      OBJECT: 'Object diagrams show instances of classes and their relationships at a specific point in time.',
      COMMUNICATION: 'Communication diagrams show interactions between objects focusing on object structure.',
      TIMING: 'Timing diagrams show the state of objects over time and interactions between them.',
      INTERACTION_OVERVIEW: 'Interaction overview diagrams combine sequence and activity diagrams to show control flow.',
      COMPOSITE_STRUCTURE: 'Composite structure diagrams show the internal structure of a classifier and its collaborations.',
    };
    return descriptions[diagramType] || 'UML diagram';
  }

  async generateDiagram(request: UMLGenerationRequest): Promise<string> {
    const { diagramTool, diagramType, description, context } = request;

    // Prepare file content blocks
    const contentBlocks: Array<{ type: 'text' | 'file'; text?: string; source?: { type: string; file_id: string } }> = [];

    // Process artifacts as knowledge base
    if (context.selectedArtifacts && context.selectedArtifacts.length > 0) {
      console.log(`📚 Processing ${context.selectedArtifacts.length} artifact(s) as knowledge base...`);
      
      for (const artifact of context.selectedArtifacts) {
        try {
          // Try to convert artifact content to File object for upload
          if (artifact.fileContent) {
            // Check if it's a text file or needs conversion
            const isTextFile = artifact.fileType === 'text/plain' || 
                             artifact.fileName.endsWith('.txt') || 
                             artifact.fileName.endsWith('.md') ||
                             artifact.fileName.endsWith('.json');

            if (isTextFile) {
              // Include as text content
              contentBlocks.push({
                type: 'text',
                text: `=== Knowledge Base: ${artifact.fileName} ===\n${artifact.fileContent}\n=== End of ${artifact.fileName} ===\n`
              });
            } else {
              // Try to create a File object from base64 content
              try {
                const base64Match = artifact.fileContent.match(/^data:([^;]+);base64,(.+)$/);
                if (base64Match) {
                  const mimeType = base64Match[1];
                  const base64Data = base64Match[2];
                  const binaryString = atob(base64Data);
                  const bytes = new Uint8Array(binaryString.length);
                  for (let i = 0; i < binaryString.length; i++) {
                    bytes[i] = binaryString.charCodeAt(i);
                  }
                  const blob = new Blob([bytes], { type: mimeType });
                  const file = new File([blob], artifact.fileName, { type: mimeType });
                  
                  if (mimeType.includes('pdf') || mimeType.includes('word') || mimeType.includes('document')) {
                    const fileId = await this.uploadFileToClaude(file);
                    contentBlocks.push({
                      type: 'file',
                      source: {
                        type: 'file',
                        file_id: fileId
                      }
                    });
                  } else {
                    // Include as text
                    contentBlocks.push({
                      type: 'text',
                      text: `=== Knowledge Base: ${artifact.fileName} ===\n${artifact.fileContent.substring(0, 50000)}\n=== End of ${artifact.fileName} ===\n`
                    });
                  }
                } else {
                  // Include as text if not base64
                  contentBlocks.push({
                    type: 'text',
                    text: `=== Knowledge Base: ${artifact.fileName} ===\n${artifact.fileContent.substring(0, 50000)}\n=== End of ${artifact.fileName} ===\n`
                  });
                }
              } catch (error) {
                // Fallback to text
                contentBlocks.push({
                  type: 'text',
                  text: `=== Knowledge Base: ${artifact.fileName} ===\n${artifact.fileContent.substring(0, 50000)}\n=== End of ${artifact.fileName} ===\n`
                });
              }
            }
          }
        } catch (error: any) {
          console.error(`Error processing artifact ${artifact.fileName}:`, error);
        }
      }
    }

    // Build the prompt
    const toolLabel = this.getToolLabel(diagramTool);
    const diagramTypeDesc = this.getDiagramTypeDescription(diagramType);
    const syntaxGuide = this.getToolSyntaxGuide(diagramTool, diagramType);

    let prompt = `You are an expert software architect creating ${diagramTypeDesc} using ${toolLabel}.

PROJECT CONTEXT:
- Project Name: ${context.projectName}
${context.projectDescription ? `- Description: ${context.projectDescription}` : ''}

${context.selectedArtifacts && context.selectedArtifacts.length > 0 
  ? `\n=== KNOWLEDGE BASE ===\nThe following ${context.selectedArtifacts.length} artifact(s) have been provided as context. Analyze them thoroughly to extract relevant information for the diagram:\n${context.selectedArtifacts.map(a => `- ${a.fileName} (${a.artifactType})`).join('\n')}\n=== END KNOWLEDGE BASE ===\n`
  : '\n[No knowledge base artifacts provided - generate diagram based on best practices]\n'}

${description ? `\nUSER REQUIREMENTS:\n${description}\n` : ''}

DIAGRAM SPECIFICATIONS:
- Tool: ${toolLabel}
- Diagram Type: ${diagramType} Diagram
- Syntax Guide:
${syntaxGuide}

CRITICAL INSTRUCTIONS:
1. Generate ONLY the diagram code - no explanations, no markdown formatting, no code blocks
2. Start directly with the diagram syntax (e.g., @startuml for PlantUML, graph TD for Mermaid)
3. Use information from the knowledge base artifacts to create accurate, detailed diagrams
4. Include all relevant classes, components, relationships, and interactions
5. Follow the exact syntax for ${toolLabel}
6. Make the diagram comprehensive and professional
7. If information is missing from the knowledge base, make reasonable architectural assumptions and note them in comments
8. Ensure the code is valid and can be rendered by the target tool

Generate the ${diagramType} diagram code now:`;

    // Add knowledge base content
    if (context.selectedArtifacts && context.selectedArtifacts.length > 0) {
      prompt += '\n\n=== KNOWLEDGE BASE CONTENT ===\n';
    }

    // Prepare messages - build content array properly
    const messageContent: any[] = [];
    
    // Add file blocks first
    for (const block of contentBlocks) {
      if (block.type === 'file' && block.source) {
        messageContent.push({
          type: 'file' as const,
          source: block.source
        });
      } else if (block.type === 'text' && block.text) {
        messageContent.push({
          type: 'text' as const,
          text: block.text
        });
      }
    }
    
    // Add the main prompt
    messageContent.push({
      type: 'text' as const,
      text: prompt
    });

    const messages: Array<{ role: 'user' | 'assistant'; content: any }> = [
      {
        role: 'user',
        content: messageContent
      }
    ];

    try {
      console.log(`🤖 Generating ${diagramType} diagram using ${toolLabel}...`);
      
      const response = await this.anthropic.messages.create({
        model: this.getModel(),
        max_tokens: 4096,
        messages: messages as any,
      });

      let diagramCode = '';
      
      // Extract text from response
      if (response.content && response.content.length > 0) {
        const textContent = response.content
          .filter((block: any) => block.type === 'text')
          .map((block: any) => block.text)
          .join('\n');
        
        diagramCode = textContent.trim();
        
        // Remove markdown code blocks if present
        diagramCode = diagramCode.replace(/^```[\w]*\n?/gm, '').replace(/```$/gm, '').trim();
      }

      if (!diagramCode) {
        throw new Error('No diagram code generated');
      }

      console.log(`✅ Diagram generated successfully (${diagramCode.length} characters)`);
      return diagramCode;
    } catch (error: any) {
      console.error('Error generating UML diagram:', error);
      throw new Error(`Failed to generate diagram: ${error.message}`);
    }
  }

  private getToolLabel(tool: UMLDiagramTool): string {
    const labels: Record<UMLDiagramTool, string> = {
      PLANTUML: 'PlantUML',
      MERMAID: 'Mermaid',
      DIAGRAMS_PYTHON: 'Diagrams Python',
      GRAPHVIZ_DOT: 'Graphviz DOT',
      STRUCTURIZR_DSL: 'Structurizr DSL',
      C4_PLANTUML: 'C4 Model (PlantUML)',
      C4_MERMAID: 'C4 Model (Mermaid)',
      ARCHIMATE: 'ArchiMate',
      D2: 'D2',
      KROKI: 'Kroki',
    };
    return labels[tool] || tool;
  }
}

