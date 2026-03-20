# Plan: Hotkey Launcher System

## Task Description
Sistema de atalhos de teclado configuráveis (hotkey launcher) inspirado no Trigger Analysis do n8n_local_trigger, mas focado em automações locais: abrir programas, navegadores em sites específicos, e executar comandos customizados. O sistema deve ser configuration-driven via JSON, com feedback visual das ações executadas.

## Objective
Criar um script Python que monitora hotkeys globais e executa ações locais baseadas em configuração JSON, com feedback visual de notificação quando as ações são executadas.

## Problem Statement
Atualmente não existe um sistema centralizado para gerenciar atalhos globais no Windows que:
- Abra programas específicos
- Abra o browser diretamente em URLs
- Execute comandos do sistema
- Forneça feedback visual das ações
- Seja facilmente configurável sem editar código

## Solution Approach
Sistema baseado na biblioteca `keyboard` (já usada no trigger.py) com:
- Arquivo `launcher.json` para configuração dos atalhos
- Suporte a múltiplos tipos de ação: `program`, `url`, `command`
- Feedback visual usando notificações do Windows (toast notifications)
- Interface CLI simples para listar/recarregar configurações

---

## Relevant Files

### New Files
- `.IMPLEMENTATION/projects/C-hotkey-launcher/launcher.py` - Script principal do sistema
- `.IMPLEMENTATION/projects/C-hotkey-launcher/launcher.json` - Arquivo de configuração
- `.IMPLEMENTATION/projects/C-hotkey-launcher/requirements.txt` - Dependências
- `.IMPLEMENTATION/projects/C-hotkey-launcher/README.md` - Documentação de uso

### Existing Reference Files
- `.IMPLEMENTATION/projects/B-software/A-n8n_local_trigger/trigger.py` - Referência de estrutura

---

## Implementation Phases

### Phase 1: Foundation
- Criar estrutura do projeto
- Definir formato do JSON de configuração
- Setup de dependências

### Phase 2: Core Implementation
- Carregamento de configuração
- Sistema de hotkeys com biblioteca `keyboard`
- Executores para cada tipo de ação

### Phase 3: Integration & Polish
- Feedback visual com notificações
- Tratamento de erros
- CLI e documentação

---

## Step by Step Tasks

### 1. Criar Estrutura do Projeto
- Criar pasta `C-hotkey-launcher` em `.IMPLEMENTATION/projects/`
- Criar arquivo `launcher.json` com estrutura base

### 2. Definir Formato de Configuração
```json
{
  "shortcuts": [
    {
      "id": 1,
      "name": "Abre VS Code",
      "hotkey": "ctrl+alt+v",
      "action_type": "program",
      "target": "code",
      "args": []
    },
    {
      "id": 2,
      "name": "Abre ChatGPT",
      "hotkey": "ctrl+alt+g",
      "action_type": "url",
      "target": "https://chat.openai.com"
    },
    {
      "id": 3,
      "name": "Screenshot",
      "hotkey": "ctrl+alt+s",
      "action_type": "command",
      "target": "snippingtool"
    }
  ]
}
```

### 3. Implementar Carregamento de Configuração
- Função `load_config()` que lê `launcher.json`
- Validação de schema básica
- Tratamento de erro para arquivo não encontrado

### 4. Implementar Executores de Ação
- `execute_program(target, args)` - Usa `subprocess.Popen` para programas
- `open_url(target)` - Usa `webbrowser.open` para URLs
- `execute_command(target)` - Usa `os.system` ou `subprocess` para comandos

### 5. Implementar Sistema de Hotkeys
- Função `setup_hotkeys()` baseada no `trigger.py`
- Validação de hotkey com `is_valid_hotkey()`
- Factory function para evitar closure problem

### 6. Implementar Feedback Visual
- Notificações toast do Windows usando `win10toast` ou `plyer`
- Alternativa: console colorido com `colorama`
- Mostrar nome do atalho executado e resultado

### 7. Implementar CLI e Utilitários
- `--list` para listar atalhos configurados
- `--reload` para recarregar configuração sem reiniciar
- `--test <hotkey>` para testar atalho específico

### 8. Criar Documentação
- README com instruções de uso
- Exemplos de configuração
- Lista de teclas suportadas

### 9. Testar e Validar
- Testar cada tipo de ação
- Verificar hotkeys conflitantes
- Validar feedback visual

---

## Testing Strategy

### Testes Manuais
1. **Action Type: Program**
   - Testar abrir VS Code
   - Testar abrir Notepad
   - Testar abrir com argumentos

2. **Action Type: URL**
   - Testar abrir HTTP
   - Testar abrir HTTPS
   - Testar URL com parâmetros

3. **Action Type: Command**
   - Testar comandos do sistema
   - Testar comandos com caminhos

4. **Hotkey Validation**
   - Testar combinações com Ctrl, Alt, Shift
   - Testar tecla nona específica
   - Testar hotkeys inválidos

5. **Feedback Visual**
   - Verificar notificações aparecem
   - Verificar mensagens de erro
   - Verificar formatação correta

---

## Acceptance Criteria

- [ ] Script executa e aguarda hotkeys em background
- [ ] `launcher.json` define todos os atalhos sem necessidade de editar código
- [ ] Três tipos de ação funcionam: `program`, `url`, `command`
- [ ] Feedback visual aparece para cada ação executada
- [ ] Hotkeys são validados antes de registrar
- [ ] Erros são logados claramente
- [ ] CLI com `--list` funciona
- [ ] README documentando uso completo

---

## Validation Commands

```bash
# Instalar dependências
cd C:/Users/JOSE/.claude/.IMPLEMENTATION/projects/C-hotkey-launcher
pip install -r requirements.txt

# Testar carregamento de config
python launcher.py --list

# Executar sistema
python launcher.py

# Testar hotkey específico (manual via teclado)
# Pressionar hotkey configurado e verificar ação
```

---

## Notes

### Dependências Necessárias
```txt
keyboard>=0.13.5
win10toast>=0.9  # ou plyer>=2.1.0 para multiplataforma
colorama>=0.4.6  # para console colorido
```

### Considerações Importantes
1. **Windows Only**: `win10toast` funciona apenas no Windows. Para multiplataforma, usar `plyer`
2. **Admin Rights**: Alguns hotkeys podem requerer execução como administrador
3. **Tecla Nona**: Verificar qual tecla específica o usuário quer usar (pode ser F13-F24, ou uma tecla média)
4. **Conflitos**: Alertar se hotkey já estiver em uso por outro programa
5. **Paths**: Suportar caminhos relativos e absolutos para programas

### Referências
- Biblioteca `keyboard`: https://github.com/boppreh/keyboard#keyboard-raw-api
- Projeto inspirador: `trigger.py` em `B-software/A-n8n_local_trigger/`

### Melhorias Futuras (Opcional)
- Interface web para editar configuração (similar ao `app.py` do trigger)
- Suporte a macros (sequência de ações)
- Perfis de atalhos (trabalho, pessoal, jogos)
- Estatísticas de uso
- Autostart com Windows
