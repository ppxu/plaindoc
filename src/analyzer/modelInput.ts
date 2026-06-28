import type { AnalysisReport } from "../types";

export const MAX_MODEL_DOCUMENT_CHARS = 12000;

export interface PreparedModelDocumentText {
  text: string;
  originalLength: number;
  sentLength: number;
  truncated: boolean;
}

export function prepareModelDocumentText(text: string): PreparedModelDocumentText {
  const preparedText = text.slice(0, MAX_MODEL_DOCUMENT_CHARS);
  return {
    text: preparedText,
    originalLength: text.length,
    sentLength: preparedText.length,
    truncated: text.length > preparedText.length
  };
}

export function prepareModelBaseline(report: AnalysisReport, preparedDocument: PreparedModelDocumentText) {
  return {
    summary: report.summary,
    status: report.status,
    score: report.score,
    facts: report.facts.map((fact) => ({
      label: fact.label,
      confidence: fact.confidence,
      value: shouldIncludeFactValue(fact.evidence, preparedDocument) ? fact.value : undefined
    })),
    findings: report.findings.map(({ evidence, ...finding }) => finding),
    checklist: report.checklist,
    actionPlan: report.actionPlan,
    plainLanguage: report.plainLanguage
  };
}

function shouldIncludeFactValue(
  evidence: AnalysisReport["facts"][number]["evidence"],
  preparedDocument: PreparedModelDocumentText
): boolean {
  if (!evidence) {
    return !preparedDocument.truncated;
  }
  return evidence.end <= preparedDocument.sentLength;
}
