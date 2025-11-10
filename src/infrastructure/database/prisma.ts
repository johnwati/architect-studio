import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default prisma;

// Export types for use in application layer
export type { ArtifactType, GeneratedSection, Project, ProjectArtifact } from '@prisma/client';


