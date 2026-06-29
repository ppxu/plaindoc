import { detectDocumentKind } from "../analyzer/documentKindDetector";
import { analyzeDocument } from "../analyzer/localAnalyzer";
import { getDocumentKindLabel } from "../data/documentKinds";
import type { AnalysisReport, DocumentKind, EvidenceSelectionTarget } from "../types";

export interface DraftTextStateInput {
  text: string;
  selectedKind: DocumentKind;
}

export interface DraftTextState {
  text: string;
  kind: DocumentKind;
  selectedExampleId: string;
  error: string;
  notice: string;
  report: AnalysisReport;
  evidenceSelection: EvidenceSelectionTarget | null;
  modelTextConsent: boolean;
}

export function createDraftTextState({ text, selectedKind }: DraftTextStateInput): DraftTextState {
  const kind = resolveDraftKind(text, selectedKind);

  return {
    text,
    kind,
    selectedExampleId: "",
    error: "",
    notice: buildDraftNotice(text, selectedKind, kind),
    report: analyzeDocument({ text, kind }),
    evidenceSelection: null,
    modelTextConsent: false
  };
}

function resolveDraftKind(text: string, selectedKind: DocumentKind): DocumentKind {
  const detection = detectDocumentKind(text);
  if (detection.kind === "unknown") {
    return selectedKind;
  }

  if (selectedKind === "unknown" || detection.confidence === "high") {
    return detection.kind;
  }

  return selectedKind;
}

function buildDraftNotice(text: string, selectedKind: DocumentKind, reportKind: DocumentKind): string {
  if (!text.trim()) {
    return "";
  }

  if (reportKind !== selectedKind) {
    return `正文已更新，已自动识别为${getDocumentKindLabel(reportKind)}，并生成本地规则报告。`;
  }

  return "正文已更新，已生成本地规则报告。";
}
