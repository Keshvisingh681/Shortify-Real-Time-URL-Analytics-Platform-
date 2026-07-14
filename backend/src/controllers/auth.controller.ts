import { FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { AuthService } from '../services/auth.service';

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

export class AuthController {
  async register(request: FastifyRequest, reply: FastifyReply) {
    const authService = new AuthService(request.server);
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
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ error: error.errors });
      }
      return reply.status(400).send({ error: error.message });
    }
  }

  async login(request: FastifyRequest, reply: FastifyReply) {
    const authService = new AuthService(request.server);
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
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ error: error.errors });
      }
      return reply.status(401).send({ error: error.message });
    }
  }

  async refresh(request: FastifyRequest, reply: FastifyReply) {
    const authService = new AuthService(request.server);
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

      const decoded = request.server.jwt.verify<{ sub: string; email: string }>(token);
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
    } catch (error: any) {
      return reply.status(401).send({ error: 'Invalid refresh token' });
    }
  }

  async logout(request: FastifyRequest, reply: FastifyReply) {
    reply.clearCookie('refreshToken', { path: '/' });
    return reply.status(200).send({ message: 'Logged out successfully' });
  }

  async verifyEmail(request: FastifyRequest, reply: FastifyReply) {
    const authService = new AuthService(request.server);
    try {
      const { token } = request.query as { token: string };
      if (!token) {
        return reply.status(400).send({ error: 'Token is required' });
      }
      const res = await authService.verifyEmail(token);
      return reply.send(res);
    } catch (error: any) {
      return reply.status(400).send({ error: error.message });
    }
  }

  async forgotPassword(request: FastifyRequest, reply: FastifyReply) {
    const authService = new AuthService(request.server);
    try {
      const body = z.object({ email: z.string().email() }).parse(request.body);
      const res = await authService.forgotPassword(body.email);
      return reply.send(res);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ error: error.errors });
      }
      return reply.status(400).send({ error: error.message });
    }
  }

  async resetPassword(request: FastifyRequest, reply: FastifyReply) {
    const authService = new AuthService(request.server);
    try {
      const body = z.object({
        token: z.string(),
        password: z.string().min(6),
      }).parse(request.body);
      const res = await authService.resetPassword(body.token, body.password);
      return reply.send(res);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ error: error.errors });
      }
      return reply.status(400).send({ error: error.message });
    }
  }

  async changePassword(request: FastifyRequest, reply: FastifyReply) {
    const authService = new AuthService(request.server);
    const userId = request.user.sub;
    try {
      const body = z.object({
        currentPassword: z.string(),
        newPassword: z.string().min(6),
      }).parse(request.body);
      const res = await authService.changePassword(userId, body.currentPassword, body.newPassword);
      return reply.send(res);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ error: error.errors });
      }
      return reply.status(400).send({ error: error.message });
    }
  }

  async getProfile(request: FastifyRequest, reply: FastifyReply) {
    const authService = new AuthService(request.server);
    const userId = request.user.sub;
    try {
      const profile = await authService.getProfile(userId);
      return reply.send(profile);
    } catch (error: any) {
      return reply.status(400).send({ error: error.message });
    }
  }

  async updateProfile(request: FastifyRequest, reply: FastifyReply) {
    const authService = new AuthService(request.server);
    const userId = request.user.sub;
    try {
      const body = z.object({
        avatarUrl: z.string().optional(),
      }).parse(request.body);
      const profile = await authService.updateProfile(userId, body);
      return reply.send(profile);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ error: error.errors });
      }
      return reply.status(400).send({ error: error.message });
    }
  }
}
