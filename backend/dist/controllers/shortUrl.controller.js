"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ShortUrlController = void 0;
const zod_1 = require("zod");
const shortUrl_service_1 = require("../services/shortUrl.service");
const createUrlSchema = zod_1.z.object({
    longUrl: zod_1.z.string().url(),
    customAlias: zod_1.z.string().min(3).max(30).regex(/^[a-zA-Z0-9_-]+$/).optional(),
    expiresAt: zod_1.z.string().datetime().nullable().optional(),
});
const updateUrlSchema = zod_1.z.object({
    longUrl: zod_1.z.string().url().optional(),
    isEnabled: zod_1.z.boolean().optional(),
    expiresAt: zod_1.z.string().datetime().nullable().optional(),
});
const listUrlQuerySchema = zod_1.z.object({
    search: zod_1.z.string().optional(),
    sortBy: zod_1.z.enum(['createdAt', 'longUrl', 'shortCode']).default('createdAt'),
    sortOrder: zod_1.z.enum(['asc', 'desc']).default('desc'),
    page: zod_1.z.coerce.number().int().positive().default(1),
    limit: zod_1.z.coerce.number().int().positive().default(10),
});
class ShortUrlController {
    async create(request, reply) {
        const userId = request.user.sub;
        try {
            const body = createUrlSchema.parse(request.body);
            const expiresAt = body.expiresAt ? new Date(body.expiresAt) : null;
            const url = await shortUrl_service_1.shortUrlService.createShortUrl({
                userId,
                longUrl: body.longUrl,
                customAlias: body.customAlias,
                expiresAt,
            });
            return reply.status(201).send(url);
        }
        catch (error) {
            if (error instanceof zod_1.z.ZodError) {
                return reply.status(400).send({ error: error.errors });
            }
            return reply.status(400).send({ error: error.message });
        }
    }
    async list(request, reply) {
        const userId = request.user.sub;
        try {
            const query = listUrlQuerySchema.parse(request.query);
            const data = await shortUrl_service_1.shortUrlService.listUrls({
                userId,
                ...query,
            });
            return reply.send(data);
        }
        catch (error) {
            if (error instanceof zod_1.z.ZodError) {
                return reply.status(400).send({ error: error.errors });
            }
            return reply.status(400).send({ error: error.message });
        }
    }
    async update(request, reply) {
        const userId = request.user.sub;
        const { id } = request.params;
        try {
            const body = updateUrlSchema.parse(request.body);
            const expiresAt = body.expiresAt === null ? null : (body.expiresAt ? new Date(body.expiresAt) : undefined);
            const url = await shortUrl_service_1.shortUrlService.updateShortUrl({
                id,
                userId,
                longUrl: body.longUrl,
                isEnabled: body.isEnabled,
                expiresAt,
            });
            return reply.send(url);
        }
        catch (error) {
            if (error instanceof zod_1.z.ZodError) {
                return reply.status(400).send({ error: error.errors });
            }
            return reply.status(400).send({ error: error.message });
        }
    }
    async delete(request, reply) {
        const userId = request.user.sub;
        const { id } = request.params;
        try {
            await shortUrl_service_1.shortUrlService.deleteShortUrl(id, userId);
            return reply.status(200).send({ message: 'URL deleted successfully' });
        }
        catch (error) {
            return reply.status(400).send({ error: error.message });
        }
    }
}
exports.ShortUrlController = ShortUrlController;
