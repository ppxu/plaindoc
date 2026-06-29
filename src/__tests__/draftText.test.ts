import { describe, expect, it } from "vitest";
import { documentExamples } from "../data/examples";
import { createDraftTextState } from "../state/draftText";

describe("draft text state", () => {
  it("refreshes the local report when a user pastes recognizable text", () => {
    const text = documentExamples.find((example) => example.id === "employment-sales-bonus")?.content ?? "";

    const state = createDraftTextState({ text, selectedKind: "unknown" });

    expect(state.text).toBe(text);
    expect(state.kind).toBe("employment");
    expect(state.selectedExampleId).toBe("");
    expect(state.report.documentKind).toBe("employment");
    expect(state.report.findings.some((finding) => finding.id === "employment-non-compete-vague-compensation")).toBe(true);
    expect(state.error).toBe("");
    expect(state.notice).toContain("正文已更新");
    expect(state.notice).toContain("已自动识别为劳动协议");
    expect(state.evidenceSelection).toBeNull();
    expect(state.modelTextConsent).toBe(false);
  });

  it("keeps an empty draft aligned with an empty local report", () => {
    const state = createDraftTextState({ text: "", selectedKind: "loan" });

    expect(state.kind).toBe("loan");
    expect(state.report.documentKind).toBe("loan");
    expect(state.report.wordCount).toBe(0);
    expect(state.report.findings).toEqual([]);
    expect(state.notice).toBe("");
  });
});
