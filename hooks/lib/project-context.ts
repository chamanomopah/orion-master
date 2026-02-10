/**
 * Project Context Detection Utility
 *
 * Detects whether the current working directory is within a project,
 * enabling project-specific memory routing for the Hybrid with Virtual
 * Access Layer architecture.
 *
 * Implements Path 3: Virtual First - lowest risk approach.
 *
 * @module hooks/lib/project-context
 */

import { homedir } from 'os';
import { join, basename, dirname } from 'path';
import { existsSync, readFileSync, writeFileSync, mkdirSync, renameSync } from 'fs';
import { getPaiDir, paiPath } from './paths';

/**
 * Project information interface
 *
 * Represents a detected project with its memory configuration.
 */
export interface ProjectInfo {
  /** Project name (directory basename) */
  name: string;
  /** Absolute path to project root */
  rootPath: string;
  /** Path where project memories should be stored */
  memoryPath: string;
  /** Whether this is the PAI project itself */
  isPAIProject: boolean;
  /** Detection method used */
  detectionMethod: 'projects-dir' | 'marker-file' | 'cwd';
}

/**
 * Project index entry
 *
 * Stores metadata about a project in the central index.
 */
export interface ProjectIndexEntry {
  /** Project name */
  name: string;
  /** Absolute path to project root */
  path: string;
  /** Work session IDs associated with this project */
  workIds: string[];
  /** Last activity timestamp */
  lastActive: string;
}

/**
 * Project index structure
 *
 * Top-level structure of the projects.json index file.
 */
export interface ProjectIndex {
  /** Map of project names to their index entries */
  projects: Record<string, ProjectIndexEntry>;
  /** Index last updated timestamp */
  updatedAt: string;
}

/**
 * Maximum iterations for directory traversal
 *
 * Prevents infinite loops when walking up the directory tree
 * looking for marker files.
 */
const MAX_TRAVERSAL_ITERATIONS = 50;

/**
 * Marker file for project root detection
 *
 * When this file exists in a directory, that directory is treated
 * as a project root regardless of location.
 */
const PAI_ROOT_MARKER = '.pai-root';

/**
 * Project index directory
 */
const PROJECT_INDEX_DIR = paiPath('MEMORY', 'STATE', '.project-index');

/**
 * Project index file
 */
const PROJECT_INDEX_FILE = join(PROJECT_INDEX_DIR, 'projects.json');

/**
 * Error types for project detection
 */
export enum ProjectDetectionError {
  /** Filesystem operation failed */
  FILESYSTEM_ERROR = 'FILESYSTEM_ERROR',
  /** Maximum traversal depth exceeded */
  MAX_DEPTH_EXCEEDED = 'MAX_DEPTH_EXCEEDED',
  /** Path resolution failed */
  PATH_RESOLUTION_ERROR = 'PATH_RESOLUTION_ERROR',
}

/**
 * Detect project context from current working directory
 *
 * Implements a three-tier detection strategy:
 * 1. Check if CWD is in ~/Projects/* (simple detection)
 * 2. Fall back to .pai-root marker file detection (walk up tree)
 * 3. Return null for central mode (when in PAI itself or no project detected)
 *
 * @returns ProjectInfo if detected, null for central mode
 *
 * @example
 * ```typescript
 * const project = detectProject();
 * if (project) {
 *   console.log(`Working in project: ${project.name}`);
 *   console.log(`Memories stored in: ${project.memoryPath}`);
 * } else {
 *   console.log('Using central memory mode');
 * }
 * ```
 */
export function detectProject(): ProjectInfo | null {
  try {
    const cwd = process.cwd();

    // Safety check: ensure we have a valid CWD
    if (!cwd || typeof cwd !== 'string') {
      console.error('[project-context] Invalid CWD detected');
      return null;
    }

    // Check if we're IN the PAI project itself
    const paiDir = getPaiDir();
    if (cwd.startsWith(paiDir) || cwd.includes('.claude')) {
      // We're working on PAI itself - use central mode
      return null;
    }

    // Strategy 1: Check if CWD is in ~/Projects/*
    const projectsRoot = join(homedir(), 'Projects');
    if (cwd.startsWith(projectsRoot)) {
      const projectName = basename(cwd);
      return {
        name: projectName,
        rootPath: cwd,
        memoryPath: join(cwd, '.pai-memory'),
        isPAIProject: false,
        detectionMethod: 'projects-dir',
      };
    }

    // Strategy 2: Walk up tree looking for .pai-root marker
    let current = cwd;
    let iterations = 0;

    while (iterations < MAX_TRAVERSAL_ITERATIONS) {
      const markerPath = join(current, PAI_ROOT_MARKER);

      if (existsSync(markerPath)) {
        const projectName = basename(current);
        return {
          name: projectName,
          rootPath: current,
          memoryPath: join(current, '.pai-memory'),
          isPAIProject: false,
          detectionMethod: 'marker-file',
        };
      }

      // Move up one directory
      const parent = dirname(current);

      // Stop if we've reached the home directory or root
      if (parent === current || parent === homedir() || parent === dirname(homedir())) {
        break;
      }

      current = parent;
      iterations++;
    }

    // Check if we exceeded max iterations
    if (iterations >= MAX_TRAVERSAL_ITERATIONS) {
      console.error(`[project-context] Max traversal depth (${MAX_TRAVERSAL_ITERATIONS}) exceeded`);
      return null;
    }

    // Strategy 3: Check CWD itself as a potential project root
    // This handles cases where user is in a project outside ~/Projects
    // and hasn't created a marker file yet
    const hasGit = existsSync(join(cwd, '.git'));
    const hasPackageJson = existsSync(join(cwd, 'package.json'));
    const hasCargoToml = existsSync(join(cwd, 'Cargo.toml'));

    if (hasGit || hasPackageJson || hasCargoToml) {
      const projectName = basename(cwd);
      return {
        name: projectName,
        rootPath: cwd,
        memoryPath: join(cwd, '.pai-memory'),
        isPAIProject: false,
        detectionMethod: 'cwd',
      };
    }

    // No project detected - use central mode
    return null;

  } catch (error) {
    // Log error but don't throw - fall back to central mode
    console.error('[project-context] Detection failed:', error instanceof Error ? error.message : String(error));
    return null;
  }
}

/**
 * Get memory directory for current context
 *
 * Returns the appropriate memory directory based on project detection.
 * Uses project-local memory if a project is detected, otherwise central.
 *
 * @param subdirectory Optional subdirectory (e.g., 'WORK', 'LEARNING')
 * @returns Absolute path to memory directory
 */
export function getMemoryDir(subdirectory?: string): string {
  const project = detectProject();

  if (project) {
    // Project mode
    return subdirectory
      ? join(project.memoryPath, subdirectory)
      : project.memoryPath;
  }

  // Central mode
  return subdirectory
    ? paiPath('MEMORY', subdirectory)
    : paiPath('MEMORY');
}

/**
 * Ensure project index directory exists
 */
function ensureProjectIndexDir(): void {
  try {
    if (!existsSync(PROJECT_INDEX_DIR)) {
      mkdirSync(PROJECT_INDEX_DIR, { recursive: true });
    }
  } catch (error) {
    console.error('[project-context] Failed to create project index directory:', error);
    // Non-fatal - continue without index
  }
}

/**
 * Read project index from disk
 *
 * @returns Project index data, or empty index if file doesn't exist
 */
export function getProjectIndex(): ProjectIndex {
  try {
    ensureProjectIndexDir();

    if (existsSync(PROJECT_INDEX_FILE)) {
      const content = readFileSync(PROJECT_INDEX_FILE, 'utf-8');
      return JSON.parse(content) as ProjectIndex;
    }

    // Return empty index
    return {
      projects: {},
      updatedAt: new Date().toISOString(),
    };
  } catch (error) {
    console.error('[project-context] Failed to read project index:', error);
    // Return empty index on error
    return {
      projects: {},
      updatedAt: new Date().toISOString(),
    };
  }
}

/**
 * Write project index to disk atomically
 *
 * Uses temp-file + rename pattern for atomic writes.
 *
 * @param index Project index data to write
 */
function writeProjectIndex(index: ProjectIndex): void {
  try {
    ensureProjectIndexDir();

    // Update timestamp
    index.updatedAt = new Date().toISOString();

    // Write to temp file first
    const tempFile = `${PROJECT_INDEX_FILE}.tmp`;
    writeFileSync(tempFile, JSON.stringify(index, null, 2), 'utf-8');

    // Atomic rename
    renameSync(tempFile, PROJECT_INDEX_FILE);

  } catch (error) {
    console.error('[project-context] Failed to write project index:', error);
    // Non-fatal - log but don't throw
  }
}

/**
 * Update project index with a new work session
 *
 * Adds the work session ID to the appropriate project's entry
 * in the index, creating a new entry if needed.
 *
 * @param projectName Project name
 * @param workId Work session ID
 * @param workPath Absolute path to work directory
 */
export function updateProjectIndex(
  projectName: string,
  workId: string,
  workPath: string
): void {
  try {
    const index = getProjectIndex();

    if (!index.projects[projectName]) {
      // Detect project to get path
      const project = detectProject();
      const projectPath = project?.rootPath || workPath;

      index.projects[projectName] = {
        name: projectName,
        path: projectPath,
        workIds: [],
        lastActive: new Date().toISOString(),
      };
    }

    // Add work ID if not already present
    const entry = index.projects[projectName];
    if (!entry.workIds.includes(workId)) {
      entry.workIds.push(workId);
    }

    // Update last active time
    entry.lastActive = new Date().toISOString();

    writeProjectIndex(index);

  } catch (error) {
    console.error('[project-context] Failed to update project index:', error);
    // Non-fatal - don't block work creation
  }
}

/**
 * Get all work IDs for a specific project
 *
 * @param projectName Project name
 * @returns Array of work session IDs, empty array if project not found
 */
export function getProjectWorkIds(projectName: string): string[] {
  try {
    const index = getProjectIndex();
    return index.projects[projectName]?.workIds || [];
  } catch (error) {
    console.error('[project-context] Failed to get project work IDs:', error);
    return [];
  }
}

/**
 * Get all projects in the index
 *
 * @returns Array of project index entries
 */
export function getAllProjects(): ProjectIndexEntry[] {
  try {
    const index = getProjectIndex();
    return Object.values(index.projects);
  } catch (error) {
    console.error('[project-context] Failed to get all projects:', error);
    return [];
  }
}

/**
 * Create .pai-root marker file in current directory
 *
 * Initializes a project root marker for explicit project detection.
 *
 * @param directory Optional directory path (defaults to CWD)
 * @returns true if marker created, false otherwise
 */
export function createProjectMarker(directory?: string): boolean {
  try {
    const targetDir = directory || process.cwd();
    const markerPath = join(targetDir, PAI_ROOT_MARKER);

    if (!existsSync(markerPath)) {
      writeFileSync(markerPath, '# PAI Project Root\n# This file marks this directory as a project root\n', 'utf-8');
      return true;
    }

    return false;
  } catch (error) {
    console.error('[project-context] Failed to create project marker:', error);
    return false;
  }
}

/**
 * Check if currently in a project
 *
 * Convenience function that returns true if a project is detected.
 *
 * @returns true if in a project, false otherwise
 */
export function isInProject(): boolean {
  return detectProject() !== null;
}

/**
 * Get current project name
 *
 * Convenience function that returns the current project name,
 * or null if not in a project.
 *
 * @returns Project name or null
 */
export function getCurrentProjectName(): string | null {
  const project = detectProject();
  return project?.name || null;
}
