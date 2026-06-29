import { documentKindMeta } from "../data/documentKinds";
import type { AnalysisReport, DocumentKind } from "../types";

const fallbackReviewScopes: Record<DocumentKind, string> = {
  rental: "金额、期限、解除、违约、押金退还和维修责任",
  employment: "薪酬、岗位、工时、离职、竞业限制和违约责任",
  renovation: "总价、付款节点、增项确认、延期责任、验收标准和质保",
  loan: "实际到账、综合成本、提前还款、逾期费用、担保责任和提前到期",
  insurance: "等待期、既往症、免责条款、续保条件、理赔通知和除外责任",
  unknown: "金额、期限、退出条件、违约责任、免责条款和证据留存"
};

export function getCoverageBoundaryNotice(report: AnalysisReport): string | undefined {
  if (report.findings.length > 0) {
    return undefined;
  }

  const kindLabel = documentKindMeta[report.documentKind].label;
  const reviewScope = fallbackReviewScopes[report.documentKind];
  return `未命中不等于安全背书。PlainDoc 只覆盖当前版本已收录的典型${kindLabel}风险模式；签署前仍要人工确认${reviewScope}，并保存对方书面回复。`;
}
