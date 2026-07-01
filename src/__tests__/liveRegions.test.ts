import { describe, expect, it } from "vitest";
import documentInputSource from "../components/DocumentInput.tsx?raw";
import reportPanelSource from "../components/ReportPanel.tsx?raw";

describe("live regions", () => {
  it("announces input errors, notices, and busy state to assistive technology", () => {
    expect(documentInputSource).toContain('aria-busy={isAnalyzing || isUploading}');
    expect(documentInputSource).toContain('role="alert"');
    expect(documentInputSource).toContain('aria-live="assertive"');
    expect(documentInputSource).toContain('role="status"');
    expect(documentInputSource).toContain('aria-live="polite"');
  });

  it("announces report refreshes without moving focus", () => {
    expect(reportPanelSource).toContain('aria-live="polite"');
    expect(reportPanelSource).toContain('aria-atomic="true"');
    expect(reportPanelSource).toContain('role="status"');
  });

  it("announces report notices as polite status updates", () => {
    expect(reportPanelSource).toContain("report.notice");
    expect(reportPanelSource).toContain('<p className="report-notice" role="status" aria-live="polite">');
  });
});
