import bcrypt from 'bcrypt';
import { UserRepository } from '../repositories/user.repository';
import { config } from '../config';
import { FastifyInstance } from 'fastify';

export class AuthService {
  private userRepository = new UserRepository();

  constructor(private fastify: FastifyInstance) {}

  async hashPassword(password: string): Promise<string> {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(password, salt);
  }

  async comparePasswords(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  generateTokens(userId: string, email: string) {
    const accessToken = this.fastify.jwt.sign(
      { sub: userId, email },
      { expiresIn: '15m' }
    );
    const refreshToken = this.fastify.jwt.sign(
      { sub: userId, email },
      { expiresIn: '7d' }
    );
    return { accessToken, refreshToken };
  }

  async register(email: string, password: string) {
    const existingUser = await this.userRepository.findByEmail(email);
    if (existingUser) {
      throw new Error('Email already in use');
    }

    const crypto = await import('crypto');
    const verificationToken = crypto.randomBytes(32).toString('hex');

    const passwordHash = await this.hashPassword(password);
    const user = await this.userRepository.create({
      email,
      passwordHash,
      verificationToken,
    });

    // Log verification link
    console.log(`[EMAIL SIMULATOR] Verification Link: http://localhost:5173/verify-email?token=${verificationToken}`);

    const tokens = this.generateTokens(user.id, user.email);
    return {
      user: {
        id: user.id,
        email: user.email,
        isVerified: user.isVerified,
        avatarUrl: user.avatarUrl,
      },
      ...tokens,
    };
  }

  async login(email: string, password: string) {
    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      throw new Error('Invalid email or password');
    }

    const isMatch = await this.comparePasswords(password, user.passwordHash);
    if (!isMatch) {
      throw new Error('Invalid email or password');
    }

    const tokens = this.generateTokens(user.id, user.email);
    return {
      user: {
        id: user.id,
        email: user.email,
        isVerified: user.isVerified,
        avatarUrl: user.avatarUrl,
      },
      ...tokens,
    };
  }

  async verifyEmail(token: string) {
    const user = await this.userRepository.findByVerificationToken(token);
    if (!user) {
      throw new Error('Invalid or expired verification token');
    }

    await this.userRepository.update(user.id, {
      isVerified: true,
      verificationToken: null,
    });

    return { message: 'Email verified successfully' };
  }

  async forgotPassword(email: string) {
    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      // Return success to prevent email enumeration attacks
      return { message: 'If the email exists, a reset link has been generated' };
    }

    const crypto = await import('crypto');
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetExpires = new Date(Date.now() + 3600000); // 1 hour

    await this.userRepository.update(user.id, {
      resetToken,
      resetExpires,
    });

    // In a real system, send email. Here, we log the reset link for development testing.
    console.log(`[EMAIL SIMULATOR] Reset Link: http://localhost:5173/reset-password?token=${resetToken}`);

    return { message: 'If the email exists, a reset link has been generated', devToken: resetToken };
  }

  async resetPassword(token: string, newPassword: string) {
    const user = await this.userRepository.findByResetToken(token);
    if (!user || !user.resetExpires || user.resetExpires < new Date()) {
      throw new Error('Invalid or expired reset token');
    }

    const passwordHash = await this.hashPassword(newPassword);
    await this.userRepository.update(user.id, {
      passwordHash,
      resetToken: null,
      resetExpires: null,
    });

    return { message: 'Password has been reset successfully' };
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    const isMatch = await this.comparePasswords(currentPassword, user.passwordHash);
    if (!isMatch) {
      throw new Error('Incorrect current password');
    }

    const passwordHash = await this.hashPassword(newPassword);
    await this.userRepository.update(userId, {
      passwordHash,
    });

    return { message: 'Password changed successfully' };
  }

  async updateProfile(userId: string, data: { avatarUrl?: string }) {
    const user = await this.userRepository.update(userId, {
      ...(data.avatarUrl !== undefined ? { avatarUrl: data.avatarUrl } : {}),
    });

    return {
      id: user.id,
      email: user.email,
      isVerified: user.isVerified,
      avatarUrl: user.avatarUrl,
    };
  }

  async getProfile(userId: string) {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }
    return {
      id: user.id,
      email: user.email,
      isVerified: user.isVerified,
      avatarUrl: user.avatarUrl,
      createdAt: user.createdAt,
    };
  }
}
