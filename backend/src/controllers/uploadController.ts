import fs from "fs";
import { Response } from "express";
import { AuthRequest } from "../middleware/auth";
import { AppError } from "../middleware/errorHandler";

const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

const IMAGE_MIMES = new Set([
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
]);

const FILE_MIMES = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
  "application/octet-stream",
]);

export async function uploadFile(req: AuthRequest, res: Response) {
  if (!req.user) throw new AppError("Unauthorized", 401);
  const file = req.file;
  if (!file) throw new AppError("No file uploaded", 400);

  const mime = file.mimetype;
  const isImage = IMAGE_MIMES.has(mime);
  const isAllowedFile = FILE_MIMES.has(mime) || mime.startsWith("image/");
  if (!isImage && !isAllowedFile) {
    try {
      fs.unlinkSync(file.path);
    } catch {
      // ignore
    }
    throw new AppError("File type not allowed", 400);
  }

  const maxSize = isImage ? MAX_IMAGE_SIZE : MAX_FILE_SIZE;
  if (file.size > maxSize) {
    try {
      fs.unlinkSync(file.path);
    } catch {
      // ignore
    }
    const maxMB = maxSize / (1024 * 1024);
    throw new AppError(`File too large. Max ${maxMB}MB for ${isImage ? "images" : "files"}.`, 400);
  }

  const baseUrl = process.env.API_URL || `http://localhost:${process.env.PORT || 4000}`;
  const url = `${baseUrl}/uploads/${file.filename}`;
  res.json({ url });
}
