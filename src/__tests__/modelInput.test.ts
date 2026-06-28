import { describe, expect, it } from "vitest";
import { analyzeDocument } from "../analyzer/localAnalyzer";
import { MAX_MODEL_DOCUMENT_CHARS, prepareModelBaseline, prepareModelDocumentText } from "../analyzer/modelInput";

describe("prepareModelDocumentText", () => {
  it("keeps short document text unchanged", () => {
    const prepared = prepareModelDocumentText("普通合同正文");

    expect(prepared.text).toBe("普通合同正文");
    expect(prepared.originalLength).toBe(6);
    expect(prepared.sentLength).toBe(6);
    expect(prepared.truncated).toBe(false);
  });

  it("truncates long document text and exposes the sent range", () => {
    const text = "条".repeat(MAX_MODEL_DOCUMENT_CHARS + 25);
    const prepared = prepareModelDocumentText(text);

    expect(prepared.text).toHaveLength(MAX_MODEL_DOCUMENT_CHARS);
    expect(prepared.originalLength).toBe(MAX_MODEL_DOCUMENT_CHARS + 25);
    expect(prepared.sentLength).toBe(MAX_MODEL_DOCUMENT_CHARS);
    expect(prepared.truncated).toBe(true);
  });

  it("removes evidence snippets from the local baseline sent to a model", () => {
    const report = analyzeDocument({
      text: "押金 5000 元，甲方可自行扣除押金和维修费，提前退租需赔偿两个月租金。",
      kind: "rental"
    });
    const preparedDocument = prepareModelDocumentText("合同正文");
    const baseline = prepareModelBaseline(report, preparedDocument);
    const serialized = JSON.stringify(baseline);

    expect(report.findings.some((finding) => finding.evidence?.text)).toBe(true);
    expect(serialized).not.toContain("甲方可自行扣除押金和维修费");
    expect(serialized).not.toContain("\"evidence\"");
    expect(serialized).toContain("rental-broad-deposit-deduction");
  });
});
