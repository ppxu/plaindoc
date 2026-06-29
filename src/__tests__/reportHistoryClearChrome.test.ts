import { describe, expect, it } from "vitest";
import appSource from "../App.tsx?raw";
import reportHistorySource from "../components/ReportHistory.tsx?raw";

describe("report history clearing chrome", () => {
  it("confirms before clearing recent local reports", () => {
    expect(appSource).toContain("handleClearHistory");
    expect(appSource).toContain("confirmReportHistoryClear()");
    expect(appSource).toContain("确定要清空最近报告历史吗？");
    expect(appSource).toContain("不会清空当前正文、当前报告或模型设置");
    expect(appSource).toContain("clearReportHistory()");

    expect(reportHistorySource).toContain("aria-label=\"清空本地报告历史\"");
    expect(reportHistorySource).toContain("onClear");
  });

  it("invalidates any active analysis before clearing saved reports", () => {
    const clearHandlerIndex = appSource.indexOf("function handleClearHistory()");
    const invalidateIndex = appSource.indexOf("invalidateCurrentAnalysis();", clearHandlerIndex);
    const clearHistoryIndex = appSource.indexOf("clearReportHistory()", clearHandlerIndex);

    expect(clearHandlerIndex).toBeGreaterThanOrEqual(0);
    expect(invalidateIndex).toBeGreaterThan(clearHandlerIndex);
    expect(clearHistoryIndex).toBeGreaterThan(clearHandlerIndex);
    expect(invalidateIndex).toBeLessThan(clearHistoryIndex);
  });
});
