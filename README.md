# Batalha Naval

MVP de um jogo de Batalha Naval para navegador, com lógica independente da interface e inicialização compatível com Telegram Mini Apps.

## Requisitos
- Node.js 20+ (para executar os testes).
- Navegador moderno (para jogar).

## Executar localmente
Não há etapa de build nem dependências externas de runtime. Abra `index.html` no navegador ou inicie um servidor estático:

```bash
python3 -m http.server 8000
```

Acesse http://localhost:8000.

## Testes
```bash
npm test
npm run test:e2e
```

## Regras do MVP
- Tabuleiro 8×8.
- Frota: 1 navio de 3 casas, 2 navios de 2 casas e 2 navios de 1 casa.
- Posicionamento manual do jogador; a frota adversária é posicionada automaticamente.
- Partidas por turnos contra um oponente controlado pelo computador.
- Cada ataque revela água ou acerto; vence quem destruir toda a frota adversária.
- Algumas casas de água concedem estrelas. Elas são bônus de pontuação e não alteram o resultado de um ataque.

## Integração Telegram Mini App
- O SDK oficial do Telegram é carregado antes do módulo principal.
- `src/telegram-webapp.js` detecta o ambiente Telegram, chama `ready()` e `expand()` e mantém o jogo funcional em navegador comum.
- O módulo não expõe nem transmite `initData` ou dados pessoais do usuário.
- Para abrir o jogo dentro do Telegram, publique o site em HTTPS e configure a URL como Mini App em um bot pelo BotFather.
- A inicialização no cliente **não autentica o usuário**. Antes de adicionar placares, partidas online, recompensas ou qualquer dado confiável, será necessário um backend que valide `Telegram.WebApp.initData` no servidor. Nunca confie em dados de usuário enviados apenas pelo cliente.

## Arquitetura
- `src/game-engine.js`: regras puras, posicionamento e resolução de ataques.
- `src/game-state.js`: estado da partida e transições.
- `src/telegram-webapp.js`: adaptação opcional ao ambiente Telegram.
- `src/ui.js`: renderização e interação com o DOM.
- `src/main.js`: inicialização e ligação entre estado e interface.

## Estado
MVP web com adaptador inicial para Telegram Mini Apps. Bot, backend, autenticação, partidas multiplayer e persistência ainda não estão implementados.
