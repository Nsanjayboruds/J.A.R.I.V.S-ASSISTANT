#!/usr/bin/env node
/**
 * CLI Runner for J.A.R.V.I.S. Developer Agent
 *
 * Usage:
 *   node backend/run_agent.js
 *   node backend/run_agent.js "Your custom developer goal here"
 *
 * Default demo: Fix failing tests in backend/demo_task/ with full multi-step agent loop.
 */

import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { AgentLoop } from "./services/agent/agentLoop.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, ".env") });

// ─── Default multi-step demo goal ────────────────────────────────────────────
// The goal instructs the agent to:
//   1. Run the test file using `node` (not npx jest — jest is not installed)
//   2. Read both source + test file to understand the failures
//   3. Patch the bugs in mathUtils.js
//   4. Re-run the tests to confirm they pass
//   5. Report a final summary
const defaultGoal =
  "Run the test suite using this exact command: `node backend/demo_task/mathUtils.test.js`. " +
  "Read the test output, then read backend/demo_task/mathUtils.js to identify the bugs. " +
  "Patch each bug using the patch_file tool. " +
  "Re-run the tests to confirm all tests now pass. " +
  "Finally, report what bugs you found and fixed.";

const userGoal = process.argv.slice(2).join(" ").trim() || defaultGoal;

console.log("================================================================================");
console.log("          J.A.R.V.I.S.  ·  AUTONOMOUS DEVELOPER AGENT DEMO                    ");
console.log("================================================================================");
console.log("");

const agent = new AgentLoop({
  maxIterations: 8,
  logger: (msg) => console.log(msg),
});

agent
  .run(userGoal)
  .then((state) => {
    console.log("");
    console.log("================================================================================");
    console.log(`Status          : ${state.status}`);
    console.log(`Total Iterations: ${state.currentIteration}`);
    console.log(`Actions Taken   : ${state.actionsTaken.join(" → ")}`);
    console.log("================================================================================");
    process.exit(state.status === "COMPLETED" ? 0 : 1);
  })
  .catch((err) => {
    console.error(`[Agent Fatal Error]: ${err.message}`);
    process.exit(1);
  });
