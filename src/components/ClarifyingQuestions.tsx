import { useEffect, useRef, useState } from "react";
import { MessagesSquare } from "lucide-react";
import type { ClarifyingQuestion } from "../types";
import { copyTextToClipboard } from "../utils/clipboard";

interface ClarifyingQuestionsProps {
  questions: ClarifyingQuestion[];
}

export function ClarifyingQuestions({ questions }: ClarifyingQuestionsProps) {
  const [copyState, setCopyState] = useState<"idle" | "copied" | "failed">("idle");
  const questionsText = clarifyingQuestionsToText(questions);
  const questionsFallbackRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setCopyState("idle");
  }, [questionsText]);

  useEffect(() => {
    if (copyState === "failed") {
      selectFallbackText(questionsFallbackRef.current);
    }
  }, [copyState]);

  async function handleCopy() {
    setCopyState((await copyTextToClipboard(questionsText)) ? "copied" : "failed");
  }

  if (!questions.length) return null;

  return (
    <section className="report-section clarifying-questions-section">
      <div className="section-row">
        <div>
          <p className="section-label">追问</p>
          <h3>签前追问</h3>
        </div>
        <button className="ghost-button" type="button" onClick={handleCopy}>
          <MessagesSquare aria-hidden="true" />
          {copyLabel(copyState)}
        </button>
      </div>

      <ol className="clarifying-questions">
        {questions.map((item) => (
          <li key={item.question} className={item.severity}>
            <span>{item.askBeforeSigning ? "签前必须问" : "建议追问"}</span>
            <strong>{item.question}</strong>
            <small>为什么要问：{item.whyItMatters}</small>
          </li>
        ))}
      </ol>

      {copyState === "failed" ? (
        <div className="report-copy-fallback">
          <span className="report-copy-fallback-message" role="alert" aria-live="assertive">
            浏览器没有允许自动复制。可以在这里手动复制签前追问。
          </span>
          <textarea ref={questionsFallbackRef} readOnly value={questionsText} aria-label="签前追问，可手动复制" />
        </div>
      ) : null}
    </section>
  );
}

function clarifyingQuestionsToText(questions: ClarifyingQuestion[]): string {
  return questions
    .map((item, index) => [
      `${index + 1}. ${item.question}`,
      `   为什么要问：${item.whyItMatters}`,
      `   ${item.askBeforeSigning ? "签前必须问" : "建议追问"}`
    ].join("\n"))
    .join("\n");
}

function copyLabel(state: "idle" | "copied" | "failed"): string {
  if (state === "copied") return "已复制";
  if (state === "failed") return "复制失败";
  return "复制追问";
}

function selectFallbackText(textarea: HTMLTextAreaElement | null): void {
  if (!textarea) return;
  textarea.focus();
  textarea.select();
  try {
    textarea.setSelectionRange(0, textarea.value.length);
  } catch {
    // The visible textarea remains available even if a browser refuses programmatic selection.
  }
}
