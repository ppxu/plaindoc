import { FileText, FolderOpen, Sparkles, Upload } from "lucide-react";
import type { DocumentExample, DocumentKind, ModelAnalyzerSettings } from "../types";
import { ModelSettingsPanel } from "./ModelSettingsPanel";

interface DocumentInputProps {
  text: string;
  kind: DocumentKind;
  examples: DocumentExample[];
  selectedExampleId: string;
  error: string;
  notice: string;
  isAnalyzing: boolean;
  isUploading: boolean;
  modelSettings: ModelAnalyzerSettings;
  onTextChange: (text: string) => void;
  onKindChange: (kind: DocumentKind) => void;
  onExampleChange: (id: string) => void;
  onAnalyze: () => void;
  onUpload: (file: File) => void;
  onModelSettingsChange: (settings: ModelAnalyzerSettings) => void;
  onClearModelSettings: () => void;
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
  modelSettings,
  onTextChange,
  onKindChange,
  onExampleChange,
  onAnalyze,
  onUpload,
  onModelSettingsChange,
  onClearModelSettings
}: DocumentInputProps) {
  return (
    <section className="input-panel" aria-label="Document input">
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
          <option value="rental">租房合同</option>
          <option value="employment">劳动协议</option>
          <option value="renovation">装修合同</option>
          <option value="unknown">不确定</option>
        </select>
      </label>

      <label className="field">
        <span>快速样例</span>
        <select value={selectedExampleId} onChange={(event) => onExampleChange(event.target.value)}>
          {examples.map((example) => (
            <option key={example.id} value={example.id}>
              {example.title}
            </option>
          ))}
        </select>
      </label>

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

      <ModelSettingsPanel
        settings={modelSettings}
        onChange={onModelSettingsChange}
        onClear={onClearModelSettings}
      />

      <label className="field text-field">
        <span>文件正文</span>
        <textarea
          value={text}
          onChange={(event) => onTextChange(event.target.value)}
          placeholder="粘贴合同、协议或条款文字..."
        />
      </label>

      {error ? <p className="error-message">{error}</p> : null}
      {notice ? <p className="input-notice">{notice}</p> : null}

      <button className="primary-action" type="button" onClick={onAnalyze} disabled={isAnalyzing || isUploading}>
        <Sparkles aria-hidden="true" />
        {isUploading ? "正在读取文件..." : isAnalyzing ? "正在增强分析..." : modelSettings.enabled ? "生成 AI 增强清单" : "生成风险清单"}
      </button>

      <div className="privacy-note">
        <FolderOpen aria-hidden="true" />
        <span>{modelSettings.enabled ? "默认先做本地分析；开启 AI 增强后才会调用你配置的模型服务。" : "当前在浏览器本地处理文本，不上传文件。"}</span>
      </div>
    </section>
  );
}
