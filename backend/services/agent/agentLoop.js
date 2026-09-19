/**
 * AgentLoop: Autonomous ReAct developer agent loop for J.A.R.V.I.S.
 *
 * Flow: User Goal → LLM Decision → Tool Execute → Observe → Repeat → FINAL Answer
 */

import { ToolRegistry } from "./toolRegistry.js";
import { LLMClient } from "./llmClient.js";

export class AgentLoop {
  constructor(options = {}) {
    this.maxIterations = options.maxIterations || 8;
    this.tools = options.toolRegistry || new ToolRegistry();
    this.llm = options.llmClient || new LLMClient();
    this.logger = options.logger || console.log;
  }

  /**
   * Run the agent loop on a user-specified goal.
   * @param {string} goal - Natural language task objective.
   * @returns {Promise<AgentState>}
   */
  async run(goal) {
    /** @type {AgentState} */
    const state = {
      goal,
      currentIteration: 0,
      maxIterations: this.maxIterations,
      history: [],
      actionsTaken: [],
      toolResults: [],
      status: "RUNNING",
      finalAnswer: null,
      startTime: new Date().toISOString(),
      endTime: null,
    };

    this.logger(`[Agent] Goal: ${goal}`);

    // System prompt: concise to avoid token limit issues
    const systemContent = this._buildSystemPrompt();

    // LLM message history — starts with system + initial user goal
    const messages = [
      { role: "system", content: systemContent },
      {
        role: "user",
        content: `Objective: ${goal}\n\nAnalyze the goal and choose your first action.`,
      },
    ];

    // ── Iterative ReAct Loop ──────────────────────────────────────────────────
    while (state.currentIteration < this.maxIterations) {
      state.currentIteration++;
      this.logger(`[Agent] Iteration ${state.currentIteration}`);

      // ── 1. Ask LLM for next decision ────────────────────────────────────────
      let decision;
      try {
        decision = await this.llm.getStepDecision(messages);
      } catch (llmErr) {
        this.logger(`[Agent] LLM parse error: ${llmErr.message.slice(0, 150)}`);
        // Error recovery: tell the LLM what went wrong so it can self-correct
        messages.push({
          role: "user",
          content: `Your previous response could not be parsed. Error: ${llmErr.message.slice(0, 120)}. Respond ONLY with a valid JSON object matching the required schema.`,
        });
        continue;
      }

      // ── 2. Termination check ─────────────────────────────────────────────────
      if (decision.is_final || decision.action === "FINAL") {
        state.status = "COMPLETED";
        state.finalAnswer = decision.final_answer || decision.thought;
        state.history.push({
          iteration: state.currentIteration,
          thought: decision.thought,
          action: "FINAL",
          action_input: {},
          result: state.finalAnswer,
        });
        this.logger(`[Agent] Final answer: ${state.finalAnswer}`);
        state.endTime = new Date().toISOString();
        return state;
      }

      // ── 3. Log tool selection ────────────────────────────────────────────────
      const toolName = decision.action;
      const toolArgs = decision.action_input || {};
      state.actionsTaken.push(toolName);

      this.logger(`[Agent] Thought: ${decision.thought}`);
      this.logger(`[Agent] Selected tool: ${toolName} | args: ${JSON.stringify(toolArgs)}`);

      // ── 4. Execute tool ──────────────────────────────────────────────────────
      let toolOutput = "";
      try {
        toolOutput = await this.tools.execute(toolName, toolArgs);
      } catch (err) {
        toolOutput = `Tool '${toolName}' threw an uncaught error: ${err.message}`;
      }

      // Truncate large outputs to avoid flooding LLM context
      const CONTEXT_LIMIT = 1500;
      const trimmedOutput =
        toolOutput.length > CONTEXT_LIMIT
          ? toolOutput.slice(0, CONTEXT_LIMIT) + `\n... [output truncated, ${toolOutput.length - CONTEXT_LIMIT} chars hidden]`
          : toolOutput;

      this.logger(`[Tool] Result: ${trimmedOutput.slice(0, 300)}${trimmedOutput.length > 300 ? "..." : ""}`);

      // ── 5. Record state ──────────────────────────────────────────────────────
      state.toolResults.push(toolOutput);
      state.history.push({
        iteration: state.currentIteration,
        thought: decision.thought,
        action: toolName,
        action_input: toolArgs,
        result: toolOutput,
      });

      // ── 6. Feed observation back to LLM ─────────────────────────────────────
      messages.push({
        role: "assistant",
        content: JSON.stringify({
          thought: decision.thought,
          action: decision.action,
          action_input: decision.action_input,
        }),
      });

      messages.push({
        role: "user",
        content: `Observation from tool '${toolName}':\n${trimmedOutput}\n\nContinue toward goal: "${goal}". What is your next action? If goal is complete, set "is_final": true.`,
      });
    }

    // ── Max iterations reached ───────────────────────────────────────────────
    state.status = "MAX_ITERATIONS_REACHED";
    state.finalAnswer = `Agent reached the ${this.maxIterations}-iteration limit. Last actions: ${state.actionsTaken.slice(-3).join(" → ")}`;
    this.logger(`[Agent] Max iterations (${this.maxIterations}) reached.`);
    this.logger(`[Agent] Final answer: ${state.finalAnswer}`);
    state.endTime = new Date().toISOString();
    return state;
  }

  /**
   * Build a concise system prompt with tool schema.
   * Kept short on purpose — long system prompts cause 400 errors on some models.
   */
  _buildSystemPrompt() {
    const toolList = [];
    for (const [name, tool] of this.tools.tools.entries()) {
      toolList.push(`- ${name}: ${tool.description}`);
    }

    return `You are J.A.R.V.I.S., an autonomous developer agent that solves tasks by using tools step by step.

TOOLS:
${toolList.join("\n")}

LOOP PROTOCOL:
1. Reason about the goal and what you currently know.
2. Choose ONE tool and call it.
3. You will receive the tool output as an Observation.
4. Repeat until the goal is fully achieved.
5. When done, set "is_final": true and write a "final_answer".

STRICT OUTPUT FORMAT — respond ONLY with this JSON (no extra text):
{
  "thought": "<your reasoning>",
  "action": "<tool_name> or FINAL",
  "action_input": { "<param>": "<value>" },
  "is_final": false,
  "final_answer": ""
}

KEY RULES:
- NEVER guess file contents — always read with read_file first.
- After patching code, ALWAYS re-run the test/command to verify the fix.
- Run tests with: node <path_to_test_file> (NOT npx jest unless package.json has jest installed).
- Dangerous commands (rm -rf /, format, etc.) are blocked by SafetyGuard.`;
  }
}
