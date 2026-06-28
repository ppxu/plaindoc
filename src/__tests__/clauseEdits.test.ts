import { describe, expect, it } from "vitest";
import { analyzeDocument } from "../analyzer/localAnalyzer";
import { getClauseEdits, clauseEditsToText } from "../export/clauseEdits";

describe("clause edit pack", () => {
  it("collects and formats clause edits from findings", () => {
    const report = analyzeDocument({
      text: "乙方提前退租需承担两个月租金作为违约金，甲方可从押金中直接扣除甲方认为必要的费用。",
      kind: "rental"
    });

    const edits = getClauseEdits(report.findings);
    const text = clauseEditsToText(edits);

    expect(edits.length).toBeGreaterThan(0);
    expect(text).toContain("建议修改条款");
    expect(text).toContain("风险等级");
  });
});
