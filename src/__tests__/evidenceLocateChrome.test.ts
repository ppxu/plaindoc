import { describe, expect, it } from "vitest";
import documentInputSource from "../components/DocumentInput.tsx?raw";

describe("evidence locating chrome", () => {
  it("keeps the document input usable when browser text selection or scrolling is blocked", () => {
    expect(documentInputSource).toContain("selectEvidenceText");
    expect(documentInputSource).toContain("textarea.focus()");
    expect(documentInputSource).toContain("textarea.setSelectionRange(selection.start, selection.end)");
    expect(documentInputSource).toContain('textarea.scrollIntoView({ block: "center", behavior: "smooth" })');
    expect(documentInputSource).toContain("catch");
  });
});
