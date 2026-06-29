import { describe, expect, it } from "vitest";
import appSource from "../App.tsx?raw";
import { shouldWarnBeforeLeaving } from "../state/leaveWarning";

describe("leave warning", () => {
  it("warns only when user-owned work may be lost", () => {
    expect(shouldWarnBeforeLeaving({ text: "默认样例正文", selectedExampleId: "rental-example", isAnalyzing: false })).toBe(false);
    expect(shouldWarnBeforeLeaving({ text: "用户粘贴的合同正文", selectedExampleId: "", isAnalyzing: false })).toBe(true);
    expect(shouldWarnBeforeLeaving({ text: "   ", selectedExampleId: "", isAnalyzing: false })).toBe(false);
    expect(shouldWarnBeforeLeaving({ text: "", selectedExampleId: "", isAnalyzing: true })).toBe(true);
  });

  it("registers a browser beforeunload guard in the app shell", () => {
    expect(appSource).toContain("beforeunload");
    expect(appSource).toContain("shouldWarnBeforeLeaving");
    expect(appSource).toContain("event.preventDefault()");
    expect(appSource).toContain('event.returnValue = ""');
  });
});
