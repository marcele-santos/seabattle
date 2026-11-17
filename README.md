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
- Estatísticas, precisão e recorde persistidos no armazenamento local do navegador. Não há sincronização entre dispositivos.

## Acessibilidade e responsividade
Controles nativos, foco visível, rótulos nas casas, mensagens anunciadas por leitores de tela e layout adaptável a telas estreitas.

## Publicação web
O workflow Deploy to GitHub Pages publica o site após push em main. Em Settings → Pages, selecione GitHub Actions como fonte de publicação. A URL final aparecerá no workflow e nas configurações do Pages após um deployment concluído. Repositórios privados podem exigir plano compatível com GitHub Pages.

## Telegram
A compatibilidade inicial permanece sem alterações nesta etapa. O cliente não autentica usuários; funcionalidades futuras com dados confiáveis exigirão validação de initData no servidor.
