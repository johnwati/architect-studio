# Architect Studio

AI-powered solution design documentation platform for Equity Bank Limited that creates comprehensive Solution Architecture Design documents using Claude AI.

## ✨ Features

- **AI-Powered Content Generation**: Uses Claude AI to generate professional SDD content
- **Project Management**: Create and manage multiple projects with artifacts
- **Document Upload**: Support for BRDs, flows, diagrams, PDFs, DOC, DOCX, TXT, and MD files
- **25 Comprehensive Sections**: Complete SDD with all architecture aspects
- **Knowledge Base**: AI uses your uploaded BRDs/diagrams as context
- **Interactive Editing**: Edit and format generated content with markdown support
- **Word Export**: Download complete documents in Word format
- **Local Storage**: IndexedDB for persistent data
- **Professional UI**: Tailwind CSS with responsive design

## 🚀 Quick Start

### Installation

```bash
npm install
```

### Configuration

1. Add required API keys to `.env`:
```bash
VITE_ANTHROPIC_API_KEY=sk-ant-your-key-here
VITE_TINYMCE_API_KEY=your-tinymce-api-key   # optional but recommended
```

Get your API key: https://console.anthropic.com/

Get a TinyMCE key (free tier available): https://www.tiny.cloud/

### Run

```bash
npm run dev
```

Visit `http://localhost:3000` (or the port Vite assigns)

**IMPORTANT**: The app uses `dangerouslyAllowBrowser: true` to run Claude API in the browser. This is intentional for this single-user application. For production, consider using a backend proxy.

### Usage

1. **Create Project** → Enter name and description
2. **Upload Artifacts** → Add BRDs, flows, diagrams
3. **Generate Sections** → AI creates content using your artifacts
4. **Export Word** → Download professional SDD document

## 🏗️ Architecture

**Hexagonal Architecture** pattern implemented:

- **Domain Layer**: Business logic and entities
- **Infrastructure Layer**: Database, API adapters, repositories
- **Presentation Layer**: React components and UI

See `src/ARCHITECTURE.md` for detailed documentation.

## 📚 Technology Stack

- React 18
- TypeScript
- Vite
- Tailwind CSS
- Lucide Icons
- Dexie (IndexedDB)
- Prisma (optional)
- Claude AI (Anthropic SDK)

## 📖 Documentation

- `README.md` - This file
- `QUICK_START.md` - Getting started guide
- `HOW_TO_USE.md` - Detailed usage instructions
- `COMPLETE_SETUP.md` - Full feature overview
- `src/ARCHITECTURE.md` - Technical architecture
- `DATABASE_SETUP.md` - Database details
- `STRUCTURE.md` - Project structure

## 🔐 Security Note

This application runs the Claude API directly in the browser with `dangerouslyAllowBrowser: true`. For production use with sensitive data, consider implementing a backend proxy to protect API keys.

## 📄 License

©2025 Equity Group Holdings PLC - All rights reserved.
Confidential and Proprietary to Equity Group Holdings PLC
