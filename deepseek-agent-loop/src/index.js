import { createInterface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { getConfig } from "./config.js";
import { createAgent } from "./agent.js";

/**
 * CLI 入口。
 *
 * 使用方式：
 * 1. 复制 .env.example 为 .env
 * 2. 填入 DEEPSEEK_API_KEY
 * 3. 执行 npm start
 */
async function main() {
  // 1. 加载配置并初始化智能体 (Agent)
  const config = getConfig();
  const agent = createAgent(config);
  
  // 2. 创建一个可以读取键盘输入并在屏幕显示文字的工具
  const rl = createInterface({ input, output });

  console.log("DeepSeek 最小 Agent Loop 已启动。输入 exit 或 quit 退出。");
  console.log(`当前模型：${config.model}`);

  try {
    // 3. 进入持续对话的循环
    while (true) {
      // 等待用户输入文字，并去掉两边的空格
      const userInput = (await rl.question("\n你：")).trim();

      // 如果没说话，就继续等待
      if (!userInput) {
        continue;
      }

      // 如果输入 exit 或 quit，就结束对话
      if (["exit", "quit"].includes(userInput.toLowerCase())) {
        break;
      }

      try {
        // 4. 让智能体处理用户的输入并给出回答
        const answer = await agent.ask(userInput);
        console.log(`\nAgent：${answer.content}`);
        console.log(`\n[本轮循环步数：${answer.steps}]`);
      } catch (error) {
        // 如果 Agent 运行出错了，打印错误信息
        console.error(`\nAgent 运行失败：${error.message}`);
      }
    }
  } finally {
    // 5. 循环结束后，关闭输入工具，释放资源
    rl.close();
  }
}

// 启动程序，如果最外层出错了，打印错误并退出
main().catch((error) => {
  console.error(`启动失败：${error.message}`);
  process.exitCode = 1;
});
