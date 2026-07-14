import { FastifyReply, FastifyRequest } from 'fastify';
import { prisma } from '../db';

export class AdminController {
  async getStats(request: FastifyRequest, reply: FastifyReply) {
    try {
      const [totalUsers, totalUrls, totalClicks, activeUsers] = await Promise.all([
        prisma.user.count(),
        prisma.shortUrl.count(),
        prisma.clickEvent.count(),
        prisma.user.count({
          where: {
            shortUrls: {
              some: {}
            }
          }
        })
      ]);

      return reply.send({
        totalUsers,
        totalUrls,
        totalClicks,
        activeUsers
      });
    } catch (error: any) {
      return reply.status(500).send({ error: error.message });
    }
  }

  async listUsers(request: FastifyRequest, reply: FastifyReply) {
    try {
      const users = await prisma.user.findMany({
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          email: true,
          isVerified: true,
          isAdmin: true,
          avatarUrl: true,
          createdAt: true,
          _count: {
            select: { shortUrls: true }
          }
        }
      });

      // Fetch click counts for each user in parallel
      const usersWithClicks = await Promise.all(
        users.map(async (user) => {
          const clickCount = await prisma.clickEvent.count({
            where: {
              shortUrl: { userId: user.id }
            }
          });
          return {
            ...user,
            clickCount
          };
        })
      );

      return reply.send(usersWithClicks);
    } catch (error: any) {
      return reply.status(500).send({ error: error.message });
    }
  }

  async deleteUser(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as { id: string };
    try {
      // Prevent deleting own account
      if (request.user.sub === id) {
        return reply.status(400).send({ error: 'Cannot delete your own admin account' });
      }

      await prisma.user.delete({
        where: { id }
      });

      return reply.send({ message: 'User deleted successfully' });
    } catch (error: any) {
      return reply.status(500).send({ error: error.message });
    }
  }
}
