import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "default-jwt-secret-change-me";
const REFRESH_SECRET =
  process.env.REFRESH_TOKEN_SECRET || "default-refresh-secret-change-me";

const ACCESS_EXPIRY = "15m";
const REFRESH_EXPIRY = "7d";

export interface TokenPayload {
  userId: string;
  email: string;
}

export function signAccessToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: ACCESS_EXPIRY });
}

export function signRefreshToken(payload: TokenPayload): string {
  return jwt.sign(payload, REFRESH_SECRET, { expiresIn: REFRESH_EXPIRY });
}

export function verifyAccessToken(token: string): TokenPayload {
  const decoded = jwt.verify(token, JWT_SECRET) as TokenPayload;
  return decoded;
}

export function verifyRefreshToken(token: string): TokenPayload {
  const decoded = jwt.verify(token, REFRESH_SECRET) as TokenPayload;
  return decoded;
}
