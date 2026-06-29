export interface LeaveWarningInput {
  text: string;
  selectedExampleId: string;
  isAnalyzing: boolean;
}

export function shouldWarnBeforeLeaving({ text, selectedExampleId, isAnalyzing }: LeaveWarningInput): boolean {
  if (isAnalyzing) {
    return true;
  }

  return !selectedExampleId && Boolean(text.trim());
}
