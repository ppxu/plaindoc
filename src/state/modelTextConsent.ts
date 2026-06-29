import type { ModelAnalyzerSettings } from "../types";
import { getModelEndpointSecurity } from "../analyzer/modelEndpointSecurity";

export function canSendDocumentTextToModel(settings: ModelAnalyzerSettings, hasConsent: boolean): boolean {
  return settings.enabled && Boolean(settings.apiKey.trim()) && getModelEndpointSecurity(settings.baseUrl).ok && hasConsent;
}

export function shouldRevokeModelTextConsent(previous: ModelAnalyzerSettings, next: ModelAnalyzerSettings): boolean {
  return (
    previous.enabled !== next.enabled ||
    previous.baseUrl.trim() !== next.baseUrl.trim() ||
    previous.model.trim() !== next.model.trim() ||
    previous.apiKey !== next.apiKey
  );
}
