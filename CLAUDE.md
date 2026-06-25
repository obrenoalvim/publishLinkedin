# publish-linkedin

Automação de fila de conteúdo para LinkedIn.

## Setup

```bash
npm install
cp .env.example .env   # preencher credenciais
node auth.js           # gerar token
```

## Uso diário

```bash
node post.js --list       # ver fila
node post.js --validate   # checar limite de chars
node post.js              # publicar próximo post pendente
```

---

## Gerar novos posts (FLUXO OBRIGATÓRIO)

**Ler `CONTENT_RULES.md` primeiro. Fazer as perguntas listadas lá ao usuário antes de escrever qualquer coisa.**

### Passo 1 — checar queue atual

```bash
node -e "const q=require('./queue.json'); const p=q.filter(x=>x.status==='pending'); console.log(q.length,'total |',p.length,'pendentes | último ID:',Math.max(...q.map(x=>x.id))); p.slice(-5).forEach(x=>console.log(x.id,'|',x.title))"
```

### Passo 2 — perguntar ao usuário (se não definido)

Antes de gerar, confirmar:
- Tópicos para esse lote
- Ângulos específicos ou histórias para incluir
- Algo a evitar nessa rodada

### Passo 3 — escrever posts

Gerar em paralelo via Agent tool. Seguir `CONTENT_RULES.md` exatamente.

### Passo 4 — validar contagem de caracteres

```js
[...body].length < 4000   // chars Unicode, não bytes
```

Se ultrapassar: cortar parágrafos do meio. Sempre preservar: abertura + pergunta de engajamento + hashtags.

### Passo 5 — escrever no queue.json

Usar script Node.js (copiar `scripts/add-posts-example.js`). Nunca usar template literals com aspas no shell — escrever um arquivo `.js` e rodar.

O script deve:
- Checar IDs duplicados antes de escrever
- Validar contagem de chars antes de escrever
- Imprimir confirmação após escrever

### Passo 6 — commit e push

```bash
git add queue.json
git commit -m "feat: add N new LinkedIn posts (IDs X-Y)"
git push
```

Resolver conflitos antes do push.

---

## Regras críticas de escrita

- Sem parênteses no corpo do post — **quebra a API do LinkedIn**
- Sem travessão (`—`) — usar vírgula ou ponto
- Sem emojis exceto bandeiras se usar formato bilíngue
- Sem listas (bullets ou numeração)
- Sem advérbios
- Voz ativa
- Específico: datas, nomes, números reais
- Terminar com pergunta de engajamento
- `[...body].length < 4000`

Regras completas e formato em `CONTENT_RULES.md`.

---

## Estrutura do queue.json

```json
{
  "id": 1,
  "title": "Título descritivo (referência interna apenas)",
  "status": "pending",
  "body": "corpo do post aqui"
}
```

IDs sequenciais. Usar `Math.max(...q.map(x=>x.id)) + 1` para o próximo ID.

Status: `pending` | `published` | `failed_truncation`

---

## Renovar token

Rodar `node auth.js` quando LinkedIn retornar 401. Copiar novos valores para `.env`.
