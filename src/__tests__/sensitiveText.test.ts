import { describe, expect, it } from "vitest";
import appSource from "../App.tsx?raw";
import documentInputSource from "../components/DocumentInput.tsx?raw";
import { detectSensitiveText, redactSensitiveText } from "../privacy/sensitiveText";

describe("detectSensitiveText", () => {
  it("detects common personal data before model sending", () => {
    const summary = detectSensitiveText(
      "承租人手机号 13812345678，邮箱 test@example.com，身份证 110105199003071234，银行卡 6222 8888 1234 5678。"
    );

    expect(summary).toEqual({
      hasSensitiveText: true,
      labels: ["手机号", "邮箱", "身份证号", "银行卡号"]
    });
  });

  it("does not flag ordinary contract amounts and dates", () => {
    const summary = detectSensitiveText(
      "租期为 2026 年 7 月 1 日至 2027 年 6 月 30 日，月租金为人民币 6800 元，押金为人民币 13600 元。"
    );

    expect(summary).toEqual({
      hasSensitiveText: false,
      labels: []
    });
  });

  it("does not treat an ID number as a bank card number", () => {
    const summary = detectSensitiveText("承租人身份证 110105199003071234。");

    expect(summary).toEqual({
      hasSensitiveText: true,
      labels: ["身份证号"]
    });
  });

  it("creates a local redacted copy without changing ordinary contract values", () => {
    const redacted = redactSensitiveText(
      "承租人手机号 13812345678，邮箱 test@example.com，身份证 110105199003071234，银行卡 6222 8888 1234 5678。押金为人民币 13600 元。"
    );

    expect(redacted).toBe(
      "承租人手机号 [手机号]，邮箱 [邮箱]，身份证 [身份证号]，银行卡 [银行卡号]。押金为人民币 13600 元。"
    );
  });

  it("routes the redacted-copy action through an explicit privacy feedback path", () => {
    expect(documentInputSource).toContain("onRedactSensitiveText: (text: string) => void");
    expect(documentInputSource).toContain("onRedactSensitiveText(redactSensitiveText(text))");
    expect(documentInputSource).not.toContain("onTextChange(redactSensitiveText(text))");

    expect(appSource).toContain("function handleRedactSensitiveText(redactedText: string)");
    expect(appSource).toContain("createDraftTextState({ text: redactedText, selectedKind: kind })");
    expect(appSource).toContain("已生成脱敏副本，并已取消本次 AI 发送确认。请检查正文后再重新确认发送。");
    expect(appSource).toContain("onRedactSensitiveText={handleRedactSensitiveText}");
  });
});
