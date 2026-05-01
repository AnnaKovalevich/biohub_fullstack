import { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const createTrpcContext = async ({ req }: CreateExpressContextOptions) => {
  // Находим любого пользователя, чтобы не было проблем с userId
  let user = await prisma.user.findFirst();
  if (!user) {
    user = await prisma.user.create({
      data: {
        email: "demo@biohub.ru",
        password: "$2b$10$abcdefghijklmnopqrstuv", // заглушка
        fullName: "Demo User",
        position: "Bioinformatician",
        institution: "BioHub Institute",
      },
    });
  }
  const userId = user.id;
  console.log(`[Auth] Using fixed user: ${user.email} (${userId})`);
  return { prisma, userId };
};

export type TrpcContext = Awaited<ReturnType<typeof createTrpcContext>>;
