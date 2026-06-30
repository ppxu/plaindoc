import { describe, expect, it } from "vitest";
import appSource from "../App.tsx?raw";

describe("analysis feedback chrome", () => {
  it("shows short-text analysis feedback as a non-blocking notice", () => {
    const analyzeHandler = appSource.slice(appSource.indexOf("async function handleAnalyze"), appSource.indexOf("function handleSelectHistory"));

    expect(analyzeHandler).toContain('const shortTextNotice = text.trim().length < 80 ? "文本较短，报告可能不完整。你仍然可以继续生成。" : "";');
    expect(analyzeHandler).toContain("setError(\"\");");
    expect(analyzeHandler).toContain("setInputNotice(mergeNotices(shortTextNotice, resolvedKind.notice));");
    expect(analyzeHandler).not.toContain('setError("文本较短，报告可能不完整。你仍然可以继续生成。")');
  });
});
