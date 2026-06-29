import { describe, expect, it } from "vitest";
import { documentExamples } from "../data/examples";
import { createExampleSelectionState } from "../state/exampleSelection";

describe("example selection", () => {
  it("creates a fresh local report for the selected example", () => {
    const example = documentExamples.find((item) => item.id === "insurance-critical-illness");
    expect(example).toBeDefined();

    const state = createExampleSelectionState(example!);

    expect(state.text).toBe(example!.content);
    expect(state.kind).toBe("insurance");
    expect(state.selectedExampleId).toBe(example!.id);
    expect(state.report.documentKind).toBe("insurance");
    expect(state.report.summary).toContain("保险文件");
    expect(state.report.findings.some((finding) => finding.id === "insurance-broad-waiting-period-exclusion")).toBe(true);
    expect(state.error).toBe("");
    expect(state.notice).toBe("已加载「重疾保险条款样例」，并生成本地规则报告。");
    expect(state.evidenceSelection).toBeNull();
    expect(state.modelTextConsent).toBe(false);
  });
});
