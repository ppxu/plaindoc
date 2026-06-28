import type { AnalysisReport, SavedReport } from "../types";

const STORAGE_KEY = "plaindoc:report-history:v1";
const MAX_HISTORY_ITEMS = 8;

export function loadReportHistory(storage: Storage | undefined = getBrowserStorage()): SavedReport[] {
  if (!storage) return [];

  try {
    const raw = storage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isSavedReport).slice(0, MAX_HISTORY_ITEMS);
  } catch {
    return [];
  }
}

export function saveReportToHistory(
  report: AnalysisReport,
  storage: Storage | undefined = getBrowserStorage()
): SavedReport[] {
  const entry: SavedReport = {
    id: createId(),
    title: createReportTitle(report),
    createdAt: new Date().toISOString(),
    report
  };

  const next = [entry, ...loadReportHistory(storage)].slice(0, MAX_HISTORY_ITEMS);
  writeReportHistory(next, storage);
  return next;
}

export function clearReportHistory(storage: Storage | undefined = getBrowserStorage()): SavedReport[] {
  if (storage) {
    storage.removeItem(STORAGE_KEY);
  }
  return [];
}

function writeReportHistory(items: SavedReport[], storage: Storage | undefined) {
  if (!storage) return;
  storage.setItem(STORAGE_KEY, JSON.stringify(items));
}

function createReportTitle(report: AnalysisReport): string {
  const kind = {
    rental: "租房合同",
    employment: "劳动协议",
    renovation: "装修合同",
    loan: "借款合同",
    unknown: "文件"
  }[report.documentKind];
  return `${kind} · ${statusLabel(report.status)} · ${report.score} 分`;
}

function statusLabel(status: AnalysisReport["status"]): string {
  return {
    safe_to_review: "可以继续确认",
    needs_attention: "需要重点确认",
    do_not_sign_directly: "不建议直接签"
  }[status];
}

function isSavedReport(value: unknown): value is SavedReport {
  if (!isRecord(value)) return false;
  if (typeof value.id !== "string" || typeof value.title !== "string" || typeof value.createdAt !== "string") {
    return false;
  }
  return isAnalysisReport(value.report);
}

function isAnalysisReport(value: unknown): value is AnalysisReport {
  if (!isRecord(value)) return false;
  return (
    typeof value.summary === "string" &&
    typeof value.score === "number" &&
    Array.isArray(value.findings) &&
    Array.isArray(value.checklist) &&
    isRecord(value.actionPlan) &&
    typeof value.generatedAt === "string" &&
    typeof value.disclaimer === "string"
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function createId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function getBrowserStorage() {
  if (typeof window === "undefined") {
    return undefined;
  }
  return window.localStorage;
}
