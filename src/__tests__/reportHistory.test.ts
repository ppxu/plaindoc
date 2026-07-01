import { describe, expect, it } from "vitest";
import { analyzeDocument } from "../analyzer/localAnalyzer";
import { clearReportHistory, loadReportHistory, saveReportToHistory } from "../history/reportHistory";

describe("report history", () => {
  it("saves reports newest first and clears them", () => {
    const storage = createMemoryStorage();
    const first = analyzeDocument({ text: "押金 5000 元，提前退租需赔偿两个月租金。", kind: "rental" });
    const second = analyzeDocument({ text: "竞业限制期限两年，补偿另行协商。", kind: "employment" });

    saveReportToHistory(first, storage);
    const saved = saveReportToHistory(second, storage);

    expect(saved).toHaveLength(2);
    expect(saved[0].report.documentKind).toBe("employment");
    expect(saved[1].report.documentKind).toBe("rental");
    expect(loadReportHistory(storage)).toHaveLength(2);

    expect(clearReportHistory(storage)).toEqual([]);
    expect(loadReportHistory(storage)).toEqual([]);
  });

  it("deduplicates repeated saves of the same report", () => {
    const storage = createMemoryStorage();
    const report = analyzeDocument({ text: "装修款分三期支付，验收后支付尾款。", kind: "renovation" });

    for (let index = 0; index < 10; index += 1) {
      saveReportToHistory(report, storage);
    }

    expect(loadReportHistory(storage)).toHaveLength(1);
  });

  it("includes the analysis source in saved report titles", () => {
    const storage = createMemoryStorage();
    const localReport = analyzeDocument({ text: "押金 5000 元，提前退租需赔偿两个月租金。", kind: "rental" });
    const modelReport = {
      ...localReport,
      source: "model" as const,
      modelName: "gpt-4o-mini"
    };

    const localHistory = saveReportToHistory(localReport, storage);
    const modelHistory = saveReportToHistory(modelReport, storage);

    expect(localHistory[0].title).toContain("本地规则");
    expect(modelHistory[0].title).toContain("AI 增强：gpt-4o-mini");
  });

  it("removes evidence snippets before saving reports to history", () => {
    const storage = createMemoryStorage();
    const report = analyzeDocument({
      text: "押金 5000 元，甲方可自行扣除押金和维修费，提前退租需赔偿两个月租金。",
      kind: "rental"
    });
    expect(report.findings.some((finding) => finding.evidence)).toBe(true);

    const saved = saveReportToHistory(report, storage);

    expect(saved[0].report.findings.every((finding) => finding.evidence === undefined)).toBe(true);
    expect(loadReportHistory(storage)[0].report.findings.every((finding) => finding.evidence === undefined)).toBe(true);
  });

  it("removes evidence snippets from older saved history data while loading", () => {
    const storage = createMemoryStorage();
    const report = analyzeDocument({
      text: "押金 5000 元，甲方可自行扣除押金和维修费，提前退租需赔偿两个月租金。",
      kind: "rental"
    });
    storage.setItem(
      "plaindoc:report-history:v1",
      JSON.stringify([
        {
          id: "old-history",
          title: "租房合同 · 不建议直接签 · 20 分",
          createdAt: "2026-06-28T00:00:00.000Z",
          report
        }
      ])
    );

    const loaded = loadReportHistory(storage);

    expect(loaded).toHaveLength(1);
    expect(loaded[0].report.findings.every((finding) => finding.evidence === undefined)).toBe(true);
  });

  it("refreshes older saved history titles so restored reports keep analysis source context", () => {
    const storage = createMemoryStorage();
    const report = analyzeDocument({
      text: "押金 5000 元，甲方可自行扣除押金和维修费，提前退租需赔偿两个月租金。",
      kind: "rental"
    });
    storage.setItem(
      "plaindoc:report-history:v1",
      JSON.stringify([
        {
          id: "old-history",
          title: "租房合同 · 不建议直接签 · 20 分",
          createdAt: "2026-06-28T00:00:00.000Z",
          report
        }
      ])
    );

    const loaded = loadReportHistory(storage);

    expect(loaded[0].title).toContain("本地规则");
    expect(loaded[0].title).toContain("不建议直接签");
  });

  it("fills missing clarifying questions when loading older saved reports", () => {
    const storage = createMemoryStorage();
    const report = analyzeDocument({
      text: "押金 5000 元，甲方可自行扣除押金和维修费，提前退租需赔偿两个月租金。",
      kind: "rental"
    }) as unknown as Record<string, unknown>;
    delete report.clarifyingQuestions;
    storage.setItem(
      "plaindoc:report-history:v1",
      JSON.stringify([
        {
          id: "old-history",
          title: "旧版报告",
          createdAt: "2026-06-28T00:00:00.000Z",
          report
        }
      ])
    );

    const loaded = loadReportHistory(storage);

    expect(loaded).toHaveLength(1);
    expect(loaded[0].report.clarifyingQuestions).toEqual([]);
  });

  it("limits saved reports and ignores invalid storage data", () => {
    const storage = createMemoryStorage();

    for (let index = 0; index < 10; index += 1) {
      const report = analyzeDocument({
        text: `装修款第 ${index + 1} 版，工程总价 ${120000 + index} 元，签约当日支付总价 60% 作为首期款，验收后支付尾款。`,
        kind: "renovation"
      });
      saveReportToHistory(report, storage);
    }

    expect(loadReportHistory(storage)).toHaveLength(8);

    storage.setItem("plaindoc:report-history:v1", JSON.stringify([{ broken: true }]));
    expect(loadReportHistory(storage)).toEqual([]);
  });

  it("ignores older saved reports that are missing fields required by the report UI", () => {
    const storage = createMemoryStorage();
    storage.setItem(
      "plaindoc:report-history:v1",
      JSON.stringify([
        {
          id: "partial-history",
          title: "旧版报告",
          createdAt: "2026-06-28T00:00:00.000Z",
          report: {
            summary: "旧版报告缺少状态、文件类型和来源字段。",
            score: 64,
            facts: [],
            findings: [],
            checklist: [],
            actionPlan: {
              priority: "medium",
              title: "继续确认",
              steps: [],
              message: "请确认关键条款。"
            },
            plainLanguage: ["请继续确认关键条款。"],
            generatedAt: "2026-06-28T00:00:00.000Z",
            wordCount: 42,
            disclaimer: "PlainDoc 提供文件阅读辅助。"
          }
        }
      ])
    );

    expect(loadReportHistory(storage)).toEqual([]);
  });

  it("keeps the current in-memory history when browser storage writes fail", () => {
    const storage = createFailingStorage({ failSetItem: true, failRemoveItem: true });
    const report = analyzeDocument({ text: "押金 5000 元，提前退租需赔偿两个月租金。", kind: "rental" });

    expect(() => saveReportToHistory(report, storage)).not.toThrow();
    const saved = saveReportToHistory(report, storage);

    expect(saved).toHaveLength(1);
    expect(saved[0].report.documentKind).toBe("rental");
    expect(() => clearReportHistory(storage)).not.toThrow();
    expect(clearReportHistory(storage)).toEqual([]);
  });
});

function createMemoryStorage(): Storage {
  const values = new Map<string, string>();

  return {
    get length() {
      return values.size;
    },
    clear: () => values.clear(),
    getItem: (key: string) => values.get(key) ?? null,
    key: (index: number) => Array.from(values.keys())[index] ?? null,
    removeItem: (key: string) => {
      values.delete(key);
    },
    setItem: (key: string, value: string) => {
      values.set(key, value);
    }
  };
}

function createFailingStorage({
  failSetItem = false,
  failRemoveItem = false
}: {
  failSetItem?: boolean;
  failRemoveItem?: boolean;
}): Storage {
  const storage = createMemoryStorage();
  return {
    ...storage,
    removeItem: (key: string) => {
      if (failRemoveItem) {
        throw new Error("remove blocked");
      }
      storage.removeItem(key);
    },
    setItem: (key: string, value: string) => {
      if (failSetItem) {
        throw new Error("quota exceeded");
      }
      storage.setItem(key, value);
    }
  };
}
