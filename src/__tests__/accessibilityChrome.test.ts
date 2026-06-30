import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import appSource from "../App.tsx?raw";
import reportPanelSource from "../components/ReportPanel.tsx?raw";
import modelSettingsPanelSource from "../components/ModelSettingsPanel.tsx?raw";

const styles = readFileSync(fileURLToPath(new URL("../styles.css", import.meta.url)), "utf8");

describe("accessibility chrome", () => {
  it("provides a keyboard skip link to the report panel", () => {
    expect(appSource).toContain('href="#report-panel"');
    expect(appSource).toContain("跳到报告");
    expect(reportPanelSource).toContain('id="report-panel"');
    expect(reportPanelSource).toContain('tabIndex={-1}');
    expect(styles).toContain(".skip-link:focus");
  });

  it("moves focus to the report only after an explicit analysis run", () => {
    expect(appSource).toContain("const reportPanelRef = useRef<HTMLElement | null>(null)");
    expect(appSource).toContain("focusReportPanel(reportPanelRef)");
    expect(reportPanelSource).toContain("forwardRef<HTMLElement, ReportPanelProps>");
    expect(reportPanelSource).toContain("ref={ref}");

    const textChangeHandler = appSource.slice(
      appSource.indexOf("function handleTextChange"),
      appSource.indexOf("function handleKindChange")
    );
    const exampleChangeHandler = appSource.slice(
      appSource.indexOf("function handleExampleChange"),
      appSource.indexOf("function handleTextChange")
    );
    expect(textChangeHandler).not.toContain("focusReportPanel");
    expect(exampleChangeHandler).not.toContain("focusReportPanel");
  });

  it("gives AI setting toggles stable accessible names", () => {
    expect(modelSettingsPanelSource).toContain('aria-label="启用 AI 增强分析"');
    expect(modelSettingsPanelSource).toContain('aria-label="记住 API key 到本机浏览器"');
    expect(modelSettingsPanelSource).toContain('aria-label="确认本次允许发送正文给模型服务"');
  });
});
