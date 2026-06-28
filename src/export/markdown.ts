import type { AnalysisReport } from "../types";

export function reportToMarkdown(report: AnalysisReport): string {
  const facts = report.facts
    .map((fact) => `- **${fact.label}**: ${fact.value}`)
    .join("\n") || "- 未识别出关键事实。";

  const findings = report.findings
    .map((finding) => [
      `### ${severityLabel(finding.severity)} ${finding.title}`,
      "",
      finding.explanation,
      "",
      `**为什么重要：** ${finding.whyItMatters}`,
      "",
      `**建议：** ${finding.suggestion}`,
      finding.evidence ? `\n> 证据片段：${finding.evidence.text}` : ""
    ].join("\n"))
    .join("\n\n") || "未命中明显风险规则。";

  const checklist = report.checklist
    .map((item, index) => `${index + 1}. ${item.question}\n   - ${item.reason}`)
    .join("\n") || "暂无检查项。";

  return [
    "# PlainDoc 文件阅读报告",
    "",
    `**摘要：** ${report.summary}`,
    `**风险阅读分：** ${report.score}/100`,
    `**状态：** ${statusLabel(report.status)}`,
    `**分析来源：** ${sourceLabel(report)}`,
    report.notice ? `**说明：** ${report.notice}` : "",
    "",
    "## 关键事实",
    facts,
    "",
    "## 风险提示",
    findings,
    "",
    "## 签署前问题清单",
    checklist,
    "",
    "## 大白话解释",
    ...report.plainLanguage.map((line) => `- ${line}`),
    "",
    "## 免责声明",
    report.disclaimer
  ].join("\n");
}

function sourceLabel(report: AnalysisReport): string {
  if (report.source === "model") {
    return report.modelName ? `AI 增强（${report.modelName}）` : "AI 增强";
  }
  return "本地规则";
}

function severityLabel(severity: "red" | "yellow" | "green"): string {
  return {
    red: "红色",
    yellow: "黄色",
    green: "绿色"
  }[severity];
}

function statusLabel(status: AnalysisReport["status"]): string {
  return {
    safe_to_review: "可以继续确认",
    needs_attention: "需要重点确认",
    do_not_sign_directly: "不建议直接签"
  }[status];
}
