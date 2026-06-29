import type { AnalysisReport, DocumentKind, EvidenceSelectionTarget, SavedReport } from "../types";

export interface RestoredReportState {
  text: string;
  kind: DocumentKind;
  selectedExampleId: string;
  error: string;
  notice: string;
  report: AnalysisReport;
  evidenceSelection: EvidenceSelectionTarget | null;
}

export function restoreSavedReport(item: SavedReport): RestoredReportState {
  return {
    text: "",
    kind: item.report.documentKind,
    selectedExampleId: "",
    error: "",
    notice: `已恢复本地历史报告：${item.title}。历史不保存原始正文或证据片段，正文框已清空；如需定位原文或重新分析，请重新粘贴或上传文件。`,
    report: item.report,
    evidenceSelection: null
  };
}
