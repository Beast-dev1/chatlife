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

  // Return a path relative to the frontend origin so images load via the same origin
  // (frontend proxies /uploads/* to this backend). This avoids broken images when
  // the receiver is on another device and cannot reach API_URL (e.g. localhost:4000).
  // If you serve uploads from a CDN or public API URL instead, set API_URL and
  // use that to build a full URL here.
  const baseUrl = process.env.API_URL?.replace(/\/$/, "");
  const url = baseUrl ? `${baseUrl}/uploads/${file.filename}` : `/uploads/${file.filename}`;
  res.json({ url });
}
