export interface MarkdownDownloadAnchor {
  href: string;
  download: string;
  style: { display: string };
  click: () => void;
  remove: () => void;
}

export interface MarkdownDownloadTarget {
  createObjectUrl: (content: string, type: string) => string;
  revokeObjectUrl: (url: string) => void;
  createAnchor: () => MarkdownDownloadAnchor;
  appendAnchor: (anchor: MarkdownDownloadAnchor) => void;
}

const MARKDOWN_MIME_TYPE = "text/markdown;charset=utf-8";

export function downloadMarkdownFile(
  markdown: string,
  filename: string,
  target: MarkdownDownloadTarget = browserDownloadTarget()
): boolean {
  let url = "";
  let anchor: MarkdownDownloadAnchor | null = null;

  try {
    url = target.createObjectUrl(markdown, MARKDOWN_MIME_TYPE);
    anchor = target.createAnchor();
    anchor.href = url;
    anchor.download = filename;
    anchor.style.display = "none";
    target.appendAnchor(anchor);
    anchor.click();
    return true;
  } catch {
    return false;
  } finally {
    anchor?.remove();
    if (url) {
      target.revokeObjectUrl(url);
    }
  }
}

function browserDownloadTarget(): MarkdownDownloadTarget {
  return {
    createObjectUrl: (content, type) => URL.createObjectURL(new Blob([content], { type })),
    revokeObjectUrl: (url) => URL.revokeObjectURL(url),
    createAnchor: () => document.createElement("a"),
    appendAnchor: (anchor) => {
      document.body.appendChild(anchor as unknown as HTMLAnchorElement);
    }
  };
}
