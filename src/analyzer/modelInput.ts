import type { AnalysisReport } from "../types";

export const MAX_MODEL_DOCUMENT_CHARS = 12000;
const MODEL_OMISSION_MARKER = "\n\n[PlainDoc: 中间部分已省略，模型输入保留了开头和结尾片段。]\n\n";

export interface PreparedModelDocumentText {
  text: string;
  originalLength: number;
  sentLength: number;
  truncated: boolean;
  sentRanges: Array<{
    start: number;
    end: number;
  }>;
}

export function prepareModelDocumentText(text: string): PreparedModelDocumentText {
  if (text.length <= MAX_MODEL_DOCUMENT_CHARS) {
    return {
      text,
      originalLength: text.length,
      sentLength: text.length,
      truncated: false,
      sentRanges: [{ start: 0, end: text.length }]
    };
  }

  const availableTextLength = MAX_MODEL_DOCUMENT_CHARS - MODEL_OMISSION_MARKER.length;
  const headLength = Math.ceil(availableTextLength * 0.65);
  const tailLength = availableTextLength - headLength;
  const tailStart = text.length - tailLength;
  const preparedText = `${text.slice(0, headLength)}${MODEL_OMISSION_MARKER}${text.slice(tailStart)}`;

  return {
    text: preparedText,
    originalLength: text.length,
    sentLength: preparedText.length,
    truncated: true,
    sentRanges: [
      { start: 0, end: headLength },
      { start: tailStart, end: text.length }
    ]
  };
}

export function formatModelDocumentScope(preparedDocument: PreparedModelDocumentText): string {
  if (preparedDocument.truncated) {
    return `正文较长，AI 增强只会发送开头和结尾共 ${preparedDocument.sentLength} 个字符（原文 ${preparedDocument.originalLength} 个字符）；完整文本仍先由本地规则分析。`;
  }

  return `本次 AI 增强会发送完整正文：${preparedDocument.sentLength} 个字符。`;
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
  return preparedDocument.sentRanges.some((range) => evidence.start >= range.start && evidence.end <= range.end);
}
