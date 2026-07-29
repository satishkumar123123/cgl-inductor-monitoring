# CGL Dashboard — Frontend

React + Vite + Tailwind CSS frontend for the CGL Inductor Daily Monitoring
System.

## Setup

```bash
cd frontend
npm install
cp .env.example .env
```

Edit `.env` if your backend isn't on the default port:

```
VITE_API_URL=http://localhost:5000
```

Run the dev server:

```bash
npm run dev
```

Open http://localhost:5173 — log in with one of the demo accounts created by
`npm run seed` in the backend (admin/admin123, engineer/engineer123,
operator/operator123).

## Build for production

```bash
npm run build      # outputs to dist/
npm run preview    # preview the production build locally
```

## Structure

```
frontend/
├── main.jsx / App.jsx      entry point + router
├── components/             reusable UI pieces (table, cards, charts, upload, dialogs)
├── pages/                  LoginPage, DashboardPage, HistoryPage, NotFoundPage
├── layouts/                MainLayout (navbar + content), AuthLayout (login)
├── context/                AuthContext, ToastContext
├── hooks/                  useAuth, useToast
├── services/                axios client + auth/data API calls
├── utils/                   shared row/pot config, Excel mapping, conditional formatting
└── src/index.css            Tailwind entry + small component classes
```

## Navigation

- Top navbar: Dashboard, History, user menu, logout.
- Left sidebar (all pages): **Analytics Dashboard** (standalone link). **Reports** — PM POT Analysis Report, MAIN POT Analysis Report, Report History. **Production** — Daily Production & Power Consumption (full CRUD), Monthly Analysis, Yearly Analysis. **Audit Logs** (Admin only, shown conditionally).

## Features implemented

- JWT login (Admin / Engineer / Operator roles)
- Editable Main Pot (A–D) / PM Pot (A–B) tables, High & Intermediate levels, 17 parameters
- Excel upload with automatic sheet detection + fuzzy row/column mapping (client-side via SheetJS)
- Manual editing of imported values
- Save / Update / Delete (Delete is Admin-only)
- Search by date + History page with date range and text search
- Download Sample Excel template, Export Excel, Export PDF (print), Print
- 11 Recharts visualizations + 8 summary cards
- Conditional formatting (Current/PF/Voltage thresholds)
- Polished dark industrial theme, responsive layout (mobile drawer sidebar via hamburger menu below the `md` breakpoint), toast notifications, confirm dialogs
- Route-level code splitting (`React.lazy`/`Suspense`) so each page's JS (and heavy libs like `xlsx`/`jspdf`) only loads when visited
- Global error boundary (`components/ErrorBoundary.jsx`) — a render crash shows a recovery screen instead of a blank app
- Loading skeletons (`components/Skeleton.jsx`) on History, Report History, Audit Logs, Analytics, and both analysis reports
- Report History: paginated, **Preview** (modal, no navigation), **Download Again** (re-generates and re-triggers the original format)
- Audit Logs page (Admin only) — filterable by user/method/date
