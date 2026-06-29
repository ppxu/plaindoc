import type { ModelAnalyzerSettings } from "../types";

export type ModelProviderPresetId = "openai" | "deepseek" | "openrouter" | "ollama";

export interface ModelProviderPreset {
  id: ModelProviderPresetId;
  label: string;
  description: string;
  baseUrl: string;
  model: string;
}

export const modelProviderPresets: ModelProviderPreset[] = [
  {
    id: "openai",
    label: "OpenAI",
    description: "默认兼容端点",
    baseUrl: "https://api.openai.com/v1",
    model: "gpt-4o-mini"
  },
  {
    id: "deepseek",
    label: "DeepSeek",
    description: "低成本中文增强",
    baseUrl: "https://api.deepseek.com/v1",
    model: "deepseek-chat"
  },
  {
    id: "openrouter",
    label: "OpenRouter",
    description: "多模型路由",
    baseUrl: "https://openrouter.ai/api/v1",
    model: "openai/gpt-4o-mini"
  },
  {
    id: "ollama",
    label: "Ollama",
    description: "本机模型",
    baseUrl: "http://localhost:11434/v1",
    model: "qwen2.5:7b"
  }
];

export function applyModelProviderPreset(
  settings: ModelAnalyzerSettings,
  presetId: ModelProviderPresetId
): ModelAnalyzerSettings {
  const preset = modelProviderPresets.find((item) => item.id === presetId);
  if (!preset) {
    return settings;
  }

  return {
    ...settings,
    baseUrl: preset.baseUrl,
    model: preset.model
  };
}

export function getMatchingModelProviderPresetId(settings: ModelAnalyzerSettings): ModelProviderPresetId | undefined {
  const baseUrl = settings.baseUrl.trim().replace(/\/+$/, "");
  const model = settings.model.trim();
  return modelProviderPresets.find((preset) => preset.baseUrl.replace(/\/+$/, "") === baseUrl && preset.model === model)
    ?.id;
}
