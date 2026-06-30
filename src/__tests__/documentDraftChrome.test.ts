import { describe, expect, it } from "vitest";
import appSource from "../App.tsx?raw";

describe("document draft chrome", () => {
  it("starts from a restored local browser draft when one exists", () => {
    expect(appSource).toContain("createInitialDocumentState(firstExample)");
    expect(appSource).toContain("const [text, setText] = useState(initialDocument.text);");
    expect(appSource).toContain("const [kind, setKind] = useState<DocumentKind>(initialDocument.kind);");
    expect(appSource).toContain("const [selectedExampleId, setSelectedExampleId] = useState(initialDocument.selectedExampleId);");
    expect(appSource).toContain("const [inputNotice, setInputNotice] = useState(initialDocument.notice);");
    expect(appSource).toContain("const [report, setReport] = useState<AnalysisReport>(() => initialDocument.report);");
  });

  it("keeps only custom or uploaded document text in the local browser draft", () => {
    expect(appSource).toContain("saveDocumentDraft({ text, kind });");
    expect(appSource).toContain("clearDocumentDraft();");
    expect(appSource.indexOf("if (selectedExampleId)")).toBeLessThan(appSource.indexOf("clearDocumentDraft();"));
  });

  it("shows a non-blocking notice when the browser cannot save a local draft", () => {
    expect(appSource).toContain('draftSaveResult === "failed"');
    expect(appSource).toContain("浏览器没有允许保存本机草稿");
  });
});
