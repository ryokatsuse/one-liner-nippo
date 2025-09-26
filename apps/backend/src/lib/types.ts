export interface DatabaseUser {
  id: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
}

export interface Env {
  DB: D1Database;
  JWT_SECRET: string;
}