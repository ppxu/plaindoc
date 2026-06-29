import { describe, expect, it } from "vitest";
import appSource from "../App.tsx?raw";
import modelSettingsPanelSource from "../components/ModelSettingsPanel.tsx?raw";

describe("model endpoint security chrome", () => {
  it("surfaces endpoint security checks before model sending", () => {
    expect(appSource).toContain("normalizeModelSettingsForRuntime(modelSettings)");
    expect(appSource).toContain("getModelEndpointSecurity(runtimeModelSettings.baseUrl)");
    expect(appSource).toContain("modelEndpointSecurityMessage(endpointSecurity)");

    expect(modelSettingsPanelSource).toContain("normalizeModelSettingsForRuntime(settings)");
    expect(modelSettingsPanelSource).toContain("getModelEndpointSecurity(runtimeSettings.baseUrl)");
    expect(modelSettingsPanelSource).toContain("modelEndpointSecurityMessage(endpointSecurity)");
    expect(modelSettingsPanelSource).toContain("model-endpoint-warning");
    expect(modelSettingsPanelSource).toContain("disabled={!runtimeSettings.apiKey.trim() || !endpointSecurity.ok}");
  });
});
