import { describe, expect, it } from "vitest";
import appSource from "../App.tsx?raw";
import documentInputSource from "../components/DocumentInput.tsx?raw";
import modelSettingsPanelSource from "../components/ModelSettingsPanel.tsx?raw";

describe("model connection test chrome", () => {
  it("exposes a model connection test before document sending confirmation", () => {
    expect(appSource).toContain("testModelConnection(modelSettings");
    expect(appSource).toContain("modelConnectionStatus");
    expect(appSource).toContain("setModelConnectionStatus(null)");

    expect(documentInputSource).toContain("onTestModelConnection");
    expect(modelSettingsPanelSource).toContain("测试模型连接");
    expect(modelSettingsPanelSource).toContain("model-connection-status");
    expect(modelSettingsPanelSource).toContain("modelTextConsent");
  });

  it("announces the model connection test busy state", () => {
    expect(modelSettingsPanelSource).toContain('<div className="model-connection-test" aria-busy={isTestingModelConnection}>');
    expect(modelSettingsPanelSource).toContain('<span className="sr-only" role="status" aria-live="polite" aria-atomic="true">');
    expect(modelSettingsPanelSource).toContain("正在测试模型连接。");
  });
});
