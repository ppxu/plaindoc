import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import appSource from "../App.tsx?raw";
import reportPanelSource from "../components/ReportPanel.tsx?raw";

const styles = readFileSync(fileURLToPath(new URL("../styles.css", import.meta.url)), "utf8");

describe("accessibility chrome", () => {
  it("provides a keyboard skip link to the report panel", () => {
    expect(appSource).toContain('href="#report-panel"');
    expect(appSource).toContain("跳到报告");
    expect(reportPanelSource).toContain('id="report-panel"');
    expect(reportPanelSource).toContain('tabIndex={-1}');
    expect(styles).toContain(".skip-link:focus");
  });
});
