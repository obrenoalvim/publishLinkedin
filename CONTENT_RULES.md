# Gerar posts para o LinkedIn Queue

## Fluxo obrigatorio (ordem exata)

1. **Checar queue atual**
   ```bash
   node -e "const q=require('./queue.json'); console.log(q.length, 'posts, last ID:', Math.max(...q.map(x=>x.id))); q.slice(-10).forEach(x=>console.log(x.id, '|', x.title))"
   ```

2. **Definir topicos** — verificar duplicatas antes de confirmar. Se tema ja existe na fila, descartar a nao ser que o angulo seja muito diferente.

3. **Registrar swarm Ruflo** (obrigatorio mesmo que execute falhe)
   ```
   ToolSearch → mcp__ruflo__swarm_init, mcp__ruflo__agent_spawn
   swarm_init topology=star, maxAgents=N
   agent_spawn um por post (paralelo)
   ```
   > `agent_execute` requer `ANTHROPIC_API_KEY` no env. Se falhar, gerar os posts diretamente — o registro do swarm ja foi feito.

4. **Gerar os textos** — um por um ou em paralelo via Agent tool nativo se Ruflo execute nao funcionar.

5. **Aplicar `/stop-slop`** em cada post. Score minimo: **35/50**. Corrigir e repassar ate atingir.

6. **Verificar contagem de caracteres**
   ```js
   [...body].length < 4000  // Unicode, nao bytes
   ```
   Se passar, cortar paragrafos do meio preservando: abertura + pergunta de engajamento + hashtags.

7. **Escrever no queue.json** via script Node.js separado (evitar template literals com aspas no shell).

8. **Commit e push**
   ```bash
   git add queue.json
   git commit -m "feat: add N new LinkedIn posts (IDs X-Y)"
   git push
   ```
   Em caso de conflito, resolver antes do push.

---

## Formato dos posts (seguir exatamente)

```
🇺🇸 [corpo EN — 3-4 paragrafos]

---

🇧🇷 [corpo PT — mesma mensagem em portugues natural]

#HashtagPT1 #HashtagPT2 #HashtagPT3 #HashtagPT4 #Brasil
#HashtagEN1 #HashtagEN2 #HashtagEN3 #HashtagEN4 #Software
```

**Hashtags — estrategia de alcance**

Alem das hashtags especificas do tema, incluir 2-3 tags gerais de alto volume para ampliar alcance. Escolher tags relacionadas ao universo do post (tecnologia, carreira, negocios) — nao precisa ser sobre o tema exato, mas nao pode ser completamente fora do contexto.

Tags gerais recomendadas (usar conforme pertinencia):
- `#Tecnologia` `#Inovacao` `#Carreira` `#Lideranca` `#Gestao`
- `#DesenvolvimentoProfissional` `#Mercado` `#Negocios` `#Empreendedorismo`
- `#Technology` `#Innovation` `#Career` `#Leadership` `#Business`
- `#SoftwareEngineering` `#ProductManagement` `#Entrepreneurship`

Exemplo para post de historia da tecnologia: adicionar `#Carreira` e `#Inovacao` mesmo que o post seja sobre um compilador dos anos 50 — o publico de carreira em tech se interessa pelo tema.

---

## Regras de conteudo

**Voz e estilo**
- Sem emojis, exceto as bandeiras 🇺🇸 🇧🇷
- Sem travessao (`—`). Usar virgula ou ponto.
- Sem listas (bullets, numeracao)
- Sem adverbios
- Voz ativa — sujeito humano fazendo algo
- Especifico: datas, nomes, numeros reais. Sem declaracoes vagas.
- Finalizar com pergunta de engajamento ao leitor
- Tom: conversa em jantar, nao press release

**Temas permitidos**
- Historia da tecnologia, engenharia de software, decisoes de produto, cultura de dev
- B2C — falar com o usuario final/profissional, nao com equipes de vendas

**Temas proibidos**
- Cold call, ligacoes, chamadas de video, prospeccao ativa

**Stop-slop: padroes a eliminar**
- Abridores de frase desnecessarios ("Pois bem", "Na verdade")
- Contrastes binarios ("Nao e X, e Y" — dizer Y direto)
- Fragmentacao dramatica (frase de uma palavra para impacto)
- Frases que soam como pull-quote — reescrever
- Voz passiva — encontrar o ator, torna-lo sujeito

---

## Estrutura do queue.json

Cada entrada:
```json
{
  "id": 482,
  "title": "Titulo descritivo em PT",
  "status": "pending",
  "body": "🇺🇸 ...\n\n---\n\n🇧🇷 ...\n\n#hashtags"
}
```

IDs sao sequenciais. Sempre pegar `Math.max(...q.map(x=>x.id))` para saber o proximo.
