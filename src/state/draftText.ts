import { detectDocumentKind } from "../analyzer/documentKindDetector";
import { analyzeDocument } from "../analyzer/localAnalyzer";
import { getDocumentKindLabel } from "../data/documentKinds";
import { normalizeReviewPerspective } from "../data/reviewPerspectives";
import type { AnalysisReport, DocumentExample, DocumentKind, EvidenceSelectionTarget, ReviewPerspective } from "../types";

const DOCUMENT_DRAFT_STORAGE_KEY = "plaindoc:document-draft:v1";

export interface DraftTextStateInput {
  text: string;
  selectedKind: DocumentKind;
  perspective?: ReviewPerspective;
}

export interface DraftTextState {
  text: string;
  kind: DocumentKind;
  selectedExampleId: string;
  error: string;
  notice: string;
  report: AnalysisReport;
  evidenceSelection: EvidenceSelectionTarget | null;
  modelTextConsent: boolean;
}

export interface StoredDocumentDraft {
  text: string;
  kind: DocumentKind;
}

export type DocumentDraftPersistenceResult = "saved" | "cleared" | "unavailable" | "failed";

export function createInitialDocumentState(
  fallbackExample: DocumentExample,
  storage: Storage | undefined = getBrowserStorage()
): DraftTextState {
  const storedDraft = loadDocumentDraft(storage);
  if (storedDraft) {
    return {
      text: storedDraft.text,
      kind: storedDraft.kind,
      selectedExampleId: "",
      error: "",
      notice: "已恢复上次保存在本机浏览器的正文草稿。",
      report: analyzeDocument({ text: storedDraft.text, kind: storedDraft.kind }),
      evidenceSelection: null,
      modelTextConsent: false
    };
  }

  return {
    text: fallbackExample.content,
    kind: fallbackExample.kind,
    selectedExampleId: fallbackExample.id,
    error: "",
    notice: "",
    report: analyzeDocument({ text: fallbackExample.content, kind: fallbackExample.kind }),
    evidenceSelection: null,
    modelTextConsent: false
  };
}

export function createDraftTextState({ text, selectedKind, perspective }: DraftTextStateInput): DraftTextState {
  const kind = resolveDraftKind(text, selectedKind);
  const reviewPerspective = normalizeReviewPerspective(kind, perspective);

  return {
    text,
    kind,
    selectedExampleId: "",
    error: "",
    notice: buildDraftNotice(text, selectedKind, kind),
    report: analyzeDocument({ text, kind, perspective: reviewPerspective }),
    evidenceSelection: null,
    modelTextConsent: false
  };
}

export function saveDocumentDraft(
  draft: StoredDocumentDraft,
  storage: Storage | undefined = getBrowserStorage()
): DocumentDraftPersistenceResult {
  if (!storage) return "unavailable";

  if (!draft.text.trim()) {
    return clearDocumentDraft(storage);
  }

  try {
    storage.setItem(DOCUMENT_DRAFT_STORAGE_KEY, JSON.stringify({ text: draft.text, kind: draft.kind }));
    return "saved";
  } catch {
    return "failed";
  }
}

export function loadDocumentDraft(storage: Storage | undefined = getBrowserStorage()): StoredDocumentDraft | null {
  if (!storage) return null;

  try {
    const raw = storage.getItem(DOCUMENT_DRAFT_STORAGE_KEY);
    if (!raw) return null;
    const value = JSON.parse(raw) as Partial<StoredDocumentDraft>;
    if (typeof value.text !== "string" || !value.text.trim() || !isDocumentKind(value.kind)) {
      return null;
    }

    return { text: value.text, kind: value.kind };
  } catch {
    return null;
  }
}

export function clearDocumentDraft(storage: Storage | undefined = getBrowserStorage()): DocumentDraftPersistenceResult {
  if (!storage) return "unavailable";

  try {
    storage.removeItem(DOCUMENT_DRAFT_STORAGE_KEY);
    return "cleared";
  } catch {
    return "failed";
  }
}

function resolveDraftKind(text: string, selectedKind: DocumentKind): DocumentKind {
  const detection = detectDocumentKind(text);
  if (detection.kind === "unknown") {
    return selectedKind;
  }

  if (selectedKind === "unknown" || detection.confidence === "high") {
    return detection.kind;
  }

  return selectedKind;
}

function buildDraftNotice(text: string, selectedKind: DocumentKind, reportKind: DocumentKind): string {
  if (!text.trim()) {
    return "";
  }

  if (reportKind !== selectedKind) {
    return `正文已更新，已自动识别为${getDocumentKindLabel(reportKind)}，并生成本地规则报告。`;
  }

  return "正文已更新，已生成本地规则报告。";
}

function isDocumentKind(value: unknown): value is DocumentKind {
  return (
    value === "rental" ||
    value === "employment" ||
    value === "renovation" ||
    value === "loan" ||
    value === "insurance" ||
    value === "unknown"
  );
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
