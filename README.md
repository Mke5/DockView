# Dock

A local-first Docker control surface — no Docker Desktop required.

---

## Overview

Dock is a desktop GUI for managing Docker containers, images, volumes, networks, and Compose stacks. It connects directly to the Docker daemon socket and provides a clear, keyboard-friendly interface built with Tauri and React.

### Features

- **Container lifecycle** — start, stop, restart, pause, kill, remove, rename, inspect, and run ad-hoc containers with port/volume/env config
- **Image management** — pull, tag, push, prune, build from Dockerfile, and inspect layers
- **Volumes & Networks** — create, remove, prune, connect/disconnect containers
- **Compose** — up/down stacks from `docker-compose.yml`
- **Registry login** — store credentials in the OS keychain, log in/out of private registries
- **Exec terminal** — spawn interactive shell sessions inside running containers (xterm.js with full color, font-size control, and session history replay)
- **Live stats** — per-container CPU/memory streaming with 2-second batch emission and historical charts
- **Real-time events** — stream Docker daemon events and auto-refresh affected views
- **System tray** — minimize to tray, show/hide, quit with `Ctrl+Q`
- **Keyboard shortcuts** — `Ctrl+K` to focus search, `Ctrl+/` to cycle the active view
- **Multi-context** — reads `~/.docker/config.json` to surface the current Docker context and available endpoints

---

## Screenshots

<!--
  To add screenshots:
  1. Create a screenshots/ directory at the repo root
  2. Save your images as screenshots/containers.png, screenshots/terminal.png, etc.
  3. Reference them like: ![Containers View](screenshots/containers.png)

  GitHub will display them inline as long as the images are committed to the repo.
-->
| Containers View | Terminal Session | Stats Charts |
|---|---|---|
| ![Containers View](screenshots/containers.png) | ![Terminal Session](screenshots/terminal.png) | ![Stats Charts](screenshots/stats.png) |

---

## How It Works

The backend is a Tauri v2 Rust application that communicates with the Docker daemon over its Unix socket (or Windows named pipe) via the [Bollard](https://github.com/fussybeaver/bollard) library. Streaming endpoints (container logs, image pulls, stats, exec output) use Tauri events to push data to the frontend in real time.

The frontend is a React SPA built with Vite. State is managed with Zustand. Views are wrapped in error boundaries and respond to Docker events for live updates. The terminal uses xterm.js with a fit addon and persists session history to `localStorage`.

Credentials for private registries are stored in the OS keychain (via the `keyring` crate) — never in plaintext config files.

---

## Building From Source

### Prerequisites

- [Node.js](https://nodejs.org/) >= 18
- [Rust](https://rustup.rs/) >= 1.75
- [Tauri v2 system dependencies](https://v2.tauri.app/start/prerequisites/)

### Setup

```bash
# Install frontend dependencies
npm install

# Run in development mode (hot-reload frontend + Tauri window)
npm run tauri dev
```

### Build for production

```bash
npm run tauri build
```

The bundled installers will be written to `src-tauri/target/release/bundle/`.

### Platform-specific notes

- **Linux**: Requires `webkit2gtk-4.1`, `libappindicator3`, and related libraries. See the [Tauri prerequisites](https://v2.tauri.app/start/prerequisites/) guide for your distribution.
- **macOS**: Xcode Command Line Tools are required for the native build.
- **Windows**: Microsoft Visual C++ build tools and WebView2 are required. Both are included with recent Windows 11 installations.

---

## Project Structure

```
dock/
├── src/                    # React frontend
│   ├── backend/            # Tauri IPC bridge, helpers
│   ├── components/         # Views, shared UI, layout
│   ├── hooks/              # Custom React hooks
│   ├── store/              # Zustand state stores
│   └── styles/             # CSS
├── src-tauri/              # Rust backend
│   ├── src/
│   │   ├── api/            # Tauri command handlers
│   │   ├── docker/         # Docker client, models, operations
│   │   ├── services/       # Background tasks (stats, events)
│   │   └── state/          # App state
│   └── Cargo.toml
└── package.json
```

---

## License

Apache 2.0
