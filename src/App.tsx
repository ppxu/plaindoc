import { useEffect, useRef, useState } from "react";
import { Github, LockKeyhole, ScrollText } from "lucide-react";
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
import { createDraftTextState } from "./state/draftText";
import { createExampleSelectionState } from "./state/exampleSelection";
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
  const analysisRunTracker = useRef(createAnalysisRunTracker());
  const modelRequestAbortController = useRef<AbortController | null>(null);
  const modelConnectionTestAbortController = useRef<AbortController | null>(null);
  const modelConnectionTestRunId = useRef(0);
  const [text, setText] = useState(firstExample.content);
  const [kind, setKind] = useState<DocumentKind>(firstExample.kind);
  const [selectedExampleId, setSelectedExampleId] = useState(firstExample.id);
  const [error, setError] = useState("");
  const [inputNotice, setInputNotice] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [report, setReport] = useState<AnalysisReport>(() =>
    analyzeDocument({ text: firstExample.content, kind: firstExample.kind })
  );
  const [modelSettings, setModelSettings] = useState<ModelAnalyzerSettings>(() => loadModelSettings());
  const [modelTextConsent, setModelTextConsent] = useState(false);
  const [isTestingModelConnection, setIsTestingModelConnection] = useState(false);
  const [modelConnectionStatus, setModelConnectionStatus] = useState<ModelConnectionStatus>(null);
  const [history, setHistory] = useState<SavedReport[]>(() => loadReportHistory());
  const [evidenceSelection, setEvidenceSelection] = useState<EvidenceSelectionTarget | null>(null);

  useEffect(() => {
    function handleBeforeUnload(event: BeforeUnloadEvent) {
      if (!shouldWarnBeforeLeaving({ text, selectedExampleId, isAnalyzing })) {
        return;
      }

      event.preventDefault();
      event.returnValue = "";
    }

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [text, selectedExampleId, isAnalyzing]);

  function handleExampleChange(id: string) {
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
  }

  async function handleAnalyze() {
    abortCurrentModelRequest();
    const runId = analysisRunTracker.current.begin();
    if (!text.trim()) {
      setError("请先粘贴文件内容、选择样例或上传文本文件。");
      return;
    }

    if (text.trim().length < 80) {
      setError("文本较短，报告可能不完整。你仍然可以继续生成。");
    } else {
      setError("");
    }

    const resolvedKind = resolveAnalysisKind(text, kind);
    const localReport = analyzeDocument({ text, kind: resolvedKind.kind });
    setReport(localReport);
    if (resolvedKind.kind !== kind) {
      setKind(resolvedKind.kind);
      setSelectedExampleId("");
    }
    setInputNotice(resolvedKind.notice);

    const runtimeModelSettings = normalizeModelSettingsForRuntime(modelSettings);
    const endpointSecurity = getModelEndpointSecurity(runtimeModelSettings.baseUrl);
    const needsModelApiKey = modelEndpointNeedsApiKey(runtimeModelSettings.baseUrl);
    if (modelSettings.enabled && !endpointSecurity.ok) {
      setHistory(saveReportToHistory(localReport));
      setInputNotice(modelEndpointSecurityMessage(endpointSecurity));
      return;
    }

    const canUseModel = canSendDocumentTextToModel(modelSettings, modelTextConsent);
    if (!modelSettings.enabled || !canUseModel) {
      setHistory(saveReportToHistory(localReport));
      if (modelSettings.enabled && needsModelApiKey && !runtimeModelSettings.apiKey.trim()) {
        setInputNotice("AI 增强已开启，但缺少 API key，本次仅使用本地规则分析。");
      } else if (modelSettings.enabled && !modelTextConsent) {
        setInputNotice("未确认发送正文给模型服务，本次仅使用本地规则分析。勾选 AI 发送确认后可生成增强清单。");
      }
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
      setReport(modelReport);
      setHistory(saveReportToHistory(modelReport));
      if (needsModelApiKey && !runtimeModelSettings.apiKey.trim()) {
        setError("AI 增强已开启，但缺少 API key，已回退到本地分析。");
      }
    } catch (caught) {
      if (!analysisRunTracker.current.isCurrent(runId)) {
        return;
      }
      const message = caught instanceof Error ? caught.message : "模型调用失败。";
      const fallbackReport = {
        ...localReport,
        notice: `AI 增强失败，已回退到本地规则分析：${message}`
      };
      setReport(fallbackReport);
      setHistory(saveReportToHistory(fallbackReport));
      setError(`AI 增强失败，已回退到本地分析：${message}`);
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
  }

  function handleClearHistory() {
    if (!confirmReportHistoryClear()) {
      return;
    }
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

  async function handleUpload(file: File) {
    invalidateCurrentAnalysis();
    setError("");
    setInputNotice("");
    setModelTextConsent(false);
    if (file.size > MAX_UPLOAD_BYTES) {
      setError("文件超过 20MB。请先压缩、拆分或复制关键条款后再分析。");
      return;
    }

    const filename = file.name.toLowerCase();
    const isTextFile = filename.endsWith(".txt") || filename.endsWith(".md") || file.type.startsWith("text/");
    const isPdfUpload = isPdfFile(file);
    if (!isPdfUpload && !isTextFile) {
      setError("当前支持 PDF、.txt、.md 和纯文本文件。扫描件图片和 OCR 在路线图中。");
      return;
    }

    setIsUploading(true);

    try {
      const fileText = isPdfUpload ? await extractUploadedPdfText(file) : await file.text();
      if (!fileText.trim()) {
        setError("没有从文件中读取到可分析文本。如果这是扫描版 PDF，请先使用 OCR，或复制关键条款粘贴到正文框。");
        return;
      }
      const uploaded = createUploadedTextState({ text: fileText, isPdfUpload, fileName: file.name, fallbackKind: kind });
      setText(uploaded.text);
      setSelectedExampleId(uploaded.selectedExampleId);
      setKind(uploaded.kind);
      setError(uploaded.error);
      setInputNotice(uploaded.notice);
      setReport(uploaded.report);
      setEvidenceSelection(uploaded.evidenceSelection);
      setModelTextConsent(uploaded.modelTextConsent);
    } catch {
      setError("文件读取失败。请确认 PDF 不是加密文件，或直接复制关键条款粘贴到正文框。");
    } finally {
      setIsUploading(false);
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

  function handleCancelAnalysis() {
    abortCurrentModelRequest();
    analysisRunTracker.current.cancel();
    setIsAnalyzing(false);
    setInputNotice("已取消本次 AI 增强分析，当前报告保持为本地规则结果。");
  }

  function invalidateCurrentAnalysis() {
    abortCurrentModelRequest();
    analysisRunTracker.current.invalidate();
    setIsAnalyzing(false);
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
            <p>Know what can hurt you before you sign.</p>
          </div>
        </div>
        <div className="topbar-actions">
          <span>
            <LockKeyhole aria-hidden="true" />
            Local-first MVP
          </span>
          <a href="https://github.com/ppxu/plaindoc" aria-label="PlainDoc GitHub repository">
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
          history={history}
          modelSettings={modelSettings}
          modelTextConsent={modelTextConsent}
          modelConnectionStatus={modelConnectionStatus}
          isTestingModelConnection={isTestingModelConnection}
          evidenceSelection={evidenceSelection}
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
        />
        <ReportPanel
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
