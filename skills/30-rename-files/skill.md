# /rename-files

Renomeia automaticamente arquivos sem numeração nas pastas ASSETS/ e IMPLEMENTATION/.

## Uso

- `/rename-files` - Executa a renomeação
- `/rename-files --dry-run` - Simula sem fazer alterações
- `/rename-files -n` - Simula sem fazer alterações (forma curta)

## O que faz

1. Escaneia todas as pastas em ASSETS/ e IMPLEMENTATION/
2. Identifica arquivos sem numeração (ex: `arquivo.md`)
3. Renomeia com numeração sequencial (ex: `01-arquivo.md`)
4. Protege arquivos de sistema (INDEX.md, README.md, etc.)
5. CLAUDE.md só é protegido na raiz das categorias

## Após usar

Execute `/update-index` para atualizar os INDEX.md com os novos nomes.
