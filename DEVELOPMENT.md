# 开发计划：DeepSeek 最小 Agent Loop

## 项目目标

构建一个由 DeepSeek 驱动的最小 Agent Loop。这个 Demo 需要支持普通对话、结构化模型输出、工具调用/function call、本地工具执行，以及把工具结果返回给模型生成最终答案。

## 项目目录

第一个 Demo 放在：

```text
deepseek-agent-loop/
```

后续如果要写更多 AI Demo，可以继续在根目录下创建同级子文件夹。

## Stage 0：仓库初始化

### 任务

- 将当前文件夹作为 AI Demo 总仓库。
- 创建 `deepseek-agent-loop/` 作为第一个项目文件夹。
- 添加 `.env.example`，用于说明 API Key 配置方式。
- 确保 `.env` 被 Git 忽略。
- 添加项目级 README 文档。

### 产出

- 根目录 README，用于说明整个 Demo 集合。
- 当前开发计划文档。
- 已准备好开始实现的第一个 Demo 文件夹。

### 验收标准

- 仓库具备清晰的多 Demo 目录结构。
- 不提交任何 API Key。
- 后续可以直接在 `deepseek-agent-loop/` 内开始实现。

## Stage 1：最小 Agent Loop

### 任务

- 使用 Node.js 作为实现语言。
- 调用 DeepSeek chat completion API。
- 从 `DEEPSEEK_API_KEY` 读取 API Key。
- 支持用户和模型之间的普通对话。
- 至少定义一个本地工具，例如 `calculator`。
- 将工具 schema 提供给模型。
- 解析模型返回的 tool call。
- 执行模型选择的本地工具。
- 将工具执行结果返回给模型。
- 返回最终 assistant 答案。
- 增加最大循环步数、超时处理和基础错误处理。

### 产出

- 一个 50-150 行左右的最小 agent 实现。
- 一个简单的 CLI 入口。

### 验收标准

- 用户可以提出普通问题，并收到 DeepSeek 的回复。
- 用户提出适合调用工具的问题时，agent 能调用本地工具。
- agent 能在得到最终答案或达到最大步数后正常停止。

## Stage 2：工具系统

### 任务

- 创建一个小型工具注册表。
- 将工具名称、描述、JSON schema 和具体实现统一管理。
- 在执行工具前校验参数。
- 将工具错误格式化为模型可理解的输出。

### 产出

- 一个可复用的工具抽象层。
- 至少两个工具，例如 `calculator` 和 `read_file`。

### 验收标准

- 新增工具时，只需要完成注册。
- 参数无效时，不会导致 agent loop 崩溃。

## Stage 3：开发体验

### 任务

- 添加安装和运行说明。
- 添加示例 prompt。
- 为模型调用和工具调用增加结构化日志。
- 为 tool call 解析和工具执行添加测试。

### 产出

- 更完整的 README。
- 基础自动化测试。

### 验收标准

- 其他开发者可以根据 README 跑起 Demo。
- 核心 tool call 行为有测试覆盖。

## Stage 4：可选交互界面

### 任务

- 添加简单 Web UI 或终端 UI。
- 展示对话消息。
- 展示工具调用和工具结果。
- API Key 只保存在服务端，不暴露到前端。

### 产出

- 一个小型 Demo 界面。

### 验收标准

- 用户可以看到 agent 什么时候调用了工具。
- UI 不会暴露 API Key。

## Function Call 解释

Function calling，也常被称为 tool calling，是一种让模型“请求调用工具”的模式。模型本身不会直接执行代码，而是返回一个结构化请求，告诉程序它想调用哪个函数，以及要传入哪些参数。

随后，应用程序在本地执行这个函数，并把执行结果返回给模型。模型再基于这个结果生成最终答案。

示例：

```json
{
  "tool_calls": [
    {
      "function": {
        "name": "calculator",
        "arguments": "{\"expression\":\"12 * 8 + 5\"}"
      }
    }
  ]
}
```

在这个例子里，模型请求程序调用 `calculator`，并传入表达式 `12 * 8 + 5`。程序执行 calculator 工具，得到结果 `101`，再把结果发送回模型，最后由模型组织自然语言回复。

## DeepSeek 配置

开始实现时，在 `deepseek-agent-loop/` 目录下创建本地 `.env` 文件：

```text
DEEPSEEK_API_KEY=your_api_key_here
DEEPSEEK_BASE_URL=https://api.deepseek.com
DEEPSEEK_MODEL=deepseek-v4-flash
AGENT_MAX_STEPS=5
AGENT_REQUEST_TIMEOUT_MS=30000
```

不要提交 `.env` 文件。

## 技术选型

本项目使用 Node.js 实现。这样后续可以比较自然地扩展成 CLI、API 服务，或者浏览器界面。
