import { useEffect, useState } from "react";
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

  useEffect(() => {
    setCopyState("idle");
  }, [editsText]);

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
          <p className="section-label">Clause Edits</p>
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
    </section>
  );
}

function copyLabel(state: "idle" | "copied" | "failed"): string {
  if (state === "copied") return "已复制";
  if (state === "failed") return "复制失败";
  return "复制全部";
}
