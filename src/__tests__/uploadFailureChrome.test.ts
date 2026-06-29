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
});
