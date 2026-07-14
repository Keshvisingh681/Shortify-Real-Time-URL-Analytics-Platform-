"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.startAnalyticsWorker = startAnalyticsWorker;
exports.stopAnalyticsWorker = stopAnalyticsWorker;
const analytics_queue_1 = require("../queue/analytics.queue");
const db_1 = require("../db");
const socket_manager_1 = require("../websocket/socket.manager");
const analytics_service_1 = require("../services/analytics.service");
const geoip_lite_1 = __importDefault(require("geoip-lite"));
const useragent_1 = __importDefault(require("useragent"));
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
async function startAnalyticsWorker() {
    if (workerActive)
        return;
    workerActive = true;
    console.log('👷 Analytics Worker started. Polling Redis Queue...');
    (async () => {
        while (workerActive) {
            try {
                const event = await analytics_queue_1.analyticsQueue.pop();
                if (!event) {
                    // If queue is empty, wait for a short duration
                    await new Promise((resolve) => setTimeout(resolve, 1000));
                    continue;
                }
                const { shortUrlId, ip, userAgent, referrer, timestamp } = event;
                // Parse user-agent
                const agent = useragent_1.default.lookup(userAgent);
                const browser = agent.family;
                const os = agent.os.family;
                // Map other to desktop
                const device = agent.device.family === 'Other' ? 'Desktop' : agent.device.family;
                // Parse geo IP location
                let country = 'Local';
                let city = 'Local';
                if (ip !== '127.0.0.1' && ip !== '::1' && ip !== 'localhost') {
                    const geo = geoip_lite_1.default.lookup(ip);
                    if (geo) {
                        country = geo.country || 'Unknown';
                        city = geo.city || 'Unknown';
                    }
                    else {
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
                    }
                    catch {
                        formattedReferrer = referrer;
                    }
                }
                // Insert into database
                const click = await db_1.prisma.clickEvent.create({
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
                const urlDetails = await db_1.prisma.shortUrl.findUnique({
                    where: { id: shortUrlId },
                    select: { userId: true, shortCode: true },
                });
                if (urlDetails) {
                    const userId = urlDetails.userId;
                    const [stats, dashboardStats] = await Promise.all([
                        analytics_service_1.analyticsService.getUrlAnalytics(shortUrlId),
                        analytics_service_1.analyticsService.getUserDashboardStats(userId),
                    ]);
                    // Broadcast real-time updates over WebSocket
                    socket_manager_1.socketManager.broadcast('analytics_update', {
                        shortUrlId,
                        shortCode: urlDetails.shortCode,
                        userId,
                        stats,
                        dashboardStats,
                        latestClick: click,
                    });
                }
            }
            catch (error) {
                console.error('Error in Analytics Worker loop:', error);
            }
        }
    })();
}
function stopAnalyticsWorker() {
    workerActive = false;
    console.log('👷 Analytics Worker stopped.');
}
