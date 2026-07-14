"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RedirectController = void 0;
const shortUrl_service_1 = require("../services/shortUrl.service");
const analytics_queue_1 = require("../queue/analytics.queue");
/**
 * Modern HTML custom "Link Expired" page template.
 */
const EXPIRED_HTML = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Link Expired | URL Shortener</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      background: radial-gradient(circle at center, #1e1b4b, #0f172a);
      font-family: 'Inter', system-ui, -apple-system, sans-serif;
      color: #f8fafc;
      text-align: center;
    }
    .card {
      background: rgba(255, 255, 255, 0.03);
      backdrop-filter: blur(10px);
      border: 1px solid rgba(255, 255, 255, 0.08);
      padding: 3rem 2rem;
      border-radius: 1.5rem;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
      max-width: 400px;
      width: 90%;
    }
    .icon {
      font-size: 4rem;
      color: #ef4444;
      margin-bottom: 1rem;
      animation: pulse 2s infinite;
    }
    h1 {
      font-size: 1.8rem;
      margin-bottom: 0.5rem;
      font-weight: 700;
    }
    p {
      color: #94a3b8;
      font-size: 1rem;
      line-height: 1.5;
      margin-bottom: 2rem;
    }
    .btn {
      display: inline-block;
      padding: 0.75rem 1.5rem;
      background: linear-gradient(135deg, #6366f1, #4f46e5);
      color: #ffffff;
      text-decoration: none;
      border-radius: 0.75rem;
      font-weight: 600;
      transition: opacity 0.2s;
    }
    .btn:hover {
      opacity: 0.9;
    }
    @keyframes pulse {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.05); }
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">⌛</div>
    <h1>Link Expired</h1>
    <p>This link has reached its expiration date and is no longer active.</p>
    <a href="/" class="btn">Create Your Own Link</a>
  </div>
</body>
</html>
`;
class RedirectController {
    async handleRedirect(request, reply) {
        const { shortCode } = request.params;
        try {
            // 1. Fetch short URL details (uses Cache-Aside under the hood)
            const shortUrl = await shortUrl_service_1.shortUrlService.getShortUrlByCode(shortCode);
            if (!shortUrl) {
                return reply.status(404).send({ error: 'Short URL not found' });
            }
            // 2. Check if URL is disabled
            if (!shortUrl.isEnabled) {
                return reply.status(403).send({ error: 'This link has been disabled by the owner.' });
            }
            // 3. Check if URL has expired
            if (shortUrl.expiresAt && new Date(shortUrl.expiresAt) < new Date()) {
                reply.header('Content-Type', 'text/html');
                return reply.status(410).send(EXPIRED_HTML);
            }
            // 4. Capture analytics metadata
            const ip = request.ip || '127.0.0.1';
            const userAgent = request.headers['user-agent'] || '';
            const referrer = request.headers['referer'] || '';
            const timestamp = new Date().toISOString();
            // 5. Publish to queue in background (Fire-and-forget, never wait or block redirect)
            analytics_queue_1.analyticsQueue.publish({
                shortUrlId: shortUrl.id,
                ip,
                userAgent,
                referrer,
                timestamp,
            }).catch(err => console.error('Failed to queue redirect analytics event:', err));
            // 6. Redirect client immediately
            return reply.redirect(302, shortUrl.longUrl);
        }
        catch (error) {
            console.error('Redirect handler error:', error);
            return reply.status(500).send({ error: 'Internal Server Error' });
        }
    }
}
exports.RedirectController = RedirectController;
