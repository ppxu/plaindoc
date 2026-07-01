import { describe, expect, it } from "vitest";
import { analyzeDocument } from "../analyzer/localAnalyzer";
import { mergeModelPayload } from "../analyzer/modelAnalyzer";
import clarifyingQuestionsSource from "../components/ClarifyingQuestions.tsx?raw";
import reportPanelSource from "../components/ReportPanel.tsx?raw";
import { documentExamples } from "../data/examples";
import { reportToMarkdown } from "../export/markdown";

describe("reportToMarkdown", () => {
  it("exports summary, risks, checklist, and disclaimer", () => {
    const example = documentExamples[0];
    const report = analyzeDocument({ text: example.content, kind: example.kind });
    const markdown = reportToMarkdown(report);

    expect(markdown).toContain("# PlainDoc 文件阅读报告");
    expect(markdown).toContain("## 优先处理");
    expect(markdown).toContain("## 风险提示");
    expect(markdown).toContain("**建议修改条款：**");
    expect(markdown).toContain("## 修改条款包");
    expect(markdown).toContain("## 签署前问题清单");
    expect(markdown).toContain("## 签前追问");
    expect(markdown).toContain("为什么要问：");
    expect(markdown).toContain("## 下一步行动");
    expect(markdown).toContain("### 可复制给对方的消息");
    expect(markdown).toContain("## 免责声明");
    expect(markdown).toContain(report.disclaimer);
  });

  it("exports report metadata needed for offline review and sharing", () => {
    const example = documentExamples[0];
    const report = analyzeDocument({ text: example.content, kind: example.kind });
    const markdown = reportToMarkdown(report);

    expect(markdown).toContain("## 报告信息");
    expect(markdown).toContain("**文件类型：**");
    expect(markdown).toContain("**生成时间：**");
    expect(markdown).toContain(report.generatedAt);
    expect(markdown).toContain(`**文本规模：** 约 ${report.wordCount} 字/词`);
    expect(markdown).toContain("**生成工具：** PlainDoc");
    expect(markdown).toContain("https://ppxu.github.io/plaindoc/");
    expect(markdown).not.toContain("字符线索");
  });

  it("explains that exported reports are not full document copies", () => {
    const example = documentExamples[0];
    const report = analyzeDocument({ text: example.content, kind: example.kind });
    const markdown = reportToMarkdown(report);

    expect(markdown).toContain("**导出范围：**");
    expect(markdown).toContain("不包含原始全文");
    expect(markdown).toContain("分享前请确认");
  });

  it("shows a visible reminder before users copy or export a report", () => {
    expect(reportPanelSource).toContain("report-share-actions");
    expect(reportPanelSource).toContain("report-share-reminder");
    expect(reportPanelSource).toContain("复制或导出前，请复核证据片段中是否仍有个人信息或敏感条款。");
  });

  it("renders clarifying questions as a dedicated report section", () => {
    expect(reportPanelSource).toContain("ClarifyingQuestions");
    expect(clarifyingQuestionsSource).toContain('<p className="section-label">追问</p>');
    expect(clarifyingQuestionsSource).toContain("签前追问");
  });

  it("exports coverage limits when no risk rule matched", () => {
    const report = analyzeDocument({
      text: "租房合同约定押金为人民币 5000 元，租期届满且水电结清后，甲方应在 7 日内退还剩余押金。",
      kind: "rental"
    });
    const markdown = reportToMarkdown(report);

    expect(report.findings).toHaveLength(0);
    expect(markdown).toContain("未命中不等于安全背书");
    expect(markdown).toContain("金额、期限、解除、违约、押金退还和维修责任");
  });

  it("exports coverage scope even when risk rules matched", () => {
    const example = documentExamples.find((item) => item.kind === "loan");
    const report = analyzeDocument({ text: example?.content ?? "", kind: "loan" });
    const markdown = reportToMarkdown(report);

    expect(report.findings.length).toBeGreaterThan(0);
    expect(markdown).toContain("## 覆盖范围");
    expect(markdown).toContain("PlainDoc 当前重点检查");
    expect(markdown).toContain("实际到账、综合成本、提前还款、逾期费用、担保责任和提前到期");
    expect(markdown).toContain("**未覆盖：** 地区法律差异、法院裁量、监管口径、附件真伪、签署主体资质和线下口头承诺。");
  });

  it("exports input completeness warnings for short document fragments", () => {
    const report = analyzeDocument({
      text: "押金 5000 元。提前退租赔偿两个月租金。",
      kind: "rental"
    });
    const markdown = reportToMarkdown(report);

    expect(report.inputWarnings).toHaveLength(1);
    expect(markdown).toContain("## 输入完整性");
    expect(markdown).toContain("输入内容可能不完整");
    expect(markdown).toContain("完整合同正文、附件、补充协议和签字页");
  });

  it("exports evidence coverage when some findings cannot be located in the source text", () => {
    const localReport = analyzeDocument({
      text: "押金 5000 元。甲方可根据情况扣除全部押金，乙方提前退租需赔偿两个月租金。",
      kind: "rental"
    });
    const report = mergeModelPayload(
      localReport,
      {
        findings: [
          {
            title: "模型补充但未定位原文的风险",
            severity: "yellow",
            explanation: "模型认为还需要确认口头承诺。",
            whyItMatters: "口头承诺很难在争议时证明。",
            suggestion: "要求对方写入正文或附件。"
          }
        ]
      },
      "test-model"
    );
    const markdown = reportToMarkdown(report);

    expect(markdown).toContain("## 证据覆盖");
    expect(markdown).toContain("1 个风险提示缺少可定位证据");
    expect(markdown).toContain("要求对方提供原文位置");
  });

  it("renders coverage scope as a fixed report section", () => {
    expect(reportPanelSource).toContain("coverage-boundary");
    expect(reportPanelSource).toContain("覆盖范围");
    expect(reportPanelSource).toContain("PlainDoc 当前重点检查");
  });

  it("renders input completeness warnings in the report panel", () => {
    expect(reportPanelSource).toContain("input-warning-list");
    expect(reportPanelSource).toContain("输入完整性");
    expect(reportPanelSource).toContain("warning.action");
  });

  it("renders evidence coverage in the report panel", () => {
    expect(reportPanelSource).toContain("evidence-coverage");
    expect(reportPanelSource).toContain("证据覆盖");
    expect(reportPanelSource).toContain("evidenceCoverage.action");
  });
});
