"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.redirectRoutes = redirectRoutes;
const redirect_controller_1 = require("../controllers/redirect.controller");
async function redirectRoutes(fastify) {
    const controller = new redirect_controller_1.RedirectController();
    fastify.get('/:shortCode', controller.handleRedirect.bind(controller));
}
