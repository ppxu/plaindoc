import { BrainCircuit, KeyRound, ShieldAlert, Trash2 } from "lucide-react";
import { getModelEndpointSecurity, modelEndpointSecurityMessage } from "../analyzer/modelEndpointSecurity";
import { normalizeModelSettingsForRuntime } from "../analyzer/modelSettings";
import type { SensitiveTextSummary } from "../privacy/sensitiveText";
import type { ModelAnalyzerSettings } from "../types";

interface ModelSettingsPanelProps {
  settings: ModelAnalyzerSettings;
  modelTextConsent: boolean;
  sensitiveTextSummary: SensitiveTextSummary;
  onChange: (settings: ModelAnalyzerSettings) => void;
  onClear: () => void;
  onModelTextConsentChange: (checked: boolean) => void;
  onRedactSensitiveText: () => void;
}

export function ModelSettingsPanel({
  settings,
  modelTextConsent,
  sensitiveTextSummary,
  onChange,
  onClear,
  onModelTextConsentChange,
  onRedactSensitiveText
}: ModelSettingsPanelProps) {
  const runtimeSettings = normalizeModelSettingsForRuntime(settings);
  const endpointSecurity = getModelEndpointSecurity(runtimeSettings.baseUrl);
  const endpointSecurityWarning = modelEndpointSecurityMessage(endpointSecurity);

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
          {endpointSecurityWarning ? <p className="model-endpoint-warning">{endpointSecurityWarning}</p> : null}

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
              placeholder="默认不持久保存"
              autoComplete="off"
            />
          </label>

          <label className="mode-toggle key-retention-toggle">
            <span>
              <KeyRound aria-hidden="true" />
              记住 API key
            </span>
            <input
              type="checkbox"
              checked={settings.rememberApiKey}
              onChange={(event) => update({ rememberApiKey: event.target.checked })}
            />
          </label>

          {sensitiveTextSummary.hasSensitiveText ? (
            <div className="model-sensitive-warning" role="alert">
              <div>
                <ShieldAlert aria-hidden="true" />
                <strong>发送前建议先脱敏</strong>
              </div>
              <p>
                当前正文可能包含{sensitiveTextSummary.labels.join("、")}。PlainDoc 只在本地显示类别提醒，不保存或展示具体敏感值；勾选发送确认前，请先删除或替换不必要的个人信息。
              </p>
              <button type="button" onClick={onRedactSensitiveText}>
                生成脱敏副本
              </button>
            </div>
          ) : null}

          <label className="mode-toggle model-send-consent">
            <span>
              <BrainCircuit aria-hidden="true" />
              本次允许发送正文给模型服务
            </span>
            <input
              type="checkbox"
              checked={modelTextConsent}
              disabled={!runtimeSettings.apiKey.trim() || !endpointSecurity.ok}
              onChange={(event) => onModelTextConsentChange(event.target.checked)}
            />
          </label>

          <button className="clear-settings-button" type="button" onClick={onClear}>
            <Trash2 aria-hidden="true" />
            清除模型设置
          </button>

          <p className="model-warning">
            只有勾选本次发送确认后，待分析文本才会发送到你配置的模型服务。更换正文、样例、文件或模型端点后会自动取消确认。API key 默认只保存在当前页面会话；勾选“记住 API key”后才会写入本机浏览器。
          </p>
        </div>
      ) : null}
    </section>
  );
}
