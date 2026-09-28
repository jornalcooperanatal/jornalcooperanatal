# Jornal Coopera Natal

Portal de notícias e serviços com painel administrativo separado, entrevistas com YouTube, diretório de cooperativas, links úteis, publicidade e estatísticas.

## Estrutura
- `public/index.html` — jornal público
- `public/editor-jcn.html` — editor administrativo (não existe link público para ele)
- `src/index.js` — API/Worker
- `schema.sql` — banco D1
- `seed.sql` — conteúdo inicial
- `wrangler.jsonc` — configuração Cloudflare

## 1. Subir para o GitHub
Crie um repositório vazio e envie todos estes arquivos.

## 2. Instalar dependências
```bash
npm install
```

## 3. Criar o D1
```bash
npx wrangler login
npx wrangler d1 create jornal-coopera-natal
```
Copie o `database_id` retornado e substitua `COLOQUE_AQUI_O_DATABASE_ID` em `wrangler.jsonc`.

## 4. Criar o R2
```bash
npx wrangler r2 bucket create jornal-coopera-natal-media
```

## 5. Criar as tabelas e dados iniciais
Use o ID/nome do banco configurado:
```bash
npx wrangler d1 execute jornal-coopera-natal --remote --file=./schema.sql
npx wrangler d1 execute jornal-coopera-natal --remote --file=./seed.sql
```

## 6. Definir login do editor
```bash
npx wrangler secret put ADMIN_USER
npx wrangler secret put ADMIN_PASSWORD
```
Digite os valores quando o Wrangler pedir. Não grave a senha no GitHub.

## 7. Publicar
```bash
npm run deploy
```

O Cloudflare entregará o endereço `*.workers.dev`. Depois você pode conectar um domínio próprio.

## 8. Acessar o editor
O painel NÃO aparece no site público.
Abra diretamente:
`https://SEU-ENDERECO/editor-jcn.html`

## Entrevistas com YouTube
No editor:
1. Crie uma matéria.
2. Em **Tipo**, selecione `Entrevista`.
3. Cole o link do YouTube no campo **Link do YouTube**.
4. Publique.

O vídeo será incorporado automaticamente dentro da matéria.

## Imagens
O upload do editor envia imagens para o bucket R2 e salva o endereço no banco.

## Estatísticas
O portal registra no D1:
- visualizações da página;
- aberturas de matérias/entrevistas;
- cliques em links úteis;
- cliques em cooperativas;
- cliques em anúncios.

## Segurança
- A página do editor não é linkada publicamente.
- Login e senha são Secrets do Cloudflare.
- O login cria sessão HTTP-only com validade de 8 horas.
- A API administrativa exige sessão válida.
- Não publique senha no repositório.


## Central de contato

O site público possui um formulário com:
- nome;
- e-mail;
- assunto;
- mensagem.

As mensagens são gravadas no D1 e aparecem no editor em **Caixa de entrada**.

No editor é possível:
- abrir a mensagem;
- marcar como lida;
- marcar como respondida;
- responder usando o programa de e-mail;
- excluir.

O usuário do painel já aparece preenchido como:
`jornal coopera`

A senha NÃO fica no GitHub. Cadastre-a com:
```bash
npx wrangler secret put ADMIN_PASSWORD
```

E cadastre o usuário com:
```bash
npx wrangler secret put ADMIN_USER
```

Valor do usuário:
`jornal coopera`

Depois de alterar o schema em um banco já criado, rode novamente:
```bash
npx wrangler d1 execute jornal-coopera-natal --remote --file=./schema.sql
```
