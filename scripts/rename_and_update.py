#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Wrapper que executa auto_rename_files.py e depois update_indexes.py"""

import sys
import subprocess
from pathlib import Path

BASE_DIR = Path("C:/Users/JOSE/.claude")
rename_script = BASE_DIR / "scripts" / "auto_rename_files.py"
update_script = BASE_DIR / "scripts" / "update_indexes.py"

# Executa o script de renomeação
result = subprocess.run([sys.executable, str(rename_script)] + sys.argv[1:])
exit_code = result.returncode

# Se a renomeação foi bem sucedida e não foi dry-run, atualiza os índices
if exit_code == 0 and "--dry-run" not in sys.argv and "-n" not in sys.argv:
    print()
    subprocess.run([sys.executable, str(update_script)])

sys.exit(exit_code)
