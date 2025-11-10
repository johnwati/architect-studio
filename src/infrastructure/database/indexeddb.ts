import Dexie, { Table } from 'dexie';
import { ADREntity, ApprovalEntity, ApproverEntity, ArtifactType, ChatMessageEntity, CoverPageTemplateEntity, GeneratedSectionEntity, ProjectArtifactEntity, ProjectEntity, UMLDiagramEntity } from '../../domain/entities/Project';

class SDDGeneratorDatabase extends Dexie {
  projects!: Table<ProjectEntity, string>;
  artifacts!: Table<ProjectArtifactEntity, string>;
  sections!: Table<GeneratedSectionEntity, string>;
  adrs!: Table<ADREntity, string>;
  umlDiagrams!: Table<UMLDiagramEntity, string>;
  approvers!: Table<ApproverEntity, string>;
  approvals!: Table<ApprovalEntity, string>;
  chatMessages!: Table<ChatMessageEntity, string>;
  coverPageTemplates!: Table<CoverPageTemplateEntity, string>;

  constructor() {
    super('SDDGeneratorDB');
    
    this.version(1).stores({
      projects: 'id, name, createdAt',
      artifacts: 'id, projectId, fileName, uploadedAt',
      sections: 'id, [projectId+sectionId], projectId, generatedAt',
    });

    this.version(2).stores({
      projects: 'id, name, createdAt',
      artifacts: 'id, projectId, fileName, uploadedAt',
      sections: 'id, [projectId+sectionId], projectId, generatedAt',
      adrs: 'id, projectId, number, createdAt',
    });

    this.version(3).stores({
      projects: 'id, name, createdAt',
      artifacts: 'id, projectId, fileName, uploadedAt',
      sections: 'id, [projectId+sectionId], projectId, generatedAt',
      adrs: 'id, projectId, number, createdAt',
      umlDiagrams: 'id, projectId, name, diagramType, createdAt',
    });

    // Version 4: Add support for selected sections and custom sections
    this.version(4).stores({
      projects: 'id, name, createdAt',
      artifacts: 'id, projectId, fileName, uploadedAt',
      sections: 'id, [projectId+sectionId], projectId, generatedAt',
      adrs: 'id, projectId, number, createdAt',
      umlDiagrams: 'id, projectId, name, diagramType, createdAt',
    }).upgrade(async (tx) => {
      // Migrate existing projects to include empty selectedSectionIds
      const projects = await tx.table('projects').toArray();
      for (const project of projects) {
        if (!project.selectedSectionIds && !project.customSections) {
          await tx.table('projects').update(project.id, {
            selectedSectionIds: [],
            customSections: []
          });
        }
      }
    });

    // Version 5: Add approvers and approvals
    this.version(5).stores({
      projects: 'id, name, createdAt',
      artifacts: 'id, projectId, fileName, uploadedAt',
      sections: 'id, [projectId+sectionId], projectId, generatedAt',
      adrs: 'id, projectId, number, createdAt',
      umlDiagrams: 'id, projectId, name, diagramType, createdAt',
      approvers: 'id, projectId, email, [projectId+email], addedAt',
      approvals: 'id, projectId, approverId, [projectId+approverId], status, createdAt',
    });

    // Version 6: Add chat messages
    this.version(6).stores({
      projects: 'id, name, createdAt',
      artifacts: 'id, projectId, fileName, uploadedAt',
      sections: 'id, [projectId+sectionId], projectId, generatedAt',
      adrs: 'id, projectId, number, createdAt',
      umlDiagrams: 'id, projectId, name, diagramType, createdAt',
      approvers: 'id, projectId, email, [projectId+email], addedAt',
      approvals: 'id, projectId, approverId, [projectId+approverId], status, createdAt',
      chatMessages: 'id, projectId, timestamp, [projectId+timestamp], createdAt',
    });

    // Version 7: Add cover page templates
    this.version(7).stores({
      projects: 'id, userId, coverPageTemplateId, name, createdAt',
      artifacts: 'id, projectId, fileName, uploadedAt',
      sections: 'id, [projectId+sectionId], projectId, generatedAt',
      adrs: 'id, projectId, number, createdAt',
      umlDiagrams: 'id, projectId, name, diagramType, createdAt',
      approvers: 'id, projectId, email, [projectId+email], addedAt',
      approvals: 'id, projectId, approverId, [projectId+approverId], status, createdAt',
      chatMessages: 'id, projectId, timestamp, [projectId+timestamp], createdAt',
      coverPageTemplates: 'id, userId, name, updatedAt',
    }).upgrade(async (tx) => {
      await tx.table('projects').toCollection().modify((project: ProjectEntity) => {
        if (!project.userId) {
          project.userId = 'local-user';
        }
      });
    });
  }
}

// Create database instance
const db = new SDDGeneratorDatabase();

// Initialize and log when ready
db.open().then(() => {
  console.log('✅ IndexedDB initialized successfully');
}).catch((error) => {
  console.error('❌ IndexedDB initialization error:', error);
});

export { db };

    export type { ArtifactType };

