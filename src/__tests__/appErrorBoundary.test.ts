import { describe, expect, it } from "vitest";
import mainSource from "../main.tsx?raw";
import errorBoundarySource from "../components/AppErrorBoundary.tsx?raw";

describe("app error boundary", () => {
  it("wraps the app shell with a recoverable runtime fallback", () => {
    expect(mainSource).toContain("AppErrorBoundary");
    expect(mainSource).toContain("<AppErrorBoundary>");
    expect(mainSource).toContain("<App />");

    expect(errorBoundarySource).toContain("PlainDoc 遇到问题");
    expect(errorBoundarySource).toContain("刷新页面");
    expect(errorBoundarySource).toContain("清除本机数据并刷新");
    expect(errorBoundarySource).toContain("clearLocalStoredData()");
    expect(errorBoundarySource).toContain('role="alert"');
  });
});
