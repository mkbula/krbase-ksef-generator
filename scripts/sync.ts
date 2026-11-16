// Refreshes the upstream code: bun run sync <path to a checkout of CIRFMF/ksef-pdf-generator>
// Copies upstream's src/lib-public and src/shared as they are, then deletes every file src/index.ts does not reach.
import { $ } from 'bun';
import { cpSync, readdirSync, readFileSync, rmdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const UPSTREAM_DIRS = ['lib-public', 'shared'];
const FIXTURES = ['invoice.xml', 'upo.xml'];

const upstream = process.argv[2] && resolve(process.argv[2]);

if (!upstream) {
  throw new Error('usage: bun run sync <path to a checkout of CIRFMF/ksef-pdf-generator>');
}
const root = resolve(import.meta.dir, '..');

for (const dir of UPSTREAM_DIRS) {
  rmSync(join(root, 'src', dir), { recursive: true, force: true });
  cpSync(join(upstream, 'src', dir), join(root, 'src', dir), { recursive: true });
}
cpSync(join(upstream, 'LICENSE'), join(root, 'LICENSE'));
for (const file of FIXTURES) {
  cpSync(join(upstream, 'assets', file), join(root, 'test', 'fixtures', file));
}

// the version is printed in the PDF footer, so it follows upstream's
const pkgPath = join(root, 'package.json');
const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'));

pkg.version = JSON.parse(readFileSync(join(upstream, 'package.json'), 'utf8')).version;
pkg.upstream.commit = (await $`git -C ${upstream} rev-parse HEAD`.text()).trim();
writeFileSync(pkgPath, `${JSON.stringify(pkg, null, '\t')}\n`);

// tsc lists every file the entry reaches, type-only imports included
const reached = new Set((await $`bunx tsc --listFilesOnly`.cwd(root).nothrow().text()).split('\n'));
let kept = 0;

function prune(dir: string): void {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);

    if (statSync(path).isDirectory()) {
      prune(path);
    } else if (reached.has(path)) {
      kept++;
    } else {
      rmSync(path);
    }
  }
  if (readdirSync(dir).length === 0) {
    rmdirSync(dir);
  }
}

for (const dir of UPSTREAM_DIRS) {
  prune(join(root, 'src', dir));
}
if (kept === 0) {
  throw new Error('tsc reached no upstream file – run bun install first, then sync again');
}
console.log(`upstream ${pkg.version} (${pkg.upstream.commit.slice(0, 7)}): kept ${kept} files`);
