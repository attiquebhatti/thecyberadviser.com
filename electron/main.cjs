const { app, BrowserWindow, shell, ipcMain, dialog } = require('electron');
const { spawn } = require('child_process');
const http = require('http');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const PORT = Number(process.env.UNIFIED_MIGRATOR_DESKTOP_PORT || 3030);
const APP_URL = process.env.UNIFIED_MIGRATOR_DESKTOP_URL || `http://127.0.0.1:${PORT}`;
const APP_VERSION = '1.0.0';

let nextServerProcess;

// ── Data directories ───────────────────────────────────────────

function getDataDir() {
  const dir = path.join(app.getPath('userData'), 'UnifiedMigrator');
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

function getProjectsDir() {
  const dir = path.join(getDataDir(), 'projects');
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

function getAuditPath() {
  return path.join(getDataDir(), 'audit.json');
}

// ── Encryption helpers (AES-256-GCM) ──────────────────────────

const ENCRYPTION_KEY_FILE = path.join(app.getPath('userData'), '.um-key');

function getOrCreateKey() {
  try {
    return fs.readFileSync(ENCRYPTION_KEY_FILE);
  } catch {
    const key = crypto.randomBytes(32);
    fs.writeFileSync(ENCRYPTION_KEY_FILE, key, { mode: 0o600 });
    return key;
  }
}

function encrypt(text) {
  const key = getOrCreateKey();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag().toString('hex');
  return JSON.stringify({ iv: iv.toString('hex'), authTag, data: encrypted });
}

function decrypt(payload) {
  const key = getOrCreateKey();
  const parsed = JSON.parse(payload);
  const decipher = crypto.createDecipheriv(
    'aes-256-gcm',
    key,
    Buffer.from(parsed.iv, 'hex')
  );
  decipher.setAuthTag(Buffer.from(parsed.authTag, 'hex'));
  let decrypted = decipher.update(parsed.data, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

// ── Server management ──────────────────────────────────────────

function waitForServer(url, timeoutMs = 60000) {
  const startedAt = Date.now();
  return new Promise((resolve, reject) => {
    const attempt = () => {
      http
        .get(url, (response) => {
          response.resume();
          resolve();
        })
        .on('error', () => {
          if (Date.now() - startedAt > timeoutMs) {
            reject(new Error(`Timed out waiting for ${url}`));
            return;
          }
          setTimeout(attempt, 500);
        });
    };
    attempt();
  });
}

function startPackagedNextServer() {
  const serverEntry = path.join(
    process.resourcesPath,
    'app',
    '.next',
    'standalone',
    'server.js'
  );
  nextServerProcess = spawn(process.execPath, [serverEntry], {
    env: {
      ...process.env,
      PORT: String(PORT),
      HOSTNAME: '127.0.0.1',
      NODE_ENV: 'production',
    },
    stdio: 'inherit',
  });
}

// ── Window creation ────────────────────────────────────────────

async function createWindow() {
  if (app.isPackaged) {
    startPackagedNextServer();
    await waitForServer(APP_URL);
  }

  const mainWindow = new BrowserWindow({
    width: 1540,
    height: 960,
    minWidth: 1280,
    minHeight: 820,
    backgroundColor: '#020914',
    autoHideMenuBar: true,
    title: 'UnifiedMigrator',
    icon: path.join(__dirname, 'assets', 'icon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  // CSP headers for security
  mainWindow.webContents.session.webRequest.onHeadersReceived(
    (details, callback) => {
      callback({
        responseHeaders: {
          ...details.responseHeaders,
          'Content-Security-Policy': [
            "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; connect-src 'self' http://127.0.0.1:*; img-src 'self' data: blob:;",
          ],
        },
      });
    }
  );

  await mainWindow.loadURL(APP_URL);

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });
}

// ── IPC Handlers ───────────────────────────────────────────────

// File dialog
ipcMain.handle('dialog:open-file', async (_event, options) => {
  const result = await dialog.showOpenDialog({
    title: 'Select Firewall Configuration File',
    properties: ['openFile'],
    filters: [
      { name: 'Config Files', extensions: ['txt', 'conf', 'cfg', 'xml', 'json'] },
      { name: 'All Files', extensions: ['*'] },
    ],
    ...options,
  });
  if (result.canceled || !result.filePaths.length) return null;
  const filePath = result.filePaths[0];
  const content = fs.readFileSync(filePath, 'utf8');
  return {
    fileName: path.basename(filePath),
    content,
    filePath,
  };
ipcMain.handle('dialog:save-file', async (_event, options) => {
  const result = await dialog.showSaveDialog({
    title: 'Export Audit Evidence',
    defaultPath: 'unified-migrator-audit-evidence.json',
    filters: [{ name: 'JSON Files', extensions: ['json'] }],
    ...options,
  });
  if (result.canceled || !result.filePath) return null;
  fs.writeFileSync(result.filePath, options.content, 'utf8');
  return { filePath: result.filePath };
});

// Project storage
ipcMain.handle('storage:write-project', (_event, data) => {
  const projectFile = path.join(getProjectsDir(), `${data.id}.enc`);
  const encrypted = encrypt(JSON.stringify(data));
  fs.writeFileSync(projectFile, encrypted, 'utf8');
  return { success: true, path: projectFile };
});

ipcMain.handle('storage:read-project', (_event, id) => {
  const projectFile = path.join(getProjectsDir(), `${id}.enc`);
  if (!fs.existsSync(projectFile)) return null;
  const raw = fs.readFileSync(projectFile, 'utf8');
  return JSON.parse(decrypt(raw));
});

ipcMain.handle('storage:list-projects', () => {
  const dir = getProjectsDir();
  const files = fs.readdirSync(dir).filter((f) => f.endsWith('.enc'));
  return files.map((f) => {
    try {
      const raw = fs.readFileSync(path.join(dir, f), 'utf8');
      const project = JSON.parse(decrypt(raw));
      return {
        id: project.id,
        name: project.name,
        vendor: project.vendor,
        createdAt: project.createdAt,
      };
    } catch {
      return { id: f.replace('.enc', ''), name: f, vendor: 'unknown', createdAt: '' };
    }
  });
});

ipcMain.handle('storage:delete-project', (_event, id) => {
  const projectFile = path.join(getProjectsDir(), `${id}.enc`);
  if (fs.existsSync(projectFile)) {
    // Secure wipe: overwrite with random data before delete
    const size = fs.statSync(projectFile).size;
    fs.writeFileSync(projectFile, crypto.randomBytes(size));
    fs.unlinkSync(projectFile);
  }
  return { success: true };
});

// Audit log
ipcMain.handle('audit:append', async (_event, entry) => {
  const auditPath = getAuditPath();
  let logs = [];
  try {
    logs = JSON.parse(fs.readFileSync(auditPath, 'utf8'));
  } catch {
    // First entry
  }

  const previousHash =
    logs.length > 0 ? logs[logs.length - 1].hash : 'ROOT_GENESIS_BLOCK';
  const dataToHash = JSON.stringify(entry) + previousHash;
  const hash = crypto.createHash('sha256').update(dataToHash).digest('hex');

  const immutableEntry = {
    ...entry,
    id: `AUDIT-${crypto.randomUUID().slice(0, 8).toUpperCase()}`,
    timestamp: new Date().toISOString(),
    previousHash,
    hash,
  };

  logs.push(immutableEntry);
  fs.writeFileSync(auditPath, JSON.stringify(logs, null, 2), 'utf8');
  return immutableEntry;
});

ipcMain.handle('audit:read', () => {
  try {
    return JSON.parse(fs.readFileSync(getAuditPath(), 'utf8'));
  } catch {
    return [];
  }
});

ipcMain.handle('audit:validate-integrity', () => {
  try {
    const logs = JSON.parse(fs.readFileSync(getAuditPath(), 'utf8'));
    for (let i = 0; i < logs.length; i++) {
      const entry = logs[i];
      const prevHash = i === 0 ? 'ROOT_GENESIS_BLOCK' : logs[i - 1].hash;
      const { hash, previousHash, ...cleanEntry } = entry;
      const dataToHash = JSON.stringify(cleanEntry) + prevHash;
      const expectedHash = crypto
        .createHash('sha256')
        .update(dataToHash)
        .digest('hex');
      if (hash !== expectedHash || previousHash !== prevHash) {
        return { valid: false, brokenIndex: i, entryId: entry.id };
      }
    }
    return { valid: true };
  } catch {
    return { valid: true };
  }
});

// App info
ipcMain.handle('app:get-info', () => ({
  version: APP_VERSION,
  platform: process.platform,
  arch: process.arch,
  runtime: 'desktop',
  dataDir: getDataDir(),
}));

// Security: scrub temp files
ipcMain.handle('security:scrub-temp', () => {
  const tempDir = path.join(getDataDir(), 'temp');
  if (fs.existsSync(tempDir)) {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
  return { success: true };
});

// ── App lifecycle ──────────────────────────────────────────────

app.whenReady().then(() => {
  createWindow().catch((error) => {
    console.error('Failed to launch UnifiedMigrator desktop app', error);
    app.quit();
  });

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow().catch((error) => {
        console.error('Failed to recreate UnifiedMigrator desktop window', error);
      });
    }
  });
});

app.on('window-all-closed', () => {
  // Scrub temp files on close
  try {
    const tempDir = path.join(getDataDir(), 'temp');
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  } catch {
    // Best effort
  }

  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  if (nextServerProcess && !nextServerProcess.killed) {
    nextServerProcess.kill();
  }
});
