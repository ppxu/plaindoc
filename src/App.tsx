import { useState } from "react";
import { Github, LockKeyhole, ScrollText } from "lucide-react";
import { detectDocumentKind, type DocumentKindDetection } from "./analyzer/documentKindDetector";
import { analyzeDocument } from "./analyzer/localAnalyzer";
import { analyzeWithModel } from "./analyzer/modelAnalyzer";
import { clearModelSettings, loadModelSettings, saveModelSettings } from "./analyzer/modelSettings";
import { DocumentInput } from "./components/DocumentInput";
import { ReportPanel } from "./components/ReportPanel";
import { getDocumentKindLabel } from "./data/documentKinds";
import { documentExamples } from "./data/examples";
import { clearReportHistory, loadReportHistory, saveReportToHistory } from "./history/reportHistory";
import { restoreSavedReport } from "./history/reportRestore";
import { isPdfFile } from "./ingest/pdfText";
import type { AnalysisReport, DocumentKind, ModelAnalyzerSettings, SavedReport } from "./types";
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
  const [history, setHistory] = useState<SavedReport[]>(() => loadReportHistory());

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
    setSelectedExampleId("");
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

    const resolvedKind = resolveAnalysisKind(text, kind);
    const localReport = analyzeDocument({ text, kind: resolvedKind.kind });
    setReport(localReport);
    if (resolvedKind.kind !== kind) {
      setKind(resolvedKind.kind);
      setSelectedExampleId("");
    }
    setInputNotice(resolvedKind.notice);

    if (!modelSettings.enabled) {
      setHistory(saveReportToHistory(localReport));
      return;
    }

    setIsAnalyzing(true);
    try {
      const modelReport = await analyzeWithModel({ text, kind: resolvedKind.kind }, modelSettings, localReport);
      setReport(modelReport);
      setHistory(saveReportToHistory(modelReport));
      if (!modelSettings.apiKey.trim()) {
        setError("AI 增强已开启，但缺少 API key，已回退到本地分析。");
      }
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : "模型调用失败。";
      const fallbackReport = {
        ...localReport,
        notice: `AI 增强失败，已回退到本地规则分析：${message}`
      };
      setReport(fallbackReport);
      setHistory(saveReportToHistory(fallbackReport));
      setError(`AI 增强失败，已回退到本地分析：${message}`);
    } finally {
      setIsAnalyzing(false);
    }
  }

  function handleSelectHistory(item: SavedReport) {
    const restored = restoreSavedReport(item);
    setReport(restored.report);
    setKind(restored.kind);
    setText(restored.text);
    setSelectedExampleId(restored.selectedExampleId);
    setError(restored.error);
    setInputNotice(restored.notice);
  }

  function handleClearHistory() {
    setHistory(clearReportHistory());
    setInputNotice("已清空本地报告历史。");
    setError("");
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
      const detection = detectDocumentKind(fileText);
      if (detection.kind !== "unknown") {
        setKind(detection.kind);
      }
      setError("");
      setInputNotice(buildUploadNotice(isPdfUpload, fileText, detection));
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
          history={history}
          modelSettings={modelSettings}
          onTextChange={handleTextChange}
          onKindChange={setKind}
          onExampleChange={handleExampleChange}
          onAnalyze={handleAnalyze}
          onUpload={handleUpload}
          onSelectHistory={handleSelectHistory}
          onClearHistory={handleClearHistory}
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

function buildUploadNotice(isPdfUpload: boolean, text: string, detection: DocumentKindDetection): string {
  const prefix = `${isPdfUpload ? "已从 PDF 提取" : "已读取"} ${text.trim().length} 个字符`;
  if (detection.kind === "unknown") {
    return `${prefix}，暂未识别出明确文件类型。你可以选择文件类型后生成风险清单。`;
  }
  return `${prefix}，已自动识别为${getDocumentKindLabel(detection.kind)}。如不准确，可手动修改文件类型。`;
}
