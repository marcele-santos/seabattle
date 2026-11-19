# Backend online (etapa 13)

O site continua hospedado no GitHub Pages. O Supabase fornece identidade anônima por navegador, partidas emitidas pelo servidor e ranking compartilhado.

## 1. Criar o projeto

1. Crie um projeto no Supabase.
2. Em **Authentication → Providers → Anonymous**, habilite sign-ins anônimos.
3. Em **SQL Editor**, execute o conteúdo de `supabase/migrations/20261119000000_online_leaderboard.sql`.
4. Faça deploy das funções `create-match` e `submit-score`:
   ```sh
   supabase functions deploy create-match --no-verify-jwt
   supabase functions deploy submit-score --no-verify-jwt
   ```
5. Configure os secrets das Edge Functions (o Supabase normalmente já injeta os três):
   ```sh
   supabase secrets set SUPABASE_URL="https://SEU-PROJETO.supabase.co" SUPABASE_ANON_KEY="SUA_CHAVE_PUBLICA" SUPABASE_SERVICE_ROLE_KEY="SUA_CHAVE_SERVICE_ROLE"
   ```
6. Copie a Project URL e a publishable/anon key para `src/online-config.js`. **Nunca** coloque a service-role key nesse arquivo.
7. Faça commit e push. O workflow atual publica normalmente no GitHub Pages.

## 2. O que fica protegido

- O navegador recebe apenas a chave pública e uma sessão anônima individual.
- A tabela de partidas e resultados não aceita leitura ou escrita direta por usuários.
- O servidor emite a semente aleatória de cada partida; o navegador não escolhe a semente.
- O envio contém somente a sequência de coordenadas atacadas. A Edge Function recria a frota e as estrelas a partir da semente privada no banco, recalcula acertos, navios destruídos e pontuação e rejeita partidas incompletas, coordenadas inválidas, tiros repetidos, partidas expiradas ou já enviadas.
- A função SQL finaliza cada partida sob bloqueio transacional, impedindo submissões concorrentes.
- O ranking público expõe apenas nome, pontuação, tiros, acertos e data; não expõe IDs de usuário nem dados de autenticação.

## 3. Identidade e limites

A identidade anônima é persistida no navegador. Ela permite ranking compartilhado entre jogadores, mas **não é recuperável em outro dispositivo** se os dados do navegador forem apagados. Login com provedor (Google/Apple) e recuperação de conta ficam para uma etapa posterior. O jogo permanece funcional offline se a configuração Supabase estiver vazia ou indisponível.

## 4. Testes locais

```sh
npm test
```

Os testes incluem replay válido e rejeição de submissões inválidas. O teste E2E do jogo continua sem depender de credenciais externas.
