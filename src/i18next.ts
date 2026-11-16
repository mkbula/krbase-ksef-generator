import { pl } from './lib-public/i18n/lang/pl';

// Stands in for the i18next package: upstream only calls t(key) with {{name}} placeholders, and this build is Polish only.
function t(key: string, vars: Record<string, unknown> = {}): string {
  let node: unknown = pl;

  for (const part of key.split('.')) {
    node = (node as Record<string, unknown> | undefined)?.[part];
  }
  if (typeof node !== 'string') {
    return key;
  }
  return node.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, name: string) => String(vars[name] ?? ''));
}

export default { t };
