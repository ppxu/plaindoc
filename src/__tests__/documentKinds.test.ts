import { describe, expect, it } from "vitest";
import { documentKindMeta, documentKindOptions } from "../data/documentKinds";
import { documentExamples } from "../data/examples";
import type { DocumentKind } from "../types";

describe("document kind metadata", () => {
  it("keeps selectable kinds aligned with metadata", () => {
    const optionKinds = documentKindOptions.map((option) => option.kind);
    const metadataKinds = Object.keys(documentKindMeta) as DocumentKind[];

    expect(optionKinds).toEqual(metadataKinds);
    expect(documentKindOptions.at(-1)?.kind).toBe("unknown");
  });

  it("provides user-facing coverage for every supported kind", () => {
    documentKindOptions.forEach(({ kind, label }) => {
      expect(label).toBe(documentKindMeta[kind].label);
      expect(documentKindMeta[kind].summaryLabel.length).toBeGreaterThan(0);
      expect(documentKindMeta[kind].plainLanguage.length).toBeGreaterThan(0);
      expect(documentKindMeta[kind].coverage).toHaveLength(4);
    });
  });

  it("has metadata for every bundled example kind", () => {
    const exampleKinds = new Set(documentExamples.map((example) => example.kind));

    exampleKinds.forEach((kind) => {
      expect(documentKindMeta[kind]).toBeDefined();
    });
  });
});
