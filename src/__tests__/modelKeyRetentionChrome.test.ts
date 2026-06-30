import { describe, expect, it } from "vitest";
import modelSettingsPanelSource from "../components/ModelSettingsPanel.tsx?raw";

describe("model key retention chrome", () => {
  it("shows whether the API key is session-only or persisted locally", () => {
    expect(modelSettingsPanelSource).toContain("model-key-retention-status");
    expect(modelSettingsPanelSource).toContain("getModelKeyRetentionStatus(settings.rememberApiKey, settings.apiKey)");
    expect(modelSettingsPanelSource).toContain("API key 仅保留在当前页面会话，刷新页面后需要重新填写。");
    expect(modelSettingsPanelSource).toContain("已开启记住 API key；填写 API key 后才会写入本机浏览器。");
    expect(modelSettingsPanelSource).toContain("API key 会保存在本机浏览器；清除模型设置或取消勾选后会从持久化设置中移除。");
  });
});
