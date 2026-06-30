import { useEffect, useRef, useState, type RefObject } from "react";
import { Github, LockKeyhole, ScrollText, ShieldAlert } from "lucide-react";
import { detectDocumentKind } from "./analyzer/documentKindDetector";
import { analyzeDocument } from "./analyzer/localAnalyzer";
import { testModelConnection } from "./analyzer/modelConnectionTest";
import { analyzeWithModel } from "./analyzer/modelAnalyzer";
import {
  getModelEndpointSecurity,
  modelEndpointNeedsApiKey,
  modelEndpointSecurityMessage
} from "./analyzer/modelEndpointSecurity";
import { clearModelSettings, loadModelSettings, normalizeModelSettingsForRuntime, saveModelSettings } from "./analyzer/modelSettings";
import { DocumentInput } from "./components/DocumentInput";
import { ReportPanel } from "./components/ReportPanel";
import { getDocumentKindLabel } from "./data/documentKinds";
import { documentExamples } from "./data/examples";
import { clearReportHistory, loadReportHistory, saveReportToHistory } from "./history/reportHistory";
import { restoreSavedReport } from "./history/reportRestore";
import { isPdfFile } from "./ingest/pdfText";
import { createAnalysisRunTracker } from "./state/analysisRun";
import { clearDocumentDraft, createDraftTextState, createInitialDocumentState, saveDocumentDraft } from "./state/draftText";
import { createCustomExampleSelectionState, createExampleSelectionState } from "./state/exampleSelection";
import { createKindSelectionState } from "./state/kindSelection";
import { clearLocalStoredData, createLocalDataResetState } from "./state/localDataReset";
import { shouldWarnBeforeLeaving } from "./state/leaveWarning";
import { canSendDocumentTextToModel, shouldRevokeModelTextConsent } from "./state/modelTextConsent";
import { createUploadedTextState } from "./state/uploadedText";
import { createClearedWorkspaceState } from "./state/workspaceReset";
import type { AnalysisReport, DocumentKind, EvidenceSelectionTarget, ModelAnalyzerSettings, RiskFinding, SavedReport } from "./types";
import { copyTextToClipboard } from "./utils/clipboard";
import { resolveEvidenceSelection } from "./utils/evidenceSelection";

const MAX_UPLOAD_BYTES = 20 * 1024 * 1024;

type ModelConnectionStatus = { tone: "success" | "error"; message: string } | null;

export default function App() {
  const firstExample = documentExamples[0];
  const [initialDocument] = useState(() => createInitialDocumentState(firstExample));
  const reportPanelRef = useRef<HTMLElement | null>(null);
  const analysisRunTracker = useRef(createAnalysisRunTracker());
  const modelRequestAbortController = useRef<AbortController | null>(null);
  const modelConnectionTestAbortController = useRef<AbortController | null>(null);
  const modelConnectionTestRunId = useRef(0);
  const uploadReadRunId = useRef(0);
  const [text, setText] = useState(initialDocument.text);
  const [kind, setKind] = useState<DocumentKind>(initialDocument.kind);
  const [selectedExampleId, setSelectedExampleId] = useState(initialDocument.selectedExampleId);
  const [error, setError] = useState(initialDocument.error);
  const [inputNotice, setInputNotice] = useState(initialDocument.notice);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [report, setReport] = useState<AnalysisReport>(() => initialDocument.report);
  const [modelSettings, setModelSettings] = useState<ModelAnalyzerSettings>(() => loadModelSettings());
  const [modelTextConsent, setModelTextConsent] = useState(false);
  const [isTestingModelConnection, setIsTestingModelConnection] = useState(false);
  const [modelConnectionStatus, setModelConnectionStatus] = useState<ModelConnectionStatus>(null);
  const [history, setHistory] = useState<SavedReport[]>(() => loadReportHistory());
  const [evidenceSelection, setEvidenceSelection] = useState<EvidenceSelectionTarget | null>(null);
  const [documentTextFocusRequest, setDocumentTextFocusRequest] = useState(0);

  useEffect(() => {
    if (selectedExampleId) {
      clearDocumentDraft();
      return;
    }

    saveDocumentDraft({ text, kind });
  }, [text, kind, selectedExampleId]);

  useEffect(() => {
    function handleBeforeUnload(event: BeforeUnloadEvent) {
      if (!shouldWarnBeforeLeaving({ text, selectedExampleId, isAnalyzing, isUploading })) {
        return;
      }

      event.preventDefault();
      event.returnValue = "";
    }

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [text, selectedExampleId, isAnalyzing, isUploading]);

  function handleExampleChange(id: string) {
    if (!id) {
      invalidateCurrentAnalysis();
      const selected = createCustomExampleSelectionState({ text, kind, report });
      setSelectedExampleId(selected.selectedExampleId);
      setText(selected.text);
      setKind(selected.kind);
      setError(selected.error);
      setInputNotice(selected.notice);
      setReport(selected.report);
      setEvidenceSelection(selected.evidenceSelection);
      setModelTextConsent(selected.modelTextConsent);
      return;
    }

    const example = documentExamples.find((item) => item.id === id);
    if (!example) return;
    invalidateCurrentAnalysis();
    const selected = createExampleSelectionState(example);
    setSelectedExampleId(selected.selectedExampleId);
    setText(selected.text);
    setKind(selected.kind);
    setError(selected.error);
    setInputNotice(selected.notice);
    setReport(selected.report);
    setEvidenceSelection(selected.evidenceSelection);
    setModelTextConsent(selected.modelTextConsent);
  }

  function handleTextChange(nextText: string) {
    invalidateCurrentAnalysis();
    const draft = createDraftTextState({ text: nextText, selectedKind: kind });
    setText(draft.text);
    setKind(draft.kind);
    setSelectedExampleId(draft.selectedExampleId);
    setError(draft.error);
    setInputNotice(draft.notice);
    setReport(draft.report);
    setEvidenceSelection(draft.evidenceSelection);
    setModelTextConsent(draft.modelTextConsent);
  }

  function handleRedactSensitiveText(redactedText: string) {
    invalidateCurrentAnalysis();
    const draft = createDraftTextState({ text: redactedText, selectedKind: kind });
    const redactedReportNotice = "已基于脱敏副本生成本地规则报告；请检查占位符是否影响条款含义。";
    const redactedReport = mergeReportNotice(draft.report, redactedReportNotice);
    setText(draft.text);
    setKind(draft.kind);
    setSelectedExampleId(draft.selectedExampleId);
    setError(draft.error);
    setInputNotice("已生成脱敏副本，并已取消本次 AI 发送确认。请检查正文后再重新确认发送。");
    setReport(redactedReport);
    setEvidenceSelection(draft.evidenceSelection);
    setModelTextConsent(draft.modelTextConsent);
  }

  function handleKindChange(nextKind: DocumentKind) {
    invalidateCurrentAnalysis();
    const selected = createKindSelectionState({ text, nextKind });
    setText(selected.text);
    setKind(selected.kind);
    setSelectedExampleId(selected.selectedExampleId);
    setError(selected.error);
    setInputNotice(selected.notice);
    setReport(selected.report);
    setEvidenceSelection(selected.evidenceSelection);
    setModelTextConsent(selected.modelTextConsent);
  }

  function handleClearWorkspace() {
    if (!confirmWorkspaceClear()) {
      return;
    }
    invalidateCurrentAnalysis();
    const cleared = createClearedWorkspaceState();
    setText(cleared.text);
    setKind(cleared.kind);
    setSelectedExampleId(cleared.selectedExampleId);
    setError(cleared.error);
    setInputNotice(cleared.notice);
    setReport(cleared.report);
    setEvidenceSelection(cleared.evidenceSelection);
    setModelTextConsent(false);
    setDocumentTextFocusRequest((request) => request + 1);
  }

  function handleClearLocalData() {
    if (!confirmLocalDataReset()) {
      return;
    }
    invalidateCurrentAnalysis();
    abortCurrentModelConnectionTest();
    clearLocalStoredData();
    const reset = createLocalDataResetState();
    setText(reset.text);
    setKind(reset.kind);
    setSelectedExampleId(reset.selectedExampleId);
    setError(reset.error);
    setInputNotice(reset.notice);
    setReport(reset.report);
    setHistory(reset.history);
    setModelSettings(reset.modelSettings);
    setModelTextConsent(reset.modelTextConsent);
    setModelConnectionStatus(null);
    setEvidenceSelection(reset.evidenceSelection);
    setDocumentTextFocusRequest((request) => request + 1);
  }

  async function handleAnalyze() {
    abortCurrentModelRequest();
    const runId = analysisRunTracker.current.begin();
    if (!text.trim()) {
      const emptyInputReport = analyzeDocument({ text: "", kind });
      setError("请先粘贴文件内容、选择样例或上传文本文件。");
      setInputNotice("");
      setReport(emptyInputReport);
      setEvidenceSelection(null);
      setSelectedExampleId("");
      return;
    }

    const shortTextNotice = text.trim().length < 80 ? "文本较短，报告可能不完整。你仍然可以继续生成。" : "";
    setError("");

    const resolvedKind = resolveAnalysisKind(text, kind);
    const localReport = analyzeDocument({ text, kind: resolvedKind.kind });
    if (resolvedKind.kind !== kind) {
      setKind(resolvedKind.kind);
      setSelectedExampleId("");
    }
    const baseAnalysisNotice = mergeNotices(shortTextNotice, resolvedKind.notice);
    const localReportWithMergedNotice = mergeReportNotice(localReport, baseAnalysisNotice);
    setReport(localReportWithMergedNotice);
    setInputNotice(baseAnalysisNotice);

    const runtimeModelSettings = normalizeModelSettingsForRuntime(modelSettings);
    const endpointSecurity = getModelEndpointSecurity(runtimeModelSettings.baseUrl);
    const needsModelApiKey = modelEndpointNeedsApiKey(runtimeModelSettings.baseUrl);
    if (modelSettings.enabled && !endpointSecurity.ok) {
      const endpointFallbackNotice = mergeNotices(baseAnalysisNotice, modelEndpointSecurityMessage(endpointSecurity));
      const endpointFallbackReport = mergeReportNotice(localReport, endpointFallbackNotice);
      setReport(endpointFallbackReport);
      setHistory(saveReportToHistory(endpointFallbackReport));
      setInputNotice(endpointFallbackNotice);
      focusReportPanel(reportPanelRef);
      return;
    }

    const canUseModel = canSendDocumentTextToModel(modelSettings, modelTextConsent);
    if (!modelSettings.enabled || !canUseModel) {
      if (!modelSettings.enabled) {
        setHistory(saveReportToHistory(localReportWithMergedNotice));
      } else if (needsModelApiKey && !runtimeModelSettings.apiKey.trim()) {
        const missingKeyFallbackNotice = mergeNotices(baseAnalysisNotice, "AI 增强已开启，但缺少 API key，本次仅使用本地规则分析。");
        const missingKeyFallbackReport = mergeReportNotice(localReport, missingKeyFallbackNotice);
        setReport(missingKeyFallbackReport);
        setHistory(saveReportToHistory(missingKeyFallbackReport));
        setInputNotice(missingKeyFallbackNotice);
      } else if (!modelTextConsent) {
        const missingConsentFallbackNotice = mergeNotices(
          baseAnalysisNotice,
          "未确认发送正文给模型服务，本次仅使用本地规则分析。勾选 AI 发送确认后可生成增强清单。"
        );
        const missingConsentFallbackReport = mergeReportNotice(localReport, missingConsentFallbackNotice);
        setReport(missingConsentFallbackReport);
        setHistory(saveReportToHistory(missingConsentFallbackReport));
        setInputNotice(missingConsentFallbackNotice);
      }
      focusReportPanel(reportPanelRef);
      return;
    }

    setIsAnalyzing(true);
    const abortController = new AbortController();
    modelRequestAbortController.current = abortController;
    try {
      const modelReport = await analyzeWithModel({ text, kind: resolvedKind.kind }, modelSettings, localReport, {
        signal: abortController.signal
      });
      if (!analysisRunTracker.current.isCurrent(runId)) {
        return;
      }
      const reportWithMergedNotice = mergeReportNotice(modelReport, baseAnalysisNotice);
      setReport(reportWithMergedNotice);
      setHistory(saveReportToHistory(reportWithMergedNotice));
      if (needsModelApiKey && !runtimeModelSettings.apiKey.trim()) {
        setError("AI 增强已开启，但缺少 API key，已回退到本地分析。");
      }
      focusReportPanel(reportPanelRef);
    } catch (caught) {
      if (!analysisRunTracker.current.isCurrent(runId)) {
        return;
      }
      const message = caught instanceof Error ? caught.message : "模型调用失败。";
      const fallbackReport = {
        ...localReport,
        notice: mergeNotices(baseAnalysisNotice, `AI 增强失败，已回退到本地规则分析：${message}`)
      };
      setReport(fallbackReport);
      setHistory(saveReportToHistory(fallbackReport));
      setError(`AI 增强失败，已回退到本地分析：${message}`);
      focusReportPanel(reportPanelRef);
    } finally {
      if (analysisRunTracker.current.isCurrent(runId)) {
        setIsAnalyzing(false);
      }
      if (modelRequestAbortController.current === abortController) {
        modelRequestAbortController.current = null;
      }
    }
  }

  function handleSelectHistory(item: SavedReport) {
    invalidateCurrentAnalysis();
    const restored = restoreSavedReport(item);
    setReport(restored.report);
    setKind(restored.kind);
    setText(restored.text);
    setSelectedExampleId(restored.selectedExampleId);
    setError(restored.error);
    setInputNotice(restored.notice);
    setModelTextConsent(false);
    setEvidenceSelection(restored.evidenceSelection);
    focusReportPanel(reportPanelRef);
  }

  function handleClearHistory() {
    if (!confirmReportHistoryClear()) {
      return;
    }
    invalidateCurrentAnalysis();
    setHistory(clearReportHistory());
    setInputNotice("已清空本地报告历史。");
    setError("");
  }

  function handleModelSettingsChange(settings: ModelAnalyzerSettings) {
    invalidateCurrentAnalysis();
    abortCurrentModelConnectionTest();
    if (shouldRevokeModelTextConsent(modelSettings, settings)) {
      setModelTextConsent(false);
    }
    setModelConnectionStatus(null);
    setModelSettings(settings);
    saveModelSettings(settings);
  }

  function handleClearModelSettings() {
    if (!confirmModelSettingsClear()) {
      return;
    }
    invalidateCurrentAnalysis();
    abortCurrentModelConnectionTest();
    clearModelSettings();
    const next = loadModelSettings();
    setModelSettings(next);
    setModelTextConsent(false);
    setModelConnectionStatus(null);
    setError("");
    setInputNotice("已清除模型设置和 AI 发送确认。");
  }

  async function handleTestModelConnection() {
    abortCurrentModelConnectionTest();
    const runId = modelConnectionTestRunId.current + 1;
    modelConnectionTestRunId.current = runId;
    const abortController = new AbortController();
    modelConnectionTestAbortController.current = abortController;
    setIsTestingModelConnection(true);
    setModelConnectionStatus(null);
    setError("");

    try {
      const result = await testModelConnection(modelSettings, { signal: abortController.signal });
      if (modelConnectionTestRunId.current !== runId) {
        return;
      }
      setModelConnectionStatus({ tone: result.ok ? "success" : "error", message: result.message });
    } finally {
      if (modelConnectionTestRunId.current === runId) {
        setIsTestingModelConnection(false);
      }
      if (modelConnectionTestAbortController.current === abortController) {
        modelConnectionTestAbortController.current = null;
      }
    }
  }

  async function handleUpload(file: File, options: { ignoredFileCount?: number } = {}) {
    invalidateCurrentAnalysis();
    const uploadRunId = beginUploadRead();
    setError("");
    setInputNotice("");
    setModelTextConsent(false);
    if (file.size > MAX_UPLOAD_BYTES) {
      showUploadFailureUnchangedNotice();
      setError("文件超过 20MB。请先压缩、拆分或复制关键条款后再分析。");
      return;
    }

    const filename = file.name.toLowerCase();
    const isTextFile = filename.endsWith(".txt") || filename.endsWith(".md") || file.type.startsWith("text/");
    const isPdfUpload = isPdfFile(file);
    if (!isPdfUpload && !isTextFile) {
      showUploadFailureUnchangedNotice();
      setError("当前支持 PDF、.txt、.md 和纯文本文件。扫描件图片和 OCR 在路线图中。");
      return;
    }

    setIsUploading(true);

    try {
      const fileText = isPdfUpload ? await extractUploadedPdfText(file) : await file.text();
      if (!isCurrentUploadRead(uploadRunId)) {
        return;
      }
      if (!fileText.trim()) {
        showUploadFailureUnchangedNotice();
        setError("没有从文件中读取到可分析文本。如果这是扫描版 PDF，请先使用 OCR，或复制关键条款粘贴到正文框。");
        return;
      }
      const uploaded = createUploadedTextState({
        text: fileText,
        isPdfUpload,
        fileName: file.name,
        fallbackKind: kind,
        ignoredFileCount: options.ignoredFileCount
      });
      setText(uploaded.text);
      setSelectedExampleId(uploaded.selectedExampleId);
      setKind(uploaded.kind);
      setError(uploaded.error);
      setInputNotice(uploaded.notice);
      setReport(uploaded.report);
      setEvidenceSelection(uploaded.evidenceSelection);
      setModelTextConsent(uploaded.modelTextConsent);
      focusReportPanel(reportPanelRef);
    } catch {
      if (!isCurrentUploadRead(uploadRunId)) {
        return;
      }
      showUploadFailureUnchangedNotice();
      setError("文件读取失败。请确认 PDF 不是加密文件，或直接复制关键条款粘贴到正文框。");
    } finally {
      if (isCurrentUploadRead(uploadRunId)) {
        setIsUploading(false);
      }
    }
  }

  async function copyChecklist(): Promise<boolean> {
    const checklistText = report.checklist
      .map((item, index) => `${index + 1}. ${item.question}\n   ${item.reason}`)
      .join("\n");
    return copyTextToClipboard(checklistText);
  }

  async function copyActionMessage(): Promise<boolean> {
    return copyTextToClipboard(report.actionPlan.message);
  }

  function handleRevealEvidence(finding: RiskFinding) {
    if (!finding.evidence) return;
    const selection = resolveEvidenceSelection(text, finding.evidence);
    if (selection.ok) {
      setEvidenceSelection({ start: selection.start, end: selection.end, token: Date.now() });
      setError("");
      setInputNotice(
        selection.match === "paragraph"
          ? `原证据片段未完全匹配，已在正文框中选中「${finding.title}」的相关段落。`
          : `已在正文框中选中「${finding.title}」的证据片段。`
      );
      return;
    }

    const message =
      selection.reason === "missing_text"
        ? "当前正文框为空，无法定位证据片段。历史报告不保存原始正文，请重新粘贴或上传文件后再分析。"
        : "当前正文与这份报告的证据片段不一致。请重新生成风险清单后再定位原文。";
    setInputNotice(message);
  }

  function handleModelTextConsentChange(checked: boolean) {
    invalidateCurrentAnalysis();
    setModelTextConsent(checked);
  }

  function showUploadFailureUnchangedNotice() {
    setInputNotice("当前正文和报告未改变。");
  }

  function handleCancelAnalysis() {
    abortCurrentModelRequest();
    analysisRunTracker.current.cancel();
    setIsAnalyzing(false);
    setInputNotice("已取消本次 AI 增强分析，当前报告保持为本地规则结果。");
  }

  function invalidateCurrentAnalysis() {
    abortCurrentModelRequest();
    invalidateCurrentUploadRead();
    analysisRunTracker.current.invalidate();
    setIsAnalyzing(false);
  }

  function beginUploadRead(): number {
    uploadReadRunId.current += 1;
    return uploadReadRunId.current;
  }

  function isCurrentUploadRead(runId: number): boolean {
    return uploadReadRunId.current === runId;
  }

  function invalidateCurrentUploadRead(): void {
    uploadReadRunId.current += 1;
    setIsUploading(false);
  }

  function abortCurrentModelRequest() {
    modelRequestAbortController.current?.abort();
    modelRequestAbortController.current = null;
  }

  function abortCurrentModelConnectionTest() {
    modelConnectionTestRunId.current += 1;
    modelConnectionTestAbortController.current?.abort();
    modelConnectionTestAbortController.current = null;
    setIsTestingModelConnection(false);
  }

  const canClearWorkspace = hasCurrentWorkspaceContent(text, report);

  return (
    <div className="app-shell">
      <a className="skip-link" href="#report-panel">
        跳到报告
      </a>
      <header className="topbar">
        <div className="brand">
          <div className="brand-mark">
            <ScrollText aria-hidden="true" />
          </div>
          <div>
            <h1>PlainDoc</h1>
            <p>签字前，先看懂哪里可能伤到你。</p>
          </div>
        </div>
        <div className="topbar-actions">
          <span className="topbar-boundary" aria-label="PlainDoc 是阅读辅助，不替代专业建议">
            <ShieldAlert aria-hidden="true" />
            阅读辅助，不替代专业建议
          </span>
          <span>
            <LockKeyhole aria-hidden="true" />
            本地优先
          </span>
          <a href="https://github.com/ppxu/plaindoc" aria-label="PlainDoc GitHub 仓库">
            <Github aria-hidden="true" />
            GitHub
          </a>
        </div>
      </header>

      <main className="workspace">
        <DocumentInput
          text={text}
          kind={kind}
          examples={documentExamples}
          selectedExampleId={selectedExampleId}
          error={error}
          notice={inputNotice}
          isAnalyzing={isAnalyzing}
          isUploading={isUploading}
          canClearWorkspace={canClearWorkspace}
          history={history}
          modelSettings={modelSettings}
          modelTextConsent={modelTextConsent}
          modelConnectionStatus={modelConnectionStatus}
          isTestingModelConnection={isTestingModelConnection}
          evidenceSelection={evidenceSelection}
          textFocusRequest={documentTextFocusRequest}
          onTextChange={handleTextChange}
          onKindChange={handleKindChange}
          onExampleChange={handleExampleChange}
          onAnalyze={handleAnalyze}
          onCancelAnalysis={handleCancelAnalysis}
          onUpload={handleUpload}
          onClearWorkspace={handleClearWorkspace}
          onClearLocalData={handleClearLocalData}
          onSelectHistory={handleSelectHistory}
          onClearHistory={handleClearHistory}
          onModelSettingsChange={handleModelSettingsChange}
          onClearModelSettings={handleClearModelSettings}
          onModelTextConsentChange={handleModelTextConsentChange}
          onTestModelConnection={handleTestModelConnection}
          onRedactSensitiveText={handleRedactSensitiveText}
        />
        <ReportPanel
          ref={reportPanelRef}
          report={report}
          onCopyChecklist={copyChecklist}
          onCopyActionMessage={copyActionMessage}
          onRevealEvidence={handleRevealEvidence}
        />
      </main>
    </div>
  );
}

async function extractUploadedPdfText(file: File): Promise<string> {
  const { extractTextFromPdf } = await import("./ingest/pdf");
  return extractTextFromPdf(file);
}

function resolveAnalysisKind(text: string, selectedKind: DocumentKind): { kind: DocumentKind; notice: string } {
  const detection = detectDocumentKind(text);
  if (detection.kind === "unknown") {
    return selectedKind === "unknown"
      ? {
          kind: selectedKind,
          notice: "暂未识别出明确文件类型，已按通用风险模式分析。你也可以手动选择更接近的类型后重新生成。"
        }
      : { kind: selectedKind, notice: "" };
  }

  if (selectedKind === "unknown") {
    return {
      kind: detection.kind,
      notice: `已自动识别为${getDocumentKindLabel(detection.kind)}，并按该类型生成风险清单。你仍可手动修改文件类型后重新生成。`
    };
  }

  if (selectedKind !== detection.kind && detection.confidence === "high") {
    return {
      kind: detection.kind,
      notice: `文本特征更像${getDocumentKindLabel(detection.kind)}，已自动切换规则包。你仍可手动改回${getDocumentKindLabel(selectedKind)}后重新生成。`
    };
  }

  if (selectedKind !== detection.kind) {
    return {
      kind: selectedKind,
      notice: `文本也出现了${getDocumentKindLabel(detection.kind)}特征；当前仍按${getDocumentKindLabel(selectedKind)}分析。`
    };
  }

  return {
    kind: selectedKind,
    notice: `已识别为${getDocumentKindLabel(detection.kind)}，当前规则包匹配。`
  };
}

function mergeNotices(...notices: string[]): string {
  return notices.filter(Boolean).join(" ");
}

function mergeReportNotice(report: AnalysisReport, baseNotice: string): AnalysisReport {
  return {
    ...report,
    notice: mergeNotices(baseNotice, report.notice ?? "")
  };
}

function focusReportPanel(reportPanelRef: RefObject<HTMLElement | null>): void {
  window.requestAnimationFrame(() => {
    const reportPanel = reportPanelRef.current;
    if (!reportPanel) return;
    reportPanel.scrollIntoView({ block: "start" });
    reportPanel.focus({ preventScroll: true });
  });
}

function hasCurrentWorkspaceContent(text: string, report: AnalysisReport): boolean {
  return Boolean(text.trim() || report.wordCount || report.findings.length || report.facts.length);
}

function confirmLocalDataReset(): boolean {
  return window.confirm(
    "确定要清除本机数据吗？\n\n这会清空当前正文、当前报告、最近报告历史、模型设置和 AI 发送确认。离线应用缓存不会被删除。"
  );
}

function confirmWorkspaceClear(): boolean {
  return window.confirm(
    "确定要清空当前文件吗？\n\n这会清空当前正文和当前报告，但不会删除最近报告历史或模型设置。"
  );
}

function confirmReportHistoryClear(): boolean {
  return window.confirm(
    "确定要清空最近报告历史吗？\n\n这只会删除本机保存的最近报告记录，不会清空当前正文、当前报告或模型设置。"
  );
}

function confirmModelSettingsClear(): boolean {
  return window.confirm(
    "确定要清除模型设置吗？\n\n这会清空 endpoint、模型名、API key 和 AI 发送确认，但不会清空当前正文或最近报告历史。"
  );
}
