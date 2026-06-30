import { describe, expect, it } from "vitest";
import {
  applyModelProviderPreset,
  getMatchingModelProviderPresetId,
  modelProviderPresets
} from "../analyzer/modelProviderPresets";
import type { ModelAnalyzerSettings } from "../types";

describe("model provider presets", () => {
  it("offers practical OpenAI-compatible endpoint presets", () => {
    expect(modelProviderPresets.map((preset) => preset.id)).toEqual(["openai", "deepseek", "openrouter", "ollama"]);
    expect(modelProviderPresets.every((preset) => preset.baseUrl.endsWith("/v1"))).toBe(true);
  });

  it("clears provider-scoped credentials when switching endpoint presets", () => {
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
      apiKey: "",
      rememberApiKey: false
    });
  });

  it("identifies the active preset only when endpoint and model both match", () => {
    expect(
      getMatchingModelProviderPresetId({
        enabled: true,
        baseUrl: " https://api.deepseek.com/v1 ",
        model: "deepseek-chat",
        apiKey: "",
        rememberApiKey: false
      })
    ).toBe("deepseek");

    expect(
      getMatchingModelProviderPresetId({
        enabled: true,
        baseUrl: "https://api.deepseek.com/v1",
        model: "custom-deepseek-model",
        apiKey: "",
        rememberApiKey: false
      })
    ).toBeUndefined();
  });
});
