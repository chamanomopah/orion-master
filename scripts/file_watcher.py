#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""File watcher for automatic naming correction."""

import sys
import os
import time
import logging
import signal
import threading
from pathlib import Path
from datetime import datetime
from collections import defaultdict

# Try to import watchdog
try:
    from watchdog.observers import Observer
    from watchdog.events import FileSystemEventHandler
except ImportError:
    print("[ERROR] watchdog não instalado. Execute: pip install watchdog")
    sys.exit(1)

from scripts.naming_utils import (
    should_monitor,
    get_correct_name,
    MONITORED_DIRS,
    BASE_DIR,
)

# Configurações
PID_FILE = BASE_DIR / ".watcher.pid"
LOG_FILE = BASE_DIR / "watcher.log"
COOLDOWN_SECONDS = 10

# Pending renames: filepath -> (new_path, timestamp)
_pending_renames = {}
_lock = threading.Lock()

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[
        logging.FileHandler(LOG_FILE, encoding="utf-8"),
        logging.StreamHandler(sys.stdout),
    ],
)
logger = logging.getLogger(__name__)


class NamingHandler(FileSystemEventHandler):
    """Handler para eventos de filesystem com cooldown."""

    def on_created(self, event):
        """Quando um arquivo é criado."""
        if event.is_directory:
            return

        filepath = Path(event.src_path)

        if not should_monitor(filepath):
            return

        logger.debug(f"Arquivo criado: {filepath}")

        # Agendar verificação após cooldown
        self._schedule_rename(filepath)

    def on_modified(self, event):
        """Quando um arquivo é modificado."""
        if event.is_directory:
            return

        filepath = Path(event.src_path)

        if not should_monitor(filepath):
            return

        # Se já está pendente, atualizar o timestamp (reset cooldown)
        with _lock:
            if filepath in _pending_renames:
                logger.debug(f"Arquivo modificado, resetando cooldown: {filepath}")
                self._schedule_rename(filepath)

    def _schedule_rename(self, filepath: Path):
        """Agenda renomeação após cooldown."""
        with _lock:
            # Cancelar timer anterior se existir
            if filepath in _pending_renames:
                old_timer = _pending_renames[filepath][2]
                if old_timer:
                    old_timer.cancel()

            # Criar novo timer
            timer = threading.Timer(
                COOLDOWN_SECONDS,
                self._execute_rename,
                args=[filepath]
            )
            timer.daemon = True
            timer.start()

            # Guardar referência
            new_path = get_correct_name(filepath)
            _pending_renames[filepath] = (new_path, time.time(), timer)

            if new_path:
                logger.info(f"[AGENDADO] {filepath.name} -> {new_path.name} (em {COOLDOWN_SECONDS}s)")

    def _execute_rename(self, filepath: Path):
        """Executa a renomeação após o cooldown."""
        with _lock:
            if filepath not in _pending_renames:
                return

            new_path, timestamp, _ = _pending_renames.pop(filepath)

        # Verificar se arquivo ainda existe
        if not filepath.exists():
            logger.debug(f"Arquivo não existe mais: {filepath}")
            return

        # Obter novo nome correto (pode ter mudado)
        correct_path = get_correct_name(filepath)

        if not correct_path:
            logger.debug(f"Nenhuma correção necessária: {filepath}")
            return

        # Verificar se já tem nome correto
        if filepath == correct_path:
            logger.debug(f"Nome já correto: {filepath}")
            return

        # Verificar se destino já existe
        if correct_path.exists():
            logger.warning(f"Destino já existe, não renomeando: {correct_path}")
            return

        try:
            filepath.rename(correct_path)
            logger.info(f"[RENOMEADO] {filepath.name} -> {correct_path.name}")

            # Atualizar índices automaticamente após renomeação
            self._update_indexes()

        except Exception as e:
            logger.error(f"Erro ao renomear {filepath}: {e}")

    def _update_indexes(self):
        """Atualiza os índices após mudanças."""
        try:
            from scripts.update_indexes import main as update_main
            update_main()
            logger.debug("[INDEX] Índices atualizados")
        except Exception as e:
            logger.error(f"[INDEX] Erro ao atualizar: {e}")


def check_running() -> bool:
    """Verifica se já existe uma instância em execução."""
    if not PID_FILE.exists():
        return False

    try:
        pid = int(PID_FILE.read_text().strip())
        # Verificar se processo está rodando (Unix-like)
        try:
            os.kill(pid, 0)
            return True
        except OSError:
            # Processo não existe, remover PID file antigo
            PID_FILE.unlink()
            return False
    except (ValueError, OSError):
        return False


def write_pid():
    """Escreve PID do processo atual."""
    PID_FILE.write_text(str(os.getpid()))


def remove_pid():
    """Remove arquivo PID."""
    if PID_FILE.exists():
        PID_FILE.unlink()


def signal_handler(signum, frame):
    """Handler para sinais de shutdown."""
    logger.info("[SHUTDOWN] Recebido sinal, encerrando...")
    sys.exit(0)


def main(dry_run: bool = False, verbose: bool = False):
    """Função principal do watcher."""
    if verbose:
        logger.setLevel(logging.DEBUG)

    # Verificar se já está rodando
    if check_running():
        print("[ERROR] File watcher já está em execução!")
        print(f"Use: /watch stop")
        sys.exit(1)

    # Configurar signal handlers
    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)

    # Escrever PID
    write_pid()

    # Criar observer e handler
    event_handler = NamingHandler()
    observer = Observer()

    # Adicionar watches para cada diretório monitorado
    watched_dirs = []
    for name, info in MONITORED_DIRS.items():
        base = info["base"]
        if base.exists():
            observer.schedule(event_handler, str(base), recursive=True)
            watched_dirs.append(str(base))
            logger.info(f"[WATCH] Monitorando: {base}")

    if not watched_dirs:
        logger.error("[ERROR] Nenhum diretório para monitorar!")
        remove_pid()
        sys.exit(1)

    # Iniciar observer
    observer.start()
    logger.info("[START] File watcher iniciado!")
    logger.info(f"[CONFIG] Cooldown: {COOLDOWN_SECONDS}s | PID: {os.getpid()}")
    logger.info("[INFO] Pressione Ctrl+C para parar")

    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        observer.stop()
        logger.info("[STOP] File watcher parado")

    observer.join()
    remove_pid()


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="File Watcher para nomenclatura automática")
    parser.add_argument("--dry-run", action="store_true", help="Mostrar o que faria sem executar")
    parser.add_argument("-v", "--verbose", action="store_true", help="Logging detalhado")

    args = parser.parse_args()
    main(dry_run=args.dry_run, verbose=args.verbose)
