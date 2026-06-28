import type { ActionPlan, ChecklistItem, DocumentKind, RiskFinding } from "../types";
import { getDocumentKindLabel } from "../data/documentKinds";

export function buildActionPlan(kind: DocumentKind, findings: RiskFinding[], checklist: ChecklistItem[]): ActionPlan {
  const redFindings = findings.filter((finding) => finding.severity === "red");
  const yellowFindings = findings.filter((finding) => finding.severity === "yellow");
  const priority = redFindings.length ? "high" : yellowFindings.length ? "medium" : "low";
  const focusItems = [...redFindings, ...yellowFindings].slice(0, 3);
  const fallbackQuestions = checklist.filter((item) => item.severity !== "green").slice(0, 3);
  const topics = focusItems.length
    ? focusItems.map((finding) => finding.title)
    : fallbackQuestions.map((item) => item.question.replace(/[？?]$/, ""));

  return {
    priority,
    title: actionTitle(priority, kind),
    steps: buildSteps(priority, topics),
    message: buildCounterpartyMessage(kind, topics)
  };
}

function actionTitle(priority: ActionPlan["priority"], kind: DocumentKind): string {
  if (priority === "high") {
    return `${kindLabel(kind)}签署前先要求对方书面修改或确认`;
  }
  if (priority === "medium") {
    return `${kindLabel(kind)}签署前建议逐项确认`;
  }
  return `${kindLabel(kind)}可继续核对关键条款`;
}

function buildSteps(priority: ActionPlan["priority"], topics: string[]): string[] {
  if (!topics.length) {
    return [
      "逐条确认金额、期限、退出条件、违约责任和附件是否一致。",
      "把对方口头承诺补进正文、补充协议或聊天记录。",
      "签署前保存合同版本、付款凭证和沟通记录。"
    ];
  }

  const firstStep = priority === "high"
    ? `先暂停签署，要求对方解释并书面处理：${topics.join("、")}。`
    : `签署前先确认：${topics.join("、")}。`;

  return [
    firstStep,
    "把修改结果写入合同正文、附件或补充协议，不只停留在口头回复。",
    "保留对方回复、修改版本、付款凭证和交付/验收证据。"
  ];
}

function buildCounterpartyMessage(kind: DocumentKind, topics: string[]): string {
  const topicLines = topics.length
    ? topics.map((topic, index) => `${index + 1}. ${topic}`).join("\n")
    : [
        "1. 金额、期限、退款/退出条件是否写成明确数字",
        "2. 违约责任、扣款条件和处理流程是否有上限和证据要求",
        "3. 口头承诺是否能补进正文、附件或补充协议"
      ].join("\n");

  return [
    `你好，我认真看了这份${kindShortLabel(kind)}，签署前想先确认几处内容：`,
    "",
    topicLines,
    "",
    "麻烦把这些点用书面方式说明；如果需要修改，也请直接写进合同正文、附件或补充协议里。确认后我再继续签署流程。"
  ].join("\n");
}

function kindLabel(kind: DocumentKind): string {
  return kind === "unknown" ? "文件" : getDocumentKindLabel(kind);
}

function kindShortLabel(kind: DocumentKind): string {
  return kindLabel(kind);
}
