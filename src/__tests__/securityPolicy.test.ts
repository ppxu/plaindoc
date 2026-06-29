import { describe, expect, it } from "vitest";
import readme from "../../README.md?raw";
import securityPolicy from "../../SECURITY.md?raw";

describe("security policy", () => {
  it("documents the current AI and local data boundaries", () => {
    expect(securityPolicy).toContain("AI-enhanced mode is optional");
    expect(securityPolicy).toContain("本次允许发送正文给模型服务");
    expect(securityPolicy).toContain("session-only by default");
    expect(securityPolicy).toContain("localStorage");
    expect(securityPolicy).toContain("does not store original document text or evidence snippets");
    expect(securityPolicy).toContain("first 12,000 characters");
    expect(securityPolicy).toContain("local redacted copy");
  });

  it("is discoverable from the README", () => {
    expect(readme).toContain("[SECURITY.md](SECURITY.md)");
  });
});
