"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminRoutes = adminRoutes;
const admin_controller_1 = require("../controllers/admin.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const admin_middleware_1 = require("../middleware/admin.middleware");
async function adminRoutes(fastify) {
    const controller = new admin_controller_1.AdminController();
    // Protect all admin routes with auth + admin checks
    fastify.addHook('onRequest', auth_middleware_1.authenticate);
    fastify.addHook('onRequest', admin_middleware_1.requireAdmin);
    fastify.get('/stats', controller.getStats.bind(controller));
    fastify.get('/users', controller.listUsers.bind(controller));
    fastify.delete('/users/:id', controller.deleteUser.bind(controller));
}
