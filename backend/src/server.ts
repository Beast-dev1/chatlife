import "dotenv/config";
import http from "http";
import express, { Request, Response } from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { Server as SocketServer } from "socket.io";
import { createAdapter } from "@socket.io/redis-adapter";
import { PrismaClient } from "@prisma/client";
import authRoutes from "./routes/authRoutes";
import chatRoutes from "./routes/chatRoutes";
import contactRoutes from "./routes/contactRoutes";
import userRoutes from "./routes/userRoutes";
import messageRoutes from "./routes/messageRoutes";
import messageIdRoutes from "./routes/messageIdRoutes";
import uploadRoutes from "./routes/uploadRoutes";
import callRoutes from "./routes/callRoutes";
import path from "path";
import { errorHandler } from "./middleware/errorHandler";
import { getRedisClients, closeRedis } from "./config/redis";
import { attachSocketHandlers } from "./socket";

const app = express();
const server = http.createServer(app);
const prisma = new PrismaClient();
const PORT = process.env.PORT || 4000;
const FRONTEND_URL = process.env.FRONTEND_URL || "*";

// Security middleware
app.use(helmet());
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "*",
    credentials: true,
  })
);
app.use(express.json());

// Rate limiting: 100 requests per minute per IP
const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  message: { error: "Too many requests, please try again later." },
});
app.use(limiter as unknown as express.RequestHandler);

// API routes
app.use("/api/auth", authRoutes);
app.use("/api/chats", messageRoutes); // GET/POST /api/chats/:chatId/messages (before :id)
app.use("/api/chats", chatRoutes);
app.use("/api/contacts", contactRoutes);
app.use("/api/users", userRoutes);
app.use("/api/messages", messageIdRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/calls", callRoutes);

const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(process.cwd(), "uploads");
app.use("/uploads", express.static(UPLOAD_DIR));

// Health check - verifies DB connection
app.get("/api/health", async (_req: Request, res: Response) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({
      status: "ok",
      database: "connected",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Database health check failed:", error);
    res.status(503).json({
      status: "error",
      database: "disconnected",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// Basic root route
app.get("/", (_req: Request, res: Response) => {
  res.json({
    message: "Let'sChat API",
    version: "1.0.0",
    docs: "/api/health",
  });
});

// Centralized error handler (must be last)
app.use(errorHandler);

// Socket.io with optional Redis adapter
const io = new SocketServer(server, {
  cors: { origin: FRONTEND_URL, credentials: true },
  path: "/socket.io",
});
app.set("io", io);
attachSocketHandlers(io);

// Start server
async function main() {
  try {
    await prisma.$connect();
    console.log("✓ Database connected successfully");

    try {
      const { pubClient, subClient } = await getRedisClients();
      io.adapter(createAdapter(pubClient, subClient));
      console.log("✓ Redis adapter attached for Socket.io");
    } catch (redisErr) {
      console.warn("⚠ Redis not available, Socket.io running in single-instance mode:", redisErr);
    }

    server.listen(PORT, () => {
      console.log(`✓ Server running on http://localhost:${PORT}`);
      console.log(`  Health check: http://localhost:${PORT}/api/health`);
      console.log(`  Socket.io: ws://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Failed to connect to database:", error);
    process.exit(1);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

// Graceful shutdown
async function shutdown() {
  await prisma.$disconnect();
  await closeRedis();
  process.exit(0);
}
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
