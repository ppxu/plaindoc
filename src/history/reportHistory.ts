import type { AnalysisReport, SavedReport } from "../types";
import { getDocumentKindLabel } from "../data/documentKinds";

const STORAGE_KEY = "plaindoc:report-history:v1";
const MAX_HISTORY_ITEMS = 8;

export function loadReportHistory(storage: Storage | undefined = getBrowserStorage()): SavedReport[] {
  if (!storage) return [];

  try {
    const raw = storage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isSavedReport).map(redactSavedReport).slice(0, MAX_HISTORY_ITEMS);
  } catch {
    return [];
  }
}

export function saveReportToHistory(
  report: AnalysisReport,
  storage: Storage | undefined = getBrowserStorage()
): SavedReport[] {
  const historyReport = redactReportForHistory(report);
  const entry: SavedReport = {
    id: createId(),
    title: createReportTitle(historyReport),
    createdAt: new Date().toISOString(),
    report: historyReport
  };

  const fingerprint = createReportFingerprint(historyReport);
  const next = [
    entry,
    ...loadReportHistory(storage).filter((item) => createReportFingerprint(item.report) !== fingerprint)
  ].slice(0, MAX_HISTORY_ITEMS);
  writeReportHistory(next, storage);
  return next;
}

export function clearReportHistory(storage: Storage | undefined = getBrowserStorage()): SavedReport[] {
  if (!storage) return [];
  try {
    storage.removeItem(STORAGE_KEY);
  } catch {
    // Browser storage can be unavailable or quota-blocked; clearing current UI state should still work.
  }
  return [];
}

function writeReportHistory(items: SavedReport[], storage: Storage | undefined) {
  if (!storage) return;
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    // Keep the in-memory history returned to the UI even if persistence is blocked.
  }
}

function redactSavedReport(item: SavedReport): SavedReport {
  return {
    ...item,
    report: redactReportForHistory(item.report)
  };
}

function redactReportForHistory(report: AnalysisReport): AnalysisReport {
  return {
    ...report,
    facts: report.facts.map(({ evidence, ...fact }) => fact),
    findings: report.findings.map(({ evidence, ...finding }) => finding)
  };
}

function createReportTitle(report: AnalysisReport): string {
  const kind = report.documentKind === "unknown" ? "文件" : getDocumentKindLabel(report.documentKind);
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

function createReportFingerprint(report: AnalysisReport): string {
  return JSON.stringify({
    documentKind: report.documentKind,
    source: report.source,
    modelName: report.modelName ?? "",
    status: report.status,
    score: report.score,
    summary: report.summary,
    wordCount: report.wordCount,
    facts: report.facts.map((fact) => ({
      label: fact.label,
      value: fact.value
    })),
    findings: report.findings.map((finding) => ({
      id: finding.id,
      title: finding.title,
      severity: finding.severity,
      evidence: finding.evidence?.text ?? ""
    })),
    checklist: report.checklist.map((item) => item.question)
  });
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
  try {
    return window.localStorage;
  } catch {
    return undefined;
  }
}
