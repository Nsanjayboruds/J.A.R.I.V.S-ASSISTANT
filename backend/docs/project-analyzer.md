# J.A.R.V.I.S. Project Analyzer Architecture

This document outlines the foundation of the AI Software Engineer capabilities added in Phase 1.

## Folder Structure
```
backend/
├── services/
│   ├── ai/                      # (Future) AI Code Generation & Refactoring logic
│   ├── analyzer/
│   │   └── projectAnalyzer.service.js  # Scans project, builds tree, extracts dependencies
│   └── context/
│       └── context.service.js          # Matches user prompts to relevant files
├── controllers/
│   └── project.controller.js           # API request/response handling
└── routes/
    └── project.route.js                # Express router mapping endpoints
```

## Flow

1. **Analysis Request (`GET /api/project/analyze`)**:
   - The user requests an analysis of the project directory.
   - The `ProjectAnalyzerService` walks the directory recursively (ignoring `node_modules`, `dist`, etc.).
   - It calculates statistics (size, file counts) and builds a full JSON representation of the file tree.
   - It reads `package.json` to extract `dependencies` and dynamically detects frameworks in use (e.g., React, Next.js, Vite).

2. **Context Request (`POST /api/project/context`)**:
   - The user provides a prompt like "Fix Login Bug".
   - The `ProjectAnalyzerService` runs to get the current state of the file tree.
   - The `ContextService` extracts keywords from the prompt (e.g., "Login", "Bug").
   - It searches the file tree nodes for keyword matches in file names.
   - It returns the top 10 most relevant files to inject into an LLM context window.

## APIs

### GET /api/project/analyze
*Query Parameters:* `path` (Optional, defaults to backend's parent directory)
*Returns:*
```json
{
  "success": true,
  "data": {
    "path": "/absolute/path",
    "statistics": { "totalFiles": 150, "totalFolders": 25, "projectSizeMB": "2.50" },
    "frameworks": ["React", "Express", "Node.js"],
    "dependencies": { "dependencies": {}, "devDependencies": {}, "scripts": {} },
    "importantFiles": { "package.json": "/path", "README.md": "/path" },
    "tree": { "name": "project", "type": "folder", "children": [...] }
  }
}
```

### POST /api/project/context
*Body:* `{ "prompt": "Add Dark Mode", "path": "/optional/path" }`
*Returns:*
```json
{
  "success": true,
  "prompt": "Add Dark Mode",
  "relevantFiles": [
    { "name": "DarkMode.jsx", "path": "/path/DarkMode.jsx", "matchScore": 2 }
  ]
}
```

## Future Extension Points
- **Semantic Search**: The `ContextService` is currently using basic keyword matching. It is designed to be easily swapped with a Vector Database (like Pinecone or Chroma) and OpenAI/Groq Embeddings.
- **AI Code Generation**: With the Context Engine built, we can now pipe `relevantFiles` into the `ai` service layer, asking the LLM to generate or refactor code.
- **Multi-Agent**: The analyzer outputs raw JSON, making it perfect for feeding into a multi-agent system where a "Planner Agent" reads the tree, and a "Coder Agent" reads specific files.
