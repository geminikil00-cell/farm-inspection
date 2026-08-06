# Farm Inspection Tool

A React + Vite application for digital farm facility inspections with offline draft saving, multi-language support, analytics dashboards, and a configurable template builder.

## Features

- **Inspection Forms**: 13 built-in facility templates (greenhouses, warehouses, irrigation, lakes, packing, etc.)
- **Custom Template Builder**: Drag-and-drop table editor with configurable columns, dropdown options, and score mappings
- **Offline Autosave**: Inspection drafts saved automatically in client IndexedDB
- **Supabase Integration**: Live record synchronization and realtime updates
- **Multi-language**: UI in 11 languages (Arabic primary, English, Chinese, Spanish, Hindi, Urdu, French, Portuguese, Russian, German, Japanese)
- **RTL/LTR**: Full bidirectional layout support with Arabic-first design
- **Analytics Dashboard**: Interactive charts for score trends, status distributions, and facility performance
- **History & Comparisons**: Browse past inspections, compare facilities or time periods
- **Print Support**: Clean print stylesheets for landscape table printing (PDF via browser print dialog)
- **Site Management**: Manage inspection locations in local storage

## Prerequisites

- Node.js 18+
- Supabase account (free tier works)

## Setup

```bash
npm install
```

## Environment Variables

Create a `.env` file in the project root:

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

Copy `.env.example` as a template. These variables are **required** — the app will not start without them.

## Database Setup

Run the SQL migration script in your Supabase SQL Editor:

1. Open [Supabase Dashboard](https://supabase.com/dashboard) → your project → SQL Editor
2. Copy the contents of `supabase_migration.sql`
3. Run the statements

This creates:
- `inspection_tool_records` — stores inspection data
- `inspection_templates` — stores custom form templates
- Storage bucket policies for photo uploads

## Development

```bash
npm run dev        # Start dev server on http://localhost:3000
npm run build      # Production build
npm run preview    # Preview production build
npm run lint       # ESLint check
npm run format     # Prettier format
npm run test       # Run unit tests
npm run test:watch # Run tests in watch mode
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, Tailwind CSS |
| Icons | Lucide React |
| Charts | Recharts |
| Database | Supabase (PostgreSQL + Realtime) |
| Storage | Supabase Storage (photos), IndexedDB (drafts) |
| Deployment | Cloudflare Workers (via Wrangler) |

## Languages

Full UI translation (all keys): Arabic, English, Urdu
Partial UI translation (most keys): Chinese, Spanish, Hindi, French, Portuguese, Russian, German, Japanese

Inspection criteria items are available in Arabic and English. Other languages show English criteria text.

## Security Model

This application uses Supabase's anonymous access model (no login required):
- Inspection records: **read + create only** (data cannot be deleted via the public API)
- Templates: full CRUD (form structures are non-sensitive)
- Photos: read + upload + delete
