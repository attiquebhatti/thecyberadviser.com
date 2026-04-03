import { spawn } from 'node:child_process';
import http from 'node:http';

const port = process.env.UNIFIED_MIGRATOR_DESKTOP_PORT || '3030';
const appUrl = `http://127.0.0.1:${port}`;
const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const electronBinary = process.platform === 'win32' ? '.\\node_modules\\.bin\\electron.cmd' : './node_modules/.bin/electron';

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

const nextProcess = spawn(npmCommand, ['run', 'dev', '--', '-p', port], {
  stdio: 'inherit',
  env: {
    ...process.env,
    PORT: port,
  },
  shell: false,
});

const cleanup = () => {
  if (!nextProcess.killed) {
    nextProcess.kill();
  }
};

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
process.on('exit', cleanup);

await waitForServer(appUrl);

const electronProcess = spawn(electronBinary, ['.'], {
  stdio: 'inherit',
  env: {
    ...process.env,
    UNIFIED_MIGRATOR_DESKTOP_URL: appUrl,
    UNIFIED_MIGRATOR_DESKTOP_PORT: port,
  },
  shell: false,
});

electronProcess.on('exit', (code) => {
  cleanup();
  process.exit(code || 0);
});
