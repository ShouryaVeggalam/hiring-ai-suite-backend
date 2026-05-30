import bcrypt from 'bcrypt';
import { getConfig } from '../config';

export class PasswordService {
  async hash(plain: string): Promise<string> {
    const { BCRYPT_ROUNDS } = getConfig();
    return bcrypt.hash(plain, BCRYPT_ROUNDS);
  }

  async compare(plain: string, hash: string): Promise<boolean> {
    return bcrypt.compare(plain, hash);
  }

  validateStrength(password: string): void {
    if (password.length < 8) {
      throw new Error('Password must be at least 8 characters');
    }
    if (!/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/[0-9]/.test(password)) {
      throw new Error('Password must include upper, lower, and a number');
    }
  }
}

export const passwordService = new PasswordService();
