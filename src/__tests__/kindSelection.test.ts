import { describe, expect, it } from "vitest";
import { documentExamples } from "../data/examples";
import { createKindSelectionState } from "../state/kindSelection";

describe("kind selection state", () => {
  it("refreshes the local report when the user manually changes document kind", () => {
    const text = documentExamples.find((example) => example.id === "loan-device-installment")?.content ?? "";

    const state = createKindSelectionState({
      text,
      nextKind: "loan"
    });

    expect(state.text).toBe(text);
    expect(state.kind).toBe("loan");
    expect(state.selectedExampleId).toBe("");
    expect(state.report.documentKind).toBe("loan");
    expect(state.report.findings.some((finding) => finding.id === "loan-fees-deducted-from-principal")).toBe(true);
    expect(state.error).toBe("");
    expect(state.notice).toBe("已按借款/贷款合同重新生成本地规则报告。");
    expect(state.evidenceSelection).toBeNull();
    expect(state.modelTextConsent).toBe(false);
  });

  it("keeps an empty editor aligned with the selected document kind", () => {
    const state = createKindSelectionState({
      text: "",
      nextKind: "insurance"
    });

    expect(state.kind).toBe("insurance");
    expect(state.report.documentKind).toBe("insurance");
    expect(state.report.wordCount).toBe(0);
    expect(state.report.findings).toEqual([]);
    expect(state.notice).toBe("");
  });
});
