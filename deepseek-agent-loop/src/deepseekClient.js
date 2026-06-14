/**
 * 轻量 DeepSeek REST Client。
 *
 * 这里直接用 Node.js 18+ 内置 fetch，而不是 OpenAI SDK。
 * 好处是更容易看清楚底层请求结构：POST /chat/completions。
 *
 * DeepSeek Chat Completion API 来源：
 * https://api-docs.deepseek.com/api/create-chat-completion
 */
export class DeepSeekClient {
  constructor({ apiKey, baseUrl, model, requestTimeoutMs }) {
    if (!apiKey) {
      throw new Error("缺少 DEEPSEEK_API_KEY。请在 deepseek-agent-loop/.env 中填写你的 API Key。");
    }

    this.apiKey = apiKey;
    this.baseUrl = baseUrl.replace(/\/$/, "");
    this.model = model;
    this.requestTimeoutMs = requestTimeoutMs;
  }

  /**
   * 调用 DeepSeek 的非流式 Chat Completion。
   *
   * DeepSeek 文档中的请求体包含 model、messages、tools、stream 等字段；
   * tool calls 的具体格式参考官方 Tool Calls 指南：
   * https://api-docs.deepseek.com/guides/tool_calls
   */
  async createChatCompletion({ messages, tools }) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.requestTimeoutMs);

    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: this.model,
          messages,
          tools,
          stream: false
        }),
        signal: controller.signal
      });

      const responseText = await response.text();
      const data = responseText ? JSON.parse(responseText) : {};

      if (!response.ok) {
        const message = data?.error?.message ?? response.statusText;
        throw new Error(`DeepSeek API 请求失败：${response.status} ${message}`);
      }

      return data;
    } catch (error) {
      if (error.name === "AbortError") {
        throw new Error(`DeepSeek API 请求超时：${this.requestTimeoutMs}ms`);
      }

      throw error;
    } finally {
      clearTimeout(timeoutId);
    }
  }
}
