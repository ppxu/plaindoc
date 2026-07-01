import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const styles = readFileSync(fileURLToPath(new URL("../styles.css", import.meta.url)), "utf8");

describe("responsive layout chrome", () => {
  it("lets the main workspace and panels shrink inside mobile viewports", () => {
    expect(styles).toContain(".workspace {\n  display: grid;");
    expect(styles).toContain("grid-template-columns: minmax(360px, 0.78fr) minmax(0, 1.22fr);");
    expect(styles).toContain(".workspace {\n  display: grid;\n  min-width: 0;");
    expect(styles).toContain(".input-panel,\n.report-panel {\n  min-width: 0;");
  });

  it("switches the workspace to a single column at tablet width", () => {
    expect(styles).toContain("@media (max-width: 980px)");
    expect(styles).toContain(".workspace {\n    grid-template-columns: minmax(0, 1fr);");
  });
});
