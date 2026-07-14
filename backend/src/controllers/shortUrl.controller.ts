import { FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { shortUrlService } from '../services/shortUrl.service';

const createUrlSchema = z.object({
  longUrl: z.string().url(),
  customAlias: z.string().min(3).max(30).regex(/^[a-zA-Z0-9_-]+$/).optional(),
  expiresAt: z.string().datetime().nullable().optional(),
});

const updateUrlSchema = z.object({
  longUrl: z.string().url().optional(),
  isEnabled: z.boolean().optional(),
  expiresAt: z.string().datetime().nullable().optional(),
});

const listUrlQuerySchema = z.object({
  search: z.string().optional(),
  sortBy: z.enum(['createdAt', 'longUrl', 'shortCode']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().default(10),
});

export class ShortUrlController {
  async create(request: FastifyRequest, reply: FastifyReply) {
    const userId = request.user.sub;
    try {
      const body = createUrlSchema.parse(request.body);
      const expiresAt = body.expiresAt ? new Date(body.expiresAt) : null;

      const url = await shortUrlService.createShortUrl({
        userId,
        longUrl: body.longUrl,
        customAlias: body.customAlias,
        expiresAt,
      });

      return reply.status(201).send(url);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ error: error.errors });
      }
      return reply.status(400).send({ error: error.message });
    }
  }

  async list(request: FastifyRequest, reply: FastifyReply) {
    const userId = request.user.sub;
    try {
      const query = listUrlQuerySchema.parse(request.query);
      const data = await shortUrlService.listUrls({
        userId,
        ...query,
      });
      return reply.send(data);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ error: error.errors });
      }
      return reply.status(400).send({ error: error.message });
    }
  }

  async update(request: FastifyRequest, reply: FastifyReply) {
    const userId = request.user.sub;
    const { id } = request.params as { id: string };
    try {
      const body = updateUrlSchema.parse(request.body);
      const expiresAt = body.expiresAt === null ? null : (body.expiresAt ? new Date(body.expiresAt) : undefined);

      const url = await shortUrlService.updateShortUrl({
        id,
        userId,
        longUrl: body.longUrl,
        isEnabled: body.isEnabled,
        expiresAt,
      });

      return reply.send(url);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ error: error.errors });
      }
      return reply.status(400).send({ error: error.message });
    }
  }

  async delete(request: FastifyRequest, reply: FastifyReply) {
    const userId = request.user.sub;
    const { id } = request.params as { id: string };
    try {
      await shortUrlService.deleteShortUrl(id, userId);
      return reply.status(200).send({ message: 'URL deleted successfully' });
    } catch (error: any) {
      return reply.status(400).send({ error: error.message });
    }
  }
}
