import { PrismaProjectRepository } from '../repositories/PrismaProjectRepository';
import { db as indexedDB } from './indexeddb';
import { initDatabase, saveDatabase } from './sqlite';

/**
 * Migrate data from IndexedDB to SQLite file database
 */
export async function migrateIndexedDBToSQLite(): Promise<void> {
  console.log('🔄 Starting migration from IndexedDB to SQLite file database...');

  try {
    // Initialize SQLite database
    const db = await initDatabase();
    const sqliteRepo = new PrismaProjectRepository();

    // Check if migration already completed by checking if any projects exist in SQLite
    const existingProjects = await sqliteRepo.getAllProjects();
    if (existingProjects.length > 0) {
      console.log('✅ Migration already completed. SQLite database contains', existingProjects.length, 'projects');
      localStorage.setItem('migration_complete', 'true');
      localStorage.setItem('migration_date', new Date().toISOString());
      return;
    }

    // Migrate projects - preserve IDs
    console.log('📦 Migrating projects...');
    const projects = await indexedDB.projects.toArray();
    let migratedProjects = 0;
    
    for (const project of projects) {
      try {
        // Check if project already exists
        const existing = await sqliteRepo.getProjectById(project.id);
        if (existing) {
          console.log(`⏭️  Project ${project.name} already exists, skipping...`);
          continue;
        }

        const now = new Date().toISOString();
        db.run(
          `INSERT INTO Project (id, name, description, selectedSectionIds, customSections, coverPageSettings, createdAt, updatedAt)
           VALUES ('${project.id.replace(/'/g, "''")}', '${project.name.replace(/'/g, "''")}', '${project.description.replace(/'/g, "''")}', 
                   ${project.selectedSectionIds ? `'${JSON.stringify(project.selectedSectionIds).replace(/'/g, "''")}'` : 'NULL'}, 
                   ${project.customSections ? `'${JSON.stringify(project.customSections).replace(/'/g, "''")}'` : 'NULL'}, 
                   ${project.coverPageSettings ? `'${JSON.stringify(project.coverPageSettings).replace(/'/g, "''")}'` : 'NULL'}, 
                   '${project.createdAt.toISOString()}', '${project.updatedAt.toISOString()}')`
        );
        migratedProjects++;
        console.log(`✅ Migrated project: ${project.name}`);
      } catch (error: any) {
        if (error.message?.includes('UNIQUE constraint')) {
          console.log(`⏭️  Project ${project.name} already exists, skipping...`);
        } else {
          console.error(`❌ Failed to migrate project ${project.id}:`, error);
        }
      }
    }
    await saveDatabase();

    // Migrate artifacts - preserve IDs
    console.log('📦 Migrating artifacts...');
    const artifacts = await indexedDB.artifacts.toArray();
    let migratedArtifacts = 0;
    
    for (const artifact of artifacts) {
      try {
        // Check if artifact already exists
        const existingArtifacts = await sqliteRepo.getArtifactsByProject(artifact.projectId);
        if (existingArtifacts.some(a => a.id === artifact.id)) {
          console.log(`⏭️  Artifact ${artifact.fileName} already exists, skipping...`);
          continue;
        }

        db.run(
          `INSERT INTO ProjectArtifact (id, projectId, fileName, fileType, fileSize, fileContent, artifactType, uploadedAt)
           VALUES ('${artifact.id.replace(/'/g, "''")}', '${artifact.projectId.replace(/'/g, "''")}', 
                   '${artifact.fileName.replace(/'/g, "''")}', '${artifact.fileType.replace(/'/g, "''")}', 
                   ${artifact.fileSize}, '${artifact.fileContent.replace(/'/g, "''")}', 
                   '${artifact.artifactType}', '${artifact.uploadedAt.toISOString()}')`
        );
        migratedArtifacts++;
        console.log(`✅ Migrated artifact: ${artifact.fileName}`);
      } catch (error: any) {
        if (error.message?.includes('UNIQUE constraint') || error.message?.includes('already exists')) {
          console.log(`⏭️  Artifact ${artifact.fileName} already exists, skipping...`);
        } else {
          console.error(`❌ Failed to migrate artifact ${artifact.id}:`, error);
        }
      }
    }
    await saveDatabase();

    // Migrate generated sections - preserve IDs
    console.log('📦 Migrating generated sections...');
    const sections = await indexedDB.sections.toArray();
    let migratedSections = 0;
    
    for (const section of sections) {
      try {
        // Check if section already exists
        const existing = await sqliteRepo.getGeneratedSection(section.projectId, section.sectionId);
        if (existing) {
          console.log(`⏭️  Section ${section.sectionId} already exists, skipping...`);
          continue;
        }

        db.run(
          `INSERT INTO GeneratedSection (id, projectId, sectionId, sectionTitle, content, generatedAt, updatedAt)
           VALUES ('${section.id.replace(/'/g, "''")}', '${section.projectId.replace(/'/g, "''")}', 
                   '${section.sectionId.replace(/'/g, "''")}', '${section.sectionTitle.replace(/'/g, "''")}', 
                   '${section.content.replace(/'/g, "''")}', '${section.generatedAt.toISOString()}', 
                   '${section.updatedAt.toISOString()}')`
        );
        migratedSections++;
        console.log(`✅ Migrated section: ${section.sectionId}`);
      } catch (error: any) {
        if (error.message?.includes('UNIQUE constraint') || error.message?.includes('already exists')) {
          console.log(`⏭️  Section ${section.sectionId} already exists, skipping...`);
        } else {
          console.error(`❌ Failed to migrate section ${section.id}:`, error);
        }
      }
    }
    await saveDatabase();

    // Migrate ADRs - preserve IDs
    console.log('📦 Migrating ADRs...');
    const adrs = await indexedDB.adrs.toArray();
    let migratedADRs = 0;
    
    for (const adr of adrs) {
      try {
        // Check if ADR already exists
        const existing = await sqliteRepo.getADRById(adr.id);
        if (existing) {
          console.log(`⏭️  ADR ${adr.title} already exists, skipping...`);
          continue;
        }

        db.run(
          `INSERT INTO ADR (id, projectId, number, title, status, date, context, decision, consequences, createdAt, updatedAt)
           VALUES ('${adr.id.replace(/'/g, "''")}', '${adr.projectId.replace(/'/g, "''")}', ${adr.number}, 
                   '${adr.title.replace(/'/g, "''")}', '${adr.status}', '${adr.date.toISOString()}', 
                   '${adr.context.replace(/'/g, "''")}', '${adr.decision.replace(/'/g, "''")}', 
                   '${adr.consequences.replace(/'/g, "''")}', '${adr.createdAt.toISOString()}', 
                   '${adr.updatedAt.toISOString()}')`
        );
        migratedADRs++;
        console.log(`✅ Migrated ADR: ${adr.title}`);
      } catch (error: any) {
        if (error.message?.includes('UNIQUE constraint') || error.message?.includes('already exists')) {
          console.log(`⏭️  ADR ${adr.title} already exists, skipping...`);
        } else {
          console.error(`❌ Failed to migrate ADR ${adr.id}:`, error);
        }
      }
    }
    await saveDatabase();

    // Migrate UML diagrams - preserve IDs
    console.log('📦 Migrating UML diagrams...');
    const umlDiagrams = await indexedDB.umlDiagrams.toArray();
    let migratedDiagrams = 0;
    
    for (const diagram of umlDiagrams) {
      try {
        // Check if diagram already exists
        const existing = await sqliteRepo.getUMLDiagramById(diagram.id);
        if (existing) {
          console.log(`⏭️  UML diagram ${diagram.name} already exists, skipping...`);
          continue;
        }

        db.run(
          `INSERT INTO UMLDiagram (id, projectId, name, description, diagramType, content, format, createdAt, updatedAt)
           VALUES ('${diagram.id.replace(/'/g, "''")}', '${diagram.projectId.replace(/'/g, "''")}', 
                   '${diagram.name.replace(/'/g, "''")}', '${diagram.description.replace(/'/g, "''")}', 
                   '${diagram.diagramType}', '${diagram.content.replace(/'/g, "''")}', 
                   '${diagram.format.replace(/'/g, "''")}', '${diagram.createdAt.toISOString()}', 
                   '${diagram.updatedAt.toISOString()}')`
        );
        migratedDiagrams++;
        console.log(`✅ Migrated UML diagram: ${diagram.name}`);
      } catch (error: any) {
        if (error.message?.includes('UNIQUE constraint') || error.message?.includes('already exists')) {
          console.log(`⏭️  UML diagram ${diagram.name} already exists, skipping...`);
        } else {
          console.error(`❌ Failed to migrate UML diagram ${diagram.id}:`, error);
        }
      }
    }
    await saveDatabase();
    
    // Force save to file if file handle is available
    const { saveDatabaseFile } = await import('./sqlite');
    try {
      await saveDatabaseFile();
      console.log('✅ Database saved to file system');
    } catch (error) {
      console.log('ℹ️  Could not save to file system (will use localStorage). You can export/import later.');
    }

    console.log('✅ Migration completed successfully!');
    console.log('📊 Migration summary:');
    console.log(`   - Projects: ${migratedProjects} migrated (${projects.length} total in IndexedDB)`);
    console.log(`   - Artifacts: ${migratedArtifacts} migrated (${artifacts.length} total in IndexedDB)`);
    console.log(`   - Sections: ${migratedSections} migrated (${sections.length} total in IndexedDB)`);
    console.log(`   - ADRs: ${migratedADRs} migrated (${adrs.length} total in IndexedDB)`);
    console.log(`   - UML Diagrams: ${migratedDiagrams} migrated (${umlDiagrams.length} total in IndexedDB)`);

    // Mark migration as complete
    localStorage.setItem('migration_complete', 'true');
    localStorage.setItem('migration_date', new Date().toISOString());
    
    // Show notification to user
    if (migratedProjects > 0 || migratedArtifacts > 0 || migratedSections > 0) {
      console.log('💡 Tip: Export your database file to share it across browsers or save it to a shared location.');
    }

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}

/**
 * Check if migration has been completed
 */
export function isMigrationComplete(): boolean {
  return localStorage.getItem('migration_complete') === 'true';
}

