# Security Policy

## Reporting a Vulnerability

Please open a private security advisory on GitHub if the repository is hosted there. If that is unavailable, open an issue with a minimal description and avoid posting sensitive exploit details.

## Local Data Handling

PlainDoc runs local-rule analysis in the browser. When AI mode is off, it does not upload document text to any PlainDoc server and does not require an API key.

AI-enhanced mode is optional. It sends document text only after the user enables AI settings and confirms **本次允许发送正文给模型服务** for the current document/model destination. Blank or whitespace-only document text cannot be confirmed for model sending. PlainDoc sends at most 12,000 characters from the beginning and ending portions of the document text to the configured OpenAI-compatible endpoint; the full text is still analyzed locally. Before confirmation, PlainDoc shows a read-only preview of the exact text that will be sent to the configured model service.

The model connection test sends only a minimal probe prompt to the configured model service. It does not send visible document text, does not require the user to confirm document sending, and expects a JSON confirmation such as `{"ok":true}` before showing a successful connection result.

Document text is treated as untrusted content in model prompts. PlainDoc instructs the model not to follow instructions embedded inside the document, reveal prompts or API keys, or change the required JSON report shape.

Remote model endpoints must use HTTPS before PlainDoc sends document text or API keys. HTTP endpoints are allowed only for local model services on `localhost`, `127.0.0.1`, or `[::1]`.

Local model endpoints can be used without an API key. PlainDoc remote model endpoints still require an API key before AI sending is enabled; if a local model server requires authentication, the user can still enter a key manually.

API keys are session-only by default. They are written to browser localStorage only when the user explicitly enables persistent storage, and can be cleared from the UI.

The current editor draft is stored in browser localStorage so users do not lose pasted or uploaded document text after refreshing the page. Loading a bundled example, clearing the current workspace, or using local data reset removes that stored draft.

Recent report history is stored in the browser and does not store original document text or evidence snippets. It keeps report conclusions and suggestions so users can revisit recent analyses without retaining raw contract text.

The local data reset action clears the visible document text, stored editor draft, current report, recent report history, stored model settings, remembered API key opt-in state, and current AI send confirmation in one step. It does not clear the offline application cache because that cache stores only PlainDoc application files.

Offline app caching stores PlainDoc application files such as HTML, JavaScript, CSS, manifest, and icons in the browser Cache Storage so the GitHub Pages app can reopen after a successful visit. The offline cache is not used for original document text, evidence snippets, API keys, or report history.

Before AI sending, PlainDoc performs a local sensitive-data category check and can generate a local redacted copy for common categories such as phone numbers, email addresses, ID numbers, and bank card numbers. The local redacted copy replaces detected values before the user confirms model sending.

Users should still avoid pasting highly sensitive documents into any software they do not understand or control. Model providers, browser extensions, and the user's device may have their own security boundaries outside this repository.

## Sensitive Examples

Do not contribute real contracts, real medical records, real insurance policies, private IDs, phone numbers, addresses, API keys, or other personal data as examples or tests.

## Professional Advice Boundary

PlainDoc is not a legal, medical, financial, or professional advisory service. Security fixes must not remove or weaken this boundary.
