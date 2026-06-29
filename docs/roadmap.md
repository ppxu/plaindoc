# PlainDoc Roadmap

## 0.1 Public MVP

- Local text analysis.
- Instant local report refresh while pasting or editing document text.
- Rental, employment, and renovation rule packs.
- Bundled fictional examples.
- Copyable checklist.
- Markdown export.
- Open-source launch materials.

## 0.2 AI-Enhanced Mode

- Optional OpenAI-compatible analyzer.
- Browser-side model settings.
- Per-session confirmation before sending document text to the configured model service, revoked when the document or model destination changes.
- Transparent AI input-scope notice for long documents when only the first 12,000 characters are sent to the model.
- Session-only API key handling by default with explicit opt-in persistence.
- Local sensitive-data category warning and redacted-copy helper before AI model sending.
- Structured output validation.
- Conservative model/local merge that preserves local evidence snippets.
- Local-rule fallback when model calls fail.
- Selectable-text PDF upload and extraction.
- Instant local report refresh after successful PDF, `.txt`, and `.md` uploads.
- Instant local report refresh when manually switching document type.
- Next-step action plan and copyable counterparty message.
- Deduplicated local report history without storing original document text or evidence snippets, clearing the editor when a report is restored.
- One-click current-workspace clearing for sensitive document text and the current report.
- One-click local data reset for current text, report history, model settings, and AI send confirmation.
- Suggested clause edits for flagged risks.
- Copyable clause-edit pack for all proposed changes.
- Copyable full Markdown report.
- Print-friendly report output for browser printing or saving as PDF.
- One-click original-text locating for risk evidence snippets.
- Paragraph-level fallback when a risk evidence snippet was lightly edited but nearby context remains in the current text.
- Canceling AI analysis aborts the browser model request and ignores stale results.
- Automatic model request timeout with local-rule fallback.
- Priority brief for the first issues to negotiate.
- Loan and borrowing contract rule pack.
- Insurance policy rule pack.
- Document-kind coverage panel backed by shared metadata.
- Local document-type detection for pasted and uploaded text.
- Initial expanded example pack with two fictional scenarios per supported document type.
- Instant local report refresh when switching bundled examples.
- GitHub Pages release metadata, social preview image, and web app manifest.
- GitHub Pages-scoped service worker and offline application-shell caching.

## 0.3 Document Ingestion

- OCR adapter for scanned documents.
- Better evidence highlighting by paragraph across restored, edited, and model-enhanced reports.
- Larger example pack with more edge cases and regional variants.

## 0.4 Model Adapter

- Optional local LLM analyzer.
- Side-by-side local heuristic and model results.
- Server-side model proxy for safer API key handling.

## 0.5 Domain Packs

- Medical report explainer pack.
- Mortgage pack.
- School and government notice pack.

## 0.6 Community

- Rule contribution templates.
- Example review checklist.
- Benchmark set for false positives and false negatives.
- GitHub Pages demo build.
