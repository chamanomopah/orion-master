#!/usr/bin/env bun
/**
 * VoiceProxy.hook.ts - Forwards Claude Code events to voice backend
 *
 * TRIGGER: All hook events
 * INPUT: JSON via stdin
 * OUTPUT: HTTP POST to backend
 * EXIT: Always 0 (allow)
 */

const BACKEND_URL = process.env.VOICE_BACKEND_URL || 'http://localhost:3000';

async function main() {
  try {
    // Read stdin
    const stdin = await Bun.stdin.text();
    if (!stdin.trim()) {
      process.exit(0);
    }

    const event = JSON.parse(stdin);

    // Forward to backend (don't await, fire and forget)
    fetch(`${BACKEND_URL}/api/hooks/event`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...event,
        receivedAt: new Date().toISOString(),
        sessionId: process.env.CLAUDE_SESSION_ID || 'unknown'
      }),
      signal: AbortSignal.timeout(1000) // 1s timeout
    }).catch(err => {
      // Log but don't fail
      console.error('Hook delivery failed:', err.message);
    });

    // Always allow
    process.exit(0);
  } catch (err) {
    console.error('Hook error:', err);
    process.exit(0); // Don't block Claude on hook errors
  }
}

main();
