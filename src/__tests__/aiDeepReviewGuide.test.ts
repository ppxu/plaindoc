import { describe, expect, it } from "vitest";
import { analyzeDocument } from "../analyzer/localAnalyzer";
import { getAiDeepReviewGuide } from "../report/aiDeepReviewGuide";

const localReport = analyzeDocument({
  text: "押金 5000 元。提前退租赔偿两个月租金。",
  kind: "rental"
});

describe("getAiDeepReviewGuide", () => {
  it("invites local-only users to turn on deep model review", () => {
    const guide = getAiDeepReviewGuide({
      report: localReport,
      modelEnabled: false,
      modelTextConsent: false,
      endpointOk: true,
      needsApiKey: true,
      hasApiKey: false,
      modelName: "gpt-4o-mini"
    });

    expect(guide.status).toBe("off");
    expect(guide.title).toContain("AI 深度审阅");
    expect(guide.actionLabel).toContain("开启");
    expect(guide.capabilities).toContain("跨条款矛盾");
  });

  it("asks users to finish model setup before promising deep review", () => {
    const guide = getAiDeepReviewGuide({
      report: localReport,
      modelEnabled: true,
      modelTextConsent: false,
      endpointOk: true,
      needsApiKey: true,
      hasApiKey: false,
      modelName: "gpt-4o-mini"
    });

    expect(guide.status).toBe("needs-setup");
    expect(guide.title).toContain("补完模型设置");
    expect(guide.nextStep).toContain("API key");
  });

  it("asks for send confirmation after model setup is ready", () => {
    const guide = getAiDeepReviewGuide({
      report: localReport,
      modelEnabled: true,
      modelTextConsent: false,
      endpointOk: true,
      needsApiKey: true,
      hasApiKey: true,
      modelName: "gpt-4o-mini"
    });

    expect(guide.status).toBe("needs-consent");
    expect(guide.nextStep).toContain("发送范围");
  });

  it("marks model reports as completed deep review", () => {
    const guide = getAiDeepReviewGuide({
      report: { ...localReport, source: "model", modelName: "deepseek-chat" },
      modelEnabled: true,
      modelTextConsent: true,
      endpointOk: true,
      needsApiKey: true,
      hasApiKey: true,
      modelName: "deepseek-chat"
    });

    expect(guide.status).toBe("complete");
    expect(guide.title).toContain("已完成");
    expect(guide.summary).toContain("deepseek-chat");
  });
});
