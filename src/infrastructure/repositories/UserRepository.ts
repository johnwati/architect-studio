import { UserEntity, UserRole } from '../../domain/entities/User';
import { getDatabase, saveDatabase } from '../database/sqlite';

/**
 * UserRepository - User Management with SQLite Storage
 * 
 * This repository uses SQLite as the default storage mechanism.
 * All user data, authentication, and user-related operations
 * are stored in the SQLite database.
 */

/**
 * Simple password hashing function (for demo purposes)
 * In production, use a proper hashing library like bcrypt
 */
function hashPassword(password: string): string {
  // Simple hash for demo - in production use proper hashing
  let hash = 0;
  for (let i = 0; i < password.length; i++) {
    const char = password.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return hash.toString(36);
}

function verifyPassword(password: string, hash: string): boolean {
  return hashPassword(password) === hash;
}

export class UserRepository {
  /**
   * Create a new user
   */
  async createUser(
    email: string,
    name: string,
    password: string,
    role: UserRole = 'VIEWER',
    department?: string
  ): Promise<UserEntity> {
    const db = await getDatabase();
    
    // Check if user already exists
    const existing = await this.getUserByEmail(email);
    if (existing) {
      throw new Error('User with this email already exists');
    }

    const id = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const hashedPassword = hashPassword(password);
    const now = new Date().toISOString();

    try {
      db.run(
        `INSERT INTO User (id, email, name, password, role, department, isActive, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id,
          email,
          name,
          hashedPassword,
          role,
          department || null,
          1, // isActive = true
          now,
          now
        ]
      );

      // Save database after insert
      await saveDatabase();
    } catch (error: any) {
      // Check if it's a unique constraint violation (email already exists)
      if (error?.message?.includes('UNIQUE constraint') || error?.message?.includes('email')) {
        throw new Error('User with this email already exists');
      }
      // Check if table doesn't exist
      if (error?.message?.includes('no such table: User')) {
        throw new Error('Database error: User table not found. Please refresh the page to initialize the database.');
      }
      // Re-throw with a more user-friendly message
      throw new Error(`Failed to create user: ${error?.message || 'Unknown database error'}`);
    }

    return {
      id,
      email,
      name,
      role,
      department,
      isActive: true,
      createdAt: new Date(now),
      updatedAt: new Date(now)
    };
  }

  /**
   * Get user by email
   */
  async getUserByEmail(email: string): Promise<UserEntity | null> {
    const db = await getDatabase();
    
    const stmt = db.prepare(
      `SELECT id, email, name, password, role, department, isActive, createdAt, updatedAt, lastLoginAt
       FROM User WHERE email = ? AND isActive = 1`
    );
    stmt.bind([email]);
    
    if (!stmt.step()) {
      stmt.free();
      return null;
    }

    const row = stmt.getAsObject() as any;
    stmt.free();

    return {
      id: row.id,
      email: row.email,
      name: row.name,
      role: row.role as UserRole,
      department: row.department || undefined,
      isActive: row.isActive === 1,
      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt),
      lastLoginAt: row.lastLoginAt ? new Date(row.lastLoginAt) : undefined
    };
  }

  /**
   * Get user by ID
   */
  async getUserById(id: string): Promise<UserEntity | null> {
    const db = await getDatabase();
    
    const stmt = db.prepare(
      `SELECT id, email, name, password, role, department, isActive, createdAt, updatedAt, lastLoginAt
       FROM User WHERE id = ? AND isActive = 1`
    );
    stmt.bind([id]);
    
    if (!stmt.step()) {
      stmt.free();
      return null;
    }

    const row = stmt.getAsObject() as any;
    stmt.free();

    return {
      id: row.id,
      email: row.email,
      name: row.name,
      role: row.role as UserRole,
      department: row.department || undefined,
      isActive: row.isActive === 1,
      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt),
      lastLoginAt: row.lastLoginAt ? new Date(row.lastLoginAt) : undefined
    };
  }

  /**
   * Verify user password
   */
  async verifyPassword(email: string, password: string): Promise<boolean> {
    const db = await getDatabase();
    
    const stmt = db.prepare(
      `SELECT password FROM User WHERE email = ? AND isActive = 1`
    );
    stmt.bind([email]);
    
    if (!stmt.step()) {
      stmt.free();
      return false;
    }

    const row = stmt.getAsObject() as any;
    stmt.free();
    
    const storedHash = row.password;
    return verifyPassword(password, storedHash);
  }

  /**
   * Update user's last login time
   */
  async updateLastLogin(email: string): Promise<void> {
    const db = await getDatabase();
    const now = new Date().toISOString();
    
    db.run(
      `UPDATE User SET lastLoginAt = ?, updatedAt = ? WHERE email = ?`,
      [now, now, email]
    );
    
    await saveDatabase();
  }

  /**
   * Update user information
   */
  async updateUser(
    id: string,
    updates: Partial<{
      name: string;
      role: UserRole;
      department: string;
      isActive: boolean;
    }>
  ): Promise<void> {
    const db = await getDatabase();
    const now = new Date().toISOString();
    
    const fields: string[] = [];
    const values: any[] = [];

    if (updates.name !== undefined) {
      fields.push('name = ?');
      values.push(updates.name);
    }
    if (updates.role !== undefined) {
      fields.push('role = ?');
      values.push(updates.role);
    }
    if (updates.department !== undefined) {
      fields.push('department = ?');
      values.push(updates.department);
    }
    if (updates.isActive !== undefined) {
      fields.push('isActive = ?');
      values.push(updates.isActive ? 1 : 0);
    }

    if (fields.length === 0) {
      return;
    }

    fields.push('updatedAt = ?');
    values.push(now);
    values.push(id);

    db.run(
      `UPDATE User SET ${fields.join(', ')} WHERE id = ?`,
      values
    );
    
    await saveDatabase();
  }

  /**
   * Change user password
   */
  async changePassword(email: string, newPassword: string): Promise<void> {
    const db = await getDatabase();
    const hashedPassword = hashPassword(newPassword);
    const now = new Date().toISOString();
    
    db.run(
      `UPDATE User SET password = ?, updatedAt = ? WHERE email = ?`,
      [hashedPassword, now, email]
    );
    
    await saveDatabase();
  }
}

