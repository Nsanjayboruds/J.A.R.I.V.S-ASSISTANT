import { AgentLoop } from "../services/agent/agentLoop.js";

/**
 * Controller to handle autonomous agent execution via REST API
 */
export const runAgent = async (req, res) => {
  try {
    const { goal, maxIterations = 8 } = req.body;

    if (!goal || typeof goal !== "string") {
      return res.status(400).json({
        success: false,
        message: "A valid 'goal' string is required to run the agent.",
      });
    }

    const logs = [];
    const agent = new AgentLoop({
      maxIterations: Math.min(Math.max(1, maxIterations), 15),
      logger: (msg) => {
        logs.push(msg);
        console.log(msg);
      },
    });

    const state = await agent.run(goal);

    res.json({
      success: state.status === "COMPLETED",
      status: state.status,
      goal: state.goal,
      iterations: state.currentIteration,
      actionsTaken: state.actionsTaken,
      finalAnswer: state.finalAnswer,
      logs,
      history: state.history,
    });
  } catch (error) {
    console.error("[AgentController Error]:", error);
    res.status(500).json({
      success: false,
      message: "Agent execution failed due to an internal server error.",
      error: error.message,
    });
  }
};
