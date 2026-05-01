import { z } from "zod";
import { trpc } from "../../lib/trpc";
import { TRPCError } from "@trpc/server";

export const userRouter = trpc.router({
  getProfile: trpc.procedure.query(async ({ ctx }) => {
    if (!ctx.userId) throw new TRPCError({ code: "UNAUTHORIZED" });
    const user = await ctx.prisma.user.findUnique({
      where: { id: ctx.userId },
      select: { id: true, email: true, fullName: true, position: true, institution: true },
    });
    if (!user) throw new TRPCError({ code: "NOT_FOUND" });
    return user;
  }),
  updateProfile: trpc.procedure
    .input(z.object({ fullName: z.string().optional(), position: z.string().optional(), institution: z.string().optional() }))
    .mutation(async ({ input, ctx }) => {
      if (!ctx.userId) throw new TRPCError({ code: "UNAUTHORIZED" });
      const updated = await ctx.prisma.user.update({
        where: { id: ctx.userId },
        data: input,
        select: { id: true, email: true, fullName: true, position: true, institution: true },
      });
      return updated;
    }),
});
