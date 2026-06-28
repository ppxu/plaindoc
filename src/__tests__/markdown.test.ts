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
    expect(markdown).toContain("## 风险提示");
    expect(markdown).toContain("## 签署前问题清单");
    expect(markdown).toContain("## 免责声明");
    expect(markdown).toContain(report.disclaimer);
  });
});

