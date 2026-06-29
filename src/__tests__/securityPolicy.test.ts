import { describe, expect, it } from "vitest";
import readme from "../../README.md?raw";
import securityPolicy from "../../SECURITY.md?raw";

describe("security policy", () => {
  it("documents the current AI and local data boundaries", () => {
    expect(securityPolicy).toContain("AI-enhanced mode is optional");
    expect(securityPolicy).toContain("本次允许发送正文给模型服务");
    expect(securityPolicy).toContain("Remote model endpoints must use HTTPS");
    expect(securityPolicy).toContain("session-only by default");
    expect(securityPolicy).toContain("localStorage");
    expect(securityPolicy).toContain("does not store original document text or evidence snippets");
    expect(securityPolicy).toContain("The local data reset action clears the visible document text");
    expect(securityPolicy).toContain("Offline app caching stores PlainDoc application files");
    expect(securityPolicy).toContain("beginning and ending portions");
    expect(securityPolicy).toContain("untrusted content");
    expect(securityPolicy).toContain("local redacted copy");
    expect(securityPolicy).toContain("Local model endpoints can be used without an API key");
    expect(securityPolicy).toContain("remote model endpoints still require an API key");
  });

  it("is discoverable from the README", () => {
    expect(readme).toContain("[SECURITY.md](SECURITY.md)");
  });

  it("keeps the README aligned with the implemented AI sending scope", () => {
    expect(readme).toContain("beginning and ending portions");
    expect(readme).toContain("untrusted document content");
    expect(readme).toContain("本机 Ollama 可不填 API key");
    expect(readme).toContain("远程模型仍需要 API key");
    expect(readme).not.toContain("only received the front section");
    expect(readme).not.toContain("first 12,000 characters");
  });
});
