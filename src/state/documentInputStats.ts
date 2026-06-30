export function formatDocumentInputStats(text: string): string {
  const characterCount = text.trim().length;
  if (!characterCount) {
    return "尚未输入正文";
  }
  return `已输入 ${characterCount} 个字符`;
}
