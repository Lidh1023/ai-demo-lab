import test from "node:test";
import assert from "node:assert/strict";
import { evaluateMathExpression } from "../src/tools.js";

test("calculator 支持基础四则运算和括号优先级", () => {
  assert.equal(evaluateMathExpression("12 * (8 + 5)"), 156);
});

test("calculator 支持一元负号", () => {
  assert.equal(evaluateMathExpression("-3 * (2 + 4)"), -18);
});

test("calculator 拒绝除以 0", () => {
  assert.throws(() => evaluateMathExpression("1 / 0"), /不能除以 0/);
});

test("calculator 拒绝无法完整解析的表达式", () => {
  assert.throws(() => evaluateMathExpression("1 + abc"), /无法解析|无效数字/);
});
