# headlamp-plugin-openeverest

A [Headlamp](https://headlamp.dev) plugin that provides a full UI for managing [OpenEverest V2](https://github.com/openeverest) databases directly inside Headlamp — no separate UI needed.

## What It Does

- **Providers** — Browse the OpenEverest provider catalog (PostgreSQL, MongoDB, MySQL, etc.) with live install status
- **Databases** — List, create, and delete `DatabaseCluster` instances across all namespaces
- **Backups** — View and trigger on-demand backups via `DatabaseClusterBackup`
- **Settings** — Configure your OpenEverest server URL and JWT token

## Prerequisites

- Kubernetes cluster (running)
- [Headlamp](https://headlamp.dev/docs/latest/installation/) installed and connected to the cluster
- [OpenEverest V2](https://github.com/openeverest) installed on the cluster

## Development

```bash
# Install dependencies
npm install

# Start dev mode (watch + rebuild)
npm run start

# Build for production
npm run build
```

## Tech Stack

- TypeScript + React
- Headlamp Plugin SDK (`@kinvolk/headlamp-plugin`)
- MUI (Material UI) — bundled with Headlamp
- Kubernetes CRDs via Headlamp's K8s proxy (live WebSocket watch)
- OpenEverest REST API for write operations

## CRDs Used

| CRD | Purpose |
|-----|---------|
| `DatabaseEngine` | Installed provider status |
| `DatabaseCluster` | Database instances |
| `DatabaseClusterBackup` | Backup snapshots |
| `BackupStorage` | Storage locations (S3/GCS/Azure) |

## License

Apache 2.0
