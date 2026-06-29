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

  it("ignores browser storage write and removal failures", () => {
    const storage = createFailingStorage({ failSetItem: true, failRemoveItem: true });
    const settings: ModelAnalyzerSettings = {
      enabled: true,
      baseUrl: "https://example.com/v1",
      model: "custom-model",
      apiKey: "secret",
      rememberApiKey: true
    };

    expect(() => saveModelSettings(settings, storage)).not.toThrow();
    expect(() => clearModelSettings(storage)).not.toThrow();
    expect(loadModelSettings(storage)).toEqual(expect.objectContaining({ enabled: false, apiKey: "" }));
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

function createFailingStorage({
  failSetItem = false,
  failRemoveItem = false
}: {
  failSetItem?: boolean;
  failRemoveItem?: boolean;
}): Storage {
  const storage = createMemoryStorage();
  return {
    ...storage,
    removeItem: (key: string) => {
      if (failRemoveItem) {
        throw new Error("remove blocked");
      }
      storage.removeItem(key);
    },
    setItem: (key: string, value: string) => {
      if (failSetItem) {
        throw new Error("quota exceeded");
      }
      storage.setItem(key, value);
    }
  };
}
