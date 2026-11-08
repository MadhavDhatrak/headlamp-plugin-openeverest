# 04 Backups & Schedules

This document explains how the **Backups** domain works: the custom resources involved, dynamic engine compatibility via `BackupClass`, on-demand snapshots, and how recurring schedules are managed inside the `Instance` resource using atomic **RFC 7386 JSON Merge Patching**.

> [!NOTE]
> Want to know how databases are provisioned first? See [03 Databases & Dynamic UI](./03-databases-and-dynamic-ui.md).

## Table of Contents

1. [Custom Resource Definitions (CRDs)](#1-custom-resource-definitions-crds)
2. [Dynamic Engine Eligibility: BackupClass](#2-dynamic-engine-eligibility-backupclass)
3. [The 3-Tab Backup Interface](#3-the-3-tab-backup-interface)
4. [On-Demand Snapshots](#4-on-demand-snapshots)
5. [Managing Recurring Schedules](#5-managing-recurring-schedules)
6. [Why RFC 7386 JSON Merge Patch (Not PUT)](#6-why-rfc-7386-json-merge-patch-not-put)
7. [Schedule Flowchart](#7-schedule-flowchart)
8. [Developer Tips & Architectural Insights](#8-developer-tips--architectural-insights)

---

## 1. Custom Resource Definitions (CRDs)

Backup operations in OpenEverest V2 use resources in the `backup.openeverest.io/v1alpha1` API group:

| Custom Resource | Purpose |
| --- | --- |
| **`Backup`** | An individual point-in-time snapshot of a database instance. |
| **`BackupStorage`** | A remote storage destination (e.g. S3, MinIO) with bucket name, region, endpoint, and secret credentials. |
| **`BackupClass`** | Defines how backups are taken for a specific database engine (e.g. pgBackRest for PostgreSQL). |

> [!IMPORTANT]
> **There is no standalone `Schedule` CRD in OpenEverest V2.**
> Recurring backup schedules are embedded directly inside the `Instance` custom resource, under `spec.backup.storages[].schedules[]`. To create, update, or remove a schedule, the plugin patches the `Instance` resource itself.

---

## 2. Dynamic Engine Eligibility: BackupClass

When an administrator installs a database provider via Helm, a matching `BackupClass` is deployed to the cluster automatically:

| Installing | Deploys `BackupClass` |
| --- | --- |
| `provider-percona-postgresql` | **`pg`** |
| `provider-percona-server-mysql` | **`ps`** |

To decide which database instances can be backed up, `src/utils/backupSchedules.ts` uses `getCompatibleBackupClasses()`:

```ts
export function getCompatibleBackupClasses(
  classes: BackupClass[],
  providerName: string | undefined
): BackupClass[] {
  if (!providerName) return [];
  return classes.filter(bc => {
    if (bc.executionMode !== 'ProviderManaged') return false;
    const supported = bc.supportedProviders;
    if (!supported || supported.length === 0) return false;
    return supported.includes(providerName);
  });
}
```

A `BackupClass` counts as compatible only when it:

1. Has `executionMode` set to `ProviderManaged`.
2. Lists the selected provider in its `supportedProviders` array.

> [!TIP]
> **Why this matters:** the plugin contains **zero hardcoded database names**. If an engine has no matching `BackupClass`, backup options are hidden from the UI automatically.

---

## 3. The 3-Tab Backup Interface

**File:** `src/pages/BackupsPage.tsx` | **Route:** `/openeverest/backups`

One page provides three tabs:

| Tab | What it shows |
| --- | --- |
| **Backups** | All `Backup` CRs on the cluster with status (`Completed`, `Running`, `Failed`), target instance, storage location, and creation time. Includes a **Create Snapshot** button. |
| **Schedules** | All recurring schedules across every database instance: instance name, human-readable cron, target storage, retention count, and **Edit** / **Delete** actions. |
| **Storages** | All registered `BackupStorage` configurations: bucket names, storage types, and endpoints. |

---

## 4. On-Demand Snapshots

**File:** `src/components/CreateOnDemandBackupDialog.tsx`

Users can trigger an instant, one-off backup without waiting for a schedule. After the user picks an instance and a storage target, the dialog posts a new `Backup` CR:

```yaml
apiVersion: backup.openeverest.io/v1alpha1
kind: Backup
metadata:
  name: pg-manual-snapshot-1718293
  namespace: default
spec:
  instanceRef:
    name: production-pg
  storageRef:
    name: minio-backup-storage
```

The database operator picks up this resource and immediately runs a backup to the specified storage.

---

## 5. Managing Recurring Schedules

**File:** `src/utils/backupSchedules.ts`

Because schedules are embedded across many `Instance` resources, the plugin uses helper functions to normalize and edit them.

### Schedule flattening: `flattenAllInstanceSchedules`

Iterates over all `Instance` objects on the cluster, extracts each `spec.backup.storages[].schedules[]` array, and flattens them into a simple tabular structure (`InstanceScheduleRow`) for the UI table:

```ts
export interface InstanceScheduleRow {
  name: string;
  cron: string;
  enabled: boolean;
  storageName: string;
  retentionCopies: number;
  instanceName: string;
  namespace: string;
  backupClassName?: string;
}
```

### Human-readable cron: `parseCronDisplay`

Converts standard 5-part cron expressions into friendly text:

| Cron expression | Displayed as |
| --- | --- |
| `0 6 * * *` | **Daily @ 6:00 AM** |
| `0 2 * * 1` | **Weekly (Mondays) @ 2:00 AM** |
| `30 * * * *` | **Hourly @ :30** |

### Time picker conversion: `parseCronToState` & `timeToCron`

These let users build and edit schedules with ordinary dropdowns (Frequency, Hour, Minute, AM/PM, Day of Week) so they never have to write raw cron syntax.

---

## 6. Why RFC 7386 JSON Merge Patch (Not PUT)

When a user adds, edits, or deletes a backup schedule, the plugin sends an **RFC 7386 JSON Merge Patch** (`application/merge-patch+json`) instead of an HTTP `PUT`.

A `PUT` replaces the whole `Instance`, which risks overwriting fields the plugin never meant to touch. A merge patch only changes the part you send, so schedule edits affect just the backup slice of the `Instance` spec.

```http
PATCH /apis/core.openeverest.io/v1alpha1/namespaces/default/instances/production-pg
Content-Type: application/merge-patch+json

{
  "spec": {
    "backup": {
      "enabled": true,
      "classRef": { "name": "pg" },
      "storages": [
        {
          "storageRef": { "name": "minio-storage" },
          "schedules": [
            {
              "name": "daily-backup",
              "cron": "0 6 * * *",
              "enabled": true,
              "retention": { "type": "count", "count": 7 },
              "retentionCopies": 7
            }
          ]
        }
      ]
    }
  }
}
```

> [!NOTE]
> Under RFC 7386, arrays are replaced as a whole rather than merged item by item. That is why the patch above includes the complete `storages` list.

---

## 7. Schedule Flowchart

![Flowchart of how adding, editing, or deleting a schedule is sent as a merge patch to the Instance resource](https://github.com/user-attachments/assets/ae665d8a-5099-4f6e-af44-51d5ae8bb42a)

In short:

1. The user adds, edits, or deletes a schedule in the **Schedules** tab.
2. The plugin builds the updated `spec.backup` block for that `Instance`.
3. It sends a merge `PATCH` through Headlamp's proxy to the Kubernetes API server.
4. The live watch picks up the updated `Instance`, and the Schedules table refreshes.

---

## 8. Developer Tips & Architectural Insights

### Provider-managed backups vs Kubernetes CronJobs

OpenEverest V2 does **not** create standard Kubernetes `CronJob` pods for database backups. Backups are **provider-managed**: the database operator runs its own tooling (such as `pgBackRest` inside dedicated sidecars or operator-managed pods) to take backups without disrupting connections.

### Verifying schedules from the CLI

Inspect the schedules of any running instance with `kubectl`:

```bash
kubectl get instance <instance-name> -n <namespace> -o jsonpath='{.spec.backup.storages}' | jq
```

> [!TIP]
> This is handy after a patch: compare the CLI output with the Schedules tab to confirm the UI and the cluster agree.

---

## Next Steps

- 🗄️ Back to [03 Databases & Dynamic UI](./03-databases-and-dynamic-ui.md)
- 🛠️ Want to contribute? See the [Contributing Guide](../CONTRIBUTING.md).