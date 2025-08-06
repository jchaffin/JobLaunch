"use client";

import React from "react";

type Props = {
  pdfUrl?: string;
  height?: number;
  filename?: string;
};

const SimplePDFViewer: React.FC<Props> = ({
  pdfUrl,
  height = 720,
  filename = "resume-preview.pdf",
}) => {
  const download = () => {
    if (!pdfUrl) return;
    const a = document.createElement("a");
    a.href = pdfUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  if (!pdfUrl) return <p>No PDF to display.</p>;

  return (
    <div className="w-full h-full">
      <iframe
        src={pdfUrl}
        width="100%"
        height="100%"
        title="PDF Preview"
        className="border-0 rounded-lg"
      />
    </div>
  );
};

export default SimplePDFViewer;