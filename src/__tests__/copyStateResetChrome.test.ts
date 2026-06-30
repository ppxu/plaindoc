import { describe, expect, it } from "vitest";
import actionPlanSource from "../components/ActionPlan.tsx?raw";
import checklistSource from "../components/Checklist.tsx?raw";
import clauseEditPackSource from "../components/ClauseEditPack.tsx?raw";
import priorityBriefSource from "../components/PriorityBrief.tsx?raw";
import riskCardSource from "../components/RiskCard.tsx?raw";

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
});
