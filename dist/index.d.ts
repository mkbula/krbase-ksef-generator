export interface InvoiceOptions {
    ksefNumber: string;
    /** The KSeF verification link. The QR code section is drawn only when it is given. */
    qrUrl?: string;
}
export declare function renderInvoice(xml: string, options: InvoiceOptions): Promise<Buffer>;
export declare function renderUpo(xml: string): Promise<Buffer>;
