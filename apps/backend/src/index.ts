import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import authRoutes from "./routes/auth";
import type { Env } from "./lib/types";

const app = new Hono<{ Bindings: Env }>();

// Middleware
app.use("*", logger());
app.use("*", cors({
  origin: ["http://localhost:3000", "http://localhost:3001", "https://your-frontend-domain.com"],
  credentials: true,
}));

// Routes
app.route("/api/auth", authRoutes);

// Health check
app.get("/", (c) => {
  return c.json({
    message: "One-liner Nippo API is running!",
    timestamp: new Date().toISOString(),
  });
});

export default app;