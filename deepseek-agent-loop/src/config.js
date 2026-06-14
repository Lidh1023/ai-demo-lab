import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

/**
 * 读取当前 demo 目录下的 .env 文件。
 *
 * 这里没有引入 dotenv，是为了让 Stage 1 保持“零第三方依赖”。
 * 解析规则只覆盖本项目需要的简单 KEY=VALUE 格式：
 * - 空行会被忽略
 * - 以 # 开头的注释行会被忽略
 * - 已经存在于 process.env 的变量不会被覆盖
 */
export function loadLocalEnv(envPath = resolve(process.cwd(), ".env")) {
  if (!existsSync(envPath)) {
    return;
  }

  const content = readFileSync(envPath, "utf8");

  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();

    if (!line || line.startsWith("#")) {
      continue;
    }

    const equalsIndex = line.indexOf("=");

    if (equalsIndex === -1) {
      continue;
    }

    const key = line.slice(0, equalsIndex).trim();
    const value = line.slice(equalsIndex + 1).trim().replace(/^["']|["']$/g, "");

    if (key && process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

/**
 * 集中读取 Agent 运行所需配置。
 *
 * DeepSeek 官方文档说明其 API 兼容 OpenAI API 格式，OpenAI base_url 为：
 * https://api.deepseek.com
 * 来源：https://api-docs.deepseek.com/
 */
export function getConfig() {
  loadLocalEnv();

  return {
    apiKey: process.env.DEEPSEEK_API_KEY,
    baseUrl: process.env.DEEPSEEK_BASE_URL ?? "https://api.deepseek.com",
    model: process.env.DEEPSEEK_MODEL ?? "deepseek-v4-flash",
    maxSteps: Number.parseInt(process.env.AGENT_MAX_STEPS ?? "5", 10),
    requestTimeoutMs: Number.parseInt(process.env.AGENT_REQUEST_TIMEOUT_MS ?? "30000", 10)
  };
}
