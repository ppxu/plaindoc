import type {
  ActionPlan,
  AnalysisReport,
  AnalyzerInput,
  ChecklistItem,
  ModelAnalyzerSettings,
  RiskFinding,
  Severity
} from "../types";
import { prepareModelBaseline, prepareModelDocumentText, type PreparedModelDocumentText } from "./modelInput";

interface ChatCompletionResponse {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
}

interface ModelReportPayload {
  summary?: unknown;
  findings?: unknown;
  checklist?: unknown;
  actionPlan?: unknown;
  plainLanguage?: unknown;
}

interface ModelFindingPatch {
  localFindingId?: string;
  title: string;
  severity: Severity;
  explanation: string;
  whyItMatters: string;
  suggestion: string;
  modification?: string;
}

interface AnalyzeWithModelOptions {
  signal?: AbortSignal;
}

export async function analyzeWithModel(
  input: AnalyzerInput,
  settings: ModelAnalyzerSettings,
  localReport: AnalysisReport,
  options: AnalyzeWithModelOptions = {}
): Promise<AnalysisReport> {
  if (!settings.enabled || !settings.apiKey.trim()) {
    return {
      ...localReport,
      notice: "AI 增强未启用或缺少 API key，当前使用本地规则分析。"
    };
  }

  const preparedDocument = prepareModelDocumentText(input.text);
  const response = await fetch(`${settings.baseUrl.replace(/\/+$/, "")}/chat/completions`, {
    method: "POST",
    signal: options.signal,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${settings.apiKey.trim()}`
    },
    body: JSON.stringify({
      model: settings.model.trim(),
      temperature: 0.2,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: [
            "You are PlainDoc, a cautious document-reading assistant for ordinary people.",
            "Return strict JSON only. Do not provide legal, medical, or financial advice.",
            "Flag ambiguous obligations, payment terms, penalties, one-sided discretion, and missing acceptance criteria.",
            "Use concise Chinese."
          ].join(" ")
        },
        {
          role: "user",
          content: JSON.stringify({
            task: "Improve this local baseline report. Keep it practical and plain-language.",
            requiredJsonShape: {
              summary: "string, max 120 Chinese chars",
              findings:
                "array, max 6 items, each has localFindingId(optional, copy from localBaseline.findings[].id when improving one local risk), title, severity(red/yellow/green), explanation, whyItMatters, suggestion, modification",
              checklist: "array, max 8 items, each has question, reason, severity(red/yellow/green)",
              actionPlan: "object with priority(low/medium/high), title, steps(max 3 strings), message",
              plainLanguage: "array, max 4 strings"
            },
            documentKind: input.kind,
            documentText: preparedDocument.text,
            documentTextScope: {
              originalChars: preparedDocument.originalLength,
              sentChars: preparedDocument.sentLength,
              truncated: preparedDocument.truncated
            },
            localBaseline: prepareModelBaseline(localReport, preparedDocument)
          })
        }
      ]
    })
  });

  if (!response.ok) {
    throw new Error(`模型服务返回 ${response.status}。`);
  }

  const data = (await response.json()) as ChatCompletionResponse;
  const content = data.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error("模型没有返回可读取的内容。");
  }

  const payload = parseModelPayload(content);
  return mergeModelPayload(localReport, payload, settings.model.trim(), preparedDocument);
}

export function mergeModelPayload(
  localReport: AnalysisReport,
  payload: ModelReportPayload,
  modelName: string,
  modelInput?: PreparedModelDocumentText
): AnalysisReport {
  const findings = sanitizeFindings(payload.findings);
  const checklist = sanitizeChecklist(payload.checklist);
  const actionPlan = sanitizeActionPlan(payload.actionPlan);
  const plainLanguage = sanitizeStringList(payload.plainLanguage, 4, 180);
  const summary = sanitizeString(payload.summary, 120);

  return {
    ...localReport,
    summary: summary || localReport.summary,
    findings: mergeFindings(localReport.findings, findings),
    checklist: checklist.length ? checklist : localReport.checklist,
    actionPlan: actionPlan ?? localReport.actionPlan,
    plainLanguage: plainLanguage.length ? plainLanguage : localReport.plainLanguage,
    source: "model",
    modelName,
    notice: buildModelNotice(modelInput)
  };
}

function buildModelNotice(modelInput?: PreparedModelDocumentText): string {
  const baseNotice = "AI 增强已开启：报告结合了本地规则和你配置的模型服务；本地证据片段会被保留。";
  if (!modelInput?.truncated) {
    return baseNotice;
  }
  return `${baseNotice} 由于正文较长，AI 增强仅发送前 ${modelInput.sentLength} 个字符给模型服务，完整文本仍由本地规则分析；超出部分请继续人工确认。`;
}

function sanitizeActionPlan(value: unknown): ActionPlan | undefined {
  if (!isRecord(value)) return undefined;
  const title = sanitizeString(value.title, 90);
  const steps = sanitizeStringList(value.steps, 3, 140);
  const message = sanitizeMessage(value.message, 700);
  if (!title || steps.length === 0 || !message) return undefined;
  return {
    priority: sanitizePriority(value.priority),
    title,
    steps,
    message
  };
}

function parseModelPayload(content: string): ModelReportPayload {
  try {
    return JSON.parse(content) as ModelReportPayload;
  } catch {
    const match = content.match(/\{[\s\S]*\}/);
    if (!match) {
      throw new Error("模型返回的不是 JSON。");
    }
    return JSON.parse(match[0]) as ModelReportPayload;
  }
}

function sanitizeFindings(value: unknown): ModelFindingPatch[] {
  if (!Array.isArray(value)) return [];
  return value.slice(0, 6).flatMap((item) => {
    if (!isRecord(item)) return [];
    const localFindingId = sanitizeString(item.localFindingId, 120);
    const title = sanitizeString(item.title, 70);
    const severity = sanitizeSeverity(item.severity);
    const explanation = sanitizeString(item.explanation, 220);
    const whyItMatters = sanitizeString(item.whyItMatters, 220);
    const suggestion = sanitizeString(item.suggestion, 220);
    const modification = sanitizeString(item.modification, 360);
    if (!title || !explanation || !whyItMatters || !suggestion) return [];
    return [{
      localFindingId: localFindingId || undefined,
      title,
      severity,
      explanation,
      whyItMatters,
      suggestion,
      modification: modification || undefined
    }];
  });
}

function mergeFindings(localFindings: RiskFinding[], modelFindings: ModelFindingPatch[]): RiskFinding[] {
  if (!modelFindings.length) return localFindings;

  const unusedModelFindings = [...modelFindings];
  const enhancedLocalFindings = localFindings.map((localFinding) => {
    const modelIndex = unusedModelFindings.findIndex((finding) => finding.localFindingId === localFinding.id);
    if (modelIndex === -1) return localFinding;
    const [modelFinding] = unusedModelFindings.splice(modelIndex, 1);
    return {
      ...localFinding,
      title: modelFinding.title,
      severity: modelFinding.severity,
      explanation: modelFinding.explanation,
      whyItMatters: modelFinding.whyItMatters,
      suggestion: modelFinding.suggestion,
      modification: modelFinding.modification || localFinding.modification,
      evidence: localFinding.evidence
    };
  });

  const remainingSlots = Math.max(0, 6 - enhancedLocalFindings.length);
  const supplementalFindings = unusedModelFindings.slice(0, remainingSlots).map((finding, index) => ({
    id: `model-${index + 1}-${slugify(finding.title)}`,
    title: finding.title,
    severity: finding.severity,
    explanation: finding.explanation,
    whyItMatters: finding.whyItMatters,
    suggestion: finding.suggestion,
    modification: finding.modification
  }));

  return [...enhancedLocalFindings, ...supplementalFindings];
}

function sanitizeChecklist(value: unknown): ChecklistItem[] {
  if (!Array.isArray(value)) return [];
  return value.slice(0, 8).flatMap((item) => {
    if (!isRecord(item)) return [];
    const question = sanitizeString(item.question, 120);
    const reason = sanitizeString(item.reason, 180);
    if (!question || !reason) return [];
    return [{
      question,
      reason,
      severity: sanitizeSeverity(item.severity)
    }];
  });
}

function sanitizeStringList(value: unknown, limit: number, maxLength: number): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => sanitizeString(item, maxLength))
    .filter(Boolean)
    .slice(0, limit);
}

function sanitizeString(value: unknown, maxLength: number): string {
  if (typeof value !== "string") return "";
  return value.replace(/\s+/g, " ").trim().slice(0, maxLength);
}

function sanitizeMessage(value: unknown, maxLength: number): string {
  if (typeof value !== "string") return "";
  return value
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
    .slice(0, maxLength);
}

function sanitizeSeverity(value: unknown): Severity {
  return value === "red" || value === "yellow" || value === "green" ? value : "yellow";
}

function sanitizePriority(value: unknown): ActionPlan["priority"] {
  return value === "low" || value === "medium" || value === "high" ? value : "medium";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 32) || "finding";
}
