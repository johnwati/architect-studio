import type { Database, SqlValue } from 'sql.js';
import { ADREntity, ApprovalEntity, ApproverEntity, ChatMessageEntity, CoverPageTemplateEntity, GeneratedSectionEntity, ProjectArtifactEntity, ProjectEntity, UMLDiagramEntity } from '../../domain/entities/Project';
import { CreateADRInput, CreateApprovalInput, CreateApproverInput, CreateArtifactInput, CreateChatMessageInput, CreateCoverPageTemplateInput, CreateProjectInput, CreateUMLDiagramInput, IProjectRepository, UpdateCoverPageTemplateInput } from '../../domain/ports/IProjectRepository';
import { getDatabase, saveDatabase } from '../database/sqlite';
import { AuthService } from '../services/authService';

/**
 * PrismaProjectRepository - Default Repository Implementation
 * 
 * This repository uses SQLite as the default storage mechanism.
 * All project data, artifacts, sections, and related entities are
 * stored in a SQLite database file.
 */
export class PrismaProjectRepository implements IProjectRepository {
  private _db: Database | null = null;

  private async getDb(): Promise<Database> {
    if (!this._db) {
      this._db = await getDatabase();
    }
    return this._db;
  }

  private escapeString(str: string | null | undefined): string {
    if (str === null || str === undefined) return 'NULL';
    return `'${str.replace(/'/g, "''")}'`;
  }

  /**
   * Get current user ID - throws error if not authenticated
   */
  private getCurrentUserId(): string {
    const user = AuthService.getCurrentUser();
    if (!user) {
      throw new Error('User must be authenticated to perform this operation');
    }
    return user.id;
  }

  /**
   * Verify project belongs to current user
   */
  private async verifyProjectOwnership(projectId: string): Promise<void> {
    const userId = this.getCurrentUserId();
    const project = await this.getProjectById(projectId);
    if (!project) {
      throw new Error('Project not found');
    }
    if (project.userId !== userId) {
      throw new Error('Access denied: Project does not belong to current user');
    }
  }

  async createProject(input: CreateProjectInput): Promise<ProjectEntity> {
    const userId = this.getCurrentUserId();
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    
    const project: ProjectEntity = {
      id,
      name: input.name,
      description: input.description,
      userId,
      selectedSectionIds: input.selectedSectionIds,
      customSections: input.customSections,
      customSectionSubsections: input.customSectionSubsections,
      coverPageSettings: input.coverPageSettings,
      coverPageTemplateId: input.coverPageTemplateId,
      createdAt: new Date(now),
      updatedAt: new Date(now),
    };

    const db = await this.getDb();
    
    // Check if customSectionSubsections column exists
    let hasCustomSectionSubsections = false;
    let hasUserId = false;
    let hasCoverPageTemplateId = false;
    try {
      const tableInfo = db.exec(`PRAGMA table_info(Project)`);
      if (tableInfo.length > 0) {
        const columns = tableInfo[0].values.map((row: any) => row[1] as string); // Column names are in index 1
        hasCustomSectionSubsections = columns.includes('customSectionSubsections');
        hasUserId = columns.includes('userId');
        hasCoverPageTemplateId = columns.includes('coverPageTemplateId');
      }
    } catch (error) {
      // If we can't check, assume it doesn't exist
      console.warn('Could not check for Project columns:', error);
    }
    
    if (!hasUserId) {
      // Fallback for old schema without userId (should not happen after migration)
      throw new Error('Database schema is outdated. Please refresh the page to run migrations.');
    }

    const columns: string[] = ['id', 'name', 'description', 'userId', 'selectedSectionIds', 'customSections'];
    const values: string[] = [
      this.escapeString(project.id),
      this.escapeString(project.name),
      this.escapeString(project.description),
      this.escapeString(project.userId),
      this.escapeString(project.selectedSectionIds ? JSON.stringify(project.selectedSectionIds) : null),
      this.escapeString(project.customSections ? JSON.stringify(project.customSections) : null),
    ];

    if (hasCustomSectionSubsections) {
      columns.push('customSectionSubsections');
      values.push(this.escapeString(project.customSectionSubsections ? JSON.stringify(project.customSectionSubsections) : null));
    }

    columns.push('coverPageSettings');
    values.push(this.escapeString(project.coverPageSettings ? JSON.stringify(project.coverPageSettings) : null));

    if (hasCoverPageTemplateId) {
      columns.push('coverPageTemplateId');
      values.push(this.escapeString(project.coverPageTemplateId ?? null));
    }

    columns.push('createdAt');
    columns.push('updatedAt');
    values.push(this.escapeString(now));
    values.push(this.escapeString(now));

    db.run(
      `INSERT INTO Project (${columns.join(', ')}) VALUES (${values.join(', ')})`
    );

    await saveDatabase();
    return project;
  }

  async getAllProjects(): Promise<ProjectEntity[]> {
    const userId = this.getCurrentUserId();
    const db = await this.getDb();
    
    // Check if customSectionSubsections and userId columns exist
    let hasCustomSectionSubsections = false;
    let hasUserId = false;
    let hasCoverPageTemplateId = false;
    try {
      const tableInfo = db.exec(`PRAGMA table_info(Project)`);
      if (tableInfo.length > 0) {
        const columns = tableInfo[0].values.map((row: any) => row[1] as string);
        hasCustomSectionSubsections = columns.includes('customSectionSubsections');
        hasUserId = columns.includes('userId');
        hasCoverPageTemplateId = columns.includes('coverPageTemplateId');
      }
    } catch (error) {
      console.warn('Could not check for Project columns:', error);
    }
    
    // Use explicit column names to ensure correct order
    let columnList: string;
    if (hasUserId) {
      const columns = ['id', 'name', 'description', 'userId', 'selectedSectionIds', 'customSections'];
      if (hasCustomSectionSubsections) {
        columns.push('customSectionSubsections');
      }
      columns.push('coverPageSettings');
      if (hasCoverPageTemplateId) {
        columns.push('coverPageTemplateId');
      }
      columns.push('createdAt', 'updatedAt');
      columnList = columns.join(', ');
    } else if (hasCustomSectionSubsections) {
      columnList = 'id, name, description, selectedSectionIds, customSections, customSectionSubsections, coverPageSettings, createdAt, updatedAt';
    } else {
      columnList = 'id, name, description, selectedSectionIds, customSections, coverPageSettings, createdAt, updatedAt';
    }
    
    // Filter by userId if column exists, otherwise return empty (old schema)
    const query = hasUserId
      ? `SELECT ${columnList} FROM Project WHERE userId = ${this.escapeString(userId)} ORDER BY createdAt DESC`
      : `SELECT ${columnList} FROM Project WHERE 1=0`; // Return empty if no userId column
    
    const results = db.exec(query);
    
    if (!results.length) return [];
    
    const rows = results[0].values;
    return rows.map(row => this.mapProjectRow(row, hasCustomSectionSubsections, hasUserId, hasCoverPageTemplateId));
  }

  async getProjectById(id: string): Promise<ProjectEntity | null> {
    const userId = this.getCurrentUserId();
    const db = await this.getDb();
    
    // Check if customSectionSubsections and userId columns exist
    let hasCustomSectionSubsections = false;
    let hasUserId = false;
    let hasCoverPageTemplateId = false;
    try {
      const tableInfo = db.exec(`PRAGMA table_info(Project)`);
      if (tableInfo.length > 0) {
        const columns = tableInfo[0].values.map((row: any) => row[1] as string);
        hasCustomSectionSubsections = columns.includes('customSectionSubsections');
        hasUserId = columns.includes('userId');
        hasCoverPageTemplateId = columns.includes('coverPageTemplateId');
      }
    } catch (error) {
      console.warn('Could not check for Project columns:', error);
    }
    
    // Use explicit column names to ensure correct order
    let columnList: string;
    if (hasUserId) {
      const columns = ['id', 'name', 'description', 'userId', 'selectedSectionIds', 'customSections'];
      if (hasCustomSectionSubsections) {
        columns.push('customSectionSubsections');
      }
      columns.push('coverPageSettings');
      if (hasCoverPageTemplateId) {
        columns.push('coverPageTemplateId');
      }
      columns.push('createdAt', 'updatedAt');
      columnList = columns.join(', ');
    } else if (hasCustomSectionSubsections) {
      columnList = 'id, name, description, selectedSectionIds, customSections, customSectionSubsections, coverPageSettings, createdAt, updatedAt';
    } else {
      columnList = 'id, name, description, selectedSectionIds, customSections, coverPageSettings, createdAt, updatedAt';
    }
    
    // Filter by userId if column exists
    const query = hasUserId
      ? `SELECT ${columnList} FROM Project WHERE id = ${this.escapeString(id)} AND userId = ${this.escapeString(userId)}`
      : `SELECT ${columnList} FROM Project WHERE id = ${this.escapeString(id)} AND 1=0`; // Return null if no userId column
    
    const results = db.exec(query);
    
    if (!results.length || !results[0].values.length) return null;
    
    return this.mapProjectRow(results[0].values[0], hasCustomSectionSubsections, hasUserId, hasCoverPageTemplateId);
  }

  async updateProject(id: string, input: Partial<CreateProjectInput>): Promise<ProjectEntity> {
    await this.verifyProjectOwnership(id);
    const existing = await this.getProjectById(id);
    if (!existing) throw new Error('Project not found');
    
    const updated: ProjectEntity = {
      ...existing,
      ...input,
      updatedAt: new Date(),
    };

    const db = await this.getDb();
    db.run(
      `UPDATE Project 
       SET name = ${this.escapeString(updated.name)}, 
           description = ${this.escapeString(updated.description)}, 
           selectedSectionIds = ${this.escapeString(updated.selectedSectionIds ? JSON.stringify(updated.selectedSectionIds) : null)}, 
           customSections = ${this.escapeString(updated.customSections ? JSON.stringify(updated.customSections) : null)}, 
           customSectionSubsections = ${this.escapeString(updated.customSectionSubsections ? JSON.stringify(updated.customSectionSubsections) : null)}, 
           coverPageSettings = ${this.escapeString(updated.coverPageSettings ? JSON.stringify(updated.coverPageSettings) : null)}, 
           coverPageTemplateId = ${this.escapeString(updated.coverPageTemplateId ?? null)}, 
           updatedAt = ${this.escapeString(updated.updatedAt.toISOString())}
       WHERE id = ${this.escapeString(id)}`
    );

    await saveDatabase();
    return updated;
  }

  async deleteProject(id: string): Promise<void> {
    await this.verifyProjectOwnership(id);
    const db = await this.getDb();
    // Delete related data first (cascade)
    db.run(`DELETE FROM Approval WHERE projectId = ${this.escapeString(id)}`);
    db.run(`DELETE FROM Approver WHERE projectId = ${this.escapeString(id)}`);
    db.run(`DELETE FROM ProjectArtifact WHERE projectId = ${this.escapeString(id)}`);
    db.run(`DELETE FROM GeneratedSection WHERE projectId = ${this.escapeString(id)}`);
    db.run(`DELETE FROM ADR WHERE projectId = ${this.escapeString(id)}`);
    db.run(`DELETE FROM UMLDiagram WHERE projectId = ${this.escapeString(id)}`);
    db.run(`DELETE FROM ChatMessage WHERE projectId = ${this.escapeString(id)}`);
    db.run(`DELETE FROM Project WHERE id = ${this.escapeString(id)}`);
    await saveDatabase();
  }

  async createCoverPageTemplate(input: CreateCoverPageTemplateInput): Promise<CoverPageTemplateEntity> {
    const userId = this.getCurrentUserId();
    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    const template: CoverPageTemplateEntity = {
      id,
      userId,
      name: input.name,
      description: input.description,
      content: input.content,
      coverPageSettings: input.coverPageSettings,
      previewImage: input.previewImage,
      createdAt: new Date(now),
      updatedAt: new Date(now),
    };

    const db = await this.getDb();
    db.run(
      `INSERT INTO CoverPageTemplate (id, userId, name, description, content, coverPageSettings, previewImage, createdAt, updatedAt)
       VALUES (
         ${this.escapeString(template.id)},
         ${this.escapeString(template.userId)},
         ${this.escapeString(template.name)},
         ${this.escapeString(template.description ?? null)},
         ${this.escapeString(template.content)},
         ${this.escapeString(template.coverPageSettings ? JSON.stringify(template.coverPageSettings) : null)},
         ${this.escapeString(template.previewImage ?? null)},
         ${this.escapeString(now)},
         ${this.escapeString(now)}
       )`
    );

    await saveDatabase();
    return template;
  }

  async getCoverPageTemplates(): Promise<CoverPageTemplateEntity[]> {
    const userId = this.getCurrentUserId();
    const db = await this.getDb();
    const results = db.exec(`SELECT * FROM CoverPageTemplate WHERE userId = ${this.escapeString(userId)} ORDER BY updatedAt DESC`);

    if (!results.length) {
      return [];
    }

    return results[0].values.map(row => this.mapCoverPageTemplateRow(row));
  }

  async getCoverPageTemplateById(id: string): Promise<CoverPageTemplateEntity | null> {
    const userId = this.getCurrentUserId();
    const db = await this.getDb();
    const results = db.exec(`SELECT * FROM CoverPageTemplate WHERE id = ${this.escapeString(id)} AND userId = ${this.escapeString(userId)}`);

    if (!results.length || !results[0].values.length) {
      return null;
    }

    return this.mapCoverPageTemplateRow(results[0].values[0]);
  }

  async updateCoverPageTemplate(id: string, input: UpdateCoverPageTemplateInput): Promise<CoverPageTemplateEntity> {
    const existing = await this.getCoverPageTemplateById(id);
    if (!existing) {
      throw new Error('Cover page template not found');
    }

    const updatedAt = new Date();
    const updated: CoverPageTemplateEntity = {
      ...existing,
      ...input,
      previewImage: input.previewImage === null ? undefined : (input.previewImage ?? existing.previewImage),
      updatedAt,
    };

    const db = await this.getDb();
    db.run(
      `UPDATE CoverPageTemplate
       SET name = ${this.escapeString(updated.name)},
           description = ${this.escapeString(updated.description ?? null)},
           content = ${this.escapeString(updated.content)},
           coverPageSettings = ${this.escapeString(updated.coverPageSettings ? JSON.stringify(updated.coverPageSettings) : null)},
           previewImage = ${this.escapeString(updated.previewImage ?? null)},
           updatedAt = ${this.escapeString(updated.updatedAt.toISOString())}
       WHERE id = ${this.escapeString(id)}`
    );

    await saveDatabase();
    return updated;
  }

  async deleteCoverPageTemplate(id: string): Promise<void> {
    const existing = await this.getCoverPageTemplateById(id);
    if (!existing) {
      throw new Error('Cover page template not found');
    }

    const db = await this.getDb();
    db.run(`DELETE FROM CoverPageTemplate WHERE id = ${this.escapeString(id)}`);

    // Also clear reference from projects using this template
    db.run(
      `UPDATE Project
       SET coverPageTemplateId = NULL
       WHERE coverPageTemplateId = ${this.escapeString(id)}`
    );

    await saveDatabase();
  }

  async addArtifact(input: CreateArtifactInput): Promise<ProjectArtifactEntity> {
    await this.verifyProjectOwnership(input.projectId);
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    
    const artifact: ProjectArtifactEntity = {
      id,
        projectId: input.projectId,
        fileName: input.fileName,
        fileType: input.fileType,
        fileSize: input.fileSize,
        fileContent: input.fileContent,
        artifactType: input.artifactType,
      uploadedAt: new Date(now),
    };

    const db = await this.getDb();
    db.run(
      `INSERT INTO ProjectArtifact (id, projectId, fileName, fileType, fileSize, fileContent, artifactType, uploadedAt)
       VALUES (${this.escapeString(artifact.id)}, ${this.escapeString(artifact.projectId)}, ${this.escapeString(artifact.fileName)}, 
               ${this.escapeString(artifact.fileType)}, ${artifact.fileSize}, ${this.escapeString(artifact.fileContent)}, 
               ${this.escapeString(artifact.artifactType)}, ${this.escapeString(now)})`
    );

    await saveDatabase();
    return artifact;
  }

  async getArtifactsByProject(projectId: string): Promise<ProjectArtifactEntity[]> {
    await this.verifyProjectOwnership(projectId);
    const db = await this.getDb();
    const results = db.exec(`SELECT * FROM ProjectArtifact WHERE projectId = ${this.escapeString(projectId)} ORDER BY uploadedAt`);
    
    if (!results.length) return [];
    
    const rows = results[0].values;
    return rows.map(row => this.mapArtifactRow(row));
  }

  async deleteArtifact(id: string): Promise<void> {
    const db = await this.getDb();
    db.run(`DELETE FROM ProjectArtifact WHERE id = ${this.escapeString(id)}`);
    await saveDatabase();
  }

  async saveGeneratedSection(
    projectId: string,
    sectionId: string,
    sectionTitle: string,
    content: string,
    parentSectionId?: string,
    order?: number
  ): Promise<GeneratedSectionEntity> {
    const db = await this.getDb();
    
    // Ensure parentSectionId and order columns exist
    await this.ensureGeneratedSectionColumns(db);
    
    // For sub-sections, we need to check by parentSectionId too
    const existing = parentSectionId 
      ? await this.getGeneratedSectionById(projectId, sectionId, parentSectionId)
      : await this.getGeneratedSection(projectId, sectionId);
    const now = new Date().toISOString();
    
    if (existing) {
      // Update existing
      const updated: GeneratedSectionEntity = {
        ...existing,
        sectionTitle,
        content,
        parentSectionId,
        order,
        updatedAt: new Date(now),
      };

      db.run(
        `UPDATE GeneratedSection 
         SET sectionTitle = ${this.escapeString(sectionTitle)}, 
             content = ${this.escapeString(content)},
             parentSectionId = ${parentSectionId ? this.escapeString(parentSectionId) : 'NULL'},
             "order" = ${order !== undefined ? order : 'NULL'},
             updatedAt = ${this.escapeString(now)}
         WHERE id = ${this.escapeString(existing.id)}`
      );

      await saveDatabase();
      return updated;
    } else {
      // Create new
      const id = crypto.randomUUID();
      const section: GeneratedSectionEntity = {
        id,
        projectId,
        sectionId,
        sectionTitle,
        content,
        parentSectionId,
        order,
        generatedAt: new Date(now),
        updatedAt: new Date(now),
      };

      db.run(
        `INSERT INTO GeneratedSection (id, projectId, sectionId, sectionTitle, content, parentSectionId, "order", generatedAt, updatedAt)
         VALUES (${this.escapeString(id)}, ${this.escapeString(projectId)}, ${this.escapeString(sectionId)}, 
                 ${this.escapeString(sectionTitle)}, ${this.escapeString(content)}, 
                 ${parentSectionId ? this.escapeString(parentSectionId) : 'NULL'}, 
                 ${order !== undefined ? order : 'NULL'}, 
                 ${this.escapeString(now)}, ${this.escapeString(now)})`
      );

      await saveDatabase();
      return section;
    }
  }
  
  // Helper method to ensure GeneratedSection table has required columns
  private async ensureGeneratedSectionColumns(db: Database): Promise<void> {
    try {
      const tableInfo = db.exec(`PRAGMA table_info(GeneratedSection)`);
      if (tableInfo.length > 0) {
        const columns = tableInfo[0].values.map((row: any) => row[1] as string);
        const hasParentSectionId = columns.includes('parentSectionId');
        const hasOrder = columns.includes('order');
        
        if (!hasParentSectionId) {
          db.run(`ALTER TABLE GeneratedSection ADD COLUMN parentSectionId TEXT`);
          console.log('✅ Added parentSectionId column to GeneratedSection table');
        }
        
        if (!hasOrder) {
          db.run(`ALTER TABLE GeneratedSection ADD COLUMN "order" INTEGER`);
          console.log('✅ Added order column to GeneratedSection table');
        }
        
        // Add index if needed
        if (!hasParentSectionId) {
          try {
            db.run(`CREATE INDEX IF NOT EXISTS idx_GeneratedSection_parentSectionId ON GeneratedSection(parentSectionId)`);
          } catch (e) {
            // Index might already exist, ignore
          }
        }
        
        // Save after migration
        if (!hasParentSectionId || !hasOrder) {
          await saveDatabase();
        }
      }
    } catch (error) {
      console.warn('Could not ensure GeneratedSection columns:', error);
    }
  }
  
  // Helper method to get section by ID, projectId, and parentSectionId
  private async getGeneratedSectionById(
    projectId: string, 
    sectionId: string, 
    parentSectionId: string
  ): Promise<GeneratedSectionEntity | null> {
    const db = await this.getDb();
    await this.ensureGeneratedSectionColumns(db);
    
    const results = db.exec(
      `SELECT * FROM GeneratedSection 
       WHERE projectId = ${this.escapeString(projectId)} 
       AND sectionId = ${this.escapeString(sectionId)}
       AND parentSectionId = ${this.escapeString(parentSectionId)}`
    );
    
    if (!results.length || !results[0].values.length) return null;
    
    return this.mapSectionRow(results[0].values[0]);
  }

  async getGeneratedSectionsByProject(projectId: string): Promise<GeneratedSectionEntity[]> {
    const db = await this.getDb();
    await this.ensureGeneratedSectionColumns(db);
    
    // Get only top-level sections (no parent) or all sections
    const results = db.exec(
      `SELECT * FROM GeneratedSection 
       WHERE projectId = ${this.escapeString(projectId)} 
       AND (parentSectionId IS NULL OR parentSectionId = '')
       ORDER BY "order" ASC, generatedAt ASC`
    );
    
    if (!results.length) return [];
    
    const rows = results[0].values;
    return rows.map(row => this.mapSectionRow(row));
  }

  async getGeneratedSection(projectId: string, sectionId: string): Promise<GeneratedSectionEntity | null> {
    const db = await this.getDb();
    await this.ensureGeneratedSectionColumns(db);
    
    const results = db.exec(
      `SELECT * FROM GeneratedSection 
       WHERE projectId = ${this.escapeString(projectId)} 
       AND sectionId = ${this.escapeString(sectionId)}
       AND (parentSectionId IS NULL OR parentSectionId = '')`
    );
    
    if (!results.length || !results[0].values.length) return null;
    
    return this.mapSectionRow(results[0].values[0]);
  }
  
  async getSubSections(parentSectionId: string): Promise<GeneratedSectionEntity[]> {
    const db = await this.getDb();
    await this.ensureGeneratedSectionColumns(db);
    
    const results = db.exec(
      `SELECT * FROM GeneratedSection 
       WHERE parentSectionId = ${this.escapeString(parentSectionId)}
       ORDER BY "order" ASC, generatedAt ASC`
    );
    
    if (!results.length) return [];
    
    const rows = results[0].values;
    return rows.map(row => this.mapSectionRow(row));
  }
  
  async deleteGeneratedSection(id: string): Promise<void> {
    const db = await this.getDb();
    await this.ensureGeneratedSectionColumns(db);
    
    // Delete sub-sections first (cascade)
    try {
      db.run(`DELETE FROM GeneratedSection WHERE parentSectionId = ${this.escapeString(id)}`);
    } catch (error) {
      // Column might not exist yet, ignore
      console.warn('Could not delete sub-sections (column might not exist):', error);
    }
    
    // Delete the section
    db.run(`DELETE FROM GeneratedSection WHERE id = ${this.escapeString(id)}`);
    await saveDatabase();
  }

  async createADR(input: CreateADRInput): Promise<ADREntity> {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    
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
      createdAt: new Date(now),
      updatedAt: new Date(now),
    };

    const db = await this.getDb();
    db.run(
      `INSERT INTO ADR (id, projectId, number, title, status, date, context, decision, consequences, createdAt, updatedAt)
       VALUES (${this.escapeString(id)}, ${this.escapeString(adr.projectId)}, ${adr.number}, ${this.escapeString(adr.title)}, 
               ${this.escapeString(adr.status)}, ${this.escapeString(adr.date.toISOString())}, ${this.escapeString(adr.context)}, 
               ${this.escapeString(adr.decision)}, ${this.escapeString(adr.consequences)}, ${this.escapeString(now)}, ${this.escapeString(now)})`
    );

    await saveDatabase();
    return adr;
  }

  async getADRsByProject(projectId: string): Promise<ADREntity[]> {
    const db = await this.getDb();
    const results = db.exec(`SELECT * FROM ADR WHERE projectId = ${this.escapeString(projectId)} ORDER BY number`);
    
    if (!results.length) return [];
    
    const rows = results[0].values;
    return rows.map(row => this.mapADRRow(row));
  }

  async getADRById(id: string): Promise<ADREntity | null> {
    const db = await this.getDb();
    const results = db.exec(`SELECT * FROM ADR WHERE id = ${this.escapeString(id)}`);
    
    if (!results.length || !results[0].values.length) return null;
    
    return this.mapADRRow(results[0].values[0]);
  }

  async updateADR(id: string, input: Partial<CreateADRInput>): Promise<ADREntity> {
    const existing = await this.getADRById(id);
    if (!existing) throw new Error('ADR not found');
    
    const updated: ADREntity = {
      ...existing,
      ...input,
      updatedAt: new Date(),
    };

    const db = await this.getDb();
    db.run(
      `UPDATE ADR 
       SET number = ${updated.number}, 
           title = ${this.escapeString(updated.title)}, 
           status = ${this.escapeString(updated.status)}, 
           date = ${this.escapeString(updated.date.toISOString())}, 
           context = ${this.escapeString(updated.context)}, 
           decision = ${this.escapeString(updated.decision)}, 
           consequences = ${this.escapeString(updated.consequences)}, 
           updatedAt = ${this.escapeString(updated.updatedAt.toISOString())}
       WHERE id = ${this.escapeString(id)}`
    );

    await saveDatabase();
    return updated;
  }

  async deleteADR(id: string): Promise<void> {
    const db = await this.getDb();
    db.run(`DELETE FROM ADR WHERE id = ${this.escapeString(id)}`);
    await saveDatabase();
  }

  async createUMLDiagram(input: CreateUMLDiagramInput): Promise<UMLDiagramEntity> {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    
    const diagram: UMLDiagramEntity = {
      id,
      projectId: input.projectId,
      name: input.name,
      description: input.description,
      diagramType: input.diagramType,
      content: input.content,
      format: input.format,
      createdAt: new Date(now),
      updatedAt: new Date(now),
    };

    const db = await this.getDb();
    db.run(
      `INSERT INTO UMLDiagram (id, projectId, name, description, diagramType, content, format, createdAt, updatedAt)
       VALUES (${this.escapeString(id)}, ${this.escapeString(diagram.projectId)}, ${this.escapeString(diagram.name)}, 
               ${this.escapeString(diagram.description)}, ${this.escapeString(diagram.diagramType)}, 
               ${this.escapeString(diagram.content)}, ${this.escapeString(diagram.format)}, 
               ${this.escapeString(now)}, ${this.escapeString(now)})`
    );

    await saveDatabase();
    return diagram;
  }

  async getUMLDiagramsByProject(projectId: string): Promise<UMLDiagramEntity[]> {
    const db = await this.getDb();
    const results = db.exec(`SELECT * FROM UMLDiagram WHERE projectId = ${this.escapeString(projectId)} ORDER BY createdAt`);
    
    if (!results.length) return [];
    
    const rows = results[0].values;
    return rows.map(row => this.mapUMLDiagramRow(row));
  }

  async getUMLDiagramById(id: string): Promise<UMLDiagramEntity | null> {
    const db = await this.getDb();
    const results = db.exec(`SELECT * FROM UMLDiagram WHERE id = ${this.escapeString(id)}`);
    
    if (!results.length || !results[0].values.length) return null;
    
    return this.mapUMLDiagramRow(results[0].values[0]);
  }

  async updateUMLDiagram(id: string, input: Partial<CreateUMLDiagramInput>): Promise<UMLDiagramEntity> {
    const existing = await this.getUMLDiagramById(id);
    if (!existing) throw new Error('UML Diagram not found');
    
    const updated: UMLDiagramEntity = {
      ...existing,
      ...input,
      updatedAt: new Date(),
    };

    const db = await this.getDb();
    db.run(
      `UPDATE UMLDiagram 
       SET name = ${this.escapeString(updated.name)}, 
           description = ${this.escapeString(updated.description)}, 
           diagramType = ${this.escapeString(updated.diagramType)}, 
           content = ${this.escapeString(updated.content)}, 
           format = ${this.escapeString(updated.format)}, 
           updatedAt = ${this.escapeString(updated.updatedAt.toISOString())}
       WHERE id = ${this.escapeString(id)}`
    );

    await saveDatabase();
    return updated;
  }

  async deleteUMLDiagram(id: string): Promise<void> {
    const db = await this.getDb();
    db.run(`DELETE FROM UMLDiagram WHERE id = ${this.escapeString(id)}`);
    await saveDatabase();
  }

  // Helper methods to map database rows to entities
  private mapProjectRow(
    row: SqlValue[],
    hasCustomSectionSubsections: boolean = true,
    hasUserId: boolean = true,
    hasCoverPageTemplateId: boolean = true
  ): ProjectEntity {
    // Helper function to safely parse JSON
    const safeJsonParse = (value: any): any => {
      if (!value || value === null || value === 'null') return undefined;
      if (typeof value !== 'string') return value;
      try {
        // Remove any whitespace
        const trimmed = value.trim();
        if (!trimmed || trimmed === 'null' || trimmed === '' || trimmed === 'NULL') return undefined;
        return JSON.parse(trimmed);
      } catch (error) {
        console.warn('Failed to parse JSON value:', value?.substring?.(0, 50), error);
        return undefined;
      }
    };

    let index = 0;
    const id = String(row[index++] ?? '');
    const name = String(row[index++] ?? '');
    const description = String(row[index++] ?? '');

    let userIdValue = '';
    if (hasUserId) {
      userIdValue = String(row[index++] ?? '');
    }

    const selectedSectionIds = safeJsonParse(row[index++]);
    const customSections = safeJsonParse(row[index++]);

    let customSectionSubsections = undefined;
    if (hasCustomSectionSubsections) {
      customSectionSubsections = safeJsonParse(row[index++]);
    }

    const coverPageSettings = safeJsonParse(row[index++]);

    let coverPageTemplateId: string | undefined;
    if (hasCoverPageTemplateId) {
      const templateValue = row[index++];
      if (templateValue !== null && templateValue !== undefined && templateValue !== 'null') {
        coverPageTemplateId = String(templateValue);
      }
    }

    const createdAtRaw = row[index++] ?? new Date().toISOString();
    const updatedAtRaw = row[index++] ?? new Date().toISOString();

    if (!userIdValue) {
      try {
        userIdValue = this.getCurrentUserId();
      } catch {
        throw new Error('Project missing userId. Please refresh the page to run database migrations.');
      }
    }

    return {
      id,
      name,
      userId: userIdValue,
      description,
      selectedSectionIds,
      customSections,
      customSectionSubsections,
      coverPageSettings,
      coverPageTemplateId,
      createdAt: new Date(String(createdAtRaw)),
      updatedAt: new Date(String(updatedAtRaw)),
    };
  }

  private mapCoverPageTemplateRow(row: SqlValue[]): CoverPageTemplateEntity {
    const safeJsonParse = (value: any): any => {
      if (!value || value === null || value === 'null') return undefined;
      if (typeof value !== 'string') return value;
      try {
        const trimmed = value.trim();
        if (!trimmed || trimmed === 'null' || trimmed === '' || trimmed === 'NULL') return undefined;
        return JSON.parse(trimmed);
      } catch {
        return undefined;
      }
    };

    return {
      id: String(row[0] ?? ''),
      userId: String(row[1] ?? ''),
      name: String(row[2] ?? ''),
      description: row[3] !== null && row[3] !== undefined ? String(row[3]) : undefined,
      content: String(row[4] ?? ''),
      coverPageSettings: safeJsonParse(row[5]),
      previewImage: row[6] !== null && row[6] !== undefined && row[6] !== 'null' ? String(row[6]) : undefined,
      createdAt: new Date(String(row[7] ?? new Date().toISOString())),
      updatedAt: new Date(String(row[8] ?? new Date().toISOString())),
    };
  }

  private mapArtifactRow(row: SqlValue[]): ProjectArtifactEntity {
    const columns = ['id', 'projectId', 'fileName', 'fileType', 'fileSize', 'fileContent', 'artifactType', 'uploadedAt'];
    const obj: any = {};
    columns.forEach((col, i) => {
      obj[col] = row[i];
    });

    return {
      id: obj.id,
      projectId: obj.projectId,
      fileName: obj.fileName,
      fileType: obj.fileType,
      fileSize: obj.fileSize,
      fileContent: obj.fileContent,
      artifactType: obj.artifactType as any,
      uploadedAt: new Date(obj.uploadedAt),
    };
  }

  private mapSectionRow(row: SqlValue[]): GeneratedSectionEntity {
    // Handle both old schema (7 columns) and new schema (9 columns)
    const columns = ['id', 'projectId', 'sectionId', 'sectionTitle', 'content', 'parentSectionId', 'order', 'generatedAt', 'updatedAt'];
    const obj: any = {};
    columns.forEach((col, i) => {
      if (i < row.length) {
        obj[col] = row[i];
      }
    });

    return {
      id: obj.id,
      projectId: obj.projectId,
      sectionId: obj.sectionId,
      sectionTitle: obj.sectionTitle,
      content: obj.content,
      parentSectionId: obj.parentSectionId || undefined,
      order: obj.order !== null && obj.order !== undefined ? Number(obj.order) : undefined,
      generatedAt: new Date(obj.generatedAt),
      updatedAt: new Date(obj.updatedAt),
    };
  }

  private mapADRRow(row: SqlValue[]): ADREntity {
    const columns = ['id', 'projectId', 'number', 'title', 'status', 'date', 'context', 'decision', 'consequences', 'createdAt', 'updatedAt'];
    const obj: any = {};
    columns.forEach((col, i) => {
      obj[col] = row[i];
    });

    return {
      id: obj.id,
      projectId: obj.projectId,
      number: obj.number,
      title: obj.title,
      status: obj.status as any,
      date: new Date(obj.date),
      context: obj.context,
      decision: obj.decision,
      consequences: obj.consequences,
      createdAt: new Date(obj.createdAt),
      updatedAt: new Date(obj.updatedAt),
    };
  }

  private mapUMLDiagramRow(row: SqlValue[]): UMLDiagramEntity {
    const columns = ['id', 'projectId', 'name', 'description', 'diagramType', 'content', 'format', 'createdAt', 'updatedAt'];
    const obj: any = {};
    columns.forEach((col, i) => {
      obj[col] = row[i];
    });

    return {
      id: obj.id,
      projectId: obj.projectId,
      name: obj.name,
      description: obj.description,
      diagramType: obj.diagramType as any,
      content: obj.content,
      format: obj.format,
      createdAt: new Date(obj.createdAt),
      updatedAt: new Date(obj.updatedAt),
    };
  }

  // Approver operations
  async addApprover(input: CreateApproverInput): Promise<ApproverEntity> {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    
    const approver: ApproverEntity = {
      id,
      projectId: input.projectId,
      email: input.email,
      name: input.name,
      role: input.role,
      addedAt: new Date(now),
      addedBy: input.addedBy,
    };

    const db = await this.getDb();
    db.run(
      `INSERT INTO Approver (id, projectId, email, name, role, addedAt, addedBy)
       VALUES (${this.escapeString(id)}, ${this.escapeString(input.projectId)}, ${this.escapeString(input.email)}, 
               ${this.escapeString(input.name)}, ${this.escapeString(input.role || null)}, 
               ${this.escapeString(now)}, ${this.escapeString(input.addedBy || null)})`
    );

    await saveDatabase();
    return approver;
  }

  async getApproversByProject(projectId: string): Promise<ApproverEntity[]> {
    const db = await this.getDb();
    const results = db.exec(`SELECT * FROM Approver WHERE projectId = ${this.escapeString(projectId)} ORDER BY addedAt`);
    
    if (!results.length) return [];
    
    const rows = results[0].values;
    return rows.map(row => this.mapApproverRow(row));
  }

  async getApproverById(id: string): Promise<ApproverEntity | null> {
    const db = await this.getDb();
    const results = db.exec(`SELECT * FROM Approver WHERE id = ${this.escapeString(id)}`);
    
    if (!results.length || !results[0].values.length) return null;
    
    return this.mapApproverRow(results[0].values[0]);
  }

  async getApproverByEmail(projectId: string, email: string): Promise<ApproverEntity | null> {
    const db = await this.getDb();
    const results = db.exec(
      `SELECT * FROM Approver WHERE projectId = ${this.escapeString(projectId)} AND email = ${this.escapeString(email)}`
    );
    
    if (!results.length || !results[0].values.length) return null;
    
    return this.mapApproverRow(results[0].values[0]);
  }

  async updateApprover(id: string, input: Partial<CreateApproverInput>): Promise<ApproverEntity> {
    const existing = await this.getApproverById(id);
    if (!existing) throw new Error('Approver not found');
    
    const updated: ApproverEntity = {
      ...existing,
      ...input,
    };

    const db = await this.getDb();
    db.run(
      `UPDATE Approver 
       SET email = ${this.escapeString(updated.email)}, 
           name = ${this.escapeString(updated.name)}, 
           role = ${this.escapeString(updated.role || null)}
       WHERE id = ${this.escapeString(id)}`
    );

    await saveDatabase();
    return updated;
  }

  async deleteApprover(id: string): Promise<void> {
    const db = await this.getDb();
    db.run(`DELETE FROM Approval WHERE approverId = ${this.escapeString(id)}`);
    db.run(`DELETE FROM Approver WHERE id = ${this.escapeString(id)}`);
    await saveDatabase();
  }

  // Approval operations
  async createApproval(input: CreateApprovalInput): Promise<ApprovalEntity> {
    const existing = await this.getApprovalByApprover(input.projectId, input.approverId);
    const now = new Date().toISOString();
    
    if (existing) {
      // Update existing
      const updated: ApprovalEntity = {
        ...existing,
        status: input.status || existing.status,
        signature: input.signature !== undefined ? input.signature : existing.signature,
        comments: input.comments !== undefined ? input.comments : existing.comments,
        signedAt: input.signature ? new Date(now) : existing.signedAt,
        approvedAt: (input.status === 'APPROVED' || input.status === 'SIGNED') ? new Date(now) : existing.approvedAt,
        updatedAt: new Date(now),
      };

      const db = await this.getDb();
      db.run(
        `UPDATE Approval 
         SET status = ${this.escapeString(updated.status)}, 
             signature = ${this.escapeString(updated.signature || null)}, 
             comments = ${this.escapeString(updated.comments || null)}, 
             signedAt = ${updated.signedAt ? this.escapeString(updated.signedAt.toISOString()) : 'NULL'}, 
             approvedAt = ${updated.approvedAt ? this.escapeString(updated.approvedAt.toISOString()) : 'NULL'}, 
             updatedAt = ${this.escapeString(now)}
         WHERE id = ${this.escapeString(existing.id)}`
      );

      await saveDatabase();
      return updated;
    } else {
      // Create new
      const id = crypto.randomUUID();
      const approval: ApprovalEntity = {
        id,
        projectId: input.projectId,
        approverId: input.approverId,
        status: input.status || 'PENDING',
        signature: input.signature,
        comments: input.comments,
        signedAt: input.signature ? new Date(now) : undefined,
        approvedAt: (input.status === 'APPROVED' || input.status === 'SIGNED') ? new Date(now) : undefined,
        createdAt: new Date(now),
        updatedAt: new Date(now),
      };

      const db = await this.getDb();
      db.run(
        `INSERT INTO Approval (id, projectId, approverId, status, signature, comments, signedAt, approvedAt, createdAt, updatedAt)
         VALUES (${this.escapeString(id)}, ${this.escapeString(input.projectId)}, ${this.escapeString(input.approverId)}, 
                 ${this.escapeString(approval.status)}, ${this.escapeString(approval.signature || null)}, 
                 ${this.escapeString(approval.comments || null)}, 
                 ${approval.signedAt ? this.escapeString(approval.signedAt.toISOString()) : 'NULL'}, 
                 ${approval.approvedAt ? this.escapeString(approval.approvedAt.toISOString()) : 'NULL'}, 
                 ${this.escapeString(now)}, ${this.escapeString(now)})`
      );

      await saveDatabase();
      return approval;
    }
  }

  async getApprovalsByProject(projectId: string): Promise<ApprovalEntity[]> {
    const db = await this.getDb();
    const results = db.exec(`SELECT * FROM Approval WHERE projectId = ${this.escapeString(projectId)} ORDER BY createdAt`);
    
    if (!results.length) return [];
    
    const rows = results[0].values;
    const approvals = rows.map(row => this.mapApprovalRow(row));
    
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
    const db = await this.getDb();
    const results = db.exec(`SELECT * FROM Approval WHERE id = ${this.escapeString(id)}`);
    
    if (!results.length || !results[0].values.length) return null;
    
    const approval = this.mapApprovalRow(results[0].values[0]);
    if (approval.approverId) {
      const approver = await this.getApproverById(approval.approverId);
      if (approver) {
        approval.approver = approver;
      }
    }
    return approval;
  }

  async getApprovalByApprover(projectId: string, approverId: string): Promise<ApprovalEntity | null> {
    const db = await this.getDb();
    const results = db.exec(
      `SELECT * FROM Approval WHERE projectId = ${this.escapeString(projectId)} AND approverId = ${this.escapeString(approverId)}`
    );
    
    if (!results.length || !results[0].values.length) return null;
    
    return this.mapApprovalRow(results[0].values[0]);
  }

  async updateApproval(id: string, input: Partial<CreateApprovalInput>): Promise<ApprovalEntity> {
    const existing = await this.getApprovalById(id);
    if (!existing) throw new Error('Approval not found');
    
    const now = new Date().toISOString();
    const updated: ApprovalEntity = {
      ...existing,
      status: input.status !== undefined ? input.status : existing.status,
      signature: input.signature !== undefined ? input.signature : existing.signature,
      comments: input.comments !== undefined ? input.comments : existing.comments,
      signedAt: input.signature ? (existing.signedAt || new Date(now)) : existing.signedAt,
      approvedAt: (input.status === 'APPROVED' || input.status === 'SIGNED') ? (existing.approvedAt || new Date(now)) : existing.approvedAt,
      updatedAt: new Date(now),
    };

    const db = await this.getDb();
    db.run(
      `UPDATE Approval 
       SET status = ${this.escapeString(updated.status)}, 
           signature = ${this.escapeString(updated.signature || null)}, 
           comments = ${this.escapeString(updated.comments || null)}, 
           signedAt = ${updated.signedAt ? this.escapeString(updated.signedAt.toISOString()) : 'NULL'}, 
           approvedAt = ${updated.approvedAt ? this.escapeString(updated.approvedAt.toISOString()) : 'NULL'}, 
           updatedAt = ${this.escapeString(now)}
       WHERE id = ${this.escapeString(id)}`
    );

    await saveDatabase();
    return updated;
  }

  async deleteApproval(id: string): Promise<void> {
    const db = await this.getDb();
    db.run(`DELETE FROM Approval WHERE id = ${this.escapeString(id)}`);
    await saveDatabase();
  }

  // Chat message operations
  async addChatMessage(input: CreateChatMessageInput): Promise<ChatMessageEntity> {
    const db = await this.getDb();
    
    // Ensure ChatMessage table exists
    try {
      db.run(`
        CREATE TABLE IF NOT EXISTS ChatMessage (
          id TEXT PRIMARY KEY,
          projectId TEXT,
          role TEXT NOT NULL,
          content TEXT NOT NULL,
          timestamp TEXT NOT NULL,
          capabilityType TEXT,
          createdAt TEXT NOT NULL
        )
      `);
      await saveDatabase();
    } catch (error) {
      console.warn('ChatMessage table may already exist:', error);
    }

    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const timestamp = input.timestamp.toISOString();
    
    db.run(`
      INSERT INTO ChatMessage (id, projectId, role, content, timestamp, capabilityType, createdAt)
      VALUES (
        ${this.escapeString(id)},
        ${input.projectId ? this.escapeString(input.projectId) : 'NULL'},
        ${this.escapeString(input.role)},
        ${this.escapeString(input.content)},
        ${this.escapeString(timestamp)},
        ${input.capabilityType ? this.escapeString(input.capabilityType) : 'NULL'},
        ${this.escapeString(now)}
      )
    `);
    
    await saveDatabase();
    
    return {
      id,
      projectId: input.projectId,
      role: input.role,
      content: input.content,
      timestamp: input.timestamp,
      capabilityType: input.capabilityType || null,
      createdAt: new Date(now),
    };
  }

  async getChatMessagesByProject(projectId: string | null): Promise<ChatMessageEntity[]> {
    const db = await this.getDb();
    
    // Ensure ChatMessage table exists
    try {
      db.run(`
        CREATE TABLE IF NOT EXISTS ChatMessage (
          id TEXT PRIMARY KEY,
          projectId TEXT,
          role TEXT NOT NULL,
          content TEXT NOT NULL,
          timestamp TEXT NOT NULL,
          capabilityType TEXT,
          createdAt TEXT NOT NULL
        )
      `);
      await saveDatabase();
    } catch (error) {
      console.warn('ChatMessage table may already exist:', error);
    }

    let result;
    if (projectId === null) {
      result = db.exec(`SELECT * FROM ChatMessage WHERE projectId IS NULL ORDER BY timestamp ASC`);
    } else {
      result = db.exec(`SELECT * FROM ChatMessage WHERE projectId = ${this.escapeString(projectId)} ORDER BY timestamp ASC`);
    }

    if (result.length === 0) {
      return [];
    }

    const rows = result[0].values;
    return rows.map((row: SqlValue[]) => this.mapChatMessageRow(row));
  }

  async deleteChatMessagesByProject(projectId: string | null): Promise<void> {
    const db = await this.getDb();
    
    if (projectId === null) {
      db.run(`DELETE FROM ChatMessage WHERE projectId IS NULL`);
    } else {
      db.run(`DELETE FROM ChatMessage WHERE projectId = ${this.escapeString(projectId)}`);
    }
    
    await saveDatabase();
  }

  async deleteChatMessage(id: string): Promise<void> {
    const db = await this.getDb();
    db.run(`DELETE FROM ChatMessage WHERE id = ${this.escapeString(id)}`);
    await saveDatabase();
  }

  // Helper methods to map database rows to entities
  private mapApproverRow(row: SqlValue[]): ApproverEntity {
    const columns = ['id', 'projectId', 'email', 'name', 'role', 'addedAt', 'addedBy'];
    const obj: any = {};
    columns.forEach((col, i) => {
      obj[col] = row[i];
    });

    return {
      id: obj.id,
      projectId: obj.projectId,
      email: obj.email,
      name: obj.name,
      role: obj.role || undefined,
      addedAt: new Date(obj.addedAt),
      addedBy: obj.addedBy || undefined,
    };
  }

  private mapApprovalRow(row: SqlValue[]): ApprovalEntity {
    const columns = ['id', 'projectId', 'approverId', 'status', 'signature', 'comments', 'signedAt', 'approvedAt', 'createdAt', 'updatedAt'];
    const obj: any = {};
    columns.forEach((col, i) => {
      obj[col] = row[i];
    });

    return {
      id: obj.id,
      projectId: obj.projectId,
      approverId: obj.approverId,
      status: obj.status as any,
      signature: obj.signature || undefined,
      comments: obj.comments || undefined,
      signedAt: obj.signedAt ? new Date(obj.signedAt) : undefined,
      approvedAt: obj.approvedAt ? new Date(obj.approvedAt) : undefined,
      createdAt: new Date(obj.createdAt),
      updatedAt: new Date(obj.updatedAt),
    };
  }

  private mapChatMessageRow(row: SqlValue[]): ChatMessageEntity {
    const columns = ['id', 'projectId', 'role', 'content', 'timestamp', 'capabilityType', 'createdAt'];
    const obj: any = {};
    columns.forEach((col, i) => {
      obj[col] = row[i];
    });

    return {
      id: obj.id,
      projectId: obj.projectId || null,
      role: obj.role as 'user' | 'assistant',
      content: obj.content,
      timestamp: new Date(obj.timestamp),
      capabilityType: obj.capabilityType || null,
      createdAt: new Date(obj.createdAt),
    };
  }
}
