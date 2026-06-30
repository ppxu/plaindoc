import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import actionPlanSource from "../components/ActionPlan.tsx?raw";
import checklistSource from "../components/Checklist.tsx?raw";
import clauseEditPackSource from "../components/ClauseEditPack.tsx?raw";
import priorityBriefSource from "../components/PriorityBrief.tsx?raw";
import riskCardSource from "../components/RiskCard.tsx?raw";

const stylesSource = readFileSync(fileURLToPath(new URL("../styles.css", import.meta.url)), "utf8");

describe("copy state reset chrome", () => {
  it("resets copy button feedback when the copied content changes", () => {
    for (const source of [actionPlanSource, checklistSource, clauseEditPackSource, priorityBriefSource, riskCardSource]) {
      expect(source).toContain("useEffect");
      expect(source).toContain('setCopyState("idle")');
    }

    expect(actionPlanSource).toContain("[plan.message]");
    expect(checklistSource).toContain("[checklistText]");
    expect(clauseEditPackSource).toContain("[editsText]");
    expect(priorityBriefSource).toContain("[briefText]");
    expect(riskCardSource).toContain("[finding.modification]");
  });

  it("offers a manual message-draft fallback when browser copy is blocked", () => {
    expect(actionPlanSource).toContain("messageFallbackRef");
    expect(actionPlanSource).toContain('copyState === "failed"');
    expect(actionPlanSource).toContain("浏览器没有允许自动复制。可以在这里手动复制沟通草稿。");
    expect(actionPlanSource).toContain('aria-label="沟通草稿，可手动复制"');
    expect(actionPlanSource).toContain("selectFallbackText(messageFallbackRef.current)");
    expect(actionPlanSource).toContain(".focus()");
    expect(actionPlanSource).toContain(".select()");
    expect(actionPlanSource).toContain("setSelectionRange(0, textarea.value.length)");
  });

  it("offers a manual checklist fallback when browser copy is blocked", () => {
    expect(checklistSource).toContain("checklistFallbackRef");
    expect(checklistSource).toContain("checklistToText(items)");
    expect(checklistSource).toContain('copyState === "failed"');
    expect(checklistSource).toContain("浏览器没有允许自动复制。可以在这里手动复制签署前问题清单。");
    expect(checklistSource).toContain('aria-label="签署前问题清单，可手动复制"');
    expect(checklistSource).toContain("selectFallbackText(checklistFallbackRef.current)");
    expect(checklistSource).toContain(".focus()");
    expect(checklistSource).toContain(".select()");
    expect(checklistSource).toContain("setSelectionRange(0, textarea.value.length)");
  });

  it("offers a manual priority brief fallback when browser copy is blocked", () => {
    expect(priorityBriefSource).toContain("briefFallbackRef");
    expect(priorityBriefSource).toContain('copyState === "failed"');
    expect(priorityBriefSource).toContain("浏览器没有允许自动复制。可以在这里手动复制优先处理提纲。");
    expect(priorityBriefSource).toContain('aria-label="优先处理提纲，可手动复制"');
    expect(priorityBriefSource).toContain("selectFallbackText(briefFallbackRef.current)");
    expect(priorityBriefSource).toContain(".focus()");
    expect(priorityBriefSource).toContain(".select()");
    expect(priorityBriefSource).toContain("setSelectionRange(0, textarea.value.length)");
  });

  it("offers a manual clause edits fallback when browser copy is blocked", () => {
    expect(clauseEditPackSource).toContain("editsFallbackRef");
    expect(clauseEditPackSource).toContain('copyState === "failed"');
    expect(clauseEditPackSource).toContain("浏览器没有允许自动复制。可以在这里手动复制修改条款包。");
    expect(clauseEditPackSource).toContain('aria-label="修改条款包，可手动复制"');
    expect(clauseEditPackSource).toContain("selectFallbackText(editsFallbackRef.current)");
    expect(clauseEditPackSource).toContain(".focus()");
    expect(clauseEditPackSource).toContain(".select()");
    expect(clauseEditPackSource).toContain("setSelectionRange(0, textarea.value.length)");
  });

  it("offers a manual single-clause fallback when browser copy is blocked", () => {
    expect(riskCardSource).toContain("modificationFallbackRef");
    expect(riskCardSource).toContain('copyState === "failed"');
    expect(riskCardSource).toContain("浏览器没有允许自动复制。可以在这里手动复制这条建议修改条款。");
    expect(riskCardSource).toContain('aria-label="建议修改条款，可手动复制"');
    expect(riskCardSource).toContain("selectFallbackText(modificationFallbackRef.current)");
    expect(riskCardSource).toContain(".focus()");
    expect(riskCardSource).toContain(".select()");
    expect(riskCardSource).toContain("setSelectionRange(0, textarea.value.length)");
    expect(stylesSource).toContain(".modification-box .report-copy-fallback");
    expect(stylesSource).toContain(".modification-box .report-copy-fallback {\n  display: grid;");
    expect(stylesSource).toContain("width: 100%");
  });
});
