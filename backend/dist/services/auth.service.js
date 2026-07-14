"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const user_repository_1 = require("../repositories/user.repository");
class AuthService {
    fastify;
    userRepository = new user_repository_1.UserRepository();
    constructor(fastify) {
        this.fastify = fastify;
    }
    async hashPassword(password) {
        const salt = await bcrypt_1.default.genSalt(10);
        return bcrypt_1.default.hash(password, salt);
    }
    async comparePasswords(password, hash) {
        return bcrypt_1.default.compare(password, hash);
    }
    generateTokens(userId, email) {
        const accessToken = this.fastify.jwt.sign({ sub: userId, email }, { expiresIn: '15m' });
        const refreshToken = this.fastify.jwt.sign({ sub: userId, email }, { expiresIn: '7d' });
        return { accessToken, refreshToken };
    }
    async register(email, password) {
        const existingUser = await this.userRepository.findByEmail(email);
        if (existingUser) {
            throw new Error('Email already in use');
        }
        const crypto = await Promise.resolve().then(() => __importStar(require('crypto')));
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
    async login(email, password) {
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
    async verifyEmail(token) {
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
    async forgotPassword(email) {
        const user = await this.userRepository.findByEmail(email);
        if (!user) {
            // Return success to prevent email enumeration attacks
            return { message: 'If the email exists, a reset link has been generated' };
        }
        const crypto = await Promise.resolve().then(() => __importStar(require('crypto')));
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
    async resetPassword(token, newPassword) {
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
    async changePassword(userId, currentPassword, newPassword) {
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
    async updateProfile(userId, data) {
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
    async getProfile(userId) {
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
exports.AuthService = AuthService;
