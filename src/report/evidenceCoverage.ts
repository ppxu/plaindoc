import type { AnalysisReport } from "../types";

export interface EvidenceCoverage {
  total: number;
  located: number;
  missing: number;
  status: "complete" | "partial" | "none";
  summary: string;
  action: string;
}

export function getEvidenceCoverage(report: AnalysisReport): EvidenceCoverage {
  const total = report.findings.length;
  const located = report.findings.filter((finding) => Boolean(finding.evidence?.text.trim())).length;
  const missing = total - located;

  if (total === 0) {
    return {
      total,
      located,
      missing,
      status: "none",
      summary: "当前没有风险提示需要定位证据。",
      action: "如果你仍不放心，请逐条检查金额、期限、解除条件、违约责任和附件。"
    };
  }

  if (missing === 0) {
    return {
      total,
      located,
      missing,
      status: "complete",
      summary: `所有风险提示都有可定位证据片段（${located}/${total}）。`,
      action: "点击风险卡片里的“定位原文”，逐条回到正文核对上下文。"
    };
  }

  return {
    total,
    located,
    missing,
    status: "partial",
    summary: `${missing} 个风险提示缺少可定位证据（${located}/${total} 已定位）。`,
    action: "对缺少证据的提示，签署前请要求对方提供原文位置、附件页码或书面依据，不要只凭摘要判断。"
  };
}
