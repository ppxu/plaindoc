import { describe, expect, it } from "vitest";
import documentInputSource from "../components/DocumentInput.tsx?raw";
import modelSettingsPanelSource from "../components/ModelSettingsPanel.tsx?raw";

describe("model text scope chrome", () => {
  it("shows the model text sending scope before the user confirms AI sending", () => {
    expect(documentInputSource).toContain("documentText={text}");
    expect(modelSettingsPanelSource).toContain("documentText: string");
    expect(modelSettingsPanelSource).toContain("formatModelDocumentScope(prepareModelDocumentText(documentText))");
    expect(modelSettingsPanelSource).toContain('aria-label="AI 发送范围"');
    expect(modelSettingsPanelSource).toContain("授权发送前可确认这次模型会看到的正文范围。");
  });
});
