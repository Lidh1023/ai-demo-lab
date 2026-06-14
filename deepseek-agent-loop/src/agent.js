import { DeepSeekClient } from "./deepseekClient.js";
import { getToolDefinitions, runToolByName } from "./tools.js";

const systemPrompt = [
  "你是一个最小 Agent Loop Demo。",
  "你可以直接回答普通问题。",
  "当问题需要计算、读取文件或搜索项目内容时，优先调用可用工具。",
  "工具返回结果后，请用简洁中文给出最终答案。"
].join("\n");

/**
 * 创建一个可以持续多轮对话的 Agent。
 *
 * DeepSeek 多轮对话文档说明：/chat/completions 是无状态 API，
 * 服务端不会保存上下文，所以客户端每次都要把历史 messages 一起发送。
 * 来源：https://api-docs.deepseek.com/guides/multi_round_chat
 */
export function createAgent(config) {
  const client = new DeepSeekClient(config);
  const messages = [{ role: "system", content: systemPrompt }];
  const tools = getToolDefinitions();

  return {
    messages,
    ask: (userInput) => runAgentLoop({ client, messages, tools, userInput, maxSteps: config.maxSteps })
  };
}

/**
 * Agent Loop 的核心流程：
 * 1. 追加用户消息
 * 2. 请求模型
 * 3. 如果模型返回 tool_calls，就执行工具并把结果追加为 tool 消息
 * 4. 继续请求模型，直到得到最终文本答案或达到最大步数
 */
async function runAgentLoop({ client, messages, tools, userInput, maxSteps }) {
  messages.push({ role: "user", content: userInput });

  for (let step = 1; step <= maxSteps; step += 1) {
    const completion = await client.createChatCompletion({ messages, tools });
    const assistantMessage = completion.choices?.[0]?.message;

    if (!assistantMessage) {
      throw new Error("DeepSeek API 没有返回 assistant message。");
    }

    const toolCalls = assistantMessage.tool_calls ?? [];

    if (toolCalls.length === 0) {
      const content = assistantMessage.content ?? "";
      messages.push({ role: "assistant", content });
      return {
        content,
        steps: step
      };
    }

    /**
     * DeepSeek Tool Calls 文档示例会先把 assistant 的 tool_calls 消息加入 messages，
     * 再追加 { role: "tool", tool_call_id, content } 作为工具结果。
     * 来源：https://api-docs.deepseek.com/guides/tool_calls
     */
    messages.push({
      role: "assistant",
      content: assistantMessage.content ?? "",
      tool_calls: toolCalls
    });

    for (const toolCall of toolCalls) {
      const toolResult = await executeToolCall(toolCall);

      messages.push({
        role: "tool",
        tool_call_id: toolCall.id,
        content: toolResult
      });
    }
  }

  throw new Error(`Agent 已达到最大循环步数 ${maxSteps}，已停止以避免无限循环。`);
}

async function executeToolCall(toolCall) {
  const toolName = toolCall.function?.name;
  const rawArguments = toolCall.function?.arguments ?? "{}";

  if (!toolName) {
    return "工具调用失败：模型没有提供 function.name。";
  }

  try {
    const args = JSON.parse(rawArguments);
    const result = await runToolByName(toolName, args);
    return typeof result === "string" ? result : JSON.stringify(result);
  } catch (error) {
    return `工具 ${toolName} 执行失败：${error.message}`;
  }
}
