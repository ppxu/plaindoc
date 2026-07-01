import { describe, expect, it } from "vitest";
import reportPanelSource from "../components/ReportPanel.tsx?raw";

describe("report markdown download chrome", () => {
  it("shows download success and failure feedback", () => {
    expect(reportPanelSource).toContain("downloadMarkdownFile");
    expect(reportPanelSource).toContain("downloadReportState");
    expect(reportPanelSource).toContain("已导出");
    expect(reportPanelSource).toContain("导出失败");
    expect(reportPanelSource).toContain("浏览器没有允许自动下载");
    expect(reportPanelSource).toContain('aria-label="完整 Markdown 报告，可手动保存"');
  });

  it("announces print failures as an actionable alert", () => {
    const printFailureStart = reportPanelSource.indexOf('printState === "failed"');
    const printFailureBranch = reportPanelSource.slice(
      printFailureStart,
      reportPanelSource.indexOf('downloadReportState === "failed"', printFailureStart)
    );

    expect(printFailureBranch).toContain("当前浏览器不支持自动打开打印窗口，请使用浏览器菜单打印。");
    expect(printFailureBranch).toContain('role="alert"');
    expect(printFailureBranch).toContain('aria-live="assertive"');
  });

  it("focuses and selects fallback markdown text when browser copy or download is blocked", () => {
    expect(reportPanelSource).toContain("selectFallbackText");
    expect(reportPanelSource).toContain("copyFallbackRef");
    expect(reportPanelSource).toContain("downloadFallbackRef");
    expect(reportPanelSource).toContain('copyReportState === "failed"');
    expect(reportPanelSource).toContain('downloadReportState === "failed"');
    expect(reportPanelSource).toContain(".focus()");
    expect(reportPanelSource).toContain(".select()");
    expect(reportPanelSource).toContain("setSelectionRange(0, textarea.value.length)");
  });

  it("announces report copy and download fallback controls as assertive alerts", () => {
    const fallbackContainers = [...reportPanelSource.matchAll(/<div className="report-copy-fallback"[^>]*>/g)].map(
      ([match]) => match
    );
    const fallbackAlertMessages = [
      ...reportPanelSource.matchAll(/<span className="report-copy-fallback-message" role="alert" aria-live="assertive">/g)
    ].map(([match]) => match);

    expect(reportPanelSource).toContain("浏览器没有允许自动下载。可以复制完整 Markdown 报告后手动保存为 .md 文件。");
    expect(reportPanelSource).toContain("浏览器没有允许自动复制。可以在这里手动全选复制完整报告。");
    expect(fallbackContainers).toHaveLength(2);
    expect(fallbackContainers).toEqual(['<div className="report-copy-fallback">', '<div className="report-copy-fallback">']);
    expect(fallbackAlertMessages).toHaveLength(2);
  });

  it("announces successful report copy and markdown export as polite status updates", () => {
    expect(reportPanelSource).toContain("reportShareStatusText");
    expect(reportPanelSource).toContain('<span className="sr-only" role="status" aria-live="polite" aria-atomic="true">');
    expect(reportPanelSource).toContain("报告已复制到剪贴板。");
    expect(reportPanelSource).toContain("Markdown 报告已导出。");
  });
});
