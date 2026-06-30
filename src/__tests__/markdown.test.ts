import { describe, expect, it } from "vitest";
import { analyzeDocument } from "../analyzer/localAnalyzer";
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
});
