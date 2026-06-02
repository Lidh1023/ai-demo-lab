# DeepSeek Minimal Agent Loop

This demo will implement a small agent loop using DeepSeek as the LLM provider.

## Goal

The agent should be able to:

- Chat with a user.
- Receive structured tool/function call requests from the model.
- Execute local tools.
- Return tool results to the model.
- Produce a final answer.

## Planned Tools

- `calculator`: evaluates simple math expressions.
- `read_file`: reads allowed local files.
- `search`: optional search utility for local project content.

## Environment

Copy `.env.example` to `.env` and fill in your DeepSeek API key:

```text
DEEPSEEK_API_KEY=your_api_key_here
DEEPSEEK_BASE_URL=https://api.deepseek.com
DEEPSEEK_MODEL=deepseek-chat
```

The `.env` file should stay local and must not be committed.

## Next Step

Implement the first version with Node.js.

Suggested next files:

- `package.json`
- `src/index.js`
- `src/agent.js`
- `src/tools.js`
