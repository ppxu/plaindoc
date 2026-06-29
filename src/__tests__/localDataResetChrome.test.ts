import { describe, expect, it } from "vitest";
import appSource from "../App.tsx?raw";
import documentInputSource from "../components/DocumentInput.tsx?raw";

describe("local data reset chrome", () => {
  it("wires a one-click local data clearing action into the input panel", () => {
    expect(appSource).toContain("handleClearLocalData");
    expect(appSource).toContain("clearLocalStoredData()");
    expect(appSource).toContain("createLocalDataResetState()");
    expect(appSource).toContain("onClearLocalData={handleClearLocalData}");

    expect(documentInputSource).toContain("清除本机数据");
    expect(documentInputSource).toContain("onClearLocalData");
    expect(documentInputSource).toContain("disabled={isUploading || isAnalyzing}");
  });
});
