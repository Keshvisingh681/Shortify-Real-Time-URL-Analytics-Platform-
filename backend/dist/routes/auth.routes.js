"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authRoutes = authRoutes;
const auth_controller_1 = require("../controllers/auth.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
async function authRoutes(fastify) {
    const controller = new auth_controller_1.AuthController();
    // Public auth routes
    fastify.post('/register', controller.register.bind(controller));
    fastify.post('/login', controller.login.bind(controller));
    fastify.post('/refresh', controller.refresh.bind(controller));
    fastify.post('/logout', controller.logout.bind(controller));
    fastify.get('/verify', controller.verifyEmail.bind(controller));
    fastify.post('/forgot-password', controller.forgotPassword.bind(controller));
    fastify.post('/reset-password', controller.resetPassword.bind(controller));
    // Protected auth routes
    fastify.post('/change-password', { preHandler: auth_middleware_1.authenticate }, controller.changePassword.bind(controller));
    fastify.get('/profile', { preHandler: auth_middleware_1.authenticate }, controller.getProfile.bind(controller));
    fastify.patch('/profile', { preHandler: auth_middleware_1.authenticate }, controller.updateProfile.bind(controller));
}
