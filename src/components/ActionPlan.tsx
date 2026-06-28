import { useState } from "react";
import { MessageSquareText } from "lucide-react";
import type { ActionPlan as ActionPlanData } from "../types";

interface ActionPlanProps {
  plan: ActionPlanData;
  onCopyMessage: () => Promise<boolean>;
}

export function ActionPlan({ plan, onCopyMessage }: ActionPlanProps) {
  const [copyState, setCopyState] = useState<"idle" | "copied" | "failed">("idle");

  async function handleCopy() {
    setCopyState((await onCopyMessage()) ? "copied" : "failed");
  }

  return (
    <section className="report-section action-plan-section">
      <div className="section-row">
        <div>
          <p className="section-label">Action</p>
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
        </div>
      </div>
    </section>
  );
}

function copyLabel(state: "idle" | "copied" | "failed"): string {
  if (state === "copied") return "已复制";
  if (state === "failed") return "复制失败";
  return "复制给对方";
}
