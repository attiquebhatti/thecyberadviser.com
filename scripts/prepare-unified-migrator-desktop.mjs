import { cpSync, existsSync, mkdirSync } from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const standaloneDir = path.join(root, '.next', 'standalone');
const staticSource = path.join(root, '.next', 'static');
const staticTarget = path.join(standaloneDir, '.next', 'static');
const publicSource = path.join(root, 'public');
const publicTarget = path.join(standaloneDir, 'public');

if (!existsSync(standaloneDir)) {
  throw new Error('Next standalone build was not found. Run `npm run build` before packaging the desktop app.');
}

mkdirSync(path.dirname(staticTarget), { recursive: true });
mkdirSync(publicTarget, { recursive: true });

if (existsSync(staticSource)) {
  cpSync(staticSource, staticTarget, { recursive: true, force: true });
}

if (existsSync(publicSource)) {
  cpSync(publicSource, publicTarget, { recursive: true, force: true });
}

console.log('Prepared UnifiedMigrator desktop bundle at .next/standalone');
