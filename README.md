# FactCheckX

AI-powered fact verification and GEO (Generative Engine Optimization) intelligence platform.

**Verify information before the internet believes it.**

![Next.js 15](https://img.shields.io/badge/Next.js-15-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue)
![Prisma](https://img.shields.io/badge/Prisma-Neon-green)

## Features

### Fact-Check Agent
- PDF upload with validation (10MB max)
- Text extraction via `pdf-parse`
- AI claim extraction (OpenAI GPT-4o-mini / Gemini)
- Live web verification (Tavily, Brave Search, Exa)
- Evidence ranking and confidence scoring
- Bloomberg-style research reports

### GEO Analytics
- Brand visibility across ChatGPT, Gemini, Claude, Perplexity
- Competitor comparison
- AI discoverability score
- 3-month strategy & 1-year monetization roadmap

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 15, TypeScript, Tailwind CSS, Framer Motion, Shadcn-style UI |
| Backend | Next.js API Routes |
| Database | Neon PostgreSQL + Prisma ORM |
| AI | OpenAI, Gemini |
| Search | Tavily, Brave Search, Exa |
| Cache/Rate Limit | Upstash Redis (optional) |
| Deploy | Vercel |

## Quick Start

### 1. Install dependencies

```bash
npm install
```

### 2. Environment variables

Copy `.env.example` to `.env` and fill in your keys:

```env
DATABASE_URL="postgresql://..."
OPENAI_API_KEY="sk-..."
GEMINI_API_KEY="AIza..."
TAVILY_API_KEY="tvly-..."
BRAVE_SEARCH_API_KEY=""   # optional
EXA_API_KEY=""            # optional
UPSTASH_REDIS_REST_URL="" # optional
UPSTASH_REDIS_REST_TOKEN=""
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

> **Note:** `TAVILEY_API_KEY` (typo variant) is also supported.

### 3. Push database schema

```bash
npm run db:push
```

### 4. Run development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## API Routes

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/upload` | Upload PDF document |
| POST | `/api/extract-claims` | Extract claims from document |
| POST | `/api/verify` | Run full verification pipeline |
| POST | `/api/report` | Generate/fetch fact-check report |
| GET | `/api/reports` | List reports, documents, GEO projects |
| POST | `/api/geo/analyze` | Run GEO brand analysis |

## Project Structure

```
src/
├── app/
│   ├── api/          # API routes
│   ├── dashboard/    # Dashboard pages
│   ├── fact-check/   # PDF upload & analysis
│   ├── geo/          # GEO analytics
│   └── report/       # Report viewer
├── components/
│   ├── landing/      # Marketing sections
│   ├── fact-check/   # Upload & progress
│   ├── report/       # Claim cards
│   └── ui/           # Shadcn-style primitives
└── lib/
    ├── ai/           # OpenAI + Gemini
    ├── pipeline.ts   # Fact-check orchestration
    └── search.ts     # Tavily, Brave, Exa
prisma/
└── schema.prisma     # Database models
```

## Database Models

- `users` — User accounts
- `documents` — Uploaded PDFs
- `claims` — Extracted factual claims
- `verification_results` — Verification status & reasoning
- `evidence_sources` — Web sources per claim
- `geo_projects` — GEO analysis projects
- `ai_reports` — Generated reports (JSON content)

## Deployment (Vercel + Neon)

1. Push to GitHub
2. Import project in [Vercel](https://vercel.com)
3. Add environment variables from `.env.example`
4. Connect Neon PostgreSQL `DATABASE_URL`
5. (Optional) Add Upstash Redis for distributed rate limiting
6. Deploy — `prisma generate` runs on build via `postinstall`

```bash
# Manual production build
npm run build
npm start
```

## Security

- Zod validation on all API inputs
- PDF-only uploads with size limits
- Per-IP rate limiting (memory or Upstash Redis)
- Secure file path sanitization

## Keyboard Shortcuts

- `⌘K` — Quick search (dashboard header placeholder)

## License

MIT
