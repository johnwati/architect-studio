import { IProjectRepository } from '../../domain/ports/IProjectRepository';
import { PrismaProjectRepository } from './PrismaProjectRepository';

/**
 * Repository Factory
 * 
 * Default storage is SQLite. This factory ensures all components
 * use the same repository implementation.
 */
export class RepositoryFactory {
  private static projectRepository: IProjectRepository | null = null;

  /**
   * Get the default project repository (SQLite)
   */
  static getProjectRepository(): IProjectRepository {
    if (!this.projectRepository) {
      this.projectRepository = new PrismaProjectRepository();
    }
    return this.projectRepository;
  }

  /**
   * Reset the repository instance (useful for testing)
   */
  static reset(): void {
    this.projectRepository = null;
  }
}

