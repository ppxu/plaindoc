import { detectDocumentKind } from "../analyzer/documentKindDetector";
import { analyzeDocument } from "../analyzer/localAnalyzer";
import { getDocumentKindLabel } from "../data/documentKinds";
import type { AnalysisReport, DocumentKind, EvidenceSelectionTarget } from "../types";

export interface UploadedTextStateInput {
  text: string;
  isPdfUpload: boolean;
  fileName?: string;
  fallbackKind: DocumentKind;
}

export interface UploadedTextState {
  text: string;
  kind: DocumentKind;
  selectedExampleId: string;
  error: string;
  notice: string;
  report: AnalysisReport;
  evidenceSelection: EvidenceSelectionTarget | null;
  modelTextConsent: boolean;
}

export function createUploadedTextState({ text, isPdfUpload, fileName, fallbackKind }: UploadedTextStateInput): UploadedTextState {
  const detection = detectDocumentKind(text);
  const kind = detection.kind === "unknown" ? fallbackKind : detection.kind;

  return {
    text,
    kind,
    selectedExampleId: "",
    error: "",
    notice: buildUploadedTextNotice(isPdfUpload, text, detection.kind, kind, fileName),
    report: analyzeDocument({ text, kind }),
    evidenceSelection: null,
    modelTextConsent: false
  };
}

function buildUploadedTextNotice(
  isPdfUpload: boolean,
  text: string,
  detectedKind: DocumentKind,
  reportKind: DocumentKind,
  fileName?: string
): string {
  const name = formatUploadedFileName(fileName);
  const prefix = `${isPdfUpload ? "已从 PDF 提取" : "已读取"}${name ? ` ${name}` : ""}，${text.trim().length} 个字符`;
  if (detectedKind === "unknown") {
    return `${prefix}，暂未识别出明确文件类型，已按${getDocumentKindLabel(reportKind)}生成本地规则报告。你可以手动选择更接近的类型后重新生成。`;
  }

  return `${prefix}，已自动识别为${getDocumentKindLabel(detectedKind)}，已生成本地规则报告。如不准确，可手动修改文件类型后重新生成。`;
}

function formatUploadedFileName(fileName?: string): string {
  const normalized = fileName?.trim().replace(/\s+/g, " ");
  if (!normalized) return "";
  return normalized.length > 60 ? `${normalized.slice(0, 57)}...` : normalized;
}
