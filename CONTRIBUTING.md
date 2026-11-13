# Contributing to headlamp-plugin-openeverest

Thank you for your interest in contributing! This project brings [OpenEverest V2](https://github.com/openeverest) database management directly into the [Headlamp](https://headlamp.dev) Kubernetes dashboard.

Whether you are fixing a bug, adding a new database provider feature, or improving documentation, your contributions are welcome.

> [!WARNING]
> **Project Status: Active MVP Development**
> Features, APIs, and interfaces are actively evolving, so some things may change under you. Feedback and contributions are very welcome!

## Table of Contents

1. [Prerequisites](#1-prerequisites)
2. [Local Development Setup](#2-local-development-setup)
3. [Project Architecture & Documentation](#3-project-architecture--documentation)
4. [Submitting a Pull Request](#4-submitting-a-pull-request)
5. [Questions & Discussions](#5-questions--discussions)

---

## 1. Prerequisites

Before developing locally, make sure you have:

| Requirement | Version / Details |
| --- | --- |
| **Node.js** | v18 or later |
| **npm** | v9 or later |
| **Kubernetes cluster** | v1.28+, local (`k3s`, `minikube`, `kind`) or cloud-managed |
| **OpenEverest V2** | Installed on the cluster via Helm (`openeverest/openeverest --version "2.0.0-dev.4"`) |
| **Headlamp Desktop** | The official [Headlamp Desktop](https://headlamp.dev/docs/latest/installation/) application |

> [!IMPORTANT]
> Currently, **only Headlamp Desktop is supported**. Support for in-cluster Headlamp is planned for a future release.

---

## 2. Local Development Setup

Follow these steps in order so Headlamp picks up your plugin and live-reloads your changes.

### Step 1: Clone and install dependencies

```bash
git clone https://github.com/MadhavDhatrak/headlamp-plugin-openeverest.git
cd headlamp-plugin-openeverest
npm install
```

### Step 2: Link the plugin to Headlamp Desktop

Headlamp Desktop discovers plugins from its local plugins directory:

| OS | Plugins directory |
| --- | --- |
| **Linux** | `~/.config/Headlamp/plugins/` |
| **macOS** | `~/Library/Application Support/Headlamp/plugins/` |
| **Windows** | `%APPDATA%\Headlamp\Config\plugins\` |

Create a symbolic link from that directory to your repo folder.

> [!NOTE]
> Link the plugin **before** starting the build watcher so changes are reflected immediately.

**Linux / macOS:**

```bash
# Create the plugins directory if it doesn't exist
mkdir -p ~/.config/Headlamp/plugins

# Create the symlink (on macOS, use the macOS path from the table above)
ln -s "$(pwd)" ~/.config/Headlamp/plugins/headlamp-openeverest
```

**Windows (PowerShell as Administrator):**

```powershell
# Create the plugins directory if it doesn't exist
New-Item -ItemType Directory -Force -Path "$env:APPDATA\Headlamp\Config\plugins"

# Create the symlink to this repo directory
New-Item -ItemType SymbolicLink -Path "$env:APPDATA\Headlamp\Config\plugins\headlamp-openeverest" -Target (Get-Location)
```

> [!TIP]
> If you can't create a symlink, build first with `npm run build`, then copy `dist/` and `package.json` into the plugins directory under a `headlamp-openeverest` folder. Notice that `npm run start` will also automatically synchronize changes to `%APPDATA%\Headlamp\Config\plugins\headlamp-openeverest\`.

### Step 3: Start the build watcher

```bash
npm run start
```

This compiles the TypeScript files and watches for changes, updating `dist/main.js` every time you save.

### Step 4: Launch Headlamp and live-reload

1. Launch **Headlamp Desktop**.
2. Look for **OpenEverest** in the sidebar.
3. After `npm run start` finishes recompiling, press **`Ctrl + R`** (Windows/Linux) or **`Cmd + R`** (macOS) inside Headlamp to reload the window and see your changes.

For a one-time production build without watching:

```bash
npm run build
```

---

## 3. Project Architecture & Documentation

Please read the architecture guide before writing code:

- 📖 **[Architecture & Overview Guide](./docs/01-architecture-and-overview.md)**: covers the dual communication model (WebSocket watches vs. REST mutations), Headlamp SDK integration, the tech stack, and the current MVP scope.

---

## 4. Submitting a Pull Request

To help us review and merge your work quickly, please follow this workflow.

1. **Fork and branch.** Create a branch from `main` using a matching prefix:

   ```bash
   git checkout -b feat/your-feature-name   # new features
   git checkout -b fix/your-bugfix-name     # bug fixes
   git checkout -b docs/your-doc-update     # documentation
   ```

2. **Verify the build.** TypeScript must compile with zero errors:

   ```bash
   npm run build
   ```

3. **Commit and push.** We use [Conventional Commits](https://www.conventionalcommits.org/) in the form `type(scope): message`:

   ```bash
   git commit -m "feat(instances): add backup status column"
   git push origin feat/your-feature-name
   ```

   Common types: `feat`, `fix`, `docs`, `refactor`, `chore`.

4. **Open a PR.** Describe what changed and why, and include screenshots for any UI changes.

---


## 5. Questions & Discussions

Have a question or an idea you'd like to talk through before writing code?

- 💬 Join the conversation on [GitHub Discussions](https://github.com/MadhavDhatrak/headlamp-plugin-openeverest/discussions).
- 🐛 Found a bug? Open a [GitHub Issue](https://github.com/MadhavDhatrak/headlamp-plugin-openeverest/issues) with details and reproduction steps.
