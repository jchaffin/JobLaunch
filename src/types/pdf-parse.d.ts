declare module 'pdf-parse' {
  interface PDFData {
    numpages: number;
    numrender: number;
    info: any;
    metadata: any;
    text: string;
    version: string;
  }

  interface PDFOptions {
    pagerender?: (pageData: any) => Promise<string>;
    max?: number;
    version?: string;
    normalizeWhitespace?: boolean;
    disableCombineTextItems?: boolean;
  }

  function pdfParse(dataBuffer: Buffer, options?: PDFOptions): Promise<PDFData>;
  export default pdfParse;
}