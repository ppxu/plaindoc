import { useEffect, useRef, useState, type DragEvent } from "react";
import { FileText, FolderOpen, ShieldCheck, Sparkles, Square, Trash2, Upload } from "lucide-react";
import type { DocumentExample, DocumentKind, EvidenceSelectionTarget, ModelAnalyzerSettings, SavedReport } from "../types";
import { getModelEndpointSecurity, modelEndpointNeedsApiKey, type ModelEndpointSecurity } from "../analyzer/modelEndpointSecurity";
import { documentKindMeta, documentKindOptions } from "../data/documentKinds";
import { ModelSettingsPanel } from "./ModelSettingsPanel";
import { ReportHistory } from "./ReportHistory";
import { detectSensitiveText, redactSensitiveText } from "../privacy/sensitiveText";
import { formatDocumentInputStats } from "../state/documentInputStats";

interface DocumentInputProps {
  text: string;
  kind: DocumentKind;
  examples: DocumentExample[];
  selectedExampleId: string;
  error: string;
  notice: string;
  isAnalyzing: boolean;
  isUploading: boolean;
  canClearWorkspace: boolean;
  history: SavedReport[];
  modelSettings: ModelAnalyzerSettings;
  modelTextConsent: boolean;
  modelConnectionStatus: { tone: "success" | "error"; message: string } | null;
  isTestingModelConnection: boolean;
  evidenceSelection: EvidenceSelectionTarget | null;
  textFocusRequest: number;
  errorFocusRequest: number;
  onTextChange: (text: string) => void;
  onKindChange: (kind: DocumentKind) => void;
  onExampleChange: (id: string) => void;
  onAnalyze: () => void;
  onCancelAnalysis: () => void;
  onUpload: (file: File, options?: { ignoredFileCount?: number }) => void;
  onClearWorkspace: () => void;
  onClearLocalData: () => void;
  onSelectHistory: (item: SavedReport) => void;
  onClearHistory: () => void;
  onModelSettingsChange: (settings: ModelAnalyzerSettings) => void;
  onClearModelSettings: () => void;
  onModelTextConsentChange: (checked: boolean) => void;
  onTestModelConnection: () => void;
  onCancelModelConnectionTest: () => void;
  onRedactSensitiveText: (text: string) => void;
}

export function DocumentInput({
  text,
  kind,
  examples,
  selectedExampleId,
  error,
  notice,
  isAnalyzing,
  isUploading,
  canClearWorkspace,
  history,
  modelSettings,
  modelTextConsent,
  modelConnectionStatus,
  isTestingModelConnection,
  evidenceSelection,
  textFocusRequest,
  errorFocusRequest,
  onTextChange,
  onKindChange,
  onExampleChange,
  onAnalyze,
  onCancelAnalysis,
  onUpload,
  onClearWorkspace,
  onClearLocalData,
  onSelectHistory,
  onClearHistory,
  onModelSettingsChange,
  onClearModelSettings,
  onModelTextConsentChange,
  onTestModelConnection,
  onCancelModelConnectionTest,
  onRedactSensitiveText
}: DocumentInputProps) {
  const selectedKindMeta = documentKindMeta[kind];
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const errorRef = useRef<HTMLParagraphElement>(null);
  const [isUploadDragActive, setIsUploadDragActive] = useState(false);
  const sensitiveTextSummary = detectSensitiveText(text);

  useEffect(() => {
    if (!evidenceSelection) return;
    const textarea = textareaRef.current;
    if (!textarea) return;
    selectEvidenceText(textarea, evidenceSelection);
  }, [evidenceSelection]);

  useEffect(() => {
    if (textFocusRequest > 0) {
      textareaRef.current?.focus();
    }
  }, [textFocusRequest]);

  useEffect(() => {
    if (errorFocusRequest > 0) {
      errorRef.current?.focus();
      errorRef.current?.scrollIntoView({ block: "center", behavior: "smooth" });
    }
  }, [errorFocusRequest]);

  function handleUploadDragOver(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();
  }

  function handleUploadDragEnter(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    if (!isUploading && !isAnalyzing) {
      setIsUploadDragActive(true);
    }
  }

  function handleUploadDragLeave(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    setIsUploadDragActive(false);
  }

  function handleUploadDrop(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    setIsUploadDragActive(false);
    if (isUploading || isAnalyzing) return;
    const files = event.dataTransfer.files;
    const file = files?.[0];
    const ignoredFileCount = Math.max(0, files.length - 1);
    if (file) {
      onUpload(file, { ignoredFileCount });
    }
  }

  return (
    <section className="input-panel" aria-label="文件输入与分析设置" aria-busy={isAnalyzing || isUploading}>
      <div className="panel-heading">
        <div>
          <p className="section-label">文件</p>
          <h2>准备检查的文件</h2>
        </div>
        <FileText aria-hidden="true" />
      </div>

      <label className="field">
        <span>文件类型</span>
        <select value={kind} onChange={(event) => onKindChange(event.target.value as DocumentKind)}>
          {documentKindOptions.map((option) => (
            <option key={option.kind} value={option.kind}>
              {option.label}
            </option>
          ))}
        </select>
      </label>

      <section className="coverage-panel" aria-label={`${selectedKindMeta.label}重点检查项`}>
        <div>
          <ShieldCheck aria-hidden="true" />
          <span>{selectedKindMeta.label}重点检查</span>
        </div>
        <ul>
          {selectedKindMeta.coverage.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>

      <label className="field">
        <span>快速样例</span>
        <select value={selectedExampleId} onChange={(event) => onExampleChange(event.target.value)}>
          <option value="">自定义/上传文本</option>
          {examples.map((example) => (
            <option key={example.id} value={example.id}>
              {example.title}
            </option>
          ))}
        </select>
      </label>

      <div className="workspace-actions">
        <label
          className={uploadStripClassName(isUploading, isAnalyzing, isUploadDragActive)}
          aria-label={uploadStripAriaLabel(isUploading, isAnalyzing)}
          aria-describedby="upload-format-hint"
          aria-disabled={isUploading || isAnalyzing}
          onDragEnter={handleUploadDragEnter}
          onDragOver={handleUploadDragOver}
          onDragLeave={handleUploadDragLeave}
          onDrop={handleUploadDrop}
        >
          <Upload aria-hidden="true" />
          <span>{uploadStripLabel(isUploading, isAnalyzing, isUploadDragActive)}</span>
          <input
            type="file"
            accept=".pdf,.txt,.md,.png,.jpg,.jpeg,.webp,.heic,.heif,application/pdf,text/plain,text/markdown,image/*"
            disabled={isUploading || isAnalyzing}
            onChange={(event) => {
              const file = event.currentTarget.files?.[0];
              if (file) {
                onUpload(file);
              }
              event.currentTarget.value = "";
            }}
          />
        </label>
        <button
          className="clear-workspace-button"
          type="button"
          onClick={onClearWorkspace}
          disabled={isUploading || isAnalyzing || !canClearWorkspace}
          title="清空当前文件正文和报告"
          aria-label="清空当前文件正文和报告"
        >
          <Trash2 aria-hidden="true" />
          <span>清空当前文件</span>
        </button>
      </div>
      <p className="upload-hint" id="upload-format-hint">
        支持可选中文本 PDF、.txt、.md；扫描版 PDF 或照片请先 OCR 后再上传。
      </p>

      <ReportHistory items={history} onSelect={onSelectHistory} onClear={onClearHistory} />

      <ModelSettingsPanel
        settings={modelSettings}
        documentText={text}
        modelTextConsent={modelTextConsent}
        modelConnectionStatus={modelConnectionStatus}
        isTestingModelConnection={isTestingModelConnection}
        sensitiveTextSummary={sensitiveTextSummary}
        onChange={onModelSettingsChange}
        onClear={onClearModelSettings}
        onModelTextConsentChange={onModelTextConsentChange}
        onTestModelConnection={onTestModelConnection}
        onCancelModelConnectionTest={onCancelModelConnectionTest}
        onRedactSensitiveText={() => onRedactSensitiveText(redactSensitiveText(text))}
      />

      <label className="field text-field">
        <span className="field-label-row">
          <span>文件正文</span>
          <span className="field-meta">{formatDocumentInputStats(text)}</span>
        </span>
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(event) => onTextChange(event.target.value)}
          placeholder="粘贴合同、协议或条款文字..."
        />
      </label>

      {error ? (
        <p ref={errorRef} className="error-message" role="alert" aria-live="assertive" tabIndex={-1}>
          {error}
        </p>
      ) : null}
      {notice ? (
        <p className="input-notice" role="status" aria-live="polite">
          {notice}
        </p>
      ) : null}

      <div className="analysis-actions">
        <button className="primary-action" type="button" onClick={onAnalyze} disabled={isAnalyzing || isUploading}>
          <Sparkles aria-hidden="true" />
          {analyzeButtonLabel(isUploading, isAnalyzing, modelSettings, modelTextConsent)}
        </button>
        {isAnalyzing ? (
          <button className="cancel-analysis-button" type="button" onClick={onCancelAnalysis}>
            <Square aria-hidden="true" />
            取消 AI 分析
          </button>
        ) : null}
      </div>

      <div className="privacy-note">
        <div>
          <FolderOpen aria-hidden="true" />
          <span>
            {modelSettings.enabled
              ? "默认先做本地分析并保存正文草稿；开启 AI 增强后才会调用你配置的模型服务。"
              : "当前在浏览器本地处理文本并保存正文草稿，不上传文件。"}
          </span>
        </div>
        <button
          type="button"
          onClick={onClearLocalData}
          disabled={isUploading}
          aria-label="清除本机数据"
          title="清除当前正文、报告历史、模型设置和 AI 发送确认"
        >
          <Trash2 aria-hidden="true" />
          清除本机数据
        </button>
      </div>
    </section>
  );
}

function uploadStripLabel(isUploading: boolean, isAnalyzing: boolean, isUploadDragActive: boolean): string {
  if (isUploading) return "正在读取文件...";
  if (isAnalyzing) return "分析中，暂不能上传文件";
  if (isUploadDragActive) return "松开即可读取文件";
  return "点击上传或拖入 PDF / .txt / .md / 图片文件";
}

function uploadStripAriaLabel(isUploading: boolean, isAnalyzing: boolean): string {
  if (isUploading) return "正在读取文件，暂不能上传新文件";
  if (isAnalyzing) return "AI 分析中，暂不能上传文件";
  return "上传或拖入 PDF、txt、md 或图片文件";
}

function uploadStripClassName(isUploading: boolean, isAnalyzing: boolean, isUploadDragActive: boolean): string {
  const classes = ["upload-strip"];
  if (isUploadDragActive) classes.push("drag-active");
  if (isUploading || isAnalyzing) classes.push("is-disabled");
  return classes.join(" ");
}

function analyzeButtonLabel(
  isUploading: boolean,
  isAnalyzing: boolean,
  modelSettings: ModelAnalyzerSettings,
  modelTextConsent: boolean
): string {
  if (isUploading) return "正在读取文件...";
  if (isAnalyzing) return "正在增强分析...";
  if (!modelSettings.enabled) return "生成风险清单";
  const endpointSecurity = getModelEndpointSecurity(modelSettings.baseUrl);
  if (!endpointSecurity.ok) return modelEndpointButtonBlockLabel(endpointSecurity);
  if (modelEndpointNeedsApiKey(modelSettings.baseUrl) && !modelSettings.apiKey.trim()) return "生成本地清单（缺少 API key）";
  if (!modelTextConsent) return "生成本地清单（未确认 AI 发送）";
  return "生成 AI 增强清单";
}

function modelEndpointButtonBlockLabel(endpointSecurity: ModelEndpointSecurity): string {
  if (endpointSecurity.ok) return "生成 AI 增强清单";
  if (endpointSecurity.reason === "invalid_url") return "生成本地清单（endpoint 无效）";
  if (endpointSecurity.reason === "unsupported_protocol") return "生成本地清单（endpoint 协议不支持）";
  return "生成本地清单（endpoint 不安全）";
}

function selectEvidenceText(textarea: HTMLTextAreaElement, selection: EvidenceSelectionTarget): void {
  try {
    textarea.focus();
    textarea.setSelectionRange(selection.start, selection.end);
    textarea.scrollIntoView({ block: "center", behavior: "smooth" });
  } catch {
    // Evidence locating is a convenience; blocked DOM selection should not break document editing.
  }
}
