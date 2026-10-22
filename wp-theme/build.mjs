// Bundles orbe/src/js into orbe/assets/js (minified). The unminified sources ship in orbe/src.
import * as esbuild from 'esbuild';

const watch = process.argv.includes('--watch');
const options = {
  entryPoints: { main: 'orbe/src/js/main.js', webgl: 'orbe/src/js/webgl.js' },
  outdir: 'orbe/assets/js',
  bundle: true,
  minify: true,
  format: 'iife',
  target: ['es2020'],
  legalComments: 'eof',
  logLevel: 'info',
};

if (watch) {
  const ctx = await esbuild.context(options);
  await ctx.watch();
} else {
  await esbuild.build(options);
}
