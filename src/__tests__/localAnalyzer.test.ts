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
    expect(report.clarifyingQuestions.some((item) => item.question.includes("押金扣除"))).toBe(true);
    expect(report.clarifyingQuestions[0].askBeforeSigning).toBe(true);
    expect(report.actionPlan.priority).toBe("high");
    expect(report.actionPlan.message).toContain("签署前想先确认");
  });

  it("does not flag ordinary deposit terms as broad deduction risk", () => {
    const report = analyzeDocument({
      text: "租房合同约定押金为人民币 5000 元，租期届满且水电结清后，甲方应在 7 日内退还剩余押金。",
      kind: "rental"
    });

    expect(report.findings.some((finding) => finding.id === "rental-broad-deposit-deduction")).toBe(false);
  });

  it("does not flag documented deposit deductions as broad deduction risk", () => {
    const report = analyzeDocument({
      text: "租房合同约定押金扣除仅限未付租金、水电燃气费和经双方确认的人为损坏维修费用；甲方应提供发票、报价单或双方确认记录，并在退租交接后 7 日内退还剩余押金。",
      kind: "rental"
    });

    expect(report.findings.some((finding) => finding.id === "rental-broad-deposit-deduction")).toBe(false);
  });

  it("does not flag ordinary liquidated-damages wording as early-exit penalty risk", () => {
    const report = analyzeDocument({
      text: "租房合同约定任一方违约时，应按照实际损失承担违约金或赔偿责任。合同到期后正常交还房屋。",
      kind: "rental"
    });

    expect(report.findings.some((finding) => finding.id === "rental-large-early-exit-penalty")).toBe(false);
  });

  it("does not flag capped early exit terms as high penalty risk", () => {
    const report = analyzeDocument({
      text: "租房合同约定乙方提前退租应提前 30 日书面通知甲方；甲方可要求乙方承担实际空置损失，但违约金最高不超过一个月租金，押金扣除、违约金和实际损失不得重复计算。",
      kind: "rental"
    });

    expect(report.findings.some((finding) => finding.id === "rental-large-early-exit-penalty")).toBe(false);
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

  it("does not flag landlord-covered aging repairs as tenant repair burden", () => {
    const report = analyzeDocument({
      text: "租房合同约定承租人仅对人为使用不当造成的损坏负责；房屋主体结构、设施自然老化或非人为损坏由甲方负责维修。",
      kind: "rental"
    });

    expect(report.findings.some((finding) => finding.id === "rental-tenant-pays-all-repairs")).toBe(false);
  });

  it("flags vague non-compete compensation in employment agreements", () => {
    const example = documentExamples.find((item) => item.kind === "employment");
    const report = analyzeDocument({ text: example?.content ?? "", kind: "employment" });

    expect(report.findings.some((finding) => finding.id === "employment-non-compete-vague-compensation")).toBe(true);
    expect(report.status).toBe("do_not_sign_directly");
  });

  it("does not flag scoped paid non-compete terms as vague compensation", () => {
    const report = analyzeDocument({
      text: "劳动协议约定竞业限制仅适用于双方书面列明的竞争公司、地区和岗位，期限为离职后六个月，公司按月支付明确补偿金人民币 8000 元；公司未按期支付补偿的，员工不再受该限制约束。",
      kind: "employment"
    });

    expect(report.findings.some((finding) => finding.id === "employment-non-compete-vague-compensation")).toBe(false);
  });

  it("does not flag statutory thirty-day resignation notice as long notice", () => {
    const report = analyzeDocument({
      text: "劳动协议约定员工离职按适用法律法规执行，提前 30 日以书面通知公司并完成合理交接。",
      kind: "employment"
    });

    expect(report.findings.some((finding) => finding.id === "employment-long-notice")).toBe(false);
  });

  it("does not flag ordinary employment compensation wording as high liquidated damages", () => {
    const report = analyzeDocument({
      text: "劳动协议约定员工因故意或重大过失造成实际损失的，应按可证明的实际损失承担赔偿责任。",
      kind: "employment"
    });

    expect(report.findings.some((finding) => finding.id === "employment-high-liquidated-damages")).toBe(false);
  });

  it("flags front-loaded renovation payment risk", () => {
    const example = documentExamples.find((item) => item.kind === "renovation");
    const report = analyzeDocument({ text: example?.content ?? "", kind: "renovation" });

    expect(report.findings.some((finding) => finding.id === "renovation-front-loaded-payment")).toBe(true);
    expect(report.facts.length).toBeGreaterThan(0);
  });

  it("does not flag ordinary renovation deposit milestones as front-loaded payment", () => {
    const report = analyzeDocument({
      text: "装修合同约定签约当日支付总价 10% 作为定金，水电验收后支付 30%，竣工验收合格后支付尾款。",
      kind: "renovation"
    });

    expect(report.findings.some((finding) => finding.id === "renovation-front-loaded-payment")).toBe(false);
  });

  it("does not flag low first payment with later large milestone as front-loaded", () => {
    const report = analyzeDocument({
      text: "装修合同约定签约当日支付总价 10% 作为首期款，材料进场并经业主确认后支付 30%，水电验收合格后支付 60%。",
      kind: "renovation"
    });

    expect(report.findings.some((finding) => finding.id === "renovation-front-loaded-payment")).toBe(false);
  });

  it("does not flag confirmed renovation change orders as open-ended charges", () => {
    const report = analyzeDocument({
      text: "装修合同约定任何增项必须先由承包方提交报价单，经业主书面确认后方可施工和收费。",
      kind: "renovation"
    });

    expect(report.findings.some((finding) => finding.id === "renovation-open-ended-change-orders")).toBe(false);
  });

  it("does not flag prohibited unconfirmed change work as open-ended charges", () => {
    const report = analyzeDocument({
      text: "装修合同约定任何增项未经业主书面确认不得先行施工，未经确认的费用不得在结算时计入总价，业主有权拒绝支付。",
      kind: "renovation"
    });

    expect(report.findings.some((finding) => finding.id === "renovation-open-ended-change-orders")).toBe(false);
  });

  it("does not flag signed renovation acceptance milestones as deemed pass", () => {
    const report = analyzeDocument({
      text: "装修合同约定工程完工后由双方按合同标准共同验收，双方签字确认验收合格后支付尾款。",
      kind: "renovation"
    });

    expect(report.findings.some((finding) => finding.id === "renovation-acceptance-deemed-pass")).toBe(false);
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

  it("does not flag separately paid loan service fees as deducted principal", () => {
    const report = analyzeDocument({
      text: "借款合同约定借款本金为人民币 10 万元，平台服务费为 500 元，由借款人另行支付，不从借款本金中扣除。",
      kind: "loan"
    });

    expect(report.findings.some((finding) => finding.id === "loan-fees-deducted-from-principal")).toBe(false);
  });

  it("does not flag no-fee early repayment as costly prepayment", () => {
    const report = analyzeDocument({
      text: "借款合同约定借款人可提前还款，利息按实际占用天数计算，不收提前还款手续费，也不收剩余期限利息。",
      kind: "loan"
    });

    expect(report.findings.some((finding) => finding.id === "loan-costly-prepayment")).toBe(false);
  });

  it("does not flag single capped overdue interest as stacked charges", () => {
    const report = analyzeDocument({
      text: "借款合同约定逾期时仅按实际逾期本金计收罚息，不重复收取违约金、催收费或其他费用。",
      kind: "loan"
    });

    expect(report.findings.some((finding) => finding.id === "loan-stacked-overdue-charges")).toBe(false);
  });

  it("does not flag scheduled balloon repayment as broad acceleration", () => {
    const report = analyzeDocument({
      text: "借款合同约定借款期限届满时，借款人应一次性清偿剩余本金和按实际占用天数计算的利息。",
      kind: "loan"
    });

    expect(report.findings.some((finding) => finding.id === "loan-broad-acceleration-clause")).toBe(false);
  });

  it("does not flag loan acceleration with written notice and cure period", () => {
    const report = analyzeDocument({
      text: "借款合同约定借款人逾期达到 10 日后，出借人应先书面催告并给予 5 日宽限期；宽限期届满仍未清偿的，出借人才可宣布剩余借款提前到期。",
      kind: "loan"
    });

    expect(report.findings.some((finding) => finding.id === "loan-broad-acceleration-clause")).toBe(false);
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

  it("does not flag guaranteed insurance renewal as not guaranteed", () => {
    const report = analyzeDocument({
      text: "保险条款约定本产品保证续保 6 年，保证续保期间内保险人不得因被保险人发生理赔而拒绝续保。",
      kind: "insurance"
    });

    expect(report.findings.some((finding) => finding.id === "insurance-renewal-not-guaranteed")).toBe(false);
  });

  it("does not flag separately defined and accepted prior conditions as broad exclusion", () => {
    const report = analyzeDocument({
      text: "保险条款分别定义等待期和既往症；投保时已如实告知且保险人承保的事项，不得再作为拒赔理由。",
      kind: "insurance"
    });

    expect(report.findings.some((finding) => finding.id === "insurance-broad-waiting-period-exclusion")).toBe(false);
  });

  it("does not flag flexible claim notice wording as a short refusal window", () => {
    const report = analyzeDocument({
      text: "保险条款约定发生保险事故后，投保人或受益人应在 10 日内通知保险人；因抢救、住院或其他客观原因未能及时通知的，可在合理期限内补充说明，保险人不得仅因迟延通知拒赔。",
      kind: "insurance"
    });

    expect(report.findings.some((finding) => finding.id === "insurance-short-claim-notice-window")).toBe(false);
  });

  it("does not flag clear occupation change handling as a broad activity exclusion", () => {
    const report = analyzeDocument({
      text: "保险条款约定被保险人发生职业变更时，应通过客服电话或线上服务通知保险人；保险人应在 5 个工作日内书面告知继续承保、加费承保或解除合同的处理结果。",
      kind: "insurance"
    });

    expect(report.findings.some((finding) => finding.id === "insurance-broad-activity-occupation-exclusion")).toBe(false);
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
