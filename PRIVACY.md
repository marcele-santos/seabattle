# Privacidade

Última atualização: 19 de novembro de 2026.

Esta página descreve os dados tratados pelo Batalha Naval na versão web.

## Dados armazenados no navegador

O jogo mantém no armazenamento local do navegador:
- estatísticas locais da pessoa jogadora (partidas, vitórias, derrotas, pontuação, tiros e acertos);
- preferência de som;
- sessão de autenticação anônima usada para acessar o ranking.

Esses dados não são sincronizados entre navegadores. Limpar os dados do site remove as estatísticas locais e a sessão salva naquele navegador.

## Dados do ranking online

Quando o ranking está disponível, o jogo cria uma identidade anônima no Supabase Auth. Não é solicitado e-mail, telefone ou senha. O backend mantém:
- nome público escolhido para o ranking;
- pontuação, quantidade de tiros, acertos e data do resultado;
- dados técnicos da partida necessários à validação, incluindo identificador, semente aleatória, usuário associado, criação, expiração, submissão ou abandono.

A sequência de ataques é enviada ao servidor para validação da vitória. O resultado persistido no ranking contém apenas as métricas listadas acima; a sequência de coordenadas não é armazenada na tabela de resultados.

O ranking é público. Nome de exibição, pontuação, tiros, acertos e data podem ser consultados por visitantes. Não use informações pessoais como nome de exibição.

## Prestadores de serviço

O site é hospedado pelo GitHub Pages. O ranking e a autenticação são operados pelo Supabase. Esses serviços recebem os dados técnicos necessários para entregar e proteger suas funcionalidades e podem processar registros operacionais conforme suas próprias políticas.

O jogo não possui publicidade nem ferramenta de analytics configurada nesta versão.

## Retenção e exclusão

As estatísticas locais permanecem no navegador até que sejam apagadas pelo usuário ou pelo navegador. Os resultados enviados ao ranking e os registros de autenticação permanecem no Supabase enquanto não forem removidos administrativamente.

Atualmente, o jogo não oferece uma função de autoatendimento para apagar a identidade anônima ou os resultados já enviados. Apagar os dados do navegador encerra o acesso local à sessão, mas não apaga registros já armazenados no backend.

## Uso por menores e alterações

Responsáveis devem supervisionar o uso por crianças. Esta página pode ser atualizada quando o tratamento de dados ou os serviços utilizados mudarem.
