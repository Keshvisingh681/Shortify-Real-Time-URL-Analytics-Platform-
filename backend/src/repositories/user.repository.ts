import { prisma } from '../db';
import { Prisma, User } from '@prisma/client';

export class UserRepository {
  async findByEmail(email: string): Promise<User | null> {
    return prisma.user.findUnique({
      where: { email },
    });
  }

  async findById(id: string): Promise<User | null> {
    return prisma.user.findUnique({
      where: { id },
    });
  }

  async create(data: Prisma.UserCreateInput): Promise<User> {
    return prisma.user.create({
      data,
    });
  }

  async update(id: string, data: Prisma.UserUncheckedUpdateInput): Promise<User> {
    return prisma.user.update({
      where: { id },
      data,
    });
  }

  async findByVerificationToken(token: string): Promise<User | null> {
    return prisma.user.findFirst({
      where: { verificationToken: token },
    });
  }

  async findByResetToken(token: string): Promise<User | null> {
    return prisma.user.findFirst({
      where: { resetToken: token },
    });
  }
}
