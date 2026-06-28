import { useState } from "react";
import { Github, LockKeyhole, ScrollText } from "lucide-react";
import { analyzeDocument } from "./analyzer/localAnalyzer";
import { analyzeWithModel } from "./analyzer/modelAnalyzer";
import { clearModelSettings, loadModelSettings, saveModelSettings } from "./analyzer/modelSettings";
import { DocumentInput } from "./components/DocumentInput";
import { ReportPanel } from "./components/ReportPanel";
import { documentExamples } from "./data/examples";
import { isPdfFile } from "./ingest/pdfText";
import type { AnalysisReport, DocumentKind, ModelAnalyzerSettings } from "./types";
import { copyTextToClipboard } from "./utils/clipboard";

const MAX_UPLOAD_BYTES = 20 * 1024 * 1024;

export default function App() {
  const firstExample = documentExamples[0];
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

  function handleExampleChange(id: string) {
    const example = documentExamples.find((item) => item.id === id);
    if (!example) return;
    setSelectedExampleId(id);
    setText(example.content);
    setKind(example.kind);
    setError("");
    setInputNotice("");
  }

  function handleTextChange(nextText: string) {
    setText(nextText);
    setInputNotice("");
  }

  async function handleAnalyze() {
    if (!text.trim()) {
      setError("请先粘贴文件内容、选择样例或上传文本文件。");
      return;
    }

    if (text.trim().length < 80) {
      setError("文本较短，报告可能不完整。你仍然可以继续生成。");
    } else {
      setError("");
    }

    const localReport = analyzeDocument({ text, kind });
    setReport(localReport);

    if (!modelSettings.enabled) {
      return;
    }

    setIsAnalyzing(true);
    try {
      const modelReport = await analyzeWithModel({ text, kind }, modelSettings, localReport);
      setReport(modelReport);
      if (!modelSettings.apiKey.trim()) {
        setError("AI 增强已开启，但缺少 API key，已回退到本地分析。");
      }
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : "模型调用失败。";
      setReport({
        ...localReport,
        notice: `AI 增强失败，已回退到本地规则分析：${message}`
      });
      setError(`AI 增强失败，已回退到本地分析：${message}`);
    } finally {
      setIsAnalyzing(false);
    }
  }

  function handleModelSettingsChange(settings: ModelAnalyzerSettings) {
    setModelSettings(settings);
    saveModelSettings(settings);
  }

  function handleClearModelSettings() {
    clearModelSettings();
    const next = loadModelSettings();
    setModelSettings(next);
    setError("");
  }

  async function handleUpload(file: File) {
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
    setError("");
    setInputNotice("");

    try {
      const fileText = isPdfUpload ? await extractUploadedPdfText(file) : await file.text();
      if (!fileText.trim()) {
        setError("没有从文件中读取到可分析文本。如果这是扫描版 PDF，请先使用 OCR，或复制关键条款粘贴到正文框。");
        return;
      }
      setText(fileText);
      setSelectedExampleId("");
      setError("");
      setInputNotice(`${isPdfUpload ? "已从 PDF 提取" : "已读取"} ${fileText.trim().length} 个字符，可继续生成风险清单。`);
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

  return (
    <div className="app-shell">
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
          modelSettings={modelSettings}
          onTextChange={handleTextChange}
          onKindChange={setKind}
          onExampleChange={handleExampleChange}
          onAnalyze={handleAnalyze}
          onUpload={handleUpload}
          onModelSettingsChange={handleModelSettingsChange}
          onClearModelSettings={handleClearModelSettings}
        />
        <ReportPanel report={report} onCopyChecklist={copyChecklist} onCopyActionMessage={copyActionMessage} />
      </main>
    </div>
  );
}

async function extractUploadedPdfText(file: File): Promise<string> {
  const { extractTextFromPdf } = await import("./ingest/pdf");
  return extractTextFromPdf(file);
}
