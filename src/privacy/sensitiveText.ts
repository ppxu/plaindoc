export interface SensitiveTextSummary {
  hasSensitiveText: boolean;
  labels: string[];
}

interface SensitiveTextRule {
  label: string;
  test: (text: string) => boolean;
}

const sensitiveTextRules: SensitiveTextRule[] = [
  {
    label: "手机号",
    test: (text) => /(?:^|[^\d])(?:\+?86[-\s]?)?1[3-9]\d{9}(?!\d)/.test(text)
  },
  {
    label: "邮箱",
    test: (text) => /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i.test(text)
  },
  {
    label: "身份证号",
    test: (text) => /\b\d{6}(?:19|20)\d{2}(?:0[1-9]|1[0-2])(?:0[1-9]|[12]\d|3[01])\d{3}[\dXx]\b/.test(text)
  },
  {
    label: "银行卡号",
    test: hasBankCardCandidate
  }
];

export function detectSensitiveText(text: string): SensitiveTextSummary {
  const labels = sensitiveTextRules
    .filter((rule) => rule.test(text))
    .map((rule) => rule.label);

  return {
    hasSensitiveText: labels.length > 0,
    labels
  };
}

function hasBankCardCandidate(text: string): boolean {
  const candidates = text.match(/\b(?:\d[ -]?){16,19}\b/g) ?? [];

  return candidates.some((candidate) => {
    const digits = candidate.replace(/\D/g, "");
    return digits.length >= 16 && digits.length <= 19 && isLikelyBankCardPrefix(digits);
  });
}

function isLikelyBankCardPrefix(digits: string): boolean {
  return digits.startsWith("62") || digits.startsWith("4") || digits.startsWith("5") || digits.startsWith("3");
}
