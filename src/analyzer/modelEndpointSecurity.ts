export type ModelEndpointSecurity =
  | { ok: true }
  | { ok: false; reason: "invalid_url" | "insecure_remote_http" | "unsupported_protocol" };

const LOCAL_HTTP_HOSTS = new Set(["localhost", "127.0.0.1", "::1", "[::1]"]);

export function getModelEndpointSecurity(baseUrl: string): ModelEndpointSecurity {
  let parsed: URL;
  try {
    parsed = new URL(baseUrl.trim());
  } catch {
    return { ok: false, reason: "invalid_url" };
  }

  if (parsed.protocol === "https:") {
    return { ok: true };
  }

  if (parsed.protocol === "http:") {
    return LOCAL_HTTP_HOSTS.has(parsed.hostname) ? { ok: true } : { ok: false, reason: "insecure_remote_http" };
  }

  return { ok: false, reason: "unsupported_protocol" };
}

export function modelEndpointSecurityMessage(security: ModelEndpointSecurity): string {
  if (security.ok) return "";
  if (security.reason === "invalid_url") {
    return "模型 endpoint 不是有效 URL。请填写 HTTPS 地址，或本机 http://localhost 地址。";
  }
  if (security.reason === "insecure_remote_http") {
    return "为保护正文和 API key，远程模型 endpoint 必须使用 HTTPS；只有本机 localhost/127.0.0.1 可使用 HTTP。";
  }
  return "模型 endpoint 协议不受支持。请使用 HTTPS，或本机 http://localhost 地址。";
}

export function isLocalModelEndpoint(baseUrl: string): boolean {
  let parsed: URL;
  try {
    parsed = new URL(baseUrl.trim());
  } catch {
    return false;
  }

  return LOCAL_HTTP_HOSTS.has(parsed.hostname);
}

export function modelEndpointNeedsApiKey(baseUrl: string): boolean {
  return !isLocalModelEndpoint(baseUrl);
}

export function modelConnectionFailureMessage(baseUrl: string): string {
  if (isLocalModelEndpoint(baseUrl)) {
    return "无法连接本机模型服务。请确认 Ollama 或本机 OpenAI-compatible 服务已启动、endpoint 地址正确，并允许当前网页请求该服务。";
  }
  return "无法连接模型服务。请确认 endpoint 地址、网络连接和模型服务状态。";
}
