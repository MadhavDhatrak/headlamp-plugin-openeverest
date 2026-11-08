# 02 Extensions & Providers

This document explains how the **Extensions** domain works: how the plugin fetches the online OpenEverest Hub catalog, synchronizes it with the `Provider` CRs installed on the cluster, and helps users install database operators via Helm.

> [!NOTE]
> New to the project? Start with [01 Architecture & Overview](./01-architecture-and-overview.md) for the big picture.

## Table of Contents

1. [What are Extensions and Providers?](#1-what-are-extensions-and-providers)
2. [The Hub Catalog (Remote Index)](#2-the-hub-catalog-remote-index)
3. [Cluster State: Provider Custom Resources](#3-cluster-state-provider-custom-resources)
4. [How Hub Data and Cluster State are Merged](#4-how-hub-data-and-cluster-state-are-merged)
5. [User Interface Overview](#5-user-interface-overview)
6. [End-to-End Installation Flow](#6-end-to-end-installation-flow)

---

## 1. What are Extensions and Providers?

OpenEverest V2 has a modular architecture. An **Extension** is a database engine operator or plugin that can be added to your Kubernetes cluster. When an extension's operator is installed, it registers a **Provider** on the cluster.

The Headlamp plugin gives administrators a dashboard where they can:

- Browse the available extensions.
- See which ones are already installed.
- Copy the exact Helm command needed to install any of them.

---

## 2. The Hub Catalog (Remote Index)

The plugin fetches the official OpenEverest catalog from a remote JSON index on GitHub:

```text
https://raw.githubusercontent.com/openeverest/hub/main/index/index.json
```

All catalog-fetching logic lives in `src/api/hub.ts`:

| Function | What it does |
| --- | --- |
| `fetchHubIndex()` | Fetches the catalog once and caches the parsed result in memory. Navigating between tabs reuses the cache, so rendering is instant. |
| `buildHelmCommand(ext)` | Reads the extension's artifact channels (`ref`, `version`, `releaseName`, `namespace`) and generates a copy-ready install command. |

Example output of `buildHelmCommand()`:

```bash
helm install percona-postgresql-operator \
  openeverest/percona-postgresql-operator \
  --version 0.1.0 \
  -n openeverest-system --create-namespace
```

> [!NOTE]
> If the network is offline or GitHub raw content is unreachable, the API returns a clean error and the UI shows an alert with a **Retry** button.

---

## 3. Cluster State: Provider Custom Resources

When an extension operator is installed, it creates a `Provider` custom resource in the `core.openeverest.io/v1alpha1` API group:

```yaml
apiVersion: core.openeverest.io/v1alpha1
kind: Provider
metadata:
  name: provider-percona-postgresql
spec:
  versions:
    - name: "16.4"
    - name: "15.8"
  uiSchema:
    # schema that drives the dynamic database creation wizard
status:
  state: Ready
  defaultVersion: "16.4"
  availableVersions:
    - "16.4"
    - "15.8"
```

The plugin tracks cluster providers live with the Headlamp SDK's `Provider.useList()` hook. It opens a real-time WebSocket connection to the Kubernetes API server, so installations and status changes appear immediately, without refreshing the page.

---

## 4. How Hub Data and Cluster State are Merged

Both the catalog grid (`ProvidersPage.tsx`) and the detail view (`ExtensionDetailPage.tsx`) share one custom hook: **`useExtensionsCatalog`** (in `src/hooks/useExtensionsCatalog.ts`). It combines the remote Hub catalog with the live cluster state.

![Diagram showing how the Hub catalog and cluster Provider CRs are merged by useExtensionsCatalog](https://github.com/user-attachments/assets/10f6f104-0493-4857-90e7-7cb04f7d3e9f)

For every catalog entry, the hook does the following:

1. It looks for a `Provider` CR on the cluster with the same name.
2. **If found:** `isInstalled` is set to `true`, and it reads `status.state` (e.g. `Ready`) and `status.availableVersions`.
3. **If not found:** `isInstalled` is `false`, and `buildHelmCommand()` prepares the installation command.

---

## 5. User Interface Overview

### Catalog Grid

**File:** `src/pages/ProvidersPage.tsx` | **Route:** `/openeverest/providers`

This view shows every catalog item as a card, with:

| Feature | Description |
| --- | --- |
| **Filter tab: All** | Every extension in the catalog. |
| **Filter tab: Providers** | Core database operators. |
| **Filter tab: Plugins** | Ancillary tools and UI add-ons. |
| **Filter tab: Installed** | Only extensions currently present on the cluster. |
| **Search bar** | Real-time filtering by extension name, title, or description. |
| **Skeleton loaders** | Loading placeholders while the catalog and cluster watches initialize. |

### Detail View

**File:** `src/pages/ExtensionDetailPage.tsx` | **Route:** `/openeverest/providers/:name`

Clicking a card opens this view, which shows:

- **Header status:** A badge showing `Installed (vX.Y.Z)` or `Not Installed`.
- **Prerequisites card:** Cluster requirements (such as `cert-manager` or storage classes) with links to setup guides.
- **Supported database versions:** All engine versions supported by the installed operator, with the default version highlighted.
- **Helm command box:** A code box with a one-click copy button for the install command.
- **Metadata sidebar:** Maturity (`alpha`, `beta`, `stable`), open-source license, maintainers, and GitHub repository links.

---

## 6. End-to-End Installation Flow

![Diagram of the end-to-end flow from browsing the catalog to a provider showing as installed](https://github.com/user-attachments/assets/e1cbd2e5-0958-4086-8e5b-22932252b181)

In short:

1. The user opens the catalog, and the plugin fetches the Hub index and starts the `Provider` watch.
2. The user opens an extension that shows **Not Installed** and reviews its prerequisites.
3. The user copies the generated `helm install` command and runs it against the cluster.
4. The operator is installed and creates its `Provider` CR.
5. The live watch picks up the new `Provider`, and the UI switches to **Installed** with its status and available versions.

> [!TIP]
> The plugin doesn't run Helm for you. It generates the command and you run it yourself, and the page updates on its own once the operator registers its `Provider`.

---

## Next Steps

- 🏗️ Back to [01 Architecture & Overview](./01-architecture-and-overview.md)
- 🛠️ Want to contribute? See the [Contributing Guide](../CONTRIBUTING.md).
