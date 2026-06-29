import type { EvidenceSnippet } from "../types";

export type EvidenceSelectionResult =
  | { ok: true; start: number; end: number; match: "exact" | "paragraph" }
  | { ok: false; reason: "missing_text" | "stale_evidence" };

export function resolveEvidenceSelection(text: string, evidence: EvidenceSnippet): EvidenceSelectionResult {
  if (!text) {
    return { ok: false, reason: "missing_text" };
  }

  if (isMatchingRange(text, evidence)) {
    return { ok: true, start: evidence.start, end: evidence.end, match: "exact" };
  }

  const fallbackStart = text.indexOf(evidence.text);
  if (fallbackStart >= 0) {
    return { ok: true, start: fallbackStart, end: fallbackStart + evidence.text.length, match: "exact" };
  }

  const paragraphMatch = findClosestParagraph(text, evidence);
  if (paragraphMatch) {
    return { ok: true, start: paragraphMatch.start, end: paragraphMatch.end, match: "paragraph" };
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

function findClosestParagraph(text: string, evidence: EvidenceSnippet): { start: number; end: number } | null {
  const evidenceGrams = createSearchGrams(evidence.text);
  if (evidenceGrams.length < 4) return null;

  const threshold = Math.max(4, Math.min(10, Math.ceil(evidenceGrams.length * 0.12)));
  let best: { start: number; end: number; overlap: number; score: number } | null = null;

  for (const paragraph of getParagraphRanges(text)) {
    const normalizedParagraph = normalizeForSearch(paragraph.text);
    const score = evidenceGrams.reduce((total, gram) => total + (normalizedParagraph.includes(gram) ? gram.length - 1 : 0), 0);
    const overlap = getRangeOverlap(paragraph.start, paragraph.end, evidence.start, evidence.end);
    if (score >= threshold && (!best || overlap > best.overlap || (overlap === best.overlap && score > best.score))) {
      best = { start: paragraph.start, end: paragraph.end, overlap, score };
    }
  }

  return best ? { start: best.start, end: best.end } : null;
}

function getParagraphRanges(text: string): Array<{ text: string; start: number; end: number }> {
  const paragraphs: Array<{ text: string; start: number; end: number }> = [];
  const paragraphPattern = /\S[\s\S]*?(?=\n\s*\n|$)/g;
  let match: RegExpExecArray | null;

  while ((match = paragraphPattern.exec(text))) {
    const rawText = match[0];
    const leadingWhitespace = rawText.search(/\S/);
    const trailingWhitespace = rawText.match(/\s*$/)?.[0].length ?? 0;
    const start = match.index + Math.max(leadingWhitespace, 0);
    const end = match.index + rawText.length - trailingWhitespace;
    const paragraphText = text.slice(start, end);
    if (paragraphText.trim()) {
      paragraphs.push({ text: paragraphText, start, end });
    }
  }

  return paragraphs;
}

function createSearchGrams(value: string): string[] {
  const normalized = normalizeForSearch(value);
  const grams = new Set<string>();

  for (const size of [2, 3]) {
    for (let index = 0; index <= normalized.length - size; index += 1) {
      grams.add(normalized.slice(index, index + size));
    }
  }

  return [...grams];
}

function normalizeForSearch(value: string): string {
  return value.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, "");
}

function getRangeOverlap(start: number, end: number, targetStart: number, targetEnd: number): number {
  return Math.max(0, Math.min(end, targetEnd) - Math.max(start, targetStart));
}
