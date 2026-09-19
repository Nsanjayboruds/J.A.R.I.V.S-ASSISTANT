/**
 * LLMClient: Handles model communication for the Agent Loop.
 *
 * Provider cascade:
 *   1. Groq qwen/qwen3.8-27b  (primary - fast, reliably structured)
 *   2. Groq openai/gpt-oss-120b (backup - embed system inside user message)
 *   3. Graceful failure (no local Ollama in constrained RAM environments)
 */

import axios from "axios";
import dotenv from "dotenv";
dotenv.config();

export class LLMClient {
  constructor(options = {}) {
    this.apiKey = process.env.GROQ_API_KEY;
    this.groqBase = "https://api.groq.com/openai/v1/chat/completions";

    // Primary model: qwen works well with standard system/user messages
    this.primaryModel = options.model || "qwen/qwen3.8-27b";
    // Backup model: gpt-oss works best when system prompt is merged into first user message
    this.backupModel = "openai/gpt-oss-120b";
  }

  /**
   * Request a structured completion from the LLM.
   * Attempts primary model, then backup with merged-system strategy.
   * @param {Array<{role: string, content: string}>} messages
   * @returns {Promise<{thought, action, action_input, is_final, final_answer}>}
   */
  async getStepDecision(messages) {
    let rawContent = "";

    if (!this.apiKey) {
      throw new Error("GROQ_API_KEY is not set in environment variables.");
    }

    // Attempt 1: Primary model (qwen/qwen3.8-27b) with standard messages
    try {
      rawContent = await this._callGroq(messages, this.primaryModel);
      if (rawContent && rawContent.trim()) {
        return this._parseStructuredOutput(rawContent);
      }
      throw new Error("Primary model returned empty content.");
    } catch (primaryErr) {
      console.warn(`[LLMClient] Primary model (${this.primaryModel}) failed: ${primaryErr.message.slice(0, 100)}`);
    }

    // Attempt 2: Backup model (openai/gpt-oss-120b) - merge system prompt into first user turn
    try {
      const mergedMessages = this._mergeSystemIntoUser(messages);
      rawContent = await this._callGroq(mergedMessages, this.backupModel);
      if (rawContent && rawContent.trim()) {
        return this._parseStructuredOutput(rawContent);
      }
      throw new Error("Backup model returned empty content.");
    } catch (backupErr) {
      console.warn(`[LLMClient] Backup model (${this.backupModel}) failed: ${backupErr.message.slice(0, 100)}`);
    }

    throw new Error("All LLM providers failed. Cannot obtain a decision.");
  }

  /**
   * Merge the system message into the first user message for models
   * that don't support separate system roles well.
   */
  _mergeSystemIntoUser(messages) {
    const systemMsg = messages.find((m) => m.role === "system");
    if (!systemMsg) return messages;

    const rest = messages.filter((m) => m.role !== "system");
    const firstUser = rest.find((m) => m.role === "user");
    const otherMessages = rest.filter((m) => m !== firstUser);

    return [
      {
        role: "user",
        content: `${systemMsg.content}\n\n---\n\n${firstUser?.content || "Begin."}`,
      },
      ...otherMessages,
    ];
  }

  /**
   * Invoke Groq Chat Completion API
   */
  async _callGroq(messages, model) {
    const res = await axios.post(
      this.groqBase,
      {
        model,
        messages,
        temperature: 0.1,
        max_tokens: 2048,
      },
      {
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        timeout: 35000,
      }
    );

    return res.data?.choices?.[0]?.message?.content || "";
  }

  /**
   * Parse structured JSON from raw model response string.
   * Handles markdown fences and partial text around JSON.
   */
  _parseStructuredOutput(raw) {
    if (!raw) {
      throw new Error("Empty response received from LLM");
    }

    let cleaned = raw.trim();

    // Strip markdown code fences
    if (cleaned.startsWith("```json")) {
      cleaned = cleaned.replace(/^```json\s*/, "").replace(/```\s*$/, "");
    } else if (cleaned.startsWith("```")) {
      cleaned = cleaned.replace(/^```\s*/, "").replace(/```\s*$/, "");
    }

    // Qwen adds <think>...</think> blocks - strip them
    cleaned = cleaned.replace(/<think>[\s\S]*?<\/think>/g, "").trim();

    // Extract JSON object if extra commentary exists
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (match) {
      cleaned = match[0];
    }

    try {
      const parsed = JSON.parse(cleaned);
      return {
        thought: parsed.thought || "No thought provided.",
        action: parsed.action || (parsed.is_final ? "FINAL" : "none"),
        action_input: parsed.action_input || {},
        is_final: Boolean(parsed.is_final || parsed.action === "FINAL"),
        final_answer: parsed.final_answer || (parsed.action === "FINAL" ? parsed.thought : ""),
      };
    } catch (parseErr) {
      // Last resort: detect final answer markers in free text
      if (/final\s*answer[:>]/i.test(raw) || /"is_final"\s*:\s*true/i.test(raw)) {
        return {
          thought: "Detected final response despite JSON parse error.",
          action: "FINAL",
          action_input: {},
          is_final: true,
          final_answer: raw.replace(/^.*final\s*answer[:>]\s*/i, "").slice(0, 500).trim(),
        };
      }
      throw new Error(
        `LLM output could not be parsed as JSON: ${parseErr.message}\nRaw (first 400 chars): ${raw.slice(0, 400)}`
      );
    }
  }
}
