export const MAX_MODEL_DOCUMENT_CHARS = 12000;

export interface PreparedModelDocumentText {
  text: string;
  originalLength: number;
  sentLength: number;
  truncated: boolean;
}

export function prepareModelDocumentText(text: string): PreparedModelDocumentText {
  const preparedText = text.slice(0, MAX_MODEL_DOCUMENT_CHARS);
  return {
    text: preparedText,
    originalLength: text.length,
    sentLength: preparedText.length,
    truncated: text.length > preparedText.length
  };
}
