import { describe, expect, it } from "vitest";
import appSource from "../App.tsx?raw";
import modelSettingsPanelSource from "../components/ModelSettingsPanel.tsx?raw";

describe("model settings clearing chrome", () => {
  it("confirms before clearing AI model settings", () => {
    expect(appSource).toContain("handleClearModelSettings");
    expect(appSource).toContain("confirmModelSettingsClear()");
    expect(appSource).toContain("确定要清除模型设置吗？");
    expect(appSource).toContain("会清空 endpoint、模型名、API key 和 AI 发送确认");
    expect(appSource).toContain("clearModelSettings()");
    expect(appSource).toContain("已清除模型设置和 AI 发送确认。");

    expect(modelSettingsPanelSource).toContain("清除模型设置");
    expect(modelSettingsPanelSource).toContain("onClear");
  });
});
