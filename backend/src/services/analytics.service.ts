import { prisma } from '../db';

export class AnalyticsService {
  async getUrlAnalytics(shortUrlId: string) {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const [
      totalClicks,
      todayClicks,
      deviceStats,
      browserStats,
      countryStats,
      referrerStats,
      clicksOverTime,
      recentClicks,
    ] = await Promise.all([
      // Total Clicks
      prisma.clickEvent.count({
        where: { shortUrlId },
      }),

      // Today's Clicks
      prisma.clickEvent.count({
        where: {
          shortUrlId,
          timestamp: { gte: todayStart },
        },
      }),

      // Device Distribution
      prisma.clickEvent.groupBy({
        by: ['device'],
        where: { shortUrlId },
        _count: { device: true },
      }),

      // Browser Distribution
      prisma.clickEvent.groupBy({
        by: ['browser'],
        where: { shortUrlId },
        _count: { browser: true },
      }),

      // Country Distribution
      prisma.clickEvent.groupBy({
        by: ['country'],
        where: { shortUrlId },
        _count: { country: true },
      }),

      // Referrer Distribution
      prisma.clickEvent.groupBy({
        by: ['referrer'],
        where: { shortUrlId },
        _count: { referrer: true },
      }),

      // Clicks Over Time (grouped by Date)
      prisma.$queryRaw<{ date: string; count: number }[]>`
        SELECT DATE_TRUNC('day', timestamp) as date, COUNT(*)::int as count
        FROM click_events
        WHERE "shortUrlId" = ${shortUrlId}::uuid
        GROUP BY DATE_TRUNC('day', timestamp)
        ORDER BY date ASC
        LIMIT 30
      `,

      // Recent 10 clicks
      prisma.clickEvent.findMany({
        where: { shortUrlId },
        orderBy: { timestamp: 'desc' },
        take: 10,
      }),
    ]);

    // Format distributions
    const devices = deviceStats.map((item) => ({
      name: item.device || 'Unknown',
      value: item._count.device,
    }));

    const browsers = browserStats.map((item) => ({
      name: item.browser || 'Unknown',
      value: item._count.browser,
    }));

    const countries = countryStats.map((item) => ({
      name: item.country || 'Unknown',
      value: item._count.country,
    }));

    const referrers = referrerStats.map((item) => ({
      name: item.referrer || 'Direct',
      value: item._count.referrer,
    }));

    return {
      totalClicks,
      todayClicks,
      devices,
      browsers,
      countries,
      referrers,
      clicksOverTime: clicksOverTime.map(c => ({
        date: new Date(c.date).toLocaleDateString(),
        count: Number(c.count),
      })),
      recentClicks,
    };
  }

  async getUserDashboardStats(userId: string) {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const userUrls = await prisma.shortUrl.findMany({
      where: { userId },
      select: { id: true, expiresAt: true, isEnabled: true },
    });

    const urlIds = userUrls.map((u) => u.id);
    const now = new Date();

    const activeUrls = userUrls.filter((u) => u.isEnabled && (!u.expiresAt || new Date(u.expiresAt) > now)).length;
    const expiredUrls = userUrls.filter((u) => u.expiresAt && new Date(u.expiresAt) <= now).length;

    const [totalClicks, todayClicks] = await Promise.all([
      prisma.clickEvent.count({
        where: { shortUrlId: { in: urlIds } },
      }),
      prisma.clickEvent.count({
        where: {
          shortUrlId: { in: urlIds },
          timestamp: { gte: todayStart },
        },
      }),
    ]);

    return {
      totalClicks,
      todayClicks,
      activeUrls,
      expiredUrls,
    };
  }
}
export const analyticsService = new AnalyticsService();
