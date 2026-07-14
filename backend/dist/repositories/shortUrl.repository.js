"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ShortUrlRepository = void 0;
const db_1 = require("../db");
class ShortUrlRepository {
    async findByShortCode(shortCode) {
        return db_1.prisma.shortUrl.findUnique({
            where: { shortCode },
        });
    }
    async findById(id) {
        return db_1.prisma.shortUrl.findUnique({
            where: { id },
        });
    }
    async create(data) {
        return db_1.prisma.shortUrl.create({
            data,
        });
    }
    async update(id, data) {
        return db_1.prisma.shortUrl.update({
            where: { id },
            data,
        });
    }
    async delete(id) {
        return db_1.prisma.shortUrl.delete({
            where: { id },
        });
    }
    async list(params) {
        const { userId, search, sortBy = 'createdAt', sortOrder = 'desc', page = 1, limit = 10, } = params;
        const skip = (page - 1) * limit;
        const whereClause = {
            userId,
            ...(search
                ? {
                    OR: [
                        { longUrl: { contains: search, mode: 'insensitive' } },
                        { shortCode: { contains: search, mode: 'insensitive' } },
                    ],
                }
                : {}),
        };
        const [urls, total] = await Promise.all([
            db_1.prisma.shortUrl.findMany({
                where: whereClause,
                orderBy: {
                    [sortBy]: sortOrder,
                },
                skip,
                take: limit,
                include: {
                    _count: {
                        select: { clickEvents: true },
                    },
                },
            }),
            db_1.prisma.shortUrl.count({
                where: whereClause,
            }),
        ]);
        return {
            urls: urls.map(u => ({
                ...u,
                clickCount: u._count.clickEvents,
            })),
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        };
    }
}
exports.ShortUrlRepository = ShortUrlRepository;
