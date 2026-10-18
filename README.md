# Brand Content Creator

![License: MIT](https://img.shields.io/badge/license-MIT-green)
![Tauri 2](https://img.shields.io/badge/Tauri-2-24C8DB)
![React 19](https://img.shields.io/badge/React-19-61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6)

A Tauri 2 desktop app for marketing teams and solo creators to manage a brand and produce on-brand content in one place. It keeps a brand vault and brand memory, plans campaigns and a content calendar, drafts briefs, social copy and hashtags, and has a canvas design studio. AI generation runs through the locally installed Claude CLI.

## Features

- Brand vault, brand memory and brand chat
- Campaigns, content calendar, activity log and reporting
- Brief generator, social copy and hashtag research tools
- Design studio (Fabric.js canvas) with asset library, platform specs and export
- Optional MCP server (`scripts/brand-brain-mcp.ts`) exposing brand memory via OpenAI embeddings

## Stack

React 19, TypeScript, Vite, Tailwind CSS 4, Radix UI, Zustand, Fabric.js, Milkdown, Rust + Tauri 2, Neon Postgres with Drizzle ORM, UploadThing.

## Getting started

Requires [Bun](https://bun.sh), a Rust toolchain with the Tauri prerequisites, and the Claude CLI on your PATH.

```bash
bun install
cp .env.example .env     # fill in your own values
bun run tauri:dev        # desktop app with hot reload
bun run dev              # frontend only (Vite)
bun run tauri:build      # production build
```

Other scripts: `bun run lint`, `bun run format`, `bun run build` (type-check + Vite build), `bun run db:reseed`.

Configuration lives in `.env` (git-ignored): `DATABASE_URL` (Neon Postgres, used by the db scripts), `OPENAI_API_KEY` (embeddings), `UPLOADTHING_TOKEN`. The client code reads `VITE_`-prefixed variables (`VITE_DATABASE_URL`, `VITE_OPENAI_API_KEY`), so a local desktop build needs those set too; never ship real credentials in a distributed build.

## Structure

```
src/         React frontend (components, stores, lib, types)
src-tauri/   Rust backend and Tauri config
db/          Drizzle schema and seed scripts (demo brands are fictional)
scripts/     MCP brand-brain server and upload helper
```

## License

[MIT](LICENSE)
