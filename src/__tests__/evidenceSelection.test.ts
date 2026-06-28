import { describe, expect, it } from "vitest";
import { resolveEvidenceSelection } from "../utils/evidenceSelection";
import type { EvidenceSnippet } from "../types";

describe("evidence selection", () => {
  it("uses the original evidence range when it still matches the editor text", () => {
    const text = "押金为人民币 13600 元。甲方有权从押金中直接扣除维修费。";
    const evidence: EvidenceSnippet = {
      text: "甲方有权从押金中直接扣除维修费",
      start: 15,
      end: 31
    };

    expect(resolveEvidenceSelection(text, evidence)).toEqual({ ok: true, start: 15, end: 30 });
  });

  it("falls back to finding the evidence text when the editor prefix changed", () => {
    const text = "补充说明：押金为人民币 13600 元。甲方有权从押金中直接扣除维修费。";
    const evidence: EvidenceSnippet = {
      text: "甲方有权从押金中直接扣除维修费",
      start: 15,
      end: 31
    };

    expect(resolveEvidenceSelection(text, evidence)).toEqual({ ok: true, start: 20, end: 35 });
  });

  it("uses the original range when the evidence text only differs by whitespace", () => {
    const text = "月租金为人民币 6800 元。\n押金为人民币 13600 元。\n乙方如提前退租，应提前通知。";
    const evidence: EvidenceSnippet = {
      text: "月租金为人民币 6800 元。 押金为人民币 13600 元。 乙方如提前退租",
      start: 0,
      end: 39
    };

    const selection = resolveEvidenceSelection(text, evidence);

    expect(selection).toEqual({ ok: true, start: 0, end: 39 });
  });

  it("returns stale_evidence when the editor no longer contains the snippet", () => {
    const evidence: EvidenceSnippet = {
      text: "甲方有权从押金中直接扣除维修费",
      start: 15,
      end: 31
    };

    expect(resolveEvidenceSelection("正文已经被替换。", evidence)).toEqual({ ok: false, reason: "stale_evidence" });
  });
});
