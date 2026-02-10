#!/usr/bin/env node
/**
 * Cross-platform port checker
 * Usage: node check-port.js <port> [--pid] [--kill]
 *
 * Options:
 *   --pid    Output PIDs using the port (for killing)
 *   --kill   Kill processes using the port
 *   --json   Output as JSON
 */

const { execSync } = require('child_process');
const os = require('os');

const IS_WINDOWS = process.platform === 'win32';
const port = process.argv[2];
const showPid = process.argv.includes('--pid');
const shouldKill = process.argv.includes('--kill');
const asJson = process.argv.includes('--json');

if (!port || isNaN(parseInt(port))) {
  console.error('Usage: node check-port.js <port> [--pid] [--kill] [--json]');
  process.exit(1);
}

/**
 * Find processes using a port (cross-platform)
 */
function findProcessOnPort(port) {
  try {
    if (IS_WINDOWS) {
      // Windows: Use netstat
      const result = execSync(`netstat -ano | findstr :${port}`, {
        encoding: 'utf-8',
        stdio: ['pipe', 'pipe', 'pipe']
      });

      const pids = [];
      const lines = result.trim().split('\n');

      for (const line of lines) {
        const parts = line.trim().split(/\s+/);
        const pid = parseInt(parts[parts.length - 1]);
        if (!isNaN(pid)) {
          pids.push(pid);
        }
      }

      return [...new Set(pids)]; // Unique PIDs
    } else {
      // Unix: Use lsof
      const result = execSync(`lsof -ti:${port}`, {
        encoding: 'utf-8',
        stdio: ['pipe', 'pipe', 'pipe']
      });

      return result
        .trim()
        .split('\n')
        .map(s => parseInt(s.trim()))
        .filter(n => !isNaN(n));
    }
  } catch (e) {
    return []; // Port not in use or command failed
  }
}

/**
 * Kill process by PID (cross-platform)
 */
function killProcess(pid) {
  try {
    if (IS_WINDOWS) {
      execSync(`taskkill /F /PID ${pid}`, { stdio: 'pipe' });
    } else {
      execSync(`kill -9 ${pid}`, { stdio: 'pipe' });
    }
    return true;
  } catch (e) {
    return false;
  }
}

// Main execution
const pids = findProcessOnPort(port);

if (asJson) {
  console.log(JSON.stringify({
    port: parseInt(port),
    inUse: pids.length > 0,
    pids: pids
  }));
} else if (shouldKill) {
  let killed = 0;
  for (const pid of pids) {
    if (killProcess(pid)) {
      console.log(`Killed process ${pid}`);
      killed++;
    }
  }
  if (killed === 0) {
    console.log(`No processes found on port ${port}`);
  }
} else if (showPid) {
  if (pids.length > 0) {
    console.log(pids.join('\n'));
  }
} else {
  // Simple check: exit code 0 if in use, 1 if not
  process.exit(pids.length > 0 ? 0 : 1);
}
