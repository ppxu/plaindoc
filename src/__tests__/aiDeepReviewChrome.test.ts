import { describe, expect, it } from "vitest";
import appSource from "../App.tsx?raw";
import modelSettingsPanelSource from "../components/ModelSettingsPanel.tsx?raw";
import reportPanelSource from "../components/ReportPanel.tsx?raw";

describe("AI deep review chrome", () => {
  it("renders a report-level AI deep review guide with a real setup action", () => {
    expect(reportPanelSource).toContain("ai-deep-review");
    expect(reportPanelSource).toContain("AI 深度审阅");
    expect(reportPanelSource).toContain("aiDeepReviewGuide.actionLabel");
    expect(reportPanelSource).toContain("onRequestAiDeepReview");
  });

  it("opens the AI settings panel from the report guide", () => {
    expect(appSource).toContain("handleRequestAiDeepReview");
    expect(appSource).toContain("enabled: true");
    expect(appSource).toContain('document.getElementById("model-settings")');
    expect(modelSettingsPanelSource).toContain('id="model-settings"');
  });
});
