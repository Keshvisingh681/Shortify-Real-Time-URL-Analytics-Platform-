import { prisma } from '../db';
import { Prisma, ShortUrl } from '@prisma/client';

export interface ListUrlsParams {
  userId: string;
  search?: string;
  sortBy?: 'createdAt' | 'longUrl' | 'shortCode';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export class ShortUrlRepository {
  async findByShortCode(shortCode: string): Promise<ShortUrl | null> {
    return prisma.shortUrl.findUnique({
      where: { shortCode },
    });
  }

  async findById(id: string): Promise<ShortUrl | null> {
    return prisma.shortUrl.findUnique({
      where: { id },
    });
  }

  async create(data: Prisma.ShortUrlUncheckedCreateInput): Promise<ShortUrl> {
    return prisma.shortUrl.create({
      data,
    });
  }

  async update(id: string, data: Prisma.ShortUrlUncheckedUpdateInput): Promise<ShortUrl> {
    return prisma.shortUrl.update({
      where: { id },
      data,
    });
  }

  async delete(id: string): Promise<ShortUrl> {
    return prisma.shortUrl.delete({
      where: { id },
    });
  }

  async list(params: ListUrlsParams) {
    const {
      userId,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      page = 1,
      limit = 10,
    } = params;

    const skip = (page - 1) * limit;

    const whereClause: Prisma.ShortUrlWhereInput = {
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
      prisma.shortUrl.findMany({
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
      prisma.shortUrl.count({
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
