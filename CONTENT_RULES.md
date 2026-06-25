# Regras de Conteúdo — LinkedIn Queue

## Antes de gerar posts: perguntar ao usuário

Se qualquer um dos itens abaixo não estiver definido na sessão, **perguntar antes de escrever qualquer post**:

1. **Tópicos** — Quais assuntos quer cobrir? (Exemplos: história da tecnologia, decisões de produto, cultura dev, liderança, seu setor)
2. **Audiência** — Para quem você está escrevendo? (devs, gestores, fundadores, profissionais em geral?)
3. **Idioma(s)** — Quer posts bilíngues (EN + PT-BR)? Ou só um idioma? Qual?
4. **Tom** — Formal ou conversacional? Histórias pessoais ou conteúdo educativo?
5. **Temas proibidos** — Tem algo que nunca quer publicar?

Não assumir padrão nenhum. Perguntar. Só prosseguir depois que o usuário responder.

---

## Fluxo (ordem obrigatória)

### 1. Checar queue atual

```bash
node -e "const q=require('./queue.json'); const p=q.filter(x=>x.status==='pending'); console.log(q.length,'total |',p.length,'pendentes | último ID:',Math.max(...q.map(x=>x.id))); p.slice(-5).forEach(x=>console.log(x.id,'|',x.title))"
```

### 2. Definir tópicos

Checar títulos recentes acima para evitar duplicatas. Descartar um tópico se já existe na fila — a menos que o ângulo seja claramente diferente.

### 3. Gerar posts

Gerar um por um ou em paralelo via Agent tool. Seguir o formato abaixo exatamente.

### 4. Validar contagem de caracteres

```js
[...body].length < 4000   // chars Unicode, não bytes
```

Se ultrapassar: cortar parágrafos do meio. Sempre preservar: abertura + pergunta de engajamento + hashtags.

### 5. Escrever no queue.json

Usar script Node.js (copiar `scripts/add-posts-example.js`). Nunca usar template literals com aspas no shell — escrever um arquivo `.js` e rodar.

O script deve:
- Checar IDs duplicados antes de escrever
- Validar contagem de chars antes de escrever
- Imprimir confirmação após escrever

### 6. Commit e push

```bash
git add queue.json
git commit -m "feat: add N new LinkedIn posts (IDs X-Y)"
git push
```

Resolver conflitos antes do push.

---

## Formato do post

### Bilíngue (EN + PT-BR)

```
🇺🇸 [corpo EN — 3-4 parágrafos, termina com pergunta de engajamento]

---

🇧🇷 [corpo PT — mesma mensagem em português brasileiro natural]

#HashtagPT1 #HashtagPT2 #HashtagPT3 #Brasil
#HashtagEN1 #HashtagEN2 #HashtagEN3 #Software
```

### Idioma único

```
[corpo — 3-4 parágrafos, termina com pergunta de engajamento]

#Hashtag1 #Hashtag2 #Hashtag3
```

Usar 4-6 hashtags. Misturar tags específicas do tema com 2 tags gerais de alto volume relevantes ao universo do post.

---

## Regras de escrita (sempre aplicar)

**Estrutura**
- 3-4 parágrafos
- Terminar com pergunta de engajamento ao leitor
- Sem listas (bullets ou numeração)
- Sem cabeçalhos dentro do corpo do post

**Estilo**
- Sem emojis — exceto bandeiras 🇺🇸 🇧🇷 se usar formato bilíngue
- Sem travessão (`—`). Usar vírgula ou ponto.
- Sem parênteses — **quebra a API do LinkedIn**
- Sem advérbios
- Voz ativa — sujeito humano fazendo algo
- Específico: datas reais, nomes, números reais. Sem declarações vagas.
- Tom: conversa de jantar, não press release

**Padrões stop-slop a eliminar**
- Abridores desnecessários ("Pois bem,", "Na verdade,", "Basicamente,")
- Contrastes binários ("Não é X, é Y" — dizer Y direto)
- Fragmentação dramática de uma frase para impacto — reescrever como frase completa
- Frases que soam como pull-quote — reescrever
- Voz passiva — encontrar o ator, torná-lo sujeito

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

IDs sequenciais. Sempre usar `Math.max(...q.map(x=>x.id)) + 1` para o próximo ID.

Status: `pending` | `published` | `failed_truncation`
