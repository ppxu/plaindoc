import { clearModelSettings, DEFAULT_MODEL_SETTINGS } from "../analyzer/modelSettings";
import { analyzeDocument } from "../analyzer/localAnalyzer";
import { clearReportHistory } from "../history/reportHistory";
import type { AnalysisReport, DocumentKind, EvidenceSelectionTarget, ModelAnalyzerSettings, SavedReport } from "../types";

export interface LocalDataResetState {
  text: string;
  kind: DocumentKind;
  selectedExampleId: string;
  error: string;
  notice: string;
  report: AnalysisReport;
  history: SavedReport[];
  modelSettings: ModelAnalyzerSettings;
  modelTextConsent: boolean;
  evidenceSelection: EvidenceSelectionTarget | null;
}

export function createLocalDataResetState(): LocalDataResetState {
  return {
    text: "",
    kind: "unknown",
    selectedExampleId: "",
    error: "",
    notice: "已清除本机数据：当前正文、报告历史、模型设置和 AI 发送确认都已重置。",
    report: analyzeDocument({ text: "", kind: "unknown" }),
    history: [],
    modelSettings: DEFAULT_MODEL_SETTINGS,
    modelTextConsent: false,
    evidenceSelection: null
  };
}

export function clearLocalStoredData(storage: Storage | undefined = getBrowserStorage()): void {
  clearReportHistory(storage);
  clearModelSettings(storage);
}

function getBrowserStorage() {
  if (typeof window === "undefined") {
    return undefined;
  }
  return window.localStorage;
}
