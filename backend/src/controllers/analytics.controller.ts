import { FastifyReply, FastifyRequest } from 'fastify';
import { analyticsService } from '../services/analytics.service';
import { prisma } from '../db';

export class AnalyticsController {
  async getUrlAnalytics(request: FastifyRequest, reply: FastifyReply) {
    const { shortUrlId } = request.params as { shortUrlId: string };
    const userId = request.user.sub;

    try {
      // Confirm ownership
      const shortUrl = await prisma.shortUrl.findUnique({
        where: { id: shortUrlId },
      });

      if (!shortUrl) {
        return reply.status(404).send({ error: 'Short URL not found' });
      }

      if (shortUrl.userId !== userId) {
        return reply.status(403).send({ error: 'Unauthorized' });
      }

      const stats = await analyticsService.getUrlAnalytics(shortUrlId);
      return reply.send(stats);
    } catch (error: any) {
      return reply.status(500).send({ error: error.message });
    }
  }

  async getDashboardStats(request: FastifyRequest, reply: FastifyReply) {
    const userId = request.user.sub;
    try {
      const stats = await analyticsService.getUserDashboardStats(userId);
      return reply.send(stats);
    } catch (error: any) {
      return reply.status(500).send({ error: error.message });
    }
  }
}
