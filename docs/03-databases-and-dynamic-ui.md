# 03 Databases & Dynamic UI

This document explains how the **Databases** domain works: how database instances are monitored across namespaces, and how the creation wizard adapts its form fields to the selected provider's `uiSchema`.

> [!NOTE]
> Looking for how providers get installed? See [02 Extensions & Providers](./02-extensions-and-providers.md).

## Table of Contents

1. [What is an Instance Custom Resource?](#1-what-is-an-instance-custom-resource)
2. [Listing Databases: DatabaseListPage & useInstances](#2-listing-databases-databaselistpage--useinstances)
3. [The Creation Wizard Flow](#3-the-creation-wizard-flow)
4. [The Dynamic Form Engine: uiSchema](#4-the-dynamic-form-engine-uischema)
5. [Converting Form Values to K8s Manifests: buildInstance](#5-converting-form-values-to-k8s-manifests-buildinstance)
6. [Example Instance Custom Resource](#6-example-instance-custom-resource)
7. [End-to-End Request Journey & Troubleshooting](#7-end-to-end-request-journey--troubleshooting)

---

## 1. What is an Instance Custom Resource?

A database cluster in OpenEverest V2 is defined as an **`Instance`** custom resource in the `core.openeverest.io/v1alpha1` API group.

When you create an `Instance`, the matching database operator (such as the Percona PostgreSQL Operator or Percona Server for MySQL Operator) reconciles it and provisions the underlying Kubernetes resources:

- `StatefulSets` and `Pods` running the database engine
- `PersistentVolumeClaims` (PVCs) for storage
- `Services` for internal network routing
- `Secrets` containing connection strings and generated database passwords

The Headlamp plugin manages the complete lifecycle of these `Instance` resources directly through the Kubernetes API.

---

## 2. Listing Databases: DatabaseListPage & useInstances

### The Database Table

**File:** `src/pages/DatabaseListPage.tsx` 

This page gives operators a central overview of all database clusters across all namespaces:

| Feature | Description |
| --- | --- |
| **Cluster health cards** | Summary counters for **Total Databases**, **Ready**, **Provisioning**, and **Failed** instances. |
| **Instance table** | Name, Namespace, Provider, Engine Version, Nodes (replica count), Storage size, Status chip, and Age. |
| **Search & filter** | Instant filtering by instance name, namespace, or provider name. |
| **Actions** | Safe deletion with a confirmation modal (`DeleteDatabaseDialog.tsx`). |

### Real-Time Synchronization

**File:** `src/hooks/useInstances.ts`

The `useInstances` hook uses the Headlamp SDK's `Instance.useList()` method to open a real-time WebSocket watch. As instances change state, the UI updates automatically, without polling. Each field is read from the `Instance` resource like this:

| Field | Source |
| --- | --- |
| `providerName` | `spec.providerRef.name` |
| `engineVersion` | `spec.version` |
| `replicas` | `spec.components.engine.replicas` |
| `storageSize` | `spec.components.engine.storage.size` |
| `phase` | `status.state`, rendered as a colored badge by `DatabaseStatusChip.tsx` |

---

## 3. The Creation Wizard Flow

**File:** `src/pages/CreateDatabasePage.tsx` 

Different database engines need very different settings. For example, ClickHouse requires Keeper cluster settings, while PostgreSQL requires WAL and replication settings.

Instead of hardcoding a form per engine, `CreateDatabasePage.tsx` uses a three-stage, schema-driven wizard:

![Diagram of the two-stage creation wizard: provider selection followed by the configuration stepper](https://github.com/user-attachments/assets/54191444-c685-43bf-ba92-4227d27c19f7)

### Stage 0: Provider Selection

Displays a visual grid of installed database providers (`ProviderSelectorGrid.tsx`). Only providers installed on the cluster can be selected.

### Stage 1: Configuration Stepper

| Step | Content |
| --- | --- |
| **Step 1: Basic Info** | Database name, target namespace, and topology selection (e.g. `standalone`, `cluster`). |
| **Step 2: Backups** | Shown only if the provider has an eligible `BackupClass`. Sets up Day-1 recurring schedules and storage destinations. |
| **Step 3+: Dynamic sections** | Rendered dynamically from the provider's `uiSchema`. |

---

## 4. The Dynamic Form Engine: uiSchema

**File:** `src/schema/uiSchema.ts`

When a provider is installed, its `Provider` custom resource carries a `spec.uiSchema` definition. It describes which sections and form controls to render for each topology:

```yaml
spec:
  uiSchema:
    standalone:
      sectionsOrder:
        - engine
        - resources
      sections:
        engine:
          label: "Engine Configuration"
          components:
            spec.components.engine.storage.size:
              type: "text"
              label: "Storage Size"
              fieldParams:
                defaultValue: "25"
                badge: "Gi"
                badgeToApi: true
```

### Core Engine Functions

| Function | What it does |
| --- | --- |
| `resolveTopologyUi(providerSpec, topologyName)` | Extracts sections, components, and field metadata for the selected topology. |
| `extractDefaultValues(uiTopologySchema)` | Walks the schema tree and pre-fills form fields with declared default values when the wizard loads. |
| `WidgetRenderer` (`src/components/widgets/`) | Maps schema types (`text`, `number`, `select`, `toggle`, `group`) to the matching Material UI widgets. See [How the UI Is Built Dynamically](#how-the-ui-is-built-dynamically). |

### How the UI Is Built Dynamically

The wizard has no hardcoded form for any database engine. It reads the provider's `uiSchema` and builds the form from it, using small reusable widgets in `src/components/widgets/`.

1. The `uiSchema` lists the components to show, each with a `uiType` such as `text` or `number`.
2. **`WidgetRenderer`** is the dispatcher. It reads each component's `uiType` and renders the matching widget.
3. Each widget shows its current value from the form state and reports changes back.
4. When the user finishes, the collected values become the `Instance` manifest (see [section 5](#5-converting-form-values-to-k8s-manifests-buildinstance)).

#### Which Widget Is Used

| `uiType` | Widget | What the user sees |
| --- | --- | --- |
| `text` | `TextWidget` | A text field, with an optional unit badge such as `Gi`. |
| `number` | `NumberWidget` | A numeric input with min/max bounds and step (e.g. replica count). |
| `select` | `SelectWidget` | A dropdown, using static options or dynamic `customOptions` (e.g. database versions). |
| `toggle` | `ToggleWidget` | An on/off switch for optional features or flags. |
| `group` | `GroupWidget` | A container that renders its nested children, such as `cpu` and `memory` inside `resources`. |
| *anything else* | `UnknownWidgetFallback` | A friendly warning badge instead of a crash. |

All widgets live in `src/components/widgets/` (`WidgetRenderer` is in `index.tsx`, the others are named after the widget, e.g. `TextWidget.tsx`).

> [!NOTE]
> `GroupWidget` calls `WidgetRenderer` again for each child, so schemas can nest as deeply as a provider needs.

> [!TIP]
> If a provider declares a `uiType` the plugin doesn't know, the wizard keeps working and shows the fallback badge for that field. To support the new type, add a widget and register it in `WidgetRenderer`.

#### How State Binds to Widgets

Every component declares a `path` (or `id`): its dot-notation location in the Kubernetes spec, such as `spec.components.engine.storage.size`.

1. `CreateDatabasePage.tsx` keeps one flat dictionary, `formValues: Record<string, any>`.
2. `WidgetRenderer` gives each widget its value (`values[fieldPath]`) and an `onChange(fieldPath, newValue)` callback.
3. When a user edits a field, the widget calls `onChange`, and the wizard sets `formValues[fieldPath] = newValue`.
4. On **Create Database**, `buildInstancePayload()` turns all the path-keyed values into the final nested manifest.

---

## 5. Converting Form Values to K8s Manifests: buildInstance

**File:** `src/utils/buildInstance.ts`

While the user fills out the wizard, input values are tracked in a flat key-value map keyed by dot-separated paths, for example `spec.components.engine.storage.size: "50"`.

When the user clicks **Create Database**, `buildInstancePayload()` converts this flat map into a structured Kubernetes `Instance` manifest. For example, this flat state:

```text
spec.version                         = "16.4"
spec.components.engine.replicas      = 1
spec.components.engine.storage.size  = "50Gi"
```

becomes this nested object:

```yaml
spec:
  version: "16.4"
  components:
    engine:
      replicas: 1
      storage:
        size: 50Gi
```

The helper `setIn(targetObject, path, value)` does the work. It recursively creates parent objects as needed, so arbitrary provider configurations translate cleanly into valid custom resource specs.

> [!NOTE]
> A field with `badgeToApi: true` (see the `uiSchema` example above) has its badge unit, such as `Gi`, appended to the value sent to the API.

---

## 6. Example Instance Custom Resource

An example of the manifest generated by `buildInstancePayload()`:

```yaml
apiVersion: core.openeverest.io/v1alpha1
kind: Instance
metadata:
  name: production-pg
  namespace: default
spec:
  providerRef:
    name: provider-percona-postgresql
  deletionPolicy: Cascade
  topology:
    type: standalone
  version: "16.4"
  components:
    engine:
      replicas: 1
      storage:
        size: 50Gi
      resources:
        cpu: "2"
        memory: "4Gi"
  backup:
    enabled: true
    classRef:
      name: pg
    storages:
      - storageRef:
          name: s3-backup-storage
        schedules:
          - name: nightly-backup
            cron: "0 2 * * *"
            enabled: true
            retention:
              type: count
              count: 7
```

---

## 7. End-to-End Request Journey & Troubleshooting

### Full Request Journey

This is what happens from the moment a user clicks **Create Database** until pods are running in the cluster:

![Diagram of the full request journey from clicking Create Database to running pods](https://github.com/user-attachments/assets/6e11779e-f628-4b71-ba60-935a4f5672f8)

In short:

1. The wizard's flat form state is converted by `buildInstancePayload()` into an `Instance` manifest.
2. The plugin sends a `POST` through Headlamp's proxy to the Kubernetes API server.
3. The database operator reconciles the new `Instance` and creates the StatefulSets, Pods, PVCs, Services, and Secrets.
4. The live `Instance.useList()` watch picks up each status change, and the list page updates the status chip until it reads **Ready**.

### Common Developer Tips & Edge Cases

#### Why is the Backups step missing in the wizard?

The wizard calls `getCompatibleBackupClasses()`. If no installed `BackupClass` lists the selected provider in its `supportedProviders` array. the backup step is intentionally skipped.

#### A field renders empty when I expect a default

Verify that `fieldParams.defaultValue` is present in the `Provider.spec.uiSchema` on the cluster.

#### Debugging a created instance

Check the instance status with `kubectl`:

```bash
kubectl get instances.core.openeverest.io -A
kubectl describe instance <instance-name> -n <namespace>
```

> [!TIP]
> If an instance stays in `Provisioning` or `Failed`, inspect the operator pod logs in the operator's namespace.

---

## Next Steps

- 🧩 Back to [02 Extensions & Providers](./02-extensions-and-providers.md)
- 🛠️ Want to contribute? See the [Contributing Guide](../CONTRIBUTING.md).