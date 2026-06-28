export type DocumentKind = "rental" | "employment" | "renovation" | "loan" | "insurance" | "unknown";

export type Severity = "red" | "yellow" | "green";

export type ReportStatus = "safe_to_review" | "needs_attention" | "do_not_sign_directly";

export type AnalysisSource = "local" | "model";

export interface EvidenceSnippet {
  text: string;
  start: number;
  end: number;
}

export interface EvidenceSelectionTarget {
  start: number;
  end: number;
  token: number;
}

export interface ExtractedFact {
  label: string;
  value: string;
  confidence: number;
  evidence?: EvidenceSnippet;
}

export interface RiskFinding {
  id: string;
  title: string;
  severity: Severity;
  explanation: string;
  whyItMatters: string;
  suggestion: string;
  modification?: string;
  evidence?: EvidenceSnippet;
}

export interface ChecklistItem {
  question: string;
  reason: string;
  severity: Severity;
}

export interface ActionPlan {
  priority: "low" | "medium" | "high";
  title: string;
  steps: string[];
  message: string;
}

export interface AnalysisReport {
  summary: string;
  status: ReportStatus;
  score: number;
  facts: ExtractedFact[];
  findings: RiskFinding[];
  checklist: ChecklistItem[];
  actionPlan: ActionPlan;
  plainLanguage: string[];
  generatedAt: string;
  documentKind: DocumentKind;
  wordCount: number;
  source: AnalysisSource;
  modelName?: string;
  notice?: string;
  disclaimer: string;
}

export interface SavedReport {
  id: string;
  title: string;
  createdAt: string;
  report: AnalysisReport;
}

export interface DocumentExample {
  id: string;
  title: string;
  kind: DocumentKind;
  description: string;
  content: string;
}

export interface AnalyzerInput {
  text: string;
  kind: DocumentKind;
}

export interface ModelAnalyzerSettings {
  enabled: boolean;
  baseUrl: string;
  model: string;
  apiKey: string;
}
