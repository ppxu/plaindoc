import { describe, expect, it } from "vitest";
import { canSendDocumentTextToModel, shouldRevokeModelTextConsent } from "../state/modelTextConsent";
import type { ModelAnalyzerSettings } from "../types";

const baseSettings: ModelAnalyzerSettings = {
  enabled: true,
  baseUrl: "https://api.example.com/v1",
  model: "reader-model",
  apiKey: "secret",
  rememberApiKey: false
};

describe("model text consent", () => {
  it("allows model calls only after AI is enabled, an API key exists, and the user has confirmed text sending", () => {
    expect(canSendDocumentTextToModel(baseSettings, true)).toBe(true);
    expect(canSendDocumentTextToModel(baseSettings, false)).toBe(false);
    expect(canSendDocumentTextToModel({ ...baseSettings, enabled: false }, true)).toBe(false);
    expect(canSendDocumentTextToModel({ ...baseSettings, apiKey: " " }, true)).toBe(false);
    expect(canSendDocumentTextToModel({ ...baseSettings, baseUrl: "http://example.com/v1" }, true)).toBe(false);
    expect(canSendDocumentTextToModel({ ...baseSettings, baseUrl: "http://localhost:11434/v1" }, true)).toBe(true);
  });

  it("revokes confirmation when the model destination or credential changes", () => {
    expect(shouldRevokeModelTextConsent(baseSettings, { ...baseSettings, baseUrl: "https://other.example.com/v1" })).toBe(true);
    expect(shouldRevokeModelTextConsent(baseSettings, { ...baseSettings, model: "other-model" })).toBe(true);
    expect(shouldRevokeModelTextConsent(baseSettings, { ...baseSettings, apiKey: "new-secret" })).toBe(true);
    expect(shouldRevokeModelTextConsent(baseSettings, { ...baseSettings, enabled: false })).toBe(true);
  });

  it("keeps confirmation when only the local key-retention preference changes", () => {
    expect(shouldRevokeModelTextConsent(baseSettings, { ...baseSettings, rememberApiKey: true })).toBe(false);
  });
});
