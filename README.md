# Torch Labs CRM

A full-stack lead management application with role-based access, dashboard metrics, and configurable PDF exports.

## Project overview

This project is a small **customer relationship management (CRM)** system focused on **leads**: capture, assign, track status, attach notes, and report on pipeline health. An **admin** user manages the sales roster and sees all data; **sales** users sign in with credentials linked to their salesperson profile and interact only with leads assigned to them.

The codebase is split into a **Node.js / Express** API with **MongoDB** persistence and a **React** single-page application served by **Vite**.

## Tech stack

| Layer | Technologies |
|--------|----------------|
| **Backend** | Node.js (≥18), Express, Mongoose, bcrypt, jsonwebtoken, dotenv, PDFKit |
| **Frontend** | React 19, React Router 7, Vite 8, Tailwind CSS 4, Axios |
| **Database** | MongoDB (via Mongoose) |

## Features

- **Authentication** — JWT-based login; protected API routes and client-side route guards.
- **Dual roles** — Seeded **admin** account plus **sales** logins backed by `Salesperson` records (`loginEmail` + password hash).
- **Leads** — Create, read, update, delete (admin); sales users have scoped list/detail/update and **no delete**. Embedded **notes** with author and timestamp.
- **Filtering & search** — Status, lead source, assignee (admin), and text search on name, company, and email.
- **Dashboard** — Aggregated counts and deal values; metrics respect sales-user scoping.
- **Sales team (admin)** — List and create salespeople who can log in as sales users.
- **Reports** — Download a **PDF** of leads with optional date range, outcome (won / lost / open pipeline), statuses, source, assignee (admin), and search; exports are capped for performance (see limitations).
- **Health check** — `GET /api/health` for uptime checks.

## Setup instructions

### Prerequisites

- [Node.js](https://nodejs.org/) 18 or newer  
- A running [MongoDB](https://www.mongodb.com/) instance (local or Atlas)

### Backend

```bash
cd backend
npm install
```

Create `backend/.env` (see [Environment variables](#environment-variables)). Then:

```bash
npm run dev    # development with file watch
# or
npm start      # production-style (no watch)
```

The API listens on **port 5000** by default (`http://localhost:5000`).

### Frontend

```bash
cd client
npm install
npm run dev
```

Open the URL Vite prints (typically `http://localhost:5173`). In development, requests to `/api` are **proxied** to `http://localhost:5000` (see `client/vite.config.js`), so you usually do **not** need a frontend `.env` file.

For production builds or when the API is on another origin, set `VITE_API_URL` to the full API base (e.g. `https://api.example.com/api`). See `client/.env.example`.

```bash
npm run build
npm run preview   # optional local preview of the build
```

## Environment variables

### Backend (`backend/.env`)

| Variable | Required | Description |
|----------|----------|-------------|
| `MONGODB_URI` | **Yes** | MongoDB connection string (e.g. `mongodb://127.0.0.1:27017/torch-crm` or Atlas URI). |
| `JWT_SECRET` | **Yes** | Secret used to sign and verify access tokens. Use a long random string in production. |
| `PORT` | No | HTTP port (default **5000**). |
| `NODE_ENV` | No | `development` or `production` (default `development`). |
| `JWT_EXPIRES_IN` | No | JWT lifetime (default **7d**). |

### Frontend (`client/.env` — optional)

| Variable | Description |
|----------|-------------|
| `VITE_API_URL` | Base URL for API calls. If unset in dev, the Vite dev server proxies `/api` to the backend. |

## Test login credentials

**Admin (seeded in code, not stored in MongoDB):**

| Field | Value |
|--------|--------|
| Email | `admin@example.com` |
| Password | `password123` |

**Sales users** are not predefined. An admin must create a **Salesperson** with **Login email** and **Password** (via the Sales team UI). Those credentials are used on the same login page; the API resolves either the hardcoded admin or a matching salesperson record.

> **Security:** Replace the seeded admin and `JWT_SECRET` before any real deployment. Never commit real `.env` files.

## Database setup

1. Start MongoDB or create an **Atlas** cluster and obtain a connection string.
2. Set `MONGODB_URI` in `backend/.env`.
3. Start the backend — Mongoose creates **collections automatically** from the schemas (no separate migration runner in this project).

Main models include **Lead** (with embedded notes) and **Salesperson** (roster + optional login fields). Indexes beyond defaults are not required for basic operation.

## API surface (summary)

All routes below are under the `/api` prefix (e.g. `POST /api/auth/login`).

- `POST /auth/login`, `GET /auth/me`
- `GET /dashboard`
- `GET|POST /leads`, `GET|PUT|DELETE /leads/:id`, `POST /leads/:id/notes`
- `GET|POST /salespeople` (admin only; mounted at `/api/salespeople`)
- `GET /reports/leads.pdf` (authenticated; query filters)
- `GET /health`

## Known limitations

- **Admin account** is hardcoded in configuration, not managed through the database.
- **PDF export** includes at most **1,000** leads per download; very large result sets need narrower filters.
- **Report date filters** use **UTC** day boundaries for `from` / `to` strings.
- **Salesperson API** supports listing and creating records only (no edit/delete endpoints in the current API).
- **No refresh tokens**, automated tests, or email integrations — suitable as a learning or internal demo baseline rather than a turnkey production product without further hardening.

## Reflection

Building this CRM reinforced how much clarity comes from **separating list filters, authorization, and aggregates** on the server so the client stays thin. The most valuable challenges were **JWT claims and query scoping** for sales users (one wrong assumption leaks other people’s leads) and **streaming PDFs** while keeping validation and database work **before** attaching the response stream to avoid broken downloads. Trading a seeded admin for a full user table kept early iteration fast but also made the **limits of bootstrap auth** obvious: production systems need migration paths, password policies, and auditability from day one.

---

*Torch Labs Software — internal / educational CRM demo.*
"# Torch-Labs-CRM" 
