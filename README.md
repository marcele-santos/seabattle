# Batalha Naval

MVP de um jogo de Batalha Naval para navegador, com lógica independente da interface.

## Requisitos
- Node.js 20+ (para executar os testes).
- Navegador moderno (para jogar).

## Executar localmente
Não há etapa de build nem dependências externas. Abra `index.html` no navegador ou inicie um servidor estático:

```bash
python3 -m http.server 8000
```

Acesse http://localhost:8000.

## Testes
```bash
npm test
```

## Regras do MVP
- Tabuleiro 8×8.
- Frota: 1 navio de 3 casas, 2 navios de 2 casas e 2 navios de 1 casa.
- Posicionamento manual do jogador; a frota adversária é posicionada automaticamente.
- Partidas por turnos contra um oponente controlado pelo computador.
- Cada ataque revela água ou acerto; vence quem destruir toda a frota adversária.
- Algumas casas de água concedem estrelas. Elas são bônus de pontuação e não alteram o resultado de um ataque.

## Arquitetura
- `src/game-engine.js`: regras puras, posicionamento e resolução de ataques.
- `src/game-state.js`: estado da partida e transições.
- `src/ui.js`: renderização e interação com o DOM.
- `src/main.js`: inicialização e ligação entre estado e interface.

A lógica do jogo não depende do DOM, facilitando futura integração com Telegram ou outro cliente. Integrações, contas e pagamentos estão fora do escopo deste MVP.

## Estado
Estrutura inicial funcional do MVP. Próximas etapas: validação manual no navegador, ajustes de UX e integração futura.
