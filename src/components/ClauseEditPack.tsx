import { useEffect, useRef, useState } from "react";
import { ClipboardList } from "lucide-react";
import { clauseEditsToText, getClauseEdits } from "../export/clauseEdits";
import type { RiskFinding } from "../types";
import { copyTextToClipboard } from "../utils/clipboard";

interface ClauseEditPackProps {
  findings: RiskFinding[];
}

export function ClauseEditPack({ findings }: ClauseEditPackProps) {
  const edits = getClauseEdits(findings);
  const editsText = clauseEditsToText(edits);
  const [copyState, setCopyState] = useState<"idle" | "copied" | "failed">("idle");
  const editsFallbackRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setCopyState("idle");
  }, [editsText]);

  useEffect(() => {
    if (copyState === "failed") {
      selectFallbackText(editsFallbackRef.current);
    }
  }, [copyState]);

  if (!edits.length) {
    return null;
  }

  async function copyAllEdits() {
    setCopyState((await copyTextToClipboard(editsText)) ? "copied" : "failed");
  }

  return (
    <section className="report-section clause-pack-section">
      <div className="section-row">
        <div>
          <p className="section-label">条款修改</p>
          <h3>修改条款包</h3>
        </div>
        <button className="ghost-button" type="button" onClick={copyAllEdits}>
          <ClipboardList aria-hidden="true" />
          {copyLabel(copyState)}
        </button>
      </div>

      <div className="clause-pack">
        {edits.map((edit, index) => (
          <article key={`${edit.title}-${index}`} className={edit.severity}>
            <span>{index + 1}</span>
            <div>
              <strong>{edit.title}</strong>
              <p>{edit.text}</p>
            </div>
          </article>
        ))}
      </div>

      {copyState === "failed" ? (
        <div className="report-copy-fallback">
          <span>浏览器没有允许自动复制。可以在这里手动复制修改条款包。</span>
          <textarea ref={editsFallbackRef} readOnly value={editsText} aria-label="修改条款包，可手动复制" />
        </div>
      ) : null}
    </section>
  );
}

function copyLabel(state: "idle" | "copied" | "failed"): string {
  if (state === "copied") return "已复制";
  if (state === "failed") return "复制失败";
  return "复制全部";
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
