import { readdirSync, readFileSync, statSync } from "node:fs";
import { extname, join, relative, resolve } from "node:path";

const projectRoot = resolve(process.cwd());
const blockedFileNames = new Set([".env"]);
const readableExtensions = new Set([".md", ".txt", ".json", ".js", ".mjs", ".cjs"]);

/**
 * 对外暴露给模型的工具注册表。
 *
 * 每个工具都包含两部分：
 * - definition：发给 DeepSeek 的工具 schema
 * - run：Node.js 本地真正执行的函数
 *
 * DeepSeek Tool Calls 文档使用 OpenAI 兼容格式：
 * { type: "function", function: { name, description, parameters } }
 * 来源：https://api-docs.deepseek.com/guides/tool_calls
 */
export const tools = {
  calculator: {
    definition: {
      type: "function",
      function: {
        name: "calculator",
        description: "计算只包含数字、小数、括号和 + - * / 的数学表达式。",
        parameters: {
          type: "object",
          properties: {
            expression: {
              type: "string",
              description: "需要计算的数学表达式，例如：12 * (8 + 5)"
            }
          },
          required: ["expression"]
        }
      }
    },
    run: ({ expression }) => {
      assertString(expression, "expression");
      return String(evaluateMathExpression(expression));
    }
  },

  read_file: {
    definition: {
      type: "function",
      function: {
        name: "read_file",
        description: "读取当前 demo 项目内允许访问的文本文件内容。",
        parameters: {
          type: "object",
          properties: {
            path: {
              type: "string",
              description: "相对于 deepseek-agent-loop 目录的文件路径，例如：README.md"
            }
          },
          required: ["path"]
        }
      }
    },
    run: ({ path }) => {
      assertString(path, "path");
      const filePath = resolveSafeProjectPath(path);

      if (blockedFileNames.has(path)) {
        throw new Error("出于安全考虑，read_file 不允许读取 .env。");
      }

      const stats = statSync(filePath);

      if (!stats.isFile()) {
        throw new Error(`${path} 不是文件。`);
      }

      if (!readableExtensions.has(extname(filePath))) {
        throw new Error(`${path} 不是允许读取的文本文件类型。`);
      }

      return readFileSync(filePath, "utf8");
    }
  },

  search_files: {
    definition: {
      type: "function",
      function: {
        name: "search_files",
        description: "在当前 demo 项目内搜索文本文件名和文件内容。",
        parameters: {
          type: "object",
          properties: {
            keyword: {
              type: "string",
              description: "要搜索的关键词，例如：function call"
            }
          },
          required: ["keyword"]
        }
      }
    },
    run: ({ keyword }) => {
      assertString(keyword, "keyword");
      return searchTextFiles(keyword);
    }
  }
};

/**
 * 生成发给 DeepSeek 的 tools 数组。
 *
 * Agent 内部需要保留 run 函数，但 API 请求只应该发送 definition。
 */
export function getToolDefinitions() {
  return Object.values(tools).map((tool) => tool.definition);
}

/**
 * 根据模型返回的工具名执行对应本地函数。
 */
export async function runToolByName(name, args) {
  const tool = tools[name];

  if (!tool) {
    throw new Error(`未知工具：${name}`);
  }

  return await tool.run(args);
}

function assertString(value, fieldName) {
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(`${fieldName} 必须是非空字符串。`);
  }
}

/**
 * 限制工具只能读取 demo 项目目录内的文件。
 *
 * 这样即使模型传入 ../../ 之类的路径，也不会越权读取项目外文件。
 */
function resolveSafeProjectPath(inputPath) {
  const filePath = resolve(projectRoot, inputPath);
  const relativePath = relative(projectRoot, filePath);

  if (relativePath.startsWith("..") || relativePath === "") {
    throw new Error(`路径不在项目目录内：${inputPath}`);
  }

  return filePath;
}

/**
 * 搜索小型项目文本文件。
 *
 * 为了保持 Demo 简单，这里用 Node.js 文件系统 API 递归搜索；
 * 大项目中更适合接入 ripgrep、数据库索引或专门的检索系统。
 */
function searchTextFiles(keyword) {
  const results = [];
  const lowerKeyword = keyword.toLowerCase();

  walk(projectRoot, (filePath) => {
    const fileName = filePath.split("/").at(-1);

    if (blockedFileNames.has(fileName) || !readableExtensions.has(extname(filePath))) {
      return;
    }

    const content = readFileSync(filePath, "utf8");
    const relativePath = relative(projectRoot, filePath);

    if (relativePath.toLowerCase().includes(lowerKeyword) || content.toLowerCase().includes(lowerKeyword)) {
      results.push(relativePath);
    }
  });

  return results.length > 0 ? results.join("\n") : "没有找到匹配文件。";
}

function walk(directory, onFile) {
  for (const entry of readdirSync(directory)) {
    if (entry === "node_modules" || entry === ".git") {
      continue;
    }

    const fullPath = join(directory, entry);
    const stats = statSync(fullPath);

    if (stats.isDirectory()) {
      walk(fullPath, onFile);
    } else if (stats.isFile()) {
      onFile(fullPath);
    }
  }
}

/**
 * 一个小型数学表达式解析器。
 *
 * 这里没有使用 eval 或 Function，原因是 calculator 会执行模型传入的字符串。
 * 即使我们做了字符过滤，也不应该让模型控制任意 JavaScript 代码执行。
 */
export function evaluateMathExpression(expression) {
  const parser = createMathParser(expression);
  const result = parser.parseExpression();

  parser.skipWhitespace();

  if (!parser.isEnd()) {
    throw new Error(`无法解析表达式剩余部分：${parser.remaining()}`);
  }

  if (!Number.isFinite(result)) {
    throw new Error("计算结果不是有效数字。");
  }

  return result;
}

function createMathParser(input) {
  let index = 0;

  return {
    parseExpression,
    skipWhitespace,
    isEnd: () => index >= input.length,
    remaining: () => input.slice(index)
  };

  function parseExpression() {
    let value = parseTerm();

    while (true) {
      skipWhitespace();

      if (match("+")) {
        value += parseTerm();
      } else if (match("-")) {
        value -= parseTerm();
      } else {
        return value;
      }
    }
  }

  function parseTerm() {
    let value = parseFactor();

    while (true) {
      skipWhitespace();

      if (match("*")) {
        value *= parseFactor();
      } else if (match("/")) {
        const divisor = parseFactor();

        if (divisor === 0) {
          throw new Error("不能除以 0。");
        }

        value /= divisor;
      } else {
        return value;
      }
    }
  }

  function parseFactor() {
    skipWhitespace();

    if (match("+")) {
      return parseFactor();
    }

    if (match("-")) {
      return -parseFactor();
    }

    if (match("(")) {
      const value = parseExpression();
      skipWhitespace();

      if (!match(")")) {
        throw new Error("缺少右括号。");
      }

      return value;
    }

    return parseNumber();
  }

  function parseNumber() {
    skipWhitespace();
    const start = index;

    while (/[0-9.]/.test(input[index] ?? "")) {
      index += 1;
    }

    const rawNumber = input.slice(start, index);

    if (!rawNumber || rawNumber.split(".").length > 2) {
      throw new Error(`无效数字：${rawNumber || input[index] || "空值"}`);
    }

    return Number(rawNumber);
  }

  function match(char) {
    if (input[index] === char) {
      index += 1;
      return true;
    }

    return false;
  }

  function skipWhitespace() {
    while (/\s/.test(input[index] ?? "")) {
      index += 1;
    }
  }
}
