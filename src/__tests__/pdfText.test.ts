import { describe, expect, it } from "vitest";
import { isPdfFile, normalizePdfTextItems } from "../ingest/pdfText";

describe("pdf text helpers", () => {
  it("detects PDF uploads by MIME type or extension", () => {
    expect(isPdfFile(new File([""], "contract.pdf", { type: "application/octet-stream" }))).toBe(true);
    expect(isPdfFile(new File([""], "contract.bin", { type: "application/pdf" }))).toBe(true);
    expect(isPdfFile(new File([""], "contract.txt", { type: "text/plain" }))).toBe(false);
  });

  it("normalizes PDF text items into readable paragraphs", () => {
    const text = normalizePdfTextItems([
      { str: "甲方" },
      { str: "应支付" },
      { str: "押金", hasEOL: true },
      { str: "人民币 5000 元" },
      { str: "。 " },
      { str: "" },
      { str: "乙方提前退租需赔偿" }
    ]);

    expect(text).toBe("甲方 应支付 押金\n人民币 5000 元。 乙方提前退租需赔偿");
  });
});
