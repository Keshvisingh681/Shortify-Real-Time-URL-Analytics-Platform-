import { FastifyInstance } from 'fastify';
import { RedirectController } from '../controllers/redirect.controller';

export async function redirectRoutes(fastify: FastifyInstance) {
  const controller = new RedirectController();

  fastify.get('/:shortCode', controller.handleRedirect.bind(controller));
}
