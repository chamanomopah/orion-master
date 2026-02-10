#!/usr/bin/env bun
/**
 * ProjectMemories - Query interface for project-specific memories
 *
 * This tool provides a CLI interface for querying memories by project context.
 * It implements the "Virtual View" architecture from the memory system investigation,
 * allowing unified access to both central and project-local memories.
 *
 * Commands:
 *   --current          Get memories for current project (based on CWD)
 *   --project <name>   Get memories for specific project by name
 *   --list             List all projects with memories
 *   --unified          Show unified index (central + project)
 *   --type <type>      Filter by memory type (WORK|LEARNING|RESEARCH)
 *   --json             Output as JSON instead of markdown
 *   --help             Show help
 *
 * Examples:
 *   bun ProjectMemories.ts --current
 *   bun ProjectMemories.ts --project my-app
 *   bun ProjectMemories.ts --list
 *   bun ProjectMemories.ts --unified --type WORK
 *
 * Architecture:
 * - Uses project index at MEMORY/STATE/.project-index/projects.json
 * - Falls back to scanning if index doesn't exist
 * - Detects project from CWD using marker files
 *
 * Version: 1.0.0
 * ISC: #5 - Create query interface for project memories
 */

import { parseArgs } from "util";
import * as fs from "fs";
import * as path from "path";

// ============================================================================
// Configuration
// ============================================================================

const HOME_DIR = process.env.HOME || process.env.USERPROFILE || require("os").homedir();
const CLAUDE_DIR = path.join(HOME_DIR, ".claude");
const MEMORY_DIR = path.join(CLAUDE_DIR, "MEMORY");
const PROJECT_INDEX_DIR = path.join(MEMORY_DIR, "STATE", ".project-index");
const PROJECT_INDEX_FILE = path.join(PROJECT_INDEX_DIR, "projects.json");

// ============================================================================
// Types
// ============================================================================

interface ProjectInfo {
  name: string;
  path: string;
  workIds: string[];
  lastActive: string;
  memoryPath?: string; // Optional: if project has local .pai/MEMORY
}

interface ProjectIndex {
  projects: Record<string, ProjectInfo>;
  updatedAt: string;
  version: string;
}

interface MemoryFile {
  type: "WORK" | "LEARNING" | "RESEARCH";
  path: string;
  date: string;
  description?: string;
  project: string;
}

interface MemoryQueryResult {
  project: string;
  projectPath: string;
  memories: MemoryFile[];
  totalByType: Record<string, number>;
}

// ============================================================================
// Project Detection
// ============================================================================

/**
 * Detect project from current working directory
 * Uses multiple strategies: CWD pattern, marker files, git detection
 */
function detectProject(): { name: string; path: string } | null {
  const cwd = process.cwd();

  // Strategy 1: Check if we're in ~/Projects/* pattern
  const projectsRoot = path.join(HOME_DIR, "Projects");
  if (cwd.startsWith(projectsRoot)) {
    const parts = cwd.substring(projectsRoot.length).split(path.sep).filter(Boolean);
    if (parts.length > 0) {
      return {
        name: parts[0],
        path: path.join(projectsRoot, parts[0]),
      };
    }
  }

  // Strategy 2: Look for .pai-root marker (walk up tree)
  let current = cwd;
  let iterations = 0;
  const maxIterations = 50; // Prevent infinite loops

  while (current !== HOME_DIR && current !== path.dirname(current) && iterations < maxIterations) {
    const markerPath = path.join(current, ".pai-root");
    if (fs.existsSync(markerPath)) {
      return {
        name: path.basename(current),
        path: current,
      };
    }
    current = path.dirname(current);
    iterations++;
  }

  // Strategy 3: Check for git repository (common project marker)
  try {
    const gitPath = path.join(cwd, ".git");
    if (fs.existsSync(gitPath)) {
      return {
        name: path.basename(cwd),
        path: cwd,
      };
    }
  } catch {
    // Git check failed, continue
  }

  return null; // No project detected
}

/**
 * Detect if project has local .pai/MEMORY directory
 */
function detectLocalMemoryPath(projectPath: string): string | null {
  const candidates = [
    path.join(projectPath, ".pai", "MEMORY"),
    path.join(projectPath, ".pai-memory"),
    path.join(projectPath, ".claude", "MEMORY"),
  ];

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }

  return null;
}

// ============================================================================
// Project Index Management
// ============================================================================

/**
 * Load project index from disk, creating empty one if missing
 */
function loadProjectIndex(): ProjectIndex {
  try {
    if (fs.existsSync(PROJECT_INDEX_FILE)) {
      const content = fs.readFileSync(PROJECT_INDEX_FILE, "utf-8");
      return JSON.parse(content);
    }
  } catch (error) {
    console.warn(`# Warning: Could not load project index: ${error}`);
  }

  // Return empty index
  return {
    projects: {},
    updatedAt: new Date().toISOString(),
    version: "1.0.0",
  };
}

/**
 * Save project index to disk
 */
function saveProjectIndex(index: ProjectIndex): void {
  try {
    if (!fs.existsSync(PROJECT_INDEX_DIR)) {
      fs.mkdirSync(PROJECT_INDEX_DIR, { recursive: true });
    }
    index.updatedAt = new Date().toISOString();
    fs.writeFileSync(PROJECT_INDEX_FILE, JSON.stringify(index, null, 2));
  } catch (error) {
    console.warn(`# Warning: Could not save project index: ${error}`);
  }
}

/**
 * Rebuild project index by scanning actual directories
 */
function rebuildProjectIndex(): ProjectIndex {
  const index: ProjectIndex = {
    projects: {},
    updatedAt: new Date().toISOString(),
    version: "1.0.0",
  };

  // Scan central WORK directory
  const centralWorkDir = path.join(MEMORY_DIR, "WORK");
  if (fs.existsSync(centralWorkDir)) {
    const workDirs = fs.readdirSync(centralWorkDir, { withFileTypes: true })
      .filter(d => d.isDirectory())
      .map(d => d.name);

    for (const workId of workDirs) {
      const metaPath = path.join(centralWorkDir, workId, "META.yaml");
      if (fs.existsSync(metaPath)) {
        const meta = parseMetaFile(metaPath);
        const projectName = meta.project || "central";

        if (!index.projects[projectName]) {
          index.projects[projectName] = {
            name: projectName,
            path: meta.projectPath || CLAUDE_DIR,
            workIds: [],
            lastActive: meta.date || new Date().toISOString(),
          };
        }

        index.projects[projectName].workIds.push(workId);
      }
    }
  }

  // Scan for local project memories
  // This would scan ~/Projects/* for .pai/MEMORY directories
  const projectsRoot = path.join(HOME_DIR, "Projects");
  if (fs.existsSync(projectsRoot)) {
    const projectDirs = fs.readdirSync(projectsRoot, { withFileTypes: true })
      .filter(d => d.isDirectory())
      .map(d => d.name);

    for (const projectName of projectDirs) {
      const projectPath = path.join(projectsRoot, projectName);
      const localMemory = detectLocalMemoryPath(projectPath);

      if (localMemory && !index.projects[projectName]) {
        index.projects[projectName] = {
          name: projectName,
          path: projectPath,
          workIds: [],
          lastActive: new Date().toISOString(),
          memoryPath: localMemory,
        };
      } else if (localMemory && index.projects[projectName]) {
        index.projects[projectName].memoryPath = localMemory;
      }
    }
  }

  return index;
}

/**
 * Parse META.yaml file for project metadata
 */
function parseMetaFile(metaPath: string): { project?: string; projectPath?: string; date?: string } {
  try {
    const content = fs.readFileSync(metaPath, "utf-8");
    const lines = content.split("\n");

    const result: Record<string, string> = {};
    for (const line of lines) {
      const match = line.match(/^(\w+):\s*(.+)$/);
      if (match) {
        result[match[1]] = match[2];
      }
    }

    return {
      project: result.project,
      projectPath: result.project_path || result.projectPath,
      date: result.date || result.created,
    };
  } catch {
    return {};
  }
}

// ============================================================================
// Memory Scanning
// ============================================================================

/**
 * Scan for memory files in a directory
 */
function scanMemories(baseDir: string, projectName: string, projectPath: string): MemoryFile[] {
  const memories: MemoryFile[] = [];

  if (!fs.existsSync(baseDir)) {
    return memories;
  }

  // Scan WORK directory
  const workDir = path.join(baseDir, "WORK");
  if (fs.existsSync(workDir)) {
    const workDirs = fs.readdirSync(workDir, { withFileTypes: true })
      .filter(d => d.isDirectory())
      .map(d => d.name)
      .sort()
      .reverse();

    for (const workId of workDirs) {
      const metaPath = path.join(workDir, workId, "META.yaml");
      let description = workId;

      if (fs.existsSync(metaPath)) {
        const meta = parseMetaFile(metaPath);
        description = meta.project || workId;
      }

      memories.push({
        type: "WORK",
        path: path.join(workDir, workId),
        date: workId.split("-").slice(0, 3).join("-"), // Extract YYYY-MM-DD
        description,
        project: projectName,
      });
    }
  }

  // Scan LEARNING directory
  const learningDir = path.join(baseDir, "LEARNING");
  if (fs.existsSync(learningDir)) {
    scanDirectoryRecursive(learningDir, memories, "LEARNING", projectName);
  }

  // Scan RESEARCH directory
  const researchDir = path.join(baseDir, "RESEARCH");
  if (fs.existsSync(researchDir)) {
    scanDirectoryRecursive(researchDir, memories, "RESEARCH", projectName);
  }

  return memories;
}

/**
 * Recursively scan directory for memory files
 */
function scanDirectoryRecursive(
  dir: string,
  memories: MemoryFile[],
  type: "LEARNING" | "RESEARCH",
  projectName: string
): void {
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      scanDirectoryRecursive(fullPath, memories, type, projectName);
    } else if (entry.isFile() && entry.name.endsWith(".md")) {
      const stats = fs.statSync(fullPath);
      const date = new Date(stats.mtime).toISOString().split("T")[0];

      // Extract description from filename
      const description = entry.name
        .replace(/\.md$/, "")
        .replace(/^\d{8}_T?\d*_/, "") // Remove timestamp prefix
        .replace(/_/g, " ")
        .replace(/-/g, " ");

      memories.push({
        type,
        path: fullPath,
        date,
        description,
        project: projectName,
      });
    }
  }
}

/**
 * Get memories for a specific project
 */
function getProjectMemories(projectName: string): MemoryQueryResult | null {
  const index = loadProjectIndex();
  const project = index.projects[projectName];

  if (!project) {
    return null;
  }

  // Check for local memory first
  let memories: MemoryFile[] = [];

  if (project.memoryPath && fs.existsSync(project.memoryPath)) {
    memories = scanMemories(project.memoryPath, projectName, project.path);
  }

  // Also check central memories for this project
  const centralDir = path.join(MEMORY_DIR);
  const centralMemories = scanMemories(centralDir, projectName, project.path);

  // Merge and deduplicate
  const seen = new Set<string>();
  const allMemories = [...memories, ...centralMemories].filter(m => {
    const key = `${m.type}:${m.path}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  // Sort by date descending
  allMemories.sort((a, b) => b.date.localeCompare(a.date));

  // Count by type
  const totalByType: Record<string, number> = {};
  for (const memory of allMemories) {
    totalByType[memory.type] = (totalByType[memory.type] || 0) + 1;
  }

  return {
    project: projectName,
    projectPath: project.path,
    memories: allMemories,
    totalByType,
  };
}

/**
 * Get memories for current project (detected from CWD)
 */
function getCurrentProjectMemories(): MemoryQueryResult | null {
  const detected = detectProject();

  if (!detected) {
    return null;
  }

  return getProjectMemories(detected.name);
}

/**
 * List all projects with memories
 */
function listAllProjects(): Array<ProjectInfo & { memoryCount: number }> {
  const index = loadProjectIndex();
  const projects: Array<ProjectInfo & { memoryCount: number }> = [];

  for (const [name, project] of Object.entries(index.projects)) {
    // Count actual memory files
    const result = getProjectMemories(name);
    const memoryCount = result ? result.memories.length : 0;

    projects.push({
      ...project,
      name,
      memoryCount,
    });
  }

  // Sort by last active
  projects.sort((a, b) => b.lastActive.localeCompare(a.lastActive));

  return projects;
}

/**
 * Get unified view of all memories (central + project)
 */
function getUnifiedMemories(typeFilter?: string): MemoryFile[] {
  const index = loadProjectIndex();
  const allMemories: MemoryFile[] = [];

  // Add central memories
  const centralMemories = scanMemories(MEMORY_DIR, "central", CLAUDE_DIR);
  allMemories.push(...centralMemories);

  // Add project memories
  for (const [name, project] of Object.entries(index.projects)) {
    if (name === "central") continue;

    if (project.memoryPath && fs.existsSync(project.memoryPath)) {
      const memories = scanMemories(project.memoryPath, name, project.path);
      allMemories.push(...memories);
    }
  }

  // Filter by type if specified
  const filtered = typeFilter
    ? allMemories.filter(m => m.type === typeFilter)
    : allMemories;

  // Sort by date descending
  return filtered.sort((a, b) => b.date.localeCompare(a.date));
}

// ============================================================================
// Output Formatting
// ============================================================================

/**
 * Format memory query result as markdown table
 */
function formatMarkdown(result: MemoryQueryResult): string {
  const lines: string[] = [];

  lines.push(`# Project Memories: ${result.project}`);
  lines.push();
  lines.push(`**Path:** \`${result.projectPath}\``);
  lines.push(`**Total Memories:** ${result.memories.length}`);
  lines.push();

  // Summary by type
  lines.push("## Summary by Type");
  lines.push();
  lines.push("| Type | Count |");
  lines.push("|------|-------|");
  for (const [type, count] of Object.entries(result.totalByType)) {
    lines.push(`| ${type} | ${count} |`);
  }
  lines.push();

  // Memories table
  lines.push("## Memories");
  lines.push();
  lines.push("| Type | Date | Description | Path |");
  lines.push("|------|------|-------------|------|");

  for (const memory of result.memories) {
    const relativePath = memory.path.replace(HOME_DIR, "~");
    lines.push(`| ${memory.type} | ${memory.date} | ${memory.description || "-"} | \`${relativePath}\` |`);
  }

  return lines.join("\n");
}

/**
 * Format project list as markdown table
 */
function formatProjectList(projects: Array<ProjectInfo & { memoryCount: number }>): string {
  const lines: string[] = [];

  lines.push("# All Projects with Memories");
  lines.push();
  lines.push(`**Total Projects:** ${projects.length}`);
  lines.push();

  lines.push("| Project | Path | Work Sessions | Last Active | Local Memory |");
  lines.push("|---------|------|---------------|-------------|--------------|");

  for (const project of projects) {
    const relativePath = project.path.replace(HOME_DIR, "~");
    const lastActive = project.lastActive.split("T")[0];
    const hasLocal = project.memoryPath ? "Yes" : "No";

    lines.push(`| ${project.name} | \`${relativePath}\` | ${project.workIds.length} | ${lastActive} | ${hasLocal} |`);
  }

  return lines.join("\n");
}

/**
 * Format unified memories as markdown table
 */
function formatUnifiedMemories(memories: MemoryFile[]): string {
  const lines: string[] = [];

  lines.push("# Unified Memory Index");
  lines.push();
  lines.push(`**Total Memories:** ${memories.length}`);
  lines.push();

  lines.push("| Type | Project | Date | Description | Path |");
  lines.push("|------|---------|------|-------------|------|");

  for (const memory of memories) {
    const relativePath = memory.path.replace(HOME_DIR, "~");
    lines.push(`| ${memory.type} | ${memory.project} | ${memory.date} | ${memory.description || "-"} | \`${relativePath}\` |`);
  }

  return lines.join("\n");
}

/**
 * Format as JSON
 */
function formatJson(data: unknown): string {
  return JSON.stringify(data, null, 2);
}

// ============================================================================
// CLI
// ============================================================================

const { values, positionals } = parseArgs({
  args: Bun.argv.slice(2),
  options: {
    current: { type: "boolean" },
    project: { type: "string" },
    list: { type: "boolean" },
    unified: { type: "boolean" },
    type: { type: "string" },
    json: { type: "boolean" },
    help: { type: "boolean", short: "h" },
    rebuild: { type: "boolean" },
  },
});

if (values.help) {
  console.log(`
ProjectMemories - Query interface for project-specific memories

Usage:
  bun ProjectMemories.ts --current              Get memories for current project (based on CWD)
  bun ProjectMemories.ts --project <name>       Get memories for specific project by name
  bun ProjectMemories.ts --list                 List all projects with memories
  bun ProjectMemories.ts --unified              Show unified index (central + project)

Options:
  --current                Get memories for current project
  --project <name>         Get memories for specific project
  --list                   List all projects with memories
  --unified                Show unified memory index
  --type <TYPE>            Filter by memory type (WORK|LEARNING|RESEARCH)
  --json                   Output as JSON instead of markdown
  --rebuild                Rebuild project index from disk
  --help, -h               Show this help

Examples:
  # Get memories for current project
  bun ProjectMemories.ts --current

  # Get memories for specific project
  bun ProjectMemories.ts --project my-app

  # List all projects
  bun ProjectMemories.ts --list

  # Show unified WORK memories
  bun ProjectMemories.ts --unified --type WORK

  # Output as JSON
  bun ProjectMemories.ts --list --json
`);
  process.exit(0);
}

// Handle --rebuild
if (values.rebuild) {
  console.log("# Rebuilding project index...");
  const index = rebuildProjectIndex();
  saveProjectIndex(index);
  console.log(`# Index rebuilt with ${Object.keys(index.projects).length} projects`);
  console.log(`# Saved to: ${PROJECT_INDEX_FILE}`);
  process.exit(0);
}

// Handle --current
if (values.current) {
  const result = getCurrentProjectMemories();

  if (!result) {
    const detected = detectProject();
    if (detected) {
      console.error(`# No memories found for project: ${detected.name}`);
      console.error(`# Path: ${detected.path}`);
    } else {
      console.error("# No project detected from current working directory");
      console.error(`# CWD: ${process.cwd()}`);
      console.error("# Use --list to see available projects");
    }
    process.exit(1);
  }

  if (values.json) {
    console.log(formatJson(result));
  } else {
    console.log(formatMarkdown(result));
  }
  process.exit(0);
}

// Handle --project
if (values.project) {
  const result = getProjectMemories(values.project);

  if (!result) {
    console.error(`# Project not found: ${values.project}`);
    console.error("# Use --list to see available projects");
    process.exit(1);
  }

  if (values.json) {
    console.log(formatJson(result));
  } else {
    console.log(formatMarkdown(result));
  }
  process.exit(0);
}

// Handle --list
if (values.list) {
  const projects = listAllProjects();

  if (values.json) {
    console.log(formatJson(projects));
  } else {
    console.log(formatProjectList(projects));
  }
  process.exit(0);
}

// Handle --unified
if (values.unified) {
  const typeFilter = values.type?.toUpperCase();
  const validTypes = ["WORK", "LEARNING", "RESEARCH"];

  if (typeFilter && !validTypes.includes(typeFilter)) {
    console.error(`# Invalid type: ${values.type}`);
    console.error(`# Valid types: ${validTypes.join(", ")}`);
    process.exit(1);
  }

  const memories = getUnifiedMemories(typeFilter);

  if (values.json) {
    console.log(formatJson(memories));
  } else {
    console.log(formatUnifiedMemories(memories));
  }
  process.exit(0);
}

// Default: show help
console.log("# ProjectMemories - Query interface for project-specific memories");
console.log("# Use --help for usage information");
console.log("");
console.log("Quick start:");
console.log("  bun ProjectMemories.ts --list       # List all projects");
console.log("  bun ProjectMemories.ts --current    # Show current project memories");
