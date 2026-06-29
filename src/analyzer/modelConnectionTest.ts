import type { ModelAnalyzerSettings } from "../types";
import {
  getModelEndpointSecurity,
  modelConnectionFailureMessage,
  modelEndpointNeedsApiKey,
  modelEndpointSecurityMessage
} from "./modelEndpointSecurity";
import { normalizeModelSettingsForRuntime } from "./modelSettings";

export type ModelConnectionTestResult =
  | { ok: true; message: string }
  | { ok: false; message: string };

interface ModelConnectionTestOptions {
  signal?: AbortSignal;
  timeoutMs?: number;
}

const CONNECTION_TEST_TIMEOUT_MS = 15_000;

export async function testModelConnection(
  settings: ModelAnalyzerSettings,
  options: ModelConnectionTestOptions = {}
): Promise<ModelConnectionTestResult> {
  const runtimeSettings = normalizeModelSettingsForRuntime(settings);
  const endpointSecurity = getModelEndpointSecurity(runtimeSettings.baseUrl);
  if (!endpointSecurity.ok) {
    return { ok: false, message: modelEndpointSecurityMessage(endpointSecurity) };
  }

  const needsApiKey = modelEndpointNeedsApiKey(runtimeSettings.baseUrl);
  if (needsApiKey && !runtimeSettings.apiKey.trim()) {
    return { ok: false, message: "远程模型 endpoint 需要 API key 后才能测试连接；本机模型可不填写 API key。" };
  }

  const requestAbort = createConnectionTestAbort(options);
  const headers: Record<string, string> = {
    "Content-Type": "application/json"
  };
  if (runtimeSettings.apiKey.trim()) {
    headers.Authorization = `Bearer ${runtimeSettings.apiKey.trim()}`;
  }

  try {
    const response = await fetch(`${runtimeSettings.baseUrl.replace(/\/+$/, "")}/chat/completions`, {
      method: "POST",
      signal: requestAbort.signal,
      headers,
      body: JSON.stringify({
        model: runtimeSettings.model,
        temperature: 0,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content:
              "You are PlainDoc connection tester. Return strict JSON only. Do not ask for document text or user data."
          },
          {
            role: "user",
            content: "Return exactly this JSON shape to confirm the model endpoint works: {\"ok\":true}"
          }
        ]
      })
    });

    if (!response.ok) {
      return { ok: false, message: `模型服务返回 ${response.status}，请检查 endpoint、模型名和 API key。` };
    }

    return { ok: true, message: `连接测试通过：已连到 ${runtimeSettings.model}，本次未发送文件正文。` };
  } catch (caught) {
    if (requestAbort.didTimeout()) {
      return { ok: false, message: `连接测试超时（${Math.ceil(requestAbort.timeoutMs / 1000)} 秒）。` };
    }
    if (caught instanceof TypeError) {
      return { ok: false, message: modelConnectionFailureMessage(runtimeSettings.baseUrl) };
    }
    const message = caught instanceof Error ? caught.message : "连接测试失败。";
    return { ok: false, message };
  } finally {
    requestAbort.clear();
  }
}

function createConnectionTestAbort(options: ModelConnectionTestOptions): {
  signal?: AbortSignal;
  timeoutMs: number;
  clear: () => void;
  didTimeout: () => boolean;
} {
  const timeoutMs = options.timeoutMs ?? CONNECTION_TEST_TIMEOUT_MS;
  if (timeoutMs <= 0) {
    return {
      signal: options.signal,
      timeoutMs,
      clear: () => undefined,
      didTimeout: () => false
    };
  }

  const controller = new AbortController();
  let timedOut = false;
  const abortFromExternalSignal = () => controller.abort();
  const timeoutId = globalThis.setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, timeoutMs);

  if (options.signal?.aborted) {
    abortFromExternalSignal();
  } else {
    options.signal?.addEventListener("abort", abortFromExternalSignal, { once: true });
  }

  return {
    signal: controller.signal,
    timeoutMs,
    clear: () => {
      globalThis.clearTimeout(timeoutId);
      options.signal?.removeEventListener("abort", abortFromExternalSignal);
    },
    didTimeout: () => timedOut
  };
}
