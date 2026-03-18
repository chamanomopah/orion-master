#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Renomeia automaticamente arquivos sem numeração nas pastas ASSETS/ e IMPLEMENTATION/.

Este script garante que todos os arquivos tenham numeração sequencial para
facilitar o sistema de referências [Letra][Numero].
"""

import sys
import re
from pathlib import Path

BASE_DIR = Path("C:/Users/JOSE/.claude")
ASSETS_DIR = BASE_DIR / "ASSETS"
IMPLEMENTATION_DIR = BASE_DIR / "IMPLEMENTATION"

# Extensões de arquivos para considerar
INCLUDE_EXTENSIONS = {".md", ".txt", ".py", ".json", ".yaml", ".yml", ".mmd", ".mermaid"}

# Pastas para ignorar (não processar)
IGNORE_FOLDERS = {"__pycache__", ".git", ".claude", "node_modules"}

# Arquivos para nunca renomear (globais)
NEVER_RENAME_GLOBAL = {"INDEX.md", "README.md", ".gitkeep"}

# Arquivos protegidos apenas na raiz de categorias
PROTECT_IN_ROOT_ONLY = {"CLAUDE.md"}


def has_number_prefix(filename: str) -> bool:
    """Verifica se o arquivo já começa com número (ex: '01-arquivo.md')"""
    name = Path(filename).stem
    return len(name) >= 2 and name[0].isdigit() and name[1] == "-"


def is_system_file(filepath: Path, root_category_dirs: list) -> bool:
    """Verifica se é um arquivo de sistema que não deve ser renomeado"""
    filename = filepath.name
    
    # Arquivos ocultos
    if filename.startswith("."):
        return True
    
    # Arquivos protegidos globalmente
    if filename in NEVER_RENAME_GLOBAL:
        return True
    
    # CLAUDE.md só é protegido na raiz das categorias (DOCS, DIAGRAMS, etc.)
    # Não em subpastas como A-arquivos/, A-essentials/, etc.
    if filename == "CLAUDE.md":
        # Se o diretório pai está na lista de raízes de categorias, protege
        if filepath.parent in root_category_dirs:
            return True
        # Caso contrário, permite renomear
        return False
    
    return False


def extract_number(filename: str) -> int:
    """Extrai o número de um arquivo já numerado (ex: '01-arquivo.md' -> 1)"""
    stem = Path(filename).stem
    match = re.match(r"^(\d+)", stem)
    return int(match.group(1)) if match else 0


def get_new_name(old_path: Path, number: int) -> Path:
    """Gera o novo nome do arquivo com numeração"""
    stem = old_path.stem
    suffix = old_path.suffix

    # Remove numeração existente se houver
    if "-" in stem and stem.split("-")[0].isdigit():
        parts = stem.split("-", 1)
        name_only = parts[1] if len(parts) > 1 else stem
    else:
        name_only = stem

    # Adiciona numeração com zero à esquerda
    new_stem = f"{number:02d}-{name_only}"
    return old_path.parent / f"{new_stem}{suffix}"


def should_process_directory(dir_path: Path) -> bool:
    """Verifica se o diretório deve ser processado"""
    if not dir_path.is_dir():
        return False
    # Ignora diretórios ocultos
    if dir_path.name.startswith("."):
        return False
    # Ignora diretórios específicos por nome
    if dir_path.name in IGNORE_FOLDERS:
        return False
    return True


def process_directory(dir_path: Path, root_category_dirs: list, dry_run: bool = False) -> list:
    """Processa um diretório e renomeia arquivos sem numeração"""
    results = []

    if not should_process_directory(dir_path):
        return results

    # Lista todos os arquivos relevantes
    all_files = [
        f for f in dir_path.iterdir()
        if f.is_file()
        and f.suffix in INCLUDE_EXTENSIONS
        and not is_system_file(f, root_category_dirs)
    ]

    if not all_files:
        return results

    # Separa arquivos já numerados dos não numerados
    numbered_files = []
    unnumbered_files = []

    for f in all_files:
        if has_number_prefix(f.name):
            numbered_files.append(f)
        else:
            unnumbered_files.append(f)

    # Se não há arquivos sem numeração, retorna
    if not unnumbered_files:
        return results

    # Ordena: já numerados por número, depois não numerados por nome
    numbered_files.sort(key=lambda x: extract_number(x.name))
    unnumbered_files.sort(key=lambda x: x.name.lower())

    # Determina o próximo número disponível
    next_number = 1
    if numbered_files:
        next_number = max(extract_number(f.name) for f in numbered_files) + 1

    # Renomeia arquivos sem numeração
    for old_path in unnumbered_files:
        new_path = get_new_name(old_path, next_number)

        # Verifica conflito de nome
        if new_path.exists() and new_path != old_path:
            # Tenta encontrar próximo número disponível
            while new_path.exists():
                next_number += 1
                new_path = get_new_name(old_path, next_number)

        result = {
            "old": old_path,
            "new": new_path,
            "renamed": False
        }

        if not dry_run:
            try:
                old_path.rename(new_path)
                result["renamed"] = True
            except Exception as e:
                result["error"] = str(e)

        results.append(result)
        next_number += 1

    return results


def scan_and_rename(dry_run: bool = False, verbose: bool = False) -> dict:
    """Escaneia todas as pastas e renomeia arquivos"""
    summary = {
        "total_dirs": 0,
        "processed_dirs": 0,
        "total_renamed": 0,
        "changes": []
    }

    # Diretórios para escanear
    scan_dirs = [
        ASSETS_DIR / "DOCS",
        ASSETS_DIR / "DIAGRAMS",
        ASSETS_DIR / "RESEARCH",
        ASSETS_DIR / "SPECS",
        ASSETS_DIR / "TEMPLATES",
        IMPLEMENTATION_DIR / "n8n-workflows",
        IMPLEMENTATION_DIR / "scripts",
        IMPLEMENTATION_DIR / "projects",
    ]

    # Diretórios raiz das categorias (para proteção de arquivos como CLAUDE.md)
    root_category_dirs = [d for d in scan_dirs if d.exists()]

    for base_dir in scan_dirs:
        if not base_dir.exists():
            continue

        # Encontra todos os subdiretórios recursivamente
        all_dirs = [base_dir] + list(base_dir.rglob("*"))

        for dir_path in all_dirs:
            if not dir_path.is_dir():
                continue

            summary["total_dirs"] += 1
            results = process_directory(dir_path, root_category_dirs, dry_run)

            if results:
                summary["processed_dirs"] += 1
                summary["total_renamed"] += len([r for r in results if r.get("renamed", False)])

                for r in results:
                    if r.get("renamed") or (verbose and r):
                        summary["changes"].append({
                            "dir": str(dir_path.relative_to(BASE_DIR)),
                            "old": r["old"].name,
                            "new": r["new"].name,
                            "renamed": r.get("renamed", False),
                            "error": r.get("error")
                        })

    return summary


def print_summary(summary: dict):
    """Imprime resumo das operações"""
    print("\n" + "=" * 60)
    print(" RESUMO DA RENOMEAÇÃO")
    print("=" * 60)
    print(f"  Diretórios escaneados: {summary['total_dirs']}")
    print(f"  Diretórios processados: {summary['processed_dirs']}")
    print(f"  Arquivos renomeados: {summary['total_renamed']}")
    print("=" * 60)

    if summary["changes"]:
        print("\nALTERAÇÕES REALIZADAS:")
        for change in summary["changes"]:
            status = "✓" if change["renamed"] else "✗ (erro)"
            print(f"  {status} {change['dir']}/")
            print(f"     {change['old']} → {change['new']}")
            if change.get("error"):
                print(f"     Erro: {change['error']}")


def main():
    sys.stdout.reconfigure(encoding='utf-8')

    import argparse
    parser = argparse.ArgumentParser(description="Renomeia automaticamente arquivos sem numeração")
    parser.add_argument("--dry-run", "-n", action="store_true", help="Simula sem fazer alterações")
    parser.add_argument("--verbose", "-v", action="store_true", help="Mostra todos os arquivos processados")
    args = parser.parse_args()

    if args.dry_run:
        print("[*] MODO SIMULAÇÃO (dry-run) - Nenhuma alteração será feita\n")

    print("[*] Escaneando arquivos sem numeração...")
    summary = scan_and_rename(dry_run=args.dry_run, verbose=args.verbose)

    if summary["total_renamed"] > 0 or args.verbose:
        print_summary(summary)

        if not args.dry_run and summary["total_renamed"] > 0:
            print("\n[OK] Renomeação concluída! Execute /update-index para atualizar os índices.")
        elif args.dry_run:
            print(f"\n[*] Simulação concluída! {summary['total_renamed']} arquivos seriam renomeados.")
    else:
        print("[*] Nenhum arquivo precisa ser renomeado.")


if __name__ == "__main__":
    main()
