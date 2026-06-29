import { analyzeDocument } from "../analyzer/localAnalyzer";
import type { AnalysisReport, DocumentExample, DocumentKind, EvidenceSelectionTarget } from "../types";

export interface ExampleSelectionState {
  text: string;
  kind: DocumentKind;
  selectedExampleId: string;
  error: string;
  notice: string;
  report: AnalysisReport;
  evidenceSelection: EvidenceSelectionTarget | null;
  modelTextConsent: boolean;
}

export function createExampleSelectionState(example: DocumentExample): ExampleSelectionState {
  return {
    text: example.content,
    kind: example.kind,
    selectedExampleId: example.id,
    error: "",
    notice: `已加载「${example.title}」，并生成本地规则报告。`,
    report: analyzeDocument({ text: example.content, kind: example.kind }),
    evidenceSelection: null,
    modelTextConsent: false
  };
}
