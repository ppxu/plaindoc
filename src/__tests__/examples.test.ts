import { describe, expect, it } from "vitest";
import { analyzeDocument } from "../analyzer/localAnalyzer";
import { detectDocumentKind } from "../analyzer/documentKindDetector";
import { documentExamples } from "../data/examples";
import type { DocumentKind } from "../types";

const supportedKinds: DocumentKind[] = ["rental", "employment", "renovation", "loan", "insurance"];

describe("document examples", () => {
  it("provides at least two analyzable examples for every supported document kind", () => {
    for (const kind of supportedKinds) {
      const examples = documentExamples.filter((example) => example.kind === kind);
      expect(examples.length, `${kind} examples`).toBeGreaterThanOrEqual(2);
    }
  });

  it("keeps every example aligned with kind detection and local analysis", () => {
    for (const example of documentExamples) {
      const detection = detectDocumentKind(example.content);
      const report = analyzeDocument({ text: example.content, kind: example.kind });

      expect(detection.kind, `${example.id} detected kind`).toBe(example.kind);
      expect(report.findings.length, `${example.id} findings`).toBeGreaterThan(0);
      expect(report.checklist.length, `${example.id} checklist`).toBeGreaterThan(0);
      expect(report.actionPlan.steps.length, `${example.id} action plan`).toBeGreaterThan(0);
    }
  });
});
