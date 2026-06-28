export interface PdfTextItem {
  str?: unknown;
  hasEOL?: unknown;
}

export function isPdfFile(file: File): boolean {
  return file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
}

export function normalizePdfTextItems(items: PdfTextItem[]): string {
  let text = "";

  for (const item of items) {
    if (typeof item.str !== "string") {
      continue;
    }

    const value = item.str.trim();
    if (!value) {
      continue;
    }

    if (text && !/[（(《「『“\s]$/.test(text) && !/^[，。！？；：、,.!?;:）)》」』”]/.test(value)) {
      text += " ";
    }

    text += value;

    if (item.hasEOL) {
      text += "\n";
    }
  }

  return text
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
