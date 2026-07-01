import type { DocumentKind, ReportWarning } from "../types";

const MIN_REVIEWABLE_WORDS = 120;

const partySignals: Record<DocumentKind, string[]> = {
  rental: ["甲方", "乙方", "出租人", "承租人", "房东", "租客", "双方"],
  employment: ["甲方", "乙方", "公司", "员工", "用人单位", "劳动者", "双方"],
  renovation: ["甲方", "乙方", "业主", "承包方", "施工方", "双方"],
  loan: ["甲方", "乙方", "出借人", "借款人", "贷款人", "担保人", "双方"],
  insurance: ["投保人", "被保险人", "保险人", "受益人", "保险公司", "双方"],
  unknown: ["甲方", "乙方", "双方", "当事人", "委托人", "受托人"]
};

const boundarySignals = ["签署", "签字", "盖章", "生效", "附件", "补充协议", "合同编号", "协议编号", "年", "月", "日"];

export function assessInputCompleteness(text: string, kind: DocumentKind, wordCount: number): ReportWarning[] {
  if (!text.trim()) {
    return [];
  }

  const missingSignals = [
    ...(wordCount < MIN_REVIEWABLE_WORDS ? [`正文少于 ${MIN_REVIEWABLE_WORDS} 字/词`] : []),
    ...(!includesAny(text, partySignals[kind]) ? ["缺少双方主体线索"] : []),
    ...(!includesAny(text, boundarySignals) ? ["缺少签署、生效、日期或附件线索"] : [])
  ];

  if (missingSignals.length === 0) {
    return [];
  }

  return [{
    id: "incomplete-document-fragment",
    title: "输入内容可能不完整",
    severity: wordCount < 80 || missingSignals.length >= 2 ? "red" : "yellow",
    message: `当前文本看起来像文件片段（${missingSignals.join("；")}）。PlainDoc 只能分析已粘贴或上传的内容，不能替你检查缺失页、附件或签字页。`,
    action: "签署前请上传完整合同正文、附件、补充协议和签字页，再重新生成报告。"
  }];
}

function includesAny(text: string, terms: string[]): boolean {
  const normalized = text.toLowerCase();
  return terms.some((term) => normalized.includes(term.toLowerCase()));
}
