# FinTwin — Project Structure

```
FinTwin/
├── .env                          # Environment variables (Supabase URL & anon key)
├── .gitignore
├── .prettierrc                   # Prettier config
├── AGENTS.md                     # Notes for AI coding agents
├── STRUCTURE.md                  # This file
├── README.md                     # Project overview
├── package.json                  # Node dependencies & scripts
├── tsconfig.json                 # TypeScript config
├── vite.config.ts                # Vite / TanStack Start build config
├── components.json               # shadcn/ui component registry config
├── bunfig.toml                   # Bun runtime config
│
├── public/                       # Static assets served as-is
│   ├── favicon.ico
│   └── robots.txt
│
├── ml/                           # Python ML pipeline (runs offline, not a server)
│   ├── README.md                 # How to reproduce the model
│   ├── requirements.txt          # Python deps (scikit-learn, xgboost, lightgbm, etc.)
│   ├── train.py                  # Training script: loads CFPB data, trains ensemble,
│   │                             #   tunes with Optuna, exports model.json
│   └── artifacts/
│       ├── model.json            # Serialised gradient-boosted model (loaded in-browser)
│       └── benchmarks.json       # Cohort percentile lookup table
│
├── supabase/                     # Supabase project config & migrations
│   ├── config.toml
│   └── migrations/               # SQL migration files (profiles table, RLS policies)
│
└── src/                          # All application source code
    ├── styles.css                # Global CSS — Tailwind v4 theme tokens, dark mode vars
    ├── router.tsx                # TanStack Router instance
    ├── server.ts                 # TanStack Start server entry
    ├── start.ts                  # App entry point
    ├── routeTree.gen.ts          # Auto-generated route tree (do not edit manually)
    │
    ├── hooks/
    │   └── useTheme.ts           # Dark / light mode hook (localStorage + OS preference)
    │
    ├── components/
    │   ├── InfoTip.tsx           # Tooltip / info icon component
    │   └── ui/                   # shadcn/ui primitives (button, dialog, input, etc.)
    │
    ├── lib/                      # Core business logic (no React, pure TS)
    │   ├── finance-types.ts      # TypeScript interfaces: FinanceProfile, Goal, Loan, etc.
    │   ├── finance-store.ts      # useProfile() hook — Supabase persistence + local state
    │   ├── finance-calc.ts       # computeMetrics(), projectFuture(), applyScenario()
    │   ├── finance.functions.ts  # Server functions for Supabase data access
    │   ├── ml-scorer.ts          # Loads model.json, runs in-browser ML scoring,
    │   │                         #   cohortFor(), percentileIn(), predictScore()
    │   ├── threads-store.ts      # AI chat thread persistence (localStorage)
    │   ├── ai-gateway.server.ts  # Server-side AI SDK gateway setup
    │   ├── error-capture.ts      # Error boundary helpers
    │   ├── error-page.ts         # Error page utility
    │   ├── lovable-error-reporting.ts
    │   └── utils.ts              # cn() class utility
    │
    ├── integrations/
    │   └── supabase/
    │       ├── client.ts         # Supabase browser client
    │       ├── server.ts         # Supabase server client
    │       └── types.ts          # Auto-generated DB types
    │
    └── routes/                   # File-based routing (TanStack Router)
        ├── __root.tsx            # HTML shell, QueryClientProvider, FOUC-fix script
        ├── index.tsx             # "/" — Landing page (hero, features, ML strip, CTA)
        ├── auth.tsx              # "/auth" — Sign in / Sign up (Supabase email+password)
        ├── sitemap[.]xml.ts      # "/sitemap.xml" — SEO sitemap
        │
        ├── api/
        │   └── chat.ts           # "/api/chat" — Streaming AI assistant endpoint
        │                         #   (injects user profile + metrics into system prompt)
        │
        └── _authenticated/       # Protected layout — redirects to /auth if not logged in
            ├── route.tsx         # Auth guard
            ├── app.tsx           # "/app" shell — sidebar nav + top header with theme toggle
            │
            ├── app.index.tsx     # "/app" — Main dashboard
            │                     #   • Financial Health Score card (ML, SHAP drivers)
            │                     #   • Metric cards: net worth, savings rate, DTI, emergency fund
            │                     #   • Cohort percentile bars (CFPB benchmark)
            │                     #   • Monthly cash-flow breakdown
            │                     #   • Expense mix pie chart
            │                     #   • Asset composition pie chart
            │                     #   • 20-year net worth & investment area chart
            │                     #   • Goals summary
            │
            ├── app.simulator.tsx # "/app/simulator" — What-If Simulator
            │                     #   • Free-form scenario builder (income, expenses,
            │                     #     new loan, inflation, one-time expense, etc.)
            │                     #   • Instant metric deltas vs baseline
            │                     #   • Baseline vs scenario 20-year line chart
            │
            ├── app.assistant.tsx         # "/app/assistant" — AI assistant layout + thread list
            ├── app.assistant.$threadId.tsx  # "/app/assistant/:id" — Chat thread
            │                               #   (streaming, markdown, profile-aware)
            │
            ├── app.goals.tsx     # "/app/goals" — Goal CRUD
            │                     #   • Progress bar, monthly savings needed per goal
            │
            ├── app.profile.tsx   # "/app/profile" — Edit all financial profile data
            │
            ├── app.onboarding.tsx # "/app/onboarding" — 6-step first-run wizard
            │                      #   Steps: You → Income → Expenses →
            │                      #          Savings & Investments → Loans → Goals
            │
            ├── app.report.tsx    # "/app/report" — Financial snapshot report
            │                     #   • All metrics, score breakdown, goals, 10-yr table
            │                     #   • Download as .txt  |  Print / Save as PDF
            │
            └── app.glossary.tsx  # "/app/glossary" — Finance term definitions
```

---

## Key Technology Decisions

| Concern | Choice | Why |
|---|---|---|
| Framework | TanStack Start (React + Vite) | SSR-capable, file-based routing, type-safe |
| Styling | Tailwind CSS v4 | Custom tokens, dark mode via `.dark` class |
| Auth & DB | Supabase (PostgreSQL) | Managed auth, real-time, RLS |
| Charts | Recharts | Composable, works with Tailwind |
| AI chat | Vercel AI SDK (`useChat`) | Streaming, multi-turn, transport-agnostic |
| ML scoring | Client-side JSON model | Zero latency, no data leaves device |
| ML training | Python (XGBoost, LightGBM, Optuna) | Reproducible pipeline in `ml/train.py` |
| State | Supabase + localStorage | Profile synced to cloud; threads local-only |
| Theme | CSS custom properties + `useTheme` hook | FOUC-free, persisted to `localStorage` |
