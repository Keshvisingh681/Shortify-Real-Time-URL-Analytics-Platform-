"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminController = void 0;
const db_1 = require("../db");
class AdminController {
    async getStats(request, reply) {
        try {
            const [totalUsers, totalUrls, totalClicks, activeUsers] = await Promise.all([
                db_1.prisma.user.count(),
                db_1.prisma.shortUrl.count(),
                db_1.prisma.clickEvent.count(),
                db_1.prisma.user.count({
                    where: {
                        shortUrls: {
                            some: {}
                        }
                    }
                })
            ]);
            return reply.send({
                totalUsers,
                totalUrls,
                totalClicks,
                activeUsers
            });
        }
        catch (error) {
            return reply.status(500).send({ error: error.message });
        }
    }
    async listUsers(request, reply) {
        try {
            const users = await db_1.prisma.user.findMany({
                orderBy: { createdAt: 'desc' },
                select: {
                    id: true,
                    email: true,
                    isVerified: true,
                    isAdmin: true,
                    avatarUrl: true,
                    createdAt: true,
                    _count: {
                        select: { shortUrls: true }
                    }
                }
            });
            // Fetch click counts for each user in parallel
            const usersWithClicks = await Promise.all(users.map(async (user) => {
                const clickCount = await db_1.prisma.clickEvent.count({
                    where: {
                        shortUrl: { userId: user.id }
                    }
                });
                return {
                    ...user,
                    clickCount
                };
            }));
            return reply.send(usersWithClicks);
        }
        catch (error) {
            return reply.status(500).send({ error: error.message });
        }
    }
    async deleteUser(request, reply) {
        const { id } = request.params;
        try {
            // Prevent deleting own account
            if (request.user.sub === id) {
                return reply.status(400).send({ error: 'Cannot delete your own admin account' });
            }
            await db_1.prisma.user.delete({
                where: { id }
            });
            return reply.send({ message: 'User deleted successfully' });
        }
        catch (error) {
            return reply.status(500).send({ error: error.message });
        }
    }
}
exports.AdminController = AdminController;
