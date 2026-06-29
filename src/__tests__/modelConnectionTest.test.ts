import { afterEach, describe, expect, it, vi } from "vitest";
import { testModelConnection } from "../analyzer/modelConnectionTest";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("model connection test", () => {
  it("sends a minimal remote model probe with authorization but no document text", async () => {
    let requestUrl = "";
    let requestBody: Record<string, unknown> | undefined;
    let requestHeaders: HeadersInit | undefined;
    const fetchMock = vi.fn(async (url: string | URL | Request, init?: RequestInit) => {
      requestUrl = String(url);
      requestHeaders = init?.headers;
      requestBody = JSON.parse(String(init?.body)) as Record<string, unknown>;
      return {
        ok: true,
        json: async () => ({
          choices: [{ message: { content: "{\"ok\":true}" } }]
        })
      } as Response;
    });
    vi.stubGlobal("fetch", fetchMock);

    const result = await testModelConnection(
      {
        enabled: true,
        baseUrl: " https://example.test/v1/ ",
        model: " test-model ",
        apiKey: " test-key ",
        rememberApiKey: false
      },
      { timeoutMs: 0 }
    );

    expect(result.ok).toBe(true);
    expect(result.message).toContain("连接测试通过");
    expect(requestUrl).toBe("https://example.test/v1/chat/completions");
    expect((requestHeaders as Record<string, string>).Authorization).toBe("Bearer test-key");
    expect(requestBody?.model).toBe("test-model");
    expect(JSON.stringify(requestBody)).not.toContain("押金");
    expect(JSON.stringify(requestBody)).not.toContain("合同正文");
  });

  it("allows local model probes without an authorization header", async () => {
    let requestHeaders: HeadersInit | undefined;
    const fetchMock = vi.fn(async (_url: string | URL | Request, init?: RequestInit) => {
      requestHeaders = init?.headers;
      return {
        ok: true,
        json: async () => ({ choices: [{ message: { content: "{\"ok\":true}" } }] })
      } as Response;
    });
    vi.stubGlobal("fetch", fetchMock);

    const result = await testModelConnection(
      {
        enabled: true,
        baseUrl: "http://localhost:11434/v1",
        model: "qwen2.5:7b",
        apiKey: " ",
        rememberApiKey: false
      },
      { timeoutMs: 0 }
    );

    expect(result.ok).toBe(true);
    expect((requestHeaders as Record<string, string>).Authorization).toBeUndefined();
  });

  it("retries once without response_format when a compatible service rejects it", async () => {
    const requestBodies: Array<Record<string, unknown>> = [];
    const fetchMock = vi.fn(async (_url: string | URL | Request, init?: RequestInit) => {
      requestBodies.push(JSON.parse(String(init?.body)) as Record<string, unknown>);
      if (requestBodies.length === 1) {
        return {
          ok: false,
          status: 400,
          text: async () => "unsupported parameter: response_format"
        } as Response;
      }
      return {
        ok: true,
        json: async () => ({ choices: [{ message: { content: "{\"ok\":true}" } }] })
      } as Response;
    });
    vi.stubGlobal("fetch", fetchMock);

    const result = await testModelConnection(
      {
        enabled: true,
        baseUrl: "http://localhost:11434/v1",
        model: "qwen2.5:7b",
        apiKey: "",
        rememberApiKey: false
      },
      { timeoutMs: 0 }
    );

    expect(result.ok).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(requestBodies[0].response_format).toEqual({ type: "json_object" });
    expect(requestBodies[1].response_format).toBeUndefined();
  });

  it("rejects successful HTTP responses that are not chat completion payloads", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        json: async () => ({ status: "ok" })
      }))
    );

    const result = await testModelConnection(
      {
        enabled: true,
        baseUrl: "http://localhost:11434/v1",
        model: "qwen2.5:7b",
        apiKey: "",
        rememberApiKey: false
      },
      { timeoutMs: 0 }
    );

    expect(result.ok).toBe(false);
    expect(result.message).toContain("没有返回 OpenAI-compatible chat completions 格式");
  });

  it("explains authentication failures separately from generic service errors", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({ ok: false, status: 401 }))
    );

    const result = await testModelConnection(
      {
        enabled: true,
        baseUrl: "https://example.test/v1",
        model: "test-model",
        apiKey: "wrong-key",
        rememberApiKey: false
      },
      { timeoutMs: 0 }
    );

    expect(result.ok).toBe(false);
    expect(result.message).toContain("API key");
    expect(result.message).toContain("401");
  });

  it("blocks remote model probes without an API key before calling fetch", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const result = await testModelConnection(
      {
        enabled: true,
        baseUrl: "https://example.test/v1",
        model: "test-model",
        apiKey: "",
        rememberApiKey: false
      },
      { timeoutMs: 0 }
    );

    expect(result.ok).toBe(false);
    expect(result.message).toContain("远程模型 endpoint 需要 API key");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("returns endpoint security errors before calling fetch", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const result = await testModelConnection(
      {
        enabled: true,
        baseUrl: "http://example.test/v1",
        model: "test-model",
        apiKey: "test-key",
        rememberApiKey: false
      },
      { timeoutMs: 0 }
    );

    expect(result.ok).toBe(false);
    expect(result.message).toContain("远程模型 endpoint 必须使用 HTTPS");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("explains local probe network failures without exposing raw fetch errors", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new TypeError("Failed to fetch");
      })
    );

    const result = await testModelConnection(
      {
        enabled: true,
        baseUrl: "http://localhost:11434/v1",
        model: "qwen2.5:7b",
        apiKey: "",
        rememberApiKey: false
      },
      { timeoutMs: 0 }
    );

    expect(result.ok).toBe(false);
    expect(result.message).toContain("无法连接本机模型服务");
    expect(result.message).not.toContain("Failed to fetch");
  });
});
