import type { DocumentKind } from "../types";

type DetectableDocumentKind = Exclude<DocumentKind, "unknown">;

export type DetectionConfidence = "low" | "medium" | "high";

export interface DocumentKindDetection {
  kind: DocumentKind;
  confidence: DetectionConfidence;
  score: number;
  matchedTerms: string[];
}

const profiles: Record<DetectableDocumentKind, Array<[term: string, weight: number]>> = {
  rental: [
    ["租赁", 3],
    ["出租方", 2],
    ["承租方", 2],
    ["月租金", 2],
    ["押金", 3],
    ["提前退租", 3],
    ["转租", 2],
    ["房屋", 1],
    ["维修", 1]
  ],
  employment: [
    ["劳动合同", 3],
    ["员工", 2],
    ["试用期", 2],
    ["基本工资", 2],
    ["加班", 2],
    ["离职", 3],
    ["竞业限制", 3],
    ["保密义务", 2],
    ["绩效奖金", 1]
  ],
  renovation: [
    ["装修", 3],
    ["施工", 3],
    ["工程总价", 2],
    ["发包方", 2],
    ["承包方", 2],
    ["首期款", 2],
    ["水电验收", 3],
    ["增项", 3],
    ["竣工验收", 2]
  ],
  loan: [
    ["借款", 3],
    ["出借人", 2],
    ["借款人", 2],
    ["本金", 2],
    ["利息", 2],
    ["年化利率", 3],
    ["提前还款", 3],
    ["逾期", 2],
    ["罚息", 3],
    ["一次性清偿", 2]
  ],
  insurance: [
    ["保险", 3],
    ["投保人", 2],
    ["被保险人", 2],
    ["保险人", 2],
    ["保险期间", 2],
    ["保险金额", 2],
    ["等待期", 3],
    ["既往症", 3],
    ["续保", 3],
    ["理赔", 2],
    ["拒赔", 3]
  ]
};

export function detectDocumentKind(text: string): DocumentKindDetection {
  const normalized = text.trim().toLowerCase();
  if (normalized.length < 80) {
    return emptyDetection();
  }

  const scored = Object.entries(profiles).map(([kind, terms]) => {
    const matched = terms.filter(([term]) => normalized.includes(term.toLowerCase()));
    const score = matched.reduce((total, [, weight]) => total + weight, 0);
    return {
      kind: kind as DetectableDocumentKind,
      score,
      matchedTerms: matched.map(([term]) => term)
    };
  }).sort((left, right) => right.score - left.score);

  const best = scored[0];
  const second = scored[1];
  const margin = best.score - (second?.score ?? 0);

  if (best.score < 5 || margin < 2) {
    return emptyDetection();
  }

  return {
    kind: best.kind,
    confidence: best.score >= 10 && margin >= 4 ? "high" : "medium",
    score: best.score,
    matchedTerms: best.matchedTerms.slice(0, 6)
  };
}

function emptyDetection(): DocumentKindDetection {
  return {
    kind: "unknown",
    confidence: "low",
    score: 0,
    matchedTerms: []
  };
}
