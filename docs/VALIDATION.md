# Validação executada — OMNIDEX

Data: **9 de novembro de 2026**. Ambiente: Windows, Node.js **26.4.0**, npm **11.17.0**, Vite **8.3.7**, Playwright **1.65.0** e **Chrome 156.0.8078.80** instalado. Não foram feitos testes em aparelhos físicos ou em Safari/Firefox.

## Regras e integridade

`npm test`: **19 testes passaram**, sem falhas. Cobertura de regras: acentos/caixa, aliases, IDs com zeros à esquerda, filtros combinados com favoritos, recuperação da listagem, opções derivadas, oito ordenações, fórmulas e valores ausentes, limite de dez, IDs inválidos/duplicados e armazenamento corrompido ou bloqueado. Oito testes de áudio cobrem inicialização por ação, MP3s locais, reaproveitamento do player, silêncio imediato, notas agendadas, persistência, cancelamento e suporte indisponível.

`npm run validate:data`: **passou**.

| Verificação                                             | Resultado                             |
| ------------------------------------------------------- | ------------------------------------- |
| Registros e IDs únicos                                  | 72, IDs de 1 a 72                     |
| Fórmulas verificadas contra `sourceStats`               | 72 registros                          |
| Associação ID/nome/caminho de capa aos manifestos       | 72                                    |
| Associações de galeria                                  | 560                                   |
| Arquivos visuais distintos existentes                   | 630 WebPs                             |
| SHA-256, dimensões e tamanho das galerias               | 560 conferidos                        |
| Perfis e relações demonstrativas válidas                | 3 perfis, 15 relações                 |
| Índice e galerias gerados equivalentes ao JSON completo | 72 registros + 72 arquivos de galeria |
| Identificação de aprimoramento por IA preservada        | 2 capas e 8 imagens de galeria        |

As 72 capas foram decodificadas e examinadas visualmente nas folhas de contato [1](cover-audit-01.png) e [2](cover-audit-02.png), cruzando formas e nomes com os manifestos. Os hashes confirmam integridade dos arquivos, não direitos de uso ou cânone.

## Navegador e interações

A entrega inicial passou **16 testes**, em aproximadamente **43 segundos**, cobrindo os fluxos abaixo. A revisão posterior de áudio, ativação, tema e comparação está documentada ao final desta página. O relatório da execução mais recente fica em `test-results/e2e-report.json`.

- Catálogo completo e pesquisa por `001`, nome português, nome original e aliases, inclusive sem acentos.
- Pesquisa junto a categoria e série, resultado vazio e limpeza dos filtros.
- Ordenação por ID, nome e os seis atributos.
- Omnitrix por anterior/próximo, setas do teclado e escolha em um card; ativação abre o mesmo alien.
- Modal com botão, Escape, foco inicial, contenção de foco e retorno ao botão abridor.
- Retorno ao campo de busca quando remover um favorito desmonta o card que abriu o modal.
- Ausência de requisição da galeria antes da abertura; arquivos e imagens da galeria aparecem no dossiê.
- Etiquetas individuais de arte aprimorada por IA e classificação não canônica.
- Favoritos, filtro de favoritos e seleção pessoal após recarregar a página.
- Adição de dez transformações, bloqueio da décima primeira e remoção.
- Operadores demonstrativos, IDs relacionados, contagem e carregamento de uma seleção de exemplo.
- Transformação aleatória dentro do conjunto filtrado e orientação para conjunto vazio.
- Layouts em **375 × 812**, **768 × 1024** e **1440 × 1000**, incluindo dossiê e operadores, sem transbordamento horizontal.
- Navegação por Tab e foco visível; transições/animações desativadas sob `prefers-reduced-motion`.
- Decodificação real dos **630 caminhos visuais distintos** no navegador.

Os testes observaram erros de execução, console, respostas locais HTTP >= 400 e falhas de requisições locais: **nenhum foi detectado**. Cancelamentos deliberados de carregamento ao desmontar o modal são tratados e não contam como imagens quebradas.

## Build e inspeção visual

`npm run check` executou testes de regras, validador e build: **passou**. O build revisado não apresentou erros nem aviso de chunk grande. JavaScript inicial produzido: aproximadamente **407,6 kB**, **104,7 kB gzip**. Isso é tamanho do artefato medido pelo build, não uma medição de tempo de carregamento real.

O build foi servido com `npm run preview -- --port 4173 --strictPort` e auditado por `scripts/browser-audit.mjs` em `http://127.0.0.1:4173/`. Foram novamente decodificadas as **630 imagens**, sem falhas de imagem, console ou requisições. Confira [browser-audit.json](browser-audit.json).

Capturas examinadas visualmente: [desktop](desktop.png), [catálogo desktop](desktop-catalog.png), [dossiê](desktop-dossier.png), [operadores](desktop-operators.png), [celular](mobile.png), [catálogo no celular](mobile-catalog.png) e [catálogo no tablet](tablet-catalog.png). A auditoria também conferiu **390 × 844** e **375 × 812** sem transbordamento horizontal. As capturas estáticas finais usam movimento reduzido para evitar registrar a animação de entrada pela metade.

## Limites desta validação

A validação não certifica acessibilidade integral, direitos de reutilização ou exatidão de todos os fatos da franquia. A autorização específica das artes permanece não confirmada; veja [CREDITS.md](../CREDITS.md). A confirmação de todos os nomes brasileiros e a tradução completa de poderes/fraquezas permanecem pendentes. Não houve publicação remota, envio ao Canvas, atribuição de participação à dupla ou criação de histórico de commits.

## Revisão posterior: áudio e Omnitrix clássico

**Suíte completa revisada: 32 de 32 testes de navegador passaram, em aproximadamente 2,7 minutos.** Em conjunto com os 19 testes unitários, são **51 testes aprovados**. A execução reúne os fluxos originais e as regressões novas:

- Reprodução efetiva dos MP3s de seleção e transformação no Chrome, sem iniciar áudio ao carregar a página.
- Um player reaproveitado ao girar/selecionar; silêncio e preferência após recarregar.
- Quatro fases da ativação, alien correto, foco contido e retorno ao controle de origem.
- Escape e botão para pular, sem timer residual reabrindo o dossiê.
- Movimento reduzido antes e durante a ativação; tamanho da imagem, nome e controles no celular.
- Tema claro sem inversão, preferência persistida e contraste **≥ 4,5:1 nos textos-chave medidos**, sem pretensão de certificar toda a interface.
- Empate de 3 a 3 preservado, somas acadêmicas separadas e duas séries de radar visualmente distinguíveis.
- Comparação por teclado, fechamento pelo backdrop e layouts de 375, 768 e 1440 px.
- Indicadores dos operadores derivados da quantidade real de IDs, com dez espaços.
- Canvas reage à mudança de preferência, para em visibilidade oculta e retoma; o teste de aba oculta usa estado/evento da Page Visibility API simulados de maneira determinística.

O resumo arquivado está em [test-summary.json](review/test-summary.json). O relatório completo reproduzível permanece em `test-results/e2e-report.json`.

Os dois MP3s foram examinados com ffprobe, decodificados com ffmpeg e conferidos por hash contra o snapshot da fonte. O Chrome de produção também leu as durações **0,294603 s** e **2,328 s**, abriu a sequência, revelou o dossiê de Chama e devolveu o foco ao controle de ativação após fechar, sem erro de execução ou console observado. Evidência: [production-audit.json](review/production-audit.json).

As capturas [carga](review/classic-charge.png), [revelação](review/classic-reveal.png), [celular](review/classic-mobile.png) e [tema claro](review/light-desktop.png) foram examinadas visualmente. A nova sequência mantém nome, alien e controle de pular dentro da tela. A animação foi criada em React/SVG/CSS; não utiliza vídeo extraído da série.

A descrição das correções, limitações e sugestões futuras está em [REVIEW-2026-11-09.md](REVIEW-2026-11-09.md). A origem oficial do master de áudio e sua licença específica de reutilização não foram confirmadas.
