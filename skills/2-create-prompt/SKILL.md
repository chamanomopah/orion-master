---
name: create-prompt
description: Meta-skill that creates other prompts, templates, and skill files. Generates structured files following the established patterns in ASSETS/ and skills/.
allowed-tools: Read, Write, Edit, Glob, Grep, Bash
---

# Create Prompt - Meta-Skill

## What This Is

This is a **meta-skill** - a skill that creates other skills and prompts. Following the meta-prompt pattern from C10 (7-meta-prompt-patterns.md), this skill generates structured files based on templates and patterns.

## The Meta Pattern

```
You provide:  "Create a skill for X"
                    |
                    v
Meta-skill:   Parses requirements + applies template
                    |
                    v
Output:       New skill/prompt file created
```

## When This Skill Activates

- User asks to "create a prompt/skill/agent for X"
- User asks to "generate a template for Y"
- User asks to "make a command that does Z"
- Any request to create structural files in the codebase

## Template Patterns

### Pattern 1: Skill File Structure

```markdown
---
name: skill-name
description: Brief description
allowed-tools: Tool1, Tool2, Tool3
---

# Skill Name
## What This Does
Description
## When to Use
- Condition 1
## Instructions
Steps
```

### Pattern 2: Agent File Structure

```markdown
# Agent Name - Purpose

## Role
What this agent does

## Instructions
1. Step 1
2. Step 2

## Output Format
Expected structure
```

## File Creation Rules

### 1. Check Existing Files
Use Glob before creating

### 2. Follow Numbering
- ASSETS/: 01-, 02-, 03-
- skills/: 1-, 2-, 3-

### 3. Update INDEX.md
After creating in ASSETS/ or IMPLEMENTATION/

### 4. Proper Locations

| Type | Location |
|------|----------|
| Skills | `skills/{number}-{name}/SKILL.md` |
| Agents | `agents/{name}.md` |
| Commands | `.claude/commands/{name}.md` |
| Docs | `ASSETS/DOCS/{cat}/{num}-{name}.md` |
| Research | `ASSETS/RESEARCH/{cat}/{num}-{name}.md` |

## Creation Workflow

1. Parse Request (type, name, purpose)
2. Check Existing (Glob for conflicts)
3. Determine Location (folder + numbering)
4. Apply Template (use pattern)
5. Create File (Write tool)
6. Update Index (if needed)
7. Confirm (report location)

## Version History
- v1.0.0 (2026-03-18): Initial meta-skill
