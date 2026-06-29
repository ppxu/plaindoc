import { useEffect, useState } from "react";
import { ClipboardCheck } from "lucide-react";
import type { ChecklistItem } from "../types";

interface ChecklistProps {
  items: ChecklistItem[];
  onCopy: () => Promise<boolean>;
}

export function Checklist({ items, onCopy }: ChecklistProps) {
  const [copyState, setCopyState] = useState<"idle" | "copied" | "failed">("idle");

  useEffect(() => {
    setCopyState("idle");
  }, [items]);

  async function handleCopy() {
    setCopyState((await onCopy()) ? "copied" : "failed");
  }

  return (
    <section className="report-section checklist-section">
      <div className="section-row">
        <div>
          <p className="section-label">Checklist</p>
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
    </section>
  );
}

function copyLabel(state: "idle" | "copied" | "failed", idleText: string): string {
  if (state === "copied") return "已复制";
  if (state === "failed") return "复制失败";
  return idleText;
}
