# 01 Architecture & Overview

A short overview of **headlamp-plugin-openeverest**: what it does, how it talks to Kubernetes, how the code is organized, and which features the MVP supports.

> [!WARNING]
> **Project Status: Active MVP Development**
> Features, APIs, and interfaces are actively evolving, so this document may change as the plugin does.

## Table of Contents

1. [What is headlamp-plugin-openeverest?](#1-what-is-headlamp-plugin-openeverest)
2. [Architecture: How it Talks to Kubernetes](#2-architecture-how-it-talks-to-kubernetes)
3. [Tech Stack](#3-tech-stack)
4. [Folder Structure](#4-folder-structure)
5. [Current Supported Features (MVP)](#5-current-supported-features-mvp)
6. [Next Steps](#6-next-steps)

---

## 1. What is headlamp-plugin-openeverest?

The **OpenEverest Headlamp Plugin** brings [OpenEverest V2](https://github.com/openeverest) into the [Headlamp](https://headlamp.dev) Kubernetes UI.

Database administrators and developers can browse database engine operators, provision multi-node production databases, trigger instant snapshots, and manage recurring backup schedules across clusters, all inside Headlamp and without leaving their Kubernetes console.

It provides three core capabilities:

| Capability | What it does |
| --- | --- |
| **Extensions (Providers)** | Discover and install database operators (PostgreSQL, MySQL, ClickHouse, etc.) via Helm. |
| **Databases** | Deploy and monitor database instances with dynamic configuration wizards. |
| **Backups** | Manage on-demand snapshots, automated recurring backup schedules, and cloud storage targets. |

> [!IMPORTANT]
> **No backend service is required.** The plugin runs entirely inside Headlamp and talks to the cluster through Headlamp's built-in Kubernetes proxy.

> [!NOTE]
> Currently, **only Headlamp Desktop is supported**. Support for in-cluster Headlamp is planned for a future release.

---

## 2. Architecture: How it Talks to Kubernetes

The plugin uses a **dual communication model** with the Kubernetes API server, routed through Headlamp's backend proxy:

1. **Live watches (read):** Opens real-time WebSocket watch connections (`.useList()`, `.useGet()`). When a database or backup changes on the cluster, the UI updates instantly, with no polling or page refresh.
2. **Mutations (write):** Sends standard REST requests:
   - **POST:** Creates new database instances or on-demand backup snapshots.
   - **RFC 7386 JSON Merge PATCH:** Atomically updates schedules inside the `Instance` custom resource without overwriting other fields.
   - **DELETE:** Deletes database instances when requested.

### Communication Diagram
```
+-------------------------------------------------------------------------+
|                              HEADLAMP UI                                |
|                                                                         |
|  [ Extensions (Hub) ]      [ Databases Wizard ]      [ Backups] |
+------------------------------------+------------------------------------+
                                     |
                      Headlamp SDK (@kinvolk/headlamp-plugin)
                                     |
                                     v
+-------------------------------------------------------------------------+
|                         HEADLAMP BACKEND PROXY                          |
|             (Handles Cluster Auth, Kubeconfig, and Token Relay)         |
+--------------------+-------------------------------+--------------------+
                     |                               |
       (1) Live Watches (WebSockets)    (2) Mutations (POST / PATCH / DELETE)
                     |                               |
                     v                               v
+-------------------------------------------------------------------------+
|                          KUBERNETES API SERVER                          |
|                                                                         |
|    core.openeverest.io/v1alpha1        backup.openeverest.io/v1alpha1   |
|    - Provider                          - Backup                         |
|    - Instance                          - BackupStorage                  |
|                                        - BackupClass                    |
+------------------------------------+------------------------------------+
                                     |
                                     v
+-------------------------------------------------------------------------+
|                       OPENEVEREST OPERATORS                             |
|          (Reconciles pods, PVCs, services, and backup jobs)             |
+-------------------------------------------------------------------------+
```

### Custom Resources Used

| API group | Resources |
| --- | --- |
| `core.openeverest.io/v1alpha1` | `Provider`, `Instance` |
| `backup.openeverest.io/v1alpha1` | `Backup`, `BackupStorage`, `BackupClass` |

---

## 3. Tech Stack

| Layer | Technology |
| --- | --- |
| UI framework | React 18 + TypeScript |
| Design & component library | Material UI (MUI v5) + Iconify |
| Headlamp integration | `@kinvolk/headlamp-plugin` SDK |
| Build tool | `headlamp-plugin` CLI (`@kinvolk/headlamp-plugin`) — bundles into `dist/main.js` |
| Core CRDs | `core.openeverest.io/v1alpha1` (`Provider`, `Instance`) |
| Backup CRDs | `backup.openeverest.io/v1alpha1` (`Backup`, `BackupStorage`, `BackupClass`) |

---

## 4. Folder Structure

A simplified view of how the plugin source is organized:

```text
headlamp-openeverest/
├── src/
│   ├── index.tsx         Entry point (registers routes and sidebar menus)
│   ├── pages/            Full views (Extensions, Databases, Backups, Create Wizard)
│   ├── components/       Reusable UI widgets (cards, modals, step forms, status chips)
│   ├── schema/           Dynamic form generator (reads uiSchema from Provider CRs)
│   ├── hooks/            React hooks for live cluster data (useInstances, useExtensionsCatalog)
│   ├── api/              External catalog fetcher (Hub index.json)
│   ├── utils/            Payload builders & RFC 7386 merge patch helpers
│   └── crd/              TypeScript model definitions for Kubernetes CRDs
├── docs/                 Detailed architecture & domain documentation
├── dist/                 Compiled bundle loaded by Headlamp (main.js)
├── package.json
└── tsconfig.json
```

---

## 5. Current Supported Features (MVP)

The MVP delivers three core domains.

### 1. Extensions & Providers

- Remote Hub catalog browsing with search and category filtering.
- Detection of providers already installed on the cluster.
- Detailed provider view with requirements and copy-paste `helm install` commands.

### 2. Database Instances

- Real-time instance list with live status indicators and cluster statistics.
- Dynamic creation wizard powered by provider `uiSchema` (custom fields for each database type).
- Topology selection (e.g. standalone, cluster) with automated unit formatting (e.g. `Gi`).
- Safe instance deletion dialog.

### 3. Backups & Scheduling

- **On-demand snapshots:** Trigger immediate backups to any compatible `BackupStorage`.
- **Recurring schedules:** Configure automated cron schedules directly during database creation.
- **Safe RFC 7386 patching:** Schedule changes only update the backup slice of the `Instance` spec.
- **Dynamic compatibility:** Automatically checks `BackupClass` support, so unsupported engines (like ClickHouse) don't show invalid backup options.

---

## 6. Next Steps

- 🛠️ Want to run the plugin locally? See the [Contributing Guide](../CONTRIBUTING.md).
- 💬 Questions or ideas? Join [GitHub Discussions](https://github.com/MadhavDhatrak/headlamp-plugin-openeverest/discussions).
- 🐛 Found a bug? Open a [GitHub Issue](https://github.com/MadhavDhatrak/headlamp-plugin-openeverest/issues).
