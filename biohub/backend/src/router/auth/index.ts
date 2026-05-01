import { z } from "zod";
import { trpc } from "../../lib/trpc";
import { hashPassword, comparePassword, generateToken } from "../../lib/auth";

export const authRouter = trpc.router({
  register: trpc.procedure
    .input(z.object({ email: z.string().email(), password: z.string().min(6), fullName: z.string().min(1), position: z.string().optional(), institution: z.string().optional() }))
    .mutation(async ({ input, ctx }) => {
      const existing = await ctx.prisma.user.findUnique({ where: { email: input.email } });
      if (existing) throw new Error("User already exists");
      const hashed = await hashPassword(input.password);
      const user = await ctx.prisma.user.create({
        data: { email: input.email, password: hashed, fullName: input.fullName, position: input.position || null, institution: input.institution || null },
      });
      const token = generateToken(user.id, user.email);
      return { token, user: { id: user.id, email: user.email, fullName: user.fullName, position: user.position, institution: user.institution } };
    }),
  login: trpc.procedure
    .input(z.object({ email: z.string().email(), password: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const user = await ctx.prisma.user.findUnique({ where: { email: input.email } });
      if (!user) throw new Error("Invalid credentials");
      const valid = await comparePassword(input.password, user.password);
      if (!valid) throw new Error("Invalid credentials");
      const token = generateToken(user.id, user.email);
      return { token, user: { id: user.id, email: user.email, fullName: user.fullName, position: user.position, institution: user.institution } };
    }),
});
