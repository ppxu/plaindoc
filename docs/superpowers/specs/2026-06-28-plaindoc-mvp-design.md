# PlainDoc MVP Design

## Goal

PlainDoc is an open-source web app that turns professional documents into plain-language risk notes and action checklists for ordinary people before they sign, accept, or act on them.

The first public version focuses on rental, employment, and renovation contracts. It should feel like a practical pre-signing assistant, not a legal-tech platform and not a generic "chat with PDF" demo.

## Positioning

PlainDoc helps users answer five questions:

1. What is this document asking me to accept?
2. What obligations, money, dates, and penalties matter most?
3. Which clauses look risky, unusual, or worth confirming?
4. What should I ask the other party before signing?
5. How can I explain the document to a family member in plain language?

The project must avoid claiming to provide legal, medical, financial, or professional advice. It provides document-reading assistance, structured extraction, and user-facing prompts for further review.

## MVP Scope

The MVP is a local browser app with three primary inputs:

- Paste document text.
- Load one of three bundled examples: rental contract, employment agreement, renovation contract.
- Upload `.txt` or `.md` files.

PDF/OCR, account systems, cloud storage, real-time collaboration, and paid model billing are out of scope for the first version. They can be listed in the roadmap.

## Core Workflow

1. User opens the app and sees the document analyzer as the first screen.
2. User selects an example, pastes text, or uploads a text file.
3. User selects document type: rental, employment, renovation, or unsure.
4. User clicks analyze.
5. The app generates a structured report with:
   - One-sentence summary.
   - Key facts: parties, money, dates, duration, termination, penalties.
   - Risk map with red/yellow/green severity.
   - Signing checklist.
   - Plain-language explanation.
   - Source snippets that justify findings.
6. User can switch examples, copy the checklist, and export the report as Markdown.

## Analysis Strategy

The first version uses deterministic local analysis so the repository is runnable without API keys.

The analyzer will combine:

- Lightweight keyword and pattern extraction for dates, money, deposit, salary, notice periods, penalties, liability, renewal, confidentiality, non-compete, acceptance, warranty, and payment milestones.
- Scenario-specific rule packs for rental, employment, and renovation documents.
- A report composer that maps detected signals to user-friendly risk cards and checklist questions.

The architecture should leave an explicit adapter boundary for future LLM analysis:

- `LocalHeuristicAnalyzer` for the MVP.
- `ModelAnalyzer` interface for future OpenAI/local model integrations.

## Product Surfaces

### Analyzer Workspace

The main screen should be a usable two-column work surface:

- Left side: input controls, document type selector, text area, example picker, upload control.
- Right side: generated report, risk summary, checklist, and export actions.

The app should not start with a marketing landing page. The first screen is the tool itself.

### Report

The report must be structured and skimmable:

- Overall status: "可以继续确认", "需要重点确认", or "不建议直接签".
- Risk score from 0 to 100, with clear explanation that it is a heuristic reading score.
- Risk cards grouped by severity.
- Checklist questions that can be copied.
- Evidence snippets from the input text where available.

### Open Source Materials

The repository should include:

- `README.md` with product pitch, screenshots placeholder, quick start, examples, limitations, and disclaimer.
- `LICENSE` using MIT.
- `CONTRIBUTING.md` with how to add document rules and examples.
- `SECURITY.md` explaining how to report security issues and how user data is handled locally.
- Example documents under `src/data/examples.ts`.
- Roadmap section for PDF/OCR, LLM adapter, multi-language support, and domain packs.

## Data Model

Key domain types:

- `DocumentKind`: `rental`, `employment`, `renovation`, `unknown`.
- `Severity`: `red`, `yellow`, `green`.
- `ExtractedFact`: label, value, confidence, evidence.
- `RiskFinding`: title, severity, explanation, whyItMatters, suggestion, evidence.
- `ChecklistItem`: question, reason, severity.
- `AnalysisReport`: summary, status, score, facts, findings, checklist, plainLanguage, generatedAt.

## Error Handling

The app should handle:

- Empty input: show a friendly validation message.
- Very short input: warn that the report may be weak.
- Unsupported upload type: reject with clear text.
- Failed file read: show a retryable error.
- No detected risks: still produce a useful checklist and explain that absence of findings is not legal clearance.

## Testing Requirements

Tests should cover:

- Money/date extraction.
- Each scenario rule pack.
- Empty and short input handling.
- Markdown export.
- Report score and status mapping.

Visual and runtime verification should cover:

- Desktop app loads and analyzes each bundled example.
- Mobile viewport has no overflow and preserves the core workflow.
- Build passes.

## Open Source Launch Criteria

The project is ready for initial GitHub open-source launch when:

- A user can clone, install, run, and analyze examples locally.
- The README explains the value proposition in under 30 seconds.
- The app has an attractive, credible, non-demo-looking UI.
- The analyzer produces useful output for all three example documents.
- Tests and build pass.
- Legal/professional advice disclaimer is visible in README and app.
- Repository metadata and roadmap make contribution paths clear.

