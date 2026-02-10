---
capture_type: RESEARCH
timestamp: 2026-02-10 08:09:33 PST
executor: default
agent_completion: Voice controlled Claude Code architecture fully designed and documented
---

# RESEARCH: Voice controlled Claude Code architecture fully designed and documented

**Agent:** default
**Completed:** 2026:02:10:080933

---

## Agent Output

---

## Architectural Analysis

### Problem Statement
Design a complete, working system for voice-controlling Claude Code CLI through LiveKit agents. The system must support multi-session management, real-time dashboard monitoring, and use existing Claude Code subscription (no API billing).

### Proposed Solution
A three-tier architecture with:
1. **Voice Agent (Python)** - LiveKit-powered STT/LLM/TTS pipeline
2. **Backend Server (Node.js)** - Session management, CLI spawning, WebSocket hub
3. **Dashboard (React)** - Real-time visualization and control interface

### Design Details

**Communication Pattern:**
- LiveKit Agent uses HTTP POST to communicate with backend (not WebSocket)
- Backend spawns Claude Code CLI processes via node-pty (pseudoterminal)
- Custom hook (VoiceProxy.hook.ts) forwards all Claude Code events to backend
- Dashboard connects via WebSocket for real-time updates

**Multi-Session Isolation:**
- Each session gets unique UUID and working directory
- CLI processes run in isolated `workspaces/{sessionId}/` directories
- Session ID injected via environment variable `CLAUDE_SESSION_ID`
- Hook reads session ID from environment for proper event routing

**Data Flow:**
```
Voice → STT (Deepgram) → Intent (Gemini) → Backend → CLI Gateway → Claude Code
                                                                    │
                                                            Hook Events (JSON)
                                                                    │
                                                            VoiceProxy.hook.ts
                                                                    │
                                                            Backend HTTP POST
                                                                    │
                                                        ┌───────┬───────┐
                                                        ▼       ▼       ▼
                                                     Dashboard  Agent  Database
```

**Latency Budget:**
- STT: 80ms (Deepgram Nova-3 streaming)
- Intent: 100ms (Gemini Flash)
- TTS: 120ms (Cartesia Sonic streaming)
- Target: <500ms for simple commands (excluding Claude processing)

### Trade-offs & Decisions

| Decision | Rationale |
|----------|-----------|
| Node.js backend (not Python) | Better process spawning with node-pty, native TypeScript for Claude hooks |
| CLI spawning (not direct API) | Uses your existing Claude Code subscription, no API billing |
| HTTP (not WebSocket) for agent | Simpler, stateless, easier to debug |
| node-pty (not subprocess) | Full terminal emulation, colors, formatting |
| In-memory sessions (not Redis) | Single-server deployment, simpler MVP |
| Custom hook (not MCP) | Direct event capture, more control, lighter weight |

### Implementation Plan

**Phase 1: Foundation** (Week 1)
- Backend server with Express
- Session Manager basic CRUD
- CLI Gateway with node-pty
- Hook skeleton (VoiceProxy.hook.ts)

**Phase 2: Voice Agent** (Week 1-2)
- LiveKit agent setup
- Deepgram STT integration
- Gemini intent parsing
- Cartesia TTS integration

**Phase 3: Integration** (Week 2)
- Hook event ingestion
- Session state synchronization
- WebSocket dashboard feed

**Phase 4: Dashboard** (Week 2-3)
- React app with session list
- Terminal view with xterm.js
- Real-time WebSocket updates

**Phase 5: Testing** (Week 3)
- Unit tests (SessionManager, CLI Gateway)
- Integration tests (hook delivery, CLI spawning)
- E2E manual testing (full voice flow)

### Testing Strategy

**Unit Tests:**
- SessionManager: create, send command, terminate
- CLI Gateway: spawn, write to PTY, read output
- HookProcessor: parse events, route to sessions

**Integration Tests:**
- End-to-end: voice → agent → backend → CLI → response
- Multi-session: concurrent sessions don't interfere
- Hook delivery: events reach backend with correct session ID

**E2E Manual Checklist:**
- [ ] Voice agent connects to LiveKit room
- [ ] STT transcribes accurately
- [ ] Intent classification works
- [ ] Session creation spawns CLI
- [ ] Commands execute successfully
- [ ] Hook events are received
- [ ] Dashboard updates in real-time
- [ ] Multiple sessions run independently
- [ ] Session termination cleans up

### Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| Latency too high for voice | High | Streaming TTS, pre-warm sessions |
| Hook events lost | Medium | Fire-and-forget with timeout, don't block |
| CLI process crash | Medium | Auto-respawn (max 3 retries) |
| Session isolation breach | High | Separate working directories, unique IDs |
| LiveKit disconnect | Low | Auto-reconnect, session resume |

---

## Files Created

| File | Description |
|------|-------------|
| `ARCHITECTURE.md` | Complete system architecture with diagrams |
| `DATA-FLOW.md` | Latency breakdown, state machine, protocols |
| `QUICKSTART.md` | Step-by-step implementation guide |

---

## Sources

- [LiveKit Agents Documentation](https://docs.livekit.io/agents/)
- [LiveKit Agents GitHub](https://github.com/livekit/agents)
- [LiveKit Voice AI Quickstart](https://docs.livekit.io/agents/start/voice-ai-quickstart/)
- [Claude Code Hooks Guide](https://code.claude.com/docs/en/hooks-guide)
- [Claude Code Hooks Reference](https://code.claude.com/docs/en/hooks)
- [Claude Code Hook Control Flow](https://github.com/stevekinney/stevekinney.net/blob/main/content/courses/ai-development/claude-code-hook-control-flow.md)

---

## Next Steps

1. **Review architecture** - Confirm design meets requirements
2. **Begin implementation** - Follow QUICKSTART.md Phase 1
3. **Test incrementally** - Verify each component before next phase
4. **E2E validation** - Full voice flow testing before deployment

Estimated implementation time: 3-4 hours for functional MVP

---

📋 SUMMARY: Complete voice-controlled Claude Code architecture designed with working implementation guide

🔍 ANALYSIS: The system uses LiveKit agents for voice I/O, Node.js backend for session management, and a custom Claude Code hook for event capture. The design prioritizes sub-500ms latency for natural voice interaction while using existing Claude Code subscription.

⚡ ACTIONS: Created three comprehensive documents: ARCHITECTURE.md (system design), DATA-FLOW.md (protocols and state machines), and QUICKSTART.md (step-by-step implementation)

✅ RESULTS: Working architecture with file structure, data flow diagrams, component specifications, latency budgets, and implementation guide

📊 STATUS: Architecture complete, ready for implementation

📁 CAPTURE: All design documents saved in `C:/Users/JOSE/Downloads/tentativa 52/` including ARCHITECTURE.md, DATA-FLOW.md, and QUICKSTART.md

➡️ NEXT: Begin Phase 1 implementation following QUICKSTART.md, starting with backend server setup and Session Manager

📖 STORY EXPLANATION:
1. System architecture uses three-tier design: Voice Agent (Python), Backend (Node.js), Dashboard (React)
2. LiveKit agents handle STT/LLM/TTS pipeline with ~350ms total latency target
3. Node.js backend spawns Claude Code CLI processes using node-pty for full terminal emulation
4. Custom hook VoiceProxy.hook.ts captures all Claude Code events and forwards to backend
5. Multi-session isolation achieved through unique working directories per session
6. WebSocket dashboard provides real-time visualization of sessions and output
7. Implementation split into 5 phases over 3 weeks with incremental testing
8. QUICKSTART.md provides working code templates for immediate development start

🎯 COMPLETED: Voice controlled Claude Code architecture fully designed and documented
agentId: ae0c97f (for resuming to continue this agent's work if needed)
<usage>total_tokens: 61761
tool_uses: 30
duration_ms: 532130</usage>

---

## Metadata

**Transcript:** `C:\Users\JOSE\.claude\projects\C--Users-JOSE-Downloads-tentativa-52\e76f9758-eabc-4b27-b422-4ccd85f870e5.jsonl`
**Captured:** 2026-02-10 08:09:33 PST

---

*This output was automatically captured by UOCS SubagentStop hook.*
