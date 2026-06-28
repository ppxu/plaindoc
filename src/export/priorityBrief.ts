import type { AnalysisReport, RiskFinding } from "../types";

export function getPriorityFindings(findings: RiskFinding[]): RiskFinding[] {
  return [...findings]
    .filter((finding) => finding.severity !== "green")
    .sort((left, right) => severityRank(right.severity) - severityRank(left.severity))
    .slice(0, 3);
}

export function priorityBriefToText(report: AnalysisReport): string {
  const priorityFindings = getPriorityFindings(report.findings);

  if (!priorityFindings.length) {
    return [
      "当前没有命中明显红色或黄色风险。",
      "建议仍然逐条确认金额、期限、退出条件、违约责任和附件是否一致。"
    ].join("\n");
  }

  return priorityFindings
    .map((finding, index) => [
      `${index + 1}. 【${severityLabel(finding.severity)}】${finding.title}`,
      `为什么重要：${finding.whyItMatters}`,
      `建议动作：${finding.suggestion}`,
      finding.modification ? `建议改法：${finding.modification}` : ""
    ].filter(Boolean).join("\n"))
    .join("\n\n");
}

function severityRank(severity: RiskFinding["severity"]): number {
  return {
    green: 0,
    yellow: 1,
    red: 2
  }[severity];
}

function severityLabel(severity: RiskFinding["severity"]): string {
  return {
    red: "红色风险",
    yellow: "黄色提醒",
    green: "绿色"
  }[severity];
}
