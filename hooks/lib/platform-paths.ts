/**
 * Cross-Platform Path Utilities
 *
 * Provides platform-aware path handling for Windows, macOS, and Linux.
 * All hooks should import from this file instead of using process.env.HOME directly.
 *
 * ENHANCEMENTS:
 * - Robust Windows detection with fallbacks
 * - Detailed error messages for Windows users
 * - Debug logging for troubleshooting
 * - Graceful degradation when platform features aren't available
 */

import * as path from 'path';
import * as os from 'os';

export const PLATFORM = process.platform;

// Platform detection helpers
export const IS_WINDOWS = PLATFORM === 'win32';
export const IS_MAC = PLATFORM === 'darwin';
export const IS_LINUX = PLATFORM === 'linux';

// Debug mode for troubleshooting platform issues
const DEBUG = process.env.DEBUG_PLATFORM === 'true' || process.env.DEBUG_HOOKS === 'true';

/**
 * Log debug message if debug mode is enabled
 */
function debugLog(message: string, ...args: any[]): void {
  if (DEBUG) {
    console.error(`[platform-paths] ${message}`, ...args);
  }
}

/**
 * Get the home directory in a cross-platform way with robust error handling.
 *
 * Windows: USERPROFILE environment variable
 * macOS/Linux: HOME environment variable
 *
 * FALLBACKS:
 * - Windows: Falls back to os.homedir() if USERPROFILE not set
 * - All platforms: Falls back to current working directory if all else fails
 */
export const HOME_DIR = ((): string => {
  try {
    let homeDir: string;

    if (IS_WINDOWS) {
      // Windows: Try USERPROFILE first, then os.homedir()
      homeDir = process.env.USERPROFILE || os.homedir();

      if (!homeDir) {
        const error = new Error(
          'Could not determine home directory on Windows.\n' +
          'Tried: %USERPROFILE% environment variable and os.homedir()\n' +
          'Please ensure at least one of these is set.\n' +
          'Current directory will be used as fallback.'
        );
        debugLog('WARNING: Could not determine HOME_DIR', error.message);
        console.error(`[platform-paths] ${error.message}`);

        // Fallback to current directory
        homeDir = process.cwd() || 'C:\\';
      }

      debugLog(`Windows HOME_DIR detected: ${homeDir}`);
      return homeDir;
    } else {
      // Unix (macOS/Linux): Try HOME first, then os.homedir()
      homeDir = process.env.HOME || os.homedir();

      if (!homeDir) {
        const error = new Error(
          'Could not determine home directory on Unix system.\n' +
          'Tried: $HOME environment variable and os.homedir()\n' +
          'Please ensure at least one of these is set.'
        );
        debugLog('WARNING: Could not determine HOME_DIR', error.message);
        console.error(`[platform-paths] ${error.message}`);

        // Fallback to current directory
        homeDir = process.cwd() || '/tmp';
      }

      debugLog(`Unix HOME_DIR detected: ${homeDir}`);
      return homeDir;
    }
  } catch (error) {
    const fallback = IS_WINDOWS ? 'C:\\' : '/tmp';
    console.error(`[platform-paths] CRITICAL: Failed to detect home directory:`, error);
    console.error(`[platform-paths] Using fallback: ${fallback}`);
    return fallback;
  }
})();

/**
 * Get the PAI directory (root of the Claude/PAI system) with validation.
 * Uses PAI_DIR env var if set, otherwise defaults to ~/.claude
 *
 * WINDOWS NOTE: On Windows, this will typically be:
 * - C:\Users\<Username>\.claude
 *
 * Error messages guide Windows users to correct location if issues occur.
 */
export const PAI_DIR = ((): string => {
  try {
    const envPaiDir = process.env.PAI_DIR;

    if (envPaiDir) {
      debugLog(`Using PAI_DIR from environment: ${envPaiDir}`);

      // Validate that the path exists (if not, we'll create it later)
      // Just normalize the path for now
      const normalized = path.normalize(envPaiDir);

      if (IS_WINDOWS && !normalized.match(/^[A-Za-z]:\\/)) {
        // Warn if Windows path looks invalid (doesn't start with drive letter)
        console.error(
          `[platform-paths] WARNING: PAI_DIR path may be invalid on Windows: ${normalized}\n` +
          `Expected format: C:\\Users\\YourName\\.claude\n` +
          `Current value: ${envPaiDir}`
        );
      }

      return normalized;
    }

    const defaultPaiDir = path.join(HOME_DIR, '.claude');
    debugLog(`Using default PAI_DIR: ${defaultPaiDir}`);

    return defaultPaiDir;
  } catch (error) {
    const fallback = path.join(HOME_DIR, '.claude');
    console.error(`[platform-paths] ERROR: Failed to resolve PAI_DIR:`, error);
    console.error(`[platform-paths] Using fallback: ${fallback}`);
    return fallback;
  }
})();

/**
 * Get the Claude directory (alias for PAI_DIR for compatibility)
 */
export const CLAUDE_DIR = PAI_DIR;

/**
 * Platform-specific path separator
 */
export const PATH_SEPARATOR = path.sep;

/**
 * Join path segments using the platform-appropriate separator
 */
export function joinPath(...segments: string[]): string {
  return path.join(...segments);
}

/**
 * Normalize a path to use the platform-appropriate separator
 * Converts forward slashes to backslashes on Windows
 */
export function normalizePath(filePath: string): string {
  return path.normalize(filePath.replace(/\//g, path.sep));
}

/**
 * Get the temp directory in a cross-platform way with Windows-specific fallbacks.
 *
 * Windows: Checks %TEMP%, %TMP%, then os.tmpdir()
 * macOS/Linux: Uses os.tmpdir() (typically /tmp)
 *
 * WINDOWS TEMP LOCATIONS (in order of preference):
 * - %TEMP% (user temp, typically C:\Users\<Username>\AppData\Local\Temp)
 * - %TMP% (fallback temp variable)
 * - os.tmpdir() (Node.js default)
 *
 * Error messages help Windows users troubleshoot temp directory issues.
 */
export const TEMP_DIR = ((): string => {
  try {
    if (IS_WINDOWS) {
      // Windows: Check TEMP, then TMP, then os.tmpdir()
      const tempDir = process.env.TEMP || process.env.TMP || os.tmpdir();

      if (!tempDir) {
        const error = new Error(
          'Could not determine temp directory on Windows.\n' +
          'Tried: %TEMP%, %TMP%, and os.tmpdir()\n' +
          'Please set %TEMP% environment variable.\n' +
          `Using fallback: C:\\Windows\\Temp`
        );
        debugLog('WARNING: Could not determine TEMP_DIR', error.message);
        console.error(`[platform-paths] ${error.message}`);

        return 'C:\\Windows\\Temp';
      }

      debugLog(`Windows TEMP_DIR: ${tempDir}`);

      // Validate temp directory is accessible (basic check)
      const fs = require('fs');
      try {
        fs.accessSync(tempDir, fs.constants.W_OK);
      } catch (accessError) {
        console.error(
          `[platform-paths] WARNING: Temp directory not writable: ${tempDir}\n` +
          `This may cause issues with file operations.\n` +
          `Error: ${accessError}`
        );
      }

      return tempDir;
    } else {
      // Unix: Use os.tmpdir()
      const tempDir = os.tmpdir();
      debugLog(`Unix TEMP_DIR: ${tempDir}`);
      return tempDir;
    }
  } catch (error) {
    const fallback = IS_WINDOWS ? 'C:\\Windows\\Temp' : '/tmp';
    console.error(`[platform-paths] CRITICAL: Failed to detect temp directory:`, error);
    console.error(`[platform-paths] Using fallback: ${fallback}`);
    return fallback;
  }
})();

/**
 * Get the session start file path for timing with platform-specific paths.
 *
 * Windows: %TEMP%\pai-session-start.txt (e.g., C:\Users\<Username>\AppData\Local\Temp\pai-session-start.txt)
 * macOS/Linux: /tmp/pai-session-start.txt
 *
 * This file stores the session start timestamp for calculating task duration.
 */
export const SESSION_START_FILE = ((): string => {
  try {
    const sessionFile = IS_WINDOWS
      ? path.join(TEMP_DIR, 'pai-session-start.txt')
      : '/tmp/pai-session-start.txt';

    debugLog(`SESSION_START_FILE: ${sessionFile}`);
    return sessionFile;
  } catch (error) {
    console.error(`[platform-paths] ERROR: Failed to create session file path:`, error);

    // Emergency fallback
    if (IS_WINDOWS) {
      return path.join(HOME_DIR, 'pai-session-start.txt');
    } else {
      return '/tmp/pai-session-start.txt';
    }
  }
})();

// ============================================================================
// WINDOWS-SPECIFIC HELPERS
// ============================================================================

/**
 * Check if running under Windows Subsystem for Linux (WSL).
 * Returns true if WSL is detected, false otherwise.
 *
 * This helps provide better error messages and feature detection.
 */
export function isWSL(): boolean {
  if (!IS_LINUX) return false;

  try {
    const fs = require('fs');
    const procVersion = fs.readFileSync('/proc/version', 'utf-8');
    return procVersion.toLowerCase().includes('microsoft');
  } catch {
    return false;
  }
}

/**
 * Get a user-friendly platform name for error messages.
 * Returns "Windows", "macOS", "Linux", or "Linux (WSL)" for better user guidance.
 */
export function getPlatformName(): string {
  if (IS_WINDOWS) return 'Windows';
  if (IS_MAC) return 'macOS';
  if (IS_LINUX && isWSL()) return 'Linux (WSL)';
  if (IS_LINUX) return 'Linux';
  return PLATFORM;
}

/**
 * Validate that a path is accessible and writable.
 * Returns true if valid, false otherwise.
 *
 * On Windows, also checks for long path issues (>260 characters).
 */
export function validatePathAccessible(filePath: string): { valid: boolean; error?: string } {
  try {
    const fs = require('fs');

    // Check if path exists
    if (!fs.existsSync(filePath)) {
      return {
        valid: false,
        error: `Path does not exist: ${filePath}`
      };
    }

    // Check write access
    fs.accessSync(filePath, fs.constants.W_OK);

    // Windows-specific: Check path length
    if (IS_WINDOWS && filePath.length > 260) {
      return {
        valid: false,
        error: `Path exceeds Windows MAX_PATH limit (260 characters): ${filePath}\n` +
               `Length: ${filePath.length} characters\n` +
               `Solution: Enable long path support or use shorter paths.`
      };
    }

    return { valid: true };
  } catch (error) {
    return {
      valid: false,
      error: `Path not accessible: ${filePath}\nError: ${error.message}`
    };
  }
}

/**
 * Get Windows-specific environment diagnostic information.
 * Useful for troubleshooting Windows setup issues.
 */
export function getWindowsDiagnostics(): Record<string, string> | null {
  if (!IS_WINDOWS) return null;

  try {
    return {
      platform: 'Windows',
      platformVersion: process.version,
      arch: process.arch,
      homeDir: HOME_DIR,
      paiDir: PAI_DIR,
      tempDir: TEMP_DIR,
      pathSeparator: PATH_SEPARATOR,
      envUserprofile: process.env.USERPROFILE || 'NOT SET',
      envTemp: process.env.TEMP || 'NOT SET',
      envTmp: process.env.TMP || 'NOT SET',
      envPath: process.env.PATH ? 'SET' : 'NOT SET',
      currentWorkingDirectory: process.cwd(),
      nodeVersion: process.version,
      hasLongPaths: 'Unknown (check registry LongPathsEnabled)'
    };
  } catch (error) {
    return {
      error: `Failed to gather diagnostics: ${error.message}`
    };
  }
}

/**
 * Log platform information for debugging.
 * Call this function when troubleshooting platform-specific issues.
 */
export function logPlatformInfo(): void {
  const platformName = getPlatformName();
  console.error('\n=== Platform Information ===');
  console.error(`Platform: ${platformName}`);
  console.error(`Node.js: ${process.version}`);
  console.error(`Arch: ${process.arch}`);
  console.error(`Home Directory: ${HOME_DIR}`);
  console.error(`PAI Directory: ${PAI_DIR}`);
  console.error(`Temp Directory: ${TEMP_DIR}`);
  console.error(`Path Separator: "${PATH_SEPARATOR}"`);

  if (IS_WINDOWS) {
    console.error('\n=== Windows Diagnostics ===');
    const diagnostics = getWindowsDiagnostics();
    if (diagnostics) {
      Object.entries(diagnostics).forEach(([key, value]) => {
        console.error(`${key}: ${value}`);
      });
    }
    console.error('\n=== Windows Setup Tips ===');
    console.error('If experiencing issues:');
    console.error('1. Ensure %USERPROFILE% is set (should be by default)');
    console.error('2. Ensure %TEMP% is set and writable');
    console.error('3. Enable Long Paths in registry if needed:');
    console.error('   - Key: HKLM\\SYSTEM\\CurrentControlSet\\Control\\FileSystem');
    console.error('   - Value: LongPathsEnabled = 1');
    console.error('4. Run PowerShell as Administrator for system operations');
  }

  console.error('============================\n');
}
