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
});
