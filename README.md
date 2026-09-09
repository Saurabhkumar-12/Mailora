# Mailora — Schedule. Queue. Send.

Mailora is a production-grade, full-stack B2B email scheduling and outbound automation SaaS platform. It enables users to compose, schedule, queue, rate-limit, track, and deliver single and batch transactional and marketing emails with resilient background processing and real-time observability.

Built for the Software Development Internship Assignment, Mailora features a **React + TypeScript + Tailwind CSS** frontend designed in accordance with modern B2B SaaS standards, backed by a high-throughput **Node.js + Express + Prisma (PostgreSQL) + BullMQ (Redis) + Elasticsearch** backend architecture.

---

## 🚀 Core Features

- **Google OAuth 2.0 Authentication**: Seamless authentication flow yielding secure, signed `HttpOnly` session cookies (no JWTs in `localStorage`).
- **Single & Batch Email Scheduling**: Intuitive compose interface supporting individual email dispatches and client-parsed CSV/TXT lead list uploads with automated email validation and deduplication.
- **BullMQ Queue Management**: Delayed background job queues with 1-to-1 deterministic job IDs (`jobId = email.id`) for strict idempotency and zero duplicate sends.
- **Multi-Scope Atomic Rate Limiting**: Distributed, thread-safe rate limiter backed by Redis Lua scripts operating across **Per-User/Tenant**, **Per-Sender**, and **Global** hourly quotas.
- **Worker Concurrency & Minimum Send Delay**: Global inter-email send delay spacing (`MIN_SEND_DELAY_MS`) combined with configurable worker pool concurrency (`WORKER_CONCURRENCY`).
- **PostgreSQL Source of Truth**: Full state persistence (`PENDING`, `PROCESSING`, `SENT`, `FAILED`) tracking scheduled times, delivery timestamps, and error backtraces.
- **Fault-Tolerant Restart & Reconciliation**: Startup reconciliation engine that recovers missing BullMQ jobs and resets crashed worker states (`PROCESSING` → `PENDING`) without losing future jobs.
- **Elasticsearch Full-Text Search**: Asynchronous, idempotent indexing of sent/scheduled emails with automatic fallback to PostgreSQL `ILIKE` / `contains` queries if Elasticsearch is unreachable.
- **Slack OAuth Integration**: Automated rate-limit alerts pushed to connected Slack channels with Redis `SETNX` hourly deduplication.
- **Bull Board Management Dashboard**: Basic-Auth-protected web UI for queue inspection, delayed job monitoring, and failure retries.
- **Scheduled Email Cancellation**: Cancellation endpoint (`DELETE /api/emails/:id`) removing pending BullMQ jobs and marking PostgreSQL records accordingly.
- **Responsive B2B SaaS UI**: Pixel-aligned Figma implementation built with Tailwind CSS v4, Lucide React icons, loading skeletons, and mobile drawer layouts.

---

## 🏗️ Architecture

```
                       ┌─────────────────────────┐
                       │  React + Vite Frontend  │
                       └────────────┬────────────┘
                                    │ HTTP / Signed Cookie
                                    ▼
                       ┌─────────────────────────┐
                       │   Node.js Express API   │
                       └──────┬───────────┬──────┘
                              │           │
           ┌──────────────────┘           └──────────────────┐
           ▼                                                 ▼
┌────────────────────┐                             ┌───────────────────┐
│ PostgreSQL (Neon)  │                             │  Redis (BullMQ)   │
│  (Source of Truth) │                             │ (Delayed Job Set) │
└────────────────────┘                             └─────────┬─────────┘
                                                             │
                                                             ▼
                                                   ┌───────────────────┐
                                                   │   BullMQ Worker   │
                                                   └─┬───────┬───────┬─┘
                                                     │       │       │
                                                     ▼       ▼       ▼
                                                  Ethereal Elastic Slack
                                                    SMTP  Search  OAuth
```

### Component Roles
1. **React Frontend**: Provides the user workspace for authenticating, composing emails, uploading lead files, inspecting metrics, and managing scheduled queues.
2. **Express API Server**: Handles request validation (Zod), authentication session verification, PostgreSQL CRUD operations, and enqueuing delayed BullMQ jobs.
3. **PostgreSQL Database**: Acts as the immutable source of truth for user accounts, senders, email records, and integration connections.
4. **Redis & BullMQ**: Manages delayed execution timers, job queues, worker locks, and atomic rate-limiting counters.
5. **Email Worker**: Consumes jobs from BullMQ, enforces minimum send delays and multi-scope hourly quotas via Redis Lua, dispatches SMTP emails via Nodemailer, updates DB state, and triggers indexing/Slack alerts.
6. **Ethereal SMTP**: Mock SMTP provider used for end-to-end delivery verification without sending actual spam.
7. **Elasticsearch**: Provides high-performance, full-text search across recipients, subjects, and email body contents.
8. **Slack API**: Receives automated webhooks when sending limits are reached.

---

## 🛠️ Tech Stack

### Frontend
- **Framework**: React 19, Vite 6
- **Language**: TypeScript 5.8
- **Styling**: Tailwind CSS v4, Lucide React Icons
- **Routing**: React Router DOM v7
- **HTTP Client**: Native `fetch` with `credentials: 'include'`

### Backend
- **Runtime**: Node.js (v18+ or v20+)
- **Framework**: Express.js 4.21
- **Language**: TypeScript 5.8 (ESM)
- **Database & ORM**: PostgreSQL, Prisma ORM 6.4
- **Queue System**: BullMQ 6.3, ioredis 6.0
- **Mailer**: Nodemailer 10.0 (Ethereal SMTP)
- **Search Engine**: Elastic @elastic/elasticsearch 9.5
- **Validation & Security**: Zod 3.24, Helmet, Cookie-Parser, Express-Rate-Limit

---

## 📂 Project Structure

```
Mailora/
├── backend/
│   ├── prisma/
│   │   └── schema.prisma         # PostgreSQL schema (User, Email, Sender, Session, SlackConnection)
│   ├── src/
│   │   ├── config/               # Zod env parsing, DB, Redis, Bull Board & Elasticsearch setup
│   │   ├── controllers/          # Request handlers (Auth, Email, Slack)
│   │   ├── middleware/           # Auth guard, Rate limiting, Error handling, Bull Board auth
│   │   ├── queues/               # BullMQ queue instantiation & configuration
│   │   ├── routes/               # Express route definitions (auth, emails, slack, health)
│   │   ├── schemas/              # Zod validation schemas for request bodies/queries
│   │   ├── services/             # Core business logic (Email, Auth, RateLimiter, Search, Slack, Mailer)
│   │   ├── workers/              # BullMQ worker processor & concurrency bootstrap
│   │   ├── app.ts                # Express application factory & middleware setup
│   │   └── server.ts             # Server entry point with startup reconciliation & graceful shutdown
│   ├── package.json
│   └── tsconfig.json
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/           # UI primitives (Badge, Button, Card, Table, Modal) & Layout (Sidebar, Header)
│   │   ├── context/              # AuthContext (session state) & ToastContext (notifications)
│   │   ├── lib/                  # Utilities (Lead CSV parser, date formatters)
│   │   ├── pages/                # Page views (Login, Dashboard, Compose, Scheduled, Sent, Integrations, Settings)
│   │   ├── services/             # Frontend API service layer
│   │   ├── types/                # TypeScript interface definitions
│   │   ├── App.tsx               # App routing setup
│   │   └── main.tsx              # Application entry point
│   ├── package.json
│   └── vite.config.ts
├── .gitignore
└── README.md
```

---

## 📋 Prerequisites

Ensure your system has the following tools installed before starting:
- **Node.js**: `v18.x` or `v20.x` (LTS recommended)
- **npm**: `v9.x` or `v10.x`
- **PostgreSQL Database**: Accessible PostgreSQL instance (e.g. Neon, Supabase, or local PostgreSQL 15+)
- **Redis Server**: Accessible Redis instance (e.g. Upstash or local Redis 6+)

---

## ⚙️ Environment Variables

Create `.env` files in `backend/` and `frontend/` based on their respective `.env.example` templates.

> [!CAUTION]
> **Never commit `.env` files.** Secrets must be supplied via environment configuration.

### Backend (`backend/.env`)

```ini
# Server Configuration
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:5173
FRONTEND_URL=http://localhost:5173

# Database (PostgreSQL / Neon)
DATABASE_URL="postgresql://username:password@ep-xyz.region.aws.neon.tech/mailora?sslmode=require"

# Redis (BullMQ Queue & Rate Limiter)
REDIS_URL="rediss://default:password@xyz.upstash.io:6379"

# Ethereal SMTP Configuration
SMTP_HOST="smtp.ethereal.email"
SMTP_PORT=587
SMTP_USER="your-ethereal-user@ethereal.email"
SMTP_PASS="your-ethereal-password"
SMTP_FROM="Mailora <noreply@mailora.local>"

# Worker Concurrency & Multi-Scope Rate Limiting Controls
WORKER_CONCURRENCY=5
MIN_SEND_DELAY_MS=1000
MAX_EMAILS_PER_HOUR=100
MAX_EMAILS_PER_SENDER_PER_HOUR=50
MAX_GLOBAL_EMAILS_PER_HOUR=1000

# Elasticsearch Configuration (Optional; fallback to DB if omitted)
ELASTICSEARCH_NODE="https://my-elastic-cluster.es.us-east-1.aws.found.io:9243"
ELASTICSEARCH_API_KEY="your-api-key-or-base64"

# Bull Board Dashboard Credentials
BULL_BOARD_USER="admin"
BULL_BOARD_PASS="secure_admin_password"

# Slack OAuth Integration (Optional)
SLACK_CLIENT_ID="your-slack-client-id"
SLACK_CLIENT_SECRET="your-slack-client-secret"
SLACK_REDIRECT_URI="http://localhost:5000/api/slack/oauth/callback"

# Session Security & Google OAuth 2.0
SESSION_SECRET="your_32_character_minimum_random_secret_string"
GOOGLE_CLIENT_ID="your-google-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
GOOGLE_REDIRECT_URI="http://localhost:5000/api/auth/google/callback"
```

### Frontend (`frontend/.env`)

```ini
VITE_API_URL="http://localhost:5000/api"
```

---

## 📦 Database Setup

Navigate to `backend/` and initialize the PostgreSQL database schema using Prisma:

```cmd
cd backend
npx prisma migrate dev --name init
```

To view or manage database contents visually:
```cmd
npx prisma studio
```

---

## 🏃 Running Locally

### Step 1: Start Backend API & Embedded Worker
Open Terminal 1 (Command Prompt / PowerShell):
```cmd
cd backend
npm run dev
```
*The API server will listen on `http://localhost:5000`. The embedded BullMQ worker and startup reconciliation run automatically.*

### Step 2: Start Frontend Application
Open Terminal 2:
```cmd
cd frontend
npm run dev
```
*The React frontend will be available at `http://localhost:5173`.*

---

## 🔌 API Overview

### Authentication Routes (`/api/auth`)
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/auth/google` | Initiates Google OAuth 2.0 authorization redirect |
| `GET` | `/api/auth/google/callback` | OAuth callback endpoint; generates signed `HttpOnly` session cookie |
| `GET` | `/api/auth/me` | Fetches current user session profile |
| `POST` | `/api/auth/logout` | Revokes session in DB and clears session cookie |

### Email Routes (`/api/emails`)
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/emails/schedule` | Schedules a single email with `scheduledAt` timestamp |
| `POST` | `/api/emails/schedule-batch` | Schedules bulk recipient emails with optional delay steps |
| `GET` | `/api/emails/scheduled` | Paginated list of pending/processing emails |
| `GET` | `/api/emails/sent` | Paginated list of successfully delivered emails |
| `GET` | `/api/emails/search` | Full-text search endpoint (Elasticsearch with PostgreSQL fallback) |
| `GET` | `/api/emails/:id` | Retrieves detailed information for a single email record |
| `DELETE` | `/api/emails/:id` | Cancels a pending scheduled email and removes its BullMQ job |

### Slack Integration Routes (`/api/slack`)
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/slack/oauth/start` | Initiates Slack OAuth v2 redirect with CSRF state protection |
| `GET` | `/api/slack/oauth/callback` | Exhanges code for webhook/token and persists connection |
| `GET` | `/api/slack/status` | Returns Slack connection status for the authenticated user |
| `POST` | `/api/slack/disconnect` | Safely disconnects Slack integration |

### Monitoring & Queue Admin Routes
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Health check returning API status, DB connectivity, and Redis queue counts |
| `GET` | `/admin/queues` | Bull Board UI (HTTP Basic Auth protected with `BULL_BOARD_USER` / `BULL_BOARD_PASS`) |

---

## ⏳ Scheduling & Rate-Limiting Architecture

### Single & Batch Scheduling Flow
1. **Persist First**: When an email is submitted, `EmailService.scheduleEmail` creates a record in PostgreSQL with `status: PENDING`.
2. **Deterministic Enqueue**: A BullMQ job is added to `mailora-email-queue` with `jobId = email.id` and `delay = Math.max(0, scheduledAt - now)`.
3. **Queue Idempotency**: If duplicate jobs are added, BullMQ deduplicates based on `jobId`.

### Multi-Scope Atomic Rate Limiting
Prior to processing an email, `emailWorker` invokes `RateLimiterService.acquireHourlyQuota` which executes an **atomic Redis Lua script** evaluating 3 distinct rate windows for the current hour:

1. **User/Tenant Quota**: `mailora:rate:hourly:user:${userId}:${hour}` (Limit: `MAX_EMAILS_PER_HOUR`)
2. **Sender Quota**: `mailora:rate:hourly:sender:${senderId}:${hour}` (Limit: `MAX_EMAILS_PER_SENDER_PER_HOUR`)
3. **Global Capacity Cap**: `mailora:rate:hourly:global:${hour}` (Limit: `MAX_GLOBAL_EMAILS_PER_HOUR`)

```
   ┌─────────────────────────────────────────────────────────────┐
   │                  Atomic Redis Lua Evaluation                │
   │                                                             │
   │  Is User Count < Limit?  AND  Is Sender Count < Limit?      │
   │               AND  Is Global Count < Limit?                 │
   └──────────────────────────────┬──────────────────────────────┘
                                  │
                   ┌──────────────┴──────────────┐
                   │                             │
                YES │                             │ NO
                   ▼                             ▼
   ┌──────────────────────────────┐ ┌──────────────────────────────┐
   │ Increment all 3 Redis keys   │ │ Do NOT increment any keys.   │
   │ Return ALLOWED (Code 0)      │ │ Compute delay to next hour.  │
   └──────────────┬───────────────┘ │ Return BLOCKED (Codes 1/2/3) │
                  │                 └──────────────┬───────────────┘
                  ▼                                │
   ┌──────────────────────────────┐                ▼
   │ Enforce MIN_SEND_DELAY_MS    │ ┌──────────────────────────────┐
   │ Transition state PROCESSING │ │ Update DB scheduledAt=nextHour│
   │ Send via Ethereal SMTP       │ │ Move BullMQ job to delayed   │
   │ Update state SENT            │ │ Dispatch Slack alert         │
   └──────────────────────────────┘ └──────────────────────────────┘
```

---

## 🔄 Restart & Crash Recovery Engine

The application guarantees that no emails are lost or sent twice across server restarts or worker crashes:

1. **PostgreSQL as Source of Truth**: The database stores exact email execution states (`PENDING`, `PROCESSING`, `SENT`, `FAILED`).
2. **Startup Reconciliation (`reconcilePendingEmails`)**:
   - Executes automatically during server/worker startup with 3 retry attempts.
   - Scans PostgreSQL for emails stuck in `PROCESSING` (indicating worker node crash mid-execution) and resets them to `PENDING`.
   - Checks BullMQ Redis status for each `PENDING` record.
   - If a job is missing from Redis (e.g. after Redis flush), it recalculates the remaining delay (`scheduledAt - now`) and re-enqueues the job.
3. **Graceful Shutdown**: Traps `SIGINT`/`SIGTERM`, stops receiving HTTP requests, awaits background reconciliation completion (with an 8-second safety timeout), and gracefully closes BullMQ worker pools.

---

## 🔍 Search Implementation

Full-text searching (`GET /api/emails/search`) operates via a tiered strategy:

1. **Primary (Elasticsearch)**: Queries the Elasticsearch cluster for matches across `recipient`, `subject`, and `body` fields with status filtering and pagination.
2. **Graceful Fallback (PostgreSQL)**: If Elasticsearch is unconfigured or unreachable, `SearchService` seamlessly falls back to a PostgreSQL Prisma `contains` query, returning identical response schema structures without throwing API errors.

---

## 🔒 Security Hardening

- **Session Security**: Authenticated sessions rely on signed, `HttpOnly`, `SameSite: Lax` cookies. Tokens are never exposed in JavaScript or stored in `localStorage`.
- **CORS & Helmet**: CORS strictly limits allowed origins to `CLIENT_URL` with credential support. Helmet injects secure HTTP headers.
- **Input Sanitization**: Every endpoint validates input using Zod schemas.
- **CSRF Protection**: Slack OAuth state parameter is backed by single-use Redis keys expiring in 10 minutes.
- **File Upload Safety**: CSV/TXT uploads are parsed entirely in client-side memory using safe regular expressions without standard file execution vectors.

---

## 🗺️ Assignment Requirement Mapping

| Internship Assignment Requirement | Mailora Implementation | Status |
|---|---|---|
| **Email Scheduling Core** | Delayed BullMQ queue jobs with deterministic `jobId = email.id` | **PASS** |
| **No Cron Schedulers** | Zero `node-cron`, `cron`, or `Agenda` packages used | **PASS** |
| **Worker Concurrency** | Configurable worker pool concurrency (`WORKER_CONCURRENCY=5`) | **PASS** |
| **Minimum Send Delay** | Global per-email send spacing (`MIN_SEND_DELAY_MS=1000`) via Redis Lua | **PASS** |
| **Multi-Scope Rate Limiting** | Atomic Redis Lua checks per user, sender, and global capacity | **PASS** |
| **Rescheduling Exceeded Limits** | Postpones jobs to `nextHour` without dropping or failing | **PASS** |
| **Persistence & Source of Truth** | PostgreSQL stores all email states, timestamps, and error messages | **PASS** |
| **Restart & Recovery** | `reconcilePendingEmails` recovers lost jobs and crashes on startup | **PASS** |
| **Google Authentication** | Google OAuth 2.0 flow producing signed `HttpOnly` cookies | **PASS** |
| **Slack Integration** | OAuth v2 connection + automated rate-limit alert dispatches | **PASS** |
| **Search Functionality** | Elasticsearch full-text search with automatic PostgreSQL fallback | **PASS** |
| **Figma Frontend** | React + Tailwind CSS v4 dashboard matching B2B SaaS specs | **PASS** |

---

## ⚖️ Assumptions & Tradeoffs

1. **Ethereal SMTP**: Ethereal is utilized as a mock SMTP service to demonstrate real network protocol execution and message preview links without spamming real recipient addresses.
2. **Hourly Quota Windowing**: Quotas reset at the top of every clock hour (`Math.floor(Date.now() / 3600000) * 3600000`) rather than rolling 60-minute windows for optimal Redis key performance.
3. **Client-Side CSV Parsing**: File processing is performed directly in browser memory to reduce server memory overhead and avoid file storage attack vectors.

---

## 🧪 Completed Verification Tests

The codebase has undergone full verification:

- **TypeScript Compilation**: Both `backend` and `frontend` compile cleanly with **0 errors and 0 warnings** via `npm run build`.
- **Rate-Limiting Verification**: Verified User, Sender, and Global limits, concurrent race conditions (20 parallel requests), and job rescheduling behavior.
- **End-to-End API Verification**: Verified single email scheduling, batch scheduling, cancellation, scheduled list retrieval, sent list retrieval, and BullMQ health checks against live PostgreSQL & Redis instances.

---

## 📑 5-Minute Evaluator Demo Sequence

1. **Login**: Navigate to `http://localhost:5173/login` and authenticate via Google OAuth (or Demo Login fallback).
2. **Dashboard**: View aggregate statistics (Scheduled, Sent, Active Senders) powered by real PostgreSQL counts.
3. **Compose Single**: Navigate to Compose, enter recipient, subject, body, and future schedule time. Click **Schedule Email**.
4. **Compose Batch**: Switch to Batch tab, upload a lead file or paste text, select delay step, and submit.
5. **Scheduled Emails Table**: Observe scheduled items on `/scheduled`. Test the search input and click **Cancel** on an item to verify queue removal.
6. **Bull Board**: Visit `http://localhost:5000/admin/queues` (Login: `admin` / `secure_admin_password`) to inspect active and delayed BullMQ job states.
7. **Rate Limiting & Rescheduling**: Schedule a batch exceeding your configured `MAX_EMAILS_PER_HOUR`. Observe in logs and Bull Board how remaining jobs shift to delayed state for the next hour.
8. **Restart Recovery**: Terminate the backend process (`Ctrl+C`) while emails are pending. Restart `npm run dev`. Observe the logs running `reconcilePendingEmails` and restoring job states without data loss.

---

## ❓ Troubleshooting

### Redis Connection Error
- **Symptom**: `PrismaClientInitializationError` or `Redis connection failed`.
- **Solution**: Ensure your `REDIS_URL` in `backend/.env` is correct and includes SSL prefix `rediss://` if using cloud providers like Upstash.

### Google OAuth Redirect Mismatch
- **Symptom**: `redirect_uri_mismatch` during Google Login.
- **Solution**: Ensure `GOOGLE_REDIRECT_URI` in `backend/.env` matches the URI registered in your Google Cloud Console (`http://localhost:5000/api/auth/google/callback`).

---

## 📝 Final Notes

All API credentials, secrets, and private keys must be supplied via `.env` files and must never be committed to repository revision control.
