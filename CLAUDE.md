# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Development Commands

```bash
# Development (starts Vite + Tauri with hot reload)
bun run tauri:dev

# Build production app
bun run tauri:build

# Frontend only (Vite dev server on localhost:3000)
bun run dev

# Lint and format
bun run lint
bun run lint:fix
bun run format
bun run format:check

# Type check
tsc -b
```

## Architecture Overview

Brand Content Creator is a **Tauri 2 desktop application**. It uses Claude CLI as an AI backend.

### Tech Stack
- **Frontend**: React 19 + TypeScript + Vite + Tailwind CSS 4
- **Backend**: Rust + Tauri 2
- **State**: Zustand with Immer middleware
- **UI**: Radix UI primitives + Tabler Icons + Sonner toasts

### Directory Structure

```
src/                          # React frontend
├── App.tsx                   # Root component with routing
├── main.tsx                  # Entry point
├── globals.css               # Tailwind + theme variables
└── lib/
    └── utils.ts              # cn() class merge helper

src-tauri/src/                # Rust backend
├── main.rs                   # Tauri entry point
└── lib.rs                    # App setup + commands
```

### Key Patterns

- **Path alias**: `@/` maps to `./src/`
- **Styling**: Tailwind CSS 4 with CSS variables for theming
- **Components**: Use shadcn/ui (radix-lyra style) via `components.json`
- **External links**: Opened in system browser via `@tauri-apps/plugin-shell`
