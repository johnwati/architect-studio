import { UserEntity, UserRole } from '../../domain/entities/User';
import { UserRepository } from '../repositories/UserRepository';

// Authentication service using SQLite database
export class AuthService {
  private static readonly STORAGE_KEY = 'architect_studio_user';
  private static readonly SESSION_KEY = 'architect_studio_session';
  private static userRepository = new UserRepository();

  /**
   * Sign up a new user
   */
  static async signup(
    email: string,
    name: string,
    password: string,
    department?: string
  ): Promise<UserEntity> {
    // Validate input
    if (!email || !email.includes('@')) {
      throw new Error('Please enter a valid email address');
    }
    if (!name || name.trim().length < 2) {
      throw new Error('Please enter your full name (at least 2 characters)');
    }
    if (!password || password.length < 6) {
      throw new Error('Password must be at least 6 characters long');
    }

    // Determine role from email (demo logic)
    const role = this.getRoleFromEmail(email);

    // Create user in database
    const user = await this.userRepository.createUser(
      email,
      name.trim(),
      password,
      role,
      department?.trim()
    );

    // Store user in sessionStorage
    sessionStorage.setItem(this.SESSION_KEY, JSON.stringify(user));
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(user));

    return user;
  }

  /**
   * Login with email and password
   */
  static async login(email: string, password: string): Promise<UserEntity> {
    // Validate input
    if (!email || !password) {
      throw new Error('Please enter both email and password');
    }

    // Verify password
    const isValid = await this.userRepository.verifyPassword(email, password);
    if (!isValid) {
      throw new Error('Invalid email or password');
    }

    // Get user from database
    const user = await this.userRepository.getUserByEmail(email);
    if (!user) {
      throw new Error('User not found');
    }

    if (!user.isActive) {
      throw new Error('Your account has been deactivated. Please contact an administrator.');
    }

    // Update last login time
    await this.userRepository.updateLastLogin(email);
    user.lastLoginAt = new Date();

    // Store user in sessionStorage
    sessionStorage.setItem(this.SESSION_KEY, JSON.stringify(user));
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(user));

    return user;
  }

  /**
   * Get current user from storage
   */
  static getCurrentUser(): UserEntity | null {
    try {
      const sessionUser = sessionStorage.getItem(this.SESSION_KEY);
      if (sessionUser) {
        const user = JSON.parse(sessionUser);
        return {
          ...user,
          createdAt: new Date(user.createdAt),
          updatedAt: new Date(user.updatedAt),
          lastLoginAt: user.lastLoginAt ? new Date(user.lastLoginAt) : undefined,
        };
      }
      return null;
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  }

  /**
   * Logout current user
   */
  static logout(): void {
    sessionStorage.removeItem(this.SESSION_KEY);
    localStorage.removeItem(this.STORAGE_KEY);
  }

  /**
   * Check if user is authenticated
   */
  static isAuthenticated(): boolean {
    return this.getCurrentUser() !== null;
  }

  /**
   * Determine user role from email (demo logic)
   */
  private static getRoleFromEmail(email: string): UserRole {
    const emailLower = email.toLowerCase();
    if (emailLower.includes('admin')) return 'ADMIN';
    if (emailLower.includes('architect')) return 'ARCHITECT';
    if (emailLower.includes('reviewer')) return 'REVIEWER';
    return 'ARCHITECT'; // Default role for new signups
  }
}

