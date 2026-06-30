import { describe, expect, it } from "vitest";
import { formatDocumentInputStats } from "../state/documentInputStats";

describe("document input stats", () => {
  it("shows an empty-state hint before the user enters document text", () => {
    expect(formatDocumentInputStats("")).toBe("尚未输入正文");
    expect(formatDocumentInputStats("   \n\t")).toBe("尚未输入正文");
  });

  it("shows the trimmed character count for pasted or uploaded document text", () => {
    expect(formatDocumentInputStats(" 合同正文 ")).toBe("已输入 4 个字符");
    expect(formatDocumentInputStats("条".repeat(12025))).toBe("已输入 12025 个字符");
  });
});
