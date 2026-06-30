import { describe, expect, it } from "vitest";
import appSource from "../App.tsx?raw";
import { analyzeDocument } from "../analyzer/localAnalyzer";
import { documentExamples } from "../data/examples";
import { createCustomExampleSelectionState, createExampleSelectionState } from "../state/exampleSelection";

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

  it("switches back to custom text without clearing the current report", () => {
    const text = "租房合同约定押金 5000 元，提前退租押金不退。";
    const report = analyzeDocument({ text, kind: "rental" });

    const state = createCustomExampleSelectionState({ text, kind: "rental", report });

    expect(state.text).toBe(text);
    expect(state.kind).toBe("rental");
    expect(state.selectedExampleId).toBe("");
    expect(state.report).toBe(report);
    expect(state.error).toBe("");
    expect(state.notice).toBe("已切换为自定义/上传文本，当前正文和报告未改变。");
    expect(state.evidenceSelection).toBeNull();
    expect(state.modelTextConsent).toBe(false);
  });

  it("routes the custom option through the app example selector", () => {
    const exampleChangeHandler = appSource.slice(
      appSource.indexOf("function handleExampleChange"),
      appSource.indexOf("function handleTextChange")
    );

    expect(exampleChangeHandler).toContain('if (!id) {');
    expect(exampleChangeHandler).toContain("createCustomExampleSelectionState({ text, kind, report })");
    expect(exampleChangeHandler).toContain("setSelectedExampleId(selected.selectedExampleId);");
  });
});
