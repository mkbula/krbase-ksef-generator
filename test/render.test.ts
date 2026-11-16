// Runs against dist/, the file that ships: bun run build first.
import { expect, test } from 'bun:test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { renderInvoice, renderUpo } from '../dist/index.js';

const fixture = (name: string): string => readFileSync(join(import.meta.dir, 'fixtures', name), 'utf8');
const isPdf = (pdf: Buffer): boolean => pdf.subarray(0, 5).toString() === '%PDF-' && pdf.length > 10_000;

test('renders an FA(3) invoice', async () => {
  const pdf = await renderInvoice(fixture('invoice.xml'), {
    ksefNumber: '5555555555-20250808-9231003CA67B-BE',
    qrUrl: 'https://qr-test.ksef.mf.gov.pl/invoice/5555555555/08-08-2025/abc',
  });

  expect(isPdf(pdf)).toBe(true);
});

test('the QR code section is optional', async () => {
  const withQr = await renderInvoice(fixture('invoice.xml'), { ksefNumber: 'X', qrUrl: 'https://example.com' });
  const without = await renderInvoice(fixture('invoice.xml'), { ksefNumber: 'X' });

  expect(isPdf(without)).toBe(true);
  expect(without.length).toBeLessThan(withQr.length);
});

test('renders a UPO', async () => {
  expect(isPdf(await renderUpo(fixture('upo.xml')))).toBe(true);
});

test('rejects what it cannot draw', async () => {
  expect(renderInvoice(fixture('upo.xml'), { ksefNumber: 'X' })).rejects.toThrow('Only FA (3)');
  expect(renderUpo(fixture('invoice.xml'))).rejects.toThrow('Not a KSeF UPO');
});
