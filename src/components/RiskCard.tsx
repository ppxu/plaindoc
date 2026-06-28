import { useState } from "react";
import { AlertTriangle, CheckCircle2, CircleAlert, Search } from "lucide-react";
import type { RiskFinding } from "../types";
import { copyTextToClipboard } from "../utils/clipboard";

interface RiskCardProps {
  finding: RiskFinding;
  onRevealEvidence?: (finding: RiskFinding) => void;
}

export function RiskCard({ finding, onRevealEvidence }: RiskCardProps) {
  const Icon = finding.severity === "red" ? CircleAlert : finding.severity === "yellow" ? AlertTriangle : CheckCircle2;
  const [copyState, setCopyState] = useState<"idle" | "copied" | "failed">("idle");

  async function copyModification() {
    if (!finding.modification) return;
    setCopyState((await copyTextToClipboard(finding.modification)) ? "copied" : "failed");
  }

  return (
    <article className={`risk-card ${finding.severity}`}>
      <div className="risk-title">
        <Icon aria-hidden="true" />
        <h4>{finding.title}</h4>
      </div>
      <p>{finding.explanation}</p>
      <dl>
        <div>
          <dt>为什么重要</dt>
          <dd>{finding.whyItMatters}</dd>
        </div>
        <div>
          <dt>建议动作</dt>
          <dd>{finding.suggestion}</dd>
        </div>
      </dl>
      {finding.modification ? (
        <div className="modification-box">
          <div>
            <span>建议修改条款</span>
            <button type="button" onClick={copyModification}>
              {copyLabel(copyState)}
            </button>
          </div>
          <p>{finding.modification}</p>
        </div>
      ) : null}
      {finding.evidence ? (
        <blockquote>
          <div className="evidence-heading">
            <span>证据片段</span>
            {onRevealEvidence ? (
              <button type="button" onClick={() => onRevealEvidence(finding)}>
                <Search aria-hidden="true" />
                定位原文
              </button>
            ) : null}
          </div>
          {finding.evidence.text}
        </blockquote>
      ) : null}
    </article>
  );
}

function copyLabel(state: "idle" | "copied" | "failed"): string {
  if (state === "copied") return "已复制";
  if (state === "failed") return "复制失败";
  return "复制";
}
