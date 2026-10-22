// Builds the ThemeForest package:
//   dist/orbe.zip            installable theme (includes plugins/orbe-core.zip for TGMPA)
//   dist/orbe-core.zip       companion plugin
import { execFileSync } from 'node:child_process';
import { mkdirSync, rmSync } from 'node:fs';

const zip = (cwd, out, folder) =>
  execFileSync('zip', ['-rqX', out, folder, '-x', '*.DS_Store', '*/node_modules/*'], { cwd, stdio: 'inherit' });

rmSync('dist', { recursive: true, force: true });
mkdirSync('dist');
rmSync('orbe/plugins/orbe-core.zip', { force: true });

zip('.', 'orbe/plugins/orbe-core.zip', 'orbe-core');
zip('.', 'dist/orbe-core.zip', 'orbe-core');
zip('.', 'dist/orbe.zip', 'orbe');
console.log('dist/orbe.zip and dist/orbe-core.zip ready');
