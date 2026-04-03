const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('unifiedMigratorDesktop', {
  // Runtime detection
  runtime: 'desktop',
  platform: process.platform,
  version: '1.0.0',

  // File dialog
  openFileDialog: (options) => ipcRenderer.invoke('dialog:open-file', options),
  saveFileDialog: (options) => ipcRenderer.invoke('dialog:save-file', options),

  // Encrypted project storage
  saveProject: (data) => ipcRenderer.invoke('storage:write-project', data),
  loadProject: (id) => ipcRenderer.invoke('storage:read-project', id),
  listProjects: () => ipcRenderer.invoke('storage:list-projects'),
  deleteProject: (id) => ipcRenderer.invoke('storage:delete-project', id),

  // Tamper-evident audit log
  appendAudit: (event) => ipcRenderer.invoke('audit:append', event),
  readAudit: () => ipcRenderer.invoke('audit:read'),
  validateAuditIntegrity: () => ipcRenderer.invoke('audit:validate-integrity'),

  // App info
  getAppInfo: () => ipcRenderer.invoke('app:get-info'),

  // Security
  scrubTemp: () => ipcRenderer.invoke('security:scrub-temp'),
});
