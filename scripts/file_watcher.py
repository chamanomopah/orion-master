#!/usr/bin/env python3
import sys
import os
import time
import logging
import signal
import subprocess
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from scripts.naming_utils import (
    should_monitor, get_correct_name, MONITORED_DIRS, BASE_DIR,
)

PID_FILE = BASE_DIR / ".watcher.pid"
LOG_FILE = BASE_DIR / "watcher.log"
POLL_INTERVAL = 1
COOLDOWN_SECONDS = 5

_known_files = {}
_pending_renames = {}

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[
        logging.FileHandler(LOG_FILE, encoding="utf-8"),
        logging.StreamHandler(sys.stdout),
    ],
)
logger = logging.getLogger(__name__)


def scan_directory(directory: Path, recursive: bool = True):
    files = []
    try:
        if recursive:
            files = [f for f in directory.rglob("*") if f.is_file()]
        else:
            files = [f for f in directory.glob("*") if f.is_file()]
    except PermissionError:
        pass
    return files


def get_file_mtime(filepath: Path) -> float:
    try:
        return filepath.stat().st_mtime
    except (OSError, FileNotFoundError):
        return 0


def process_new_file(filepath: Path, current_time: float):
    if not should_monitor(filepath):
        return
    correct_path = get_correct_name(filepath)
    if not correct_path or filepath == correct_path:
        return
    _pending_renames[filepath] = (correct_path, current_time + COOLDOWN_SECONDS)
    logger.info(f"[SCHEDULED] {filepath.name} -> {correct_path.name} ({COOLDOWN_SECONDS)s)")


def process_pending_renames(current_time: float):
    global _known_files, _pending_renames
    ready = [(fp, np) for fp, (np, dl) in list(_pending_renames.items()) if current_time >= dl]
    _pending_renames = {fp: (np, dl) for fp, (np, dl) in list(_pending_renames.items()) if current_time < dl}

    for filepath, new_path in ready:
        if not filepath.exists() or new_path.exists():
            continue
        try:
            filepath.rename(new_path)
            logger.info(f"[RENAMED] {filepath.name} -> {new_path.name}")
            _known_files.pop(filepath, None)
            _known_files[new_path] = get_file_mtime(new_path)
        except Exception as e:
            logger.error(f"Error: {e}")


def check_running() -> bool:
    if not PID_FILE.exists():
        return False
    try:
        pid = int(PID_FILE.read_text().strip())
        result = subprocess.run(["tasklist", "/FI", f"PID eq {pid}"], capture_output=True, text=True)
        if str(pid) in result.stdout:
            return True
        PID_FILE.unlink()
        return False
    except:
        return False


def signal_handler(signum, frame):
    logger.info("[SHUTDOWN] Stopping...")
    if PID_FILE.exists():
        PID_FILE.unlink()
    sys.exit(0)


def main_loop(verbose: bool = False):
    global _known_files
    if verbose:
        logger.setLevel(logging.DEBUG)

    watched_dirs = [info["base"] for name, info in MONITORED_DIRS.items() if info["base"].exists()]
    if not watched_dirs:
        logger.error("[ERROR] No directories to monitor!")
        return

    logger.info("[SCAN] Scanning...")
    for directory in watched_dirs:
        for filepath in scan_directory(directory, recursive=True):
            if should_monitor(filepath):
                _known_files[filepath] = get_file_mtime(filepath)
    logger.info(f"[SCAN] {len(_known_files)} files monitored")
    logger.info("[START] File watcher started! (Ctrl+C to stop)")

    try:
        while True:
            current_time = time.time()
            current_files = {}
            
            for directory in watched_dirs:
                for filepath in scan_directory(directory, recursive=True):
                    current_files[filepath] = get_file_mtime(filepath)
            
            # Detect new or modified files
            for filepath, mtime in current_files.items():
                if not should_monitor(filepath):
                    continue
                    
                old_mtime = _known_files.get(filepath, 0)
                
                if old_mtime == 0 and mtime > 0:
                    # New file
                    logger.debug(f"[NEW] {filepath}")
                    process_new_file(filepath, current_time)
                    _known_files[filepath] = mtime
                elif mtime != old_mtime:
                    # Modified file
                    _known_files[filepath] = mtime
            
            # Remove deleted files
            for filepath in list(_known_files.keys()):
                if filepath not in current_files:
                    _known_files.pop(filepath)
            
            process_pending_renames(current_time)
            time.sleep(POLL_INTERVAL)
    except KeyboardInterrupt:
        logger.info("[STOP] Stopped")


def main(verbose: bool = False):
    if check_running():
        print("[ERROR] Already running!")
        sys.exit(1)

    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)
    PID_FILE.write_text(str(os.getpid()))

    try:
        main_loop(verbose=verbose)
    finally:
        if PID_FILE.exists():
            PID_FILE.unlink()


if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument("-v", "--verbose", action="store_true")
    args = parser.parse_args()
    main(verbose=args.verbose)
