import { Response } from "express";
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
  type RegisterInput,
  type LoginInput,
  type ProfileInput,
} from "../validators/auth";

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
