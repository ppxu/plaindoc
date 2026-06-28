import type {
  AnalysisReport,
  AnalyzerInput,
  ChecklistItem,
  ModelAnalyzerSettings,
  RiskFinding,
  Severity
} from "../types";

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
  plainLanguage?: unknown;
}

export async function analyzeWithModel(
  input: AnalyzerInput,
  settings: ModelAnalyzerSettings,
  localReport: AnalysisReport
): Promise<AnalysisReport> {
  if (!settings.enabled || !settings.apiKey.trim()) {
    return {
      ...localReport,
      notice: "AI 增强未启用或缺少 API key，当前使用本地规则分析。"
    };
  }

  const response = await fetch(`${settings.baseUrl.replace(/\/+$/, "")}/chat/completions`, {
    method: "POST",
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
                "array, max 6 items, each has title, severity(red/yellow/green), explanation, whyItMatters, suggestion",
              checklist: "array, max 8 items, each has question, reason, severity(red/yellow/green)",
              plainLanguage: "array, max 4 strings"
            },
            documentKind: input.kind,
            documentText: input.text.slice(0, 12000),
            localBaseline: {
              summary: localReport.summary,
              status: localReport.status,
              score: localReport.score,
              facts: localReport.facts,
              findings: localReport.findings,
              checklist: localReport.checklist,
              plainLanguage: localReport.plainLanguage
            }
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
  return mergeModelPayload(localReport, payload, settings.model.trim());
}

export function mergeModelPayload(
  localReport: AnalysisReport,
  payload: ModelReportPayload,
  modelName: string
): AnalysisReport {
  const findings = sanitizeFindings(payload.findings);
  const checklist = sanitizeChecklist(payload.checklist);
  const plainLanguage = sanitizeStringList(payload.plainLanguage, 4, 180);
  const summary = sanitizeString(payload.summary, 120);

  return {
    ...localReport,
    summary: summary || localReport.summary,
    findings: findings.length ? findings : localReport.findings,
    checklist: checklist.length ? checklist : localReport.checklist,
    plainLanguage: plainLanguage.length ? plainLanguage : localReport.plainLanguage,
    source: "model",
    modelName,
    notice: "AI 增强已开启：报告结合了本地规则和你配置的模型服务。"
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

function sanitizeFindings(value: unknown): RiskFinding[] {
  if (!Array.isArray(value)) return [];
  return value.slice(0, 6).flatMap((item, index) => {
    if (!isRecord(item)) return [];
    const title = sanitizeString(item.title, 70);
    const severity = sanitizeSeverity(item.severity);
    const explanation = sanitizeString(item.explanation, 220);
    const whyItMatters = sanitizeString(item.whyItMatters, 220);
    const suggestion = sanitizeString(item.suggestion, 220);
    if (!title || !explanation || !whyItMatters || !suggestion) return [];
    return [{
      id: `model-${index + 1}-${slugify(title)}`,
      title,
      severity,
      explanation,
      whyItMatters,
      suggestion
    }];
  });
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

function sanitizeSeverity(value: unknown): Severity {
  return value === "red" || value === "yellow" || value === "green" ? value : "yellow";
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
