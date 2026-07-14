"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireAdmin = requireAdmin;
const db_1 = require("../db");
async function requireAdmin(request, reply) {
    try {
        const userId = request.user.sub;
        const user = await db_1.prisma.user.findUnique({
            where: { id: userId },
        });
        if (!user || !user.isAdmin) {
            return reply.status(403).send({ error: 'Forbidden: Admin access required' });
        }
    }
    catch (err) {
        return reply.status(500).send({ error: 'Internal Server Error' });
    }
}
