# Storage Configuration

## Default Storage: SQLite

This application uses **SQLite** as the default storage mechanism. All data is persisted in a SQLite database file that is stored within the application.

## Storage Location

The SQLite database is stored in:
1. **File System** (primary): If the browser supports File System Access API, the database is saved to a file that the user can manage
2. **localStorage** (backup): As a fallback, the database is also stored in browser's localStorage

## Database File

- **File Name**: `sdd-generator.db`
- **Location**: User's file system (when File System Access API is available)
- **Backup**: Automatically backed up to localStorage

## Migration

The application includes a one-time migration from IndexedDB to SQLite. This migration runs automatically on first load if IndexedDB data exists.

## Repository

All components use `PrismaProjectRepository` which interfaces with the SQLite database. This is the default and only storage mechanism.

## Benefits of SQLite

- ✅ Single file database (easy to backup/restore)
- ✅ Standard SQL interface
- ✅ Better performance for complex queries
- ✅ Can be exported/imported easily
- ✅ Works offline
- ✅ Persistent across browser sessions

## Database Operations

All database operations go through:
- `PrismaProjectRepository` - Main repository for project data
- `UserRepository` - Repository for user authentication data

Both use the same SQLite database instance.

