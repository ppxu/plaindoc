import { afterEach, describe, expect, it, vi } from "vitest";
import { copyTextToClipboard } from "../utils/clipboard";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("copyTextToClipboard", () => {
  it("returns false and removes the fallback textarea when all copy methods are blocked", async () => {
    const textarea = createTextarea();
    const documentStub = {
      body: {
        appendChild: vi.fn(),
        removeChild: vi.fn()
      },
      createElement: vi.fn(() => textarea),
      execCommand: vi.fn(() => {
        throw new Error("copy blocked");
      })
    };

    vi.stubGlobal("navigator", {
      clipboard: {
        writeText: vi.fn(async () => {
          throw new Error("permission denied");
        })
      }
    });
    vi.stubGlobal("document", documentStub);

    await expect(copyTextToClipboard("PlainDoc report")).resolves.toBe(false);

    expect(documentStub.createElement).toHaveBeenCalledWith("textarea");
    expect(textarea.value).toBe("PlainDoc report");
    expect(documentStub.body.appendChild).toHaveBeenCalledWith(textarea);
    expect(documentStub.execCommand).toHaveBeenCalledWith("copy");
    expect(documentStub.body.removeChild).toHaveBeenCalledWith(textarea);
  });

  it("still removes the fallback textarea when text selection is blocked", async () => {
    const textarea = createTextarea();
    textarea.setSelectionRange.mockImplementation(() => {
      throw new Error("selection blocked");
    });
    const documentStub = {
      body: {
        appendChild: vi.fn(),
        removeChild: vi.fn()
      },
      createElement: vi.fn(() => textarea),
      execCommand: vi.fn(() => true)
    };

    vi.stubGlobal("navigator", {});
    vi.stubGlobal("document", documentStub);

    await expect(copyTextToClipboard("PlainDoc report")).resolves.toBe(true);

    expect(textarea.focus).toHaveBeenCalledOnce();
    expect(textarea.select).toHaveBeenCalledOnce();
    expect(textarea.setSelectionRange).toHaveBeenCalledWith(0, textarea.value.length);
    expect(documentStub.execCommand).toHaveBeenCalledWith("copy");
    expect(documentStub.body.removeChild).toHaveBeenCalledWith(textarea);
  });
});

function createTextarea() {
  return {
    value: "",
    style: {
      position: "",
      left: "",
      top: ""
    },
    focus: vi.fn(),
    select: vi.fn(),
    setAttribute: vi.fn(),
    setSelectionRange: vi.fn()
  };
}
