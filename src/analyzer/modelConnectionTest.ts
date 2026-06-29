import type { ModelAnalyzerSettings } from "../types";
import {
  getModelEndpointSecurity,
  modelConnectionFailureMessage,
  modelEndpointNeedsApiKey,
  modelEndpointSecurityMessage
} from "./modelEndpointSecurity";
import {
  isModelServiceJsonParseFailure,
  modelServiceInvalidJsonMessage,
  modelServiceStatusMessage,
  shouldRetryWithoutResponseFormat
} from "./modelServiceErrors";
import { parseFirstJsonObject } from "./modelJson";
import { normalizeModelSettingsForRuntime } from "./modelSettings";

interface ChatCompletionProbeResponse {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
}

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
    let response = await fetchModelConnectionTest(runtimeSettings.baseUrl, headers, runtimeSettings.model, requestAbort.signal, true);
    let usedResponseFormatCompatibility = false;
    if (!response.ok && (await shouldRetryWithoutResponseFormat(response))) {
      usedResponseFormatCompatibility = true;
      response = await fetchModelConnectionTest(runtimeSettings.baseUrl, headers, runtimeSettings.model, requestAbort.signal, false);
    }

    if (!response.ok) {
      return { ok: false, message: modelServiceStatusMessage(response.status) };
    }

    const data = (await response.json()) as ChatCompletionProbeResponse;
    const content = data.choices?.[0]?.message?.content;
    if (typeof content !== "string" || !content.trim()) {
      return {
        ok: false,
        message: "模型服务已响应，但没有返回 OpenAI-compatible chat completions 格式。请检查 endpoint 是否以 /v1 结尾、模型名是否正确。"
      };
    }
    if (!isExpectedProbeConfirmation(content)) {
      return {
        ok: false,
        message: "模型服务已响应，但没有返回连接测试所需的 JSON 确认。请检查模型名是否正确，或换用支持 chat completions 的模型。"
      };
    }

    return {
      ok: true,
      message: usedResponseFormatCompatibility
        ? `连接测试通过：已连到 ${runtimeSettings.model}，本次未发送文件正文；模型服务不支持 response_format，已使用兼容模式。`
        : `连接测试通过：已连到 ${runtimeSettings.model}，本次未发送文件正文。`
    };
  } catch (caught) {
    if (requestAbort.didTimeout()) {
      return { ok: false, message: `连接测试超时（${Math.ceil(requestAbort.timeoutMs / 1000)} 秒）。` };
    }
    if (caught instanceof TypeError) {
      return { ok: false, message: modelConnectionFailureMessage(runtimeSettings.baseUrl) };
    }
    if (isModelServiceJsonParseFailure(caught)) {
      return { ok: false, message: modelServiceInvalidJsonMessage() };
    }
    const message = caught instanceof Error ? caught.message : "连接测试失败。";
    return { ok: false, message };
  } finally {
    requestAbort.clear();
  }
}

function fetchModelConnectionTest(
  baseUrl: string,
  headers: Record<string, string>,
  model: string,
  signal: AbortSignal | undefined,
  includeResponseFormat: boolean
): Promise<Response> {
  return fetch(`${baseUrl.replace(/\/+$/, "")}/chat/completions`, {
    method: "POST",
    signal,
    headers,
    body: JSON.stringify({
      model,
      temperature: 0,
      ...(includeResponseFormat ? { response_format: { type: "json_object" } } : {}),
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
}

function isExpectedProbeConfirmation(content: string): boolean {
  try {
    const parsed = JSON.parse(content) as { ok?: unknown };
    return parsed.ok === true;
  } catch {
    const parsed = parseFirstJsonObject(content) as { ok?: unknown } | undefined;
    return parsed?.ok === true;
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
