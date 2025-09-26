import { getCookie, setCookie } from "hono/cookie";
import type { Context } from "hono";
import { createToken, verifyToken, type TokenPayload } from "./jwt";
import type { Env } from "./types";

export async function setAuthCookie(c: Context<{ Bindings: Env }>, userId: string, username: string) {
  const token = await createToken({ userId, username }, c.env.JWT_SECRET);

  setCookie(c, "auth-token", token, {
    httpOnly: true,
    secure: true,
    sameSite: "Strict",
    maxAge: 7 * 24 * 60 * 60, // 7 days
    path: "/",
  });

  return token;
}

export async function getAuthUser(c: Context<{ Bindings: Env }>): Promise<TokenPayload | null> {
  const token = getCookie(c, "auth-token");

  if (!token) {
    return null;
  }

  return await verifyToken(token, c.env.JWT_SECRET);
}

export function clearAuthCookie(c: Context) {
  setCookie(c, "auth-token", "", {
    httpOnly: true,
    secure: true,
    sameSite: "Strict",
    maxAge: 0,
    path: "/",
  });
}