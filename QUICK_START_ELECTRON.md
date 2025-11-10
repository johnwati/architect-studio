# Quick Start - Electron Desktop App

## 🚀 Quick Commands

### Development
```bash
npm run electron:dev
```
Runs the app in development mode with hot-reload.

### Build for Current Platform
```bash
npm run electron:dist
```

### Build for Specific Platforms
```bash
# macOS
npm run electron:dist:mac

# Windows
npm run electron:dist:win

# Linux
npm run electron:dist:linux
```

## 📦 Output Location

Built applications are saved in the `release/` directory:
- **macOS**: `.dmg` and `.zip` files
- **Windows**: `.exe` installer and portable version
- **Linux**: `.AppImage`, `.deb`, and `.rpm` packages

## 🎯 First Time Setup

1. **Install dependencies** (if not already done):
   ```bash
   npm install
   ```

2. **Test development mode**:
   ```bash
   npm run electron:dev
   ```

3. **Build for your platform**:
   ```bash
   npm run electron:dist
   ```

## 📝 Notes

- The app automatically detects development vs production mode
- DevTools open automatically in development
- External links open in the default browser
- The app uses secure context isolation (no Node.js in renderer)

For more details, see [ELECTRON_SETUP.md](./ELECTRON_SETUP.md)

