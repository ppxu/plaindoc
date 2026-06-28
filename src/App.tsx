import { useMemo, useState } from "react";
import { Github, LockKeyhole, ScrollText } from "lucide-react";
import { analyzeDocument } from "./analyzer/localAnalyzer";
import { DocumentInput } from "./components/DocumentInput";
import { ReportPanel } from "./components/ReportPanel";
import { documentExamples } from "./data/examples";
import type { DocumentKind } from "./types";

export default function App() {
  const firstExample = documentExamples[0];
  const [text, setText] = useState(firstExample.content);
  const [kind, setKind] = useState<DocumentKind>(firstExample.kind);
  const [selectedExampleId, setSelectedExampleId] = useState(firstExample.id);
  const [error, setError] = useState("");
  const [analyzedText, setAnalyzedText] = useState(firstExample.content);
  const [analyzedKind, setAnalyzedKind] = useState<DocumentKind>(firstExample.kind);

  const report = useMemo(
    () => analyzeDocument({ text: analyzedText, kind: analyzedKind }),
    [analyzedText, analyzedKind]
  );

  function handleExampleChange(id: string) {
    const example = documentExamples.find((item) => item.id === id);
    if (!example) return;
    setSelectedExampleId(id);
    setText(example.content);
    setKind(example.kind);
    setError("");
  }

  function handleAnalyze() {
    if (!text.trim()) {
      setError("请先粘贴文件内容、选择样例或上传文本文件。");
      return;
    }

    if (text.trim().length < 80) {
      setError("文本较短，报告可能不完整。你仍然可以继续生成。");
    } else {
      setError("");
    }
    setAnalyzedText(text);
    setAnalyzedKind(kind);
  }

  async function handleUpload(file: File) {
    const isSupported = file.name.endsWith(".txt") || file.name.endsWith(".md") || file.type.startsWith("text/");
    if (!isSupported) {
      setError("当前 MVP 只支持 .txt / .md / 纯文本文件。PDF 和 OCR 在路线图中。");
      return;
    }

    try {
      const fileText = await file.text();
      setText(fileText);
      setSelectedExampleId("");
      setError("");
    } catch {
      setError("文件读取失败，请重试或直接粘贴文本。");
    }
  }

  async function copyChecklist() {
    const checklistText = report.checklist
      .map((item, index) => `${index + 1}. ${item.question}\n   ${item.reason}`)
      .join("\n");
    await navigator.clipboard.writeText(checklistText);
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
          <a href="https://github.com/" aria-label="GitHub repository placeholder">
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
          onTextChange={setText}
          onKindChange={setKind}
          onExampleChange={handleExampleChange}
          onAnalyze={handleAnalyze}
          onUpload={handleUpload}
        />
        <ReportPanel report={report} onCopyChecklist={copyChecklist} />
      </main>
    </div>
  );
}

