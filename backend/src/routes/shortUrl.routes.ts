import { FastifyInstance } from 'fastify';
import { ShortUrlController } from '../controllers/shortUrl.controller';
import { authenticate } from '../middleware/auth.middleware';

export async function shortUrlRoutes(fastify: FastifyInstance) {
  const controller = new ShortUrlController();

  // Protect all URL management routes
  fastify.addHook('onRequest', authenticate);

  fastify.post('/', controller.create.bind(controller));
  fastify.get('/', controller.list.bind(controller));
  fastify.patch('/:id', controller.update.bind(controller));
  fastify.delete('/:id', controller.delete.bind(controller));
}
