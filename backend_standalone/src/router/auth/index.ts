import crypto from "crypto";
import { z } from "zod";
import { trpc } from "../../lib/trpc";
import { hashPassword, comparePassword, generateToken } from "../../lib/auth";
import { sendResetPasswordEmail } from "../../lib/emailService";
import { TRPCError } from "@trpc/server";

export const authRouter = trpc.router({
  register: trpc.procedure
    .input(
      z.object({
        email: z.string().email(),
        password: z.string().min(6),
        fullName: z.string().min(1),
        position: z.string().optional(),
        institution: z.string().optional(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const existing = await ctx.prisma.user.findUnique({
        where: { email: input.email },
      });
      if (existing) throw new Error("User already exists");
      const hashed = await hashPassword(input.password);
      const user = await ctx.prisma.user.create({
        data: {
          email: input.email,
          password: hashed,
          fullName: input.fullName,
          position: input.position || null,
          institution: input.institution || null,
          role: "user",
        },
      });
      const token = generateToken(user.id, user.email);
      return {
        token,
        user: {
          id: user.id,
          email: user.email,
          fullName: user.fullName,
          position: user.position,
          institution: user.institution,
          role: user.role,
        },
      };
    }),

  login: trpc.procedure
    .input(z.object({ email: z.string().email(), password: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const user = await ctx.prisma.user.findUnique({
        where: { email: input.email },
      });
      if (!user) throw new Error("Invalid credentials");
      const valid = await comparePassword(input.password, user.password);
      if (!valid) throw new Error("Invalid credentials");
      const token = generateToken(user.id, user.email);
      return {
        token,
        user: {
          id: user.id,
          email: user.email,
          fullName: user.fullName,
          position: user.position,
          institution: user.institution,
          role: user.role,
        },
      };
    }),

  forgotPassword: trpc.procedure
    .input(z.object({ email: z.string().email() }))
    .mutation(async ({ input, ctx }) => {
      const user = await ctx.prisma.user.findUnique({
        where: { email: input.email },
      });
      if (!user) {
        throw new Error("Пользователь с таким email не найден.");
      }

      const resetToken = crypto.randomBytes(32).toString("hex");
      const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 час

      await ctx.prisma.user.update({
        where: { id: user.id },
        data: {
          resetToken,
          resetTokenExpiry,
        },
      });

      try {
        await sendResetPasswordEmail(user.email, resetToken);
      } catch (error) {
        console.error("Ошибка отправки письма:", error);
        // Не прерываем операцию – письмо может не дойти, но токен сохранён
      }

      // Временно выведем ссылку в консоль сервера для теста (потом уберём)
      console.log(
        `Ссылка для сброса пароля: http://localhost:5173/reset-password?token=${resetToken}`,
      );

      return {
        success: true,
        message: "Инструкция по сбросу пароля отправлена на вашу почту.",
      };
    }),

  resetPassword: trpc.procedure
    .input(z.object({ token: z.string(), newPassword: z.string().min(6) }))
    .mutation(async ({ input, ctx }) => {
      const user = await ctx.prisma.user.findFirst({
        where: {
          resetToken: input.token,
          resetTokenExpiry: { gt: new Date() },
        },
      });

      if (!user) {
        throw new Error(
          "Недействительная или просроченная ссылка для сброса пароля.",
        );
      }

      const hashedNewPassword = await hashPassword(input.newPassword);

      await ctx.prisma.user.update({
        where: { id: user.id },
        data: {
          password: hashedNewPassword,
          resetToken: null,
          resetTokenExpiry: null,
        },
      });

      return {
        success: true,
        message:
          "Пароль успешно изменён. Теперь вы можете войти с новым паролем.",
      };
    }),

  changePassword: trpc.procedure
    .input(
      z.object({
        oldPassword: z.string(),
        newPassword: z.string().min(6),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      if (!ctx.userId) throw new TRPCError({ code: "UNAUTHORIZED" });

      const user = await ctx.prisma.user.findUnique({
        where: { id: ctx.userId },
      });

      if (!user) throw new Error("Пользователь не найден");

      const valid = await comparePassword(input.oldPassword, user.password);
      if (!valid) throw new Error("Текущий пароль неверен");

      const hashed = await hashPassword(input.newPassword);

      await ctx.prisma.user.update({
        where: { id: ctx.userId },
        data: { password: hashed },
      });

      return { success: true, message: "Пароль успешно изменён" };
    }),
});
