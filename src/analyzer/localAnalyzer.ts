import type { AnalysisReport, AnalyzerInput, ClarifyingQuestion, ExtractedFact, ReportStatus, RiskFinding } from "../types";
import { documentKindMeta } from "../data/documentKinds";
import { normalizeReviewPerspective } from "../data/reviewPerspectives";
import { buildActionPlan } from "./actionPlan";
import { checklistFromRules, runRules } from "./rules";
import { countWords, findDateMatches, findEvidence, findMoneyMatches, findPercentageMatches } from "./patterns";
import { assessInputCompleteness } from "../report/inputCompleteness";

const DISCLAIMER = "PlainDoc 提供文件阅读辅助和风险提示，不构成法律、医疗、财务或其他专业建议。重要决定请咨询合格专业人士。";

export function analyzeDocument(input: AnalyzerInput): AnalysisReport {
  const text = input.text.trim();
  const wordCount = countWords(text);
  const perspective = normalizeReviewPerspective(input.kind, input.perspective);

  if (!text) {
    return emptyReport(input.kind, perspective);
  }

  const findings = runRules(text, input.kind);
  const facts = extractFacts(text);
  const checklist = buildChecklist(text, input.kind);
  const clarifyingQuestions = buildClarifyingQuestions(findings, input.kind);
  const inputWarnings = assessInputCompleteness(text, input.kind, wordCount);
  const score = scoreFindings(findings.map((finding) => finding.severity), wordCount);
  const status = statusFromScore(score);

  return {
    summary: summarize(input.kind, findings.length, facts),
    status,
    score,
    facts,
    findings,
    inputWarnings,
    checklist,
    clarifyingQuestions,
    actionPlan: buildActionPlan(input.kind, findings, checklist, clarifyingQuestions, perspective),
    plainLanguage: buildPlainLanguage(input.kind, findings.length),
    generatedAt: new Date().toISOString(),
    documentKind: input.kind,
    reviewPerspective: perspective,
    wordCount,
    source: "local",
    disclaimer: DISCLAIMER
  };
}

function emptyReport(kind: AnalyzerInput["kind"], perspective: NonNullable<AnalysisReport["reviewPerspective"]> = "neutral"): AnalysisReport {
  return {
    summary: "请先粘贴文件内容、选择样例或上传文本文件。",
    status: "needs_attention",
    score: 0,
    facts: [],
    findings: [],
    inputWarnings: [],
    checklist: [],
    clarifyingQuestions: [],
    actionPlan: {
      priority: "medium",
      title: "请先提供可分析的文件内容",
      steps: ["粘贴文件正文，或上传 PDF、.txt、.md 文件。", "确认文件类型后再生成风险清单。", "重要决定请咨询合格专业人士。"],
      message: "你好，我需要先拿到完整文件正文，确认金额、期限、退出条件和违约责任后，再继续签署流程。"
    },
    plainLanguage: ["PlainDoc 需要读取文件文字后才能生成风险提示。"],
    generatedAt: new Date().toISOString(),
    documentKind: kind,
    reviewPerspective: perspective,
    wordCount: 0,
    source: "local",
    disclaimer: DISCLAIMER
  };
}

function buildClarifyingQuestions(findings: RiskFinding[], kind: AnalyzerInput["kind"]): ClarifyingQuestion[] {
  const riskQuestions = findings.slice(0, 4).map((finding) => ({
    question: `请对方书面确认：${finding.suggestion}`,
    whyItMatters: finding.whyItMatters,
    severity: finding.severity,
    askBeforeSigning: finding.severity === "red" || finding.severity === "yellow"
  }));

  const universalQuestions: ClarifyingQuestion[] = [{
    question: kindSpecificClarifyingQuestion(kind),
    whyItMatters: "把关键口头承诺写成可追溯的文字，后续争议时更容易举证。",
    severity: "yellow",
    askBeforeSigning: true
  }];

  return [...riskQuestions, ...universalQuestions].slice(0, 5);
}

function kindSpecificClarifyingQuestion(kind: AnalyzerInput["kind"]): string {
  return {
    rental: "请对方书面确认金额、押金扣除、维修责任和提前解除条件是否以合同正文为准。",
    employment: "请对方书面确认薪酬、岗位职责、离职限制、违约责任和补偿安排是否都已写进正文。",
    renovation: "请对方书面确认付款节点、验收标准、延期责任和增项报价是否都以书面附件为准。",
    loan: "请对方书面确认总成本、还款计划、提前还款费用和逾期责任是否没有隐藏收费。",
    insurance: "请对方书面确认等待期、免责范围、续保条件和理赔材料是否已完整说明。",
    unknown: "请对方书面确认金额、期限、解除条件、违约责任和附件清单是否都以正文为准。"
  }[kind];
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

  const percentages = findPercentageMatches(text).slice(0, 4).map((match, index) => ({
    label: index === 0 ? "比例" : "相关比例",
    value: match.value,
    confidence: 0.66,
    evidence: match.evidence
  }));

  const obligations = [
    ["通知义务", ["提前", "通知"]],
    ["付款义务", ["支付", "付款"]],
    ["违约责任", ["违约", "赔偿"]],
    ["验收/退还", ["验收", "退还"]],
    ["借款成本", ["利息", "服务费", "罚息"]],
    ["提前还款", ["提前还款", "手续费"]],
    ["保障/免责", ["保险", "免责", "拒赔"]],
    ["理赔通知", ["理赔", "通知保险人"]]
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

  return [...money, ...dates, ...percentages, ...obligationFacts].slice(0, 10);
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
  const label = documentKindMeta[kind].summaryLabel;
  const factText = facts.length ? `已识别 ${facts.length} 个金额、比例、期限或义务线索` : "暂未识别出足够的金额、比例或期限线索";
  const riskText = findingCount > 0 ? `发现 ${findingCount} 个需要确认的风险点` : "没有命中明显高风险规则，但仍建议逐条确认关键义务";
  return `${label}${factText}，${riskText}。`;
}

function buildPlainLanguage(kind: AnalyzerInput["kind"], findingCount: number): string[] {
  const kindLine = documentKindMeta[kind].plainLanguage;

  const riskLine = findingCount
    ? "红色项不是说一定违法，而是表示签之前应该让对方书面解释或修改。"
    : "没有命中规则不代表文件没有风险；它只表示当前文本没有出现 PlainDoc 已覆盖的典型风险模式。";

  return [kindLine, riskLine, "签署前，把检查清单复制给对方逐条确认，并保存对方回复。"];
}
