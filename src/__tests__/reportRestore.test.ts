import { describe, expect, it } from "vitest";
import { analyzeDocument } from "../analyzer/localAnalyzer";
import { restoreSavedReport } from "../history/reportRestore";
import type { SavedReport } from "../types";

describe("report restore", () => {
  it("restores the saved report while clearing the editor text", () => {
    const report = analyzeDocument({
      text: "押金 5000 元，提前退租需赔偿两个月租金，甲方可单方解释合同条款。",
      kind: "rental"
    });
    const saved: SavedReport = {
      id: "saved-1",
      title: "租房合同 · 不建议直接签 · 45 分",
      createdAt: "2026-06-28T00:00:00.000Z",
      report
    };

    const restored = restoreSavedReport(saved);

    expect(restored.report).toBe(report);
    expect(restored.kind).toBe("rental");
    expect(restored.text).toBe("");
    expect(restored.selectedExampleId).toBe("");
    expect(restored.error).toBe("");
    expect(restored.notice).toContain("正文框已清空");
    expect(restored.notice).toContain("历史不保存原始正文");
    expect(restored.notice).toContain("证据片段");
  });
});
