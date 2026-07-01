import type { AnalysisReport } from "../types";
import { getEvidenceCoverage } from "./evidenceCoverage";

export interface ReviewReadinessCheck {
  id: "input-completeness" | "red-risks" | "evidence-coverage";
  label: string;
  status: "ok" | "review" | "blocked";
  detail: string;
}

export interface ReviewReadiness {
  status: "ready" | "review" | "blocked";
  title: string;
  summary: string;
  nextStep: string;
  checks: ReviewReadinessCheck[];
}

export function getReviewReadiness(report: AnalysisReport): ReviewReadiness {
  const redCount = report.findings.filter((finding) => finding.severity === "red").length;
  const yellowCount = report.findings.filter((finding) => finding.severity === "yellow").length;
  const evidenceCoverage = getEvidenceCoverage(report);
  const checks: ReviewReadinessCheck[] = [
    {
      id: "input-completeness",
      label: "文件完整性",
      status: report.inputWarnings.some((warning) => warning.severity === "red") ? "blocked" : report.inputWarnings.length ? "review" : "ok",
      detail: report.inputWarnings.length
        ? "输入内容可能不是完整文件，签前需要补齐正文、附件、补充协议和签字页。"
        : "当前输入没有明显片段化信号。"
    },
    {
      id: "red-risks",
      label: "红色风险",
      status: redCount > 0 ? "blocked" : yellowCount > 0 ? "review" : "ok",
      detail: redCount > 0
        ? `还有 ${redCount} 个红色风险需要书面解释或修改。`
        : yellowCount > 0
          ? `还有 ${yellowCount} 个黄色提醒需要确认。`
          : "没有命中红色或黄色风险。"
    },
    {
      id: "evidence-coverage",
      label: "证据定位",
      status: evidenceCoverage.missing > 0 ? "review" : "ok",
      detail: evidenceCoverage.missing > 0
        ? `${evidenceCoverage.missing} 个风险提示缺少可定位证据，签前需要补原文位置或书面依据。`
        : "风险提示都能回到证据片段核对。"
    }
  ];

  if (checks.some((check) => check.status === "blocked")) {
    return {
      status: "blocked",
      title: "先暂停签署",
      summary: "当前报告存在签前必须处理的阻断项。",
      nextStep: "先补齐文件、处理红色风险，并把修改或解释写进合同正文、附件或补充协议。",
      checks
    };
  }

  if (checks.some((check) => check.status === "review")) {
    return {
      status: "review",
      title: "可以继续谈，但先别直接签",
      summary: "当前报告没有阻断项，但仍有需要书面确认的内容。",
      nextStep: "把黄色提醒、缺少证据的提示和关键事实发给对方确认，再保存回复。",
      checks
    };
  }

  return {
    status: "ready",
    title: "可以继续确认",
    summary: "当前没有明显阻断项，仍建议按清单完成最后核对。",
    nextStep: "签署前保存合同、附件和对方书面回复，并确认金额、期限、解除条件和违约责任一致。",
    checks
  };
}
