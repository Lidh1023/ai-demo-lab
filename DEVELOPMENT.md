# Development Plan: DeepSeek Minimal Agent Loop

## Project Goal

Build a minimal agent loop powered by DeepSeek. The demo should support normal chat, structured model output, tool/function calls, local tool execution, and returning tool results back to the model for a final answer.

## Directory

The first demo lives in:

```text
deepseek-agent-loop/
```

This repository can hold more AI demos later as sibling folders.

## Stage 0: Repository Setup

### Tasks

- Keep the current folder as the parent AI demo repository.
- Create `deepseek-agent-loop/` as the first project folder.
- Add `.env.example` for API key configuration.
- Keep `.env` ignored by Git.
- Add project-level README documentation.

### Output

- Root README for the full demo collection.
- Development plan in this file.
- First demo folder prepared for implementation.

### Acceptance Criteria

- The repository has a clear multi-demo structure.
- No API key is committed.
- A future implementation can start inside `deepseek-agent-loop/`.

## Stage 1: Minimal Agent Loop

### Tasks

- Use Node.js as the implementation runtime.
- Call the DeepSeek chat completion API.
- Load the API key from `DEEPSEEK_API_KEY`.
- Support normal user-to-model conversation.
- Define at least one local tool, such as `calculator`.
- Provide the tool schema to the model.
- Parse model tool calls.
- Execute the selected local tool.
- Send the tool result back to the model.
- Return the final assistant answer.
- Add maximum loop steps, timeout handling, and basic error handling.

### Output

- A 50-150 line minimal agent implementation.
- A small CLI entry point.

### Acceptance Criteria

- The user can ask a normal question and receive a DeepSeek response.
- The user can ask a tool-worthy question and the agent calls a local tool.
- The agent stops cleanly after a final answer or max-step limit.

## Stage 2: Tool System

### Tasks

- Create a small tool registry.
- Store tool name, description, JSON schema, and implementation together.
- Validate tool arguments before execution.
- Normalize tool errors into model-readable output.

### Output

- A reusable tool abstraction.
- At least two tools, for example `calculator` and `read_file`.

### Acceptance Criteria

- Adding a new tool requires only registering it.
- Invalid arguments do not crash the agent loop.

## Stage 3: Developer Experience

### Tasks

- Add installation and run instructions.
- Add example prompts.
- Add structured logs for model calls and tool calls.
- Add tests for tool parsing and tool execution.

### Output

- README improvements.
- Basic automated tests.

### Acceptance Criteria

- Another developer can run the demo from the README.
- Core tool-call behavior is covered by tests.

## Stage 4: Optional Interface

### Tasks

- Add a simple web UI or terminal UI.
- Show conversation messages.
- Show tool calls and tool results.
- Keep API keys server-side only.

### Output

- A small demo interface.

### Acceptance Criteria

- The user can see when the agent called a tool.
- The UI does not expose the API key.

## Function Call Explanation

Function calling, also called tool calling, is a pattern where the model does not directly execute code. Instead, the model returns a structured request saying which function it wants to call and what arguments should be passed.

The application then executes the function locally and sends the result back to the model. The model uses that result to produce the final answer.

Example:

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

In this example, the model is asking the program to call `calculator` with the expression `12 * 8 + 5`. The program executes the calculator tool, receives `101`, sends that result back to the model, and the model writes the final response.

## DeepSeek Configuration

Create a local `.env` file inside `deepseek-agent-loop/` when implementation begins:

```text
DEEPSEEK_API_KEY=your_api_key_here
DEEPSEEK_BASE_URL=https://api.deepseek.com
DEEPSEEK_MODEL=deepseek-chat
```

Do not commit `.env`.

## Runtime Decision

This project will use Node.js. That makes the demo convenient to extend into a CLI, API server, or browser-based interface later.
