---
name: mcp-manager
description: Specialized skill for managing MCP servers in Claude Code. Use when installing, configuring, troubleshooting, or removing MCP servers. Covers all transport types (HTTP, SSE, stdio), scopes (local, project, user), OAuth authentication, and common errors.
argument-hint: [action] [server-name]
allowed-tools: Bash
---

# MCP Manager for Claude Code

Specialized assistant for managing Model Context Protocol (MCP) servers in Claude Code.

## What is MCP?

MCP (Model Context Protocol) is an open standard that connects Claude Code to external tools, databases, APIs, and services. With MCP servers, you can:

- Integrate with GitHub, GitLab, Jira, and other dev tools
- Query databases (PostgreSQL, MongoDB, etc.)
- Monitor services (Sentry, Statsig, etc.)
- Access cloud APIs (AWS, GCP, Azure)
- Automate workflows across platforms

## Installation Methods

### HTTP Transport (Recommended for cloud services)

```bash
# Basic HTTP server
claude mcp add --transport http <name> <url>

# Example: Notion
claude mcp add --transport http notion https://mcp.notion.com/mcp

# With Bearer token
claude mcp add --transport http secure-api https://api.example.com/mcp \
  --header "Authorization: Bearer your-token"
```

### SSE Transport (Deprecated, but still supported)

```bash
# Basic SSE server
claude mcp add --transport sse <name> <url>

# Example: Asana
claude mcp add --transport sse asana https://mcp.asana.com/sse

# With API key
claude mcp add --transport sse private-api https://api.company.com/sse \
  --header "X-API-Key: your-key-here"
```

### STDIO Transport (Local processes)

```bash
# Basic stdio server
claude mcp add --transport stdio <name> -- <command> [args...]

# Example: Airtable
claude mcp add --transport stdio --env AIRTABLE_API_KEY=YOUR_KEY airtable \
  -- npx -y airtable-mcp-server

# Example with Python script
claude mcp add --transport stdio my-server -- python server.py --port 8080
```

### Windows Special Case

On native Windows (not WSL), wrap `npx` commands with `cmd /c`:

```bash
claude mcp add --transport stdio my-server -- cmd /c npx -y @some/package
```

## Configuration Scopes

MCP servers can be configured at three levels:

### Local Scope (Default)
- Stored in: `~/.claude.json` under project path
- Available only to you in current project
- **Best for:** Personal development, experimental configs, sensitive credentials

```bash
# Default (implicit local)
claude mcp add --transport http stripe https://mcp.stripe.com

# Explicit local
claude mcp add --transport http stripe --scope local https://mcp.stripe.com
```

### Project Scope
- Stored in: `.mcp.json` at project root
- Shared with team via version control
- **Best for:** Team collaboration, project-specific tools

```bash
claude mcp add --transport http paypal --scope project https://mcp.paypal.com/mcp
```

**Result in `.mcp.json`:**
```json
{
  "mcpServers": {
    "paypal": {
      "type": "http",
      "url": "https://mcp.paypal.com/mcp"
    }
  }
}
```

### User Scope
- Stored in: `~/.claude.json`
- Available across all your projects
- **Best for:** Personal utilities, frequently used services

```bash
claude mcp add --transport http hubspot --scope user https://mcp.hubspot.com/anthropic
```

## Environment Variables in `.mcp.json`

Supports variable expansion for team configs:

**Syntax:**
- `${VAR}` - Expands to environment variable
- `${VAR:-default}` - Expands to VAR or uses default

**Expansion locations:** `command`, `args`, `env`, `url`, `headers`

**Example:**
```json
{
  "mcpServers": {
    "api-server": {
      "type": "http",
      "url": "${API_BASE_URL:-https://api.example.com}/mcp",
      "headers": {
        "Authorization": "Bearer ${API_KEY}"
      }
    }
  }
}
```

## OAuth 2.0 Authentication

For servers requiring OAuth (GitHub, Sentry, etc.):

### Step 1: Add the server
```bash
claude mcp add --transport http sentry https://mcp.sentry.dev/mcp
```

### Step 2: Authenticate
Run `/mcp` in Claude Code and follow browser authentication

### Fixed Callback Port (if required)
```bash
claude mcp add --transport http \
  --callback-port 8080 \
  my-server https://mcp.example.com/mcp
```

### Pre-configured OAuth Credentials
If server doesn't support dynamic registration:

```bash
claude mcp add --transport http \
  --client-id your-client-id \
  --client-secret \
  --callback-port 8080 \
  my-server https://mcp.example.com/mcp
```

## Management Commands

```bash
# List all configured servers
claude mcp list

# Get details for specific server
claude mcp get github

# Remove a server
claude mcp remove github

# Check server status (in Claude Code)
/mcp

# Reset project approval choices
claude mcp reset-project-choices
```

## Common Errors and Solutions

### Error: "Connection closed" on Windows
**Cause:** Windows can't execute `npx` directly
**Solution:** Wrap with `cmd /c`
```bash
claude mcp add --transport stdio my-server -- cmd /c npx -y @some/package
```

### Error: "Incompatible auth server: does not support dynamic client registration"
**Cause:** Server requires pre-configured OAuth credentials
**Solution:** Register OAuth app first, then use `--client-id` and `--client-secret`

### Error: MCP server not appearing
**Possible causes:**
1. Syntax error in `.mcp.json` - validate JSON
2. Wrong scope - check where it was installed
3. Server not running (for stdio) - verify command works
4. Authentication required - run `/mcp`

### Error: "Command not found" for stdio servers
**Cause:** Command not in PATH or wrong syntax
**Solution:** Use full path or verify command works in terminal

### Error: Timeout during server startup
**Cause:** Server taking too long to initialize
**Solution:** Increase timeout with `MCP_TIMEOUT` env var
```bash
MCP_TIMEOUT=15000 claude
```

## Scope Precedence

When same server name exists in multiple scopes:
1. **Local** (highest priority)
2. **Project**
3. **User** (lowest priority)

## Environment Variables

```bash
# MCP server startup timeout (default: varies)
MCP_TIMEOUT=10000

# Maximum MCP output tokens (default: 10000)
MAX_MCP_OUTPUT_TOKENS=50000

# Load CLAUDE.md from --add-dir directories
CLAUDE_CODE_ADDITIONAL_DIRECTORIES_CLAUDE_MD=1
```

## Plugin-provided MCP Servers

Plugins can bundle MCP servers that start automatically when plugin is enabled:

**In `.mcp.json` at plugin root:**
```json
{
  "mcpServers": {
    "database-tools": {
      "command": "${CLAUDE_PLUGIN_ROOT}/servers/db-server",
      "args": ["--config", "${CLAUDE_PLUGIN_ROOT}/config.json"],
      "env": {
        "DB_URL": "${DB_URL}"
      }
    }
  }
}
```

**Or inline in `plugin.json`:**
```json
{
  "name": "my-plugin",
  "mcpServers": {
    "plugin-api": {
      "command": "${CLAUDE_PLUGIN_ROOT}/servers/api-server",
      "args": ["--port", "8080"]
    }
  }
}
```

## Best Practices

### Security
- **Never commit API keys** - use environment variables
- **Use project scope** for team-shared servers without secrets
- **Use local/user scope** for servers with credentials
- **Review plugin MCP servers** before enabling

### Performance
- **HTTP over SSE** when both available (SSE is deprecated)
- **Use stdio** for local tools needing system access
- **Set appropriate timeouts** for slow-starting servers

### Team Collaboration
- **Use project scope** for shared tools
- **Document required env vars** in README
- **Include `.mcp.json.example`** with template
- **Use env var defaults** with `${VAR:-default}`

### Troubleshooting
1. **Check status:** Run `/mcp` in Claude Code
2. **Validate config:** Ensure JSON is valid
3. **Test command:** Run stdio command in terminal
4. **Check scope:** Verify where server is installed
5. **Review logs:** Look for error messages
6. **Restart Claude Code** after config changes

## Popular MCP Servers

Check current registry: https://github.com/modelcontextprotocol/servers

### Development Tools
- **GitHub:** `claude mcp add --transport http github https://api.githubcopilot.com/mcp/`
- **GitLab:** Available via HTTP/SSE
- **Jira:** Check registry for latest URL

### Databases
- **PostgreSQL:** `claude mcp add --transport stdio db -- npx -y @bytebase/dbhub --dsn "postgresql://..."`
- **MongoDB:** Available via stdio transport
- **SQLite:** Available via stdio transport

### Monitoring
- **Sentry:** `claude mcp add --transport http sentry https://mcp.sentry.dev/mcp`
- **Statsig:** Check registry for URL

### Cloud Services
- **AWS:** Available via npm package
- **GCP:** Available via npm package
- **Azure:** Available via npm package

### Productivity
- **Notion:** `claude mcp add --transport http notion https://mcp.notion.com/mcp`
- **Slack:** Check registry
- **Google Drive:** Check registry

## Quick Reference

| Transport | Best For | Command Pattern |
|-----------|----------|-----------------|
| HTTP | Cloud APIs | `claude mcp add --transport http <name> <url>` |
| SSE | Legacy cloud | `claude mcp add --transport sse <name> <url>` |
| STDIO | Local tools | `claude mcp add --transport stdio <name> -- <command>` |

| Scope | Stored In | Shared? |
|-------|-----------|---------|
| Local | `~/.claude.json` | No (project-specific) |
| Project | `.mcp.json` | Yes (via git) |
| User | `~/.claude.json` | No (cross-project) |

## Additional Resources

- [MCP Registry](https://github.com/modelcontextprotocol/servers)
- [MCP SDK](https://modelcontextprotocol.io/quickstart/server)
- [Claude Code Docs](https://code.claude.com/docs)
- Build custom servers: See MCP SDK documentation

## Dynamic Tool Updates

Claude Code supports `list_changed` notifications, allowing MCP servers to dynamically update available tools, prompts, and resources without reconnection.
