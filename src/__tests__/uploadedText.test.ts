import { describe, expect, it } from "vitest";
import { documentExamples } from "../data/examples";
import { createUploadedTextState } from "../state/uploadedText";

describe("uploaded text state", () => {
  it("creates a fresh local report for uploaded text and detected document kind", () => {
    const text = documentExamples.find((example) => example.id === "loan-device-installment")?.content ?? "";

    const state = createUploadedTextState({
      text,
      isPdfUpload: false,
      fallbackKind: "unknown"
    });

    expect(state.text).toBe(text);
    expect(state.kind).toBe("loan");
    expect(state.selectedExampleId).toBe("");
    expect(state.report.documentKind).toBe("loan");
    expect(state.report.findings.some((finding) => finding.id === "loan-fees-deducted-from-principal")).toBe(true);
    expect(state.error).toBe("");
    expect(state.notice).toContain("已读取");
    expect(state.notice).toContain("已自动识别为借款/贷款合同");
    expect(state.notice).toContain("已生成本地规则报告");
    expect(state.evidenceSelection).toBeNull();
    expect(state.modelTextConsent).toBe(false);
  });

  it("keeps the selected fallback kind when uploaded text cannot be detected", () => {
    const text = "双方确认本文件仅用于记录沟通要点，具体事项另行协商。";

    const state = createUploadedTextState({
      text,
      isPdfUpload: true,
      fallbackKind: "rental"
    });

    expect(state.kind).toBe("rental");
    expect(state.report.documentKind).toBe("rental");
    expect(state.notice).toContain("暂未识别出明确文件类型");
    expect(state.notice).toContain("已按租房合同生成本地规则报告");
  });
});
