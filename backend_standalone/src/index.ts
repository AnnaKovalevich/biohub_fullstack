import cors from "cors";
import express from "express";
import { createTrpcContext } from "./lib/trpcContext";
import { applyTrpcToExpressApp } from "./lib/trpc";
import { trpcRouter } from "./router";
import multer from "multer";
import path from "path";
import fs from "fs/promises";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const UPLOAD_DIR = path.join(process.cwd(), "uploads");
await fs.mkdir(UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const fileId = req.params.fileId;
    const fileRecord = await prisma.file.findUnique({ where: { id: fileId } });
    if (!fileRecord) return cb(new Error("Invalid fileId"));
    const fullPath = path.join(UPLOAD_DIR, fileRecord.s3Key);
    const dir = path.dirname(fullPath);
    await fs.mkdir(dir, { recursive: true });
    cb(null, dir);
  },
  filename: async (req, file, cb) => {
    const fileId = req.params.fileId;
    const fileRecord = await prisma.file.findUnique({ where: { id: fileId } });
    const originalName = fileRecord?.fileName || file.originalname;
    cb(null, `${fileId}-${originalName}`);
  },
});
const upload = multer({ storage, limits: { fileSize: 100 * 1024 * 1024 * 1024 } });

async function main() {
  const expressApp = express();

  expressApp.use(
    cors({
      origin: "http://localhost:5173",
      credentials: true,
      methods: ["GET", "POST", "OPTIONS", "PUT"],
      allowedHeaders: ["Content-Type", "trpc-accept", "trpc-content-type", "Authorization"],
    })
  );
  expressApp.options("*", cors());

  expressApp.get("/ping", (req, res) => {
    res.send("pong");
  });

  // Загрузка файла
  expressApp.put("/upload/:fileId", upload.single("file"), async (req, res) => {
    try {
      const { fileId } = req.params;
      const fileRecord = await prisma.file.findUnique({ where: { id: fileId } });
      if (!fileRecord) return res.status(404).send("File record not found");
      if (!req.file) return res.status(400).send("No file uploaded");
      res.json({ success: true });
    } catch (err) {
      console.error(err);
      res.status(500).send("Upload failed");
    }
  });

  // Скачивание файла
  expressApp.get("/uploads/*", async (req, res) => {
    const filePath = path.join(UPLOAD_DIR, req.params[0]);
    try {
      await fs.access(filePath);
      res.sendFile(filePath);
    } catch {
      res.status(404).send("File not found");
    }
  });

  applyTrpcToExpressApp(expressApp, createTrpcContext, trpcRouter);

  expressApp.listen(3000, "0.0.0.0", () => {
    console.info("Server running on http://localhost:3000");
  });
}

main().catch(console.error);
