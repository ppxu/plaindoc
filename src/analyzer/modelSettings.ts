import type { ModelAnalyzerSettings } from "../types";

const STORAGE_KEY = "plaindoc:model-analyzer-settings:v1";

export const DEFAULT_MODEL_SETTINGS: ModelAnalyzerSettings = {
  enabled: false,
  baseUrl: "https://api.openai.com/v1",
  model: "gpt-4o-mini",
  apiKey: ""
};

export function loadModelSettings(storage: Storage | undefined = getBrowserStorage()): ModelAnalyzerSettings {
  if (!storage) {
    return DEFAULT_MODEL_SETTINGS;
  }

  try {
    const raw = storage.getItem(STORAGE_KEY);
    if (!raw) {
      return DEFAULT_MODEL_SETTINGS;
    }
    const parsed = JSON.parse(raw) as Partial<ModelAnalyzerSettings>;
    return normalizeModelSettings(parsed);
  } catch {
    return DEFAULT_MODEL_SETTINGS;
  }
}

export function saveModelSettings(settings: ModelAnalyzerSettings, storage: Storage | undefined = getBrowserStorage()) {
  if (!storage) return;
  storage.setItem(STORAGE_KEY, JSON.stringify(normalizeModelSettings(settings)));
}

export function clearModelSettings(storage: Storage | undefined = getBrowserStorage()) {
  if (!storage) return;
  storage.removeItem(STORAGE_KEY);
}

function normalizeModelSettings(settings: Partial<ModelAnalyzerSettings>): ModelAnalyzerSettings {
  return {
    enabled: Boolean(settings.enabled),
    baseUrl: cleanText(settings.baseUrl, DEFAULT_MODEL_SETTINGS.baseUrl),
    model: cleanText(settings.model, DEFAULT_MODEL_SETTINGS.model),
    apiKey: typeof settings.apiKey === "string" ? settings.apiKey : ""
  };
}

function cleanText(value: unknown, fallback: string) {
  if (typeof value !== "string") return fallback;
  const trimmed = value.trim();
  return trimmed || fallback;
}

function getBrowserStorage() {
  if (typeof window === "undefined") {
    return undefined;
  }
  return window.localStorage;
}
