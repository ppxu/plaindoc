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
});
