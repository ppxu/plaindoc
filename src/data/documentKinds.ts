import type { DocumentKind } from "../types";

export interface DocumentKindMetadata {
  label: string;
  summaryLabel: string;
  plainLanguage: string;
  coverage: string[];
}

export const documentKindMeta = {
  rental: {
    label: "租房合同",
    summaryLabel: "这份租房文件",
    plainLanguage: "把它当成一张退租和押金风险表来看：重点盯住押金怎么扣、维修谁负责、提前退租要付多少。",
    coverage: ["押金扣除", "提前退租", "维修责任", "转租限制"]
  },
  employment: {
    label: "劳动协议",
    summaryLabel: "这份劳动文件",
    plainLanguage: "把它当成一张离职成本表来看：重点盯住竞业限制、违约金、加班和离职通知期。",
    coverage: ["竞业限制", "离职通知", "违约金", "加班安排"]
  },
  renovation: {
    label: "装修合同",
    summaryLabel: "这份装修文件",
    plainLanguage: "把它当成一张付款和验收控制表来看：重点盯住付款节点、增项确认、延期责任和验收标准。",
    coverage: ["付款节点", "增项确认", "延期责任", "验收标准"]
  },
  loan: {
    label: "借款/贷款合同",
    summaryLabel: "这份借款文件",
    plainLanguage: "把它当成一张真实借款成本表来看：重点盯住实际到账金额、服务费、提前还款、逾期费用和一次性到期条件。",
    coverage: ["实际到账", "提前还款", "逾期费用", "一次性到期"]
  },
  insurance: {
    label: "保险保单",
    summaryLabel: "这份保险文件",
    plainLanguage: "把它当成一张保障边界表来看：重点盯住等待期、既往症、免责条款、续保条件和理赔通知。",
    coverage: ["等待期", "既往症", "续保条件", "理赔通知"]
  },
  unknown: {
    label: "不确定",
    summaryLabel: "这份文件",
    plainLanguage: "先把它当成一份责任分配表来看：谁付钱、谁负责、什么时候结束、违约会怎样。",
    coverage: ["金额期限", "退出条件", "违约责任", "证据留存"]
  }
} satisfies Record<DocumentKind, DocumentKindMetadata>;

export const documentKindOptions: Array<{ kind: DocumentKind; label: string }> = [
  { kind: "rental", label: documentKindMeta.rental.label },
  { kind: "employment", label: documentKindMeta.employment.label },
  { kind: "renovation", label: documentKindMeta.renovation.label },
  { kind: "loan", label: documentKindMeta.loan.label },
  { kind: "insurance", label: documentKindMeta.insurance.label },
  { kind: "unknown", label: documentKindMeta.unknown.label }
];

export function getDocumentKindLabel(kind: DocumentKind): string {
  return documentKindMeta[kind].label;
}
