export interface SensitiveTextSummary {
  hasSensitiveText: boolean;
  labels: string[];
}

interface SensitiveTextRule {
  label: string;
  test: (text: string) => boolean;
  redact: (text: string) => string;
}

const sensitiveTextRules: SensitiveTextRule[] = [
  {
    label: "手机号",
    test: (text) => phoneDetectPattern.test(text),
    redact: (text) => text.replace(phonePattern, (_match, prefix = "") => `${prefix}[手机号]`)
  },
  {
    label: "邮箱",
    test: (text) => emailDetectPattern.test(text),
    redact: (text) => text.replace(emailPattern, "[邮箱]")
  },
  {
    label: "身份证号",
    test: (text) => idNumberDetectPattern.test(text),
    redact: (text) => text.replace(idNumberPattern, "[身份证号]")
  },
  {
    label: "银行卡号",
    test: hasBankCardCandidate,
    redact: redactBankCards
  }
];

const phoneDetectPattern = /(?:^|[^\d])(?:\+?86[-\s]?)?1[3-9]\d{9}(?!\d)/;
const phonePattern = /(^|[^\d])(?:\+?86[-\s]?)?1[3-9]\d{9}(?!\d)/g;
const emailDetectPattern = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i;
const emailPattern = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;
const idNumberDetectPattern = /\b\d{6}(?:19|20)\d{2}(?:0[1-9]|1[0-2])(?:0[1-9]|[12]\d|3[01])\d{3}[\dXx]\b/;
const idNumberPattern = /\b\d{6}(?:19|20)\d{2}(?:0[1-9]|1[0-2])(?:0[1-9]|[12]\d|3[01])\d{3}[\dXx]\b/g;
const bankCardPattern = /\b(?:\d[ -]?){16,19}\b/g;

export function detectSensitiveText(text: string): SensitiveTextSummary {
  const labels = sensitiveTextRules
    .filter((rule) => rule.test(text))
    .map((rule) => rule.label);

  return {
    hasSensitiveText: labels.length > 0,
    labels
  };
}

export function redactSensitiveText(text: string): string {
  return sensitiveTextRules.reduce((current, rule) => rule.redact(current), text);
}

function hasBankCardCandidate(text: string): boolean {
  const candidates = text.match(bankCardPattern) ?? [];

  return candidates.some((candidate) => {
    const digits = candidate.replace(/\D/g, "");
    return digits.length >= 16 && digits.length <= 19 && isLikelyBankCardPrefix(digits);
  });
}

function isLikelyBankCardPrefix(digits: string): boolean {
  return digits.startsWith("62") || digits.startsWith("4") || digits.startsWith("5") || digits.startsWith("3");
}

function redactBankCards(text: string): string {
  return text.replace(bankCardPattern, (candidate) => {
    const digits = candidate.replace(/\D/g, "");
    return digits.length >= 16 && digits.length <= 19 && isLikelyBankCardPrefix(digits) ? "[银行卡号]" : candidate;
  });
}
