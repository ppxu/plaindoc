# PlainDoc

PlainDoc turns everyday professional documents into plain-language risk notes and signing checklists.

The first version focuses on rental, employment, and renovation contracts. It is local-first, open-source, and runnable without API keys. An optional AI-enhanced mode can call an OpenAI-compatible model service that the user configures.

> Know what can hurt you before you sign.

![PlainDoc desktop screenshot](docs/assets/plaindoc-desktop.png)

## What It Does

Paste a contract, upload a selectable-text PDF, or load a bundled example. PlainDoc produces:

- A one-sentence summary.
- Key facts such as money, dates, obligations, penalties, and acceptance terms.
- Red/yellow/green risk cards with evidence snippets.
- Suggested clause edits for flagged risks.
- A copyable clause-edit pack for sending all proposed changes together.
- A signing checklist you can copy before talking to the other party.
- A next-step action plan and a message draft you can send back for clarification.
- Plain-language explanations for non-experts.
- Local report history for revisiting recent analyses.
- Markdown export for saving or sharing the report.
- Optional AI-enhanced analysis with local-rule fallback.

PlainDoc is not a legal-advice product. It is a document-reading assistant that helps ordinary people spot questions worth asking.

## Why This Exists

Most "chat with PDF" tools ask users to know what to ask. PlainDoc starts from the opposite assumption: ordinary people often do not know which clauses matter.

The goal is to package professional reading patterns into a tool that gives users a concrete next step before they sign.

## Quick Start

```bash
npm install
npm run dev
```

Open the local Vite URL and try one of the bundled examples.

Run checks:

```bash
npm test
npm run build
```

## AI-Enhanced Mode

PlainDoc works without a model by default. The browser runs local heuristic rules first, then optionally asks your configured model service to improve the summary, risk cards, checklist, and plain-language explanation.

To use it:

1. Enable **AI 增强分析** in the left panel.
2. Enter an OpenAI-compatible endpoint, model name, and API key.
3. Click **生成 AI 增强清单**.

Privacy boundary:

- When AI mode is off, PlainDoc does not send document text anywhere.
- PDF text extraction runs in your browser before analysis.
- Recent report history is stored in your browser and does not store the original document text.
- When AI mode is on, the document text is sent from your browser to the endpoint you configured.
- The API key is stored in your browser localStorage and can be cleared from the UI.
- If the model call fails, PlainDoc falls back to the local report and shows the failure reason.

## Current Scope

Supported in this MVP:

- Paste text.
- Upload selectable-text PDF, `.txt`, and `.md` files.
- Load fictional rental, employment, and renovation examples.
- Local heuristic analysis with no API key.
- Optional OpenAI-compatible model enhancement.
- Suggested clause edits for common risk patterns.
- Copyable clause-edit pack.
- Copyable next-step message draft for counterparties.
- Local report history with one-click clear.
- Markdown report export.

Not yet supported:

- OCR for scanned PDFs or photos.
- Server-side model proxy or account-based key storage.
- Multi-language document packs.
- Account sync or cloud storage.

## Example Use Cases

- A renter wants to know whether deposit and early-exit clauses are risky.
- An employee wants to understand non-compete, penalty, and resignation notice clauses.
- A homeowner wants to check renovation payment milestones, change orders, and acceptance rules.

## Disclaimer

PlainDoc provides document-reading assistance and risk prompts. It does not provide legal, medical, financial, or other professional advice. Important decisions should be reviewed with qualified professionals.

## Roadmap

See [docs/roadmap.md](docs/roadmap.md).

## Contributing

Contributions are welcome. The easiest useful contributions are:

- Add more fictional example documents.
- Improve local rule packs.
- Add tests for a new document pattern.
- Improve suggested clause-edit templates.
- Improve plain-language explanations.
- Improve action-plan and counterparty-message templates.
- Help implement OCR adapters and document ingestion edge cases.

See [CONTRIBUTING.md](CONTRIBUTING.md).

## Suggested GitHub Topics

`documents`, `contracts`, `plain-language`, `risk-checklist`, `local-first`, `react`, `vite`, `open-source`

## License

MIT
