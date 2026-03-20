---
description: Control the file watcher for automatic naming correction
allowed-tools: Bash, Read
---

# Watch Command

Controla o file watcher que monitora e corrige automaticamente a nomenclatura de arquivos.

## Instructions

O comando suporta subcomandos: `start`, `stop`, `status`, `dry-run`

### Subcomandos:

**start** - Inicia o monitoramento em background
- Verifica se já está rodando
- Inicia o watcher como processo background
- Mostra PID do processo

**stop** - Para o monitoramento
- Verifica se está rodando
- Envia sinal para encerrar
- Limpa arquivo PID

**status** - Mostra status atual
- Verifica se está rodando
- Mostra PID e uptime se disponível
- Mostra últimas linhas do log

**dry-run** - Mostra o que seria renomeado
- Escaneia arquivos que precisariam de correção
- Lista mudanças sem executar

## Usage Examples

`/watch start` - Inicia monitoramento
`/watch stop` - Para monitoramento
`/watch status` - Verifica status
`/watch dry-run` - Testa sem executar
