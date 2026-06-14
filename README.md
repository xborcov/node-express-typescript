# node-express-typescript

This repository is a starter template for building a small-to-medium Node.js API with Express and TypeScript. It is designed for fast local development, with TypeScript support, Jest tests, production build output, and basic security middleware already configured.

## What changed

- Updated `.gitignore` to ignore local-only and sensitive files before pushing to GitHub.
- Added ignore rules for `.vscode`, `.scannerwork`, `coverage`, and other temporary artifacts.
- Kept the project focused on source files in `src/`, build output in `dist/`, and safe environment configuration via `.env`.

## Purpose

Use this project as a clean TypeScript + Express starter for APIs and backend services. It includes:

- Express server bootstrapped in `src/app.ts`
- Middleware for security, CORS, rate limiting, and error handling
- TypeScript compile and production build support
- Jest test setup for TypeScript
- Path aliasing for cleaner imports
- Local dev workflow with `nodemon`

## Features

- TypeScript support
- Jest testing ready
- Error-handling middleware with async route support
- Security middleware: `helmet`, `hpp`, CORS, rate limiting
- Environment variables loaded using `dotenv`
- Build output compiled to `dist/` for production
- Local-only files excluded from version control via `.gitignore`

## Setup

### Environment Variables

1. Copy `.env.example` to `.env`
2. Update `.env` with your local values

### Development

1. Install dependencies: `npm install`
2. Start the dev server: `npm run dev`

### Production

1. Compile TypeScript: `npm run build`
2. Run the compiled app: `npm run start`

### Commands

- Run tests: `npm test-coverage`
- Run SonarQube scan: `sonar-scanner -Dsonar.token=<YOUR_TOKEN>`

### Docker Compose

This repository does not currently include a `docker-compose.yml` file. If you add one, start the stack with:

```bash
docker compose up
```

## Project structure

Source code lives under `src/`:

- `app.ts` — Express app entrypoint
- `config/` — DB and environment configuration
- `controllers/` — route handlers
- `middleware/` — middleware utilities and error handling
- `routes/` — Express routers
- `services/` — service layer logic
- `types/` — shared TypeScript types
- `utils/` — helper classes like `ApiError` and `ApiSuccess`
- `__tests__/` — example Jest tests

## GitHub-safe files

This repository ignores:

- `node_modules/`
- `.env`
- `dist/`
- `coverage/`
- `.vscode/`
- `.scannerwork/`
- OS/editor temp files like `.DS_Store`, `npm-debug.log*`, and `yarn-error.log*`

> These files should remain local and are not safe or useful to commit to GitHub.

