# krbase-ksef-generator

Server-side PDF rendering of KSeF **FA(3) invoices** and **UPO**, in the official Ministry of Finance layout.

It is a trimmed build of [CIRFMF/ksef-pdf-generator](https://github.com/CIRFMF/ksef-pdf-generator) (MIT). Upstream is
a browser library with a demo app and generators for FA(1), FA(2), FA_RR and PEF. This package keeps only what the two
documents above need, takes XML as a string instead of a browser `File`, and returns a `Buffer`.

## Use

```ts
import { renderInvoice, renderUpo } from 'krbase-ksef-generator'

const invoicePdf = await renderInvoice(invoiceXml, {
	ksefNumber: '5555555555-20250808-9231003CA67B-BE',
	qrUrl: 'https://qr.ksef.mf.gov.pl/invoice/5555555555/08-08-2025/<SHA-256 of the XML, base64url>',
})
const upoPdf = await renderUpo(upoXml)
```

`dist/index.js` is one self-contained ES module: `pdfmake`, its Roboto fonts and the XML parser are inlined, so the
package has no runtime dependencies. It runs on Node and Bun. `dist/` is committed so that installing from git needs no
build step:

```json
"krbase-ksef-generator": "github:<owner>/krbase-ksef-generator#v1.1.48"
```

On recent Node versions the first import logs one `localStorage is not available` warning. It comes from a browser
polyfill inside `pdfmake` and is harmless.

## Layout

| Path | Whose | What |
| --- | --- | --- |
| `src/lib-public`, `src/shared` | upstream | Copied as they are, never edited here. |
| `src/index.ts` | ours | The two exported functions. |
| `src/i18next.ts` | ours | A small lookup in upstream's Polish labels, standing in for the `i18next` package. |
| `scripts/sync.ts` | ours | Copies the upstream files and drops those the entry does not reach. |
| `scripts/build.ts` | ours | Builds `dist/`. |

## Updating from upstream

```bash
git -C ../ksef-pdf-generator pull
bun run sync ../ksef-pdf-generator
git diff --stat
bun run check && bun run build && bun test
```

`sync` replaces the upstream folders with the new version, deletes every file `src/index.ts` does not reach, and sets
this package's version and `upstream.commit` in `package.json` to upstream's. The version is printed in the PDF footer.
`git diff` then shows exactly what changed in the code this package uses. Commit, tag with the new version, and bump
the tag where the package is installed.

Upstream's unit tests are not kept. `test/render.test.ts` renders upstream's sample invoice and UPO from the built file.
