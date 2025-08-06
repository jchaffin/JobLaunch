"use client";

import React, { useMemo, useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";
import type { PDFDocumentProxy } from "pdfjs-dist";

// Use local worker file
pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';

const options = {
  cMapUrl: "/cmaps/",
  standardFontDataUrl: "/standard_fonts/",
  wasmUrl: "/wasm/",
};

type Props = {
  pdfUrl?: string;
  height?: number;
  filename?: string;
  scale?: number;
};

const ResumePDFViewer: React.FC<Props> = ({
  pdfUrl,
  height = 720,
  filename = "resume-preview.pdf",
  scale: initialScale = 1.0,
}) => {
const [numPages, setNumPages] = useState<number>(0);
  const [page, setPage] = useState<number>(1);
  const [scale, setScale] = useState<number>(initialScale);

  const [error, setError] = useState<string | null>(null);

  const canPrev = page > 1;
  const canNext = page < numPages;

  const onDocLoad = ({ numPages: nextNumPages }: PDFDocumentProxy): void => {
    setNumPages(nextNumPages);
    setPage(1);
  };
  const download = () => {
    if (!pdfUrl) return;
    const a = document.createElement("a");
    a.href = pdfUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  const controls = useMemo(
    () => (
      <div className="flex items-center gap-2 mb-3">
        <button
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={!canPrev}
          className="px-3 py-1 border rounded disabled:opacity-50"
        >
          Prev
        </button>
        <span className="text-sm tabular-nums">
          {page} / {numPages || "—"}
        </span>
        <button
          onClick={() => setPage((p) => Math.min(numPages, p + 1))}
          disabled={!canNext}
          className="px-3 py-1 border rounded disabled:opacity-50"
        >
          Next
        </button>

        <div className="mx-3 h-6 w-px bg-gray-300" />

        <button
          onClick={() => setScale((s) => Math.max(0.5, s - 0.1))}
          className="px-3 py-1 border rounded"
        >
          −
        </button>
        <span className="text-sm tabular-nums">{Math.round(scale * 100)}%</span>
        <button
          onClick={() => setScale((s) => Math.min(3, s + 0.1))}
          className="px-3 py-1 border rounded"
        >
          +
        </button>

        <div className="mx-3 h-6 w-px bg-gray-300" />

        <button onClick={download} className="px-3 py-1 border rounded">
          Download
        </button>
      </div>
    ),
    [page, numPages, scale, canPrev, canNext, pdfUrl],
  );

  if (error) return <p className="text-red-600">Error: {error}</p>;
  if (!pdfUrl) return <p>No PDF to display.</p>;

  return (
    <div>
      {controls}
      <div
        style={{ height, overflow: "auto", border: "1px solid #e5e7eb" }}
        className="rounded"
      >
        <Document
          file={pdfUrl}
          onLoadSuccess={onDocLoad}
          onLoadError={(e: Error) =>
            setError(`Failed to load PDF: ${e.message}`)
          }
          loading={<div className="p-4">Loading document…</div>}
          error={
            <div className="p-4 text-red-600">Failed to load document.</div>
          }
          noData={<div className="p-4">No PDF data.</div>}
          options={options}
        >
          <Page
            pageNumber={page}
            scale={scale}
            renderTextLayer
            renderAnnotationLayer
          />
        </Document>
      </div>
    </div>
  );
};

export default ResumePDFViewer;
