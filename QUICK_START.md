# Quick Start Guide

## 🚀 Get Architect Studio Running in 3 Steps

### Step 1: Add Your Claude API Key

Edit the `.env` file and add your API key:

```bash
VITE_ANTHROPIC_API_KEY=sk-ant-your-actual-key-here
```

**Get your key**: https://console.anthropic.com/

### Step 2: Start the Server

```bash
npm run dev
```

The app will open at `http://localhost:3000` (or another port if 3000 is busy)

### Step 3: Create Your First SDD

1. **Create a Project**
   - Click "New Project"
   - Enter project name (e.g., "Kilimo Biashara Loan System")
   - Add description
   - Click "Create"

2. **Upload Artifacts** (Optional but Recommended)
   - Click "Upload Artifact"
   - Select artifact type (BRD, FLOW, etc.)
   - Choose your files (PDF, DOC, TXT, etc.)
   - Files are stored and analyzed

3. **Generate SDD Sections**
   - Click "Generate Section with AI" on any section
   - Watch the AI create context-aware content using your BRDs
   - Edit and refine as needed

4. **Export Document**
   - Click "Export Word"
   - Get a professional SDD document

## 💡 Pro Tips

- **Best Results**: Upload BRDs, flows, and diagrams before generating
- **AI Knowledge**: Claude analyzes your artifacts to create accurate content
- **Auto-Save**: All content is saved to IndexedDB automatically
- **Multiple Projects**: Create separate projects for different initiatives

## ⚠️ Troubleshooting

**"Error generating content"**
- Check your API key is set in `.env`
- Verify internet connection
- Make sure your API key has credits

**UI looks broken**
- Clear browser cache
- Restart dev server
- Check browser console for errors

**Can't upload files**
- Ensure files are under 10MB
- Supported: PDF, DOC, DOCX, TXT, MD

## 📚 What's Been Built

✅ Hexagonal Architecture  
✅ Project Management  
✅ Artifact Upload & Storage  
✅ AI-Powered Generation  
✅ Word Export  
✅ Professional UI  
✅ Persistent Storage  

**You're ready to create professional SDDs! 📄✨**


