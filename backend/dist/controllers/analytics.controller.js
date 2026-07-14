"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnalyticsController = void 0;
const analytics_service_1 = require("../services/analytics.service");
const db_1 = require("../db");
class AnalyticsController {
    async getUrlAnalytics(request, reply) {
        const { shortUrlId } = request.params;
        const userId = request.user.sub;
        try {
            // Confirm ownership
            const shortUrl = await db_1.prisma.shortUrl.findUnique({
                where: { id: shortUrlId },
            });
            if (!shortUrl) {
                return reply.status(404).send({ error: 'Short URL not found' });
            }
            if (shortUrl.userId !== userId) {
                return reply.status(403).send({ error: 'Unauthorized' });
            }
            const stats = await analytics_service_1.analyticsService.getUrlAnalytics(shortUrlId);
            return reply.send(stats);
        }
        catch (error) {
            return reply.status(500).send({ error: error.message });
        }
    }
    async getDashboardStats(request, reply) {
        const userId = request.user.sub;
        try {
            const stats = await analytics_service_1.analyticsService.getUserDashboardStats(userId);
            return reply.send(stats);
        }
        catch (error) {
            return reply.status(500).send({ error: error.message });
        }
    }
}
exports.AnalyticsController = AnalyticsController;
