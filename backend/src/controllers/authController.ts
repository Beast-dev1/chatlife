import { Response } from "express";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";
import { signAccessToken, signRefreshToken, verifyRefreshToken } from "../utils/jwt";
import { AuthRequest } from "../middleware/auth";
import { AppError } from "../middleware/errorHandler";
import {
  registerSchema,
  loginSchema,
  refreshSchema,
  profileSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  type RegisterInput,
  type LoginInput,
  type ProfileInput,
  type ForgotPasswordInput,
  type ResetPasswordInput,
} from "../validators/auth";
import { sendPasswordResetEmail } from "../services/emailService";

const prisma = new PrismaClient();
const SALT_ROUNDS = 10;

function excludePassword<T extends { password?: string }>(user: T): Omit<T, "password"> {
  const { password, ...rest } = user;
  return rest;
}

export async function register(req: AuthRequest, res: Response) {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) throw parsed.error;

  const { email, username, password }: RegisterInput = parsed.data;

  const existing = await prisma.user.findFirst({
    where: {
      OR: [{ email: email.toLowerCase() }, { username: username.toLowerCase() }],
    },
  });
  if (existing) {
    throw new AppError(
      existing.email === email.toLowerCase()
        ? "Email already registered"
        : "Username already taken",
      409
    );
  }

  const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
  const user = await prisma.user.create({
    data: {
      email: email.toLowerCase(),
      username: username.toLowerCase(),
      password: hashedPassword,
    },
  });

  const payload = { userId: user.id, email: user.email };
  const accessToken = signAccessToken(payload);
  const refreshToken = signRefreshToken(payload);

  res.status(201).json({
    user: excludePassword(user),
    accessToken,
    refreshToken,
    expiresIn: 900, // 15 minutes in seconds
  });
}

export async function login(req: AuthRequest, res: Response) {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) throw parsed.error;

  const { email, password }: LoginInput = parsed.data;

  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
  });
  if (!user || !(await bcrypt.compare(password, user.password))) {
    throw new AppError("Invalid email or password", 401);
  }

  const payload = { userId: user.id, email: user.email };
  const accessToken = signAccessToken(payload);
  const refreshToken = signRefreshToken(payload);

  res.json({
    user: excludePassword(user),
    accessToken,
    refreshToken,
    expiresIn: 900,
  });
}

export async function refresh(req: AuthRequest, res: Response) {
  const parsed = refreshSchema.safeParse(req.body);
  if (!parsed.success) throw parsed.error;

  const { refreshToken } = parsed.data;

  try {
    const payload = verifyRefreshToken(refreshToken);
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
    });
    if (!user) throw new AppError("User not found", 401);

    const newAccessToken = signAccessToken({
      userId: user.id,
      email: user.email,
    });
    const newRefreshToken = signRefreshToken({
      userId: user.id,
      email: user.email,
    });

    res.json({
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
      expiresIn: 900,
    });
  } catch {
    throw new AppError("Invalid or expired refresh token", 401);
  }
}

export async function me(req: AuthRequest, res: Response) {
  if (!req.user) throw new AppError("Unauthorized", 401);

  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: {
      id: true,
      email: true,
      username: true,
      avatarUrl: true,
      status: true,
      bio: true,
      createdAt: true,
      updatedAt: true,
    },
  });
  if (!user) throw new AppError("User not found", 404);

  res.json(user);
}

export async function logout(_req: AuthRequest, res: Response) {
  // Client clears tokens; optional Redis blacklist for refresh token can be added later
  res.json({ message: "Logged out successfully" });
}

export async function updateProfile(req: AuthRequest, res: Response) {
  if (!req.user) throw new AppError("Unauthorized", 401);

  const parsed = profileSchema.safeParse(req.body);
  if (!parsed.success) throw parsed.error;

  const data: ProfileInput = parsed.data;

  const user = await prisma.user.update({
    where: { id: req.user.id },
    data: {
      ...(data.avatarUrl !== undefined && { avatarUrl: data.avatarUrl }),
      ...(data.status !== undefined && { status: data.status }),
      ...(data.bio !== undefined && { bio: data.bio }),
    },
    select: {
      id: true,
      email: true,
      username: true,
      avatarUrl: true,
      status: true,
      bio: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  res.json(user);
}

const TOKEN_EXPIRY_HOURS = 1;

function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export async function forgotPassword(req: AuthRequest, res: Response) {
  const parsed = forgotPasswordSchema.safeParse(req.body);
  if (!parsed.success) throw parsed.error;

  const { email }: ForgotPasswordInput = parsed.data;
  const normalizedEmail = email.toLowerCase();

  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });

  if (user) {
    const rawToken = crypto.randomBytes(32).toString("hex");
    const hashedToken = hashToken(rawToken);
    const expiresAt = new Date(Date.now() + TOKEN_EXPIRY_HOURS * 60 * 60 * 1000);

    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        token: hashedToken,
        expiresAt,
      },
    });

    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
    const resetLink = `${frontendUrl}/reset-password?token=${rawToken}`;
    await sendPasswordResetEmail(user.email, resetLink);
  }

  res.json({
    message: "If an account exists with that email, you will receive a password reset link.",
  });
}

export async function resetPassword(req: AuthRequest, res: Response) {
  const parsed = resetPasswordSchema.safeParse(req.body);
  if (!parsed.success) throw parsed.error;

  const { token: rawToken, newPassword }: ResetPasswordInput = parsed.data;
  const hashedToken = hashToken(rawToken);

  const resetRecord = await prisma.passwordResetToken.findUnique({
    where: { token: hashedToken },
    include: { user: true },
  });

  if (!resetRecord || resetRecord.expiresAt < new Date()) {
    throw new AppError("Invalid or expired reset token", 400);
  }

  const hashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);
  await prisma.$transaction([
    prisma.user.update({
      where: { id: resetRecord.userId },
      data: { password: hashedPassword },
    }),
    prisma.passwordResetToken.delete({
      where: { id: resetRecord.id },
    }),
  ]);

  res.json({ message: "Password has been reset successfully. You can now sign in." });
}
