import { describe, expect, it } from "vitest";
import { MAX_MODEL_DOCUMENT_CHARS, prepareModelDocumentText } from "../analyzer/modelInput";

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
});
