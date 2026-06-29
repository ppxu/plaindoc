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

    expect(resolveEvidenceSelection(text, evidence)).toEqual({ ok: true, start: 15, end: 30, match: "exact" });
  });

  it("falls back to finding the evidence text when the editor prefix changed", () => {
    const text = "补充说明：押金为人民币 13600 元。甲方有权从押金中直接扣除维修费。";
    const evidence: EvidenceSnippet = {
      text: "甲方有权从押金中直接扣除维修费",
      start: 15,
      end: 31
    };

    expect(resolveEvidenceSelection(text, evidence)).toEqual({ ok: true, start: 20, end: 35, match: "exact" });
  });

  it("uses the original range when the evidence text only differs by whitespace", () => {
    const text = "月租金为人民币 6800 元。\n押金为人民币 13600 元。\n乙方如提前退租，应提前通知。";
    const evidence: EvidenceSnippet = {
      text: "月租金为人民币 6800 元。 押金为人民币 13600 元。 乙方如提前退租",
      start: 0,
      end: 39
    };

    const selection = resolveEvidenceSelection(text, evidence);

    expect(selection).toEqual({ ok: true, start: 0, end: 39, match: "exact" });
  });

  it("falls back to the closest paragraph when the evidence sentence was lightly edited", () => {
    const text = [
      "租赁期限为 2026 年 7 月 1 日至 2027 年 6 月 30 日。",
      "押金金额为人民币 13600 元。退租时，甲方可以扣除未结费用和维修费，但应提供票据。"
    ].join("\n\n");
    const evidence: EvidenceSnippet = {
      text: "甲方有权从押金中直接扣除未付租金、违约金、清洁费、维修费",
      start: 99,
      end: 130
    };

    expect(resolveEvidenceSelection(text, evidence)).toEqual({
      ok: true,
      start: 40,
      end: 83,
      match: "paragraph"
    });
  });

  it("prefers the related paragraph near the original evidence range when multiple paragraphs share terms", () => {
    const text = [
      "押金为人民币 13600 元，乙方应于每月 5 日前支付。",
      "乙方如提前退租，应提前 30 日通知甲方，并承担合理违约金。甲方可以从押金中扣除未付租金和维修费，但应提供清单和票据。"
    ].join("\n\n");
    const paragraphStart = text.indexOf("乙方如提前退租");
    const evidence: EvidenceSnippet = {
      text: "押金为人民币 13600 元。乙方如提前退租，应至少提前 60 日书面通知甲方，并承担两个月租金作为违约金。甲方有权从押金中直接扣除未付租金、违约金、清洁费、维修费",
      start: paragraphStart,
      end: paragraphStart + 90
    };

    expect(resolveEvidenceSelection(text, evidence)).toEqual({
      ok: true,
      start: paragraphStart,
      end: text.length,
      match: "paragraph"
    });
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
