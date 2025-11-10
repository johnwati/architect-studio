import { ADREntity, ApprovalEntity, ApproverEntity, ChatMessageEntity, CoverPageTemplateEntity, GeneratedSectionEntity, ProjectArtifactEntity, ProjectEntity, UMLDiagramEntity } from '../../domain/entities/Project';
import { CreateADRInput, CreateApprovalInput, CreateApproverInput, CreateArtifactInput, CreateChatMessageInput, CreateCoverPageTemplateInput, CreateProjectInput, CreateUMLDiagramInput, IProjectRepository, UpdateCoverPageTemplateInput } from '../../domain/ports/IProjectRepository';
import { db } from '../database/indexeddb';

export class IndexedDBProjectRepository implements IProjectRepository {
  async createProject(input: CreateProjectInput): Promise<ProjectEntity> {
    const id = crypto.randomUUID();
    const now = new Date();
    const project: ProjectEntity = {
      id,
      name: input.name,
      description: input.description,
      userId: 'local-user',
      selectedSectionIds: input.selectedSectionIds,
      customSections: input.customSections,
      customSectionSubsections: input.customSectionSubsections,
      coverPageSettings: input.coverPageSettings,
      coverPageTemplateId: input.coverPageTemplateId,
      createdAt: now,
      updatedAt: now,
    };
    await db.projects.add(project);
    return project;
  }

  async getAllProjects(): Promise<ProjectEntity[]> {
    return await db.projects.orderBy('createdAt').reverse().toArray();
  }

  async getProjectById(id: string): Promise<ProjectEntity | null> {
    return (await db.projects.get(id)) || null;
  }

  async updateProject(id: string, input: Partial<CreateProjectInput>): Promise<ProjectEntity> {
    const existing = await db.projects.get(id);
    if (!existing) throw new Error('Project not found');
    
    const updated: ProjectEntity = {
      ...existing,
      ...input,
      updatedAt: new Date(),
    };
    await db.projects.put(updated);
    return updated;
  }

  async deleteProject(id: string): Promise<void> {
    await db.projects.delete(id);
    // Also delete related artifacts, sections, ADRs, UML diagrams, approvers, approvals, and chat messages
    await db.artifacts.where('projectId').equals(id).delete();
    await db.sections.where('projectId').equals(id).delete();
    await db.adrs.where('projectId').equals(id).delete();
    await db.umlDiagrams.where('projectId').equals(id).delete();
    await db.approvers.where('projectId').equals(id).delete();
    await db.approvals.where('projectId').equals(id).delete();
    await db.chatMessages.where('projectId').equals(id).delete();
  }

  async createCoverPageTemplate(input: CreateCoverPageTemplateInput): Promise<CoverPageTemplateEntity> {
    const id = crypto.randomUUID();
    const now = new Date();
    const template: CoverPageTemplateEntity = {
      id,
      userId: 'local-user',
      name: input.name,
      description: input.description,
      content: input.content,
      coverPageSettings: input.coverPageSettings,
      previewImage: input.previewImage,
      createdAt: now,
      updatedAt: now,
    };
    await db.coverPageTemplates.add(template);
    return template;
  }

  async getCoverPageTemplates(): Promise<CoverPageTemplateEntity[]> {
    return await db.coverPageTemplates.orderBy('updatedAt').reverse().toArray();
  }

  async getCoverPageTemplateById(id: string): Promise<CoverPageTemplateEntity | null> {
    return (await db.coverPageTemplates.get(id)) || null;
  }

  async updateCoverPageTemplate(id: string, input: UpdateCoverPageTemplateInput): Promise<CoverPageTemplateEntity> {
    const existing = await db.coverPageTemplates.get(id);
    if (!existing) throw new Error('Cover page template not found');

    const updated: CoverPageTemplateEntity = {
      ...existing,
      ...input,
      previewImage: input.previewImage === null ? undefined : (input.previewImage ?? existing.previewImage),
      updatedAt: new Date(),
    };

    await db.coverPageTemplates.put(updated);
    return updated;
  }

  async deleteCoverPageTemplate(id: string): Promise<void> {
    await db.coverPageTemplates.delete(id);
    await db.projects
      .filter((project) => project.coverPageTemplateId === id)
      .modify({ coverPageTemplateId: undefined });
  }

  async addArtifact(input: CreateArtifactInput): Promise<ProjectArtifactEntity> {
    const id = crypto.randomUUID();
    const now = new Date();
    const artifact: ProjectArtifactEntity = {
      id,
      projectId: input.projectId,
      fileName: input.fileName,
      fileType: input.fileType,
      fileSize: input.fileSize,
      fileContent: input.fileContent,
      artifactType: input.artifactType,
      uploadedAt: now,
    };
    await db.artifacts.add(artifact);
    return artifact;
  }

  async getArtifactsByProject(projectId: string): Promise<ProjectArtifactEntity[]> {
    return await db.artifacts.where('projectId').equals(projectId).sortBy('uploadedAt');
  }

  async deleteArtifact(id: string): Promise<void> {
    await db.artifacts.delete(id);
  }

  async saveGeneratedSection(
    projectId: string,
    sectionId: string,
    sectionTitle: string,
    content: string
  ): Promise<GeneratedSectionEntity> {
    console.log('Saving section:', { projectId, sectionId, sectionTitle, contentLength: content.length });
    
    const existing = await db.sections.where('[projectId+sectionId]').equals([projectId, sectionId]).first();
    
    const now = new Date();
    if (existing) {
      // Update existing
      const updated: GeneratedSectionEntity = {
        ...existing,
        sectionTitle,
        content,
        updatedAt: now,
      };
      await db.sections.put(updated);
      console.log('Section updated in DB:', updated.id);
      return updated;
    } else {
      // Create new
      const section: GeneratedSectionEntity = {
        id: crypto.randomUUID(),
        projectId,
        sectionId,
        sectionTitle,
        content,
        generatedAt: now,
        updatedAt: now,
      };
      await db.sections.add(section);
      console.log('Section added to DB:', section.id);
      return section;
    }
  }

  async getGeneratedSectionsByProject(projectId: string): Promise<GeneratedSectionEntity[]> {
    return await db.sections.where('projectId').equals(projectId).sortBy('generatedAt');
  }

  async getGeneratedSection(projectId: string, sectionId: string): Promise<GeneratedSectionEntity | null> {
    return (await db.sections.where('[projectId+sectionId]').equals([projectId, sectionId]).first()) || null;
  }

  async createADR(input: CreateADRInput): Promise<ADREntity> {
    const id = crypto.randomUUID();
    const now = new Date();
    const adr: ADREntity = {
      id,
      projectId: input.projectId,
      number: input.number,
      title: input.title,
      status: input.status,
      date: input.date,
      context: input.context,
      decision: input.decision,
      consequences: input.consequences,
      createdAt: now,
      updatedAt: now,
    };
    await db.adrs.add(adr);
    return adr;
  }

  async getADRsByProject(projectId: string): Promise<ADREntity[]> {
    return await db.adrs.where('projectId').equals(projectId).sortBy('number');
  }

  async getADRById(id: string): Promise<ADREntity | null> {
    return (await db.adrs.get(id)) || null;
  }

  async updateADR(id: string, input: Partial<CreateADRInput>): Promise<ADREntity> {
    const existing = await db.adrs.get(id);
    if (!existing) throw new Error('ADR not found');
    
    const updated: ADREntity = {
      ...existing,
      ...input,
      updatedAt: new Date(),
    };
    await db.adrs.put(updated);
    return updated;
  }

  async deleteADR(id: string): Promise<void> {
    await db.adrs.delete(id);
  }

  async createUMLDiagram(input: CreateUMLDiagramInput): Promise<UMLDiagramEntity> {
    const id = crypto.randomUUID();
    const now = new Date();
    const diagram: UMLDiagramEntity = {
      id,
      projectId: input.projectId,
      name: input.name,
      description: input.description,
      diagramType: input.diagramType,
      content: input.content,
      format: input.format,
      createdAt: now,
      updatedAt: now,
    };
    await db.umlDiagrams.add(diagram);
    return diagram;
  }

  async getUMLDiagramsByProject(projectId: string): Promise<UMLDiagramEntity[]> {
    return await db.umlDiagrams.where('projectId').equals(projectId).sortBy('createdAt');
  }

  async getUMLDiagramById(id: string): Promise<UMLDiagramEntity | null> {
    return (await db.umlDiagrams.get(id)) || null;
  }

  async updateUMLDiagram(id: string, input: Partial<CreateUMLDiagramInput>): Promise<UMLDiagramEntity> {
    const existing = await db.umlDiagrams.get(id);
    if (!existing) throw new Error('UML Diagram not found');
    
    const updated: UMLDiagramEntity = {
      ...existing,
      ...input,
      updatedAt: new Date(),
    };
    await db.umlDiagrams.put(updated);
    return updated;
  }

  async deleteUMLDiagram(id: string): Promise<void> {
    await db.umlDiagrams.delete(id);
  }

  // Approver operations
  async addApprover(input: CreateApproverInput): Promise<ApproverEntity> {
    const id = crypto.randomUUID();
    const now = new Date();
    const approver: ApproverEntity = {
      id,
      projectId: input.projectId,
      email: input.email,
      name: input.name,
      role: input.role,
      addedAt: now,
      addedBy: input.addedBy,
    };
    await db.approvers.add(approver);
    return approver;
  }

  async getApproversByProject(projectId: string): Promise<ApproverEntity[]> {
    return await db.approvers.where('projectId').equals(projectId).sortBy('addedAt');
  }

  async getApproverById(id: string): Promise<ApproverEntity | null> {
    return (await db.approvers.get(id)) || null;
  }

  async getApproverByEmail(projectId: string, email: string): Promise<ApproverEntity | null> {
    const approvers = await db.approvers.where('projectId').equals(projectId).filter(a => a.email === email).toArray();
    return approvers.length > 0 ? approvers[0] : null;
  }

  async updateApprover(id: string, input: Partial<CreateApproverInput>): Promise<ApproverEntity> {
    const existing = await db.approvers.get(id);
    if (!existing) throw new Error('Approver not found');
    
    const updated: ApproverEntity = {
      ...existing,
      ...input,
    };
    await db.approvers.put(updated);
    return updated;
  }

  async deleteApprover(id: string): Promise<void> {
    // Also delete related approval
    await db.approvals.where('approverId').equals(id).delete();
    await db.approvers.delete(id);
  }

  // Approval operations
  async createApproval(input: CreateApprovalInput): Promise<ApprovalEntity> {
    const existing = await this.getApprovalByApprover(input.projectId, input.approverId);
    const now = new Date();
    
    if (existing) {
      // Update existing approval
      const updated: ApprovalEntity = {
        ...existing,
        status: input.status || existing.status,
        signature: input.signature !== undefined ? input.signature : existing.signature,
        comments: input.comments !== undefined ? input.comments : existing.comments,
        signedAt: input.signature ? now : existing.signedAt,
        approvedAt: input.status === 'APPROVED' || input.status === 'SIGNED' ? now : existing.approvedAt,
        updatedAt: now,
      };
      await db.approvals.put(updated);
      return updated;
    } else {
      // Create new approval
      const id = crypto.randomUUID();
      const approval: ApprovalEntity = {
        id,
        projectId: input.projectId,
        approverId: input.approverId,
        status: input.status || 'PENDING',
        signature: input.signature,
        comments: input.comments,
        signedAt: input.signature ? now : undefined,
        approvedAt: input.status === 'APPROVED' || input.status === 'SIGNED' ? now : undefined,
        createdAt: now,
        updatedAt: now,
      };
      await db.approvals.add(approval);
      return approval;
    }
  }

  async getApprovalsByProject(projectId: string): Promise<ApprovalEntity[]> {
    const approvals = await db.approvals.where('projectId').equals(projectId).sortBy('createdAt');
    // Load approver data for each approval
    for (const approval of approvals) {
      if (approval.approverId) {
        const approver = await this.getApproverById(approval.approverId);
        if (approver) {
          approval.approver = approver;
        }
      }
    }
    return approvals;
  }

  async getApprovalById(id: string): Promise<ApprovalEntity | null> {
    const approval = await db.approvals.get(id);
    if (approval && approval.approverId) {
      const approver = await this.getApproverById(approval.approverId);
      if (approver) {
        approval.approver = approver;
      }
    }
    return approval || null;
  }

  async getApprovalByApprover(projectId: string, approverId: string): Promise<ApprovalEntity | null> {
    return (await db.approvals.where('[projectId+approverId]').equals([projectId, approverId]).first()) || null;
  }

  async updateApproval(id: string, input: Partial<CreateApprovalInput>): Promise<ApprovalEntity> {
    const existing = await db.approvals.get(id);
    if (!existing) throw new Error('Approval not found');
    
    const now = new Date();
    const updated: ApprovalEntity = {
      ...existing,
      status: input.status !== undefined ? input.status : existing.status,
      signature: input.signature !== undefined ? input.signature : existing.signature,
      comments: input.comments !== undefined ? input.comments : existing.comments,
      signedAt: input.signature ? (existing.signedAt || now) : existing.signedAt,
      approvedAt: (input.status === 'APPROVED' || input.status === 'SIGNED') ? (existing.approvedAt || now) : existing.approvedAt,
      updatedAt: now,
    };
    await db.approvals.put(updated);
    return updated;
  }

  async deleteApproval(id: string): Promise<void> {
    await db.approvals.delete(id);
  }

  // Chat message operations
  async addChatMessage(input: CreateChatMessageInput): Promise<ChatMessageEntity> {
    const id = crypto.randomUUID();
    const now = new Date();
    const message: ChatMessageEntity = {
      id,
      projectId: input.projectId,
      role: input.role,
      content: input.content,
      timestamp: input.timestamp,
      capabilityType: input.capabilityType || null,
      createdAt: now,
    };
    await db.chatMessages.add(message);
    return message;
  }

  async getChatMessagesByProject(projectId: string | null): Promise<ChatMessageEntity[]> {
    if (projectId === null) {
      // Get global chats (where projectId is null)
      return await db.chatMessages.where('projectId').equals(null).sortBy('timestamp');
    } else {
      // Get project-specific chats
      return await db.chatMessages.where('projectId').equals(projectId).sortBy('timestamp');
    }
  }

  async deleteChatMessagesByProject(projectId: string | null): Promise<void> {
    if (projectId === null) {
      await db.chatMessages.where('projectId').equals(null).delete();
    } else {
      await db.chatMessages.where('projectId').equals(projectId).delete();
    }
  }

  async deleteChatMessage(id: string): Promise<void> {
    await db.chatMessages.delete(id);
  }
}

