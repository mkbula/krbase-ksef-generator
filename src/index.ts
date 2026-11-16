import i18n from 'i18next';
import pdfMake from 'pdfmake/build/pdfmake';
import { TDocumentDefinitions } from 'pdfmake/interfaces';
import { xml2js } from 'xml-js';
import { generateFA3 } from './lib-public/FA3-generator';
import { generateDokumentUPO } from './lib-public/generators/UPO4_3/Dokumenty';
import { generateNaglowekUPO } from './lib-public/generators/UPO4_3/Naglowek';
import { Faktura } from './lib-public/types/fa3.types';
import { Upo } from './lib-public/types/upo-v4_2.types';
import { Position } from './shared/enums/common.enum';
import { generateStyle } from './shared/PDF-functions';

export interface InvoiceOptions {
  ksefNumber: string;
  /** The KSeF verification link. The QR code section is drawn only when it is given. */
  qrUrl?: string;
}

const stripPrefix = (name: string): string => (name.includes(':') ? name.split(':')[1] : name);

// same options as upstream's parseXML, which reads a browser File and so cannot run on a server
function parse(xml: string): any {
  return xml2js(xml, {
    compact: true,
    cdataKey: '_text',
    trim: true,
    elementNameFn: stripPrefix,
    attributeNameFn: stripPrefix,
  });
}

export async function renderInvoice(xml: string, options: InvoiceOptions): Promise<Buffer> {
  const invoice: Faktura | undefined = parse(xml).Faktura;
  const form: string | undefined = (invoice?.Naglowek?.KodFormularza as any)?._attributes?.kodSystemowy;

  if (!invoice || form !== 'FA (3)') {
    throw new Error(`Only FA (3) invoices are supported, got: ${form}`);
  }
  return generateFA3(invoice, { nrKSeF: options.ksefNumber, qrCode: options.qrUrl }).getBuffer();
}

// the document definition of upstream's generatePDFUPO, which is tied to the browser File parser
export async function renderUpo(xml: string): Promise<Buffer> {
  const upo: Upo = parse(xml);

  if (!upo.Potwierdzenie) {
    throw new Error('Not a KSeF UPO document');
  }
  const docDefinition: TDocumentDefinitions = {
    content: [generateNaglowekUPO(upo.Potwierdzenie), generateDokumentUPO(upo.Potwierdzenie)],
    ...generateStyle(),
    pageSize: 'A4',
    pageOrientation: 'landscape',
    footer: (currentPage: number, pageCount: number) => ({
      text: `${currentPage} ${i18n.t('invoice.footer.pagesTotal')} ${pageCount}`,
      alignment: Position.RIGHT,
      margin: [0, 0, 20, 0],
    }),
  };

  return pdfMake.createPdf(docDefinition).getBuffer();
}
