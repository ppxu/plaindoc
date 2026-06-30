export interface LeaveWarningInput {
  text: string;
  selectedExampleId: string;
  isAnalyzing: boolean;
  isUploading: boolean;
}

export function shouldWarnBeforeLeaving({ text, selectedExampleId, isAnalyzing, isUploading }: LeaveWarningInput): boolean {
  if (isAnalyzing || isUploading) {
    return true;
  }

  return !selectedExampleId && Boolean(text.trim());
}
