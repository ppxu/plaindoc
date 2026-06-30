import { describe, expect, it } from "vitest";
import { documentExamples } from "../data/examples";
import {
  clearDocumentDraft,
  createDraftTextState,
  createInitialDocumentState,
  loadDocumentDraft,
  saveDocumentDraft
} from "../state/draftText";

describe("draft text state", () => {
  it("refreshes the local report when a user pastes recognizable text", () => {
    const text = documentExamples.find((example) => example.id === "employment-sales-bonus")?.content ?? "";

    const state = createDraftTextState({ text, selectedKind: "unknown" });

    expect(state.text).toBe(text);
    expect(state.kind).toBe("employment");
    expect(state.selectedExampleId).toBe("");
    expect(state.report.documentKind).toBe("employment");
    expect(state.report.findings.some((finding) => finding.id === "employment-non-compete-vague-compensation")).toBe(true);
    expect(state.error).toBe("");
    expect(state.notice).toContain("正文已更新");
    expect(state.notice).toContain("已自动识别为劳动协议");
    expect(state.evidenceSelection).toBeNull();
    expect(state.modelTextConsent).toBe(false);
  });

  it("keeps an empty draft aligned with an empty local report", () => {
    const state = createDraftTextState({ text: "", selectedKind: "loan" });

    expect(state.kind).toBe("loan");
    expect(state.report.documentKind).toBe("loan");
    expect(state.report.wordCount).toBe(0);
    expect(state.report.findings).toEqual([]);
    expect(state.notice).toBe("");
  });

  it("stores and restores a local browser draft for custom document text", () => {
    const storage = createMemoryStorage();
    const text = "租赁合同：押金 5000 元，提前退租扣两个月租金。";

    expect(saveDocumentDraft({ text, kind: "rental" }, storage)).toBe("saved");

    expect(loadDocumentDraft(storage)).toEqual({ text, kind: "rental" });
  });

  it("ignores empty or invalid stored drafts", () => {
    const storage = createMemoryStorage();

    expect(saveDocumentDraft({ text: "   ", kind: "rental" }, storage)).toBe("cleared");
    expect(loadDocumentDraft(storage)).toBeNull();

    storage.setItem("plaindoc:document-draft:v1", JSON.stringify({ text: "有效文本", kind: "not-a-kind" }));
    expect(loadDocumentDraft(storage)).toBeNull();
  });

  it("clears a stored local browser draft", () => {
    const storage = createMemoryStorage();
    saveDocumentDraft({ text: "劳动合同：竞业限制补偿另行约定。", kind: "employment" }, storage);

    expect(clearDocumentDraft(storage)).toBe("cleared");

    expect(loadDocumentDraft(storage)).toBeNull();
  });

  it("does not throw when browser draft storage writes are blocked", () => {
    const storage = createFailingStorage();

    expect(saveDocumentDraft({ text: "租赁合同：押金 5000 元。", kind: "rental" }, storage)).toBe("failed");
    expect(saveDocumentDraft({ text: "   ", kind: "rental" }, storage)).toBe("failed");
    expect(clearDocumentDraft(storage)).toBe("failed");
  });

  it("restores a stored draft instead of the default example on startup", () => {
    const storage = createMemoryStorage();
    const fallbackExample = documentExamples[0];
    const text = "装修合同：延期一天只赔 20 元，增项费用由业主承担。";
    saveDocumentDraft({ text, kind: "renovation" }, storage);

    const initial = createInitialDocumentState(fallbackExample, storage);

    expect(initial.text).toBe(text);
    expect(initial.kind).toBe("renovation");
    expect(initial.selectedExampleId).toBe("");
    expect(initial.notice).toContain("已恢复上次保存在本机浏览器的正文草稿");
    expect(initial.report.documentKind).toBe("renovation");
  });

  it("uses the default example when no stored draft exists", () => {
    const fallbackExample = documentExamples[0];

    const initial = createInitialDocumentState(fallbackExample, createMemoryStorage());

    expect(initial.text).toBe(fallbackExample.content);
    expect(initial.kind).toBe(fallbackExample.kind);
    expect(initial.selectedExampleId).toBe(fallbackExample.id);
    expect(initial.notice).toBe("");
  });
});

function createMemoryStorage(): Storage {
  const values = new Map<string, string>();

  return {
    get length() {
      return values.size;
    },
    clear: () => values.clear(),
    getItem: (key: string) => values.get(key) ?? null,
    key: (index: number) => Array.from(values.keys())[index] ?? null,
    removeItem: (key: string) => {
      values.delete(key);
    },
    setItem: (key: string, value: string) => {
      values.set(key, value);
    }
  };
}

function createFailingStorage(): Storage {
  return {
    get length() {
      return 0;
    },
    clear: () => {
      throw new Error("storage blocked");
    },
    getItem: () => {
      throw new Error("storage blocked");
    },
    key: () => null,
    removeItem: () => {
      throw new Error("storage blocked");
    },
    setItem: () => {
      throw new Error("storage blocked");
    }
  };
}
