import type { EvidenceSnippet } from "../types";

const MONEY_NUMBER_PATTERN = String.raw`(?:\d{1,3}(?:,\d{3})+|\d+)(?:\.\d+)?`;
const MONEY_PATTERN = new RegExp(
  String.raw`(?:人民币|¥|￥)\s?${MONEY_NUMBER_PATTERN}(?:\s?万)?(?:\s?(?:元|块))?|${MONEY_NUMBER_PATTERN}\s?(?:万\s?(?:元|块)?|元|块|人民币)`,
  "g"
);
const DATE_PATTERN = /\d{4}\s?年\s?\d{1,2}\s?月\s?\d{1,2}\s?日|\d{4}[/-]\d{1,2}[/-]\d{1,2}|\d{1,2}\s?个月|\d{1,3}\s?日|两年|一年|三年|六个月/g;

export interface PatternMatch {
  value: string;
  evidence: EvidenceSnippet;
}

export function countWords(text: string): number {
  const compactChinese = (text.match(/[\u4e00-\u9fa5]/g) ?? []).length;
  const latinWords = (text.match(/[A-Za-z0-9]+(?:[-'][A-Za-z0-9]+)*/g) ?? []).length;
  return compactChinese + latinWords;
}

export function findMoneyValues(text: string): EvidenceSnippet[] {
  return findMatches(text, MONEY_PATTERN);
}

export function findDateValues(text: string): EvidenceSnippet[] {
  return findMatches(text, DATE_PATTERN);
}

export function findMoneyMatches(text: string): PatternMatch[] {
  return findPatternMatches(text, MONEY_PATTERN);
}

export function findDateMatches(text: string): PatternMatch[] {
  return findPatternMatches(text, DATE_PATTERN);
}

export function findEvidence(text: string, terms: string[]): EvidenceSnippet | undefined {
  const normalized = text.toLowerCase();
  const term = terms.find((candidate) => normalized.includes(candidate.toLowerCase()));
  if (!term) {
    return undefined;
  }

  const index = normalized.indexOf(term.toLowerCase());
  return expandSnippet(text, index, term.length);
}

export function includesAny(text: string, terms: string[]): boolean {
  const normalized = text.toLowerCase();
  return terms.some((term) => normalized.includes(term.toLowerCase()));
}

function findMatches(text: string, pattern: RegExp): EvidenceSnippet[] {
  const matches: EvidenceSnippet[] = [];
  pattern.lastIndex = 0;
  let match = pattern.exec(text);

  while (match) {
    matches.push(expandSnippet(text, match.index, match[0].length));
    match = pattern.exec(text);
  }

  return dedupeSnippets(matches).slice(0, 8);
}

function findPatternMatches(text: string, pattern: RegExp): PatternMatch[] {
  const matches: PatternMatch[] = [];
  pattern.lastIndex = 0;
  let match = pattern.exec(text);

  while (match) {
    matches.push({
      value: match[0].replace(/\s+/g, " ").trim(),
      evidence: expandSnippet(text, match.index, match[0].length)
    });
    match = pattern.exec(text);
  }

  const seen = new Set<string>();
  return matches
    .filter((item) => {
      if (seen.has(item.value)) {
        return false;
      }
      seen.add(item.value);
      return true;
    })
    .slice(0, 8);
}

function expandSnippet(text: string, start: number, length: number): EvidenceSnippet {
  const left = Math.max(0, start - 42);
  const right = Math.min(text.length, start + length + 70);
  const snippet = text.slice(left, right).replace(/\s+/g, " ").trim();

  return {
    text: snippet,
    start: left,
    end: right
  };
}

function dedupeSnippets(snippets: EvidenceSnippet[]): EvidenceSnippet[] {
  const seen = new Set<string>();
  return snippets.filter((snippet) => {
    const key = snippet.text;
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}
