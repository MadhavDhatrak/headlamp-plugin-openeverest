import fs from 'fs';
import os from 'os';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const pluginRoot = path.resolve(__dirname, '..');

function getHeadlampUserPluginsDir() {
  if (process.platform === 'win32') {
    const appData = process.env.APPDATA || path.join(os.homedir(), 'AppData', 'Roaming');
    return path.join(appData, 'Headlamp', 'Config', 'user-plugins', 'headlamp-openeverest');
  } else if (process.platform === 'darwin') {
    return path.join(os.homedir(), 'Library', 'Application Support', 'Headlamp', 'user-plugins', 'headlamp-openeverest');
  } else {
    return path.join(os.homedir(), '.config', 'Headlamp', 'user-plugins', 'headlamp-openeverest');
  }
}

function sync() {
  const targetDir = getHeadlampUserPluginsDir();
  const distDir = path.join(pluginRoot, 'dist');
  const packageJsonPath = path.join(pluginRoot, 'package.json');
  const mainJsPath = path.join(distDir, 'main.js');

  if (!fs.existsSync(mainJsPath)) {
    console.error(`${mainJsPath} not found. Please build the plugin first.`);
    process.exit(1);
  }

  try {
    fs.mkdirSync(targetDir, { recursive: true });
    fs.cpSync(distDir, targetDir, { recursive: true });
    fs.copyFileSync(packageJsonPath, path.join(targetDir, 'package.json'));
    console.log(`✅ Copied plugin to Headlamp: ${targetDir}`);
  } catch (err) {
    console.error(`Failed to copy to ${targetDir}:`, err.message);
    process.exit(1);
  }
}

sync();
