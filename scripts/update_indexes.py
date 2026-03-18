#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Update INDEX.md files automatically."""

import sys
from pathlib import Path

BASE_DIR = Path("C:/Users/JOSE/.claude")
ASSETS_DIR = BASE_DIR / "ASSETS"
IMPLEMENTATION_DIR = BASE_DIR / "IMPLEMENTATION"


def number_to_letter(n):
    """Converte numero para letra (1=A, 2=B, 27=AA)"""
    result = ""
    while n > 0:
        n -= 1
        result = chr(65 + (n % 26)) + result
        n //= 26
    return result


def generate_docs_index():
    docs_dir = ASSETS_DIR / "DOCS"
    if not docs_dir.exists():
        return ""

    folder_info = {
        "A": ("ESSENTIALS", "Modulos Claude Code, MCP e fundamentos."),
        "B": ("HUMAN-IN-A-LOOP", "Padroes de interacao humana com agentes."),
        "C": ("INDIVIDUAL_AGENTS", "Conceitos sobre agentes individuais."),
        "D": ("ORCHESTRATION", "Orquestracao de multi-agentes."),
        "E": ("WORKFLOWS", "Workflows e padroes de execucao."),
    }

    output = ["# DOCS Index - Referencia Rapida\n"]
    output.append(f"**Localizacao:** `{docs_dir}`\n")
    output.append("## Estrutura de Citacao\n")
    output.append("- **Formato:** `[Letras][Numero]`")
    output.append("- **Como falar:** \"documentacao\" + `[Letras][Numero]`")
    output.append("- **Exemplo:** `A1` = Pasta A, Arquivo 1")
    output.append("- **Exemplo:** `AB1` = Pasta A -> Sub B, Arquivo 1")
    output.append("---\n")

    total_files = 0
    total_folders = 0

    for letter in sorted(folder_info.keys()):
        title, desc = folder_info[letter]
        pattern = f"{letter}-*"
        matching_dirs = sorted([d for d in docs_dir.glob(pattern) if d.is_dir()])

        if not matching_dirs:
            continue

        main_dir = matching_dirs[0]
        total_folders += 1
        output.append(f"## {letter} - {title}")
        output.append(desc + "\n")

        subdirs = [d for d in main_dir.iterdir() if d.is_dir()]
        files = [f for f in main_dir.iterdir() if f.is_file() and f.name != "INDEX.md"]

        if subdirs:
            for subdir in sorted(subdirs):
                # Extrair numero e converter para letra (ex: "1-claude" -> "A")
                parts = subdir.name.split("-")
                try:
                    sub_num = int(parts[0])
                    subletter = number_to_letter(sub_num)
                    subdir_code = f"{letter}{subletter}"
                except ValueError:
                    subdir_code = parts[0].upper()

                subname = parts[1] if len(parts) > 1 else subdir_code

                subfiles = sorted([f for f in subdir.glob("*.md") if f.name != "INDEX.md"])
                if subfiles:
                    output.append(f"### {subdir_code} - {subname}")
                    output.append("| Ref | Arquivo |")
                    output.append("|-----|---------|")
                    for i, f in enumerate(subfiles, 1):
                        ref = f"{subdir_code}{i}"
                        output.append(f"| {ref} | {f.name} |")
                        total_files += 1
                    output.append("")
        elif files:
            md_files = sorted([f for f in files if f.suffix == ".md"])
            if md_files:
                output.append("| Ref | Arquivo |")
                output.append("|-----|---------|")
                for i, f in enumerate(md_files, 1):
                    ref = f"{letter}{i}"
                    output.append(f"| {ref} | {f.name} |")
                    total_files += 1
                output.append("")

    output.append("---")
    output.append("## Resumo")
    output.append(f"- **Total Pastas:** {total_folders}")
    output.append(f"- **Total Arquivos:** {total_files}")

    return "\n".join(output)


def generate_generic_index(directory, title, citation_word):
    if not directory.exists():
        return ""

    output = [f"# {title} Index - Referencia Rapida\n"]
    output.append(f"**Localizacao:** `{directory}`\n")
    output.append("## Estrutura de Citacao\n")
    output.append("- **Formato:** `[Letras][Numero]`")
    output.append(f"- **Como falar:** \"{citation_word}\" + `[Letras][Numero]`")
    output.append("- **Exemplo:** `A1` = Pasta A, Arquivo 1")
    output.append("---\n")

    structure = {}
    total_files = 0
    total_folders = 0

    for item in sorted(directory.iterdir()):
        if item.is_dir():
            folder_name = item.name
            if "-" in folder_name:
                letter = folder_name.split("-")[0].upper()
                display_name = folder_name.split("-", 1)[1].replace("_", " ").upper()

                files = sorted([f for f in item.glob("*.md") if f.name != "INDEX.md"])
                if files:
                    structure[letter] = {"name": display_name, "files": files}
                    total_files += len(files)
                    total_folders += 1

    for letter in sorted(structure.keys()):
        info = structure[letter]
        output.append(f"## {letter} - {info['name']}")
        output.append("| Ref | Arquivo |")
        output.append("|-----|---------|")
        for i, f in enumerate(info["files"], 1):
            ref = f"{letter}{i}"
            output.append(f"| {ref} | {f.name} |")
        output.append("")

    if total_files > 0:
        output.append("---")
        output.append("## Resumo")
        output.append(f"- **Total Pastas:** {total_folders}")
        output.append(f"- **Total Arquivos:** {total_files}")

    return "\n".join(output)


def generate_implementation_index():
    impl_dir = IMPLEMENTATION_DIR
    if not impl_dir.exists():
        return ""

    descriptions = {
        "n8n-workflows": "Workflows do N8N",
        "scripts": "Scripts utilitarios",
        "projects": "Projetos de codigo",
    }

    output = ["# IMPLEMENTATION Index\n"]
    output.append("**Localizacao:** `{impl_dir}`\n")
    output.append("## Estrutura\n")

    subdirs = [d for d in impl_dir.iterdir() if d.is_dir()]
    output.append("| Pasta | Conteudo |")
    output.append("|-------|----------|")
    for d in sorted(subdirs):
        desc = descriptions.get(d.name, "Arquivos diversos")
        output.append(f"| {d.name}/ | {desc} |")

    output.append("\n## Como Citar")
    output.append("- **Formato:** \"implementacao\" + `[Letras][Numero]`")
    output.append("- **Exemplo:** \"implementacao A1\" -> n8n-workflows/Workflow 1")

    return "\n".join(output)


def main():
    sys.stdout.reconfigure(encoding='utf-8')
    print("[*] Atualizando INDEX.md...")

    (ASSETS_DIR / "DOCS" / "INDEX.md").write_text(generate_docs_index(), encoding="utf-8")
    print("[+] DOCS/INDEX.md atualizado")

    diag_dir = ASSETS_DIR / "DIAGRAMS"
    if diag_dir.exists():
        (diag_dir / "INDEX.md").write_text(generate_generic_index(diag_dir, "DIAGRAMS", "diagrama"), encoding="utf-8")
        print("[+] DIAGRAMS/INDEX.md atualizado")

    res_dir = ASSETS_DIR / "RESEARCH"
    if res_dir.exists():
        (res_dir / "INDEX.md").write_text(generate_generic_index(res_dir, "RESEARCH", "pesquisa"), encoding="utf-8")
        print("[+] RESEARCH/INDEX.md atualizado")

    specs_dir = ASSETS_DIR / "SPECS"
    if specs_dir.exists():
        (specs_dir / "INDEX.md").write_text(generate_generic_index(specs_dir, "SPECS", "especificacao"), encoding="utf-8")
        print("[+] SPECS/INDEX.md atualizado")

    (IMPLEMENTATION_DIR / "INDEX.md").write_text(generate_implementation_index(), encoding="utf-8")
    print("[+] IMPLEMENTATION/INDEX.md atualizado")

    print("\n[OK] Todos os indices atualizados!")


if __name__ == "__main__":
    main()
