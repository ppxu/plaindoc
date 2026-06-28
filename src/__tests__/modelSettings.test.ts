import { describe, expect, it } from "vitest";
import { clearModelSettings, loadModelSettings, saveModelSettings } from "../analyzer/modelSettings";
import type { ModelAnalyzerSettings } from "../types";

describe("model settings", () => {
  it("does not persist the API key unless the user opts in", () => {
    const storage = createMemoryStorage();
    const settings: ModelAnalyzerSettings = {
      enabled: true,
      baseUrl: "https://example.com/v1",
      model: "custom-model",
      apiKey: "secret",
      rememberApiKey: false
    };

    saveModelSettings(settings, storage);
    expect(loadModelSettings(storage)).toEqual({
      enabled: true,
      baseUrl: "https://example.com/v1",
      model: "custom-model",
      apiKey: "",
      rememberApiKey: false
    });
  });

  it("persists the API key only after rememberApiKey is enabled", () => {
    const storage = createMemoryStorage();
    const settings: ModelAnalyzerSettings = {
      enabled: true,
      baseUrl: "https://example.com/v1",
      model: "custom-model",
      apiKey: "secret",
      rememberApiKey: true
    };

    saveModelSettings(settings, storage);
    expect(loadModelSettings(storage)).toEqual(settings);
  });

  it("clears model settings", () => {
    const storage = createMemoryStorage();
    const settings: ModelAnalyzerSettings = {
      enabled: true,
      baseUrl: "https://example.com/v1",
      model: "custom-model",
      apiKey: "secret",
      rememberApiKey: true
    };

    saveModelSettings(settings, storage);

    clearModelSettings(storage);
    expect(loadModelSettings(storage).enabled).toBe(false);
  });
});

function createMemoryStorage(): Storage {
  const values = new Map<string, string>();

  return {
    get length() {
      return values.size;
    },
    clear: () => values.clear(),
    getItem: (key: string) => values.get(key) ?? null,
    key: (index: number) => Array.from(values.keys())[index] ?? null,
    removeItem: (key: string) => {
      values.delete(key);
    },
    setItem: (key: string, value: string) => {
      values.set(key, value);
    }
  };
}
