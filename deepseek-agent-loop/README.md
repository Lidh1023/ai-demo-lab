# DeepSeek 最小 Agent Loop

这个 Demo 会使用 DeepSeek 作为 LLM 提供方，实现一个小型 Agent Loop。

## 目标

这个 agent 需要具备以下能力：

- 与用户进行对话。
- 接收模型返回的结构化 tool/function call 请求。
- 执行本地工具。
- 将工具结果返回给模型。
- 生成最终答案。

## 计划支持的工具

- `calculator`：计算简单数学表达式。
- `read_file`：读取允许访问的本地文件。
- `search`：可选工具，用于搜索本地项目内容。

## 环境变量

复制 `.env.example` 为 `.env`，并填入你的 DeepSeek API Key：

```text
DEEPSEEK_API_KEY=your_api_key_here
DEEPSEEK_BASE_URL=https://api.deepseek.com
DEEPSEEK_MODEL=deepseek-v4-flash
AGENT_MAX_STEPS=5
AGENT_REQUEST_TIMEOUT_MS=30000
```

`.env` 文件只保存在本地，不要提交到 Git 仓库。

## 运行方式

本项目使用 Node.js 18+，不需要安装第三方依赖。

```bash
npm start
```

如果想先做语法检查和基础测试：

```bash
npm run check
npm test
```

## 示例问题

- `12 * (8 + 5) 等于多少？`
- `读取 README.md，总结这个项目是什么。`
- `搜索 function call 相关内容。`

## 当前文件

- `package.json`
- `src/index.js`：CLI 入口。
- `src/config.js`：读取 `.env` 和运行配置。
- `src/deepseekClient.js`：调用 DeepSeek Chat Completion API。
- `src/agent.js`：实现 Agent Loop。
- `src/tools.js`：定义工具 schema 和本地工具实现。
- `test/tools.test.js`：基础工具测试。

## 关键资料来源

- DeepSeek API 快速开始：https://api-docs.deepseek.com/
- DeepSeek Chat Completion API：https://api-docs.deepseek.com/api/create-chat-completion
- DeepSeek Tool Calls 指南：https://api-docs.deepseek.com/guides/tool_calls
- DeepSeek 多轮对话说明：https://api-docs.deepseek.com/guides/multi_round_chat
