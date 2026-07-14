import { FastifyInstance } from 'fastify';
import { AnalyticsController } from '../controllers/analytics.controller';
import { authenticate } from '../middleware/auth.middleware';

export async function analyticsRoutes(fastify: FastifyInstance) {
  const controller = new AnalyticsController();

  // Protect all analytics endpoints
  fastify.addHook('onRequest', authenticate);

  fastify.get('/dashboard', controller.getDashboardStats.bind(controller));
  fastify.get('/:shortUrlId', controller.getUrlAnalytics.bind(controller));
}
