export interface AnalysisRunTracker {
  begin: () => number;
  cancel: () => number;
  invalidate: () => number;
  isCurrent: (runId: number) => boolean;
}

export function createAnalysisRunTracker(initialRunId = 0): AnalysisRunTracker {
  let currentRunId = initialRunId;

  return {
    begin: () => {
      currentRunId += 1;
      return currentRunId;
    },
    cancel: () => {
      currentRunId += 1;
      return currentRunId;
    },
    invalidate: () => {
      currentRunId += 1;
      return currentRunId;
    },
    isCurrent: (runId: number) => runId === currentRunId
  };
}
