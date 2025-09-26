# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

One-liner Nippo is a daily report system where users can post only one line per day. The system includes:
- User authentication with secure session management
- Daily report posting (one per user per day)
- Public sharing of individual report pages
- Reaction system with custom emojis
- User avatar support

## Architecture

**Monorepo Structure:**
- `apps/backend/` - Hono API on Cloudflare Workers
- `packages/` - Shared packages (future)
- Uses pnpm workspaces for package management

**Backend Stack:**
- **Runtime**: Cloudflare Workers with Hono framework
- **Database**: Cloudflare D1 (SQLite) with Drizzle ORM
- **Auth**: Lucia Auth with secure session cookies
- **Validation**: Zod for request validation
- **Password**: SHA-256 hashing (via Web Crypto API)

## Development Commands

```bash
# Install dependencies
pnpm install

# Backend development
cd apps/backend
pnpm dev                 # Start development server
pnpm build              # Build for production
pnpm type-check         # TypeScript type checking
pnpm lint               # ESLint

# Database operations
pnpm db:generate        # Generate migrations
pnpm db:push           # Push schema to D1
pnpm db:studio         # Open Drizzle Studio
```

## Database Schema

Key tables:
- `users` - User accounts with hashed passwords
- `sessions` - Lucia auth sessions
- `reports` - Daily reports (unique per user per day)
- `custom_emojis` - User-uploaded emoji (10 per user limit)
- `reactions` - Emoji reactions on reports

## Authentication

Uses Lucia Auth with secure session cookies:
- Password hashing via Web Crypto API SHA-256
- HTTP-only, secure, SameSite=strict cookies
- Session validation middleware for protected routes

## API Endpoints

**Auth Routes** (`/api/auth/`):
- `POST /signup` - User registration
- `POST /login` - User login
- `POST /logout` - Session invalidation
- `GET /me` - Current user info

## Security Notes

- Passwords are hashed with SHA-256
- Sessions use secure HTTP-only cookies
- CORS configured for frontend domain
- Input validation with Zod schemas
- SQL injection protection via Drizzle ORM