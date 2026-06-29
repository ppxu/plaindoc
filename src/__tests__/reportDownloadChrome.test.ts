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
});
