import { describe, expect, it } from "vitest";
import { createClearedWorkspaceState } from "../state/workspaceReset";

describe("createClearedWorkspaceState", () => {
  it("clears sensitive current document state without implying history or model settings are removed", () => {
    const state = createClearedWorkspaceState();

    expect(state.text).toBe("");
    expect(state.kind).toBe("unknown");
    expect(state.selectedExampleId).toBe("");
    expect(state.error).toBe("");
    expect(state.evidenceSelection).toBeNull();
    expect(state.notice).toContain("历史和模型设置未受影响");
    expect(state.report.wordCount).toBe(0);
    expect(state.report.findings).toEqual([]);
    expect(state.report.facts).toEqual([]);
    expect(state.report.checklist).toEqual([]);
    expect(state.report.documentKind).toBe("unknown");
    expect(state.report.summary).toContain("请先");
  });
});
