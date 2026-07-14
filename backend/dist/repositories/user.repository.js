"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserRepository = void 0;
const db_1 = require("../db");
class UserRepository {
    async findByEmail(email) {
        return db_1.prisma.user.findUnique({
            where: { email },
        });
    }
    async findById(id) {
        return db_1.prisma.user.findUnique({
            where: { id },
        });
    }
    async create(data) {
        return db_1.prisma.user.create({
            data,
        });
    }
    async update(id, data) {
        return db_1.prisma.user.update({
            where: { id },
            data,
        });
    }
    async findByVerificationToken(token) {
        return db_1.prisma.user.findFirst({
            where: { verificationToken: token },
        });
    }
    async findByResetToken(token) {
        return db_1.prisma.user.findFirst({
            where: { resetToken: token },
        });
    }
}
exports.UserRepository = UserRepository;
