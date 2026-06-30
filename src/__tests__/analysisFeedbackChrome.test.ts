import { describe, expect, it } from "vitest";
import appSource from "../App.tsx?raw";

describe("analysis feedback chrome", () => {
  it("clears stale notices when analysis is blocked by empty text", () => {
    const analyzeHandler = appSource.slice(appSource.indexOf("async function handleAnalyze"), appSource.indexOf("function handleSelectHistory"));
    const emptyTextBranch = analyzeHandler.slice(analyzeHandler.indexOf("if (!text.trim())"), analyzeHandler.indexOf("const shortTextNotice"));

    expect(emptyTextBranch).toContain('setError("请先粘贴文件内容、选择样例或上传文本文件。");');
    expect(emptyTextBranch).toContain('setInputNotice("");');
  });

  it("shows short-text analysis feedback as a non-blocking notice", () => {
    const analyzeHandler = appSource.slice(appSource.indexOf("async function handleAnalyze"), appSource.indexOf("function handleSelectHistory"));

    expect(analyzeHandler).toContain('const shortTextNotice = text.trim().length < 80 ? "文本较短，报告可能不完整。你仍然可以继续生成。" : "";');
    expect(analyzeHandler).toContain("setError(\"\");");
    expect(analyzeHandler).toContain("const baseAnalysisNotice = mergeNotices(shortTextNotice, resolvedKind.notice);");
    expect(analyzeHandler).toContain("setInputNotice(baseAnalysisNotice);");
    expect(analyzeHandler).not.toContain('setError("文本较短，报告可能不完整。你仍然可以继续生成。")');
  });

  it("keeps analysis context when AI enhanced analysis falls back to local results", () => {
    const analyzeHandler = appSource.slice(appSource.indexOf("async function handleAnalyze"), appSource.indexOf("function handleSelectHistory"));

    expect(analyzeHandler).toContain("setInputNotice(mergeNotices(baseAnalysisNotice, modelEndpointSecurityMessage(endpointSecurity)));");
    expect(analyzeHandler).toContain('setInputNotice(mergeNotices(baseAnalysisNotice, "AI 增强已开启，但缺少 API key，本次仅使用本地规则分析。"));');
    expect(analyzeHandler).toContain(
      'setInputNotice(mergeNotices(baseAnalysisNotice, "未确认发送正文给模型服务，本次仅使用本地规则分析。勾选 AI 发送确认后可生成增强清单。"));'
    );
  });

  it("keeps analysis context in the report notice after model success or failure", () => {
    const analyzeHandler = appSource.slice(appSource.indexOf("async function handleAnalyze"), appSource.indexOf("function handleSelectHistory"));

    expect(analyzeHandler).toContain("const reportWithMergedNotice = mergeReportNotice(modelReport, baseAnalysisNotice);");
    expect(analyzeHandler).toContain("setReport(reportWithMergedNotice);");
    expect(analyzeHandler).toContain("setHistory(saveReportToHistory(reportWithMergedNotice));");
    expect(analyzeHandler).toContain("notice: mergeNotices(baseAnalysisNotice, `AI 增强失败，已回退到本地规则分析：${message}`)");
    expect(appSource).toContain("function mergeReportNotice");
  });
});
