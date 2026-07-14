import { analyticsQueue } from '../queue/analytics.queue';
import { prisma } from '../db';
import { socketManager } from '../websocket/socket.manager';
import { analyticsService } from '../services/analytics.service';
import geoip from 'geoip-lite';
import useragent from 'useragent';

let workerActive = false;

/**
 * Worker class that polls the Redis queue asynchronously.
 * 
 * WHY ASYNCHRONOUS PROCESSING IMPROVES LATENCY:
 * Doing write-heavy tasks (resolving GeoIP location, parsing complex user-agent strings,
 * and performing SQL inserts) during a redirect request adds 100-300ms of overhead.
 * By delegating these tasks to a background worker, the client can be redirected instantly 
 * (in under 5-10ms), improving the user experience dramatically and lowering CPU footprint
 * on the API server.
 */
export async function startAnalyticsWorker() {
  if (workerActive) return;
  workerActive = true;
  console.log('👷 Analytics Worker started. Polling Redis Queue...');

  (async () => {
    while (workerActive) {
      try {
        const event = await analyticsQueue.pop();
        if (!event) {
          // If queue is empty, wait for a short duration
          await new Promise((resolve) => setTimeout(resolve, 1000));
          continue;
        }

        const { shortUrlId, ip, userAgent, referrer, timestamp } = event;

        // Parse user-agent
        const agent = useragent.lookup(userAgent);
        const browser = agent.family;
        const os = agent.os.family;
        // Map other to desktop
        const device = agent.device.family === 'Other' ? 'Desktop' : agent.device.family;

        // Parse geo IP location
        let country = 'Local';
        let city = 'Local';
        if (ip !== '127.0.0.1' && ip !== '::1' && ip !== 'localhost') {
          const geo = geoip.lookup(ip);
          if (geo) {
            country = geo.country || 'Unknown';
            city = geo.city || 'Unknown';
          } else {
            country = 'Unknown';
            city = 'Unknown';
          }
        }

        // Format referrer
        let formattedReferrer = 'Direct';
        if (referrer) {
          try {
            const url = new URL(referrer);
            formattedReferrer = url.hostname || 'Direct';
          } catch {
            formattedReferrer = referrer;
          }
        }

        // Insert into database
        const click = await prisma.clickEvent.create({
          data: {
            shortUrlId,
            ip,
            country,
            city,
            browser,
            device,
            os,
            referrer: formattedReferrer,
            userAgent,
            timestamp: new Date(timestamp),
          },
        });

        console.log(`📊 Logged click event for shortUrl: ${shortUrlId} (${country}, ${browser})`);

        // Fetch latest details
        const urlDetails = await prisma.shortUrl.findUnique({
          where: { id: shortUrlId },
          select: { userId: true, shortCode: true },
        });

        if (urlDetails) {
          const userId = urlDetails.userId;
          const [stats, dashboardStats] = await Promise.all([
            analyticsService.getUrlAnalytics(shortUrlId),
            analyticsService.getUserDashboardStats(userId),
          ]);

          // Broadcast real-time updates over WebSocket
          socketManager.broadcast('analytics_update', {
            shortUrlId,
            shortCode: urlDetails.shortCode,
            userId,
            stats,
            dashboardStats,
            latestClick: click,
          });
        }

      } catch (error) {
        console.error('Error in Analytics Worker loop:', error);
      }
    }
  })();
}

export function stopAnalyticsWorker() {
  workerActive = false;
  console.log('👷 Analytics Worker stopped.');
}
