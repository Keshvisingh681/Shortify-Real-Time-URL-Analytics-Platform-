"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.shortUrlRoutes = shortUrlRoutes;
const shortUrl_controller_1 = require("../controllers/shortUrl.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
async function shortUrlRoutes(fastify) {
    const controller = new shortUrl_controller_1.ShortUrlController();
    // Protect all URL management routes
    fastify.addHook('onRequest', auth_middleware_1.authenticate);
    fastify.post('/', controller.create.bind(controller));
    fastify.get('/', controller.list.bind(controller));
    fastify.patch('/:id', controller.update.bind(controller));
    fastify.delete('/:id', controller.delete.bind(controller));
}
