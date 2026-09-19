/**
 * Test suite for mathUtils.js
 * Run using: node backend/demo_task/mathUtils.test.js
 */

import assert from "assert";
import { factorial, calculateAverage } from "./mathUtils.js";

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`PASS: ${name}`);
    passed++;
  } catch (err) {
    console.error(`FAIL: ${name}`);
    console.error(`      ${err.message}`);
    failed++;
  }
}

console.log("--- Running MathUtils Test Suite ---");

test("factorial(0) should equal 1", () => {
  assert.strictEqual(factorial(0), 1, "Expected factorial(0) to equal 1");
});

test("factorial(5) should equal 120", () => {
  assert.strictEqual(factorial(5), 120, "Expected factorial(5) to equal 120");
});

test("calculateAverage([10, 20, 30]) should equal 20", () => {
  assert.strictEqual(calculateAverage([10, 20, 30]), 20, "Expected average to equal 20");
});

test("calculateAverage([4, 6]) should equal 5", () => {
  assert.strictEqual(calculateAverage([4, 6]), 5, "Expected average to equal 5");
});

console.log(`\nResults: ${passed} passed, ${failed} failed`);

if (failed > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
