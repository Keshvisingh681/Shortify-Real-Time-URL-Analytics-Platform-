import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import jwt from '@fastify/jwt';
import cookie from '@fastify/cookie';
import websocket from '@fastify/websocket';

import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';

import { config } from './config';
import { connectRedis } from './cache/redis.client';
import { startAnalyticsWorker, stopAnalyticsWorker } from './workers/analytics.worker';

import { authRoutes } from './routes/auth.routes';
import { shortUrlRoutes } from './routes/shortUrl.routes';
import { analyticsRoutes } from './routes/analytics.routes';
import { websocketRoutes } from './routes/websocket.routes';
import { redirectRoutes } from './routes/redirect.routes';
import { adminRoutes } from './routes/admin.routes';

// Initialize Fastify server with Pino Logger
const fastify = Fastify({
  logger: {
    transport:
      config.NODE_ENV === 'development'
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
    await fastify.register(helmet, {
      contentSecurityPolicy: false, // Turned off for easy Swagger & API interactions in local dev
    });
    
    await fastify.register(cors, {
      origin: true, // Allow all origins for dev simplicity
      credentials: true,
    });

    // 2. Rate Limiting
    await fastify.register(rateLimit, {
      max: 100,
      timeWindow: '1 minute',
    });

    // 3. JWT & Cookies for Session Authentication
    await fastify.register(jwt, {
      secret: config.JWT_SECRET,
    });
    await fastify.register(cookie);

    // 4. WebSocket Engine Registration
    await fastify.register(websocket);

    // 5. Connect Redis Cache and Queue
    await connectRedis();

    // 6. Spawn Background Async Analytics Worker
    await startAnalyticsWorker();

    // Register Swagger & Swagger UI
    await fastify.register(swagger, {
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

    await fastify.register(swaggerUi, {
      routePrefix: '/docs',
      uiConfig: {
        docExpansion: 'list',
        deepLinking: false,
      },
    });

    // 7. Register Routes
    await fastify.register(authRoutes, { prefix: '/auth' });
    await fastify.register(shortUrlRoutes, { prefix: '/urls' });
    await fastify.register(analyticsRoutes, { prefix: '/analytics' });
    await fastify.register(adminRoutes, { prefix: '/admin' });
    await fastify.register(websocketRoutes); // Exposes GET /ws
    await fastify.register(redirectRoutes); // Exposes GET /:shortCode (Must be last to avoid prefix collisions)

    // Healthcheck endpoint
    fastify.get('/health', async () => {
      return { status: 'OK', env: config.NODE_ENV };
    });

    // Start listening
    await fastify.listen({ port: config.PORT, host: '0.0.0.0' });
    console.log(`🚀 Server successfully launched on port ${config.PORT}`);

  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
}

// Graceful Shutdown
const signals = ['SIGINT', 'SIGTERM'];
signals.forEach((signal) => {
  process.on(signal, async () => {
    console.log(`\n🛑 Received ${signal}, starting graceful shutdown...`);
    stopAnalyticsWorker();
    await fastify.close();
    process.exit(0);
  });
});

bootstrap();
