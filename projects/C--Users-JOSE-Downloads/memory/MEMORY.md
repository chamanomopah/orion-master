# MEMORY - Docker N8N Evolution API (ARQUITETURA UNIFICADA v2.0)

## 🎯 Projeto

Stack completa de automação: **N8N** + **Evolution API** (WhatsApp) + **Chatwoot** (atendimento)

**Localização:** `C:\Users\JOSE\Downloads\docker-n8n-evo`

**Data:** 2026-02-09

**Versão:** 2.0 (Arquitetura Unificada - 1 Túnel Nginx)

---

## 🌐 URLs Públicas (1 ÚNICA URL via Serveo)

**URL Principal:** https://maceio-all-serveo.serveousercontent.com

**Rotas disponíveis:**
- **N8N:** https://maceio-all-serveo.serveousercontent.com/**n8n/**
- **Evolution API:** https://maceio-all-serveo.serveousercontent.com/**evo/**
- **Chatwoot:** https://maceio-all-serveo.serveousercontent.com/**chat/**

**Arquitetura:**
```
Serveo Tunnel (1 único) → Nginx (porta 8081) → Distribui por path:
  ├─ /n8n/*  → N8N container (5678)
  ├─ /evo/*  → Evolution API container (8080)
  └─ /chat/* → Chatwoot container (3000)
```

---

## 🔑 Credenciais Importantes

### N8N (Docker - Imagem Oficial)
- **Basic Auth User:** admin
- **Basic Auth Password:** `N3wK6O0w005VVpFjaOhF`
- **Porta local:** 5678
- **URL Pública:** https://maceio-all-serveo.serveousercontent.com/n8n/

### Evolution API
- **API Key:** `oxSHDTXVWAxaLqZRXomMPShY93xhmgbzVZwd1QJJ`
- **Porta local:** 8080
- **URL Pública:** https://maceio-all-serveo.serveousercontent.com/evo/

### PostgreSQL (Compartilhado)
- **User:** postgres
- **Password:** `4GzSE5JMkBgLyqIo9mME0VBXmf481osD`
- **Porta:** 5432
- **Databases:** app_db, chatwoot_production, n8n

### Redis
- **Password:** `oPvT2rgzcoVtwqDCAYhMz76I`
- **Porta local:** 6380

### Chatwoot
- **SECRET_KEY_BASE:** `8c4cfd98eb37f91e24e093a96475d006ca738cdfc16dd142e78122628f9d9295d5781e2bbe92e69e6c48e101bd2ddb6dc79ffcd03f95505f40bd80b24aae26ff`
- **URL Pública:** https://maceio-all-serveo.serveousercontent.com/chat/

---

## 📁 Estrutura de Arquivos

### Essenciais (Raiz)
- `.env` - Variáveis de ambiente
- `docker-compose.yml` - Docker com N8N oficial + Nginx + Evolution + Chatwoot
- `nginx.conf` - Configuração do Reverse Proxy (path-based routing)
- `tunnel-all.ps1` - **ÚNICO script** de túnel com SSH Control Socket

### Scripts de Gerenciamento
- `cleanup-tunnels.ps1` - Matar todos os túneis Serveo
- `stop-all.ps1` - Parar todos containers
- `test-services.ps1` - Testar serviços
- `test-list-ssh.ps1` - Listar processos SSH ativos

### Documentação
- `README.md` - Documentação principal atualizada
- `MIGRACAO-PARA-1-TUNNEL.md` - Guia de migração da arquitetura antiga

### Scripts Obsoletos (NÃO USAR MAIS)
- ❌ `tunnel-evolution.ps1` - Use `tunnel-all.ps1`
- ❌ `tunnel-chatwoot.ps1` - Use `tunnel-all.ps1`
- ❌ `tunnel-n8n.ps1` - Use `tunnel-all.ps1`
- ❌ `start-n8n.ps1` - N8N agora roda no Docker
- ❌ `TUNEIS.ps1` - Arquitetura antiga

---

## 🚀 Como Usar

### Início Rápido

```powershell
# 1. Iniciar Docker (todos os serviços incluindo N8N)
docker compose up -d

# 2. Iniciar túnel único (apenas 1 terminal!)
.\tunnel-all.ps1

# ✓ Pronto! Acesse:
# • N8N: https://maceio-all-serveo.serveousercontent.com/n8n/
# • Evolution: https://maceio-all-serveo.serveousercontent.com/evo/
# • Chatwoot: https://maceio-all-serveo.serveousercontent.com/chat/
```

### Encerrar Túnel

Pressione **Ctrl+C** no terminal do `tunnel-all.ps1`

Shutdown limpo via SSH Control Socket é automático!

---

## 🔧 Arquitetura Docker

### Containers

| Container | Imagem | Porta Local | Descrição |
|-----------|--------|-------------|-----------|
| postgres | ankane/pgvector | 5432 | Database compartilhado |
| redis | bitnami/redis | 6380 | Cache compartilhado |
| evolution-api | atendai/evolution-api:v2.2.3 | 8080 | WhatsApp API |
| chatwoot-rails | chatwoot/chatwoot | 3000 | Interface web |
| chatwoot-sidekiq | chatwoot/chatwoot | - | Background jobs |
| **n8n** | **n8nio/n8n** | **5678** | **Automação (NOVO!)** |
| **nginx** | **nginx:alpine** | **8081** | **Reverse Proxy (NOVO!)** |
| adminer | adminer | 8082 | DB manager |

### Redes
Todas as containers na rede `minha_rede` (bridge)

### Volumes
- postgres_data
- n8n_data
- chatwoot_storage
- lab_evolution_instances
- redis_data

---

## 🔧 Nginx Reverse Proxy

### Path-based Routing

```nginx
location /n8n/ {
    rewrite ^/n8n/(.*) /$1 break;
    proxy_pass http://n8n:5678;
}

location /evo/ {
    rewrite ^/evo/(.*) /$1 break;
    proxy_pass http://evolution-api:8080;
}

location /chat/ {
    rewrite ^/chat/(.*) /$1 break;
    proxy_pass http://chatwoot-rails:3000;
}
```

### Features
- ✅ WebSocket suportado (Evolution, Chatwoot Cable, N8N editor)
- ✅ Headers corretos para cada serviço
- ✅ Health check endpoint: `/health`
- ✅ Página inicial com links

---

## 🔧 Integração Evolution API + Chatwoot

### Criar Instância com Chatwoot

```bash
curl -X POST https://maceio-all-serveo.serveousercontent.com/evo/instance/create \
  -H "Content-Type: application/json" \
  -H "apikey: oxSHDTXVWAxaLqZRXomMPShY93xhmgbzVZwd1QJJ" \
  -d '{
    "instanceName": "whatsapp-producao",
    "integration": "WHATSAPP-BAILEYS",
    "chatwootAccountId": "1",
    "chatwootToken": "TOKEN_CHATWOOT",
    "chatwootUrl": "https://maceio-all-serveo.serveousercontent.com/chat",
    "chatwootSignMsg": true,
    "chatwootReopenConversation": true,
    "chatwootImportContacts": true
  }'
```

---

## ⚠️ Troubleshooting

### Túnel não funciona (502)

```powershell
# 1. Verificar se Nginx está rodando
curl http://localhost:8081/health

# 2. Verificar logs
docker compose logs nginx

# 3. Verificar containers
docker compose ps
```

### N8N não inicia

```powershell
# Criar database N8N
docker compose exec postgres psql -U postgres -c "CREATE DATABASE n8n;"

# Reiniciar N8N
docker compose restart n8n

# Ver logs
docker compose logs -f n8n
```

### Chatwoot em branco

```powershell
# Rodar migrations
docker compose exec chatwoot-rails bundle exec rails db:chatwoot_prepare

# Reiniciar
docker compose restart chatwoot-rails chatwoot-sidekiq
```

### Erro "remote port forwarding failed"

**Causa:** Túnel órfão no servidor Serveo

**Solução:**
1. Pressione **Ctrl+C** (shutdown limpo via SSH Control Socket)
2. Aguardar 2-3 segundos
3. Executar novamente: `.\tunnel-all.ps1`

Se persistir: `.\cleanup-tunnels.ps1`

---

## 🔄 Comparação: Antigo vs Novo

| Aspecto | Antigo (v1.0) | Novo (v2.0) |
|---------|--------------|-------------|
| Túneis SSH | 3 separados | 1 único |
| Terminais | 3 abertos | 1 apenas |
| URLs públicas | 3 separadas | 1 com paths |
| N8N | Fora do Docker | No Docker (oficial) |
| Proxy | Nenhum | Nginx reverse proxy |
| Complexidade | Alta | Baixa |

---

## 📚 Documentação Oficial Consultada

### Docker & N8N
- [N8N Docker Compose](https://docs.n8n.io/hosting/installation/server-setups/docker-compose/)
- [N8N Environment Variables](https://docs.n8n.io/hosting/configuration/environment-variables/)
- [N8N Database Config](https://docs.n8n.io/hosting/configuration/environment-variables/database/)
- [N8N Docker Image](https://hub.docker.com/r/n8nio/n8n)

### Evolution API
- [Evolution API Docker](https://doc.evolution-api.com/v2/en/install/docker)
- [Evolution docker-compose](https://github.com/EvolutionAPI/evolution-api/blob/main/docker-compose.yaml)

### Chatwoot
- [Chatwoot Docker](https://developers.chatwoot.com/self-hosted/deployment/docker)
- [Chatwoot Image](https://hub.docker.com/r/chatwoot/chatwoot)
- [Chatwoot GitHub](https://github.com/chatwoot/chatwoot/blob/develop/docker-compose.yaml)

### Nginx Reverse Proxy
- [Docker Nginx Reverse Proxy 2026](https://oneuptime.com/blog/post/2026-01-16-docker-nginx-reverse-proxy/view)
- [Path-Based Routing](https://medium.com/cloud-native-daily/path-based-routing-with-nginx-reverse-proxy-for-multiple-applications-in-a-vm-53838169540c)
- [Nginx Multiple Containers](https://anaselfatihi.medium.com/how-to-set-up-a-reverse-proxy-for-multiple-docker-containers-using-nginx-8c7fb631c607)

---

## ✅ Status Final

- ✅ Docker Compose completo
- ✅ N8N oficial no Docker
- ✅ Nginx reverse proxy
- ✅ Path-based routing
- ✅ 1 túnel Serveo único
- ✅ SSH Control Socket
- ✅ Health checks
- ✅ WebSocket suportado
- ✅ PostgreSQL + pgvector
- ✅ Documentação atualizada

**Data:** 2026-02-09
**Versão:** 2.0 (Arquitetura Unificada)

---

## 🎯 Próximos Passos Opcionais

1. **HTTPS:** Adicionar Let's Encrypt no Nginx (precisa de domínio)
2. **Cloudflare Tunnel:** Migrar para Cloudflare (mais estável)
3. **Backups:** Configurar backup automático dos volumes
4. **Monitoring:** Adicionar Prometheus/Grafana

---

**Última atualização:** 2026-02-09
