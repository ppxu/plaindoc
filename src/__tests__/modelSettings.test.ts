import { describe, expect, it } from "vitest";
import { clearModelSettings, loadModelSettings, saveModelSettings } from "../analyzer/modelSettings";
import type { ModelAnalyzerSettings } from "../types";

describe("model settings", () => {
  it("stores, loads, and clears model settings", () => {
    const storage = createMemoryStorage();
    const settings: ModelAnalyzerSettings = {
      enabled: true,
      baseUrl: "https://example.com/v1",
      model: "custom-model",
      apiKey: "secret"
    };

    saveModelSettings(settings, storage);
    expect(loadModelSettings(storage)).toEqual(settings);

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
