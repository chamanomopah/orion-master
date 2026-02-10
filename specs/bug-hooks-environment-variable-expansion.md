# Bug: Claude Code Hooks Environment Variable Expansion on Windows

## Bug Description

Claude Code hooks fail on Windows because environment variables in the format `${PAI_DIR}` are not being expanded by the Claude Code runtime before being passed to the Windows shell. This causes ALL hooks configured with `${PAI_DIR}` to fail with "command not found" errors.

## Problem Statement

The `settings.json` file uses `${PAI_DIR}` variable in hook command paths (Unix-style syntax). On Windows:
- The Claude Code runtime does NOT expand `${PAI_DIR}` before executing hooks
- Windows CMD/PowerShell does NOT understand `${VAR}` syntax (it uses `%VAR%`)
- Result: Hooks receive the literal string `${PAI_DIR}` instead of the actual path
- Error: `'${PAI_DIR}' is not recognized as an internal or external command`

**Impact:** ALL 16 hooks in the configuration fail on Windows, including:
- SessionStart hooks (3): StartupGreeting, LoadContext, CheckVersion
- SessionEnd hooks (2): WorkCompletionLearning, SessionSummary
- UserPromptSubmit hooks (5): FormatReminder, AutoWorkCreation, ExplicitRatingCapture, ImplicitSentimentCapture, UpdateTabTitle
- PreToolUse hooks (5): SecurityValidator (for multiple tools)
- PostToolUse hooks (1): QuestionAnswered
- SubagentStop hooks (1): AgentOutputCapture

## Solution Statement

Fix environment variable expansion in Claude Code hooks on Windows by using absolute paths instead of `${PAI_DIR}` variable. This is a workaround until Claude Code properly supports cross-platform environment variable expansion in hook commands.

## Steps to Reproduce

1. Open Claude Code on Windows with PAI configuration
2. Start a new session (triggers SessionStart hooks)
3. Observe error: `SessionStart:startup hook error`
4. Run a command (triggers UserPromptSubmit hooks)
5. End session (triggers SessionEnd hooks)
6. Observe error: `'${PAI_DIR}' is not recognized as an internal or external command`

## Root Cause Analysis

**Primary Issue:** Claude Code does not expand `${PAI_DIR}` environment variable in hook command strings on Windows before passing them to the shell.

**Contributing Factors:**
1. **Unix-style syntax in Windows context:** `${VAR}` is Unix shell syntax. Windows uses `%VAR%` (CMD) or `$env:VAR" (PowerShell)
2. **No variable expansion by runtime:** The Claude Code runtime passes the literal string `${PAI_DIR}` to Windows shell
3. **Windows shell cannot expand:** Windows CMD/PowerShell sees `${PAI_DIR}` as a literal string, not a variable reference
4. **PAI uses Unix-style paths:** The PAI system was designed on Unix and uses `${PAI_DIR}` throughout settings.json

**Why manual execution works:**
When running hooks manually with `bun run hooks/StartupGreeting.hook.ts`, the path is relative to the current directory and bun resolves it correctly. The `${PAI_DIR}` issue only affects hooks invoked by Claude Code's runtime.

**Evidence:**
```
SessionEnd hook [${PAI_DIR}/hooks/SessionSummary.hook.ts] failed:
'${PAI_DIR}' não é reconhecido como um comando interno ou externo
```

The error shows the literal `${PAI_DIR}` string was passed to the shell.

## Relevant Files

- `C:\Users\JOSE\.claude\settings.json` — Contains all hook configurations using `${PAI_DIR}`
- `C:\Users\JOSE\.claude\hooks\*.hook.ts` — All hook files (16 total)
- `C:\Users\JOSE\.claude\skills\PAI\SKILL.md` — PAI core documentation
- `C:\Users\JOSE\.claude\docs\plan-format-guide.md` — Plan format reference

## Step by Step Tasks

1. **Create a backup of current settings.json**
   ```bash
   cp C:\Users\JOSE\.claude\settings.json C:\Users\JOSE\.claude\settings.json.backup
   ```

2. **Update settings.json to use absolute Windows paths**
   - Replace ALL occurrences of `${PAI_DIR}/hooks/` with `C:\\Users\\JOSE\\.claude\\hooks\\`
   - Replace ALL occurrences of `${PAI_DIR}/statusline-command.ps1` with `C:\\Users\\JOSE\\.claude\\statusline-command.ps1`
   - Total replacements needed: 17 occurrences across the hooks section

3. **Verify hook command paths are correct**
   - Check that all paths use double backslashes (Windows JSON escaping)
   - Example: `"command": "C:\\Users\\JOSE\\.claude\\hooks\\StartupGreeting.hook.ts"`

4. **Test SessionStart hooks**
   - Start a new Claude Code session
   - Verify all 3 SessionStart hooks execute without errors
   - Check for: PAI banner, context loading, version check

5. **Test UserPromptSubmit hooks**
   - Send a test prompt to Claude
   - Verify FormatReminder hook runs (should see algorithm reminder)
   - Check for any stderr output from hooks

6. **Test SessionEnd hooks**
   - End the Claude Code session
   - Verify SessionSummary and WorkCompletionLearning hooks execute
   - Check that no `${PAI_DIR}` errors appear

7. **Document the workaround**
   - Add comment in settings.json explaining why absolute paths are used
   - Note that this is a workaround for Windows environment variable expansion bug
   - Reference this bug report for future maintenance

## Validation Commands

- **Check that all hooks use absolute paths:**
  ```bash
  grep -n '\${PAI_DIR}' C:\Users\JOSE\.claude\settings.json
  # Should return NO results (all replaced with absolute paths)
  ```

- **Verify settings.json is valid JSON:**
  ```bash
  bun -e "console.log(JSON.parse(require('fs').readFileSync('C:\\Users\\JOSE\\.claude\\settings.json', 'utf-8')))"
  ```

- **Test a specific hook manually:**
  ```bash
  echo '{}' | bun run C:\Users\JOSE\.claude\hooks\StartupGreeting.hook.ts
  # Should display PAI banner without errors
  ```

- **Verify hooks load in Claude Code:**
  Start a new session and check for these success messages (stderr):
  - `✅ PAI Context successfully loaded...`
  - `✅ SKILL.md up-to-date (skipped rebuild)`
  - `✅ Loaded settings.json`
  - `📅 Current Date:`

## Notes

### Related Bugs
- **GitHub Issue #6463:** PATH environment variable deleted on Windows - indicates broader env var handling issues in Claude Code
- **GitHub Issue #10373:** SessionStart hooks not working for new conversations (October 2025) - may be related

### Windows-Specific Considerations
- **Path separators:** Windows uses backslashes (`\`) which must be escaped as `\\` in JSON
- **Variable syntax:** Windows uses `%VAR%` (CMD) or `$env:VAR"` (PowerShell), NOT `${VAR}`
- **Line endings:** Ensure .hook.ts files use LF line endings, not CRLF (Git autocrlf may cause issues)

### Future Improvements
- **Cross-platform solution:** Use a platform detection script that sets hook paths correctly for each OS
- **Claude Code fix:** File bug report requesting proper environment variable expansion in hooks on Windows
- **Alternative approach:** Use a hook wrapper script that reads PAI_DIR from environment and resolves paths dynamically

### Dependencies
- **Bun runtime:** Must be installed and accessible via PATH (confirmed: v1.3.9 installed)
- **Claude Code:** v2.1.38 (may have fixed env var expansion in newer versions)
- **lib/ helpers:** Hooks depend on `./lib/paths.ts` and `./lib/notifications.ts`

### Impact on Other PAI Features
- **Context loading:** LoadContext.hook.ts is critical — without it, PAI algorithm doesn't load
- **Format enforcement:** FormatReminder.hook.ts ensures algorithm compliance — critical for PAI system
- **Session tracking:** SessionStart/SessionEnd hooks track session metrics for relationship context

### Testing Coverage
- ✅ Hook files execute successfully when run manually with absolute paths
- ✅ Bun runtime is properly installed and accessible
- ⚠️ Hooks fail when invoked by Claude Code due to `${PAI_DIR}` expansion bug
- ❌ Full end-to-end session test pending fix application

### Risk Assessment
- **Risk Level:** LOW (fix is straightforward string replacement)
- **Rollback Plan:** Keep settings.json.backup, can revert if issues arise
- **Breaking Changes:** None — this is a pure bug fix with no behavioral changes

### Sources
- [BUG] [Windows] PATH environment variable deleted - GitHub Issue #6463
- [Claude Code Hooks Configuration](https://code.claude.com/docs/zh-TW/hooks)
- [How to Configure Claude Code Hooks](https://claude.com/blog/how-to-configure-hooks) (December 11, 2025)
- [Claude Code Hooks: A Practical Guide](https://www.datacamp.com/tutorial/claude-code-hooks) (January 19, 2026)
- [Claude Code Session Hooks](https://medium.com/@CodeCoup/claude-code-session-hooks-make-every-session-start-smart-and-end-clean-e505e6914d45) (2026 workflows)
