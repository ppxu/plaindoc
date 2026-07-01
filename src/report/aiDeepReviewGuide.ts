import type { AnalysisReport } from "../types";

export interface AiDeepReviewGuideInput {
  report: AnalysisReport;
  modelEnabled: boolean;
  modelTextConsent: boolean;
  endpointOk: boolean;
  needsApiKey: boolean;
  hasApiKey: boolean;
  modelName: string;
}

export interface AiDeepReviewGuide {
  status: "off" | "needs-setup" | "needs-consent" | "ready" | "complete";
  title: string;
  summary: string;
  nextStep: string;
  actionLabel: string;
  capabilities: string[];
}

const DEEP_REVIEW_CAPABILITIES = ["跨条款矛盾", "隐藏义务", "谈判话术"];

export function getAiDeepReviewGuide(input: AiDeepReviewGuideInput): AiDeepReviewGuide {
  if (input.report.source === "model") {
    const modelName = input.report.modelName || input.modelName || "已配置模型";
    return {
      status: "complete",
      title: "AI 深度审阅已完成",
      summary: `本报告已结合本地规则和 ${modelName} 的模型分析。`,
      nextStep: "继续核对证据片段、签署前状态和可复制给对方的追问。",
      actionLabel: "查看 AI 设置",
      capabilities: DEEP_REVIEW_CAPABILITIES
    };
  }

  if (!input.modelEnabled) {
    return {
      status: "off",
      title: "用 AI 深度审阅补查隐藏问题",
      summary: "当前报告来自本地规则，适合快速定位明确风险；大模型可进一步检查上下文、矛盾和沟通建议。",
      nextStep: "开启后先确认将发送的正文范围，再由你配置的模型服务分析。",
      actionLabel: "开启 AI 深度审阅",
      capabilities: DEEP_REVIEW_CAPABILITIES
    };
  }

  if (!input.endpointOk || (input.needsApiKey && !input.hasApiKey)) {
    return {
      status: "needs-setup",
      title: "补完模型设置后再做 AI 深度审阅",
      summary: "AI 增强已开启，但模型 endpoint 或 API key 还没有准备好。",
      nextStep: input.endpointOk ? "填写 API key，或切换到可用的本机模型端点。" : "先修正模型 endpoint，再确认发送范围。",
      actionLabel: "检查模型设置",
      capabilities: DEEP_REVIEW_CAPABILITIES
    };
  }

  if (!input.modelTextConsent) {
    return {
      status: "needs-consent",
      title: "确认发送范围后再做 AI 深度审阅",
      summary: "模型服务已配置，但 PlainDoc 还不会发送正文。",
      nextStep: "先查看将发送给模型的正文预览，确认发送范围后再生成 AI 增强清单。",
      actionLabel: "确认 AI 发送范围",
      capabilities: DEEP_REVIEW_CAPABILITIES
    };
  }

  return {
    status: "ready",
    title: "AI 深度审阅已准备",
    summary: "模型服务和发送确认都已就绪，下一次生成会调用你配置的模型服务。",
    nextStep: "点击生成 AI 增强清单，让模型补查跨条款问题和谈判建议。",
    actionLabel: "查看 AI 设置",
    capabilities: DEEP_REVIEW_CAPABILITIES
  };
}
