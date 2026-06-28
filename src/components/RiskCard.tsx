import { AlertTriangle, CheckCircle2, CircleAlert } from "lucide-react";
import type { RiskFinding } from "../types";

interface RiskCardProps {
  finding: RiskFinding;
}

export function RiskCard({ finding }: RiskCardProps) {
  const Icon = finding.severity === "red" ? CircleAlert : finding.severity === "yellow" ? AlertTriangle : CheckCircle2;

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
      {finding.evidence ? (
        <blockquote>
          <span>证据片段</span>
          {finding.evidence.text}
        </blockquote>
      ) : null}
    </article>
  );
}

