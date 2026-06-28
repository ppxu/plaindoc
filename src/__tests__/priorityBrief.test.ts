import { describe, expect, it } from "vitest";
import { analyzeDocument } from "../analyzer/localAnalyzer";
import { documentExamples } from "../data/examples";
import { getPriorityFindings, priorityBriefToText } from "../export/priorityBrief";

describe("priority brief", () => {
  it("prioritizes red findings before yellow reminders", () => {
    const example = documentExamples.find((item) => item.kind === "rental");
    const report = analyzeDocument({ text: example?.content ?? "", kind: "rental" });
    const priorityFindings = getPriorityFindings(report.findings);

    expect(priorityFindings).toHaveLength(3);
    expect(priorityFindings.every((finding) => finding.severity === "red")).toBe(true);
    expect(priorityFindings[0]?.title).toBe("提前退租成本可能偏高");
  });

  it("exports a copyable negotiation brief", () => {
    const example = documentExamples.find((item) => item.kind === "insurance");
    const report = analyzeDocument({ text: example?.content ?? "", kind: "insurance" });
    const text = priorityBriefToText(report);

    expect(text).toContain("【红色风险】等待期和既往症免责范围较宽");
    expect(text).toContain("为什么重要");
    expect(text).toContain("建议动作");
    expect(text).toContain("建议改法");
  });
});
