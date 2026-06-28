import type { RiskFinding } from "../types";

export interface ClauseEdit {
  title: string;
  severity: RiskFinding["severity"];
  text: string;
}

export function getClauseEdits(findings: RiskFinding[]): ClauseEdit[] {
  return findings
    .filter((finding) => finding.modification)
    .map((finding) => ({
      title: finding.title,
      severity: finding.severity,
      text: finding.modification ?? ""
    }));
}

export function clauseEditsToText(edits: ClauseEdit[]): string {
  if (!edits.length) {
    return "暂无建议修改条款。";
  }

  return edits
    .map((edit, index) => [
      `${index + 1}. ${edit.title}`,
      `风险等级：${severityLabel(edit.severity)}`,
      `建议修改条款：${edit.text}`
    ].join("\n"))
    .join("\n\n");
}

function severityLabel(severity: RiskFinding["severity"]): string {
  return {
    red: "红色",
    yellow: "黄色",
    green: "绿色"
  }[severity];
}
