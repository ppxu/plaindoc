import type { DocumentKind, ReviewPerspective } from "../types";

export interface ReviewPerspectiveOption {
  id: ReviewPerspective;
  label: string;
  prompt: string;
}

const neutralOption: ReviewPerspectiveOption = {
  id: "neutral",
  label: "通用视角",
  prompt: "站在准备签署文件的一般用户视角，优先解释双方都需要确认的风险。"
};

const optionsByKind: Record<DocumentKind, ReviewPerspectiveOption[]> = {
  rental: [
    neutralOption,
    { id: "rental_tenant", label: "承租方", prompt: "站在承租方视角，优先检查押金扣除、提前退租成本、维修责任和退租证据。" },
    { id: "rental_landlord", label: "出租方", prompt: "站在出租方视角，优先检查租金收取、房屋损坏、提前退租和交接证据。" }
  ],
  employment: [
    neutralOption,
    { id: "employment_employee", label: "员工", prompt: "站在员工视角，优先检查竞业限制、离职成本、薪酬加班和违约责任。" },
    { id: "employment_employer", label: "雇主", prompt: "站在雇主视角，优先检查保密义务、交接安排、服务期限和合规风险。" }
  ],
  renovation: [
    neutralOption,
    { id: "renovation_owner", label: "业主", prompt: "站在业主视角，优先检查付款节点、增项确认、延期责任和验收标准。" },
    { id: "renovation_contractor", label: "施工方", prompt: "站在施工方视角，优先检查付款保障、变更确认、工期顺延和验收证据。" }
  ],
  loan: [
    neutralOption,
    { id: "loan_borrower", label: "借款人", prompt: "站在借款人视角，优先检查真实成本、提前还款、逾期费用和担保责任。" },
    { id: "loan_lender", label: "出借人", prompt: "站在出借人视角，优先检查还款期限、担保措施、违约处置和证据留存。" }
  ],
  insurance: [
    neutralOption,
    { id: "insurance_policyholder", label: "投保人", prompt: "站在投保人视角，优先检查等待期、免责条款、续保条件和理赔通知。" },
    { id: "insurance_insurer", label: "保险方", prompt: "站在保险方视角，优先检查告知义务、免责边界、理赔材料和争议处理。" }
  ],
  unknown: [neutralOption]
};

export function getReviewPerspectiveOptions(kind: DocumentKind): ReviewPerspectiveOption[] {
  return optionsByKind[kind];
}

export function normalizeReviewPerspective(kind: DocumentKind, perspective: ReviewPerspective | undefined): ReviewPerspective {
  const options = getReviewPerspectiveOptions(kind);
  return perspective && options.some((option) => option.id === perspective) ? perspective : "neutral";
}

export function getReviewPerspectiveOption(kind: DocumentKind, perspective: ReviewPerspective | undefined): ReviewPerspectiveOption {
  const normalized = normalizeReviewPerspective(kind, perspective);
  return getReviewPerspectiveOptions(kind).find((option) => option.id === normalized) ?? neutralOption;
}

export function getReviewPerspectiveLabel(kind: DocumentKind, perspective: ReviewPerspective | undefined): string {
  return getReviewPerspectiveOption(kind, perspective).label;
}

export function getReviewPerspectivePrompt(kind: DocumentKind, perspective: ReviewPerspective | undefined): string {
  return getReviewPerspectiveOption(kind, perspective).prompt;
}
