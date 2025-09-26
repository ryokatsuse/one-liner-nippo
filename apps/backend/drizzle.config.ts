import type { Config } from "drizzle-kit";

export default {
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  driver: "better-sqlite",
  dbCredentials: {
    url: "./.wrangler/state/v3/d1/miniflare-D1DatabaseObject/5c4eef04df6e7ce2e6c69df408849f272e75c75b98b8e5022f3a1d415831fa2c.sqlite",
  },
} satisfies Config;