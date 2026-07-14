"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.analyticsRoutes = analyticsRoutes;
const analytics_controller_1 = require("../controllers/analytics.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
async function analyticsRoutes(fastify) {
    const controller = new analytics_controller_1.AnalyticsController();
    // Protect all analytics endpoints
    fastify.addHook('onRequest', auth_middleware_1.authenticate);
    fastify.get('/dashboard', controller.getDashboardStats.bind(controller));
    fastify.get('/:shortUrlId', controller.getUrlAnalytics.bind(controller));
}
