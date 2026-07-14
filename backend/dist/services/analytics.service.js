"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.analyticsService = exports.AnalyticsService = void 0;
const db_1 = require("../db");
class AnalyticsService {
    async getUrlAnalytics(shortUrlId) {
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const [totalClicks, todayClicks, deviceStats, browserStats, countryStats, referrerStats, clicksOverTime, recentClicks,] = await Promise.all([
            // Total Clicks
            db_1.prisma.clickEvent.count({
                where: { shortUrlId },
            }),
            // Today's Clicks
            db_1.prisma.clickEvent.count({
                where: {
                    shortUrlId,
                    timestamp: { gte: todayStart },
                },
            }),
            // Device Distribution
            db_1.prisma.clickEvent.groupBy({
                by: ['device'],
                where: { shortUrlId },
                _count: { device: true },
            }),
            // Browser Distribution
            db_1.prisma.clickEvent.groupBy({
                by: ['browser'],
                where: { shortUrlId },
                _count: { browser: true },
            }),
            // Country Distribution
            db_1.prisma.clickEvent.groupBy({
                by: ['country'],
                where: { shortUrlId },
                _count: { country: true },
            }),
            // Referrer Distribution
            db_1.prisma.clickEvent.groupBy({
                by: ['referrer'],
                where: { shortUrlId },
                _count: { referrer: true },
            }),
            // Clicks Over Time (grouped by Date)
            db_1.prisma.$queryRaw `
        SELECT DATE_TRUNC('day', timestamp) as date, COUNT(*)::int as count
        FROM click_events
        WHERE "shortUrlId" = ${shortUrlId}::uuid
        GROUP BY DATE_TRUNC('day', timestamp)
        ORDER BY date ASC
        LIMIT 30
      `,
            // Recent 10 clicks
            db_1.prisma.clickEvent.findMany({
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
    async getUserDashboardStats(userId) {
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const userUrls = await db_1.prisma.shortUrl.findMany({
            where: { userId },
            select: { id: true, expiresAt: true, isEnabled: true },
        });
        const urlIds = userUrls.map((u) => u.id);
        const now = new Date();
        const activeUrls = userUrls.filter((u) => u.isEnabled && (!u.expiresAt || new Date(u.expiresAt) > now)).length;
        const expiredUrls = userUrls.filter((u) => u.expiresAt && new Date(u.expiresAt) <= now).length;
        const [totalClicks, todayClicks] = await Promise.all([
            db_1.prisma.clickEvent.count({
                where: { shortUrlId: { in: urlIds } },
            }),
            db_1.prisma.clickEvent.count({
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
exports.AnalyticsService = AnalyticsService;
exports.analyticsService = new AnalyticsService();
