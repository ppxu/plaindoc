import type { EvidenceSnippet } from "../types";

export type EvidenceSelectionResult =
  | { ok: true; start: number; end: number }
  | { ok: false; reason: "missing_text" | "stale_evidence" };

export function resolveEvidenceSelection(text: string, evidence: EvidenceSnippet): EvidenceSelectionResult {
  if (!text) {
    return { ok: false, reason: "missing_text" };
  }

  if (isMatchingRange(text, evidence)) {
    return { ok: true, start: evidence.start, end: evidence.end };
  }

  const fallbackStart = text.indexOf(evidence.text);
  if (fallbackStart >= 0) {
    return { ok: true, start: fallbackStart, end: fallbackStart + evidence.text.length };
  }

  return { ok: false, reason: "stale_evidence" };
}

function isMatchingRange(text: string, evidence: EvidenceSnippet): boolean {
  return (
    evidence.start >= 0 &&
    evidence.end > evidence.start &&
    evidence.end <= text.length &&
    normalizeSnippet(text.slice(evidence.start, evidence.end)) === normalizeSnippet(evidence.text)
  );
}

function normalizeSnippet(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}
