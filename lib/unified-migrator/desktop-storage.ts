/**
 * UnifiedMigrator Desktop Storage Provider
 * 
 * Bridges the Next.js frontend to the Electron IPC for secure,
 * air-gapped encrypted local storage and tamper-evident audit logging.
 * Falls back to localStorage and console.log when running in hosted web mode.
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const getDesktopApi = (): any => {
  if (typeof window !== 'undefined' && 'unifiedMigratorDesktop' in window) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (window as any).unifiedMigratorDesktop;
  }
  return null;
};

export const isDesktopMode = () => getDesktopApi() !== null;

// ── Project Storage ──────────────────────────────────────────

export async function saveProjectLocally(data: any): Promise<boolean> {
  const api = getDesktopApi();
  if (api) {
    try {
      await api.saveProject(data);
      return true;
    } catch (err) {
      console.error('Desktop save error:', err);
      return false;
    }
  } else {
    // Hosted mode fallback (demo only, production uses cloud DB)
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(`um_project_${data.id}`, JSON.stringify(data));
        return true;
      } catch (e) {
        console.error('LocalStorage save error:', e);
        return false;
      }
    }
  }
  return false;
}

export async function listProjectsLocally(): Promise<any[]> {
  const api = getDesktopApi();
  if (api) {
    return await api.listProjects();
  } else {
    if (typeof window !== 'undefined') {
      const projects = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith('um_project_')) {
          projects.push(JSON.parse(localStorage.getItem(key) || '{}'));
        }
      }
      return projects;
    }
  }
  return [];
}

export async function loadProjectLocally(id: string): Promise<any | null> {
  const api = getDesktopApi();
  if (api) {
    return await api.loadProject(id);
  } else {
    if (typeof window !== 'undefined') {
      const raw = localStorage.getItem(`um_project_${id}`);
      return raw ? JSON.parse(raw) : null;
    }
  }
  return null;
}

// ── Audit Logging ────────────────────────────────────────────

export async function appendAuditLog(action: string, details: any, userId: string = 'system'): Promise<void> {
  const event = {
    action,
    details,
    userId,
    userAgent: typeof window !== 'undefined' ? navigator.userAgent : 'unknown',
  };

  const api = getDesktopApi();
  if (api) {
    await api.appendAudit(event);
  } else {
    // Hosted mode fallback (would normally hit Next.js API route)
    console.log('[AUDIT LOG]', event);
  }
}

export async function getAuditLog(): Promise<any[]> {
  const api = getDesktopApi();
  if (api) {
    return await api.readAudit();
  }
  return [];
}

export async function exportAuditEvidence(): Promise<boolean> {
  const api = getDesktopApi();
  if (api) {
    const logs = await api.readAudit();
    const result = await api.saveFileDialog({
      content: JSON.stringify(logs, null, 2),
      title: 'Export Cryptographic Audit Evidence',
      defaultPath: `unified-migrator-audit-${Date.now()}.json`,
    });
    return !!result;
  }
  return false;
}
