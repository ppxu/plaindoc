import { useEffect, useRef } from "react";
import { FileText, FolderOpen, ShieldCheck, Sparkles, Square, Trash2, Upload } from "lucide-react";
import type { DocumentExample, DocumentKind, EvidenceSelectionTarget, ModelAnalyzerSettings, SavedReport } from "../types";
import { getModelEndpointSecurity, modelEndpointNeedsApiKey, type ModelEndpointSecurity } from "../analyzer/modelEndpointSecurity";
import { documentKindMeta, documentKindOptions } from "../data/documentKinds";
import { ModelSettingsPanel } from "./ModelSettingsPanel";
import { ReportHistory } from "./ReportHistory";
import { detectSensitiveText, redactSensitiveText } from "../privacy/sensitiveText";

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
  onTextChange: (text: string) => void;
  onKindChange: (kind: DocumentKind) => void;
  onExampleChange: (id: string) => void;
  onAnalyze: () => void;
  onCancelAnalysis: () => void;
  onUpload: (file: File) => void;
  onClearWorkspace: () => void;
  onClearLocalData: () => void;
  onSelectHistory: (item: SavedReport) => void;
  onClearHistory: () => void;
  onModelSettingsChange: (settings: ModelAnalyzerSettings) => void;
  onClearModelSettings: () => void;
  onModelTextConsentChange: (checked: boolean) => void;
  onTestModelConnection: () => void;
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
  onRedactSensitiveText
}: DocumentInputProps) {
  const selectedKindMeta = documentKindMeta[kind];
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const sensitiveTextSummary = detectSensitiveText(text);

  useEffect(() => {
    if (!evidenceSelection) return;
    const textarea = textareaRef.current;
    if (!textarea) return;
    selectEvidenceText(textarea, evidenceSelection);
  }, [evidenceSelection]);

  return (
    <section className="input-panel" aria-label="Document input" aria-busy={isAnalyzing || isUploading}>
      <div className="panel-heading">
        <div>
          <p className="section-label">Document</p>
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
        <label className="upload-strip">
          <Upload aria-hidden="true" />
          <span>{isUploading ? "正在读取文件..." : "上传 PDF / .txt / .md 文件"}</span>
          <input
            type="file"
            accept=".pdf,.txt,.md,application/pdf,text/plain,text/markdown"
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
        onRedactSensitiveText={() => onRedactSensitiveText(redactSensitiveText(text))}
      />

      <label className="field text-field">
        <span>文件正文</span>
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(event) => onTextChange(event.target.value)}
          placeholder="粘贴合同、协议或条款文字..."
        />
      </label>

      {error ? (
        <p className="error-message" role="alert" aria-live="assertive">
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
          <span>{modelSettings.enabled ? "默认先做本地分析；开启 AI 增强后才会调用你配置的模型服务。" : "当前在浏览器本地处理文本，不上传文件。"}</span>
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
