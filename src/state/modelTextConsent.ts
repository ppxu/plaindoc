import type { ModelAnalyzerSettings } from "../types";

export function canSendDocumentTextToModel(settings: ModelAnalyzerSettings, hasConsent: boolean): boolean {
  return settings.enabled && Boolean(settings.apiKey.trim()) && hasConsent;
}

export function shouldRevokeModelTextConsent(previous: ModelAnalyzerSettings, next: ModelAnalyzerSettings): boolean {
  return (
    previous.enabled !== next.enabled ||
    previous.baseUrl.trim() !== next.baseUrl.trim() ||
    previous.model.trim() !== next.model.trim() ||
    previous.apiKey !== next.apiKey
  );
}
