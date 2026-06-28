import type { AnalysisReport, AnalyzerInput, ExtractedFact, ReportStatus } from "../types";
import { checklistFromRules, runRules } from "./rules";
import { countWords, findDateMatches, findEvidence, findMoneyMatches } from "./patterns";

const DISCLAIMER = "PlainDoc 提供文件阅读辅助和风险提示，不构成法律、医疗、财务或其他专业建议。重要决定请咨询合格专业人士。";

export function analyzeDocument(input: AnalyzerInput): AnalysisReport {
  const text = input.text.trim();
  const wordCount = countWords(text);

  if (!text) {
    return emptyReport(input.kind);
  }

  const findings = runRules(text, input.kind);
  const facts = extractFacts(text);
  const checklist = buildChecklist(text, input.kind);
  const score = scoreFindings(findings.map((finding) => finding.severity), wordCount);
  const status = statusFromScore(score);

  return {
    summary: summarize(input.kind, findings.length, facts),
    status,
    score,
    facts,
    findings,
    checklist,
    plainLanguage: buildPlainLanguage(input.kind, findings.length),
    generatedAt: new Date().toISOString(),
    documentKind: input.kind,
    wordCount,
    disclaimer: DISCLAIMER
  };
}

function emptyReport(kind: AnalyzerInput["kind"]): AnalysisReport {
  return {
    summary: "请先粘贴文件内容、选择样例或上传文本文件。",
    status: "needs_attention",
    score: 0,
    facts: [],
    findings: [],
    checklist: [],
    plainLanguage: ["PlainDoc 需要读取文件文字后才能生成风险提示。"],
    generatedAt: new Date().toISOString(),
    documentKind: kind,
    wordCount: 0,
    disclaimer: DISCLAIMER
  };
}

function extractFacts(text: string): ExtractedFact[] {
  const money = findMoneyMatches(text).slice(0, 4).map((match, index) => ({
    label: index === 0 ? "金额" : "相关金额",
    value: match.value,
    confidence: 0.72,
    evidence: match.evidence
  }));

  const dates = findDateMatches(text).slice(0, 4).map((match, index) => ({
    label: index === 0 ? "日期/期限" : "相关期限",
    value: match.value,
    confidence: 0.68,
    evidence: match.evidence
  }));

  const obligations = [
    ["通知义务", ["提前", "通知"]],
    ["付款义务", ["支付", "付款"]],
    ["违约责任", ["违约", "赔偿"]],
    ["验收/退还", ["验收", "退还"]]
  ] as const;

  const obligationFacts = obligations.flatMap(([label, terms]) => {
    const evidence = findEvidence(text, [...terms]);
    return evidence
      ? [{
          label,
          value: evidence.text,
          confidence: 0.6,
          evidence
        }]
      : [];
  });

  return [...money, ...dates, ...obligationFacts].slice(0, 10);
}

function buildChecklist(text: string, kind: AnalyzerInput["kind"]) {
  const fromRules = checklistFromRules(text, kind);
  const universal = [
    {
      question: "所有金额、期限、退还条件和违约责任是否都写成了明确数字？",
      reason: "模糊表述会让后续争议更难举证。",
      severity: "yellow" as const
    },
    {
      question: "对方承诺的口头条件是否已经写进正文或附件？",
      reason: "口头承诺很难在争议时直接证明。",
      severity: "yellow" as const
    },
    {
      question: "我是否保留了合同、附件、聊天记录、付款凭证和验收照片？",
      reason: "证据留存能降低后续维权成本。",
      severity: "green" as const
    }
  ];

  return [...fromRules, ...universal].slice(0, 10);
}

function scoreFindings(severities: Array<"red" | "yellow" | "green">, wordCount: number): number {
  if (wordCount === 0) {
    return 0;
  }

  const base = wordCount < 120 ? 58 : 86;
  const penalty = severities.reduce((total, severity) => {
    if (severity === "red") return total + 18;
    if (severity === "yellow") return total + 9;
    return total + 2;
  }, 0);

  return Math.max(8, Math.min(96, base - penalty));
}

function statusFromScore(score: number): ReportStatus {
  if (score < 45) return "do_not_sign_directly";
  if (score < 72) return "needs_attention";
  return "safe_to_review";
}

function summarize(kind: AnalyzerInput["kind"], findingCount: number, facts: ExtractedFact[]): string {
  const label = {
    rental: "这份租房文件",
    employment: "这份劳动文件",
    renovation: "这份装修文件",
    unknown: "这份文件"
  }[kind];

  const factText = facts.length ? `已识别 ${facts.length} 个金额、期限或义务线索` : "暂未识别出足够的金额或期限线索";
  const riskText = findingCount > 0 ? `发现 ${findingCount} 个需要确认的风险点` : "没有命中明显高风险规则，但仍建议逐条确认关键义务";
  return `${label}${factText}，${riskText}。`;
}

function buildPlainLanguage(kind: AnalyzerInput["kind"], findingCount: number): string[] {
  const kindLine = {
    rental: "把它当成一张退租和押金风险表来看：重点盯住押金怎么扣、维修谁负责、提前退租要付多少。",
    employment: "把它当成一张离职成本表来看：重点盯住竞业限制、违约金、加班和离职通知期。",
    renovation: "把它当成一张付款和验收控制表来看：重点盯住付款节点、增项确认、延期责任和验收标准。",
    unknown: "先把它当成一份责任分配表来看：谁付钱、谁负责、什么时候结束、违约会怎样。"
  }[kind];

  const riskLine = findingCount
    ? "红色项不是说一定违法，而是表示签之前应该让对方书面解释或修改。"
    : "没有命中规则不代表文件没有风险；它只表示当前文本没有出现 PlainDoc 已覆盖的典型风险模式。";

  return [kindLine, riskLine, "签署前，把检查清单复制给对方逐条确认，并保存对方回复。"];
}
