# Contributing to PlainDoc

PlainDoc is intentionally small. The project is most useful when every rule, example, and UI element helps ordinary people understand what to ask before signing.

## Local Setup

```bash
npm install
npm test
npm run dev
```

## Adding a Document Rule

Rules live in `src/analyzer/rules.ts`.

A good rule includes:

- A narrow trigger pattern.
- A severity: `red`, `yellow`, or `green`.
- A plain-language explanation.
- Why the issue matters.
- A concrete suggestion.
- A checklist question users can ask the other party.

After adding a rule, add or update a test in `src/__tests__/localAnalyzer.test.ts`.

## Adding an Example

Examples live in `src/data/examples.ts`.

Examples must be fictional. Do not copy real contracts, real personal data, or proprietary templates into the repository.

## Writing Style

PlainDoc should avoid professional jargon where possible. Prefer:

- "押金可能不好退" over "押金返还条件存在不确定性".
- "签之前问清楚" over "建议进行进一步法律尽职调查".

## Pull Request Checklist

- The example data is fictional.
- The app still runs without API keys.
- `npm test` passes.
- `npm run build` passes.
- Any new risk rule includes a test.
- The disclaimer remains visible when adding new professional domains.

