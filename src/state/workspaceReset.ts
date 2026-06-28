import { analyzeDocument } from "../analyzer/localAnalyzer";
import type { AnalysisReport, DocumentKind, EvidenceSelectionTarget } from "../types";

export interface ClearedWorkspaceState {
  text: string;
  kind: DocumentKind;
  selectedExampleId: string;
  error: string;
  notice: string;
  report: AnalysisReport;
  evidenceSelection: EvidenceSelectionTarget | null;
}

export function createClearedWorkspaceState(): ClearedWorkspaceState {
  return {
    text: "",
    kind: "unknown",
    selectedExampleId: "",
    error: "",
    notice: "已清空当前文件正文和报告。历史和模型设置未受影响。",
    report: analyzeDocument({ text: "", kind: "unknown" }),
    evidenceSelection: null
  };
}
