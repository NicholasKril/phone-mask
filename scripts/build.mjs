import { build } from 'esbuild';
import { mkdir, copyFile, readFile, writeFile } from 'node:fs/promises';

await mkdir('dist', { recursive: true });
const banner = '/*! PhoneMask v2.0.0 | Nicholas Kril | MIT | Includes libphonenumber-js; see THIRD_PARTY_NOTICES.txt */';
const common = { bundle: true, target: ['es2020'], legalComments: 'eof', banner: { js: banner } };
await Promise.all([
  build({ ...common, entryPoints: ['src/browser.js'], outfile: 'dist/phone-mask.js', format: 'iife' }),
  build({ ...common, entryPoints: ['src/browser.js'], outfile: 'dist/phone-mask.min.js', format: 'iife', minify: true }),
  build({ ...common, entryPoints: ['src/phone-mask.js'], outfile: 'dist/phone-mask.mjs', format: 'esm' }),
  build({ ...common, entryPoints: ['src/phone-mask.js'], outfile: 'dist/phone-mask.cjs', format: 'cjs' }),
  build({ ...common, entryPoints: ['src/core.js'], outfile: 'dist/core.mjs', format: 'esm' }),
  build({ ...common, entryPoints: ['src/core.js'], outfile: 'dist/core.cjs', format: 'cjs' }),
  copyFile('src/phone-mask.css', 'dist/phone-mask.css'),
  copyFile('src/phone-mask.d.ts', 'dist/phone-mask.d.ts'),
  copyFile('src/core.d.ts', 'dist/core.d.ts'),
  copyFile('src/core.d.ts', 'dist/core.d.cts'),
]);
await writeFile('dist/phone-mask.d.cts', (await readFile('src/phone-mask.d.ts', 'utf8')).replaceAll('./core.js', './core.cjs'));
const mit = await readFile('node_modules/libphonenumber-js/LICENSE', 'utf8');
const apache = await readFile('node_modules/libphonenumber-js/LICENSE.Apache', 'utf8');
await writeFile('dist/THIRD_PARTY_NOTICES.txt', 'libphonenumber-js\nhttps://github.com/catamphetamine/libphonenumber-js\n\n' + mit + '\n\nPhone metadata is derived from Google libphonenumber (Apache-2.0).\n\n' + apache);
