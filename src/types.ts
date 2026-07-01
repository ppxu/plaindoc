export type DocumentKind = "rental" | "employment" | "renovation" | "loan" | "insurance" | "unknown";

export type ReviewPerspective =
  | "neutral"
  | "rental_tenant"
  | "rental_landlord"
  | "employment_employee"
  | "employment_employer"
  | "renovation_owner"
  | "renovation_contractor"
  | "loan_borrower"
  | "loan_lender"
  | "insurance_policyholder"
  | "insurance_insurer";

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

export interface ClarifyingQuestion {
  question: string;
  whyItMatters: string;
  severity: Severity;
  askBeforeSigning: boolean;
}

export interface ActionPlan {
  priority: "low" | "medium" | "high";
  title: string;
  steps: string[];
  message: string;
}

export interface ReportWarning {
  id: string;
  title: string;
  message: string;
  action: string;
  severity: "yellow" | "red";
}

export interface AnalysisReport {
  summary: string;
  status: ReportStatus;
  score: number;
  facts: ExtractedFact[];
  findings: RiskFinding[];
  inputWarnings: ReportWarning[];
  checklist: ChecklistItem[];
  clarifyingQuestions: ClarifyingQuestion[];
  actionPlan: ActionPlan;
  plainLanguage: string[];
  generatedAt: string;
  documentKind: DocumentKind;
  reviewPerspective?: ReviewPerspective;
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
  perspective?: ReviewPerspective;
}

export interface ModelAnalyzerSettings {
  enabled: boolean;
  baseUrl: string;
  model: string;
  apiKey: string;
  rememberApiKey: boolean;
}
