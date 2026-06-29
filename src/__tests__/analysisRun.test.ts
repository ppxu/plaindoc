import { describe, expect, it } from "vitest";
import { createAnalysisRunTracker } from "../state/analysisRun";

describe("createAnalysisRunTracker", () => {
  it("marks older analysis runs stale after a new run begins", () => {
    const tracker = createAnalysisRunTracker();
    const first = tracker.begin();
    const second = tracker.begin();

    expect(tracker.isCurrent(first)).toBe(false);
    expect(tracker.isCurrent(second)).toBe(true);
  });

  it("invalidates an in-flight run when the workspace changes", () => {
    const tracker = createAnalysisRunTracker();
    const run = tracker.begin();

    tracker.invalidate();

    expect(tracker.isCurrent(run)).toBe(false);
  });
});
