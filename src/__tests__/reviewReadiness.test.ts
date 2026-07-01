import { describe, expect, it } from "vitest";
import { analyzeDocument } from "../analyzer/localAnalyzer";
import { getReviewReadiness } from "../report/reviewReadiness";

describe("getReviewReadiness", () => {
  it("blocks signing flow when the report has incomplete input and red risks", () => {
    const report = analyzeDocument({
      text: "押金 5000 元。提前退租赔偿两个月租金。",
      kind: "rental"
    });
    const readiness = getReviewReadiness(report);

    expect(readiness.status).toBe("blocked");
    expect(readiness.title).toContain("先暂停签署");
    expect(readiness.checks.some((check) => check.id === "input-completeness" && check.status === "blocked")).toBe(true);
    expect(readiness.checks.some((check) => check.id === "red-risks" && check.status === "blocked")).toBe(true);
    expect(readiness.nextStep).toContain("补齐文件");
  });

  it("allows continued review when input is complete and no obvious risk matched", () => {
    const report = analyzeDocument({
      text: [
        "甲方张三与乙方李四签订租房合同，房屋地址为示例路 1 号。",
        "租期自 2026 年 7 月 1 日起至 2027 年 6 月 30 日止，月租金人民币 5000 元。",
        "押金人民币 5000 元，租期届满且水电燃气结清后 7 日内退还。",
        "房屋自然老化维修由甲方负责，乙方仅对人为损坏承担合理维修费用。",
        "双方签字后生效，附件包括房屋交接清单和家具家电清单。"
      ].join("\n"),
      kind: "rental"
    });
    const readiness = getReviewReadiness(report);

    expect(report.findings).toHaveLength(0);
    expect(report.inputWarnings).toHaveLength(0);
    expect(readiness.status).toBe("ready");
    expect(readiness.title).toContain("可以继续确认");
    expect(readiness.nextStep).toContain("保存合同、附件和对方书面回复");
  });
});
