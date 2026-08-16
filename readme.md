# SubTrack

A personal subscription tracker web app for monitoring recurring payments. SubTrack helps you keep an eye on what you're paying for, when it renews, and how it fits your budget — across both PHP and USD.

**Note:** SubTrack is a tracking and monitoring tool only. It does not manage, modify, or cancel your subscriptions on your behalf.

## Tech Stack

   **Frontend**
   - React + TypeScript
   - Vite
   - React Router v7
   - Tailwind CSS v4
   - react-hot-toast
   - Font Awesome (`@fortawesome/react-fontawesome`)

   **Backend**
   - Node.js + Express
   - JWT auth (`jsonwebtoken`, `cookie-parser`)
   - `node-cron` for scheduled jobs (billing cycle advancement, notifications)
   - Run via `tsx` (required, since the Prisma client output is TypeScript)

   **Database**
   - PostgreSQL
   - Prisma ORM v7 (`prisma-client` generator, `@prisma/adapter-pg`)

## Features

   - **Dashboard** — at-a-glance overview of your subscriptions
   - **Subscriptions** — add, edit, and browse all tracked subscriptions
   - **Categories** — organize subscriptions by category
   - **Budget** — set and monitor monthly budgets per category
   - **History** — view past billing/payment history
   - **Notifications** — a header bell popup with renewal alerts:
   - 🔵 One week before
   - 🟢 Three days before
   - 🟡 One day before
   - 🔴 Due today

## Multi-currency support

   SubTrack supports PHP and USD as fully separate currencies. Amounts are never summed or converted between them — instead, use the PHP/USD toggle to switch views.



## Prerequisites

   - Node.js (LTS recommended)
   - PostgreSQL instance (local or hosted)
   - npm

## Getting Started

   ### 1. Clone the repository

   ```bash
   git clone <repo-url>
   cd subtrack
   ```

   ### 2. Install dependencies

   ```bash
   # Backend
   cd backend
   npm install

   # Frontend
   cd ../frontend
   npm install
   ```

   ### 3. Configure environment variables

   Create a `.env` file in the backend directory:

   ```env
   DATABASE_URL=postgresql://user:password@localhost:5432/subtrack
   JWT_SECRET=your_jwt_secret
   PORT=5000
   ```

   | Variable | Description |
   |---|---|
   | `DATABASE_URL` | PostgreSQL connection string |
   | `JWT_SECRET` | Secret used to sign JWT auth tokens |
   | `PORT` | Port the Express server listens on |

   ### 4. Set up the database

   ```bash
   npx prisma migrate dev
   npx prisma generate
   ```

   ### 5. Run the app

   ```bash
   # Backend (from /server)
   cd backend
   npm start

   # Frontend (from /client)
   cd frontend
   npm run dev
   ```

   The frontend runs on `http://localhost:5173` by default and expects the backend API to be reachable with CORS credentials enabled.

## Development Timeline

   - **Start: July 25, 2026**

   - **July 26-27:** Server development using Express framework and Prisma ORM. REST API,    JWT, Authentication, Authorization. Postgre database setup.

   - **Aug 05:** Developed login, register, dashboard, subscription, and category pages.

   - **Aug 06:** Developed Budget page. Input length and max number limits. Input automatic values like date now.

   - **Aug 09:** Developed History page. history based on category and days ago.

   - **Aug 10:** Paused.
   - **Aug 15:** Resumed.

   - **Aug 16:** Developed MFA using gmail, password hashing, server input validation, and API rate limiter. Fixed duplications of subscriptions and categories.
   
