/**
 * Database Recovery Utility
 * 
 * This utility helps recover lost projects from localStorage backups
 * Run this in the browser console if you've lost data
 */

import { exportDatabase, getDatabase, restoreFromBackup } from './sqlite';

/**
 * Check for and list all available backups in localStorage
 */
export function listBackups(): { name: string; size: number; timestamp?: string }[] {
  const backups: { name: string; size: number; timestamp?: string }[] = [];
  
  // Check main database
  const mainDb = localStorage.getItem('SDDGeneratorDB');
  if (mainDb) {
    backups.push({
      name: 'SDDGeneratorDB (Main)',
      size: mainDb.length,
      timestamp: 'Current'
    });
  }
  
  // Check backup
  const backupDb = localStorage.getItem('SDDGeneratorDB_backup');
  if (backupDb) {
    backups.push({
      name: 'SDDGeneratorDB_backup',
      size: backupDb.length,
      timestamp: 'Backup'
    });
  }
  
  // Check for any other backups
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith('SDDGeneratorDB') && key !== 'SDDGeneratorDB' && key !== 'SDDGeneratorDB_backup') {
      const value = localStorage.getItem(key);
      if (value) {
        backups.push({
          name: key,
          size: value.length,
          timestamp: 'Unknown'
        });
      }
    }
  }
  
  return backups;
}

/**
 * Attempt to recover projects from any available backup
 */
export async function recoverProjects(): Promise<{ success: boolean; message: string; projectCount?: number }> {
  try {
    // First, try to restore from backup
    const restored = await restoreFromBackup();
    
    if (restored) {
      // Check how many projects were recovered
      const db = await getDatabase();
      const result = db.exec('SELECT COUNT(*) as count FROM Project');
      const projectCount = result.length > 0 && result[0].values.length > 0 
        ? result[0].values[0][0] as number 
        : 0;
      
      return {
        success: true,
        message: `Successfully recovered ${projectCount} project(s) from backup`,
        projectCount
      };
    }
    
    // If no backup, check if main database exists
    const mainDb = localStorage.getItem('SDDGeneratorDB');
    if (mainDb) {
      try {
        const db = await getDatabase();
        const result = db.exec('SELECT COUNT(*) as count FROM Project');
        const projectCount = result.length > 0 && result[0].values.length > 0 
          ? result[0].values[0][0] as number 
          : 0;
        
        return {
          success: true,
          message: `Found ${projectCount} project(s) in main database`,
          projectCount
        };
      } catch (error) {
        return {
          success: false,
          message: `Main database exists but is corrupted: ${error}`
        };
      }
    }
    
    return {
      success: false,
      message: 'No backups found. Data may have been permanently lost.'
    };
  } catch (error) {
    return {
      success: false,
      message: `Recovery failed: ${error}`
    };
  }
}

/**
 * Export current database as backup file
 */
export async function exportCurrentDatabase(): Promise<void> {
  await exportDatabase();
}

/**
 * Instructions for manual recovery from browser console
 */
export function printRecoveryInstructions(): void {
  console.log(`
╔══════════════════════════════════════════════════════════════╗
║         DATABASE RECOVERY INSTRUCTIONS                       ║
╚══════════════════════════════════════════════════════════════╝

If your projects are lost, follow these steps:

1. Open Browser DevTools (F12)
2. Go to Application tab → Local Storage
3. Look for these keys:
   - SDDGeneratorDB (main database)
   - SDDGeneratorDB_backup (backup)

4. To recover in console:
   import { recoverProjects } from './src/infrastructure/database/recovery';
   await recoverProjects();

5. To export current database:
   import { exportCurrentDatabase } from './src/infrastructure/database/recovery';
   await exportCurrentDatabase();

6. To list all backups:
   import { listBackups } from './src/infrastructure/database/recovery';
   listBackups();

⚠️  IMPORTANT: Do not clear localStorage until you've recovered your data!
  `);
}

// Make functions available globally for console access
if (typeof window !== 'undefined') {
  (window as any).recoverProjects = recoverProjects;
  (window as any).listBackups = listBackups;
  (window as any).exportCurrentDatabase = exportCurrentDatabase;
  (window as any).printRecoveryInstructions = printRecoveryInstructions;
}

