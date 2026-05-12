import { z } from "zod";
import { trpc } from "../../lib/trpc.js";
import { TRPCError } from "@trpc/server";
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { randomUUID } from "crypto";

const s3Client = new S3Client({
  region: process.env.S3_REGION || "us-east-1",
  endpoint: process.env.S3_ENDPOINT || "http://localhost:9000",
  forcePathStyle: true,
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY || "minioadmin",
    secretAccessKey: process.env.S3_SECRET_KEY || "minioadmin",
  },
});

const BUCKET = process.env.S3_BUCKET || "biohub";

async function checkAccess(ctx: any, projectId: string) {
  const project = await ctx.prisma.project.findUnique({
    where: { id: projectId },
    include: { sharedAccess: true },
  });

  if (!project) throw new TRPCError({ code: "NOT_FOUND" });

  const hasAccess =
    project.ownerId === ctx.userId ||
    project.sharedAccess.some(
      (sa: any) => sa.userId === ctx.userId && sa.status === "accepted",
    );

  if (!hasAccess) throw new TRPCError({ code: "FORBIDDEN" });
}

export const fileRouter = trpc.router({
  getUploadUrl: trpc.procedure
    .input(
      z.object({
        projectId: z.string(),
        stage: z.string(),
        fileName: z.string(),
        fileSize: z.number(),
        mimeType: z.string().optional(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      if (!ctx.userId) throw new TRPCError({ code: "UNAUTHORIZED" });

      await checkAccess(ctx, input.projectId);

      const key = `projects/${input.projectId}/${input.stage}/${randomUUID()}-${input.fileName}`;

      const command = new PutObjectCommand({
        Bucket: BUCKET,
        Key: key,
        ContentType: input.mimeType || "application/octet-stream",
      });

      const uploadUrl = await getSignedUrl(s3Client, command, {
        expiresIn: 3600,
      });

      const file = await ctx.prisma.file.create({
        data: {
          projectId: input.projectId,
          stage: input.stage,
          fileName: input.fileName,
          fileSize: BigInt(input.fileSize),
          s3Key: key,
          s3Bucket: BUCKET,
          mimeType: input.mimeType || null,
          uploadedBy: ctx.userId,
        },
      });

      return { uploadUrl, fileId: file.id };
    }),

  list: trpc.procedure
    .input(z.object({ projectId: z.string() }))
    .query(async ({ input, ctx }) => {
      if (!ctx.userId) throw new TRPCError({ code: "UNAUTHORIZED" });

      await checkAccess(ctx, input.projectId);

      const files = await ctx.prisma.file.findMany({
        where: { projectId: input.projectId },
        orderBy: { createdAt: "desc" },
      });

      return {
        files: files.map((f) => ({
          ...f,
          fileSize: f.fileSize ? Number(f.fileSize) : 0,
        })),
      };
    }),

  getDownloadUrl: trpc.procedure
    .input(z.object({ fileId: z.string() }))
    .query(async ({ input, ctx }) => {
      if (!ctx.userId) throw new TRPCError({ code: "UNAUTHORIZED" });

      const file = await ctx.prisma.file.findUnique({
        where: { id: input.fileId },
        include: { project: { include: { sharedAccess: true } } },
      });

      if (!file) throw new TRPCError({ code: "NOT_FOUND" });

      const hasAccess =
        file.project.ownerId === ctx.userId ||
        file.project.sharedAccess.some(
          (sa: any) => sa.userId === ctx.userId && sa.status === "accepted",
        );

      if (!hasAccess) throw new TRPCError({ code: "FORBIDDEN" });

      const command = new GetObjectCommand({
        Bucket: file.s3Bucket,
        Key: file.s3Key,
      });

      const downloadUrl = await getSignedUrl(s3Client, command, {
        expiresIn: 3600,
      });

      return { downloadUrl, fileName: file.fileName };
    }),
});
