import { describe, expect, it, vi } from "vitest";
import { downloadMarkdownFile } from "../export/downloadMarkdown";

describe("downloadMarkdownFile", () => {
  it("downloads markdown and always releases the object URL", () => {
    const target = createDownloadTarget();

    expect(downloadMarkdownFile("# Report", "report.md", target)).toBe(true);

    expect(target.createObjectUrl).toHaveBeenCalledWith("# Report", "text/markdown;charset=utf-8");
    expect(target.anchor.href).toBe("blob:report");
    expect(target.anchor.download).toBe("report.md");
    expect(target.appendAnchor).toHaveBeenCalledWith(target.anchor);
    expect(target.anchor.click).toHaveBeenCalledOnce();
    expect(target.anchor.remove).toHaveBeenCalledOnce();
    expect(target.revokeObjectUrl).toHaveBeenCalledWith("blob:report");
  });

  it("reports failure and still cleans up when the browser blocks the click", () => {
    const target = createDownloadTarget();
    target.anchor.click.mockImplementation(() => {
      throw new Error("blocked");
    });

    expect(downloadMarkdownFile("# Report", "report.md", target)).toBe(false);

    expect(target.anchor.remove).toHaveBeenCalledOnce();
    expect(target.revokeObjectUrl).toHaveBeenCalledWith("blob:report");
  });
});

function createDownloadTarget() {
  const anchor = {
    href: "",
    download: "",
    style: { display: "" },
    click: vi.fn(),
    remove: vi.fn()
  };

  return {
    anchor,
    createObjectUrl: vi.fn(() => "blob:report"),
    revokeObjectUrl: vi.fn(),
    createAnchor: vi.fn(() => anchor),
    appendAnchor: vi.fn()
  };
}
