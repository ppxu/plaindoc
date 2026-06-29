export function modelServiceStatusMessage(status: number): string {
  if (status === 401 || status === 403) {
    return `模型服务返回 ${status}，请检查 API key 是否正确、是否有权限访问当前模型。`;
  }
  if (status === 404) {
    return "模型服务返回 404，请检查 endpoint 是否以 /v1 结尾，以及模型服务是否支持 /chat/completions。";
  }
  return `模型服务返回 ${status}，请检查 endpoint、模型名和 API key。`;
}

export async function shouldRetryWithoutResponseFormat(response: Response): Promise<boolean> {
  if (response.status !== 400) return false;
  const message = await safeReadResponseText(response);
  return /response[_-]?format|json_object/i.test(message);
}

async function safeReadResponseText(response: Response): Promise<string> {
  try {
    return await response.text();
  } catch {
    return "";
  }
}
