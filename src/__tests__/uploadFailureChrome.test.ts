import { describe, expect, it } from "vitest";
import appSource from "../App.tsx?raw";

describe("upload failure chrome", () => {
  it("clears stale upload notices before validating a new upload", () => {
    const uploadHandler = appSource.slice(
      appSource.indexOf("async function handleUpload"),
      appSource.indexOf("async function copyChecklist")
    );

    expect(uploadHandler).toContain('setError("");');
    expect(uploadHandler).toContain('setInputNotice("");');
    expect(uploadHandler.indexOf('setError("");')).toBeLessThan(uploadHandler.indexOf("file.size > MAX_UPLOAD_BYTES"));
    expect(uploadHandler.indexOf('setInputNotice("");')).toBeLessThan(
      uploadHandler.indexOf("file.size > MAX_UPLOAD_BYTES")
    );
    expect(uploadHandler.indexOf('setInputNotice("");')).toBeLessThan(uploadHandler.indexOf("!isPdfUpload && !isTextFile"));
  });

  it("revokes AI send confirmation before any upload validation can fail", () => {
    const uploadHandler = appSource.slice(
      appSource.indexOf("async function handleUpload"),
      appSource.indexOf("async function copyChecklist")
    );

    expect(uploadHandler).toContain("setModelTextConsent(false);");
    expect(uploadHandler.indexOf("setModelTextConsent(false);")).toBeLessThan(uploadHandler.indexOf("file.size > MAX_UPLOAD_BYTES"));
    expect(uploadHandler.indexOf("setModelTextConsent(false);")).toBeLessThan(uploadHandler.indexOf("!isPdfUpload && !isTextFile"));
    expect(uploadHandler.indexOf("setModelTextConsent(false);")).toBeLessThan(uploadHandler.indexOf("!fileText.trim()"));
  });

  it("explains that failed uploads leave the current text and report unchanged", () => {
    const uploadHandler = appSource.slice(
      appSource.indexOf("async function handleUpload"),
      appSource.indexOf("async function copyChecklist")
    );

    expect(uploadHandler).toContain("showUploadFailureUnchangedNotice();");
    expect(uploadHandler.indexOf("showUploadFailureUnchangedNotice();")).toBeLessThan(
      uploadHandler.indexOf("文件超过 20MB")
    );
    expect(uploadHandler.indexOf("showUploadFailureUnchangedNotice();", uploadHandler.indexOf("!isPdfUpload && !isTextFile"))).toBeLessThan(
      uploadHandler.indexOf("当前支持 PDF、.txt、.md 和纯文本文件")
    );
    expect(uploadHandler.indexOf("showUploadFailureUnchangedNotice();", uploadHandler.indexOf("!fileText.trim()"))).toBeLessThan(
      uploadHandler.indexOf("没有从文件中读取到可分析文本")
    );
    expect(uploadHandler.indexOf("showUploadFailureUnchangedNotice();", uploadHandler.indexOf("} catch {"))).toBeLessThan(
      uploadHandler.indexOf("文件读取失败")
    );
    expect(appSource).toContain("function showUploadFailureUnchangedNotice()");
    expect(appSource).toContain('setInputNotice("当前正文和报告未改变。");');
  });

  it("ignores stale asynchronous upload reads after the workspace changes", () => {
    const uploadHandler = appSource.slice(
      appSource.indexOf("async function handleUpload"),
      appSource.indexOf("async function copyChecklist")
    );
    const invalidateHandler = appSource.slice(
      appSource.indexOf("function invalidateCurrentAnalysis()"),
      appSource.indexOf("function abortCurrentModelRequest()")
    );

    expect(uploadHandler).toContain("const uploadRunId = beginUploadRead();");
    expect(uploadHandler).toContain("if (!isCurrentUploadRead(uploadRunId)) {");
    expect(uploadHandler).toContain("setReport(uploaded.report);");
    expect(uploadHandler.indexOf("if (!isCurrentUploadRead(uploadRunId)) {")).toBeLessThan(
      uploadHandler.indexOf("setReport(uploaded.report);")
    );
    expect(uploadHandler).toContain("if (isCurrentUploadRead(uploadRunId)) {");
    expect(uploadHandler).toContain("setIsUploading(false);");
    expect(invalidateHandler).toContain("invalidateCurrentUploadRead();");
    expect(appSource).toContain("function beginUploadRead(): number");
    expect(appSource).toContain("function isCurrentUploadRead(runId: number): boolean");
  });
});
