# 📋 DOCUMENTO TÉCNICO - PROBLEMA DE CONEXÃO COM PROXY

**Projeto:** UpCLT - Aplicativo de Crédito Consignado CLT  
**Data:** 05/02/2026  
**Urgência:** Alta

---

## 🎯 RESUMO DO PROBLEMA

O aplicativo não consegue conectar às Edge Functions da Supabase com o Cloudflare Tunnel/Proxy, mesmo quando o túnel está ativo e funcionando corretamente no servidor local.

**Erro persistente:** `"Não foi possível conectar ao servidor proxy"` ou `"Failed to connect to proxy"`

---

## 🏗️ ARQUITETURA DO PROJETO

### Stack Tecnológico
- **Frontend:** React + Vite + TypeScript + Tailwind CSS
- **Backend:** Supabase (Lovable Cloud)
- **Edge Functions:** Deno (Supabase Edge Functions)
- **API Externa:** Facta (webservice.facta.com.br) - API de consulta de crédito consignado
- **Proxy:** Cloudflare Tunnel rodando em VPS com IP liberado na Facta

### Fluxo de Dados
```
[App React] 
    ↓ (HTTPS)
[Supabase Edge Function] 
    ↓ (HTTPS via Proxy)
[Cloudflare Tunnel na VPS] 
    ↓ (HTTPS)
[API Facta - webservice.facta.com.br]
```

### Motivo do Proxy
A API da Facta **só aceita requisições de IPs previamente liberados**. O IP da VPS do cliente está liberado na Facta, mas os IPs das Edge Functions da Supabase (que mudam dinamicamente) não estão.

---

## 📁 ARQUIVOS RELEVANTES

### 1. Edge Function Principal - facta-operacoes
**Caminho:** `supabase/functions/facta-operacoes/index.ts`

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// Proxy na VPS do cliente com IP liberado na Facta (via Cloudflare Tunnel)
const FACTA_BASE_URL = "https://webservice.facta.com.br";
const PROXY_URL = "https://mysql-metallica-solving-lined.trycloudflare.com";

// Token cache
let tokenCache: { token: string; expira: Date } | null = null;

async function getFactaToken(): Promise<string> {
  if (tokenCache && new Date() < tokenCache.expira) {
    console.log("Using cached Facta token");
    return tokenCache.token;
  }

  const authBasic = Deno.env.get('FACTA_AUTH_BASIC');
  if (!authBasic) {
    throw new Error("FACTA_AUTH_BASIC not configured");
  }

  console.log("Fetching new Facta token via proxy...");
  
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 25000);
  
  let response: Response;
  try {
    response = await fetch(PROXY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        method: 'GET',
        url: `${FACTA_BASE_URL}/gera-token`,
        headers: { 'Authorization': `Basic ${authBasic}` }
      }),
      signal: controller.signal
    });
    clearTimeout(timeoutId);
  } catch (fetchError) {
    clearTimeout(timeoutId);
    console.error(`Failed to connect to proxy: ${fetchError}`);
    throw new Error("Não foi possível conectar ao servidor proxy.");
  }

  // ... resto do código
}
```

### 2. Proxy Server na VPS
**Código do servidor proxy (Node.js/Express rodando na VPS):**

```javascript
const express = require('express');
const fetch = require('node-fetch');
const app = express();

app.use(express.json());

// Proxy endpoint
app.post('/', async (req, res) => {
  try {
    const { method, url, headers, body } = req.body;
    
    const options = {
      method: method || 'GET',
      headers: headers || {}
    };
    
    if (body && (method === 'POST' || method === 'PUT')) {
      if (typeof body === 'object') {
        options.body = new URLSearchParams(body).toString();
        options.headers['Content-Type'] = 'application/x-www-form-urlencoded';
      } else {
        options.body = body;
      }
    }
    
    const response = await fetch(url, options);
    const data = await response.json();
    
    res.json(data);
  } catch (error) {
    res.status(500).json({ erro: true, mensagem: error.message });
  }
});

app.listen(3000, () => console.log('Proxy running on port 3000'));
```

### 3. Cloudflare Tunnel
O túnel é iniciado com:
```bash
cloudflared tunnel --url http://localhost:3000
```

Isso gera uma URL pública tipo: `https://mysql-metallica-solving-lined.trycloudflare.com`

---

## ❌ O PROBLEMA ESPECÍFICO

### Sintomas
1. A Edge Function tenta conectar ao `PROXY_URL` (Cloudflare Tunnel)
2. A conexão falha com timeout ou erro de conexão
3. O erro retornado é: `"Não foi possível conectar ao servidor proxy"`

### Logs do Erro (Edge Function)
```
Failed to connect to proxy: TypeError: error sending request for url (https://mysql-metallica-solving-lined.trycloudflare.com): error trying to connect: tcp connect error: Connection refused
```

ou

```
Failed to connect to proxy: TypeError: error sending request for url: connection closed before message completed
```

### O que já verificamos
1. ✅ O túnel Cloudflare está ativo (verificado no terminal da VPS)
2. ✅ A URL do túnel está acessível via navegador
3. ✅ O servidor proxy na VPS está rodando na porta 3000
4. ✅ O código da Edge Function usa a URL correta do túnel
5. ✅ O secret `FACTA_AUTH_BASIC` está configurado

### O que NÃO funciona
- A Edge Function da Supabase não consegue fazer fetch para a URL do Cloudflare Tunnel
- O timeout de 25 segundos expira sem resposta

---

## 🔧 CONFIGURAÇÕES ATUAIS

### Secrets da Supabase (Edge Functions)
- `FACTA_AUTH_BASIC` - Credenciais de autenticação da API Facta (formato: "username:password" em base64)

### PROXY_URL Atual
```
https://mysql-metallica-solving-lined.trycloudflare.com
```

### Timeout Configurado
- 25 segundos para obter token
- 30 segundos para chamadas de API

---

## ❓ PERGUNTA PARA DIAGNÓSTICO

**Pergunta principal:**
Por que uma Supabase Edge Function (Deno) não consegue fazer `fetch()` para uma URL pública do Cloudflare Tunnel (`*.trycloudflare.com`), mesmo quando essa URL está acessível normalmente via navegador ou curl?

**Perguntas auxiliares:**
1. Existe alguma restrição de rede nas Edge Functions da Supabase que bloqueia conexões para domínios do Cloudflare Tunnel?
2. O Cloudflare Tunnel pode estar bloqueando requisições que vêm de servidores (edge functions) vs navegadores?
3. Existe algum header específico que precisa ser enviado para o Cloudflare Tunnel aceitar a conexão?
4. O problema pode ser relacionado a DNS ou resolução de hostname nas Edge Functions?
5. Existe uma alternativa ao Cloudflare Tunnel que funcionaria melhor com Supabase Edge Functions?

---

## 🔍 TESTES SUGERIDOS

### Teste 1 - Verificar se o proxy responde
```bash
curl -X POST https://mysql-metallica-solving-lined.trycloudflare.com \
  -H "Content-Type: application/json" \
  -d '{"method":"GET","url":"https://httpbin.org/get","headers":{}}'
```

### Teste 2 - Testar diretamente na Edge Function
Adicionar logs mais detalhados:
```typescript
console.log("Attempting to connect to:", PROXY_URL);
console.log("Request body:", JSON.stringify(requestBody));
```

### Teste 3 - Testar com URL diferente
Tentar fazer fetch para um serviço público (como httpbin.org) para verificar se o problema é específico do Cloudflare Tunnel.

---

## 💡 POSSÍVEIS SOLUÇÕES A INVESTIGAR

1. **Usar um proxy diferente** - Nginx + ngrok, ou um servidor proxy em cloud com IP fixo
2. **Configurar headers específicos** - User-Agent, Accept, etc.
3. **Usar cloudflared como serviço permanente** - Em vez de túnel temporário
4. **Configurar tunnel com domínio personalizado** - Em vez de usar o domínio temporário do trycloudflare.com
5. **Verificar se há rate limiting** - Cloudflare pode estar limitando requisições de IPs de datacenter

---

## 📞 INFORMAÇÕES ADICIONAIS

- **Supabase Project ID:** jcxsnyutdowkdclxdsph
- **Framework:** React + Vite + TypeScript
- **Edge Functions Runtime:** Deno
- **API Destino:** Facta (webservice.facta.com.br e cltoff.facta.com.br)

---

## 📝 HISTÓRICO DE TENTATIVAS

1. URL do túnel anterior: `https://joining-roles-americas-map.trycloudflare.com` - Mesmo erro
2. URL atual: `https://mysql-metallica-solving-lined.trycloudflare.com` - Mesmo erro
3. Deploy das edge functions múltiplas vezes - Sem sucesso
4. Verificação de secrets - Configurados corretamente

---

**Qualquer ajuda para resolver esse problema de conexão entre Supabase Edge Functions e Cloudflare Tunnel seria muito apreciada!**
