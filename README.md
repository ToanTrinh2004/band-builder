# Band Builder

**Band Builder** is a backend platform for IELTS learning and practice — not a music platform. The name refers to *IELTS band score*, the 0–9 scale used to grade IELTS test takers. The app helps users build up their band score through full-length practice tests, AI-powered writing evaluation, AI speaking practice, and structured vocabulary/grammar materials.

## What it does

- **Four-skill practice tests** — Listening, Reading, Writing, Speaking content modeled on real IELTS test structure (e.g. Cambridge practice test format), grouped into full practice tests users can attempt end-to-end.
- **AI Writing evaluation** — Task 1 and Task 2 essays are scored against the official IELTS band descriptors (Task Achievement/Response, Coherence & Cohesion, Lexical Resource, Grammatical Range) using the Anthropic Claude API, with rationale, examples, and improvement suggestions per criterion.
- **AI Speaking sessions** — simulated speaking test sessions with an AI examiner voice, scored on fluency, lexical resource, grammar, and pronunciation, with per-utterance corrections.
- **Listening/Reading AI explanations** — on-demand AI-generated explanations for why an answer is correct, credit-gated.
- **Speaking sample bank** — benchmark answers at bands 5–9 for common speaking questions, unlocked via credits.
- **Credit system** — in-app credits purchased via VietQR/SePay (Vietnamese bank transfer QR payment), spent on AI features like sample answers and explanations.
- **Study materials** — topic-based vocabulary lists, band-specific vocabulary (Listening/Reading and Speaking/Writing), grammar reference sections, common mistake corrections, and pronunciation practice with word/sentence-level audio timing.
- **Dictionary & translation caching** — cached word lookups and sentence translations to avoid repeated external API calls.

## Tech stack

- **Framework**: NestJS (TypeScript)
- **Database**: PostgreSQL via Prisma ORM
- **Cache/session**: Redis
- **AI**: Anthropic Claude API (writing evaluation, speaking sessions, explanations)
- **Auth**: Google OAuth2, JWT with refresh token rotation
- **Payments**: SePay / VietQR (Vietnamese QR bank transfer)
- **Infra**: Docker, Docker Compose, deployed on AWS EC2
- **CI/CD**: GitHub Actions

## Project setup

```bash
npm install
```

Copy `.env.example` to `.env` and fill in the required values (database URL, JWT secret, Google OAuth credentials, Anthropic API key, SePay/VietQR credentials, Cloudinary credentials).

## Running locally

```bash
# development
npm run start

# watch mode
npm run start:dev

# production build
npm run build
npm run start:prod
```

## Running with Docker

```bash
docker compose up -d --build
```

This starts the Postgres database and the NestJS app. Prisma migrations run automatically on container start (`prisma migrate deploy`).

## Database

Schema is managed with Prisma. To apply migrations manually:

```bash
npx prisma migrate dev      # development
npx prisma migrate deploy   # production
```

## Tests

```bash
npm run test        # unit tests
npm run test:e2e    # e2e tests
npm run test:cov    # coverage
```

## License

Private project. All rights reserved.
