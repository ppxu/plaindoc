import { useState } from "react";
import { ClipboardList } from "lucide-react";
import type { AnalysisReport } from "../types";
import { getPriorityFindings, priorityBriefToText } from "../export/priorityBrief";
import { copyTextToClipboard } from "../utils/clipboard";

interface PriorityBriefProps {
  report: AnalysisReport;
}

export function PriorityBrief({ report }: PriorityBriefProps) {
  const [copyState, setCopyState] = useState<"idle" | "copied" | "failed">("idle");
  const priorityFindings = getPriorityFindings(report.findings);

  async function copyBrief() {
    setCopyState((await copyTextToClipboard(priorityBriefToText(report))) ? "copied" : "failed");
  }

  return (
    <section className="report-section priority-brief-section">
      <div className="section-row">
        <div>
          <p className="section-label">Priority</p>
          <h3>优先处理</h3>
        </div>
        <button className="ghost-button" type="button" onClick={copyBrief}>
          <ClipboardList aria-hidden="true" />
          {copyLabel(copyState)}
        </button>
      </div>

      {priorityFindings.length ? (
        <div className="priority-list">
          {priorityFindings.map((finding, index) => (
            <article key={finding.id} className={`priority-item ${finding.severity}`}>
              <span>{index + 1}</span>
              <div>
                <strong>{finding.title}</strong>
                <p>{finding.suggestion}</p>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <p className="muted">没有命中红色或黄色风险。仍建议按清单确认关键义务和证据留存。</p>
      )}
    </section>
  );
}

function copyLabel(state: "idle" | "copied" | "failed"): string {
  if (state === "copied") return "已复制";
  if (state === "failed") return "复制失败";
  return "复制提纲";
}
