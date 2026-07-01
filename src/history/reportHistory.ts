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
  const report = redactReportForHistory(item.report);
  return {
    ...item,
    title: createReportTitle(report),
    report
  };
}

function redactReportForHistory(report: AnalysisReport): AnalysisReport {
  return {
    ...report,
    facts: report.facts.map(({ evidence, ...fact }) => fact),
    findings: report.findings.map(({ evidence, ...finding }) => finding),
    clarifyingQuestions: report.clarifyingQuestions ?? []
  };
}

function createReportTitle(report: AnalysisReport): string {
  const kind = report.documentKind === "unknown" ? "文件" : getDocumentKindLabel(report.documentKind);
  return `${kind} · ${sourceLabel(report)} · ${statusLabel(report.status)} · ${report.score} 分`;
}

function sourceLabel(report: AnalysisReport): string {
  if (report.source === "model") {
    return report.modelName ? `AI 增强：${report.modelName}` : "AI 增强";
  }
  return "本地规则";
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
    isReportStatus(value.status) &&
    typeof value.score === "number" &&
    Array.isArray(value.facts) &&
    value.facts.every(isFact) &&
    Array.isArray(value.findings) &&
    value.findings.every(isFinding) &&
    Array.isArray(value.checklist) &&
    value.checklist.every(isChecklistItem) &&
    (value.clarifyingQuestions === undefined ||
      (Array.isArray(value.clarifyingQuestions) && value.clarifyingQuestions.every(isClarifyingQuestion))) &&
    isActionPlan(value.actionPlan) &&
    Array.isArray(value.plainLanguage) &&
    value.plainLanguage.every((line) => typeof line === "string") &&
    typeof value.generatedAt === "string" &&
    isDocumentKind(value.documentKind) &&
    typeof value.wordCount === "number" &&
    isAnalysisSource(value.source) &&
    (value.modelName === undefined || typeof value.modelName === "string") &&
    (value.notice === undefined || typeof value.notice === "string") &&
    typeof value.disclaimer === "string"
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isDocumentKind(value: unknown): value is AnalysisReport["documentKind"] {
  return (
    value === "rental" ||
    value === "employment" ||
    value === "renovation" ||
    value === "loan" ||
    value === "insurance" ||
    value === "unknown"
  );
}

function isReportStatus(value: unknown): value is AnalysisReport["status"] {
  return value === "safe_to_review" || value === "needs_attention" || value === "do_not_sign_directly";
}

function isAnalysisSource(value: unknown): value is AnalysisReport["source"] {
  return value === "local" || value === "model";
}

function isSeverity(value: unknown): value is "red" | "yellow" | "green" {
  return value === "red" || value === "yellow" || value === "green";
}

function isFact(value: unknown): boolean {
  if (!isRecord(value)) return false;
  return (
    typeof value.label === "string" &&
    typeof value.value === "string" &&
    typeof value.confidence === "number" &&
    (value.evidence === undefined || isEvidence(value.evidence))
  );
}

function isFinding(value: unknown): boolean {
  if (!isRecord(value)) return false;
  return (
    typeof value.id === "string" &&
    typeof value.title === "string" &&
    isSeverity(value.severity) &&
    typeof value.explanation === "string" &&
    typeof value.whyItMatters === "string" &&
    typeof value.suggestion === "string" &&
    (value.modification === undefined || typeof value.modification === "string") &&
    (value.evidence === undefined || isEvidence(value.evidence))
  );
}

function isChecklistItem(value: unknown): boolean {
  if (!isRecord(value)) return false;
  return typeof value.question === "string" && typeof value.reason === "string" && isSeverity(value.severity);
}

function isClarifyingQuestion(value: unknown): boolean {
  if (!isRecord(value)) return false;
  return (
    typeof value.question === "string" &&
    typeof value.whyItMatters === "string" &&
    isSeverity(value.severity) &&
    typeof value.askBeforeSigning === "boolean"
  );
}

function isActionPlan(value: unknown): boolean {
  if (!isRecord(value)) return false;
  return (
    (value.priority === "low" || value.priority === "medium" || value.priority === "high") &&
    typeof value.title === "string" &&
    Array.isArray(value.steps) &&
    value.steps.every((step) => typeof step === "string") &&
    typeof value.message === "string"
  );
}

function isEvidence(value: unknown): boolean {
  if (!isRecord(value)) return false;
  return typeof value.text === "string" && typeof value.start === "number" && typeof value.end === "number";
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
    checklist: report.checklist.map((item) => item.question),
    clarifyingQuestions: (report.clarifyingQuestions ?? []).map((item) => item.question)
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
