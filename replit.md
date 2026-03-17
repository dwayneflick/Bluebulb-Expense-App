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
- **Auth**: express-session with bcryptjs

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
- My Expense Requests — requester's own expenses + raise expense form
- Expense Approval — pending expenses for current approver
- My Expense Retirement — retirement requests submitted by user
- Retire Approval — retirement requests pending approval
- Help — FAQ and instructions

## Test Credentials
| Role | Email | Password |
|------|-------|----------|
| Admin | admin@bluebulb.com | admin123 |
| Requester | jane@bluebulb.com | user123 |
| Requester | john@bluebulb.com | user123 |
| Approver Manager | sarah@bluebulb.com | manager123 |
| Internal Control | mike@bluebulb.com | control123 |
| Finance Manager | linda@bluebulb.com | finance123 |
| Finance Team | bob@bluebulb.com | finance123 |

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
