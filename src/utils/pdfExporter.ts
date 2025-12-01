// PDF export utility
import { Transcript } from "../types";

export const exportTranscriptToPDF = async (transcript: Transcript): Promise<void> => {
  try {
    // Dynamic import to avoid chunk loading issues
    const jsPDFModule = await import("jspdf");
    const jsPDF = jsPDFModule.default;
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    const maxWidth = pageWidth - margin * 2;

    // Set font
    doc.setFont("helvetica");

    // Title
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text(transcript.title, margin, margin + 10);

    // Date and metadata
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    const date = new Date(transcript.timestamp).toLocaleString();
    doc.text(`Generated: ${date}`, margin, margin + 20);

    if (transcript.language) {
      doc.text(`Language: ${transcript.language}`, margin, margin + 27);
    }

    if (transcript.speakers) {
      doc.text("Multi-speaker transcript", margin, margin + 34);
    }

    // Content
    doc.setFontSize(12);
    const startY = margin + 45;
    const lineHeight = 7;

    // Split content into lines that fit the page width
    const lines = doc.splitTextToSize(transcript.content, maxWidth);

    let currentY = startY;
    const maxY = pageHeight - margin;

    for (let i = 0; i < lines.length; i++) {
      if (currentY + lineHeight > maxY) {
        doc.addPage();
        currentY = margin;
      }

      doc.text(lines[i], margin, currentY);
      currentY += lineHeight;
    }

    // Save the PDF
    const fileName = `${transcript.title
      .replace(/[^a-z0-9]/gi, "_")
      .toLowerCase()}_transcript.pdf`;
    doc.save(fileName);
  } catch (error) {
    throw new Error("Failed to export PDF. Please try again.");
  }
};

export const formatTimestamp = (timestamp: string): string => {
  const date = new Date(timestamp);
  return date.toLocaleString();
};

export const calculateDuration = (
  startTime: string,
  endTime: string
): string => {
  const start = new Date(startTime).getTime();
  const end = new Date(endTime).getTime();
  const durationMs = end - start;

  const minutes = Math.floor(durationMs / 60000);
  const seconds = Math.floor((durationMs % 60000) / 1000);

  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
};

export const generateTranscriptTitle = (): string => {
  const now = new Date();
  const dateStr = now.toLocaleDateString();
  const timeStr = now.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
  return `Transcript - ${dateStr} ${timeStr}`;
};
