/**
 * ToolRegistry: Standardized tool definitions and executor for J.A.R.V.I.S. Agent.
 * 
 * Defines standard tool interfaces:
 * - name: string
 * - description: string
 * - parameters: JSON schema-like parameter definition
 * - execute: async function(args) returning string output
 */

import fs from "fs";
import path from "path";
import { exec } from "child_process";
import { SafetyGuard } from "./safetyGuard.js";
import { ProjectAnalyzerService } from "../analyzer/projectAnalyzer.service.js";

// Root workspace directory boundary
const WORKSPACE_ROOT = path.resolve(process.cwd());

export class ToolRegistry {
  constructor() {
    this.tools = new Map();
    this._registerBuiltinTools();
  }

  /**
   * Register a tool in the registry
   */
  register(tool) {
    if (!tool.name || typeof tool.execute !== "function") {
      throw new Error(`Invalid tool format: missing name or execute function.`);
    }
    this.tools.set(tool.name, tool);
  }

  /**
   * Retrieve a tool by name
   */
  get(name) {
    return this.tools.get(name);
  }

  /**
   * Check if a tool exists
   */
  has(name) {
    return this.tools.has(name);
  }

  /**
   * Return schema descriptions of all registered tools for the LLM prompt
   */
  getToolsPrompt() {
    const descriptions = [];
    for (const [name, tool] of this.tools.entries()) {
      descriptions.push({
        name: tool.name,
        description: tool.description,
        parameters: tool.parameters,
      });
    }
    return JSON.stringify(descriptions, null, 2);
  }

  /**
   * Execute a tool with given name and arguments
   */
  async execute(name, args = {}) {
    const tool = this.tools.get(name);
    if (!tool) {
      return `Error: Tool '${name}' is not recognized. Available tools: ${Array.from(this.tools.keys()).join(", ")}`;
    }

    try {
      const rawResult = await tool.execute(args);
      return SafetyGuard.sanitizeOutput(typeof rawResult === "string" ? rawResult : JSON.stringify(rawResult, null, 2));
    } catch (err) {
      return `Error executing tool '${name}': ${err.message}`;
    }
  }

  /**
   * Register all built-in core developer tools
   */
  _registerBuiltinTools() {
    // 1. read_file
    this.register({
      name: "read_file",
      description: "Read contents of a file. Supports optional startLine and endLine (1-indexed).",
      parameters: {
        type: "object",
        properties: {
          filePath: { type: "string", description: "Relative or absolute path to the file." },
          startLine: { type: "number", description: "Starting line number (optional, 1-indexed)." },
          endLine: { type: "number", description: "Ending line number (optional, 1-indexed)." },
        },
        required: ["filePath"],
      },
      execute: async (args) => {
        // Accept both 'filePath' and 'path' parameter names
        const filePath = args.filePath || args.path;
        const startLine = args.startLine;
        const endLine = args.endLine;
        if (!filePath) return "Error: 'filePath' parameter is required for read_file.";
        const resolvedPath = path.resolve(WORKSPACE_ROOT, filePath);
        if (!fs.existsSync(resolvedPath)) {
          return `Error: File not found at ${filePath}`;
        }

        const stat = fs.statSync(resolvedPath);
        if (stat.isDirectory()) {
          return `Error: ${filePath} is a directory, not a file. Use list_dir instead.`;
        }

        const content = fs.readFileSync(resolvedPath, "utf-8");
        const lines = content.split("\n");

        const start = startLine ? Math.max(1, parseInt(startLine, 10)) : 1;
        const end = endLine ? Math.min(lines.length, parseInt(endLine, 10)) : lines.length;

        const slice = lines.slice(start - 1, end);
        const numbered = slice.map((line, idx) => `${start + idx}: ${line}`).join("\n");
        return `File: ${filePath} (lines ${start}-${end} of ${lines.length}):\n${numbered}`;
      },
    });

    // 2. write_file
    this.register({
      name: "write_file",
      description: "Create a new file or completely overwrite an existing file with the provided content.",
      parameters: {
        type: "object",
        properties: {
          filePath: { type: "string", description: "Path to write the file to." },
          content: { type: "string", description: "The complete content to write into the file." },
        },
        required: ["filePath", "content"],
      },
      execute: async (args) => {
        // Accept both 'filePath' and 'path' parameter names
        const filePath = args.filePath || args.path;
        const content = args.content;
        if (!filePath) return "Error: 'filePath' parameter is required for write_file.";
        if (content === undefined) return "Error: 'content' parameter is required for write_file.";
        const resolvedPath = path.resolve(WORKSPACE_ROOT, filePath);
        const dir = path.dirname(resolvedPath);
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }
        fs.writeFileSync(resolvedPath, content, "utf-8");
        return `Successfully wrote ${Buffer.byteLength(content, "utf-8")} bytes to ${filePath}`;
      },
    });

    // 3. patch_file
    this.register({
      name: "patch_file",
      description: "Replace a specific target snippet in a file with new content. Fails if targetSnippet is not found.",
      parameters: {
        type: "object",
        properties: {
          filePath: { type: "string", description: "Path of file to patch." },
          targetSnippet: { type: "string", description: "The exact existing snippet to replace." },
          replacementSnippet: { type: "string", description: "The new snippet to insert." },
        },
        required: ["filePath", "targetSnippet", "replacementSnippet"],
      },
      execute: async (args) => {
        // Accept 'filePath'/'path', 'targetSnippet'/'targetContent', 'replacementSnippet'/'replacement'
        const filePath = args.filePath || args.path;
        const targetSnippet = args.targetSnippet || args.targetContent || args.target;
        const replacementSnippet = args.replacementSnippet || args.replacement || args.replacementContent;
        if (!filePath) return "Error: 'filePath' parameter is required for patch_file.";
        if (!targetSnippet) return "Error: 'targetSnippet' parameter is required for patch_file.";
        if (replacementSnippet === undefined) return "Error: 'replacementSnippet' parameter is required for patch_file.";
        const resolvedPath = path.resolve(WORKSPACE_ROOT, filePath);
        if (!fs.existsSync(resolvedPath)) {
          return `Error: File not found at ${filePath}`;
        }
        const content = fs.readFileSync(resolvedPath, "utf-8");
        if (!content.includes(targetSnippet)) {
          return `Error: targetSnippet not found in ${filePath}. Use read_file to inspect the exact content first.`;
        }
        const patched = content.replace(targetSnippet, replacementSnippet);
        fs.writeFileSync(resolvedPath, patched, "utf-8");
        return `Successfully patched ${filePath} — replaced target snippet.`;
      },
    });

    // 4. list_dir
    this.register({
      name: "list_dir",
      description: "List files and subdirectories in a directory path.",
      parameters: {
        type: "object",
        properties: {
          dirPath: { type: "string", description: "Directory to list (defaults to current directory '.')." },
        },
      },
      execute: async ({ dirPath = "." }) => {
        const resolvedPath = path.resolve(WORKSPACE_ROOT, dirPath);
        if (!fs.existsSync(resolvedPath)) {
          return `Error: Directory not found at ${dirPath}`;
        }
        const items = fs.readdirSync(resolvedPath);
        const results = items
          .filter((item) => !["node_modules", ".git", ".next", "coverage"].includes(item))
          .map((item) => {
            const itemPath = path.join(resolvedPath, item);
            try {
              const stat = fs.statSync(itemPath);
              return `${stat.isDirectory() ? "[DIR] " : "[FILE]"} ${item} (${stat.size} bytes)`;
            } catch {
              return `[UNKNOWN] ${item}`;
            }
          });
        return `Directory contents of ${dirPath}:\n${results.join("\n") || "(empty)"}`;
      },
    });

    // 5. search_code
    this.register({
      name: "search_code",
      description: "Search for a string or regex pattern across files in a directory.",
      parameters: {
        type: "object",
        properties: {
          query: { type: "string", description: "Search query or regex." },
          dirPath: { type: "string", description: "Directory to search in (default: '.')." },
        },
        required: ["query"],
      },
      execute: async ({ query, dirPath = "." }) => {
        const resolvedPath = path.resolve(WORKSPACE_ROOT, dirPath);
        if (!fs.existsSync(resolvedPath)) {
          return `Error: Directory not found at ${dirPath}`;
        }

        const matches = [];
        const ignored = ["node_modules", ".git", "dist", "build", "coverage"];

        const searchDirectory = (dir) => {
          if (matches.length >= 25) return;
          let entries;
          try {
            entries = fs.readdirSync(dir, { withFileTypes: true });
          } catch {
            return;
          }

          for (const entry of entries) {
            if (matches.length >= 25) break;
            if (ignored.includes(entry.name)) continue;

            const full = path.join(dir, entry.name);
            if (entry.isDirectory()) {
              searchDirectory(full);
            } else if (entry.isFile()) {
              try {
                const text = fs.readFileSync(full, "utf-8");
                const lines = text.split("\n");
                lines.forEach((line, idx) => {
                  if (line.toLowerCase().includes(query.toLowerCase()) && matches.length < 25) {
                    const rel = path.relative(WORKSPACE_ROOT, full);
                    matches.push(`${rel}:${idx + 1}: ${line.trim()}`);
                  }
                });
              } catch {
                // Ignore binary/unreadable files
              }
            }
          }
        };

        searchDirectory(resolvedPath);
        return matches.length > 0
          ? `Found ${matches.length} matches for '${query}':\n${matches.join("\n")}`
          : `No matches found for '${query}' in ${dirPath}.`;
      },
    });

    // 6. execute_command
    this.register({
      name: "execute_command",
      description: "Execute a bash/shell command with safety validation and return stdout/stderr/exitCode.",
      parameters: {
        type: "object",
        properties: {
          command: { type: "string", description: "The shell command to execute." },
          cwd: { type: "string", description: "Working directory relative to workspace (optional)." },
        },
        required: ["command"],
      },
      execute: async ({ command, cwd = "." }) => {
        // Run safety validation first
        const safetyCheck = SafetyGuard.validateCommand(command);
        if (!safetyCheck.safe) {
          return `Blocked by SafetyGuard: ${safetyCheck.reason}`;
        }

        const executionCwd = path.resolve(WORKSPACE_ROOT, cwd);

        return new Promise((resolve) => {
          exec(
            command,
            {
              cwd: executionCwd,
              timeout: 25000, // 25 second timeout
              maxBuffer: 1024 * 1024 * 2, // 2MB buffer
            },
            (error, stdout, stderr) => {
              const parts = [];
              if (stdout && stdout.trim()) {
                parts.push(`[stdout]\n${stdout.trim()}`);
              }
              if (stderr && stderr.trim()) {
                parts.push(`[stderr]\n${stderr.trim()}`);
              }
              if (error) {
                parts.push(`[exit status] Error: ${error.message} (code: ${error.code || 1})`);
              } else {
                parts.push(`[exit status] Success (code: 0)`);
              }

              resolve(parts.join("\n\n"));
            }
          );
        });
      },
    });

    // 7. analyze_project
    this.register({
      name: "analyze_project",
      description: "Analyze project structure, frameworks, dependencies, and file statistics using ProjectAnalyzerService.",
      parameters: {
        type: "object",
        properties: {
          projectPath: { type: "string", description: "Path to project root (default: '.')." },
        },
      },
      execute: async ({ projectPath = "." }) => {
        const resolved = path.resolve(WORKSPACE_ROOT, projectPath);
        const analysis = await ProjectAnalyzerService.analyzeProject(resolved);
        return {
          path: analysis.path,
          statistics: analysis.statistics,
          frameworks: analysis.frameworks,
          dependencies: Object.keys(analysis.dependencies?.dependencies || {}),
          importantFiles: Object.keys(analysis.importantFiles || {}),
        };
      },
    });

    // 8. inspect_screen
    this.register({
      name: "inspect_screen",
      description: "Capture the desktop screen and analyze visible elements via Groq Vision.",
      parameters: {
        type: "object",
        properties: {},
      },
      execute: async () => {
        try {
          const screenshot = (await import("screenshot-desktop")).default;
          const axios = (await import("axios")).default;
          const imgBuffer = await screenshot({ format: "jpeg" });
          const base64Image = imgBuffer.toString("base64");

          const response = await axios.post(
            "https://api.groq.com/openai/v1/chat/completions",
            {
              model: "llama-3.2-11b-vision-preview",
              messages: [
                {
                  role: "user",
                  content: [
                    { type: "text", text: "Describe what is currently visible on the screen concisely." },
                    { type: "image_url", image_url: { url: `data:image/jpeg;base64,${base64Image}` } },
                  ],
                },
              ],
              max_tokens: 150,
            },
            {
              headers: {
                Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
                "Content-Type": "application/json",
              },
            }
          );
          return response.data.choices[0].message.content;
        } catch (err) {
          return `Screen inspection unavailable (e.g. headless/container environment): ${err.message}`;
        }
      },
    });
  }
}
