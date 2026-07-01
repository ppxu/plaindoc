import { analyzeDocument } from "../analyzer/localAnalyzer";
import { normalizeReviewPerspective } from "../data/reviewPerspectives";
import type { AnalysisReport, DocumentExample, DocumentKind, EvidenceSelectionTarget, ReviewPerspective } from "../types";

export interface CustomExampleSelectionStateInput {
  text: string;
  kind: DocumentKind;
  report: AnalysisReport;
}

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

export function createExampleSelectionState(example: DocumentExample, perspective?: ReviewPerspective): ExampleSelectionState {
  const reviewPerspective = normalizeReviewPerspective(example.kind, perspective);
  return {
    text: example.content,
    kind: example.kind,
    selectedExampleId: example.id,
    error: "",
    notice: `已加载「${example.title}」，并生成本地规则报告。`,
    report: analyzeDocument({ text: example.content, kind: example.kind, perspective: reviewPerspective }),
    evidenceSelection: null,
    modelTextConsent: false
  };
}

export function createCustomExampleSelectionState({
  text,
  kind,
  report
}: CustomExampleSelectionStateInput): ExampleSelectionState {
  return {
    text,
    kind,
    selectedExampleId: "",
    error: "",
    notice: "已切换为自定义/上传文本，当前正文和报告未改变。",
    report,
    evidenceSelection: null,
    modelTextConsent: false
  };
}
