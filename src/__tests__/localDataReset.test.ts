import { describe, expect, it } from "vitest";
import { DEFAULT_MODEL_SETTINGS, loadModelSettings, saveModelSettings } from "../analyzer/modelSettings";
import { analyzeDocument } from "../analyzer/localAnalyzer";
import { loadReportHistory, saveReportToHistory } from "../history/reportHistory";
import { clearLocalStoredData, createLocalDataResetState } from "../state/localDataReset";
import type { ModelAnalyzerSettings } from "../types";

describe("local data reset", () => {
  it("clears document text, report history, model settings, and AI send consent", () => {
    const reset = createLocalDataResetState();

    expect(reset.text).toBe("");
    expect(reset.kind).toBe("unknown");
    expect(reset.selectedExampleId).toBe("");
    expect(reset.history).toEqual([]);
    expect(reset.modelSettings).toEqual(DEFAULT_MODEL_SETTINGS);
    expect(reset.modelTextConsent).toBe(false);
    expect(reset.evidenceSelection).toBeNull();
    expect(reset.error).toBe("");
    expect(reset.notice).toContain("已清除本机数据");
    expect(reset.report.documentKind).toBe("unknown");
    expect(reset.report.findings).toEqual([]);
  });

  it("removes persisted report history and model settings from browser storage", () => {
    const storage = createMemoryStorage();
    const settings: ModelAnalyzerSettings = {
      enabled: true,
      baseUrl: "https://example.com/v1",
      model: "custom-model",
      apiKey: "secret",
      rememberApiKey: true
    };
    saveModelSettings(settings, storage);
    saveReportToHistory(analyzeDocument({ text: "押金 5000 元，提前退租赔两个月租金。", kind: "rental" }), storage);

    clearLocalStoredData(storage);

    expect(loadModelSettings(storage)).toEqual(DEFAULT_MODEL_SETTINGS);
    expect(loadReportHistory(storage)).toEqual([]);
  });

  it("does not fail when browser localStorage access is blocked", () => {
    const previousWindow = globalThis.window;
    Object.defineProperty(globalThis, "window", {
      configurable: true,
      value: {
        get localStorage() {
          throw new Error("storage blocked");
        }
      }
    });

    try {
      expect(() => clearLocalStoredData()).not.toThrow();
    } finally {
      Object.defineProperty(globalThis, "window", {
        configurable: true,
        value: previousWindow
      });
    }
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
