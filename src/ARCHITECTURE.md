# Hexagonal Architecture

This project follows hexagonal architecture (also known as Ports & Adapters) to separate concerns and improve maintainability.

## Architecture Layers

### 1. Domain Layer (`src/domain/`)

The core business logic and entities.

#### Entities (`entities/`)
- **Section.ts**: Core domain models (Section, Subsection, UploadedFile, GeneratedContent, ProjectContext)

#### Ports (`ports/`)
Interfaces that define contracts for external dependencies:
- **IGenerateContent.ts**: Interface for AI content generation
- **IStorageAdapter.ts**: Interface for file storage operations
- **IExportAdapter.ts**: Interface for document export

#### Services (`services/`)
- **sections.ts**: Domain service providing section definitions

### 2. Application Layer (`src/application/`)

Contains use cases and application-specific services.

**Currently**: Empty - use cases are directly in the presentation layer for simplicity.

### 3. Infrastructure Layer (`src/infrastructure/`)

External adapters that implement domain ports.

#### API Adapters (`adapters/api/`)
- **ClaudeApiAdapter.ts**: Implements `IGenerateContent` using Anthropic's Claude API

#### File Storage Adapters (`adapters/file-storage/`)
- **BrowserStorageAdapter.ts**: Implements `IStorageAdapter` using browser File API
- **WordExportAdapter.ts**: Implements `IExportAdapter` for Word document export

### 4. Presentation Layer (`src/presentation/`)

UI components and pages.

#### Components (`components/`)
- **SDDGenerator.tsx**: Main React component that orchestrates the application

## Dependency Flow

```
Presentation → Application → Domain ← Infrastructure
```

- Presentation depends on Domain (interfaces)
- Infrastructure implements Domain interfaces
- Presentation wires infrastructure adapters to domain ports

## Benefits

1. **Testability**: Easy to mock adapters for testing
2. **Maintainability**: Clear separation of concerns
3. **Flexibility**: Can swap adapters (e.g., different AI provider, storage solution)
4. **Domain Independence**: Business logic doesn't depend on external frameworks

## Adding a New Feature

### Example: Add a new file format support

1. **Domain**: Add interface method to `IStorageAdapter`
2. **Infrastructure**: Implement method in `BrowserStorageAdapter`
3. **Presentation**: Use the new method in `SDDGenerator`

### Example: Switch AI provider

1. Create new adapter implementing `IGenerateContent`
2. Update `SDDGenerator` to use new adapter
3. No changes to domain logic required

## File Structure

```
src/
├── domain/
│   ├── entities/
│   │   └── Section.ts
│   ├── ports/
│   │   ├── IGenerateContent.ts
│   │   ├── IStorageAdapter.ts
│   │   └── IExportAdapter.ts
│   └── services/
│       └── sections.ts
├── application/
│   ├── services/
│   └── use-cases/
├── infrastructure/
│   └── adapters/
│       ├── api/
│       │   └── ClaudeApiAdapter.ts
│       └── file-storage/
│           ├── BrowserStorageAdapter.ts
│           └── WordExportAdapter.ts
└── presentation/
    ├── components/
    │   └── SDDGenerator.tsx
    └── pages/
```

## Testing Strategy

With hexagonal architecture:
- **Unit tests**: Test domain logic in isolation
- **Integration tests**: Test adapter implementations
- **E2E tests**: Test through presentation layer with real adapters
- **Mock tests**: Test presentation layer with mocked adapters


