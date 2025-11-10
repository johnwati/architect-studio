# Electron Desktop Application Setup

This application has been configured to run as a cross-platform desktop application using Electron.

## Development

### Running in Development Mode

To run the application in development mode with hot-reload:

```bash
npm run electron:dev
```

This will:
1. Start the Vite dev server on `http://localhost:3000`
2. Wait for the server to be ready
3. Launch Electron with the dev server URL

### Building for Production

#### Build all platforms (from current OS)
```bash
npm run electron:dist
```

#### Build for specific platforms:

**macOS:**
```bash
npm run electron:dist:mac
```
Creates:
- DMG installer (x64 and ARM64)
- ZIP archive (x64 and ARM64)

**Windows:**
```bash
npm run electron:dist:win
```
Creates:
- NSIS installer (x64 and IA32)
- Portable executable (x64)

**Linux:**
```bash
npm run electron:dist:linux
```
Creates:
- AppImage
- DEB package
- RPM package

#### Pack without creating installers (for testing):
```bash
npm run electron:pack
```

## Build Output

All built applications will be in the `release/` directory:
- macOS: `release/mac/Architect Studio-{version}.dmg`
- Windows: `release/win-unpacked/` (portable) or `release/Architect Studio Setup {version}.exe` (installer)
- Linux: `release/Architect Studio-{version}.AppImage` or `.deb`/`.rpm` files

## Project Structure

```
electron/
  ├── main.ts      # Main Electron process (handles window creation, app lifecycle)
  └── preload.ts   # Preload script (secure bridge between main and renderer)

electron-dist/     # Compiled Electron files (generated, gitignored)
release/           # Built applications (generated, gitignored)
```

## Configuration

### Electron Builder Configuration

The build configuration is in `package.json` under the `"build"` key. You can customize:

- **App ID**: `com.equitybank.architect-studio`
- **Product Name**: `Architect Studio`
- **Icons**: Place icons in `build/` directory:
  - `build/icon.icns` (macOS)
  - `build/icon.ico` (Windows)
  - `build/icon.png` (Linux)

### Environment Variables

The app detects development vs production mode automatically:
- Development: Loads from `http://localhost:3000`
- Production: Loads from `dist/index.html`

## Cross-Platform Building

### Building for Windows from macOS/Linux

You can build Windows installers from macOS or Linux, but you'll need Wine installed for NSIS:

```bash
# Install Wine (macOS)
brew install wine-stable

# Then build
npm run electron:dist:win
```

### Building for macOS from Windows/Linux

macOS builds require running on macOS due to code signing requirements. However, you can create unsigned builds.

### Building for Linux from any platform

Linux builds can be created from any platform.

## Troubleshooting

### TypeScript Compilation Errors

If you see TypeScript errors when building:
```bash
npm run electron:compile
```

This will compile the Electron TypeScript files separately.

### Port Already in Use

If port 3000 is already in use, change it in `vite.config.ts`:
```typescript
server: {
  port: 3001, // Change this
}
```

### DevTools Not Opening

DevTools automatically open in development mode. If they don't, check the Electron window menu or add:
```typescript
mainWindow.webContents.openDevTools();
```

## Security

The application uses:
- **Context Isolation**: Enabled (secure)
- **Node Integration**: Disabled (secure)
- **Preload Script**: Used for secure IPC communication

All communication between the main process and renderer process goes through the preload script via `window.electronAPI`.

## Adding New IPC Handlers

1. Add handler in `electron/main.ts`:
```typescript
ipcMain.handle('your-action', async (event, data) => {
  // Your logic here
  return result;
});
```

2. Expose in `electron/preload.ts`:
```typescript
contextBridge.exposeInMainWorld('electronAPI', {
  // ... existing APIs
  yourAction: (data) => ipcRenderer.invoke('your-action', data),
});
```

3. Use in renderer (React components):
```typescript
const result = await window.electronAPI.yourAction(data);
```

