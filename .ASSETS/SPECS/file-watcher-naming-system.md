# Plan: Sistema de Monitoramento e Correção de Nomenclatura de Arquivos

## Task Description
Criar um sistema leve de monitoramento em tempo real que verifica e corrige automaticamente a nomenclatura de arquivos nas pastas do sistema Claude Code, garantindo que sigam o padrão estabelecido (pastas com letras, arquivos com números).

## Objective
Desenvolver um script/command que monitore continuamente as pastas críticas (skills/, agents/, commands/ .assets/DOCS/, .assets/DIAGRAMS/, .assets/RESEARCH/, .assets/SPECS/) e automaticamente renomeie arquivos novos para seguir o padrão de nomenclatura correto, com um delay de 10 segundos para permitir edição inicial.

## Problem Statement
Atualmente, quando agentes ou scripts criam novos arquivos, frequentemente utilizam nomes descritivos em vez do padrão numérico/alfabético estabelecido. Isso quebra o sistema de referências (A1, B2, etc.) que depende de nomenclatura consistente. A correção manual é trabalhosa e sujeita a erros.

## Solution Approach
Criar um script Python leve que utiliza watchdog para monitorar eventos de criação de arquivos. O sistema irá:
1. Detectar novos arquivos em pastas monitoradas
2. Aguardar 10 segundos (cooldown period para edição)
3. Analisar o arquivo e determinar o nome correto
4. Renomear automaticamente
5. Executar como comando /watch que pode ser iniciado/parado

## Relevant Files

### Arquivos Existentes
- scripts/update_indexes.py - Lógica existente de nomenclatura
- CLAUDE.md - Define o padrão de nomenclatura (Letra=Número)

### Novos Arquivos a Criar
- scripts/file_watcher.py - Script principal de monitoramento
- scripts/naming_utils.py - Módulo com funções compartilhadas de nomenclatura
- commands/watch - Comando slash para iniciar/parar o watcher

### Arquivos a Modificar
- scripts/update_indexes.py - Extrair funções de nomenclatura para naming_utils.py

## Implementation Phases

### Phase 1: Foundation
- Extrair lógica de nomenclatura do update_indexes.py para módulo compartilhado
- Criar naming_utils.py com funções para determinar próximo número disponível
- Implementar detecção do padrão (letras para pastas, números para arquivos)

### Phase 2: Core Implementation
- Criar file_watcher.py com watchdog para monitoramento de filesystem
- Implementar lógica de delay de 10 segundos com debouncing
- Criar sistema de renomeação seguro (verificar colisões)
- Adicionar logging para debug e auditoria

### Phase 3: Integration & Polish
- Criar comando /watch como skill/comando slash
- Implementar flags (dry-run, verbose, selective paths)
- Adicionar PID file para evitar múltiplas instâncias
- Criar log file para histórico de renomeações

## Step by Step Tasks

### 1. Criar módulo de utilidades de nomenclatura
- Criar scripts/naming_utils.py
- Extrair função number_to_letter() do update_indexes.py
- Adicionar função get_next_available_number() - retorna próximo número disponível
- Adicionar função is_valid_naming() - valida se segue o padrão
- Adicionar função should_monitor() - determina se path deve ser monitorado

### 2. Criar script principal de monitoramento
- Criar scripts/file_watcher.py
- Importar watchdog.observers e watchdog.events
- Implementar classe NamingHandler que herda FileSystemEventHandler
- Implementar método on_created() para detectar novos arquivos
- Implementar sistema de cooldown com threading.Timer (10 segundos)
- Adicionar logging para cada ação

### 3. Implementar sistema de controle (PID file)
- Criar PID file em .watcher.pid
- Implementar verificação de instância em execução
- Implementar signal handlers para graceful shutdown

### 4. Criar comando slash /watch
- Implementar subcomandos: start, stop, status, dry-run
- Implementar output formatado com emojis para status

### 5. Configurar pastas monitoradas
- skills/ (arquivos devem seguir padrão numérico)
- agents/ (arquivos devem seguir padrão numérico)
- commands/ (arquivos devem seguir padrão numérico)
- .assets/DOCS/ (pastas A-Z, arquivos numerados)
- .assets/DIAGRAMS/ (pastas A-Z, arquivos numerados)
- .assets/RESEARCH/ (pastas A-Z, arquivos numerados)
- .assets/SPECS/ (pastas A-Z, arquivos numerados)
- .assets/TEMPLATES/ (pastas A-Z, arquivos numerados)

### 6. Implementar dry-run mode
- Flag --dry-run mostra o que seria renomeado sem executar

### 7. Adicionar sistema de exclusões
- Criar arquivo .watchignore para listar padrões a ignorar
- Por padrão ignorar: INDEX.md, .gitkeep, arquivos ocultos

### 8. Validação e testes
- Testar criação de arquivo em cada pasta monitorada
- Verificar delay de 10 segundos funcionando
- Testar múltiplos arquivos criados simultaneamente

## Code Examples

### naming_utils.py (estrutura)
```python
from pathlib import Path

BASE_DIR = Path("C:/Users/JOSE/.claude")
MONITORED_DIRS = [
    BASE_DIR / "skills",
    BASE_DIR / "agents",
    BASE_DIR / "commands",
    BASE_DIR / ".assets" / "DOCS",
    BASE_DIR / ".assets" / "DIAGRAMS",
    BASE_DIR / ".assets" / "RESEARCH",
    BASE_DIR / ".assets" / "SPECS",
    BASE_DIR / ".assets" / "TEMPLATES",
]

def number_to_letter(n: int) -> str:
    result = ""
    while n > 0:
        n -= 1
        result = chr(65 + (n % 26)) + result
        n //= 26
    return result

def get_next_available_number(directory: Path, extension: str = ".md") -> int:
    numbers = []
    for f in directory.glob(f"*{extension}"):
        if f.stem.isdigit():
            numbers.append(int(f.stem))
    if not numbers:
        return 1
    for i in range(1, len(numbers) + 1):
        if i not in numbers:
            return i
    return len(numbers) + 1

def is_valid_naming(filename: str) -> bool:
    parts = filename.split("-")
    return parts[0].isdigit()
```

## Acceptance Criteria

- [ ] Script monitora todas as pastas configuradas em tempo real
- [ ] Delay de 10 segundos funcionando corretamente
- [ ] Arquivos novos são renomeados seguindo o padrão
- [ ] Sistema é leve (< 50MB RAM, < 1% CPU idle)
- [ ] Comando /watch start inicia o monitoramento
- [ ] Comando /watch stop para o monitoramento
- [ ] Dry-run mode funciona corretamente

## Notes

### Dependências
- watchdog - biblioteca para monitoramento de filesystem (cross-platform)

### Performance
- Watchdog usa OS-level file events (muito eficiente)
- Uso de memória mínimo (~10-20MB)
- CPU idle ~0%
