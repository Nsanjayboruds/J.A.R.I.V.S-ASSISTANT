/**
 * SafetyGuard: Security filter and secret redaction for the Agent Loop.
 * 
 * Protects against:
 * 1. High-risk destructive shell commands (rm -rf /, format disks, fork bombs, etc.)
 * 2. Unintended deletion or exposure of credential files (.env, private keys)
 * 3. Leaking API keys or secrets in logs or LLM history.
 */

// Forbidden command patterns that could destroy system or compromise host
const DANGEROUS_COMMAND_PATTERNS = [
  /\brm\s+-(?:rf?|fr?)\s+(?:\/|\/\*|\*|\~|\$HOME|\.\.)(\s|$)/i, // rm -rf /, rm -rf *, rm -rf ~
  /\bmkfs\b/i,                                                   // Format filesystem
  /\bdd\s+if=.*of=\/dev\//i,                                     // Direct disk overwriting
  /:(){ :|:& };:/,                                               // Fork bomb
  />\s*\/dev\/sd[a-z]/i,                                         // Overwriting raw drive
  /\bshutdown\b|\breboot\b|\binit\s+0\b|\binit\s+6\b/i,          // System shutdown/reboot
  /\bchmod\s+(-R\s+)?777\s+\//i,                                 // Recursively open root permissions
  /\bchown\s+(-R\s+)?.*\s+\//i,                                  // Recursively change root ownership
  /\bcurl\b.*\b\|\s*(?:bash|sh)\b/i,                             // Arbitrary curl pipe to bash
  /\bwget\b.*\b\|\s*(?:bash|sh)\b/i,                             // Arbitrary wget pipe to bash
  /\btruncate\s+-s\s+0\s+\/etc/i,                                // System file truncation
];

// Patterns for sensitive secrets that must never appear in logs or prompts
const SECRET_PATTERNS = [
  /gsk_[a-zA-Z0-9]{30,}/g,                        // Groq API Keys
  /sk-[a-zA-Z0-9]{20,}/g,                         // OpenAI-style API Keys
  /AIza[0-9A-Za-z-_]{35}/g,                       // Google Cloud / Gemini Keys
  /(?:JWT_SECRET|SECRET_KEY|API_KEY|PASSWORD|TOKEN)\s*=\s*['"]?[^\s'"]+['"]?/gi,
];

export class SafetyGuard {
  /**
   * Validates a shell command against destructive command patterns.
   * @param {string} command - Shell command to validate
   * @returns {{ safe: boolean, reason?: string }}
   */
  static validateCommand(command) {
    if (!command || typeof command !== "string") {
      return { safe: false, reason: "Command must be a non-empty string." };
    }

    const trimmed = command.trim();

    for (const pattern of DANGEROUS_COMMAND_PATTERNS) {
      if (pattern.test(trimmed)) {
        return {
          safe: false,
          reason: `Security Violation: Command matches prohibited dangerous pattern: ${pattern.toString()}`,
        };
      }
    }

    // Check for attempts to delete or write directly over .env
    if (/\b(?:rm|unlink|shred)\s+.*\.env\b/i.test(trimmed)) {
      return {
        safe: false,
        reason: "Security Violation: Direct deletion of .env configuration files is blocked.",
      };
    }

    return { safe: true };
  }

  /**
   * Redacts credentials and API keys from strings, logs, and prompt payloads.
   * @param {string} text - Raw text to sanitize
   * @returns {string} - Sanitized text with secrets redacted
   */
  static sanitizeOutput(text) {
    if (typeof text !== "string") return text;

    let sanitized = text;
    for (const pattern of SECRET_PATTERNS) {
      sanitized = sanitized.replace(pattern, "[REDACTED_SECRET]");
    }
    return sanitized;
  }
}
