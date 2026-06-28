import { BrainCircuit, Trash2 } from "lucide-react";
import type { ModelAnalyzerSettings } from "../types";

interface ModelSettingsPanelProps {
  settings: ModelAnalyzerSettings;
  onChange: (settings: ModelAnalyzerSettings) => void;
  onClear: () => void;
}

export function ModelSettingsPanel({ settings, onChange, onClear }: ModelSettingsPanelProps) {
  function update(partial: Partial<ModelAnalyzerSettings>) {
    onChange({ ...settings, ...partial });
  }

  return (
    <section className="model-settings" aria-label="AI enhanced analysis settings">
      <label className="mode-toggle">
        <span>
          <BrainCircuit aria-hidden="true" />
          AI 增强分析
        </span>
        <input
          type="checkbox"
          checked={settings.enabled}
          onChange={(event) => update({ enabled: event.target.checked })}
        />
      </label>

      {settings.enabled ? (
        <div className="model-settings-body">
          <label className="field compact-field">
            <span>OpenAI-compatible endpoint</span>
            <input
              value={settings.baseUrl}
              onChange={(event) => update({ baseUrl: event.target.value })}
              placeholder="https://api.openai.com/v1"
            />
          </label>

          <label className="field compact-field">
            <span>模型</span>
            <input
              value={settings.model}
              onChange={(event) => update({ model: event.target.value })}
              placeholder="gpt-4o-mini"
            />
          </label>

          <label className="field compact-field">
            <span>API key</span>
            <input
              type="password"
              value={settings.apiKey}
              onChange={(event) => update({ apiKey: event.target.value })}
              placeholder="只保存在本机浏览器"
              autoComplete="off"
            />
          </label>

          <button className="clear-settings-button" type="button" onClick={onClear}>
            <Trash2 aria-hidden="true" />
            清除模型设置
          </button>

          <p className="model-warning">
            开启后，待分析文本会发送到你配置的模型服务。API key 存在本机浏览器，不会提交到 PlainDoc 仓库或 GitHub Pages。
          </p>
        </div>
      ) : null}
    </section>
  );
}
