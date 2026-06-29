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

  it("keeps both the beginning and ending of long documents for model analysis", () => {
    const text = [
      "开头条款：租金为 6800 元，押金为 13600 元。",
      "中间普通条款。".repeat(MAX_MODEL_DOCUMENT_CHARS),
      "尾部条款：提前解除需赔偿 30000 元，并以书面通知为准。"
    ].join("\n");
    const prepared = prepareModelDocumentText(text);

    expect(prepared.text.length).toBeLessThanOrEqual(MAX_MODEL_DOCUMENT_CHARS);
    expect(prepared.text).toContain("开头条款");
    expect(prepared.text).toContain("尾部条款");
    expect(prepared.text).toContain("中间部分已省略");
    expect(prepared.sentRanges).toEqual([
      { start: 0, end: expect.any(Number) },
      { start: expect.any(Number), end: text.length }
    ]);
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

  it("only sends fact values whose evidence remains in the prepared model text", () => {
    const text = [
      "开头条款：押金 6800 元。",
      "中间条款。".repeat(MAX_MODEL_DOCUMENT_CHARS),
      "中段费用为 9999 元。",
      "更多中间条款。".repeat(MAX_MODEL_DOCUMENT_CHARS),
      "尾部条款：提前解除需赔偿 30000 元。"
    ].join("\n");
    const report = analyzeDocument({ text, kind: "rental" });
    const preparedDocument = prepareModelDocumentText(text);
    const baseline = prepareModelBaseline(report, preparedDocument);
    const serialized = JSON.stringify(baseline);

    expect(serialized).toContain("6800 元");
    expect(serialized).toContain("30000 元");
    expect(serialized).not.toContain("9999 元");
  });
});
