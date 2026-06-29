import { describe, expect, it } from "vitest";
import { getModelEndpointSecurity } from "../analyzer/modelEndpointSecurity";

describe("model endpoint security", () => {
  it("allows HTTPS model endpoints", () => {
    expect(getModelEndpointSecurity("https://api.openai.com/v1")).toEqual({ ok: true });
  });

  it("allows HTTP only for local model endpoints", () => {
    expect(getModelEndpointSecurity("http://localhost:11434/v1")).toEqual({ ok: true });
    expect(getModelEndpointSecurity("http://127.0.0.1:11434/v1")).toEqual({ ok: true });
    expect(getModelEndpointSecurity("http://[::1]:11434/v1")).toEqual({ ok: true });
  });

  it("blocks insecure remote HTTP endpoints", () => {
    expect(getModelEndpointSecurity("http://example.com/v1")).toEqual({
      ok: false,
      reason: "insecure_remote_http"
    });
  });

  it("blocks invalid endpoint URLs", () => {
    expect(getModelEndpointSecurity("not a url")).toEqual({
      ok: false,
      reason: "invalid_url"
    });
  });
});
