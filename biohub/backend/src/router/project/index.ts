import { z } from "zod";
import { trpc } from "../../lib/trpc";
import { TRPCError } from "@trpc/server";
import { S3Client, DeleteObjectCommand } from "@aws-sdk/client-s3";

const s3Client = new S3Client({
  region: process.env.S3_REGION || "us-east-1",
  endpoint: process.env.S3_ENDPOINT,
  forcePathStyle: true,
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY || "minioadmin",
    secretAccessKey: process.env.S3_SECRET_KEY || "minioadmin",
  },
});

function serializeFile(file: any) {
  return { ...file, fileSize: file.fileSize ? Number(file.fileSize) : null };
}

function serializeProject(project: any) {
  if (project.files) {
    project.files = project.files.map(serializeFile);
  }
  return project;
}

const createProjectInput = z.object({
  name: z.string().min(1),
  type: z.string(),
  description: z.string().optional(),
  sampleId: z.string().optional(),
  pipelineParams: z.any().optional(),
  computeEnv: z.any().optional(),
  advanced: z.any().optional(),
  status: z.enum(["active", "in_progress", "completed"]).optional().default("active"),
  platform: z.string().optional(),
  qcStatus: z.enum(["pending", "passed", "failed"]).optional().default("pending"),
  experimentDate: z.string().datetime().optional().nullable(),
});

const updateProjectInput = z.object({
  id: z.string(),
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  status: z.enum(["active", "in_progress", "completed"]).optional(),
  platform: z.string().optional(),
  qcStatus: z.enum(["pending", "passed", "failed"]).optional(),
  experimentDate: z.string().datetime().optional().nullable(),
});

export const projectRouter = trpc.router({
  create: trpc.procedure
    .input(createProjectInput)
    .mutation(async ({ input, ctx }) => {
      let ownerId = ctx.userId;
      if (!ownerId) {
        const firstUser = await ctx.prisma.user.findFirst();
        if (!firstUser) {
          throw new TRPCError({ code: "UNAUTHORIZED", message: "Нет пользователей. Зарегистрируйтесь." });
        }
        ownerId = firstUser.id;
        console.log(`[createProject] Используем fallback-пользователя: ${ownerId}`);
      }
      const project = await ctx.prisma.project.create({
        data: {
          name: input.name,
          type: input.type,
          description: input.description,
          sampleId: input.sampleId,
          pipelineParams: input.pipelineParams || {},
          computeEnv: input.computeEnv || {},
          advanced: input.advanced || {},
          ownerId: ownerId,
          status: input.status,
          platform: input.platform,
          qcStatus: input.qcStatus,
          experimentDate: input.experimentDate ? new Date(input.experimentDate) : null,
        },
      });
      return project;
    }),
  list: trpc.procedure.query(async ({ ctx }) => {
    if (!ctx.userId) throw new TRPCError({ code: "UNAUTHORIZED" });
    const owned = await ctx.prisma.project.findMany({
      where: { ownerId: ctx.userId },
      include: { files: true },
    });
    const shared = await ctx.prisma.project.findMany({
      where: { sharedAccess: { some: { userId: ctx.userId, status: "accepted" } } },
      include: { files: true },
    });
    const all = [...owned, ...shared];
    const unique = Array.from(new Map(all.map(p => [p.id, p])).values());
    return { projects: unique.map(serializeProject) };
  }),
  getById: trpc.procedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input, ctx }) => {
      if (!ctx.userId) throw new TRPCError({ code: "UNAUTHORIZED" });
      const project = await ctx.prisma.project.findUnique({
        where: { id: input.id },
        include: { owner: true, sharedAccess: true, files: true },
      });
      if (!project) throw new TRPCError({ code: "NOT_FOUND" });
      const hasAccess = project.ownerId === ctx.userId ||
        project.sharedAccess.some(sa => sa.userId === ctx.userId && sa.status === "accepted");
      if (!hasAccess) throw new TRPCError({ code: "FORBIDDEN" });
      return serializeProject(project);
    }),
  update: trpc.procedure
    .input(updateProjectInput)
    .mutation(async ({ input, ctx }) => {
      if (!ctx.userId) throw new TRPCError({ code: "UNAUTHORIZED" });
      const project = await ctx.prisma.project.findUnique({ where: { id: input.id } });
      if (!project) throw new TRPCError({ code: "NOT_FOUND" });
      if (project.ownerId !== ctx.userId) throw new TRPCError({ code: "FORBIDDEN" });
      const updateData: any = {};
      if (input.name !== undefined) updateData.name = input.name;
      if (input.description !== undefined) updateData.description = input.description;
      if (input.status !== undefined) updateData.status = input.status;
      if (input.platform !== undefined) updateData.platform = input.platform;
      if (input.qcStatus !== undefined) updateData.qcStatus = input.qcStatus;
      if (input.experimentDate !== undefined) updateData.experimentDate = input.experimentDate ? new Date(input.experimentDate) : null;
      const updated = await ctx.prisma.project.update({
        where: { id: input.id },
        data: updateData,
      });
      return updated;
    }),
  delete: trpc.procedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      if (!ctx.userId) throw new TRPCError({ code: "UNAUTHORIZED" });
      const project = await ctx.prisma.project.findUnique({
        where: { id: input.id },
        include: { files: true },
      });
      if (!project) throw new TRPCError({ code: "NOT_FOUND" });
      if (project.ownerId !== ctx.userId) throw new TRPCError({ code: "FORBIDDEN" });
      for (const file of project.files) {
        try {
          const command = new DeleteObjectCommand({ Bucket: file.s3Bucket, Key: file.s3Key });
          await s3Client.send(command);
        } catch (err) {
          console.error(`Failed to delete file ${file.id} from MinIO:`, err);
        }
      }
      await ctx.prisma.project.delete({ where: { id: input.id } });
      return { success: true };
    }),
});
