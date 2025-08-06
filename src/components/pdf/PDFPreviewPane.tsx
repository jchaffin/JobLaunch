"use client";

import { useEffect, useRef, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  Download,
  Loader2,
  FileText,
  ZoomOut,
  ZoomIn,
  RefreshCw,
} from "lucide-react";
import dynamic from "next/dynamic";

const PDFViewer = dynamic(() => import("@/components/pdf/SimplePDFViewer"), {
  ssr: false,
  loading: () => (
    <div className="p-4 text-sm text-gray-600">Loading viewer…</div>
  ),
});

// util: safe JSON-or-text error parsing
async function parseError(response: Response) {
  try {
    const j = await response.json();
    return j?.error ?? `HTTP ${response.status}`;
  } catch {
    try {
      return await response.text();
    } catch {
      return `HTTP ${response.status}`;
    }
  }
}

type ResumeData = Record<string, unknown>;

const generatePDFFromResumeData = async (
  resumeData: ResumeData,
  jobDescription?: string,
  signal?: AbortSignal,
): Promise<{ pdfUrl: string; blob: Blob }> => {
  const response = await fetch("/api/resume/generate-pdf", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ resumeData, jobDescription }),
    signal,
  });

  if (!response.ok) {
    throw new Error(await parseError(response));
  }

  const blob = await response.blob();
  if (blob.size === 0) throw new Error("Received empty PDF file");

  return { pdfUrl: URL.createObjectURL(blob), blob };
};

export default function PDFPreviewPane({
  resumeData,
  jobDescription,
}: {
  resumeData: ResumeData;
  jobDescription?: string;
}) {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [scale, setScale] = useState(1.0);

  const { toast } = useToast();
  const requestIdRef = useRef(0);
  const abortRef = useRef<AbortController | null>(null);
  const lastUrlRef = useRef<string | null>(null);

  // revoke previous object URL
  const setObjectUrl = (url: string | null) => {
    if (lastUrlRef.current) URL.revokeObjectURL(lastUrlRef.current);
    lastUrlRef.current = url ?? null;
    setPdfUrl(url);
  };

  const generatePDF = async () => {
    if (!resumeData) return;
    setIsGenerating(true);
    setErrorMessage("");

    // cancel in-flight
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    const id = ++requestIdRef.current;
    try {
      const { pdfUrl: nextUrl } = await generatePDFFromResumeData(
        resumeData,
        jobDescription,
        controller.signal,
      );
      // ignore stale responses
      if (id !== requestIdRef.current) return;
      setObjectUrl(nextUrl);
      toast({ title: "PDF generated", description: "Resume PDF is ready." });
    } catch (err) {
      if ((err as any)?.name === "AbortError") return;
      const msg = err instanceof Error ? err.message : "Unknown error";
      setErrorMessage(msg);
      toast({
        title: "Preview generation failed",
        description: msg,
        variant: "destructive",
      });
    } finally {
      if (id === requestIdRef.current) setIsGenerating(false);
    }
  };

  const downloadPDF = () => {
    if (!pdfUrl) return;
    const a = document.createElement("a");
    a.href = pdfUrl;
    a.download = "resume-preview.pdf";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  useEffect(() => {
    if (resumeData) generatePDF();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resumeData, jobDescription]);

  useEffect(() => {
    return () => {
      if (abortRef.current) abortRef.current.abort();
      if (lastUrlRef.current) URL.revokeObjectURL(lastUrlRef.current);
    };
  }, []);

  return (
    <div
      className="w-full h-full flex flex-col overflow-hidden bg-gray-50"
      id="preview-panel-container"
    >
      <Card className="h-full flex flex-col shadow-none border-none">
        <CardHeader className="pb-3 px-4 py-3 bg-white border-b">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Resume Preview
            </CardTitle>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setScale((s) => Math.max(0.5, s - 0.1))}
                disabled={!pdfUrl}
                className="h-8 px-2 text-xs"
              >
                <ZoomOut className="h-3 w-3" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setScale((s) => Math.min(2, s + 0.1))}
                disabled={!pdfUrl}
                className="h-8 px-2 text-xs"
              >
                <ZoomIn className="h-3 w-3" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={generatePDF}
                disabled={isGenerating || !resumeData}
                className="h-8 px-3 text-xs"
              >
                {isGenerating ? (
                  <Loader2 className="h-3 w-3 animate-spin mr-1" />
                ) : (
                  <RefreshCw className="h-3 w-3 mr-1" />
                )}
                {isGenerating ? "Generating..." : "Refresh"}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={downloadPDF}
                disabled={!pdfUrl || isGenerating}
                className="h-8 px-3 text-xs"
              >
                <Download className="h-3 w-3 mr-1" />
                Download
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="flex-1 p-0 overflow-auto">
          <div className="w-full h-full flex flex-col items-center bg-gray-100 p-4">
            {errorMessage ? (
              <div className="m-4 p-4 border border-red-200 bg-red-50 rounded-lg">
                <p className="text-red-800 text-sm">{errorMessage}</p>
              </div>
            ) : isGenerating ? (
              <div className="flex flex-col items-center justify-center h-full">
                <Loader2 className="h-8 w-8 animate-spin mb-4" />
                <p className="text-gray-600">Generating PDF...</p>
              </div>
            ) : pdfUrl ? (
              // Ensure your ResumePDFViewer supports these props. Add `scale` if missing.
              <div className="w-full" style={{ height: 720 }}>
                <PDFViewer
                  pdfUrl={pdfUrl}
                  height={720}
                  filename="resume-preview.pdf"
                />
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-gray-500">
                <FileText className="h-12 w-12 mb-4" />
                <p>Upload or edit your resume to see preview</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
