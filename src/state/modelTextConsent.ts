import type { ModelAnalyzerSettings } from "../types";
import { getModelEndpointSecurity, modelEndpointNeedsApiKey } from "../analyzer/modelEndpointSecurity";
import { normalizeModelSettingsForRuntime } from "../analyzer/modelSettings";

export function canSendDocumentTextToModel(settings: ModelAnalyzerSettings, hasConsent: boolean): boolean {
  const runtimeSettings = normalizeModelSettingsForRuntime(settings);
  return (
    runtimeSettings.enabled &&
    (!modelEndpointNeedsApiKey(runtimeSettings.baseUrl) || Boolean(runtimeSettings.apiKey.trim())) &&
    getModelEndpointSecurity(runtimeSettings.baseUrl).ok &&
    hasConsent
  );
}

export function shouldRevokeModelTextConsent(previous: ModelAnalyzerSettings, next: ModelAnalyzerSettings): boolean {
  return (
    previous.enabled !== next.enabled ||
    previous.baseUrl.trim() !== next.baseUrl.trim() ||
    previous.model.trim() !== next.model.trim() ||
    previous.apiKey !== next.apiKey
  );
}
