import { z } from "zod";
import { trpc } from "../../lib/trpc";

export const getIdeaTrpcRoute = trpc.procedure
  .input(
    z.object({
      biohub: z.string(),
    }),
  )
  .query(async ({ ctx, input }) => {
    const idea = await ctx.prisma.idea.findUnique({
      where: {
        nick: input.biohub,
      },
    });

    return { idea };
  });
