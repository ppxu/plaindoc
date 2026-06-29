import { analyzeDocument } from "../analyzer/localAnalyzer";
import { getDocumentKindLabel } from "../data/documentKinds";
import type { AnalysisReport, DocumentKind, EvidenceSelectionTarget } from "../types";

export interface KindSelectionStateInput {
  text: string;
  nextKind: DocumentKind;
}

export interface KindSelectionState {
  text: string;
  kind: DocumentKind;
  selectedExampleId: string;
  error: string;
  notice: string;
  report: AnalysisReport;
  evidenceSelection: EvidenceSelectionTarget | null;
  modelTextConsent: boolean;
}

export function createKindSelectionState({ text, nextKind }: KindSelectionStateInput): KindSelectionState {
  return {
    text,
    kind: nextKind,
    selectedExampleId: "",
    error: "",
    notice: text.trim() ? `已按${getDocumentKindLabel(nextKind)}重新生成本地规则报告。` : "",
    report: analyzeDocument({ text, kind: nextKind }),
    evidenceSelection: null,
    modelTextConsent: false
  };
}
