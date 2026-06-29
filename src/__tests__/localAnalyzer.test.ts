import { describe, expect, it } from "vitest";
import { analyzeDocument } from "../analyzer/localAnalyzer";
import { documentExamples } from "../data/examples";

describe("analyzeDocument", () => {
  it("returns a validation-style report for empty input", () => {
    const report = analyzeDocument({ text: "", kind: "rental" });

    expect(report.score).toBe(0);
    expect(report.findings).toHaveLength(0);
    expect(report.summary).toContain("请先粘贴");
  });

  it("flags broad deposit deduction in rental contracts", () => {
    const example = documentExamples.find((item) => item.kind === "rental");
    const report = analyzeDocument({ text: example?.content ?? "", kind: "rental" });

    expect(report.findings.some((finding) => finding.id === "rental-broad-deposit-deduction")).toBe(true);
    expect(report.findings.find((finding) => finding.id === "rental-broad-deposit-deduction")?.modification).toContain("押金");
    expect(report.checklist.some((item) => item.question.includes("押金"))).toBe(true);
    expect(report.actionPlan.priority).toBe("high");
    expect(report.actionPlan.message).toContain("签署前想先确认");
  });

  it("does not run other document-type rule packs for a known rental contract", () => {
    const report = analyzeDocument({
      text: "租房合同约定押金可直接扣除，提前退租需书面通知并承担违约金和赔偿责任。",
      kind: "rental"
    });
    const findingIds = report.findings.map((finding) => finding.id);
    const checklistQuestions = report.checklist.map((item) => item.question);

    expect(findingIds).toContain("rental-broad-deposit-deduction");
    expect(findingIds).not.toContain("employment-long-notice");
    expect(findingIds).not.toContain("employment-high-liquidated-damages");
    expect(checklistQuestions.some((question) => question.includes("离职通知期"))).toBe(false);
    expect(checklistQuestions.some((question) => question.includes("触发违约金"))).toBe(false);
  });

  it("flags vague non-compete compensation in employment agreements", () => {
    const example = documentExamples.find((item) => item.kind === "employment");
    const report = analyzeDocument({ text: example?.content ?? "", kind: "employment" });

    expect(report.findings.some((finding) => finding.id === "employment-non-compete-vague-compensation")).toBe(true);
    expect(report.status).toBe("do_not_sign_directly");
  });

  it("flags front-loaded renovation payment risk", () => {
    const example = documentExamples.find((item) => item.kind === "renovation");
    const report = analyzeDocument({ text: example?.content ?? "", kind: "renovation" });

    expect(report.findings.some((finding) => finding.id === "renovation-front-loaded-payment")).toBe(true);
    expect(report.facts.length).toBeGreaterThan(0);
  });

  it("extracts percentage facts for payment milestones and rate clauses", () => {
    const report = analyzeDocument({
      text: "装修合同约定工程总价为人民币 20 万元，签约当日支付总价60%作为首期款，竣工验收后支付40%尾款。",
      kind: "renovation"
    });
    const proportionFacts = report.facts.filter((fact) => fact.label.includes("比例")).map((fact) => fact.value);

    expect(proportionFacts).toContain("60%");
    expect(proportionFacts).toContain("40%");
  });

  it("extracts full-width percentage facts from copied Chinese documents", () => {
    const report = analyzeDocument({
      text: "装修合同约定签约当日支付总价60％作为首期款，竣工验收后支付40％尾款。",
      kind: "renovation"
    });
    const proportionFacts = report.facts.filter((fact) => fact.label.includes("比例")).map((fact) => fact.value);

    expect(proportionFacts).toContain("60％");
    expect(proportionFacts).toContain("40％");
  });

  it("extracts facts that use full-width digits from copied PDFs", () => {
    const report = analyzeDocument({
      text: "装修合同约定工程总价为人民币２０万元，签约当日支付６０％首期款，工期自２０２６年７月１日起算。",
      kind: "renovation"
    });
    const factValues = report.facts.map((fact) => fact.value);

    expect(factValues).toContain("人民币２０万元");
    expect(factValues).toContain("６０％");
    expect(factValues).toContain("２０２６年７月１日");
  });

  it("extracts Chinese numeral deadlines and duration terms", () => {
    const report = analyzeDocument({
      text: "装修合同约定签约后十五日内支付定金，工程质保期为二十四个月，验收后开始计算。",
      kind: "renovation"
    });
    const deadlineFacts = report.facts.filter((fact) => fact.label.includes("期限")).map((fact) => fact.value);

    expect(deadlineFacts).toContain("十五日内");
    expect(deadlineFacts).toContain("二十四个月");
  });

  it("keeps full Chinese calendar dates as deadline facts", () => {
    const report = analyzeDocument({
      text: "租赁期限自二〇二六年七月一日起至二〇二七年六月三十日止，承租人应按月支付租金。",
      kind: "rental"
    });
    const deadlineFacts = report.facts.filter((fact) => fact.label.includes("期限")).map((fact) => fact.value);

    expect(deadlineFacts).toContain("二〇二六年七月一日");
    expect(deadlineFacts).toContain("二〇二七年六月三十日");
    expect(deadlineFacts).not.toContain("二〇二六年");
    expect(deadlineFacts).not.toContain("七月");
  });

  it("flags stacked charges and acceleration in loan agreements", () => {
    const example = documentExamples.find((item) => item.kind === "loan");
    const report = analyzeDocument({ text: example?.content ?? "", kind: "loan" });

    expect(report.findings.some((finding) => finding.id === "loan-stacked-overdue-charges")).toBe(true);
    expect(report.findings.some((finding) => finding.id === "loan-broad-acceleration-clause")).toBe(true);
    expect(report.findings.find((finding) => finding.id === "loan-fees-deducted-from-principal")?.modification).toContain("本金");
    expect(report.actionPlan.priority).toBe("high");
  });

  it("extracts Chinese ten-thousand-unit and decimal money amounts without truncation", () => {
    const report = analyzeDocument({
      text: "借款本金为人民币 10 万元，平台服务费为1.5万元，逾期后还需支付罚息。",
      kind: "loan"
    });
    const factValues = report.facts.map((fact) => fact.value);

    expect(factValues).toContain("人民币 10 万元");
    expect(factValues).toContain("1.5万元");
    expect(factValues).not.toContain("人民币 10");
    expect(factValues).not.toContain("5万元");
  });

  it("extracts Chinese numeral and formal money amounts", () => {
    const report = analyzeDocument({
      text: "借款本金为人民币壹拾万元整，逾期违约金为二万元，借款人应按期偿还。",
      kind: "loan"
    });
    const factValues = report.facts.map((fact) => fact.value);

    expect(factValues).toContain("人民币壹拾万元整");
    expect(factValues).toContain("二万元");
  });

  it("flags waiting-period and renewal risks in insurance policies", () => {
    const example = documentExamples.find((item) => item.kind === "insurance");
    const report = analyzeDocument({ text: example?.content ?? "", kind: "insurance" });

    expect(report.summary).toContain("保险文件");
    expect(report.findings.some((finding) => finding.id === "insurance-broad-waiting-period-exclusion")).toBe(true);
    expect(report.findings.some((finding) => finding.id === "insurance-renewal-not-guaranteed")).toBe(true);
    expect(report.findings.find((finding) => finding.id === "insurance-short-claim-notice-window")?.modification).toContain("合理期限");
    expect(report.actionPlan.priority).toBe("high");
  });
});
