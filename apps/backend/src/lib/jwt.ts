import { sign, verify } from "hono/jwt";
import type { JWTPayload } from "hono/jwt";

export interface TokenPayload extends JWTPayload {
  userId: string;
  username: string;
}

export async function createToken(payload: Omit<TokenPayload, "exp" | "iat">, secret: string): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const tokenPayload: TokenPayload = {
    ...payload,
    iat: now,
    exp: now + (7 * 24 * 60 * 60), // 7 days
  };

  return await sign(tokenPayload, secret);
}

export async function verifyToken(token: string, secret: string): Promise<TokenPayload | null> {
  try {
    const payload = await verify(token, secret) as TokenPayload;
    return payload;
  } catch (error) {
    console.error("Token verification failed:", error);
    return null;
  }
}