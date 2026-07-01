import { BrainCircuit, FileText, KeyRound, PlugZap, ShieldAlert, Square, Trash2 } from "lucide-react";
import { formatModelDocumentScope, prepareModelDocumentText } from "../analyzer/modelInput";
import {
  getModelEndpointSecurity,
  modelEndpointNeedsApiKey,
  modelEndpointSecurityMessage
} from "../analyzer/modelEndpointSecurity";
import {
  applyModelProviderPreset,
  getMatchingModelProviderPresetId,
  modelProviderPresets,
  type ModelProviderPresetId
} from "../analyzer/modelProviderPresets";
import { normalizeModelSettingsForRuntime } from "../analyzer/modelSettings";
import type { SensitiveTextSummary } from "../privacy/sensitiveText";
import type { ModelAnalyzerSettings } from "../types";

interface ModelSettingsPanelProps {
  settings: ModelAnalyzerSettings;
  documentText: string;
  modelTextConsent: boolean;
  modelConnectionStatus: { tone: "success" | "error"; message: string } | null;
  isTestingModelConnection: boolean;
  sensitiveTextSummary: SensitiveTextSummary;
  onChange: (settings: ModelAnalyzerSettings) => void;
  onClear: () => void;
  onModelTextConsentChange: (checked: boolean) => void;
  onTestModelConnection: () => void;
  onCancelModelConnectionTest: () => void;
  onRedactSensitiveText: () => void;
}

export function ModelSettingsPanel({
  settings,
  documentText,
  modelTextConsent,
  modelConnectionStatus,
  isTestingModelConnection,
  sensitiveTextSummary,
  onChange,
  onClear,
  onModelTextConsentChange,
  onTestModelConnection,
  onCancelModelConnectionTest,
  onRedactSensitiveText
}: ModelSettingsPanelProps) {
  const runtimeSettings = normalizeModelSettingsForRuntime(settings);
  const endpointSecurity = getModelEndpointSecurity(runtimeSettings.baseUrl);
  const endpointSecurityWarning = modelEndpointSecurityMessage(endpointSecurity);
  const needsApiKey = modelEndpointNeedsApiKey(runtimeSettings.baseUrl);
  const hasDocumentText = Boolean(documentText.trim());
  const activePresetId = getMatchingModelProviderPresetId(runtimeSettings);
  const preparedModelDocument = prepareModelDocumentText(documentText);
  const modelDocumentScope = formatModelDocumentScope(preparedModelDocument);
  const modelSendBlockedReason = getModelSendBlockedReason(
    hasDocumentText,
    endpointSecurityWarning,
    needsApiKey,
    runtimeSettings.apiKey
  );

  function update(partial: Partial<ModelAnalyzerSettings>) {
    onChange({ ...settings, ...partial });
  }

  function applyPreset(presetId: ModelProviderPresetId) {
    onChange(applyModelProviderPreset(settings, presetId));
  }

  return (
    <section className="model-settings" aria-label="AI 增强分析设置">
      <label className="mode-toggle">
        <span>
          <BrainCircuit aria-hidden="true" />
          AI 增强分析
        </span>
        <input
          type="checkbox"
          aria-label="启用 AI 增强分析"
          checked={settings.enabled}
          onChange={(event) => update({ enabled: event.target.checked })}
        />
      </label>

      {settings.enabled ? (
        <div className="model-settings-body">
          <div className="model-provider-presets" aria-label="AI 模型服务预设">
            {modelProviderPresets.map((preset) => (
              <button
                key={preset.id}
                className={activePresetId === preset.id ? "active" : undefined}
                type="button"
                aria-pressed={activePresetId === preset.id}
                onClick={() => applyPreset(preset.id)}
              >
                <span>{preset.label}</span>
                <small>{preset.description}</small>
              </button>
            ))}
          </div>

          <label className="field compact-field">
            <span>模型服务地址（OpenAI 兼容 endpoint）</span>
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
            <span>API key（密钥）</span>
            <input
              type="password"
              value={settings.apiKey}
              onChange={(event) => update({ apiKey: event.target.value })}
              placeholder="默认不持久保存"
              autoComplete="off"
              aria-describedby="model-key-retention-status"
            />
          </label>

          <div className="model-connection-test" aria-busy={isTestingModelConnection}>
            <button type="button" onClick={onTestModelConnection} disabled={isTestingModelConnection}>
              <PlugZap aria-hidden="true" />
              {isTestingModelConnection ? "正在测试连接..." : "测试模型连接"}
            </button>
            {isTestingModelConnection ? (
              <button className="cancel-model-connection-test" type="button" onClick={onCancelModelConnectionTest}>
                <Square aria-hidden="true" />
                取消连接测试
              </button>
            ) : null}
            {isTestingModelConnection ? (
              <span className="sr-only" role="status" aria-live="polite" aria-atomic="true">
                正在测试模型连接。
              </span>
            ) : null}
            {modelConnectionStatus ? (
              <p
                className={`model-connection-status ${modelConnectionStatus.tone}`}
                role={modelConnectionStatus.tone === "error" ? "alert" : "status"}
                aria-live={modelConnectionStatus.tone === "error" ? "assertive" : "polite"}
              >
                {modelConnectionStatus.message}
              </p>
            ) : null}
          </div>

          <label className="mode-toggle key-retention-toggle">
            <span>
              <KeyRound aria-hidden="true" />
              记住 API key
            </span>
            <input
              type="checkbox"
              aria-label="记住 API key 到本机浏览器"
              checked={settings.rememberApiKey}
              onChange={(event) => update({ rememberApiKey: event.target.checked })}
            />
          </label>
          <p className="model-key-retention-status" id="model-key-retention-status">
            {getModelKeyRetentionStatus(settings.rememberApiKey, settings.apiKey)}
          </p>

          <div className="model-text-scope" aria-label="AI 发送范围">
            <div>
              <FileText aria-hidden="true" />
              <strong>授权发送前可确认这次模型会看到的正文范围。</strong>
            </div>
            <p>{modelDocumentScope}</p>
            <details className="model-text-preview">
              <summary>查看将发送的正文预览</summary>
              <textarea aria-label="AI 将收到的正文预览" readOnly value={preparedModelDocument.text} />
            </details>
          </div>

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
              aria-label="确认本次允许发送正文给模型服务"
              aria-describedby={modelSendBlockedReason ? "model-send-blocked-reason" : undefined}
              checked={modelTextConsent}
              disabled={!hasDocumentText || (needsApiKey && !runtimeSettings.apiKey.trim()) || !endpointSecurity.ok}
              onChange={(event) => onModelTextConsentChange(event.target.checked)}
            />
          </label>
          {modelSendBlockedReason ? (
            <p className="model-send-blocked-reason" id="model-send-blocked-reason">
              {modelSendBlockedReason}
            </p>
          ) : null}

          <button className="clear-settings-button" type="button" onClick={onClear}>
            <Trash2 aria-hidden="true" />
            清除模型设置
          </button>

          <p className="model-warning">
            只有勾选本次发送确认后，待分析文本才会发送到你配置的模型服务。更换正文、样例、文件或模型端点后会自动取消确认。
            {needsApiKey
              ? "远程模型端点仍需要 API key；API key 默认只保存在当前页面会话，勾选“记住 API key”后才会写入本机浏览器。"
              : "本机模型端点可不填写 API key；如果本机服务要求鉴权，仍可在这里填写。"}
          </p>
        </div>
      ) : null}
    </section>
  );
}

function getModelSendBlockedReason(
  hasDocumentText: boolean,
  endpointSecurityWarning: string,
  needsApiKey: boolean,
  apiKey: string
): string {
  if (!hasDocumentText) {
    return "粘贴、上传或选择样例正文后才能确认发送给模型服务。";
  }
  if (endpointSecurityWarning) {
    return "修正模型 endpoint 后才能确认发送正文。";
  }
  if (needsApiKey && !apiKey.trim()) {
    return "填写 API key 后才能确认发送正文给远程模型服务。";
  }
  return "";
}

function getModelKeyRetentionStatus(rememberApiKey: boolean, apiKey: string): string {
  if (!rememberApiKey) {
    return "API key 仅保留在当前页面会话，刷新页面后需要重新填写。";
  }
  if (!apiKey.trim()) {
    return "已开启记住 API key；填写 API key 后才会写入本机浏览器。";
  }
  return "API key 会保存在本机浏览器；清除模型设置或取消勾选后会从持久化设置中移除。";
}
