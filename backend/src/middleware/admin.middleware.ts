import { FastifyReply, FastifyRequest } from 'fastify';
import { prisma } from '../db';

export async function requireAdmin(request: FastifyRequest, reply: FastifyReply) {
  try {
    const userId = request.user.sub;
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || !user.isAdmin) {
      return reply.status(403).send({ error: 'Forbidden: Admin access required' });
    }
  } catch (err) {
    return reply.status(500).send({ error: 'Internal Server Error' });
  }
}
