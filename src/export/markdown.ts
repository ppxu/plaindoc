import type { AnalysisReport } from "../types";
import { getDocumentKindLabel } from "../data/documentKinds";
import { getReviewPerspectiveLabel } from "../data/reviewPerspectives";
import { clauseEditsToText, getClauseEdits } from "./clauseEdits";
import { priorityBriefToText } from "./priorityBrief";
import { formatTextScale } from "../report/textScale";
import { getCoverageBoundary, getCoverageBoundaryNotice } from "../report/coverageBoundary";
import { getEvidenceCoverage } from "../report/evidenceCoverage";
import { getReviewReadiness } from "../report/reviewReadiness";

export function reportToMarkdown(report: AnalysisReport): string {
  const facts = report.facts
    .map((fact) => `- **${fact.label}**: ${fact.value}`)
    .join("\n") || "- 未识别出关键事实。";

  const coverageBoundaryNotice = getCoverageBoundaryNotice(report);
  const coverageBoundary = getCoverageBoundary(report);
  const evidenceCoverage = getEvidenceCoverage(report);
  const readiness = getReviewReadiness(report);
  const findings = report.findings
    .map((finding) => [
      `### ${severityLabel(finding.severity)} ${finding.title}`,
      "",
      finding.explanation,
      "",
      `**为什么重要：** ${finding.whyItMatters}`,
      "",
      `**建议：** ${finding.suggestion}`,
      finding.modification ? `\n**建议修改条款：** ${finding.modification}` : "",
      finding.evidence ? `\n> 证据片段：${finding.evidence.text}` : ""
    ].join("\n"))
    .join("\n\n") || ["未命中明显风险规则。", coverageBoundaryNotice].filter(Boolean).join("\n\n");

  const checklist = report.checklist
    .map((item, index) => `${index + 1}. ${item.question}\n   - ${item.reason}`)
    .join("\n") || "暂无检查项。";

  const clarifyingQuestions = (report.clarifyingQuestions ?? [])
    .map((item, index) => [
      `${index + 1}. ${item.question}`,
      `   - 为什么要问：${item.whyItMatters}`,
      `   - ${item.askBeforeSigning ? "签前必须问" : "建议追问"}`
    ].join("\n"))
    .join("\n") || "暂无签前追问。";

  const actionSteps = report.actionPlan.steps
    .map((step, index) => `${index + 1}. ${step}`)
    .join("\n") || "暂无下一步建议。";
  const clauseEdits = clauseEditsToText(getClauseEdits(report.findings));
  const inputWarnings = report.inputWarnings.length
    ? report.inputWarnings
        .map((warning) => [
          `### ${warning.title}`,
          warning.message,
          "",
          `**建议动作：** ${warning.action}`
        ].join("\n"))
        .join("\n\n")
    : "";

  return [
    "# PlainDoc 文件阅读报告",
    "",
    `**摘要：** ${report.summary}`,
    `**风险阅读分：** ${report.score}/100`,
    `**状态：** ${statusLabel(report.status)}`,
    `**分析来源：** ${sourceLabel(report)}`,
    report.notice ? `**说明：** ${report.notice}` : "",
    "",
    "## 报告信息",
    `**文件类型：** ${documentKindLabel(report)}`,
    `**审阅视角：** ${reviewPerspectiveLabel(report)}`,
    `**生成时间：** ${report.generatedAt}`,
    `**文本规模：** ${formatTextScale(report.wordCount)}`,
    "**生成工具：** PlainDoc（https://ppxu.github.io/plaindoc/）",
    "**导出范围：** 本报告不包含原始全文，只包含摘要、关键事实、必要证据片段、风险提示和建议。分享前请确认报告中是否仍有个人信息或敏感条款。",
    "",
    "## 覆盖范围",
    `**PlainDoc 当前重点检查：** ${coverageBoundary.reviewScope}`,
    `**未覆盖：** ${coverageBoundary.limitation}。`,
    `**签前提醒：** ${coverageBoundary.reminder}`,
    "",
    inputWarnings ? "## 输入完整性" : "",
    inputWarnings,
    inputWarnings ? "" : "",
    "## 签署前状态",
    `**状态：** ${readiness.title}`,
    readiness.summary,
    "",
    ...readiness.checks.map((check) => `- **${check.label}：** ${readinessCheckLabel(check.status)}。${check.detail}`),
    "",
    `**下一步：** ${readiness.nextStep}`,
    "",
    "## 证据覆盖",
    `**定位情况：** ${evidenceCoverage.summary}`,
    `**建议动作：** ${evidenceCoverage.action}`,
    "",
    "## 关键事实",
    facts,
    "",
    "## 优先处理",
    priorityBriefToText(report),
    "",
    "## 风险提示",
    findings,
    "",
    "## 修改条款包",
    clauseEdits,
    "",
    "## 签署前问题清单",
    checklist,
    "",
    "## 签前追问",
    clarifyingQuestions,
    "",
    "## 下一步行动",
    `**优先级：** ${priorityLabel(report.actionPlan.priority)}`,
    `**建议：** ${report.actionPlan.title}`,
    "",
    actionSteps,
    "",
    "### 可复制给对方的消息",
    report.actionPlan.message,
    "",
    "## 大白话解释",
    ...report.plainLanguage.map((line) => `- ${line}`),
    "",
    "## 免责声明",
    report.disclaimer
  ].join("\n");
}

function priorityLabel(priority: AnalysisReport["actionPlan"]["priority"]): string {
  return {
    high: "高",
    medium: "中",
    low: "低"
  }[priority];
}

function sourceLabel(report: AnalysisReport): string {
  if (report.source === "model") {
    return report.modelName ? `AI 增强（${report.modelName}）` : "AI 增强";
  }
  return "本地规则";
}

function documentKindLabel(report: AnalysisReport): string {
  return report.documentKind === "unknown" ? "通用文件" : getDocumentKindLabel(report.documentKind);
}

function reviewPerspectiveLabel(report: AnalysisReport): string {
  return getReviewPerspectiveLabel(report.documentKind, report.reviewPerspective);
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

function readinessCheckLabel(status: "ok" | "review" | "blocked"): string {
  return {
    ok: "通过",
    review: "待确认",
    blocked: "阻断"
  }[status];
}
