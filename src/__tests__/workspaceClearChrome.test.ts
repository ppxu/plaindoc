import { describe, expect, it } from "vitest";
import appSource from "../App.tsx?raw";
import documentInputSource from "../components/DocumentInput.tsx?raw";

describe("workspace clear chrome", () => {
  it("confirms before clearing the current document workspace", () => {
    expect(appSource).toContain("handleClearWorkspace");
    expect(appSource).toContain("confirmWorkspaceClear()");
    expect(appSource).toContain("确定要清空当前文件吗？");
    expect(appSource).toContain("不会删除最近报告历史或模型设置");
    expect(appSource).toContain("createClearedWorkspaceState()");

    expect(documentInputSource).toContain("清空当前文件");
    expect(documentInputSource).toContain("onClearWorkspace");
    expect(documentInputSource).toContain("disabled={isUploading || isAnalyzing || !canClearWorkspace}");
  });

  it("allows clearing a restored report even after history restore clears the editor text", () => {
    expect(appSource).toContain("const canClearWorkspace = hasCurrentWorkspaceContent(text, report);");
    expect(appSource).toContain("canClearWorkspace={canClearWorkspace}");
    expect(appSource).toContain("function hasCurrentWorkspaceContent(text: string, report: AnalysisReport): boolean");
    expect(appSource).toContain("return Boolean(text.trim() || report.wordCount || report.findings.length || report.facts.length);");

    expect(documentInputSource).toContain("canClearWorkspace: boolean;");
  });
});
