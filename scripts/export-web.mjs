// Exports the web build to dist/ ready for static hosts. Metro puts library assets (the
// SQLite wasm, the fonts) under assets/node_modules/, and hosts like Netlify skip any folder
// named node_modules when deploying, so the app could not open its database. This moves them
// to assets/vendor/ and rewrites the references.
import { execSync } from 'node:child_process';
import {
  existsSync,
  readFileSync,
  readdirSync,
  renameSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { extname, join, resolve } from 'node:path';

const out = resolve(process.argv[2] ?? 'dist');
execSync(`npx expo export --platform web --output-dir "${out}"`, { stdio: 'inherit' });

const from = join(out, 'assets', 'node_modules');
if (existsSync(from)) renameSync(from, join(out, 'assets', 'vendor'));

function* files(dir) {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) yield* files(path);
    else if (['.js', '.html', '.json', '.css'].includes(extname(path))) yield path;
  }
}

let rewritten = 0;
for (const file of files(out)) {
  const text = readFileSync(file, 'utf8');
  const next = text.replaceAll('/assets/node_modules/', '/assets/vendor/');
  if (next !== text) {
    writeFileSync(file, next);
    rewritten += 1;
  }
}
console.log(`Moved assets/node_modules to assets/vendor (${rewritten} files rewritten).`);
