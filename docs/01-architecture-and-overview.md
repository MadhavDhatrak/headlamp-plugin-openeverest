# 01 Architecture & Overview

This document provides a simple overview of **headlamp-plugin-openeverest**: what it does, how it communicates with Kubernetes, how the code is organized, and what features are currently supported in the MVP.

---

## Table of Contents

1. [What is headlamp-plugin-openeverest?](#1-what-is-headlamp-plugin-openeverest)
2. [Architecture: How it Talks to Kubernetes](#2-architecture-how-it-talks-to-kubernetes)
3. [Tech Stack](#3-tech-stack)
4. [Folder Structure](#4-folder-structure)
5. [Current Supported Features (MVP)](#5-current-supported-features-mvp)

---

## 1. What is headlamp-plugin-openeverest?

The **OpenEverest Headlamp Plugin** brings the power of [OpenEverest V2](https://github.com/openeverest) directly into the [Headlamp](https://headlamp.dev) Kubernetes web and desktop UI.

Database administrators and developers can browse database engine operators, provision multi-node production databases, trigger instant snapshots, and manage recurring backup schedules across clusters—all natively within Headlamp without leaving their Kubernetes console.

It provides three core capabilities:

- **Extensions (Providers):** Discover and install database operators (PostgreSQL, MySQL, ClickHouse, etc.) via Helm.
- **Databases:** Deploy and monitor database instances with dynamic configuration wizards.
- **Backups:** Manage on-demand snapshots, automated recurring backup schedules, and cloud storage targets.

**No backend service is required.** The plugin runs completely inside Headlamp in the user's browser, securely communicating through Headlamp's built-in Kubernetes proxy.

---

## 2. Architecture: How it Talks to Kubernetes

The plugin uses a **dual-form communication model** with the Kubernetes API server via Headlamp's backend proxy:

1. **Live Watches (Read):** Opens real-time WebSocket watch connections (`.useList()`, `.useGet()`). Whenever a database or backup changes on the cluster, the UI updates instantly without polling or page refreshes.
2. **Mutations (Write):** Sends standard REST requests:
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

---

## 3. Tech Stack

| Layer | Technology |
|---|---|
| UI Framework | React 18 + TypeScript |
| Design & Component Library | Material UI (MUI v5) + Iconify |
| Headlamp Integration | `@kinvolk/headlamp-plugin` SDK |
| Build Tool | Webpack (bundled into `dist/main.js`) |
| Core CRDs | `core.openeverest.io/v1alpha1` (`Provider`, `Instance`) |
| Backup CRDs | `backup.openeverest.io/v1alpha1` (`Backup`, `BackupStorage`, `BackupClass`) |

---

## 4. Folder Structure

Here is a simplified overview of how the plugin source code is organized:

```
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

The current MVP delivers three core domains:

### 1. Extensions & Providers
- Remote Hub catalog browsing with search and category filtering.
- Detection of currently installed providers on the Kubernetes cluster.
- Detailed provider view with requirements and copy-paste `helm install` commands.

### 2. Database Instances
- Real-time instance list with live status indicators and cluster statistics.
- Dynamic creation wizard powered by provider `uiSchema` (custom fields for each database type).
- Topology selection (e.g. standalone, cluster) with automated unit formatting (e.g. `Gi`).
- Safe instance deletion dialog.

### 3. Backups & Scheduling
- **On-Demand Snapshots:** Trigger immediate database backups to any compatible `BackupStorage`.
- **Recurring Schedules:** Configure automated cron schedules directly during database creation 
- **Safe RFC 7386 Patching:** Schedule modifications only update the backup slice of the `Instance` spec.
- **Dynamic Compatibility:** Automatically checks `BackupClass` support so unsupported engines (like ClickHouse) do not display invalid backup options.
