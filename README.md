# PlainDoc

PlainDoc turns everyday professional documents into plain-language risk notes and signing checklists.

The first version focuses on rental, employment, and renovation contracts. It is local-first, open-source, and runnable without API keys.

> Know what can hurt you before you sign.

![PlainDoc desktop screenshot](docs/assets/plaindoc-desktop.png)

## What It Does

Paste a contract or load a bundled example. PlainDoc produces:

- A one-sentence summary.
- Key facts such as money, dates, obligations, penalties, and acceptance terms.
- Red/yellow/green risk cards with evidence snippets.
- A signing checklist you can copy before talking to the other party.
- Plain-language explanations for non-experts.
- Markdown export for saving or sharing the report.

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

## Current Scope

Supported in this MVP:

- Paste text.
- Upload `.txt` and `.md` files.
- Load fictional rental, employment, and renovation examples.
- Local heuristic analysis with no API key.
- Markdown report export.

Not yet supported:

- PDF parsing.
- OCR for scans or photos.
- LLM-backed analysis.
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
- Improve plain-language explanations.
- Help implement PDF/OCR adapters.

See [CONTRIBUTING.md](CONTRIBUTING.md).

## Suggested GitHub Topics

`documents`, `contracts`, `plain-language`, `risk-checklist`, `local-first`, `react`, `vite`, `open-source`

## License

MIT
