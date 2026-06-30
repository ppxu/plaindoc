import { describe, expect, it } from "vitest";
import appSource from "../App.tsx?raw";
import documentInputSource from "../components/DocumentInput.tsx?raw";

describe("local data reset chrome", () => {
  it("wires a one-click local data clearing action into the input panel", () => {
    expect(appSource).toContain("handleClearLocalData");
    expect(appSource).toContain("confirmLocalDataReset()");
    expect(appSource).toContain("确定要清除本机数据吗？");
    expect(appSource).toContain("clearLocalStoredData()");
    expect(appSource).toContain("createLocalDataResetState()");
    expect(appSource).toContain("invalidateCurrentAnalysis()");
    expect(appSource).toContain("onClearLocalData={handleClearLocalData}");

    expect(documentInputSource).toContain("清除本机数据");
    expect(documentInputSource).toContain("onClearLocalData");
    const clearLocalDataButton = documentInputSource.slice(
      documentInputSource.indexOf("onClick={onClearLocalData}"),
      documentInputSource.indexOf('title="清除当前正文、报告历史、模型设置和 AI 发送确认"')
    );
    expect(clearLocalDataButton).toContain("disabled={isUploading}");
    expect(clearLocalDataButton).not.toContain("isAnalyzing");
  });

  it("returns focus to the document text field after local data is cleared", () => {
    const clearLocalDataHandler = appSource.slice(
      appSource.indexOf("function handleClearLocalData"),
      appSource.indexOf("async function handleAnalyze")
    );

    expect(clearLocalDataHandler).toContain("const reset = createLocalDataResetState();");
    expect(clearLocalDataHandler).toContain("setDocumentTextFocusRequest((request) => request + 1);");
    expect(clearLocalDataHandler.indexOf("const reset = createLocalDataResetState();")).toBeLessThan(
      clearLocalDataHandler.indexOf("setDocumentTextFocusRequest((request) => request + 1);")
    );
  });
});
