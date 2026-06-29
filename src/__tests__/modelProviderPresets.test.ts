import { describe, expect, it } from "vitest";
import { applyModelProviderPreset, modelProviderPresets } from "../analyzer/modelProviderPresets";
import type { ModelAnalyzerSettings } from "../types";

describe("model provider presets", () => {
  it("offers practical OpenAI-compatible endpoint presets", () => {
    expect(modelProviderPresets.map((preset) => preset.id)).toEqual(["openai", "deepseek", "openrouter", "ollama"]);
    expect(modelProviderPresets.every((preset) => preset.baseUrl.endsWith("/v1"))).toBe(true);
  });

  it("updates endpoint and model without touching consent-sensitive settings", () => {
    const settings: ModelAnalyzerSettings = {
      enabled: true,
      baseUrl: "https://example.com/v1",
      model: "custom-model",
      apiKey: "secret",
      rememberApiKey: true
    };

    expect(applyModelProviderPreset(settings, "deepseek")).toEqual({
      enabled: true,
      baseUrl: "https://api.deepseek.com/v1",
      model: "deepseek-chat",
      apiKey: "secret",
      rememberApiKey: true
    });
  });
});
