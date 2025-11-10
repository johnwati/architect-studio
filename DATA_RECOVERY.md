# Data Recovery Guide

## ⚠️ If Your Projects Are Lost

If you've lost your projects, don't panic! Your data might still be recoverable from browser storage.

## Quick Recovery Steps

### Option 1: Automatic Recovery (Recommended)

1. Open your browser's Developer Console (F12)
2. Type this command:
```javascript
// First, check what backups are available
import('./src/infrastructure/database/recovery').then(m => {
  m.listBackups();
  m.recoverProjects();
});
```

3. Or simply refresh the page - the app will now automatically try to restore from backup if the main database fails to load.

### Option 2: Manual Recovery from Browser Storage

1. Open Browser DevTools (F12)
2. Go to **Application** tab (Chrome) or **Storage** tab (Firefox)
3. Click on **Local Storage** → your domain
4. Look for these keys:
   - `SDDGeneratorDB` - Main database
   - `SDDGeneratorDB_backup` - Automatic backup
5. If you see either of these with data, your projects are still there!

### Option 3: Check Browser Console

The app now automatically:
- Creates backups before migrations
- Attempts to restore from backup if loading fails
- Logs recovery attempts to the console

Check your browser console for messages like:
- `💾 Created backup of existing database`
- `🔄 Attempting to restore from backup...`
- `✅ Restored database from backup`

## Prevention: Automatic Backups

The app now automatically creates backups:
- **Before every database migration**
- **Every 5 minutes** during active use
- **Before any destructive operation**

## Export Your Database

To create a manual backup file:

1. Open browser console (F12)
2. Run:
```javascript
import('./src/infrastructure/database/sqlite').then(m => m.exportDatabase());
```

This will download a `.db` file with timestamp that you can restore later.

## Restore from Backup File

If you have a `.db` backup file:

1. Use the import function in the app (if available)
2. Or manually replace the localStorage value via DevTools

## What Changed

### Before (Problem)
- If database loading failed, it would create a NEW database
- This overwrote the old database in localStorage
- **Result: Data loss**

### After (Fixed)
- Creates backup BEFORE attempting to load
- If loading fails, tries to restore from backup
- Only creates new database if backup also fails
- **Result: Data is protected**

## Recovery Functions Available

The following functions are available in the browser console:

```javascript
// List all available backups
window.listBackups()

// Attempt automatic recovery
window.recoverProjects()

// Export current database
window.exportCurrentDatabase()

// Show recovery instructions
window.printRecoveryInstructions()
```

## Still Having Issues?

1. **Check Browser Console** - Look for error messages
2. **Check localStorage** - Verify data exists in Application tab
3. **Try Different Browser** - Data is browser-specific
4. **Check Browser Settings** - Ensure localStorage is enabled

## Notes

- Data is stored per-browser and per-domain
- Clearing browser data will delete projects
- Incognito/Private mode doesn't persist data
- Data doesn't sync across devices automatically

---

**The app now has automatic backup and recovery!** 🛡️

