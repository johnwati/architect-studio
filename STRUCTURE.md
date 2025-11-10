# Project Structure

This document describes the complete project structure after organizing files into their respective folders.

## Directory Structure

```
ISD_generator/
├── src/                              # Source code
│   ├── application/                  # Application layer
│   │   ├── services/
│   │   └── use-cases/
│   ├── domain/                       # Domain layer
│   │   ├── entities/
│   │   │   └── Section.ts
│   │   ├── ports/
│   │   │   ├── IExportAdapter.ts
│   │   │   ├── IGenerateContent.ts
│   │   │   └── IStorageAdapter.ts
│   │   └── services/
│   │       └── sections.ts
│   ├── infrastructure/               # Infrastructure layer
│   │   └── adapters/
│   │       ├── api/
│   │       │   └── ClaudeApiAdapter.ts
│   │       └── file-storage/
│   │           ├── BrowserStorageAdapter.ts
│   │           └── WordExportAdapter.ts
│   ├── presentation/                 # Presentation layer
│   │   ├── components/
│   │   │   └── SDDGenerator.tsx
│   │   ├── pages/
│   │   └── styles/
│   │       └── index.css
│   └── ARCHITECTURE.md               # Architecture documentation
├── dist/                             # Build output
├── node_modules/                     # Dependencies
├── index.html                        # Entry HTML file
├── index.tsx                         # Entry React component
├── package.json                      # Dependencies and scripts
├── package-lock.json                 # Locked dependencies
├── postcss.config.js                 # PostCSS configuration
├── tailwind.config.js                # Tailwind CSS configuration
├── tsconfig.json                     # TypeScript configuration
├── tsconfig.node.json                # Node TypeScript configuration
├── vite.config.ts                    # Vite configuration
├── README.md                         # Project documentation
├── SETUP_COMPLETE.md                 # Setup summary
└── STRUCTURE.md                      # This file
```

## Key Files

### Entry Points
- **index.html**: HTML entry point
- **index.tsx**: React application entry point that imports from `src/`

### Configuration Files
- **package.json**: Project dependencies and npm scripts
- **vite.config.ts**: Vite bundler configuration
- **tsconfig.json**: TypeScript compilation options
- **tsconfig.node.json**: TypeScript config for Node files (vite.config.ts)
- **tailwind.config.js**: Tailwind CSS configuration
- **postcss.config.js**: PostCSS plugins configuration

### Source Structure (`src/`)

#### Domain Layer
**Purpose**: Core business logic and entities

- `entities/`: Domain models (Section, UploadedFile, GeneratedContent, ProjectContext)
- `ports/`: Interfaces for external dependencies
- `services/`: Business logic and domain services

#### Infrastructure Layer
**Purpose**: External adapters and integrations

- `adapters/api/`: API integration adapters (Claude AI)
- `adapters/file-storage/`: File handling and export adapters

#### Presentation Layer
**Purpose**: UI components and styling

- `components/`: React components (SDDGenerator)
- `pages/`: Page-level components (currently empty)
- `styles/`: CSS and styling files

#### Application Layer
**Purpose**: Use cases and application services

- Currently empty - can be used for business logic orchestration

## File Organization Principles

1. **Configuration at Root**: Build tools, TypeScript, and CSS configs stay at root
2. **Source in `src/`**: All source code organized by architectural layers
3. **Separation of Concerns**: Each layer has a clear responsibility
4. **Hexagonal Architecture**: Domain-centric with ports and adapters

## Import Pattern

All imports follow this pattern:
```typescript
// From domain
import { Section } from '../../domain/entities/Section';

// From infrastructure
import { ClaudeApiAdapter } from '../../infrastructure/adapters/api/ClaudeApiAdapter';

// From presentation
import SDDGenerator from './components/SDDGenerator';
```

## Build Process

1. **Dev**: `npm run dev` - Starts Vite dev server
2. **Build**: `npm run build` - Creates production build in `dist/`
3. **Preview**: `npm run preview` - Preview production build

## Adding New Files

### Adding a New Adapter
1. Create file in appropriate `infrastructure/adapters/` subfolder
2. Implement the domain port interface
3. Export from the component

### Adding a New Component
1. Create file in `src/presentation/components/`
2. Import domain entities/interfaces as needed
3. Wire up infrastructure adapters

### Adding a New Domain Entity
1. Create file in `src/domain/entities/`
2. Define types and interfaces
3. Export from domain layer

## Benefits of This Structure

✅ **Maintainability**: Clear organization makes code easy to find and modify  
✅ **Scalability**: Easy to add new features without cluttering  
✅ **Testability**: Isolated layers can be tested independently  
✅ **Flexibility**: Can swap implementations without affecting other layers  
✅ **Team Collaboration**: Clear conventions for where files belong  


