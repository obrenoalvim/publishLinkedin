# publish-linkedin

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

Automatiza publicação de posts no LinkedIn via API REST. Mantém uma fila JSON de posts e publica um por execução — projetado para rodar em cron schedule.

**[🇺🇸 Read in English](README.md)**

---

## Como funciona

1. Posts ficam armazenados em `queue.json`
2. Um cron job (ou trigger manual) chama `node post.js`
3. O script pega o próximo post `pending`, publica via API do LinkedIn e marca como `published`
4. Novos posts são adicionados à fila manualmente ou por agentes de IA seguindo `CONTENT_RULES.md`

---

## Setup passo a passo

### 1. Criar um app no LinkedIn Developer

1. Acesse [https://developer.linkedin.com/](https://developer.linkedin.com/)
2. Clique em **Create app**
3. Preencha:
   - **App name** — qualquer nome (ex: "Meu LinkedIn Publisher")
   - **LinkedIn Page** — sua página pessoal ou de empresa (exigido pelo LinkedIn)
   - **App logo** — qualquer imagem
4. Clique em **Create app**

### 2. Adicionar produtos necessários

No painel do app, clique na aba **Products** e solicite acesso a:

- **Share on LinkedIn** — permite publicar conteúdo
- **Sign In with LinkedIn using OpenID Connect** — permite buscar seu URN de pessoa

> Os produtos podem levar alguns minutos para ativar. Ambos precisam mostrar **Added** antes de continuar.

### 3. Configurar redirect URI do OAuth

1. No painel do app, vá até a aba **Auth**
2. Em **OAuth 2.0 settings**, clique no ícone de lápis ao lado de **Authorized redirect URLs**
3. Adicione: `http://localhost:3000/callback`
4. Salve

### 4. Copiar credenciais

Ainda na aba **Auth**, copie:
- **Client ID**
- **Client Secret**

### 5. Instalar e configurar

```bash
git clone https://github.com/seu-usuario/publish-linkedin.git
cd publish-linkedin
npm install
cp .env.example .env
```

Abra o `.env` e preencha:

```env
LINKEDIN_CLIENT_ID=seu_client_id
LINKEDIN_CLIENT_SECRET=seu_client_secret
```

### 6. Gerar token de acesso

```bash
node auth.js
```

Isso vai:
1. Abrir o navegador na página de autorização do LinkedIn
2. Pedir para você fazer login e autorizar o app
3. Imprimir seu `LINKEDIN_ACCESS_TOKEN` e `LINKEDIN_PERSON_URN`

Copie os dois valores para o `.env`.

### 7. (Opcional) Adicionar cookie de sessão para verificação de posts

Após publicar, o script pode verificar se o post apareceu no LinkedIn via scraping. Para ativar:

1. Abra o LinkedIn no navegador
2. Abra DevTools → Application → Cookies → `www.linkedin.com`
3. Copie o valor do cookie `li_at`
4. Adicione no `.env`: `LI_AT=valor_do_cookie`

### 8. Validar setup

```bash
node scripts/setup-check.js
```

Verifica se todas as variáveis de ambiente estão configuradas e se a API do LinkedIn está acessível com seu token.

---

## Uso

```bash
node post.js             # publicar próximo post pendente
node post.js --list      # listar todos os posts da fila
node post.js --validate  # checar se posts pendentes estão dentro de 4000 chars
```

Ou via npm scripts:

```bash
npm run post
npm run list
npm run validate
npm run auth
```

---

## Adicionar posts à fila

Checar status atual da fila:

```bash
node -e "const q=require('./queue.json'); const p=q.filter(x=>x.status==='pending'); console.log(q.length,'total |',p.length,'pendentes | último ID:',Math.max(...q.map(x=>x.id)))"
```

Copie `scripts/add-posts-example.js`, preencha seus posts e rode:

```bash
node scripts/seus-novos-posts.js
git add queue.json && git commit -m "feat: add N posts (IDs X-Y)"
```

Veja `CONTENT_RULES.md` para o guia completo de formato e estilo.

---

## Expiração do token

Tokens de acesso do LinkedIn expiram após **60 dias**. Quando receber erro 401:

```bash
node auth.js
```

Copie o novo `LINKEDIN_ACCESS_TOKEN` para o `.env`.

---

## Estrutura do projeto

```
publish-linkedin/
├── post.js                    publicador principal
├── auth.js                    fluxo OAuth 2.0
├── queue.json                 fila de conteúdo
├── .env.example               template de variáveis de ambiente
├── CONTENT_RULES.md           guia de formato e estilo
├── CLAUDE.md                  instruções para agentes de IA
├── README.md                  este arquivo (inglês)
├── README.pt.md               este arquivo (português)
└── scripts/
    ├── setup-check.js         valida credenciais e conexão com a API
    └── add-posts-example.js   template para adicionar posts à fila
```

---

## Licença

[MIT](LICENSE)
