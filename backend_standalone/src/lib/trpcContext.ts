import { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import { PrismaClient } from "@prisma/client";
import { verifyToken } from "./auth";

const prisma = new PrismaClient();

export const createTrpcContext = async ({
  req,
}: CreateExpressContextOptions) => {
  let userId: string | null = null;

  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.split(" ")[1];

    const payload = verifyToken(token);

    if (payload) {
      userId = payload.userId;
    }
  }

  return {
    prisma,
    userId,
  };
};

export type TrpcContext = Awaited<ReturnType<typeof createTrpcContext>>;
