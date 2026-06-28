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
