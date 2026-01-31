import { NextFunction, Request, RequestHandler, Response, Router } from "express";
import fs from "fs";
import multer from "multer";
import path from "path";
import { uploadFile } from "../controllers/uploadController";
import { authMiddleware, AuthRequest } from "../middleware/auth";

const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(process.cwd(), "uploads");
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB - validate image vs file in controller

function ensureUploadDir() {
  if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  }
}
ensureUploadDir();

function safeFilename(original: string): string {
  const ext = path.extname(original) || "";
  const base = Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 10);
  return base + ext.toLowerCase();
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => cb(null, safeFilename(file.originalname || "file")),
});

const upload = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE },
});

const router = Router();
router.use(authMiddleware);
router.post("/", upload.single("file") as unknown as RequestHandler, (req: Request, res: Response, next: NextFunction) => {
  uploadFile(req as AuthRequest, res).catch(next);
});
export default router;
