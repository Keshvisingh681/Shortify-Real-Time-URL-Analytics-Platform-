import { FastifyInstance } from 'fastify';
import { AuthController } from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth.middleware';

export async function authRoutes(fastify: FastifyInstance) {
  const controller = new AuthController();

  // Public auth routes
  fastify.post('/register', controller.register.bind(controller));
  fastify.post('/login', controller.login.bind(controller));
  fastify.post('/refresh', controller.refresh.bind(controller));
  fastify.post('/logout', controller.logout.bind(controller));
  fastify.get('/verify', controller.verifyEmail.bind(controller));
  fastify.post('/forgot-password', controller.forgotPassword.bind(controller));
  fastify.post('/reset-password', controller.resetPassword.bind(controller));

  // Protected auth routes
  fastify.post('/change-password', { preHandler: authenticate }, controller.changePassword.bind(controller));
  fastify.get('/profile', { preHandler: authenticate }, controller.getProfile.bind(controller));
  fastify.patch('/profile', { preHandler: authenticate }, controller.updateProfile.bind(controller));
}
