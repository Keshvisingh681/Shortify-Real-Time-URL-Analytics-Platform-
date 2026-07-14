import { FastifyInstance } from 'fastify';
import { AdminController } from '../controllers/admin.controller';
import { authenticate } from '../middleware/auth.middleware';
import { requireAdmin } from '../middleware/admin.middleware';

export async function adminRoutes(fastify: FastifyInstance) {
  const controller = new AdminController();

  // Protect all admin routes with auth + admin checks
  fastify.addHook('onRequest', authenticate);
  fastify.addHook('onRequest', requireAdmin);

  fastify.get('/stats', controller.getStats.bind(controller));
  fastify.get('/users', controller.listUsers.bind(controller));
  fastify.delete('/users/:id', controller.deleteUser.bind(controller));
}
