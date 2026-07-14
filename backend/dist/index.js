"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fastify_1 = __importDefault(require("fastify"));
const cors_1 = __importDefault(require("@fastify/cors"));
const helmet_1 = __importDefault(require("@fastify/helmet"));
const rate_limit_1 = __importDefault(require("@fastify/rate-limit"));
const jwt_1 = __importDefault(require("@fastify/jwt"));
const cookie_1 = __importDefault(require("@fastify/cookie"));
const websocket_1 = __importDefault(require("@fastify/websocket"));
const swagger_1 = __importDefault(require("@fastify/swagger"));
const swagger_ui_1 = __importDefault(require("@fastify/swagger-ui"));
const config_1 = require("./config");
const redis_client_1 = require("./cache/redis.client");
const analytics_worker_1 = require("./workers/analytics.worker");
const auth_routes_1 = require("./routes/auth.routes");
const shortUrl_routes_1 = require("./routes/shortUrl.routes");
const analytics_routes_1 = require("./routes/analytics.routes");
const websocket_routes_1 = require("./routes/websocket.routes");
const redirect_routes_1 = require("./routes/redirect.routes");
const admin_routes_1 = require("./routes/admin.routes");
// Initialize Fastify server with Pino Logger
const fastify = (0, fastify_1.default)({
    logger: {
        transport: config_1.config.NODE_ENV === 'development'
            ? {
                target: 'pino-pretty',
                options: {
                    translateTime: 'HH:MM:ss Z',
                    ignore: 'pid,hostname',
                },
            }
            : undefined,
    },
});
// Centralized Error Handling
fastify.setErrorHandler((error, request, reply) => {
    request.log.error(error);
    const statusCode = error.statusCode || 500;
    return reply.status(statusCode).send({
        error: error.message || 'Internal Server Error',
        statusCode,
    });
});
// Bootstrap logic
async function bootstrap() {
    try {
        // 1. Security Enhancements
        await fastify.register(helmet_1.default, {
            contentSecurityPolicy: false, // Turned off for easy Swagger & API interactions in local dev
        });
        await fastify.register(cors_1.default, {
            origin: true, // Allow all origins for dev simplicity
            credentials: true,
        });
        // 2. Rate Limiting
        await fastify.register(rate_limit_1.default, {
            max: 100,
            timeWindow: '1 minute',
        });
        // 3. JWT & Cookies for Session Authentication
        await fastify.register(jwt_1.default, {
            secret: config_1.config.JWT_SECRET,
        });
        await fastify.register(cookie_1.default);
        // 4. WebSocket Engine Registration
        await fastify.register(websocket_1.default);
        // 5. Connect Redis Cache and Queue
        await (0, redis_client_1.connectRedis)();
        // 6. Spawn Background Async Analytics Worker
        await (0, analytics_worker_1.startAnalyticsWorker)();
        // Register Swagger & Swagger UI
        await fastify.register(swagger_1.default, {
            swagger: {
                info: {
                    title: 'URL Shortener API',
                    description: 'Production-ready URL Shortener with Real-Time Analytics API documentation',
                    version: '1.0.0',
                },
                host: 'localhost:5000',
                schemes: ['http'],
                consumes: ['application/json'],
                produces: ['application/json'],
                securityDefinitions: {
                    apiKey: {
                        type: 'apiKey',
                        name: 'Authorization',
                        in: 'header',
                        description: 'Format: Bearer <JWT_ACCESS_TOKEN>'
                    }
                }
            },
        });
        await fastify.register(swagger_ui_1.default, {
            routePrefix: '/docs',
            uiConfig: {
                docExpansion: 'list',
                deepLinking: false,
            },
        });
        // 7. Register Routes
        await fastify.register(auth_routes_1.authRoutes, { prefix: '/auth' });
        await fastify.register(shortUrl_routes_1.shortUrlRoutes, { prefix: '/urls' });
        await fastify.register(analytics_routes_1.analyticsRoutes, { prefix: '/analytics' });
        await fastify.register(admin_routes_1.adminRoutes, { prefix: '/admin' });
        await fastify.register(websocket_routes_1.websocketRoutes); // Exposes GET /ws
        await fastify.register(redirect_routes_1.redirectRoutes); // Exposes GET /:shortCode (Must be last to avoid prefix collisions)
        // Healthcheck endpoint
        fastify.get('/health', async () => {
            return { status: 'OK', env: config_1.config.NODE_ENV };
        });
        // Start listening
        await fastify.listen({ port: config_1.config.PORT, host: '0.0.0.0' });
        console.log(`🚀 Server successfully launched on port ${config_1.config.PORT}`);
    }
    catch (err) {
        fastify.log.error(err);
        process.exit(1);
    }
}
// Graceful Shutdown
const signals = ['SIGINT', 'SIGTERM'];
signals.forEach((signal) => {
    process.on(signal, async () => {
        console.log(`\n🛑 Received ${signal}, starting graceful shutdown...`);
        (0, analytics_worker_1.stopAnalyticsWorker)();
        await fastify.close();
        process.exit(0);
    });
});
bootstrap();
