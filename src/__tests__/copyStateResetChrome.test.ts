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
    expect(checklistSource).toContain("[items]");
    expect(clauseEditPackSource).toContain("[editsText]");
    expect(priorityBriefSource).toContain("[briefText]");
    expect(riskCardSource).toContain("[finding.modification]");
  });
});
