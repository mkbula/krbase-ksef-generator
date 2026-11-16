// Builds dist/: one self-contained ES module (pdfmake, its fonts and the XML parser inlined) plus the entry's types.
import { $ } from 'bun';
import { cpSync, rmSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(import.meta.dir, '..');

process.chdir(root);
rmSync('dist', { recursive: true, force: true });

const result = await Bun.build({ entrypoints: ['src/index.ts'], outdir: 'dist', target: 'node', format: 'esm' });

if (!result.success) {
  console.error(result.logs);
  process.exit(1);
}

// tsc writes a declaration for every source file; only the entry's belongs in the package
await $`bunx tsc --noEmit false --declaration --emitDeclarationOnly --rootDir . --outDir .types`;
cpSync('.types/src/index.d.ts', 'dist/index.d.ts');
rmSync('.types', { recursive: true });
