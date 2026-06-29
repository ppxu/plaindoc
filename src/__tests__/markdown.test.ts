import { describe, expect, it } from "vitest";
import { analyzeDocument } from "../analyzer/localAnalyzer";
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
    expect(markdown).toContain(`**文本规模：** ${report.wordCount} 字符线索`);
  });
});
