# How to Use Architect Studio

## 🎯 Complete Workflow

### Step 1: Access the Application

Open your browser and go to: **http://localhost:3002/**

### Step 2: Create a Project

1. Click the **"New Project"** button at the top
2. Fill in the form:
   - **Project Name**: e.g., "Kilimo Biashara Loan System"
   - **Description**: Brief description of the project
3. Click **"Create"**
4. The project will be selected automatically

### Step 3: Upload Project Artifacts

1. Scroll to the **"Project Artifacts"** section below the project
2. Click **"Upload Artifact"**
3. Select artifact type:
   - **BRD** - Business Requirements Document
   - **FLOW** - Process Flow
   - **SEQUENCE** - Sequence Diagram
   - **ARCHITECTURE** - Architecture Diagram
   - **TECHNICAL_SPEC** - Technical Specification
   - **OTHER** - Other documents
4. Choose your file(s) and upload
5. Files are automatically analyzed and stored

### Step 4: Generate SDD Sections

1. Scroll down to see all 25 SDD sections
2. Click on any section to expand it
3. Click **"Generate Section with AI"**
4. Watch as Claude creates content using your uploaded BRDs/diagrams
5. Generated content appears below

### Step 5: Review and Edit

1. Click **"Edit Content"** on any generated section
2. Make changes using the markdown editor
3. Use formatting tools:
   - **Bold** - **text**
   - **Italic** - *text*
   - **Heading** - ## Title
   - **Bullet** - List items
4. Click **"Save Changes"** to update

### Step 6: Generate All Sections

1. Use the **"Generate All"** button in the header
2. This generates all sections sequentially
3. Takes time - be patient!

### Step 7: Export Your Document

1. Click **"Export Word"** in the header
2. A Word document (.doc) downloads automatically
3. Open in Microsoft Word for final review

## 💡 Tips for Best Results

**Upload Quality Documents**
- Upload complete BRDs with detailed requirements
- Include flow diagrams and sequence diagrams
- The more context, the better the output

**Use Proper Artifact Types**
- Mark files correctly (BRD, FLOW, etc.)
- Helps AI understand what to extract

**Review Generated Content**
- AI creates great initial drafts
- Always review for accuracy
- Edit for project-specific nuances

**Multiple Projects**
- Create separate projects for different initiatives
- Data is isolated and organized
- Easy to manage multiple SDDs

**Export Regularly**
- Export your work frequently
- Word format allows further refinement
- Share easily with stakeholders

## 🎨 Interface Overview

**Top Header**
- Project name and description
- Generate All button
- Export Word button

**Project Manager**
- List of all projects
- Create/Delete projects
- Artifact upload section

**SDD Sections**
- 25 expandable sections
- Generate individually or all at once
- Edit, save, regenerate options

**Visual Indicators**
- Green "Generated" badge on complete sections
- Progress indicators during generation
- Color-coded artifact types

## 📊 Data Management

**Local Storage**
- All data stored in browser (IndexedDB)
- Persists across sessions
- No server required

**Project Isolation**
- Each project has its own data
- Artifacts tied to projects
- Sections saved per project

**Cascade Delete**
- Deleting a project removes all associated data
- Artifacts and sections deleted automatically
- Clean data management

## 🔄 Typical Workflow

```
1. Create Project
   ↓
2. Upload BRDs & Diagrams
   ↓
3. Generate Section-by-Section
   ↓
4. Review Each Section
   ↓
5. Edit Content
   ↓
6. Generate Remaining Sections
   ↓
7. Final Review
   ↓
8. Export Word Document
```

## ⚠️ Troubleshooting

**Generation Not Working**
- Check API key in .env file
- Verify internet connection
- Check browser console for errors

**Upload Fails**
- Ensure file is under 10MB
- Use supported formats
- Try a different file

**Lost Data**
- Check browser storage enabled
- Don't clear browser data
- Export regularly for backup

---

**You're ready to create professional SDD documents! 🚀📄**


