import { useEffect, useRef, useState } from "react";
import { MessageSquareText } from "lucide-react";
import type { ActionPlan as ActionPlanData } from "../types";

interface ActionPlanProps {
  plan: ActionPlanData;
  onCopyMessage: () => Promise<boolean>;
}

export function ActionPlan({ plan, onCopyMessage }: ActionPlanProps) {
  const [copyState, setCopyState] = useState<"idle" | "copied" | "failed">("idle");
  const messageFallbackRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setCopyState("idle");
  }, [plan.message]);

  useEffect(() => {
    if (copyState === "failed") {
      selectFallbackText(messageFallbackRef.current);
    }
  }, [copyState]);

  async function handleCopy() {
    setCopyState((await onCopyMessage()) ? "copied" : "failed");
  }

  return (
    <section className="report-section action-plan-section">
      <div className="section-row">
        <div>
          <p className="section-label">下一步</p>
          <h3>下一步怎么做</h3>
        </div>
        <button className="ghost-button" type="button" onClick={handleCopy}>
          <MessageSquareText aria-hidden="true" />
          {copyLabel(copyState)}
        </button>
      </div>

      <div className={`action-plan ${plan.priority}`}>
        <strong>{plan.title}</strong>
        <ol>
          {plan.steps.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
        <div className="message-draft">
          <span>沟通草稿</span>
          <p>{plan.message}</p>
          <p className="message-draft-review">复制不会自动发送；发送前请核对对方、金额、日期和个人信息。</p>
        </div>
      </div>

      {copyState === "failed" ? (
        <div className="report-copy-fallback">
          <span className="report-copy-fallback-message" role="alert" aria-live="assertive">
            浏览器没有允许自动复制。可以在这里手动复制沟通草稿。
          </span>
          <textarea ref={messageFallbackRef} readOnly value={plan.message} aria-label="沟通草稿，可手动复制" />
        </div>
      ) : null}
    </section>
  );
}

function copyLabel(state: "idle" | "copied" | "failed"): string {
  if (state === "copied") return "已复制";
  if (state === "failed") return "复制失败";
  return "复制给对方";
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
