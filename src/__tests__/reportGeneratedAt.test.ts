import { describe, expect, it } from "vitest";
import reportPanelSource from "../components/ReportPanel.tsx?raw";
import { formatReportGeneratedAt } from "../report/generatedAt";

describe("report generated time", () => {
  it("formats report generated time for visible report metadata", () => {
    const formatted = formatReportGeneratedAt("2026-07-01T12:00:00.000Z");

    expect(formatted).toContain("2026");
    expect(formatted).toContain("07");
    expect(formatted).toContain("01");
  });

  it("falls back when report generated time is invalid", () => {
    expect(formatReportGeneratedAt("not-a-date")).toBe("生成时间未知");
  });

  it("renders generated time in the report summary metadata", () => {
    expect(reportPanelSource).toContain("formatReportGeneratedAt(report.generatedAt)");
    expect(reportPanelSource).toContain("生成时间");
  });
});
