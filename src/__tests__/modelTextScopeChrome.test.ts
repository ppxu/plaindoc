import { describe, expect, it } from "vitest";
import documentInputSource from "../components/DocumentInput.tsx?raw";
import modelSettingsPanelSource from "../components/ModelSettingsPanel.tsx?raw";

describe("model text scope chrome", () => {
  it("shows the model text sending scope before the user confirms AI sending", () => {
    expect(documentInputSource).toContain("documentText={text}");
    expect(modelSettingsPanelSource).toContain("documentText: string");
    expect(modelSettingsPanelSource).toContain("const preparedModelDocument = prepareModelDocumentText(documentText);");
    expect(modelSettingsPanelSource).toContain("formatModelDocumentScope(preparedModelDocument)");
    expect(modelSettingsPanelSource).toContain('aria-label="AI 发送范围"');
    expect(modelSettingsPanelSource).toContain("授权发送前可确认这次模型会看到的正文范围。");
  });

  it("shows a read-only preview of the exact document text that will be sent to the model", () => {
    expect(modelSettingsPanelSource).toContain('aria-label="AI 将收到的正文预览"');
    expect(modelSettingsPanelSource).toContain("value={preparedModelDocument.text}");
    expect(modelSettingsPanelSource).toContain("readOnly");
    expect(modelSettingsPanelSource).toContain("model-text-preview");
  });
});
