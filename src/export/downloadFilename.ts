import { getDocumentKindLabel } from "../data/documentKinds";
import type { AnalysisReport } from "../types";

export function buildReportMarkdownFilename(report: AnalysisReport): string {
  return ["plaindoc", sanitizeFilenamePart(getDocumentKindLabel(report.documentKind)), formatReportTimestamp(report.generatedAt)]
    .filter(Boolean)
    .join("-")
    .concat(".md");
}

function formatReportTimestamp(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "unknown-date";
  }
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hour = pad(date.getHours());
  const minute = pad(date.getMinutes());
  return `${year}-${month}-${day}-${hour}${minute}`;
}

function sanitizeFilenamePart(value: string): string {
  return value
    .trim()
    .replace(/[\\/:*?"<>|]+/g, "-")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function pad(value: number): string {
  return String(value).padStart(2, "0");
}
