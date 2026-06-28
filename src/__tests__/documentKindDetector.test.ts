import { describe, expect, it } from "vitest";
import { detectDocumentKind } from "../analyzer/documentKindDetector";
import { documentExamples } from "../data/examples";

describe("detectDocumentKind", () => {
  it("detects every bundled example kind", () => {
    documentExamples.forEach((example) => {
      const detection = detectDocumentKind(example.content);

      expect(detection.kind).toBe(example.kind);
      expect(detection.confidence).not.toBe("low");
      expect(detection.matchedTerms.length).toBeGreaterThan(0);
    });
  });

  it("keeps short or generic text as unknown", () => {
    const detection = detectDocumentKind("甲方和乙方确认本文件内容，双方签字后生效。");

    expect(detection.kind).toBe("unknown");
    expect(detection.confidence).toBe("low");
    expect(detection.matchedTerms).toEqual([]);
  });
});
