# Batalha Naval

Jogo de Batalha Naval para navegador. O adaptador inicial para Telegram permanece no repositório, mas a integração está pausada.

## Execução local
Requer Node.js 20+ para testes e navegador moderno para jogar.

```bash
python3 -m http.server 8000
```
Acesse http://localhost:8000.

## Testes
```bash
npm test
npm run test:e2e
```

## Recursos e regras
- Tabuleiro 8×8; frota com navios de 3, 2, 2, 1 e 1 casas.
- Posicionamento manual, turnos alternados, vitória e derrota.
- Casas de água especiais concedem estrelas bônus.
- Fácil: ataques aleatórios. Normal: prioriza casas adjacentes após acerto. Difícil: usa adjacências e padrão de busca em casas alternadas.
- Pontuação: 100 por acerto, +50 por navio destruído, 25 por estrela e 500 pela vitória.
- Histórico de ataques, navios restantes e revanche.
- Estatísticas, precisão e recorde da partida permanecem no armazenamento local do navegador. O ranking online compartilhado fica disponível após configurar o Supabase; a identidade anônima é vinculada ao navegador.

## Acessibilidade e responsividade
Controles nativos, foco visível, rótulos nas casas, mensagens anunciadas por leitores de tela e layout adaptável a telas estreitas.

## Publicação e monitoramento
O workflow Deploy to GitHub Pages publica o site após push em main. O workflow Production monitor verifica, a cada seis horas e sob demanda, a página publicada, seus recursos estáticos e a resposta do ranking Supabase. Falhas geram uma execução com status de erro no GitHub Actions.

## Privacidade
Consulte [PRIVACY.md](./PRIVACY.md) para saber quais dados ficam no navegador e quais são enviados ao ranking. O ranking é público; não use informações pessoais como nome de exibição.

## Telegram
A integração permanece pausada. O cliente não autentica usuários via Telegram; funcionalidades futuras com dados confiáveis exigirão validação de initData no servidor.

## Ranking online
A implementação do backend, as migrações SQL e as Edge Functions estão em `supabase/`. Para configurar outro ambiente, siga [SUPABASE_SETUP.md](./SUPABASE_SETUP.md) e configure `src/online-config.js`. Sem configuração, o jogo continua funcionando offline.
