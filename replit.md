# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Bluebulb Expense Management System — a full-stack web application for multi-level expense approval workflows.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **Frontend**: React + Vite + Tailwind CSS + shadcn/ui + Recharts
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)
- **Auth**: express-session with bcryptjs, helmet, express-rate-limit

## Structure

```text
artifacts-monorepo/
├── artifacts/              # Deployable applications
│   ├── api-server/         # Express API server
│   └── bluebulb-expense/   # React + Vite frontend
├── lib/                    # Shared libraries
│   ├── api-spec/           # OpenAPI spec + Orval codegen config
│   ├── api-client-react/   # Generated React Query hooks
│   ├── api-zod/            # Generated Zod schemas from OpenAPI
│   └── db/                 # Drizzle ORM schema + DB connection
├── scripts/                # Utility scripts
│   └── src/seed.ts         # Database seed script
└── ...
```

## Application Features

### Roles
- `admin` — full access
- `requester` — raises expense requests
- `approver_manager` — first level approval
- `internal_control` — second level approval
- `finance_manager` — third level approval
- `finance_team` — marks expenses as paid

### Expense Workflow
1. Requester creates expense → status: `pending_manager`
2. Manager approves → status: `pending_internal_control`
3. Internal Control approves → status: `pending_finance_manager`
4. Finance Manager approves → status: `pending_payment`
5. Finance Team marks paid → status: `paid`
6. At any step, a rejection → status: `rejected`

### Pages
- Login — email/password auth
- Dashboard — charts by status, department, month, year
- My Expense Requests — requester's own expenses + raise expense form (with Other Info, Due Date, Dept, Name fields)
- Expense Approval — pending expenses for current approver with View Details modal (full info + timeline before approve/reject)
- My Expense Retirement — retirement requests, "Awaiting Retirement" card with Retire button for paid expenses
- Retire Approval — retirement requests pending approval
- Admin Users (`/admin/users`) — admin-only user management (create, edit, delete with role counters)
- Help — FAQ and instructions

### Phase 2 Improvements (March 2026)
- Fixed missing CheckCircle2/XCircle icon imports
- Added "Other Information" and "Due Date" fields to expense form
- Added pre-filled, read-only Department and Requester Name fields to form
- Added "View" button on Expense Approval page → opens full expense detail modal with timeline
- Added "Retire" button in My Retirements for paid expenses awaiting retirement
- Added balance tracker in retirement form (surplus/deficit display)
- Added Admin User Management page with role counts, create/edit/delete
- Added User Management to sidebar (admin-only)
- Finance Team role added to approver sidebar visibility
- Sidebar branding updated (text-based logo with "Expense Manager" subtitle)

## Test Accounts
Seed users are created by `pnpm --filter @workspace/scripts run seed`. Passwords are set during seeding and stored as bcrypt hashes — never stored in plaintext or committed to the repo. Contact the project admin for login credentials.

## TypeScript & Composite Projects

Every package extends `tsconfig.base.json` which sets `composite: true`. The root `tsconfig.json` lists all packages as project references.

## API Routes

- `POST /api/auth/login` — login
- `GET /api/auth/me` — get current user
- `POST /api/auth/logout` — logout
- `GET/POST /api/users` — user management
- `GET/POST /api/expenses` — expense requests
- `POST /api/expenses/:id/approve` — approve/reject expense
- `POST /api/expenses/:id/pay` — mark as paid
- `GET/POST /api/retirements` — retirement requests
- `POST /api/retirements/:id/approve` — approve/reject retirement
- `GET /api/dashboard/stats` — dashboard statistics

## Seeding
Run: `pnpm --filter @workspace/scripts run seed`
