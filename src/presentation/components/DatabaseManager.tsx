import { AlertCircle, Bell, Database, Download, FolderOpen, Info, RefreshCw, Upload } from 'lucide-react';
import React, { useState } from 'react';
import { migrateIndexedDBToSQLite } from '../../infrastructure/database/migrate';
import { exportDatabase, importDatabase, selectDatabaseFile } from '../../infrastructure/database/sqlite';

const DatabaseManager: React.FC = () => {
  const [isImporting, setIsImporting] = useState(false);
  const [isSelectingFile, setIsSelectingFile] = useState(false);
  const [isMigrating, setIsMigrating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleExport = async () => {
    try {
      setError(null);
      setSuccess(null);
      await exportDatabase();
      setSuccess('Database exported successfully! The file can be shared across browsers.');
    } catch (err: any) {
      setError(err.message || 'Failed to export database');
    }
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setIsImporting(true);
      setError(null);
      setSuccess(null);
      await importDatabase(file);
      setSuccess('Database imported successfully! Page will reload...');
    } catch (err: any) {
      setError(err.message || 'Failed to import database');
      setIsImporting(false);
    } finally {
      // Reset file input
      event.target.value = '';
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center space-x-3 mb-2">
          <Database className="text-red-700" size={28} />
          <h1 className="text-2xl font-bold text-gray-900">Database Management</h1>
        </div>
        <p className="text-gray-600">
          Export or import your database file to share it across different browsers. 
          The database file contains all your projects, artifacts, and generated content.
        </p>
      </div>

      {/* Error/Success Messages */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start space-x-3">
          <AlertCircle className="text-red-600 flex-shrink-0 mt-0.5" size={20} />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {success && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-sm text-green-700">{success}</p>
        </div>
      )}

      {/* Action Buttons */}
      <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Migrate Browser Data */}
          <button
            onClick={async () => {
              try {
                setIsMigrating(true);
                setError(null);
                setSuccess(null);
                await migrateIndexedDBToSQLite();
                setSuccess('Migration completed successfully! All browser data has been migrated to the file database.');
                setTimeout(() => {
                  window.location.reload();
                }, 2000);
              } catch (err: any) {
                setError(err.message || 'Failed to migrate data from IndexedDB');
              } finally {
                setIsMigrating(false);
              }
            }}
            disabled={isMigrating}
            className="flex items-center justify-center space-x-2 bg-orange-600 text-white px-6 py-3 rounded-lg hover:bg-orange-700 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw size={20} className={isMigrating ? 'animate-spin' : ''} />
            <span>{isMigrating ? 'Migrating...' : 'Migrate Browser Data'}</span>
          </button>

          {/* Select Database File */}
          {'showOpenFilePicker' in window ? (
            <button
              onClick={async () => {
                try {
                  setIsSelectingFile(true);
                  setError(null);
                  setSuccess(null);
                  const handle = await selectDatabaseFile();
                  if (handle) {
                    setSuccess('Database file selected! Changes will be saved automatically to this file. You can now use this same file in other browsers by selecting it there too.');
                    setTimeout(() => {
                      window.location.reload();
                    }, 2000);
                  }
                } catch (err: any) {
                  if (err.name !== 'AbortError') {
                    setError(err.message || 'Failed to select database file');
                  }
                } finally {
                  setIsSelectingFile(false);
                }
              }}
              disabled={isSelectingFile}
              className="flex items-center justify-center space-x-2 bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FolderOpen size={20} />
              <span>{isSelectingFile ? 'Selecting...' : 'Select Database File'}</span>
            </button>
          ) : (
            <div className="flex items-center justify-center space-x-2 bg-gray-300 text-gray-600 px-6 py-3 rounded-lg cursor-not-allowed">
              <FolderOpen size={20} />
              <span>Select Database File (Not Available)</span>
            </div>
          )}

          {/* Export Database */}
          <button
            onClick={handleExport}
            className="flex items-center justify-center space-x-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-semibold"
          >
            <Download size={20} />
            <span>Export Database</span>
          </button>

          {/* Import Database */}
          <label className="flex items-center justify-center space-x-2 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors font-semibold cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed">
            <Upload size={20} />
            <span>{isImporting ? 'Importing...' : 'Import Database'}</span>
            <input
              type="file"
              accept=".db,.sqlite,.sqlite3"
              onChange={handleImport}
              disabled={isImporting}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {/* Information Section */}
      <div className="space-y-4">
        {/* First Time Setup */}
        <div className="bg-white rounded-lg shadow-md border border-orange-200 p-6">
          <div className="flex items-start space-x-3 mb-3">
            <Bell className="text-orange-600 flex-shrink-0 mt-0.5" size={20} />
            <div className="flex-1">
              <h3 className="text-base font-semibold text-gray-800 mb-2">🔔 First Time Setup</h3>
              <p className="text-sm text-gray-700 leading-relaxed">
                If you have existing data in your browser, click "Migrate Browser Data" to transfer all your projects, 
                artifacts, and generated content from IndexedDB to the SQLite file database.
              </p>
            </div>
          </div>
        </div>

        {/* How to Use Across Browsers */}
        <div className="bg-white rounded-lg shadow-md border border-blue-200 p-6">
          <div className="flex items-start space-x-3 mb-3">
            <Info className="text-blue-600 flex-shrink-0 mt-0.5" size={20} />
            <div className="flex-1">
              <h3 className="text-base font-semibold text-gray-800 mb-3">How to use across browsers:</h3>
              
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-semibold text-gray-800 mb-2">
                    Method 1 (Recommended - Chrome/Edge):
                  </h4>
                  <p className="text-sm text-gray-700 leading-relaxed">
                    Use "Select Database File" to choose a shared database file location. The app will automatically 
                    save to this file, making it accessible from any browser.
                  </p>
                </div>

                <div>
                  <h4 className="text-sm font-semibold text-gray-800 mb-2">Method 2 (All browsers):</h4>
                  <ol className="text-sm text-gray-700 leading-relaxed list-decimal list-inside space-y-1">
                    <li>Export the database from one browser</li>
                    <li>Save the file to a shared location (e.g., cloud storage, USB drive, network drive)</li>
                    <li>Import the file in another browser</li>
                    <li>All your projects and data will be available!</li>
                  </ol>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DatabaseManager;

