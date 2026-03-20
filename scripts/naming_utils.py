#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Shared naming utilities for file watcher and index updater."""

from pathlib import Path
from typing import Optional, List

BASE_DIR = Path("C:/Users/JOSE/.claude")

# Diretórios monitorados pelo file watcher
MONITORED_DIRS = {
    "skills": {"type": "numeric", "base": BASE_DIR / "skills"},
    "agents": {"type": "numeric", "base": BASE_DIR / "agents"},
    "commands": {"type": "numeric", "base": BASE_DIR / "commands"},
    "DOCS": {"type": "letter_numeric", "base": BASE_DIR / ".ASSETS" / "DOCS"},
    "DIAGRAMS": {"type": "letter_numeric", "base": BASE_DIR / ".ASSETS" / "DIAGRAMS"},
    "RESEARCH": {"type": "letter_numeric", "base": BASE_DIR / ".ASSETS" / "RESEARCH"},
    "SPECS": {"type": "letter_numeric", "base": BASE_DIR / ".ASSETS" / "SPECS"},
    "TEMPLATES": {"type": "letter_numeric", "base": BASE_DIR / ".ASSETS" / "TEMPLATES"},
}

# Arquivos a ignorar
IGNORE_PATTERNS = {
    "INDEX.md",
    ".gitkeep",
    ".watchignore",
    ".watcher.pid",
    "watcher.log",
}

# Extensões monitoradas
MONITORED_EXTENSIONS = {".md", ".txt", ".py", ".json", ".yaml", ".yml", ".mmd", ".mermaid"}


def number_to_letter(n: int) -> str:
    """Converte numero para letra (1=A, 2=B, 27=AA)."""
    result = ""
    while n > 0:
        n -= 1
        result = chr(65 + (n % 26)) + result
        n //= 26
    return result


def letter_to_number(letter: str) -> int:
    """Converte letra para numero (A=1, B=2, AA=27)."""
    result = 0
    for char in letter.upper():
        result = result * 26 + (ord(char) - 64)
    return result


def get_next_available_number(directory: Path, extension: str = "") -> int:
    """Retorna o próximo número disponível em um diretório."""
    numbers = []

    pattern = f"*{extension}" if extension else "*"

    for f in directory.glob(pattern):
        if f.is_file() and f.name not in IGNORE_PATTERNS:
            # Tentar extrair número do nome do arquivo
            stem = f.stem
            # Remover prefixos como "1-", "2-", etc.
            parts = stem.split("-")
            if parts[0].isdigit():
                numbers.append(int(parts[0]))
            elif stem.isdigit():
                numbers.append(int(stem))

    if not numbers:
        return 1

    # Encontrar o primeiro gap
    numbers = sorted(set(numbers))
    for i in range(1, len(numbers) + 1):
        if i not in numbers:
            return i
    return len(numbers) + 1


def get_next_available_letter(directory: Path) -> str:
    """Retorna a próxima letra disponível para subpasta."""
    letters = []

    for item in directory.iterdir():
        if item.is_dir() and "-" in item.name:
            parts = item.name.split("-")
            if parts[0].isdigit():
                letters.append(int(parts[0]))

    if not letters:
        return "A"

    letters = sorted(set(letters))
    for i in range(1, len(letters) + 1):
        if i not in letters:
            return number_to_letter(i)
    return number_to_letter(len(letters) + 1)


def is_valid_naming(filepath: Path) -> bool:
    """Verifica se o arquivo segue o padrão de nomenclatura correto."""
    if filepath.name in IGNORE_PATTERNS:
        return True

    # Verificar se está em um diretório monitorado
    monitored_info = get_monitored_info(filepath)
    if not monitored_info:
        return True

    naming_type = monitored_info["type"]

    if naming_type == "numeric":
        # Deve começar com número: "1-nome.md" ou "1.md"
        stem = filepath.stem
        parts = stem.split("-")
        return parts[0].isdigit()

    elif naming_type == "letter_numeric":
        # Para pastas: "A-nome" ou subpastas "1-nome"
        if filepath.is_dir():
            parts = filepath.name.split("-")
            return parts[0].isdigit() or parts[0].isalpha()

        # Para arquivos dentro de pastas letra-numéricas
        parent = filepath.parent
        if parent.name in IGNORE_PATTERNS:
            return True

        # Verificar se está dentro de uma pasta com padrão correto
        stem = filepath.stem
        parts = stem.split("-")
        return parts[0].isdigit()

    return True


def get_monitored_info(filepath: Path) -> Optional[dict]:
    """Retorna informações sobre o diretório monitorado."""
    path = filepath if filepath.is_dir() else filepath.parent

    for name, info in MONITORED_DIRS.items():
        base = info["base"]
        try:
            if path.resolve().relative_to(base.resolve()):
                return info
        except ValueError:
            continue

    return None


def should_monitor(filepath: Path) -> bool:
    """Determina se um caminho deve ser monitorado."""
    # Ignorar arquivos ocultos
    if filepath.name.startswith("."):
        return False

    # Ignorar padrões conhecidos
    if filepath.name in IGNORE_PATTERNS:
        return False

    # Verificar extensão
    if filepath.is_file() and filepath.suffix not in MONITORED_EXTENSIONS:
        return False

    # Verificar se está em um diretório monitorado
    return get_monitored_info(filepath) is not None


def get_correct_name(filepath: Path) -> Optional[Path]:
    """
    Retorna o caminho correto para o arquivo seguindo a nomenclatura.
    Retorna None se já estiver correto ou não precisar de mudança.
    """
    if not should_monitor(filepath) or is_valid_naming(filepath):
        return None

    monitored_info = get_monitored_info(filepath)
    if not monitored_info:
        return None

    naming_type = monitored_info["type"]
    parent = filepath.parent
    stem = filepath.stem
    suffix = filepath.suffix

    if naming_type == "numeric":
        # skills/, agents/, commands/
        next_num = get_next_available_number(parent, suffix)
        # Preservar o nome descritivo se houver
        if "-" in stem:
            desc = stem.split("-", 1)[1]
            new_name = f"{next_num}-{desc}{suffix}"
        else:
            new_name = f"{next_num}{suffix}"
        return parent / new_name

    elif naming_type == "letter_numeric":
        # .assets/DOCS/, DIAGRAMS/, etc.
        # Se for um arquivo direto na raiz do diretório monitorado
        if parent == monitored_info["base"]:
            # Verificar se precisa criar uma pasta letra-numérica
            # Para arquivos soltos na raiz, não renomear (deixar para decisão manual)
            return None

        # Se for arquivo dentro de subpasta
        next_num = get_next_available_number(parent, suffix)
        if "-" in stem:
            desc = stem.split("-", 1)[1]
            new_name = f"{next_num}-{desc}{suffix}"
        else:
            new_name = f"{next_num}{suffix}"
        return parent / new_name

    return None


def extract_description(filename: str) -> str:
    """Extrai a parte descritiva do nome do arquivo."""
    stem = Path(filename).stem
    if "-" in stem:
        return stem.split("-", 1)[1]
    return stem
