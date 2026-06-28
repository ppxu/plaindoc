# PlainDoc MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a GitHub-ready open-source MVP of PlainDoc, a local-first document risk checklist app for rental, employment, and renovation contracts.

**Architecture:** Use a React + Vite + TypeScript app with a deterministic local analyzer. Keep document analysis, report composition, sample data, export logic, and UI components separated so future LLM/PDF adapters can be added without rewriting the app.

**Tech Stack:** React, Vite, TypeScript, Vitest, CSS modules via plain CSS, local browser File API.

---

## File Structure

- `package.json`: scripts and dependencies.
- `index.html`: Vite entry.
- `src/main.tsx`: React root.
- `src/App.tsx`: top-level state and composition.
- `src/styles.css`: design system and responsive layout.
- `src/types.ts`: domain types for documents, findings, facts, checklist, reports.
- `src/data/examples.ts`: bundled rental, employment, and renovation examples.
- `src/analyzer/patterns.ts`: reusable money/date/evidence extraction helpers.
- `src/analyzer/rules.ts`: scenario rule packs and scoring metadata.
- `src/analyzer/localAnalyzer.ts`: local analyzer implementation.
- `src/export/markdown.ts`: report-to-Markdown exporter.
- `src/components/*`: focused UI components for input, report, risk cards, checklist, and empty states.
- `src/__tests__/*`: analyzer and exporter tests.
- `README.md`, `LICENSE`, `CONTRIBUTING.md`, `SECURITY.md`: launch materials.

## Tasks

### Task 1: Scaffold App and Domain Core

**Files:**
- Create: `package.json`
- Create: `index.html`
- Create: `tsconfig.json`
- Create: `vite.config.ts`
- Create: `src/main.tsx`
- Create: `src/App.tsx`
- Create: `src/types.ts`
- Create: `src/styles.css`

- [ ] Create the Vite React TypeScript project files.
- [ ] Define `DocumentKind`, `Severity`, `ExtractedFact`, `RiskFinding`, `ChecklistItem`, and `AnalysisReport`.
- [ ] Render a minimal app shell with project title, disclaimer, input panel, and empty report state.
- [ ] Run `npm install`.
- [ ] Run `npm run build` and confirm it passes.

### Task 2: Add Example Documents

**Files:**
- Create: `src/data/examples.ts`
- Modify: `src/App.tsx`

- [ ] Add rental, employment, and renovation example documents with realistic but fictional text.
- [ ] Add an example picker that loads each example into the input text area.
- [ ] Verify each example can be selected in the running app.

### Task 3: Implement Local Analyzer

**Files:**
- Create: `src/analyzer/patterns.ts`
- Create: `src/analyzer/rules.ts`
- Create: `src/analyzer/localAnalyzer.ts`
- Create: `src/__tests__/localAnalyzer.test.ts`
- Modify: `src/App.tsx`

- [ ] Write tests for empty input, rental deposit risk, employment non-compete risk, and renovation milestone payment risk.
- [ ] Implement pattern helpers for money, dates, and evidence snippets.
- [ ] Implement scenario rules with severity, explanation, and checklist output.
- [ ] Compose `AnalysisReport` with summary, score, facts, findings, checklist, and plain-language explanation.
- [ ] Wire the analyzer into the UI.
- [ ] Run `npm test`.

### Task 4: Build Report UI and Export

**Files:**
- Create: `src/components/DocumentInput.tsx`
- Create: `src/components/ReportPanel.tsx`
- Create: `src/components/RiskCard.tsx`
- Create: `src/components/Checklist.tsx`
- Create: `src/export/markdown.ts`
- Create: `src/__tests__/markdown.test.ts`
- Modify: `src/App.tsx`
- Modify: `src/styles.css`

- [ ] Split the UI into focused components.
- [ ] Add report status, score, key facts, risk cards, checklist, evidence snippets, and plain-language section.
- [ ] Implement copy checklist and export Markdown actions.
- [ ] Test Markdown export includes summary, risks, checklist, and disclaimer.
- [ ] Run `npm test` and `npm run build`.

### Task 5: Polish Open Source Launch Materials

**Files:**
- Create: `README.md`
- Create: `LICENSE`
- Create: `CONTRIBUTING.md`
- Create: `SECURITY.md`
- Create: `.gitignore`
- Create: `docs/roadmap.md`

- [ ] Write README with pitch, quick start, screenshots placeholder, examples, limitations, disclaimer, and roadmap.
- [ ] Add MIT license.
- [ ] Add contribution guide for document packs and rules.
- [ ] Add security policy and local data handling notes.
- [ ] Add GitHub-friendly topics and suggested repo description in README.

### Task 6: Runtime Verification

**Files:**
- Modify as needed based on verification findings.

- [ ] Start dev server with `npm run dev -- --host 127.0.0.1`.
- [ ] Verify rental, employment, and renovation examples produce useful reports.
- [ ] Verify paste input and `.txt/.md` upload paths.
- [ ] Verify desktop and mobile layouts do not overflow.
- [ ] Run final `npm test` and `npm run build`.

