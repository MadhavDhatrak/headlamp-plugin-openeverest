# Headlamp Plugin for OpenEverest V2

> [!WARNING]
> **Project Status: Active MVP Development**
> This plugin is currently in active MVP (Minimum Viable Product) development for OpenEverest V2. Features, APIs, and interfaces are actively evolving. Feedback and contributions are very welcome!

---

## Table of Contents

- [Overview](#overview)
- [MVP Feature Status](#mvp-feature-status)
- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Project Structure](#project-structure)
- [Contributing](#contributing)

---

## Overview

The **OpenEverest Headlamp Plugin** brings the power of [OpenEverest V2](https://github.com/openeverest) directly into the [Headlamp](https://headlamp.dev) Kubernetes web and desktop UI.

Database administrators and developers can browse database engine operators, provision multi-node production databases, trigger instant snapshots, and manage recurring backup schedules across clusters—all natively within Headlamp without leaving their Kubernetes console.

---

## MVP Feature Status

| Feature | Status | Description |
| :--- | :---: | :--- |
| **Provider Catalog** | ✅ Implemented | Live feed from OpenEverest Hub index; detects installed providers. |
| **Database Listing** | ✅ Implemented | Lists all active database instances across namespaces. |
| **Database Creation Wizard** | ✅ Implemented | Multi-step provisioning with dynamic `uiSchema` validation and resource sizing. |
| **Backups in Creation Wizard** | ✅ Implemented | Configure automated backup frequency and storage targets during initial database creation. |
| **On-Demand Snapshots** | ✅ Implemented | Trigger point-in-time snapshot backups on existing running databases via `Backup` CRs. |
| **Recurring Schedules** | ✅ Implemented | View, add, edit, and delete cron-based backup schedules for existing databases. |
| **Storage Destinations** | ✅ Implemented | Register and manage S3/MinIO backup storage targets via `BackupStorage` CRs. |
| **Dynamic Engine Filtering** | ✅ Implemented | Automatically checks `BackupClass` compatibility to skip engines without backup support. |

---

## Prerequisites

To run and develop with this plugin, ensure you have:

1. **A Kubernetes Cluster:** (v1.28+) local (k3s, minikube, kind) or cloud-managed (EKS, GKE, AKS).
2. **OpenEverest V2 Installed:**
   ```bash
   helm repo add openeverest https://openeverest.github.io/helm-charts/
   helm repo update
   helm install everest-core openeverest/openeverest \
     --devel --version "2.0.0-dev.4" \
     --namespace everest-system --create-namespace
   ```
3. **Headlamp Installed:** [Headlamp Desktop App](https://headlamp.dev/docs/latest/installation/) (Desktop only for now; in-cluster support coming later).
4. **Node.js:** v18+ and `npm`.

---

## Quick Start

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/MadhavDhatrak/headlamp-plugin-openeverest.git
cd headlamp-plugin-openeverest/headlamp-openeverest
npm install
```

### 2. Link Plugin into Headlamp
Create a symbolic link or copy this folder to the Headlamp plugins directory:

- **Linux:** `~/.config/Headlamp/plugins/`
- **macOS:** `~/Library/Application Support/Headlamp/plugins/`
- **Windows (PowerShell):**
  ```powershell
  New-Item -ItemType SymbolicLink -Path "$env:APPDATA\Headlamp\plugins\headlamp-openeverest" -Target (Get-Location)
  ```

### 3. Build & Run
```bash
# Development mode with hot rebuild:
npm run start

# Production build:
npm run build
```
Restart or refresh Headlamp—**OpenEverest** will appear in the sidebar!

---

## Project Structure

```
headlamp-openeverest/
├── src/
│   ├── crd/        # Headlamp KubeObject models (Instance, Provider, Backup, BackupClass, BackupStorage)
│   ├── pages/      # Views: ProvidersPage, DatabaseListPage, CreateDatabasePage, BackupsPage
│   ├── components/ # Modals and dialogs (CreateScheduleModal, CreateOnDemandBackupDialog, etc.)
│   ├── hooks/      # React hooks watching cluster resources (useInstances, useBackups, etc.)
│   └── utils/      # Helpers for cron parsing and RFC 7386 Merge Patching
└── package.json
```

---

## Contributing

We welcome contributions of all kinds! Whether it's reporting a bug, improving documentation, or adding new features:
1. Fork the repository and create your feature branch (`git checkout -b feat/amazing-feature`).
2. Verify production build passes cleanly (`npm run build`).
3. Commit using conventional commit format (`git commit -m 'feat: add amazing feature'`).
4. Push to your branch and open a Pull Request.
