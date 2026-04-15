# MiniPanel

Self-hosted analytics platform.

## Getting Started

```bash
npm install && npm run dev
```

This installs all dependencies and starts both the backend (Express on port 3001) and frontend (Vite + React on port 5173) concurrently.

## Project Structure

- `server/` — Express.js + TypeScript backend
- `client/` — React + Vite + TypeScript + TailwindCSS frontend
- `e2e/` — Playwright end-to-end tests

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start both server and client in dev mode |
| `npm run build` | Build both server and client |
| `npm run typecheck` | Type-check both server and client |
| `npm test` | Run server tests |
