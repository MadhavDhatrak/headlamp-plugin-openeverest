# Headlamp Plugin for OpenEverest V2

> [!WARNING]
> **Project Status: Active MVP Development**
> This plugin is currently in active MVP (Minimum Viable Product) development for OpenEverest V2. Features, APIs, and interfaces are actively evolving. Feedback and contributions are very welcome!

## Table of Contents

- [Overview](#overview)
- [MVP Feature Status](#mvp-feature-status)
- [Documentation](#documentation)
- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Project Structure](#project-structure)
- [Contributing](#contributing)

---

## Overview

The **OpenEverest Headlamp Plugin** brings [OpenEverest V2](https://github.com/openeverest) directly into the [Headlamp](https://headlamp.dev) Kubernetes UI.

Database administrators and developers can browse database engine operators, provision multi-node production databases, trigger instant snapshots, and manage recurring backup schedules across clusters, all natively within Headlamp and without leaving their Kubernetes console.

| Capability | What it does |
| :--- | :--- |
| **Extensions (Providers)** | Discover and install database operators (PostgreSQL, MySQL, ClickHouse, etc.) via Helm. |
| **Databases** | Deploy and monitor database instances with dynamic configuration wizards. |
| **Backups** | Manage on-demand snapshots, recurring backup schedules, and cloud storage targets. |

> [!IMPORTANT]
> **No backend service is required.** The plugin runs entirely inside Headlamp and talks to the cluster through Headlamp's built-in Kubernetes proxy.
> Currently, **only Headlamp Desktop is supported**. In-cluster Headlamp support is planned for later.

---

## MVP Feature Status

| Feature | Status | Description |
| :--- | :---: | :--- |
| **Provider Catalog** | ✅ Implemented | Live feed from the OpenEverest Hub index; detects installed providers. |
| **Database Listing** | ✅ Implemented | Lists all active database instances across namespaces. |
| **Database Creation Wizard** | ✅ Implemented | Multi-step provisioning with dynamic `uiSchema` validation and resource sizing. |
| **Backups in Creation Wizard** | ✅ Implemented | Configure automated backup frequency and storage targets during initial database creation. |
| **On-Demand Snapshots** | ✅ Implemented | Trigger point-in-time snapshot backups on existing running databases via `Backup` CRs. |
| **Recurring Schedules** | ✅ Implemented | View, add, edit, and delete cron-based backup schedules for existing databases. |
| **Storage Destinations** | ✅ Implemented | Register and manage S3/MinIO backup storage targets via `BackupStorage` CRs. |
| **Dynamic Engine Filtering** | ✅ Implemented | Checks `BackupClass` compatibility so engines without backup support don't show backup options. |

---

## Documentation

Architecture guides and domain documentation live in the [`docs/`](docs/) directory:

| Guide | Description |
| :--- | :--- |
| [**01 Architecture & Overview**](docs/01-architecture-and-overview.md) | High-level architecture, the dual communication model (live watches vs. mutations), and the tech stack. |
| [**02 Extensions & Providers**](docs/02-extensions-and-providers.md) | OpenEverest Hub catalog integration, cluster `Provider` CRD syncing, and Helm installation. |
| [**03 Databases & Dynamic UI**](docs/03-databases-and-dynamic-ui.md) | `Instance` lifecycle, the real-time list, and the dynamic `uiSchema` form engine with modular widgets. |
| [**04 Backups & Schedules**](docs/04-backups-and-schedules.md) | `BackupClass` compatibility, on-demand snapshots, and atomic RFC 7386 JSON Merge Patching for schedules. |

---

## Prerequisites

| Requirement | Details |
| :--- | :--- |
| **Kubernetes cluster** | v1.28+, local (k3s, minikube, kind) or cloud-managed (EKS, GKE, AKS). |
| **OpenEverest V2** | Installed on the cluster (see the Helm commands below). |
| **Headlamp Desktop** | The [Headlamp Desktop app](https://headlamp.dev/docs/latest/installation/). |
| **Node.js and npm** | Node.js v18+ and `npm`. |

Install OpenEverest V2 with Helm:

```bash
helm repo add openeverest https://openeverest.github.io/helm-charts/
helm repo update
helm install everest-core openeverest/openeverest \
  --devel --version "2.0.0-dev.4" \
  --namespace everest-system --create-namespace
```

---

## Quick Start

### 1. Clone & install dependencies

```bash
git clone https://github.com/MadhavDhatrak/headlamp-plugin-openeverest.git
cd headlamp-plugin-openeverest/headlamp-openeverest
npm install
```

### 2. Link the plugin into Headlamp

Create a symbolic link from the Headlamp plugins directory to this folder (or copy the folder there).

| OS | Plugins directory |
| :--- | :--- |
| **Linux** | `~/.config/Headlamp/plugins/` |
| **macOS** | `~/Library/Application Support/Headlamp/plugins/` |
| **Windows** | `%APPDATA%\Headlamp\plugins\` |

**Linux / macOS:**

```bash
# Use the macOS path from the table above on macOS
mkdir -p ~/.config/Headlamp/plugins
ln -s "$(pwd)" ~/.config/Headlamp/plugins/headlamp-openeverest
```

**Windows (PowerShell as Administrator):**

```powershell
New-Item -ItemType SymbolicLink -Path "$env:APPDATA\Headlamp\plugins\headlamp-openeverest" -Target (Get-Location)
```

### 3. Build & run

```bash
# Development mode with hot rebuild
npm run start

# Production build
npm run build
```

Then launch Headlamp Desktop. **OpenEverest** will appear in the sidebar.

> [!TIP]
> While `npm run start` is running, press **`Ctrl + R`** (Windows/Linux) or **`Cmd + R`** (macOS) inside Headlamp to reload and see your latest changes.

---

## Project Structure

```text
headlamp-openeverest/
├── src/
│   ├── index.tsx         # Entry point (registers routes and sidebar menus)
│   ├── pages/            # Views: ProvidersPage, DatabaseListPage, CreateDatabasePage, BackupsPage
│   ├── components/       # Reusable UI widgets, modals, dialogs, and status chips
│   ├── schema/           # Dynamic form generator (reads uiSchema from Provider CRs)
│   ├── hooks/            # React hooks watching cluster resources (useInstances, useExtensionsCatalog)
│   ├── api/              # External catalog fetcher (OpenEverest Hub index.json)
│   ├── utils/            # Payload builders & RFC 7386 JSON Merge Patch helpers
│   └── crd/              # TypeScript model definitions for Kubernetes CRDs
├── docs/                 # Detailed architecture & domain documentation
├── dist/                 # Compiled bundle loaded by Headlamp (main.js)
├── package.json
└── tsconfig.json
```

---

## Contributing

Contributions are welcome! Please read the [**Contributing Guide**](CONTRIBUTING.md) for local development setup and the pull request workflow.

Have questions or ideas? Join the conversation on [**GitHub Discussions**](https://github.com/MadhavDhatrak/headlamp-plugin-openeverest/discussions), or report problems on [**GitHub Issues**](https://github.com/MadhavDhatrak/headlamp-plugin-openeverest/issues).
