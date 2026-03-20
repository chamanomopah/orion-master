# Análise Técnica - Trigger System
**Projeto:** B/A - n8n_local_trigger
**Data:** 2026-03-20
**Arquivo analisado:** `trigger.py`

---

## Resumo Executivo

Sistema de atalhos de teclado configuráveis que disparam webhooks para o n8n, com suporte a gravação de áudio e transcrição via Deepgram.

---

## Arquivo de Configuração: `shortcuts.json`

### Estrutura do JSON

```json
{
  "shortcuts": [
    {
      "id": 1,
      "name": "agent1",
      "hotkey": "home",
      "url": "https://nell-unlandmarked-gayla.ngrok-free.dev/webhook/A",
      "method": "POST",
      "params": {
        "agent_number": "1"
      },
      "trigger_type": "hold_to_record"
    }
  ]
}
```

### Campos de Configuração

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | int | Identificador único do atalho |
| `name` | string | Nome descritivo para exibição |
| `hotkey` | string | Tecla ou combinação (ex: "ctrl+shift+a", "home") |
| `url` | string | Endpoint do webhook n8n |
| `method` | string | HTTP method (GET/POST) - padrão: GET |
| `params` | object | Parâmetros enviados na requisição |
| `trigger_type` | string | "instant" ou "hold_to_record" |

---

## Arquitetura do Código

### Fluxo de Execução

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│ shortcuts.json  │ -> │ load_config()    │ -> │ setup_hotkeys() │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                                           │
                                              ┌────────────┴────────────┐
                                              │                         │
                                         ┌────▼────┐              ┌────▼────┐
                                         │ instant │              │ hold_to │
                                         │ trigger │              │ record  │
                                         └────┬────┘              └────┬────┘
                                              │                         │
                                        ┌─────▼─────┐           ┌────────▼────────┐
                                        │ trigger_  │           │ Gravar áudio    │
                                        │ webhook() │           │ Transcrever     │
                                        └─────┬─────┘           │ trigger_webhook │
                                              │                 └─────────────────┘
                                        ┌─────▼─────┐
                                        │ requests  │
                                        │ POST/GET  │
                                        └───────────┘
```

### Componentes Principais

| Função/Classe | Linhas | Responsabilidade |
|---------------|--------|------------------|
| `load_config()` | 24-31 | Carrega shortcuts.json |
| `load_deepgram_config()` | 33-40 | Carrega chave API Deepgram |
| `is_valid_hotkey()` | 42-52 | Valida se tecla é reconhecida |
| `trigger_webhook()` | 54-91 | Dispara requisição HTTP |
| `HoldToRecordHandler` | 93-208 | Gerencia gravação/transcrição |
| `setup_hotkeys()` | 210-284 | Registra todos os atalhos |
| `main()` | 286-298 | Entry point, mantém rodando |

---

## Tipos de Trigger

### 1. Instant Trigger
```python
keyboard.add_hotkey(hotkey, lambda: trigger_webhook(url, method, params, name))
```
- **Comportamento:** Dispara imediatamente ao pressionar
- **Uso:** Ações rápidas sem entrada de dados

### 2. Hold-to-Record Trigger
```python
keyboard.hook_key(hotkey, make_key_event_callback(handler))
```

**Ciclo de Execução:**
```
KEY_DOWN  → Inicia gravação de áudio
           └─> AudioRecorder.start_recording()

KEY_UP    → Para gravação
           └─> recorder.stop_recording()
           └─> TranscriptionService.transcribe_file_sync()
           └─> Adiciona 'transcript', 'recording_duration', 'confidence_score' aos params
           └─> trigger_webhook(url, method, params_enriched, name)
```

---

## Injeção de Dados no Webhook

Quando `trigger_type = "hold_to_record"`, os parâmetros são enriquecidos:

| Campo | Tipo | Origem |
|-------|------|--------|
| `transcript` | string | Deepgram transcription |
| `recording_duration` | float | Duração em segundos |
| `confidence_score` | float | Confiança da transcrição (0-1) |
| `params.*` | mixed | Do JSON original |

**Exemplo de payload enviado:**
```json
{
  "agent_number": "1",
  "transcript": "ativar o modo foco",
  "recording_duration": 2.45,
  "confidence_score": 0.92
}
```

---

## Bibliotecas Utilizadas

| Biblioteca | Uso |
|------------|-----|
| `keyboard` | Captura global de teclas |
| `requests` | Requisições HTTP |
| `audio_recorder` | Gravação de áudio local |
| `transcription_service` | Integração Deepgram |

---

## Vantagens da Abordagem Configuration-Driven

1. **Sem código para adicionar atalhos** - Basta editar JSON
2. **Interface web disponível** - `app.py` em http://localhost:5000
3. **Validação prévia** - `is_valid_hotkey()` testa antes de registrar
4. **Separação de concerns** - Config (JSON) vs Lógica (Python)
5. **Dinâmico** - Alterações sem recompilação

---

## Teclas Suportadas

Baseado na biblioteca `keyboard`:
- Teclas simples: `"a"`, `"home"`, `"end"`, `"pause"`, `"pagedown"`
- Combinações: `"ctrl+shift+a"`, `"alt+f4"`
- Referência: https://github.com/boppreh/keyboard#keyboard-raw-api

---

## Arquivos Relacionados

| Arquivo | Propósito |
|---------|-----------|
| `shortcuts.json` | Configuração dos atalhos |
| `config.json` | API Key Deepgram + audio settings |
| `app.py` | Interface web para editar atalhos |
| `audio_recorder.py` | Gravação de áudio |
| `transcription_service.py` | Cliente Deepgram |

---

## Comandos Úteis

```bash
# Listar dispositivos de áudio
python list_audio_devices.py

# Executar sistema de triggers
python trigger.py
```

---

## Notas de Implementação

- **Encoding UTF-8 forçado** para Windows (linhas 11-17)
- **Allow redirects=True** para compatibilidade com ngrok (linha 69, 71)
- **Timeout de 10s** para requisições HTTP
- **Closure problem resolvido** com factory function e default args (linhas 250-266)
