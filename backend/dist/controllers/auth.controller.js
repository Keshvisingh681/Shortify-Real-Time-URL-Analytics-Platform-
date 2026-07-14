"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const zod_1 = require("zod");
const auth_service_1 = require("../services/auth.service");
const registerSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(6),
});
const loginSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    password: zod_1.z.string(),
});
class AuthController {
    async register(request, reply) {
        const authService = new auth_service_1.AuthService(request.server);
        try {
            const body = registerSchema.parse(request.body);
            const data = await authService.register(body.email, body.password);
            reply.setCookie('refreshToken', data.refreshToken, {
                path: '/',
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
            });
            return reply.status(201).send({
                user: data.user,
                accessToken: data.accessToken,
                refreshToken: data.refreshToken,
            });
        }
        catch (error) {
            if (error instanceof zod_1.z.ZodError) {
                return reply.status(400).send({ error: error.errors });
            }
            return reply.status(400).send({ error: error.message });
        }
    }
    async login(request, reply) {
        const authService = new auth_service_1.AuthService(request.server);
        try {
            const body = loginSchema.parse(request.body);
            const data = await authService.login(body.email, body.password);
            reply.setCookie('refreshToken', data.refreshToken, {
                path: '/',
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
            });
            return reply.status(200).send({
                user: data.user,
                accessToken: data.accessToken,
                refreshToken: data.refreshToken,
            });
        }
        catch (error) {
            if (error instanceof zod_1.z.ZodError) {
                return reply.status(400).send({ error: error.errors });
            }
            return reply.status(401).send({ error: error.message });
        }
    }
    async refresh(request, reply) {
        const authService = new auth_service_1.AuthService(request.server);
        try {
            // Get refresh token from cookie or authorization header
            let token = request.cookies.refreshToken;
            if (!token) {
                const authHeader = request.headers.authorization;
                if (authHeader && authHeader.startsWith('Bearer ')) {
                    token = authHeader.substring(7);
                }
            }
            if (!token) {
                return reply.status(401).send({ error: 'Refresh token missing' });
            }
            const decoded = request.server.jwt.verify(token);
            const newTokens = authService.generateTokens(decoded.sub, decoded.email);
            reply.setCookie('refreshToken', newTokens.refreshToken, {
                path: '/',
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
            });
            return reply.status(200).send({
                accessToken: newTokens.accessToken,
                refreshToken: newTokens.refreshToken,
            });
        }
        catch (error) {
            return reply.status(401).send({ error: 'Invalid refresh token' });
        }
    }
    async logout(request, reply) {
        reply.clearCookie('refreshToken', { path: '/' });
        return reply.status(200).send({ message: 'Logged out successfully' });
    }
    async verifyEmail(request, reply) {
        const authService = new auth_service_1.AuthService(request.server);
        try {
            const { token } = request.query;
            if (!token) {
                return reply.status(400).send({ error: 'Token is required' });
            }
            const res = await authService.verifyEmail(token);
            return reply.send(res);
        }
        catch (error) {
            return reply.status(400).send({ error: error.message });
        }
    }
    async forgotPassword(request, reply) {
        const authService = new auth_service_1.AuthService(request.server);
        try {
            const body = zod_1.z.object({ email: zod_1.z.string().email() }).parse(request.body);
            const res = await authService.forgotPassword(body.email);
            return reply.send(res);
        }
        catch (error) {
            if (error instanceof zod_1.z.ZodError) {
                return reply.status(400).send({ error: error.errors });
            }
            return reply.status(400).send({ error: error.message });
        }
    }
    async resetPassword(request, reply) {
        const authService = new auth_service_1.AuthService(request.server);
        try {
            const body = zod_1.z.object({
                token: zod_1.z.string(),
                password: zod_1.z.string().min(6),
            }).parse(request.body);
            const res = await authService.resetPassword(body.token, body.password);
            return reply.send(res);
        }
        catch (error) {
            if (error instanceof zod_1.z.ZodError) {
                return reply.status(400).send({ error: error.errors });
            }
            return reply.status(400).send({ error: error.message });
        }
    }
    async changePassword(request, reply) {
        const authService = new auth_service_1.AuthService(request.server);
        const userId = request.user.sub;
        try {
            const body = zod_1.z.object({
                currentPassword: zod_1.z.string(),
                newPassword: zod_1.z.string().min(6),
            }).parse(request.body);
            const res = await authService.changePassword(userId, body.currentPassword, body.newPassword);
            return reply.send(res);
        }
        catch (error) {
            if (error instanceof zod_1.z.ZodError) {
                return reply.status(400).send({ error: error.errors });
            }
            return reply.status(400).send({ error: error.message });
        }
    }
    async getProfile(request, reply) {
        const authService = new auth_service_1.AuthService(request.server);
        const userId = request.user.sub;
        try {
            const profile = await authService.getProfile(userId);
            return reply.send(profile);
        }
        catch (error) {
            return reply.status(400).send({ error: error.message });
        }
    }
    async updateProfile(request, reply) {
        const authService = new auth_service_1.AuthService(request.server);
        const userId = request.user.sub;
        try {
            const body = zod_1.z.object({
                avatarUrl: zod_1.z.string().optional(),
            }).parse(request.body);
            const profile = await authService.updateProfile(userId, body);
            return reply.send(profile);
        }
        catch (error) {
            if (error instanceof zod_1.z.ZodError) {
                return reply.status(400).send({ error: error.errors });
            }
            return reply.status(400).send({ error: error.message });
        }
    }
}
exports.AuthController = AuthController;
