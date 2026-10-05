// Supprime de _astro les fichiers qu'aucune page, feuille de style ou script ne référence
// (Astro y copie aussi les photos originales). Usage : node scripts/prune-dist.mjs <dossier>
import { readdirSync, readFileSync, statSync, unlinkSync } from 'node:fs';
import { join } from 'node:path';

const dir = process.argv[2] ?? 'dist';
const walk = (d) => readdirSync(d).flatMap((f) => (statSync(join(d, f)).isDirectory() ? walk(join(d, f)) : [join(d, f)]));
const texts = walk(dir).filter((f) => /\.(html|css|js|xml|txt)$/.test(f)).map((f) => readFileSync(f, 'utf8')).join('\n');
let n = 0;
let bytes = 0;
for (const f of walk(join(dir, '_astro'))) {
  const name = f.split('/').pop();
  if (/\.(css|js)$/.test(name) || texts.includes(name)) continue;
  bytes += statSync(f).size;
  unlinkSync(f);
  n++;
}
console.log(`${dir} : ${n} fichiers inutilisés supprimés (${(bytes / 1048576).toFixed(1)} Mo)`);
