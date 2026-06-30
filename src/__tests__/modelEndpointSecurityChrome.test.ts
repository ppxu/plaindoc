import { describe, expect, it } from "vitest";
import appSource from "../App.tsx?raw";
import documentInputSource from "../components/DocumentInput.tsx?raw";
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
    expect(modelSettingsPanelSource).toContain("本机模型端点可不填写 API key");
    expect(modelSettingsPanelSource).toContain("disabled={(needsApiKey && !runtimeSettings.apiKey.trim()) || !endpointSecurity.ok}");
    expect(modelSettingsPanelSource).toContain("const modelSendBlockedReason = getModelSendBlockedReason");
    expect(modelSettingsPanelSource).toContain("model-send-blocked-reason");
    expect(modelSettingsPanelSource).toContain("填写 API key 后才能确认发送正文给远程模型服务。");
    expect(modelSettingsPanelSource).toContain("修正模型 endpoint 后才能确认发送正文。");

    expect(documentInputSource).toContain("getModelEndpointSecurity(modelSettings.baseUrl)");
    expect(documentInputSource).toContain("modelEndpointButtonBlockLabel");
    expect(documentInputSource).toContain("生成本地清单（endpoint 无效）");
    expect(documentInputSource).toContain("生成本地清单（endpoint 不安全）");
  });
});
