import { Hono } from "hono";
import { nanoid } from "nanoid";
import { drizzle } from "drizzle-orm/d1";
import { eq } from "drizzle-orm";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { users } from "../db/schema";
import { setAuthCookie, getAuthUser, clearAuthCookie } from "../lib/auth";
import { hashPassword, verifyPassword } from "../lib/password";
import type { Env } from "../lib/types";

const app = new Hono<{ Bindings: Env }>();

const signupSchema = z.object({
  username: z.string().min(3).max(20).regex(/^[a-zA-Z0-9_]+$/),
  password: z.string().min(6).max(100),
  displayName: z.string().max(50).optional(),
});

const loginSchema = z.object({
  username: z.string(),
  password: z.string(),
});

app.post("/signup", zValidator("json", signupSchema), async (c) => {
  const { username, password, displayName } = c.req.valid("json");
  const db = drizzle(c.env.DB);

  try {
    // Check if username already exists
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.username, username))
      .get();

    if (existingUser) {
      return c.json({ error: "Username already exists" }, 400);
    }

    // Create new user
    const userId = nanoid();
    const hashedPassword = await hashPassword(password);

    await db.insert(users).values({
      id: userId,
      username,
      displayName: displayName || null,
      hashedPassword,
    });

    // Set auth cookie
    await setAuthCookie(c, userId, username);

    return c.json({
      success: true,
      user: {
        id: userId,
        username,
        displayName: displayName || null,
      },
    });
  } catch (error) {
    console.error("Signup error:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

app.post("/login", zValidator("json", loginSchema), async (c) => {
  const { username, password } = c.req.valid("json");
  const db = drizzle(c.env.DB);

  try {
    // Find user
    const user = await db
      .select()
      .from(users)
      .where(eq(users.username, username))
      .get();

    if (!user) {
      return c.json({ error: "Invalid username or password" }, 400);
    }

    // Verify password
    const validPassword = await verifyPassword(password, user.hashedPassword);
    if (!validPassword) {
      return c.json({ error: "Invalid username or password" }, 400);
    }

    // Set auth cookie
    await setAuthCookie(c, user.id, user.username);

    return c.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        displayName: user.displayName,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

app.post("/logout", async (c) => {
  try {
    clearAuthCookie(c);
    return c.json({ success: true });
  } catch (error) {
    console.error("Logout error:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

app.get("/me", async (c) => {
  try {
    const authUser = await getAuthUser(c);

    if (!authUser) {
      return c.json({ error: "Not authenticated" }, 401);
    }

    return c.json({
      user: {
        id: authUser.userId,
        username: authUser.username,
      },
    });
  } catch (error) {
    console.error("Auth check error:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

export default app;