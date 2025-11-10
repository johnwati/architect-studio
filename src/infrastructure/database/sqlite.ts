import initSqlJs, { Database, SqlJsStatic } from 'sql.js';

let db: Database | null = null;
let SQL: SqlJsStatic | null = null;
let fileHandle: FileSystemFileHandle | null = null;

const DB_NAME = 'SDDGeneratorDB';
const DB_BACKUP_NAME = 'SDDGeneratorDB_backup';
const DB_FILE_NAME = 'sdd-generator.db';

/**
 * Initialize SQLite database using sql.js
 * 
 * This is the DEFAULT storage mechanism for the application.
 * All data is persisted in a SQLite database file.
 */
export async function initDatabase(): Promise<Database> {
  if (db) {
    return db;
  }

  console.log('📦 Initializing SQLite database (default storage)...');

  // Load sql.js library
  SQL = await initSqlJs({
    locateFile: (file: string) => {
      // Try to load from node_modules or CDN
      if (file === 'sql-wasm.wasm') {
        return '/node_modules/sql.js/dist/sql-wasm.wasm';
      }
      return file;
    }
  });

  // Try to load database from file system first
  try {
    const loaded = await loadDatabaseFromFile();
    if (loaded) {
      db = loaded;
      console.log('✅ Loaded SQLite database from file system');
      // Run migrations on loaded database
      await runMigrations();
      return db;
    }
  } catch (error) {
    console.warn('Could not load database from file system:', error);
  }

  // Fallback: Try to load from localStorage
  const savedDb = localStorage.getItem(DB_NAME);
  
  if (savedDb) {
    try {
      // Create backup before attempting to load
      localStorage.setItem(DB_BACKUP_NAME, savedDb);
      console.log('💾 Created backup of existing database');
      
      const buffer = Uint8Array.from(atob(savedDb), c => c.charCodeAt(0));
      db = new SQL.Database(buffer);
      console.log('✅ Loaded existing SQLite database from localStorage');
      
      // Verify database has data before migrating
      try {
        const testQuery = db.exec('SELECT COUNT(*) as count FROM Project');
        const countValue = testQuery.length > 0 && testQuery[0].values.length > 0
          ? testQuery[0].values[0][0]
          : 0;
        const countNumber = typeof countValue === 'number'
          ? countValue
          : typeof countValue === 'string'
            ? Number(countValue)
            : 0;
        const hasProjects = Number.isFinite(countNumber) && countNumber > 0;
        console.log(`📊 Database contains ${hasProjects ? 'projects' : 'no projects'}`);
      } catch (e) {
        console.log('ℹ️ Could not verify database contents, proceeding with migration');
      }
      
      // Run migrations on loaded database
      await runMigrations();
      
      // Save migrated database
      await saveDatabase();
      
      // Migrate to file system if possible
      await saveDatabaseToFile();
    } catch (error) {
      console.error('❌ Failed to load existing database:', error);
      console.log('🔄 Attempting to restore from backup...');
      
      // Try to restore from backup
      const backup = localStorage.getItem(DB_BACKUP_NAME);
      if (backup) {
        try {
          const buffer = Uint8Array.from(atob(backup), c => c.charCodeAt(0));
          db = new SQL.Database(buffer);
          console.log('✅ Restored database from backup');
          
          // Run migrations on restored database
          await runMigrations();
          await saveDatabase();
        } catch (backupError) {
          console.error('❌ Failed to restore from backup:', backupError);
          console.warn('⚠️ Creating new database - old data may be lost');
          console.warn('💡 You can try to recover data from browser DevTools → Application → Local Storage');
          db = new SQL.Database();
          await createTables();
          await saveDatabase();
        }
      } else {
        console.warn('⚠️ No backup found, creating new database');
        db = new SQL.Database();
        await createTables();
        await saveDatabase();
      }
    }
  } else {
    db = new SQL.Database();
    await createTables();
    await saveDatabase();
    console.log('✅ Created new SQLite database');
  }

  return db;
}

/**
 * Load database from file system using File System Access API
 */
async function loadDatabaseFromFile(): Promise<Database | null> {
  // Check if File System Access API is supported
  if (!('showOpenFilePicker' in window)) {
    return null;
  }

  try {
    // Try to load from a previously selected file if we have permission
    // Note: File handles can't be stored in localStorage, so we'll prompt user
    // This is a limitation of the File System Access API for cross-session persistence
    return null;
  } catch (error) {
    console.warn('Could not load database from file:', error);
    return null;
  }
}

/**
 * Select database file using File System Access API
 */
export async function selectDatabaseFile(): Promise<FileSystemFileHandle | null> {
  if (!('showOpenFilePicker' in window)) {
    throw new Error('File System Access API is not supported in this browser');
  }

  try {
    const [handle] = await (window as any).showOpenFilePicker({
      types: [{
        description: 'SQLite Database',
        accept: {
          'application/x-sqlite3': ['.db', '.sqlite', '.sqlite3']
        }
      }],
      multiple: false
    });

    fileHandle = handle;
    
    // Load the database from the selected file
    const file = await handle.getFile();
    const arrayBuffer = await file.arrayBuffer();
    const buffer = new Uint8Array(arrayBuffer);
    
    // Close existing database
    if (db) {
      db.close();
    }

    // Load new database
    if (!SQL) {
      SQL = await initSqlJs({
        locateFile: (file: string) => {
          if (file === 'sql-wasm.wasm') {
            return '/node_modules/sql.js/dist/sql-wasm.wasm';
          }
          return file;
        }
      });
    }
    
    db = new SQL.Database(buffer);
    
    // Verify tables exist, create if needed
    await createTables();
    
    // Run migrations on loaded database
    await runMigrations();
    
    console.log('✅ Database loaded from selected file');
    return handle;
  } catch (error: any) {
    if (error.name === 'AbortError') {
      // User cancelled
      return null;
    }
    throw error;
  }
}

/**
 * Save database file using File System Access API
 */
export async function saveDatabaseFile(): Promise<void> {
  if (!db || !SQL) throw new Error('Database not initialized');

  if (!('showSaveFilePicker' in window)) {
    // Fallback to download
    await exportDatabase();
    return;
  }

  try {
    let handle = fileHandle;
    
    // If no file handle, ask user to select a file
    if (!handle) {
      handle = await (window as any).showSaveFilePicker({
        suggestedName: DB_FILE_NAME,
        types: [{
          description: 'SQLite Database',
          accept: {
            'application/x-sqlite3': ['.db']
          }
        }]
      });
      fileHandle = handle;
    }

    // Write to file
    if (!handle) {
      throw new Error('File handle not available');
    }
    const writable = await handle.createWritable();
    const data = db.export();
    const buffer = data.slice().buffer as ArrayBuffer;
    await writable.write(buffer);
    await writable.close();
    
    console.log('✅ Database saved to file system');
  } catch (error: any) {
    if (error.name === 'AbortError') {
      // User cancelled
      return;
    }
    // Fallback to download
    await exportDatabase();
  }
}

/**
 * Save database to file system using File System Access API
 * This is called internally by saveDatabase()
 */
async function saveDatabaseToFile(): Promise<void> {
  if (!db || !SQL || !fileHandle) return;

  if ('showSaveFilePicker' in window) {
    try {
      const handle = fileHandle;
      const writable = await handle.createWritable();
      const data = db.export();
      const buffer = data.slice().buffer as ArrayBuffer;
      await writable.write(buffer);
      await writable.close();
      console.log('✅ Database saved to file system');
    } catch (error) {
      console.warn('Could not save to file system:', error);
      throw error;
    }
  }
}

/**
 * Save database to localStorage (fallback)
 */
async function saveDatabaseToLocalStorage(): Promise<void> {
  if (!db) throw new Error('Database not initialized');
  
  const data = db.export();
  const buffer = new Uint8Array(data);
  
  // Convert to base64 in chunks to avoid "Maximum call stack size exceeded" error
  // Use chunk size of 8192 bytes to prevent stack overflow
  const chunkSize = 8192;
  let binaryString = '';
  
  for (let i = 0; i < buffer.length; i += chunkSize) {
    const chunk = buffer.slice(i, i + chunkSize);
    binaryString += String.fromCharCode.apply(null, Array.from(chunk));
  }
  
  const base64 = btoa(binaryString);
  localStorage.setItem(DB_NAME, base64);
}

/**
 * Export database as downloadable file
 */
export async function exportDatabase(): Promise<void> {
  if (!db) throw new Error('Database not initialized');

  const data = db.export();
  const buffer = data.slice().buffer as ArrayBuffer;
  const blob = new Blob([buffer], { type: 'application/x-sqlite3' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  a.href = url;
  a.download = `sdd-generator-backup-${timestamp}.db`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  console.log('✅ Database exported as file');
}

/**
 * Create a backup of the current database
 */
export async function createBackup(): Promise<string> {
  if (!db) throw new Error('Database not initialized');
  
  const data = db.export();
  const buffer = new Uint8Array(data);
  
  // Convert to base64 in chunks
  const chunkSize = 8192;
  let binaryString = '';
  
  for (let i = 0; i < buffer.length; i += chunkSize) {
    const chunk = buffer.slice(i, i + chunkSize);
    binaryString += String.fromCharCode.apply(null, Array.from(chunk));
  }
  
  const base64 = btoa(binaryString);
  localStorage.setItem(DB_BACKUP_NAME, base64);
  console.log('💾 Created backup in localStorage');
  
  return base64;
}

/**
 * Restore database from backup
 */
export async function restoreFromBackup(): Promise<boolean> {
  if (!SQL) throw new Error('SQL.js not initialized');
  
  const backup = localStorage.getItem(DB_BACKUP_NAME);
  if (!backup) {
    console.warn('No backup found in localStorage');
    return false;
  }
  
  try {
    const buffer = Uint8Array.from(atob(backup), c => c.charCodeAt(0));
    
    // Close existing database
    if (db) {
      db.close();
    }
    
    // Load backup
    db = new SQL.Database(buffer);
    
    // Run migrations on restored database
    await runMigrations();
    
    // Save restored database
    await saveDatabase();
    
    console.log('✅ Restored database from backup');
    return true;
  } catch (error) {
    console.error('Failed to restore from backup:', error);
    return false;
  }
}

/**
 * Import database from file
 */
export async function importDatabase(file: File): Promise<void> {
  if (!SQL) throw new Error('SQL.js not initialized');

  try {
    const arrayBuffer = await file.arrayBuffer();
    const buffer = new Uint8Array(arrayBuffer);
    
    // Close existing database
    if (db) {
      db.close();
    }

    // Load new database
    db = new SQL.Database(buffer);
    
    // Verify tables exist, create if needed
    await createTables();
    
    // Run migrations on imported database
    await runMigrations();
    
    // Save to localStorage as backup
    await saveDatabaseToLocalStorage();
    
    console.log('✅ Database imported from file');
    
    // Trigger a page reload to refresh all data
    window.location.reload();
  } catch (error) {
    console.error('Failed to import database:', error);
    throw new Error('Failed to import database file. Please ensure it is a valid SQLite database.');
  }
}

/**
 * Create database tables based on Prisma schema
 */
async function createTables(): Promise<void> {
  if (!db || !SQL) throw new Error('Database not initialized');

  const createTablesSQL = `
    -- Projects table
    CREATE TABLE IF NOT EXISTS Project (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT NOT NULL,
      userId TEXT NOT NULL,
      selectedSectionIds TEXT,
      customSections TEXT,
      customSectionSubsections TEXT,
      coverPageSettings TEXT,
      coverPageTemplateId TEXT,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL,
      FOREIGN KEY (userId) REFERENCES User(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_Project_createdAt ON Project(createdAt);
    CREATE INDEX IF NOT EXISTS idx_Project_userId ON Project(userId);
  `;

  db.run(createTablesSQL);

  // Migration: Add customSectionSubsections column if it doesn't exist
  try {
    // Check if table exists first
    const tableCheck = db.exec(`SELECT name FROM sqlite_master WHERE type='table' AND name='Project'`);
    if (tableCheck.length > 0) {
      // Table exists, check if column exists
      const tableInfo = db.exec(`PRAGMA table_info(Project)`);
      if (tableInfo.length > 0) {
        const columns = tableInfo[0].values.map((row: any) => row[1]); // Column names are in index 1
        const hasCustomSectionSubsections = columns.includes('customSectionSubsections');
        const hasCoverPageTemplateId = columns.includes('coverPageTemplateId');
        
        if (!hasCustomSectionSubsections) {
          db.run('ALTER TABLE Project ADD COLUMN customSectionSubsections TEXT');
          console.log('✅ Added customSectionSubsections column to Project table');
        }
        if (!hasCoverPageTemplateId) {
          db.run('ALTER TABLE Project ADD COLUMN coverPageTemplateId TEXT');
          console.log('✅ Added coverPageTemplateId column to Project table');
        }
      }
    }
  } catch (error) {
    // Ignore errors - column might already exist or table might not exist yet
    console.log('Migration check for customSectionSubsections:', error);
  }

  const createOtherTablesSQL = `
    -- ProjectArtifact table
    CREATE TABLE IF NOT EXISTS ProjectArtifact (
      id TEXT PRIMARY KEY,
      projectId TEXT NOT NULL,
      fileName TEXT NOT NULL,
      fileType TEXT NOT NULL,
      fileSize INTEGER NOT NULL,
      fileContent TEXT NOT NULL,
      artifactType TEXT NOT NULL,
      uploadedAt TEXT NOT NULL,
      FOREIGN KEY (projectId) REFERENCES Project(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_ProjectArtifact_projectId ON ProjectArtifact(projectId);

    -- GeneratedSection table
    CREATE TABLE IF NOT EXISTS GeneratedSection (
      id TEXT PRIMARY KEY,
      projectId TEXT NOT NULL,
      sectionId TEXT NOT NULL,
      sectionTitle TEXT NOT NULL,
      content TEXT NOT NULL,
      parentSectionId TEXT,
      "order" INTEGER,
      generatedAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL,
      FOREIGN KEY (projectId) REFERENCES Project(id) ON DELETE CASCADE,
      FOREIGN KEY (parentSectionId) REFERENCES GeneratedSection(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_GeneratedSection_projectId ON GeneratedSection(projectId);
    CREATE INDEX IF NOT EXISTS idx_GeneratedSection_parentSectionId ON GeneratedSection(parentSectionId);

    -- ADR table
    CREATE TABLE IF NOT EXISTS ADR (
      id TEXT PRIMARY KEY,
      projectId TEXT NOT NULL,
      number INTEGER NOT NULL,
      title TEXT NOT NULL,
      status TEXT NOT NULL,
      date TEXT NOT NULL,
      context TEXT NOT NULL,
      decision TEXT NOT NULL,
      consequences TEXT NOT NULL,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL,
      FOREIGN KEY (projectId) REFERENCES Project(id) ON DELETE CASCADE,
      UNIQUE(projectId, number)
    );

    CREATE INDEX IF NOT EXISTS idx_ADR_projectId ON ADR(projectId);

    -- UMLDiagram table
    CREATE TABLE IF NOT EXISTS UMLDiagram (
      id TEXT PRIMARY KEY,
      projectId TEXT NOT NULL,
      name TEXT NOT NULL,
      description TEXT NOT NULL,
      diagramType TEXT NOT NULL,
      content TEXT NOT NULL,
      format TEXT NOT NULL,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL,
      FOREIGN KEY (projectId) REFERENCES Project(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_UMLDiagram_projectId ON UMLDiagram(projectId);
    CREATE INDEX IF NOT EXISTS idx_UMLDiagram_diagramType ON UMLDiagram(diagramType);

    -- Approver table
    CREATE TABLE IF NOT EXISTS Approver (
      id TEXT PRIMARY KEY,
      projectId TEXT NOT NULL,
      email TEXT NOT NULL,
      name TEXT NOT NULL,
      role TEXT,
      addedAt TEXT NOT NULL,
      addedBy TEXT,
      FOREIGN KEY (projectId) REFERENCES Project(id) ON DELETE CASCADE,
      UNIQUE(projectId, email)
    );

    CREATE INDEX IF NOT EXISTS idx_Approver_projectId ON Approver(projectId);
    CREATE INDEX IF NOT EXISTS idx_Approver_email ON Approver(email);

    -- Approval table
    CREATE TABLE IF NOT EXISTS Approval (
      id TEXT PRIMARY KEY,
      projectId TEXT NOT NULL,
      approverId TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'PENDING',
      signature TEXT,
      comments TEXT,
      signedAt TEXT,
      approvedAt TEXT,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL,
      FOREIGN KEY (projectId) REFERENCES Project(id) ON DELETE CASCADE,
      FOREIGN KEY (approverId) REFERENCES Approver(id) ON DELETE CASCADE,
      UNIQUE(projectId, approverId)
    );

    CREATE INDEX IF NOT EXISTS idx_Approval_projectId ON Approval(projectId);
    CREATE INDEX IF NOT EXISTS idx_Approval_approverId ON Approval(approverId);
    CREATE INDEX IF NOT EXISTS idx_Approval_status ON Approval(status);

    -- ChatMessage table
    CREATE TABLE IF NOT EXISTS ChatMessage (
      id TEXT PRIMARY KEY,
      projectId TEXT,
      role TEXT NOT NULL,
      content TEXT NOT NULL,
      timestamp TEXT NOT NULL,
      capabilityType TEXT,
      createdAt TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_ChatMessage_projectId ON ChatMessage(projectId);
    CREATE INDEX IF NOT EXISTS idx_ChatMessage_timestamp ON ChatMessage(timestamp);

    -- CoverPageTemplate table
    CREATE TABLE IF NOT EXISTS CoverPageTemplate (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      content TEXT NOT NULL,
      coverPageSettings TEXT,
      previewImage TEXT,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL,
      FOREIGN KEY (userId) REFERENCES User(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_CoverPageTemplate_userId ON CoverPageTemplate(userId);
    CREATE INDEX IF NOT EXISTS idx_CoverPageTemplate_name ON CoverPageTemplate(name);

    -- User table
    CREATE TABLE IF NOT EXISTS User (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      password TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'VIEWER',
      department TEXT,
      isActive INTEGER NOT NULL DEFAULT 1,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL,
      lastLoginAt TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_User_email ON User(email);
    CREATE INDEX IF NOT EXISTS idx_User_role ON User(role);
    CREATE INDEX IF NOT EXISTS idx_User_isActive ON User(isActive);
  `;

  db.run(createOtherTablesSQL);
  
  // Run migrations after creating tables
  await runMigrations();
}

/**
 * Run database migrations to add missing columns
 */
async function runMigrations(): Promise<void> {
  if (!db || !SQL) throw new Error('Database not initialized');

  // Check if User table exists, create if missing
  try {
    const userTableCheck = db.exec(`SELECT name FROM sqlite_master WHERE type='table' AND name='User'`);
    if (userTableCheck.length === 0) {
      // User table doesn't exist, create it
      console.log('📦 Creating User table...');
      db.run(`
        CREATE TABLE IF NOT EXISTS User (
          id TEXT PRIMARY KEY,
          email TEXT NOT NULL UNIQUE,
          name TEXT NOT NULL,
          password TEXT NOT NULL,
          role TEXT NOT NULL DEFAULT 'VIEWER',
          department TEXT,
          isActive INTEGER NOT NULL DEFAULT 1,
          createdAt TEXT NOT NULL,
          updatedAt TEXT NOT NULL,
          lastLoginAt TEXT
        );

        CREATE INDEX IF NOT EXISTS idx_User_email ON User(email);
        CREATE INDEX IF NOT EXISTS idx_User_role ON User(role);
        CREATE INDEX IF NOT EXISTS idx_User_isActive ON User(isActive);
      `);
      console.log('✅ Created User table');
      await saveDatabase();
    }
  } catch (error) {
    console.error('Error creating User table:', error);
    // Don't throw - continue with other migrations
  }

  // Check if Project table has userId column, add if missing
  try {
    const projectTableCheck = db.exec(`SELECT name FROM sqlite_master WHERE type='table' AND name='Project'`);
    if (projectTableCheck.length > 0) {
      const tableInfo = db.exec(`PRAGMA table_info(Project)`);
      if (tableInfo.length > 0) {
        const columns = tableInfo[0].values.map((row: any) => row[1] as string);
        const hasUserId = columns.includes('userId');
        
        if (!hasUserId) {
          console.log('📦 Adding userId column to Project table...');
          db.run(`ALTER TABLE Project ADD COLUMN userId TEXT`);
          // Create index for userId
          db.run(`CREATE INDEX IF NOT EXISTS idx_Project_userId ON Project(userId)`);
          console.log('✅ Added userId column to Project table');
          await saveDatabase();
        }
      }
    }
  } catch (error) {
    console.error('Error adding userId to Project table:', error);
    // Don't throw - continue with other migrations
  }

  // Ensure Project table has coverPageTemplateId column
  try {
    const projectTableCheck = db.exec(`SELECT name FROM sqlite_master WHERE type='table' AND name='Project'`);
    if (projectTableCheck.length > 0) {
      const tableInfo = db.exec(`PRAGMA table_info(Project)`);
      if (tableInfo.length > 0) {
        const columns = tableInfo[0].values.map((row: any) => row[1] as string);
        if (!columns.includes('coverPageTemplateId')) {
          console.log('📦 Adding coverPageTemplateId column to Project table...');
          db.run('ALTER TABLE Project ADD COLUMN coverPageTemplateId TEXT');
          console.log('✅ Added coverPageTemplateId column to Project table');
          await saveDatabase();
        }
      }
    }
  } catch (error) {
    console.error('Error adding coverPageTemplateId to Project table:', error);
  }

  // Ensure CoverPageTemplate table exists
  try {
    const coverTemplateTableCheck = db.exec(`SELECT name FROM sqlite_master WHERE type='table' AND name='CoverPageTemplate'`);
    if (coverTemplateTableCheck.length === 0) {
      console.log('📦 Creating CoverPageTemplate table...');
      db.run(`
        CREATE TABLE IF NOT EXISTS CoverPageTemplate (
          id TEXT PRIMARY KEY,
          userId TEXT NOT NULL,
          name TEXT NOT NULL,
          description TEXT,
          content TEXT NOT NULL,
          coverPageSettings TEXT,
          previewImage TEXT,
          createdAt TEXT NOT NULL,
          updatedAt TEXT NOT NULL,
          FOREIGN KEY (userId) REFERENCES User(id) ON DELETE CASCADE
        );

        CREATE INDEX IF NOT EXISTS idx_CoverPageTemplate_userId ON CoverPageTemplate(userId);
        CREATE INDEX IF NOT EXISTS idx_CoverPageTemplate_name ON CoverPageTemplate(name);
      `);
      console.log('✅ Created CoverPageTemplate table');
      await saveDatabase();
    }
  } catch (error) {
    console.error('Error ensuring CoverPageTemplate table exists:', error);
  }

  // Migrate existing GeneratedSection table to add new columns if they don't exist
  try {
    // Check if GeneratedSection table exists
    const tableCheck = db.exec(`SELECT name FROM sqlite_master WHERE type='table' AND name='GeneratedSection'`);
    if (tableCheck.length === 0) {
      // Table doesn't exist yet, migrations will be handled by createTables
      return;
    }

    // Check if parentSectionId column exists
    const tableInfo = db.exec(`PRAGMA table_info(GeneratedSection)`);
    if (tableInfo.length > 0) {
      const columns = tableInfo[0].values.map((row: any) => row[1] as string); // Column names are in index 1
      const hasParentSectionId = columns.includes('parentSectionId');
      const hasOrder = columns.includes('order');
      
      if (!hasParentSectionId) {
        db.run(`ALTER TABLE GeneratedSection ADD COLUMN parentSectionId TEXT`);
        console.log('✅ Added parentSectionId column to GeneratedSection table');
        await saveDatabase();
      }
      
      if (!hasOrder) {
        db.run(`ALTER TABLE GeneratedSection ADD COLUMN "order" INTEGER`);
        console.log('✅ Added order column to GeneratedSection table');
        await saveDatabase();
      }
      
      // Add index for parentSectionId if it was just added or doesn't exist
      if (!hasParentSectionId) {
        try {
          db.run(`CREATE INDEX IF NOT EXISTS idx_GeneratedSection_parentSectionId ON GeneratedSection(parentSectionId)`);
          await saveDatabase();
        } catch (e) {
          // Index might already exist, ignore
          console.log('Index creation note:', e);
        }
      }
    }
  } catch (error) {
    // Log error but don't throw - migration failures shouldn't break the app
    console.error('Migration error:', error);
  }
}

/**
 * Save database - saves to both file system (if available) and localStorage
 */
export async function saveDatabase(): Promise<void> {
  if (!db) throw new Error('Database not initialized');
  
  // Create backup before saving (if not already backed up recently)
  try {
    const lastBackup = localStorage.getItem(`${DB_BACKUP_NAME}_timestamp`);
    const now = Date.now();
    // Backup every 5 minutes or if no backup exists
    if (!lastBackup || (now - parseInt(lastBackup, 10)) > 5 * 60 * 1000) {
      await createBackup();
      localStorage.setItem(`${DB_BACKUP_NAME}_timestamp`, now.toString());
    }
  } catch (error) {
    console.warn('Could not create backup, continuing with save:', error);
  }
  
  // Try to save to file system first (if file handle exists)
  if (fileHandle) {
    try {
      await saveDatabaseToFile();
    } catch (error) {
      console.warn('Could not save to file, saving to localStorage:', error);
    }
  }
  
  // Always also save to localStorage as backup
  await saveDatabaseToLocalStorage();
}

/**
 * Get database instance - auto-initializes if not already initialized
 */
export async function getDatabase(): Promise<Database> {
  if (!db) {
    return await initDatabase();
  }
  return db;
}

/**
 * Close database connection
 */
export function closeDatabase(): void {
  if (db) {
    db.close();
    db = null;
  }
  fileHandle = null;
}
