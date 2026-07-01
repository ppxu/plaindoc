import { analyzeDocument } from "../analyzer/localAnalyzer";
import { getDocumentKindLabel } from "../data/documentKinds";
import { normalizeReviewPerspective } from "../data/reviewPerspectives";
import type { AnalysisReport, DocumentKind, EvidenceSelectionTarget, ReviewPerspective } from "../types";

export interface KindSelectionStateInput {
  text: string;
  nextKind: DocumentKind;
  perspective?: ReviewPerspective;
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

export function createKindSelectionState({ text, nextKind, perspective }: KindSelectionStateInput): KindSelectionState {
  const reviewPerspective = normalizeReviewPerspective(nextKind, perspective);
  return {
    text,
    kind: nextKind,
    selectedExampleId: "",
    error: "",
    notice: text.trim() ? `已按${getDocumentKindLabel(nextKind)}重新生成本地规则报告。` : "",
    report: analyzeDocument({ text, kind: nextKind, perspective: reviewPerspective }),
    evidenceSelection: null,
    modelTextConsent: false
  };
}
