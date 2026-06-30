import { describe, expect, it } from "vitest";
import appSource from "../App.tsx?raw";
import documentInputSource from "../components/DocumentInput.tsx?raw";

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

  it("supports dropping a PDF or text file onto the upload strip", () => {
    expect(documentInputSource).toContain("handleUploadDrop");
    expect(documentInputSource).toContain("handleUploadDragOver");
    expect(documentInputSource).toContain("handleUploadDragEnter");
    expect(documentInputSource).toContain("handleUploadDragLeave");
    expect(documentInputSource).toContain("event.preventDefault();");
    expect(documentInputSource).toContain("const files = event.dataTransfer.files;");
    expect(documentInputSource).toContain("const file = files?.[0];");
    expect(documentInputSource).toContain("onUpload(file, { ignoredFileCount });");
    expect(documentInputSource).toContain("onDrop={handleUploadDrop}");
    expect(documentInputSource).toContain("onDragOver={handleUploadDragOver}");
    expect(documentInputSource).toContain("onDragEnter={handleUploadDragEnter}");
    expect(documentInputSource).toContain("onDragLeave={handleUploadDragLeave}");
    expect(documentInputSource).toContain('aria-label="上传或拖入 PDF、txt、md 文件"');
    expect(documentInputSource).toContain('isUploadDragActive ? "upload-strip drag-active" : "upload-strip"');
    expect(documentInputSource).toContain("点击上传或拖入 PDF / .txt / .md 文件");
    expect(documentInputSource).toContain("松开即可读取文件");
  });

  it("passes the ignored file count when multiple files are dropped", () => {
    expect(documentInputSource).toContain("const files = event.dataTransfer.files;");
    expect(documentInputSource).toContain("const file = files?.[0];");
    expect(documentInputSource).toContain("const ignoredFileCount = Math.max(0, files.length - 1);");
    expect(documentInputSource).toContain("onUpload(file, { ignoredFileCount });");
  });

  it("sets scanner PDF expectations before upload", () => {
    expect(documentInputSource).toContain("支持可选中文本 PDF");
    expect(documentInputSource).toContain("扫描版 PDF 或照片请先 OCR");
  });
});
