# /rename-files

Renomeia automaticamente arquivos sem numeração nas pastas ASSETS/ e IMPLEMENTATION/.

## Uso

- `/rename-files` - Executa a renomeação e atualiza os índices automaticamente
- `/rename-files --dry-run` - Simula sem fazer alterações
- `/rename-files -n` - Simula (forma curta)

## O que faz

1. Escaneia todas as pastas em ASSETS/ e IMPLEMENTATION/
2. Identifica arquivos sem numeração (ex: `arquivo.md`)
3. Renomeia com numeração sequencial (ex: `01-arquivo.md`)
4. **Atualiza os INDEX.md automaticamente** após renomear
5. Protege arquivos de sistema (INDEX.md, README.md, etc.)
6. CLAUDE.md só é protegido na raiz das categorias

## Scripts utilizados

- `auto_rename_files.py` - Renomeia os arquivos
- `update_indexes.py` - Atualiza os índices (executado automaticamente)

## Exemplo de saída

```
[*] Escaneando arquivos sem numeração...
[*] Renomeação concluída!
[*] Atualizando índices...
[+] Índices atualizados com sucesso!
```
