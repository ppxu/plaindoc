import { useEffect, useRef, useState } from "react";
import { ClipboardCheck } from "lucide-react";
import type { ChecklistItem } from "../types";

interface ChecklistProps {
  items: ChecklistItem[];
  onCopy: () => Promise<boolean>;
}

export function Checklist({ items, onCopy }: ChecklistProps) {
  const [copyState, setCopyState] = useState<"idle" | "copied" | "failed">("idle");
  const checklistText = checklistToText(items);
  const checklistFallbackRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setCopyState("idle");
  }, [checklistText]);

  useEffect(() => {
    if (copyState === "failed") {
      selectFallbackText(checklistFallbackRef.current);
    }
  }, [copyState]);

  async function handleCopy() {
    setCopyState((await onCopy()) ? "copied" : "failed");
  }

  return (
    <section className="report-section checklist-section">
      <div className="section-row">
        <div>
          <p className="section-label">清单</p>
          <h3>签署前问题清单</h3>
        </div>
        <button className="ghost-button" type="button" onClick={handleCopy}>
          <ClipboardCheck aria-hidden="true" />
          {copyLabel(copyState, "复制清单")}
        </button>
      </div>
      <ol className="checklist">
        {items.map((item) => (
          <li key={item.question} className={item.severity}>
            <span>{item.question}</span>
            <small>{item.reason}</small>
          </li>
        ))}
      </ol>
      {copyState === "failed" ? (
        <div className="report-copy-fallback">
          <span className="report-copy-fallback-message" role="alert" aria-live="assertive">
            浏览器没有允许自动复制。可以在这里手动复制签署前问题清单。
          </span>
          <textarea
            ref={checklistFallbackRef}
            readOnly
            value={checklistText}
            aria-label="签署前问题清单，可手动复制"
          />
        </div>
      ) : null}
    </section>
  );
}

function copyLabel(state: "idle" | "copied" | "failed", idleText: string): string {
  if (state === "copied") return "已复制";
  if (state === "failed") return "复制失败";
  return idleText;
}

function checklistToText(items: ChecklistItem[]): string {
  return items.map((item, index) => `${index + 1}. ${item.question}\n   ${item.reason}`).join("\n");
}

function selectFallbackText(textarea: HTMLTextAreaElement | null): void {
  if (!textarea) return;

  textarea.focus();
  textarea.select();

  try {
    textarea.setSelectionRange(0, textarea.value.length);
  } catch {
    // Some embedded browsers expose select() but reject explicit selection ranges.
  }
}
