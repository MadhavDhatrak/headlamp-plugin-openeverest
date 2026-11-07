# Contributing to headlamp-plugin-openeverest

Thank you for your interest in contributing! This project brings [OpenEverest V2](https://github.com/openeverest) database management directly into the [Headlamp](https://headlamp.dev) Kubernetes dashboard.

Whether you are fixing a bug, adding a new database provider feature, or improving documentation, your contributions are welcome!

---

## 1. Prerequisites

Before developing locally, ensure you have:

- **Node.js**: v18 or later
- **npm**: v9 or later
- **A Kubernetes Cluster**: (v1.28+) local (`k3s`, `minikube`, `kind`) or cloud-managed.
- **OpenEverest V2 Installed**: Deployed on your cluster via Helm (`openeverest/openeverest --version "2.0.0-dev.4"`).
- **Headlamp Desktop**: Running the official [Headlamp Desktop](https://headlamp.dev/docs/latest/installation/) application.  
  > ⚠️ **Note:** Currently, **only Headlamp Desktop is supported**. Support for in-cluster Headlamp can be added later

---

## 2. Local Development Setup

Follow these steps in order so Headlamp automatically picks up your plugin and live reloads changes:

### Step 1: Clone and Install Dependencies

```bash
git clone https://github.com/MadhavDhatrak/headlamp-plugin-openeverest.git
cd headlamp-plugin-openeverest
npm install
```

### Step 2: Link the Plugin to Headlamp Desktop

Headlamp Desktop automatically discovers plugins from its local plugins directory. You should link your development folder **before** starting the build watcher so changes reflect immediately.

The plugin folder locations are:
- **Linux**: `~/.config/Headlamp/plugins/`
- **macOS**: `~/Library/Application Support/Headlamp/plugins/`
- **Windows**: `%APPDATA%\Headlamp\plugins\`

Create a symbolic link (or junction) from the Headlamp plugins directory to your repo folder:

**On Linux / macOS:**
```bash
# Create the plugins directory if it doesn't exist
mkdir -p ~/.config/Headlamp/plugins

# Create symlink
ln -s "$(pwd)" ~/.config/Headlamp/plugins/headlamp-plugin-openeverest
```

**On Windows (PowerShell as Administrator):**
```powershell
# Create the plugins directory if it doesn't exist
New-Item -ItemType Directory -Force -Path "$env:APPDATA\Headlamp\plugins"

# Create symlink to this repo directory
New-Item -ItemType SymbolicLink -Path "$env:APPDATA\Headlamp\plugins\headlamp-plugin-openeverest" -Target (Get-Location)
```

*(Alternatively, you can build first and copy the entire project folder or `dist/` + `package.json` directly into `%APPDATA%\Headlamp\plugins\headlamp-plugin-openeverest`.)*

### Step 3: Start the Build Watcher

Run the development server in watch mode:

```bash
npm run start
```

This compiles TypeScript files and continuously watches for changes, updating `dist/main.js` automatically whenever you save a file.

### Step 4: Launch Headlamp & Live Reload

1. Launch **Headlamp Desktop**.
2. You will see **OpenEverest** in the sidebar.
3. Whenever you make code changes and `npm run start` finishes recompiling, simply press **`Ctrl + R`** (Windows/Linux) or **`Cmd + R`** (macOS) inside Headlamp to reload the window and see your changes immediately.

For a one-time production build without watching:
```bash
npm run build
```

---

## 3. Project Architecture & Documentation

Before writing code, please read the architecture guide:

- 📖 **Architecture & Overview Guide**: [`docs/01-architecture-and-overview.md`](./docs/01-architecture-and-overview.md)  
  *Explains the dual communication model (WebSocket Watches vs REST Mutations), Headlamp SDK integration, tech stack, and current MVP scope.*

---

## 4. Submitting a Pull Request (PR)

We appreciate all contributions! To help us review and merge your work quickly, please follow this workflow:

### Workflow

1. **Fork & Branch:** Create a feature or fix branch from `main`:
   ```bash
   git checkout -b feat/your-feature-name
   # or
   git checkout -b fix/your-bugfix-name
   # or
   git checkout -b docs/your-doc-update
   ```
2. **Verify Build:** Ensure TypeScript compiles with zero errors before committing:
   ```bash
   npm run build
   ```
3. **Commit & Push:**
   ```bash
   git commit -m "feat(scope): descriptive message"
   git push origin feat/your-feature-name
   ```
4. **Open a PR:** Open a Pull Request on GitHub with a clear summary of what changed and any screenshots for UI adjustments.

---

## 5. Questions & Discussions

Have questions, suggestions, or want to discuss a new idea before writing code?

- 💬 Join the conversation on **[GitHub Discussions](https://github.com/MadhavDhatrak/headlamp-plugin-openeverest/discussions)**.
- 🐛 Found a bug? Open a **[GitHub Issue](https://github.com/MadhavDhatrak/headlamp-plugin-openeverest/issues)** with details and reproduction steps.

