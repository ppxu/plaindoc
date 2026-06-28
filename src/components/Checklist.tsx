import { ClipboardCheck } from "lucide-react";
import type { ChecklistItem } from "../types";

interface ChecklistProps {
  items: ChecklistItem[];
  onCopy: () => void;
}

export function Checklist({ items, onCopy }: ChecklistProps) {
  return (
    <section className="report-section checklist-section">
      <div className="section-row">
        <div>
          <p className="section-label">Checklist</p>
          <h3>签署前问题清单</h3>
        </div>
        <button className="ghost-button" type="button" onClick={onCopy}>
          <ClipboardCheck aria-hidden="true" />
          复制清单
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

