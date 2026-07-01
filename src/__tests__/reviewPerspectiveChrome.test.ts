import { describe, expect, it } from "vitest";
import appSource from "../App.tsx?raw";
import documentInputSource from "../components/DocumentInput.tsx?raw";
import reportPanelSource from "../components/ReportPanel.tsx?raw";

describe("review perspective chrome", () => {
  it("lets users choose the side they want PlainDoc to review from", () => {
    expect(documentInputSource).toContain("审阅视角");
    expect(documentInputSource).toContain("getReviewPerspectiveOptions(kind)");
    expect(documentInputSource).toContain("onPerspectiveChange");
  });

  it("refreshes reports when the review perspective changes", () => {
    expect(appSource).toContain("handlePerspectiveChange");
    expect(appSource).toContain("setModelTextConsent(false)");
    expect(appSource).toContain("已切换为");
  });

  it("shows the active review perspective in report metadata", () => {
    expect(reportPanelSource).toContain("审阅视角");
    expect(reportPanelSource).toContain("getReviewPerspectiveLabel(report.documentKind, report.reviewPerspective)");
  });
});
