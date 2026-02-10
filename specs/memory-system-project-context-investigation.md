# Memory System Project Context Investigation

**Status:** 🔄 In Progress
**Created:** 2026-02-10
**Priority:** High
**Related Issue:** Memory hooks creating files in centralized location instead of project-specific

---

## Problem Statement

The PAI memory system is currently storing all work, learning, and research files in the centralized `~/.claude/MEMORY/` directory, regardless of which project the user is working on. The user expects project-specific memories to be stored within each project directory.

### Current Behavior

**Hooks with Hardcoded Centralized Paths:**

| Hook | Line | Hardcoded Path |
|------|------|----------------|
| `AutoWorkCreation.hook.ts` | 55 | `join(BASE_DIR, 'MEMORY', 'WORK')` |
| `ResponseCapture.ts` | 26 | `join(BASE_DIR, 'MEMORY', 'WORK')` |
| `ResponseCapture.ts` | 300 | `join(BASE_DIR, 'MEMORY', 'LEARNING', category, yearMonth)` |

**Result:** All memories created in:
- `C:\Users\JOSE\.claude\MEMORY\WORK\`
- `C:\Users\JOSE\.claude\MEMORY\LEARNING\`
- `C:\Users\JOSE\.claude\MEMORY\RESEARCH\`

### Expected Behavior

When working in a specific project (e.g., `C:\Users\JOSE\Projects\MyProject\`), memories should be stored within that project:
- `C:\Users\JOSE\Projects\MyProject\.pai-memory\WORK\`
- `C:\Users\JOSE\Projects\MyProject\.pai-memory\LEARNING\`
- `C:\Users\JOSE\Projects\MyProject\.pai-memory\RESEARCH\`

When working on PAI itself or in non-project context, memories can remain centralized in `~/.claude/MEMORY/`.

---

## Root Cause Analysis

### 1. No Project Context Detection

The hooks do not detect the current working directory or project context. They always use `getPaiDir()` which returns the PAI base directory (`~/.claude`).

### 2. Hardcoded Memory Paths

All memory paths are derived from `BASE_DIR` (PAI directory), not from the current project directory.

### 3. Architecture Mismatch

The MEMORYSYSTEM.md documentation describes a centralized architecture, but user expectations align with a distributed/project-specific architecture.

---

## Investigation Tasks

### Task 1: Check for Existing Project Context Logic ✅
**Status:** Completed
**Findings:** No project context detection found in hooks. All paths use `getPaiDir()`.

### Task 2: Architecture Debate ✅
**Status:** Completed (Agent: adce28f)
**Findings:** Comprehensive 5-perspective debate completed. See "Agent Findings" section below.

### Task 3: Explore Claude Code Project Detection ✅
**Status:** Completed (Agent: a93303b)
**Findings:** Hooks have ZERO project context awareness. See "Project Detection Findings" below.

### Task 4: Design Solution Architecture ⏳
**Status:** Pending
**Goal:** Design the fix for project-specific memory routing

---

## Key Questions

1. **Detection:** How should hooks detect which project they're running in?
   - Does Claude Code provide project path to hooks?
   - Should we use `process.cwd()`?
   - Should we detect `.git` directory as project marker?

2. **Scope:** Which memories should be project-specific vs centralized?
   - WORK/session tracking: project-specific?
   - LEARNING: project-specific or centralized?
   - RESEARCH: project-specific or centralized?
   - STATE: always centralized?

3. **Migration:** How to migrate existing centralized memories?
   - Copy to project locations?
   - Keep historical in central, new in project?
   - User opt-in?

4. **Fallback:** What if not in a project directory?
   - Fall back to centralized location?
   - What defines a "project"?

---

## Agent Findings: Comprehensive Architecture Analysis

**Source:** Agent adce28f (Intern - Debate Team)
**Completed:** 2026-02-10
**Analysis Type:** Multi-perspective architectural debate

### Five Perspectives Debated

#### 1. Purist Centralist (Status Quo Defense)
**Core Argument:** Memories are system-level artifacts, not project artifacts.

**Key Points:**
- LEARNING is cross-project (applies universally)
- RESEARCH is reusable across projects
- WORK tracks AI sessions, not project state
- Simpler mental model - one location
- Easier backup/restore
- Cross-project pattern detection possible

**Tradeoffs:** Looser project coupling, collaborators don't get context in repo

#### 2. Project-Native Advocate (User Expectation)
**Core Argument:** When working in `~/Projects/my-app`, PAI should remember things there.

**Key Points:**
- Aligns with user expectations
- Repository portability (`.pai/` in git)
- Contextual isolation between projects
- Natural discovery within project
- Git integration with code changes
- Automatic cleanup on project delete

**Tradeoffs:** Redundant learning, scattered backups, no unified view

#### 3. Hybrid Context-Aware (Semantic Routing)
**Core Argument:** Memory location depends on TYPE, not single rule.

**Proposed Routing:**
| Memory Type | Location | Rationale |
|-------------|----------|-----------|
| LEARNING/SYSTEM/ | Central | Tooling learnings apply everywhere |
| LEARNING/ALGORITHM/ | Central | Approach learnings are universal |
| LEARNING/FAILURES/ | Central | Failure analysis improves all projects |
| RESEARCH/ | Project-local | Research often project-specific |
| WORK/ | Project-local | Work sessions are project-bound |
| LEARNING/SIGNALS/ | Central | AI performance tracking is global |

**Tradeoffs:** More complex routing logic, gray areas in classification

#### 4. Symlink Federation (Zero-Copy Distribution)
**Core Argument:** Keep centralized storage, create project-local symlinks for accessibility.

**Proposed Structure:**
```
~/.claude/MEMORY/ (canonical)
└── WORK/20260210-project-alpha/ (actual storage)

~/Projects/project-alpha/.pai/
├── WORK -> ~/.claude/MEMORY/WORK/20260210-project-alpha
└── CURRENT -> ~/.claude/MEMORY/WORK/20260210-project-alpha
```

**Tradeoffs:** Windows symlink issues, complex link management, absolute paths break on move

#### 5. Virtual View (Index-Based Access)
**Core Argument:** Storage location irrelevant; build unified query layer.

**Proposed Architecture:**
```
~/.claude/MEMORY/ (physical - unchanged)
└── .project-index/ (NEW)
    └── 20260210-project-alpha.json
        { work_ids: [...], path: "C:/Users/JOSE/Projects/..." }
```

**Access Pattern:** Detect project → Query index → Return matching work dirs

**Tradeoffs:** Indirection complexity, requires index maintenance

### Cross-Cutting Tradeoff Matrix

| Dimension | Centralized | Project-Local | Hybrid | Symlink | Virtual |
|-----------|-------------|---------------|--------|---------|---------|
| Backup Simplicity | Excellent | Poor | Good | Good | Excellent |
| Collaborator Sharing | Poor | Excellent | Good | Poor | Good |
| Cross-Project Learning | Excellent | Poor | Good | Excellent | Excellent |
| User Mental Model | Poor | Excellent | Good | Good | Excellent |
| Implementation Complexity | Low | Medium | High | High | Medium |
| Migration Effort | None | High | Medium | Low | Low |
| Windows Compatibility | Excellent | Excellent | Excellent | Poor | Excellent |
| Git Integration | Poor | Excellent | Good | Medium | Medium |

---

## Context Detection Approaches (Agent Analysis)

### Approach A: CWD-Based Detection (Simplest)
```typescript
function detectProject(): ProjectInfo | null {
  const cwd = process.cwd();
  const projectsRoot = join(homedir(), 'Projects');

  if (cwd.startsWith(projectsRoot)) {
    return {
      name: basename(cwd),
      path: cwd,
      memoryPath: join(cwd, '.pai', 'MEMORY')
    };
  }
  return null; // Central mode
}
```
**Pros:** Simple, deterministic, works for existing projects
**Cons:** Fails if working outside project tree, assumes single layout

### Approach B: Marker File Detection
```typescript
function detectProject(): ProjectInfo | null {
  const cwd = process.cwd();
  let current = cwd;

  while (current !== homedir()) {
    if (exists(join(current, '.pai-root'))) {
      return {
        name: basename(current),
        path: current,
        memoryPath: join(current, '.pai', 'MEMORY')
      };
    }
    current = dirname(current);
  }
  return null;
}
```
**Pros:** Any project layout, nested subprojects
**Cons:** Requires initialization, traversal overhead

### Approach C: Explicit Configuration (Registry)
```typescript
interface ProjectRegistry {
  projects: {
    [alias: string]: {
      path: string;
      memoryMode: 'local' | 'central' | 'hybrid';
    }
  }
}
```
**Pros:** Explicit control, per-project config, aliases
**Cons:** Manual registration, sync issues

**Agent Recommendation:** Hybrid A + B
- Start with CWD-based for `~/Projects/*`
- Fall back to marker file search
- Initialize with marker creation on first use

---

## Migration Paths (Agent Analysis)

### Path 1: Big Bang (All-at-once)
**Effort:** 2-3 days
**Risk:** High
**Steps:**
1. Scan existing WORK directories
2. Parse META.yaml for project context
3. Move to project directories
4. Update all hooks
5. Rollback: `git revert` or backup restore

### Path 2: Phased Rollout (Recommended)
**Effort:** 2-3 weeks + 6+ months rollout
**Risk:** Low

**Phase 1:** Dual-write (1 week)
- Hooks write to BOTH central and project-local
- Validate, compare outputs
- Zero user impact

**Phase 2:** Project-local opt-in (1 month)
- Add setting: `memory.location: "project"`
- Projects opt-in individually
- Monitor issues

**Phase 3:** Default to project-local (1 month)
- New projects use project-local by default
- Existing projects can stay central

**Phase 4:** Sunset central (6+ months later)
- Deprecation warning
- Final migration script

### Path 3: Virtual First (Minimal Changes)
**Effort:** 1-2 weeks
**Risk:** Minimal

**Phase 1:** Build index layer (no storage changes)
- Create `.project-index` mapping
- Add query functions
- UI shows virtual groupings

**Phase 2:** Test workflows
- Validate virtual access meets needs
- Iterate on logic

**Phase 3:** Optional physical migration
- If virtual works, storage matters less
- Can migrate later if desired

---

## Final Recommendation (Agent Consensus)

### **Recommended: Hybrid with Virtual Access Layer**

**Structure:**
```
~/.claude/MEMORY/                      # Central PAI system memories
├── LEARNING/                          # All learning (STAY CENTRAL)
│   ├── SYSTEM/
│   ├── ALGORITHM/
│   ├── FAILURES/
│   ├── SIGNALS/
│   └── SYNTHESIS/
├── STATE/                             # Runtime state (STAY CENTRAL)
├── SECURITY/                          # Security events (STAY CENTRAL)
└── WORK/                              # Work sessions (OPTIONALLY LOCAL)

~/Projects/my-app/.pai/MEMORY/         # Project-local option
├── WORK/                              # Symlink or copy from central
└── RESEARCH/                          # Project-specific research

~/.claude/MEMORY/.project-index/       # NEW: Unified index
└── projects.json                      # { "my-app": { work_ids: [...], path: "..." } }
```

**Implementation Timeline:**

1. **Immediate (v7.2):** Add virtual access layer
   - Create project index on work creation
   - Add "project memories" query functions
   - No storage changes

2. **Short-term (v7.3):** Dual-write support
   - Hooks can write WORK to project-local if configured
   - Central WORK remains authoritative
   - Index layer merges both sources

3. **Long-term (v8.0):** Hybrid default
   - New projects default to local WORK/RESEARCH
   - System learning stays central
   - Migration tool for existing projects

**Why This Approach:**
- Low risk (virtual layer adds value without breaking)
- Validates assumption (tests if project-local access matters)
- Preserves benefits (central learning aggregation)
- Flexible future (can evolve to full project-local)
- Windows-friendly (no symlink dependency initially)

---

---

## Project Detection Findings (Agent a93303b)

**Source:** Agent a93303b (Explore)
**Completed:** 2026-02-10
**Analysis Type:** Codebase investigation for project context detection

### Current State: NO Project Context Awareness

**Key Findings:**

1. **No Project Detection Logic**
   - Hooks do NOT check `process.cwd()` for current project directory
   - Hooks do NOT detect git repository root
   - Hooks do NOT resolve project root from working directory
   - All hooks use PAI directory (`~/.claude`) as base

2. **Existing Context Sources**
   - **LoadContext Hook**: Only reads `skills/PAI/SKILL.md` and steering rules
   - **AutoWork Creation**: Creates work in `MEMORY/WORK/` without project awareness
   - **TraceEmitter**: Uses `findActiveWorkDir()` but only for PAI work sessions
   - **Subagent Detection**: Checks `CLAUDE_PROJECT_DIR` but only for subagent context

3. **Path Resolution Pattern**
   ```typescript
   // ALL hooks use this pattern:
   const WORK_DIR = join(getPaiDir(), 'MEMORY', 'WORK');
   // No integration with actual project directories
   ```

4. **What's Missing**
   - No git repository detection
   - No project root resolution
   - No project-specific configuration loading
   - No correlation between work sessions and actual projects

**Implication:** To implement project-specific memories, hooks MUST be modified to:
1. Detect current working directory
2. Resolve project root (git repo or marker file)
3. Route memories based on detected project context

---

## Implementation Recommendations

Based on both agent findings, here's the concrete implementation path:

### Phase 1: Add Project Detection (v7.2)

**New Utility Module:** `hooks/lib/project-detection.ts`

```typescript
interface ProjectInfo {
  name: string;
  rootPath: string;
  memoryPath: string;
  isPAIProject: boolean;
}

export function detectProject(): ProjectInfo | null {
  const cwd = process.cwd();

  // Check if we're in ~/Projects/*
  const projectsRoot = join(homedir(), 'Projects');
  if (cwd.startsWith(projectsRoot)) {
    const projectName = basename(cwd);
    return {
      name: projectName,
      rootPath: cwd,
      memoryPath: join(cwd, '.pai', 'MEMORY'),
      isPAIProject: false
    };
  }

  // Check for .pai-root marker (walk up tree)
  let current = cwd;
  while (current !== homedir()) {
    if (existsSync(join(current, '.pai-root'))) {
      return {
        name: basename(current),
        rootPath: current,
        memoryPath: join(current, '.pai', 'MEMORY'),
        isPAIProject: false
      };
    }
    current = dirname(current);
  }

  // Check if we're IN PAI project
  if (cwd.includes('.claude')) {
    return null; // Use central mode
  }

  return null; // Fall back to central
}
```

### Phase 2: Update Hooks for Context-Aware Routing

**Hooks to Modify:**

1. **AutoWorkCreation.hook.ts** (line 55)
   ```typescript
   // OLD:
   const WORK_DIR = join(BASE_DIR, 'MEMORY', 'WORK');

   // NEW:
   const project = detectProject();
   const WORK_DIR = project
     ? join(project.memoryPath, 'WORK')
     : join(BASE_DIR, 'MEMORY', 'WORK');
   ```

2. **ResponseCapture.ts** (line 26, 300)
   ```typescript
   // Apply same pattern - detect project first
   const project = detectProject();
   const BASE_WORK_DIR = project?.memoryPath || join(BASE_DIR, 'MEMORY', 'WORK');
   ```

3. **AgentOutputCapture.hook.ts**
   ```typescript
   // Route RESEARCH to project-local or central based on context
   ```

### Phase 3: Create Project Index (v7.2)

**New Module:** `MEMORY/STATE/project-index.json`

```json
{
  "projects": {
    "my-app": {
      "path": "C:/Users/JOSE/Projects/my-app",
      "workIds": ["20260210-123456_initial-setup", "20260210-134500_feature-x"],
      "lastActive": "2026-02-10T13:45:00Z"
    }
  },
  "updatedAt": "2026-02-10T13:45:00Z"
}
```

**Update Logic:** Whenever work is created, add entry to index.

### Phase 4: Add Query Interface (v7.2)

**New Tool:** `skills/PAI/Tools/ProjectMemories.ts`

```bash
# Get memories for current project
bun ProjectMemories.ts --current

# Get memories for specific project
bun ProjectMemories.ts --project my-app

# List all projects with memories
bun ProjectMemories.ts --list
```

### Phase 5: Testing Strategy

1. **Unit Tests:** Test `detectProject()` with various directory structures
2. **Integration Tests:** Create test project, verify memories routed correctly
3. **Rollback Test:** Verify central mode still works when not in project

---

## Next Steps

1. ✅ Wait for agent investigations to complete - **BOTH AGENTS COMPLETE**
2. ✅ Document agent findings - **COMPLETE**
3. 🔄 **USER DECISION NEEDED** - Review 5 architectural approaches
4. ✅ Design implementation plan - **COMPLETE** (see Implementation Recommendations)
5. ✅ Create migration strategy - **Agent provided 3 paths**
6. ⏳ Update MEMORYSYSTEM.md to reflect decision
7. ⏳ Implement hooks modifications - **After decision**

---

## Investigation Progress

| Step | Status | Notes |
|------|--------|-------|
| Analyze existing hooks | ✅ Done | Found hardcoded paths |
| Search for project context | ✅ Done | Agent a93303b - Found NO project detection in hooks |
| Architecture debate | ✅ Done | Agent adce28f - 5 perspectives, tradeoffs, migration paths |
| Document findings | ✅ Done | This file |
| Create resolution plan | ✅ Done | Implementation Recommendations section added |
| Implement fix | ⏳ Pending | Awaiting user decision on architecture |

---

**Status:** ✅ Investigation Complete - Ready for Decision
**Last Updated:** 2026-02-10 08:10 PST
**Investigation Status:** ✅ COMPLETE - Ready for user decision
**Updated By:** Orion (PAI v2.5)
