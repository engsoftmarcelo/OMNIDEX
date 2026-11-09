# 🟢 OMNIDEX — Central de Transformações

### Atividade 03 — Pokédex com React + Vite (adaptação temática: Ben 10)

Aplicação web feita com **React + Vite** para exibir, pesquisar, filtrar e explorar **72 transformações do universo Ben 10**. A proposta adapta Pokémon para transformações, tipos para categorias de habilidades e treinadores para operadores demonstrativos e suas seleções.

As diferenças em relação ao enunciado original estão documentadas abaixo. Esta adaptação não representa confirmação de autorização docente da mudança nem de atendimento literal ao enunciado original.

![Tela inicial do OMNIDEX](docs/desktop.png)

## 👥 Integrantes

| Dupla (Pair Programming)         |
| -------------------------------- |
| Marcelo Gomes de Oliveira Junior |
| Victor Cândido Leite             |

A atividade prevê **Pair Programming** e **ambos os integrantes devem entregar o link do repositório no Canvas**. Os nomes acima são a identificação informada para a entrega; não há atribuição individual de contribuições neste documento.

---

## 📦 Como instalar as dependências

Requisitos: **Node.js 22.12 ou superior** e npm.

```bash
npm install
```

## ▶️ Como executar o projeto

```bash
npm run dev
```

## 🌐 Endereço no navegador

Abra **http://127.0.0.1:5173/** (endereço padrão do Vite). Se a porta 5173 estiver ocupada, o Vite escolhe outra e mostra o endereço correto no terminal, na linha `Local:`.

Para gerar e conferir a versão de produção:

```bash
npm run build
```

```bash
npm run preview
```

O preview costuma abrir em `http://127.0.0.1:4173/`.

## 📁 Onde estão os dados

| O quê                                | Onde                             |
| ------------------------------------ | -------------------------------- |
| Dados completos da aplicação         | **`src/data/pokedex-data.json`** |
| Índice leve gerado a partir do JSON  | `src/data/catalog-index.json`    |
| Operadores e suas relações           | `src/components/Operators.jsx`   |
| Imagens das transformações (capas)   | `public/images/aliens/`          |
| Imagens das galerias dos dossiês     | `public/images/gallery/`         |
| Metadados das galerias (sob demanda) | `public/data/galleries/`         |
| Efeitos sonoros                      | `public/audio/`                  |

O nome `pokedex-data.json` foi preservado como arquivo citado na entrega; seu conteúdo foi adaptado para Ben 10. Cada registro tem `id`, `name`, `originalName`, `aliases`, `categories` (as categorias de habilidades), `series`, `stats` (os seis atributos) e `sourceStats` (as avaliações originais). Também inclui espécie, planeta, poderes, fraquezas, descrição, capa, galeria, fontes e identificação de conteúdo não canônico ou aprimorado por IA.

São **72 associações de capa, 560 imagens de galeria e 630 arquivos visuais distintos**. Duas capas reutilizam imagens das próprias galerias; as associações e condições identificadas estão em [CREDITS.md](CREDITS.md) e no [manifesto das imagens](public/images/source-manifest.json).

O índice e os arquivos de galeria são gerados automaticamente pelo script `scripts/prepare-runtime-data.mjs`, que roda antes de `npm run dev` e `npm run build`. As galerias são lidas com `fetch()` de JSONs estáticos locais, quando o dossiê abre. **Não há banco de dados, backend, API externa, login ou chave de acesso**.

## 🧩 Como o projeto está organizado

```text
omnidex/
├── public/
│   ├── images/                 capas e galerias das transformações
│   ├── data/galleries/         JSONs de galeria carregados sob demanda
│   ├── audio/                  efeitos sonoros e manifesto de origem
│   └── licenses/               licenças das fontes tipográficas
│
├── src/
│   ├── components/
│   │   ├── AlienCard.jsx           card: ID, nome, categorias e seis atributos
│   │   ├── AlienDetails.jsx        detalhes em modal, com radar e galeria
│   │   ├── OmnitrixSelector.jsx    seletor do Omnitrix (anterior/próximo/ativar)
│   │   ├── OmniDevice.jsx          dispositivo em SVG (anel, núcleo e emblema)
│   │   ├── IntroSequence.jsx       abertura: queda do meteoro e cratera
│   │   ├── TransformFlash.jsx      sequência de transformação
│   │   ├── GalaxyMap.jsx           mapa dos locais de origem cadastrados
│   │   ├── EraTimeline.jsx         linha do tempo das séries
│   │   ├── CategoryWeather.jsx     clima do fundo por categoria (canvas)
│   │   ├── OmniCursor.jsx          mira que acompanha o cursor
│   │   ├── CompareDock.jsx         doca das transformações em comparação
│   │   ├── CompareDialog.jsx       comparação lado a lado
│   │   ├── StatRadar.jsx           radar dos seis atributos (SVG)
│   │   ├── Operators.jsx           operadores (treinadores) e seleção pessoal
│   │   ├── Starfield.jsx           fundo de estrelas em canvas
│   │   └── Icon.jsx                ícones SVG
│   │
│   ├── css/
│   │   ├── base.css                tema, tipografia, cabeçalho e seletor
│   │   ├── catalog.css             pesquisa, filtros e cards
│   │   ├── details.css             detalhes e operadores
│   │   ├── wow.css                 animações, comparação e radar
│   │   ├── omnitrix.css            sequência de transformação
│   │   ├── themes.css              tema claro
│   │   ├── comic.css               acabamento de quadrinhos (retícula e contornos)
│   │   ├── intro.css               abertura e animações do dispositivo
│   │   └── universe.css            mapa, linha do tempo, captura e energia
│   │
│   ├── data/
│   │   ├── pokedex-data.json       dados da aplicação
│   │   └── catalog-index.json      índice gerado
│   │
│   ├── utils/
│   │   ├── catalog.js              pesquisa, filtros, ordenação e fórmulas
│   │   ├── storage.js              favoritos e seleção no localStorage
│   │   ├── sound.js                efeitos sonoros
│   │   ├── intro.js                regras e tempos da abertura
│   │   ├── omni.js                 captura, formas Ultimate, origens, eras e falhas
│   │   └── theme.js                cores por categoria, soma e movimento reduzido
│   │
│   ├── App.jsx                     estados e composição da aplicação
│   └── main.jsx                    ponto de entrada
│
├── scripts/                        preparo e validação dos dados
├── tests/                          testes unitários e de navegador
├── docs/                           capturas de tela e auditorias
├── package.json
├── vite.config.js
├── CREDITS.md
└── README.md
```

Composição principal (cabeçalho, pesquisa e rodapé são JSX do `App`, sem componentes separados):

```text
App
 ├── IntroSequence → OmniDevice (quando a abertura está habilitada)
 ├── Starfield
 ├── CategoryWeather e OmniCursor
 ├── <header> (navegação, som e tema)
 ├── <main> (vista escolhida)
 │    ├── Vista do catálogo (JSX do App)
 │    │    ├── OmnitrixSelector → OmniDevice
 │    │    ├── EraTimeline
 │    │    ├── Pesquisa, filtros e ordenação (JSX do App)
 │    │    └── AlienCard × resultados
 │    ├── Operators
 │    └── GalaxyMap
 ├── <footer>
 ├── CompareDock (se houver registros escolhidos)
 ├── CompareDialog → StatRadar (quando aberto)
 ├── TransformFlash (durante a ativação)
 └── AlienDetails → StatRadar (quando aberto)
```

---

## 🔁 Da Pokédex para o OMNIDEX

| Requisito original                                  | Adaptação para Ben 10                                                      |
| --------------------------------------------------- | -------------------------------------------------------------------------- |
| Pokémon                                             | Transformações (aliens)                                                    |
| Tipo ou tipos                                       | Categorias de habilidade (Fogo, Velocidade, Força, Gelo…)                  |
| HP, Attack, Defense, Sp. Attack, Sp. Defense, Speed | Seis campos preservados, com pontuações acadêmicas de 0 a 100              |
| Treinadores                                         | Operadores do Omnitrix (Atlas, Vega e Íon)                                 |
| Quantidade de insígnias                             | Quantidade de transformações na seleção, ilustrada por espaços preenchidos |
| Pokémon do treinador                                | Transformações relacionadas a cada operador                                |
| `pokedex-data.json`                                 | Nome preservado em `src/data/`, com dados das transformações               |

## ✅ Funcionalidades da adaptação

| Funcionalidade                                 | Implementação                                                                                                                     |
| ---------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| React + Vite                                   | React 19 e Vite 8, em JavaScript/JSX                                                                                              |
| Exibir os itens do arquivo de dados            | Grade com as 72 transformações                                                                                                    |
| ID, nome, categorias e seis atributos por item | Presentes em cada card, com minibarras de atributo                                                                                |
| Pesquisa por nome ou ID                        | Atualiza enquanto o usuário digita; aceita `001`, nome, apelidos, sem diferenciar acentos ou caixa                                |
| Filtro por categoria de habilidade             | Seletor com opções obtidas dos dados; combina pesquisa, série, favoritos e filtro de planeta                                      |
| Detalhes do item                               | Dossiê em modal com ID, nomes, categorias, seis atributos em barras e radar, poderes, fraquezas, galeria e fontes                 |
| Área equivalente à consulta de treinadores     | Seção **Operadores**: perfis demonstrativos, quantidade de transformações e relações por IDs; seleção pessoal editável de até dez |
| Nenhum item encontrado                         | Mensagem de lista vazia com botão para limpar os filtros                                                                          |
| Interface responsiva                           | Layout para smartphone, tablet e desktop                                                                                          |
| Identidade visual própria                      | Tema Omnitrix em preto e verde, cores por categoria, animações e sons                                                             |

## 🏆 Desafios opcionais

| Desafio                    | Situação                                                                 |
| -------------------------- | ------------------------------------------------------------------------ |
| ⭐ Favoritos               | ✅ Marcação por card, filtro de favoritos e persistência no navegador    |
| ⚔️ Comparação              | ✅ **Arena de DNA**: duas transformações lado a lado, com barras e radar |
| 📊 Ordenação               | ✅ Por ID, nome e cada um dos seis atributos                             |
| 🎲 Aleatório               | ✅ Botão **Transformação aleatória**, que respeita os filtros ativos     |
| 🌙 Dark Mode               | ✅ Alternância entre tema escuro e claro, salva no navegador             |
| 📱 Responsividade avançada | ✅ Desktop, tablet e smartphone                                          |
| 🌐 API externa             | ❌ Não utilizada (ver abaixo)                                            |

Além disso:

- **Abertura animada**: um meteoro verde cai do céu, abre uma cratera e revela o dispositivo. Ela espera um toque para começar, dura 5,5 segundos após esse toque, pode ser pulada com o botão ou com Esc e aparece uma vez por sessão. Com “reduzir movimento” ativado, a página abre direto. Para rever, acrescente `?intro=1` ao endereço; para suprimir, `?intro=0`. Navegadores identificados como automação também pulam a abertura, salvo quando usam `?intro=1`.
- **Dispositivo interativo**: o seletor usa um SVG local implementado em `OmniDevice.jsx`. O anel gira a cada troca, dá para arrastar o mostrador para os lados, e o núcleo afunda e salta quando é apertado para ativar a transformação.
- Sequência animada de transformação, efeitos sonoros com botão de silenciar e seleção pessoal de até dez transformações.

### 🛸 Mecânicas do universo

Essas interações são convenções da aplicação. Consultam o catálogo local e regras em `src/utils/omni.js`; tempos, probabilidade de falha, posições do mapa e efeitos visuais não são dados oficiais da franquia.

| Mecânica                    | Como funciona                                                                                                                                                                                                                                                                      |
| --------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ⏳ Tempo esgotado           | Ao **ativar** uma transformação, o dossiê ganha uma barra de energia de 45 s. Nos últimos 10 s ela pisca em vermelho com bipes; ao zerar, o dossiê fecha e o relógio recarrega por 8 s. Há um botão para pausar a contagem. Dossiês abertos pelo card não têm contagem.            |
| 🎲 Transformação errada     | Cada ativação tem probabilidade de 1/8 de sortear outro alien do conjunto atualmente filtrado, quando há outro registro disponível. Um aviso informa o pedido e o resultado. Não é uma sequência garantida de uma falha a cada oito tentativas.                                    |
| 🧬 Captura de DNA           | Um contador mostra quantos dos 72 dossiês já foram abertos. O botão **Modo captura de DNA** (desligado por padrão) esconde como silhueta o que ainda não foi escaneado; abrir o dossiê coleta o DNA.                                                                               |
| 🪐 Mapa da galáxia          | Aba **Galáxia**: os 43 locais de origem cadastrados no campo `planet` viram pontos de um mapa. Há planetas e outras localidades, como Cosmic Storms e Forge of Creation. Selecionar uma origem mostra seus registros e permite filtrar o catálogo. As posições são ilustrativas.   |
| 📅 Linha do tempo           | As quatro séries clássicas aparecem em ordem de estreia. Escolher uma era usa o mesmo estado do filtro de série e muda a cor de destaque. O seletor de séries também inclui “Não informado” para registros sem série confirmada.                                                   |
| 🌳 Formas comuns e Ultimate | A seção chamada “Árvore de evolução” encontra nove pares pelo padrão dos nomes originais `X` e `Ultimate X`. Mostra as formas, diferenças dos atributos e navegação entre elas. Essa ligação é uma regra de organização dos registros; não documenta uma árvore evolutiva oficial. |
| 🎯 Mira no cursor           | No desktop, um anel acompanha o mouse e fecha sobre itens clicáveis. O cursor do sistema continua visível.                                                                                                                                                                         |
| 🌦️ Clima por categoria      | O fundo reage ao alien selecionado: brasas para fogo, neve para gelo, raios para eletricidade, bolhas para água, folhas, rastros de velocidade e poeira estelar.                                                                                                                   |

O **dossiê** também apresenta a soma dos seis atributos (rotulada “poder total”), maior e menor pontuação (rotuladas “ponto forte” e “ponto fraco”), posição em cada atributo entre os 72 registros, navegação anterior/próximo e selo de DNA coletado. Esses indicadores são derivados das avaliações acadêmicas; o menor atributo não substitui as fraquezas descritivas da fonte. A comparação mantém a contagem de atributos maiores separada da soma e não simula um combate.

A captura fica salva no navegador (`localStorage`). Tempo esgotado e transformação errada ficam **ligados por padrão**. No endereço, `?chaos=0` desliga essas duas mecânicas e `?chaos=1` as liga explicitamente. Os testes gerais usam `?chaos=0`; os cenários específicos das mecânicas usam `?chaos=1`. Com “reduzir movimento” ativado, o clima e a mira não aparecem.

## ⚛️ Conceitos de React utilizados

- **Componentes funcionais**: todos os componentes de `src/components/` e o `App.jsx`.
- **Props**: dados e funções passam do `App` para os componentes (por exemplo, `alien`, `isFavorite` e `onOpenDetails` no `AlienCard`).
- **`useState`**: pesquisa, filtros, ordenação, favoritos, seleção, transformação ativa, dossiê aberto, comparação, som e tema.
- **Listas com `map()`**: cards, opções de filtro, atributos, operadores e galerias usam chaves para identificar os itens.
- **Eventos**: `onChange` na pesquisa, `onClick` nos botões, `onKeyDown` no seletor e eventos de ponteiro nos cards.
- **Filtragem de dados**: funções puras em `src/utils/catalog.js`.
- **Estados derivados**: a lista filtrada e ordenada é calculada a cada renderização a partir dos estados, sem ser copiada para outro estado.
- **`useEffect`**: salva favoritos, seleção e tema, controla a abertura dos diálogos e carrega a galeria quando um dossiê é aberto.
- **Outros hooks**: `useRef` (foco e elementos de diálogo) e `useCallback`.
- **Reutilização**: `Icon`, `StatRadar` e `AlienCard` são usados em vários pontos da interface.

## 🔑 Dependências

Todas estão registradas no `package.json`.

| Pacote                                           | Uso                                    |
| ------------------------------------------------ | -------------------------------------- |
| `react`, `react-dom`                             | Interface                              |
| `@fontsource/inter`, `@fontsource/space-grotesk` | Fontes tipográficas locais             |
| `vite`, `@vitejs/plugin-react`                   | Servidor de desenvolvimento e build    |
| `@playwright/test`                               | Testes de navegador (desenvolvimento)  |
| `prettier`                                       | Formatação do código (desenvolvimento) |

Não há biblioteca adicional de componentes, ícones, gráficos ou animação: ícones e radar são SVG implementados no projeto; as animações usam CSS e, nos fundos e na mira, JavaScript com `requestAnimationFrame`/canvas.

## 🌐 API externa

**Nenhuma API externa é consumida.** Depois da instalação das dependências, os dados, imagens, fontes e sons são servidos localmente. Mantenha `npm run dev` ou `npm run preview` em execução; abrir o `index.html` diretamente como arquivo não substitui o servidor Vite.

## 🖼️ Fontes dos dados, imagens e sons

- **Dados e imagens**: importados do projeto de fãs [Omnipedia, de Prabhmannat Singh](https://github.com/PRABHMANNAT/Ben-10-Omnitrix-Database), no commit `8d9c4cad125a812d41c6322a1b133217a75d7f7a`, e salvos localmente. As origens de cada imagem estão em `public/images/source-manifest.json`.
- **Sons**: dois efeitos curtos (giro do seletor e transformação) vindos do repositório [Omnitrix-Simulator](https://github.com/fabi0casa/Omnitrix-Simulator); os demais sons são gerados pela Web Audio API. Detalhes em `public/audio/sources.json`.
- **Os seis atributos**: a base original traz avaliações de fãs (`strength`, `durability`, `power`, `intelligence`, `speed`, de 0 a 100). Os valores originais ficam em `sourceStats`; esta adaptação calcula os seis campos assim:

| Atributo        | Fórmula                                  |
| --------------- | ---------------------------------------- |
| HP              | `round((durability + strength) / 2)`     |
| Ataque          | `round(strength)`                        |
| Defesa          | `round(durability)`                      |
| Ataque Especial | `round(power)`                           |
| Defesa Especial | `round((durability + intelligence) / 2)` |
| Velocidade      | `round(speed)`                           |

> ⚠️ **Direitos de uso**: Ben 10 pertence aos seus titulares. As artes e os sons vêm de fontes públicas de fãs e **não têm licença de redistribuição confirmada**. Crédito, acesso público e finalidade acadêmica não equivalem a autorização de reutilização. Os atributos são uma convenção do projeto, sem equivalência oficial com Pokémon ou Ben 10. Atlas, Vega e Íon são perfis demonstrativos criados para a atividade, sem atribuição de transformações canônicas. Fontes, condições e pendências estão em [CREDITS.md](CREDITS.md).

## 📸 Imagens da aplicação

Capturas de referência de versões do projeto; não constituem, por si só, validação das funcionalidades adicionadas depois delas.

| Catálogo                              | Dossiê                              |
| ------------------------------------- | ----------------------------------- |
| ![Catálogo](docs/desktop-catalog.png) | ![Dossiê](docs/desktop-dossier.png) |

| Transformação                                    | Smartphone                     |
| ------------------------------------------------ | ------------------------------ |
| ![Transformação](docs/review/classic-reveal.png) | ![Smartphone](docs/mobile.png) |

## 🧪 Como validar

Para atualizar o repositório já configurado, consulte o [passo a passo manual para o GitHub](docs/GUIA-GITHUB.md).

Conferência em **09/11/2026**: **30 testes unitários e 45 testes de navegador passaram**, além da validação dos 72 registros, 630 imagens e do build. A interface foi conferida no Chrome em 375, 768 e 1440 px. A instalação por `npm ci`, os testes unitários, o validador e o build também passaram em uma cópia limpa dos arquivos candidatos ao envio, sem aproveitar `node_modules` ou arquivos ignorados.

```bash
npm run check
```

`npm run check` executa testes unitários, validação dos dados e build; não inclui os testes de navegador. Para executar cada verificação separadamente:

```bash
npm test
npm run validate:data
npm run build
```

Os testes de navegador usam Playwright com o **Google Chrome instalado**, por padrão:

```bash
npm run test:e2e
```

O Playwright inicia o servidor em `http://127.0.0.1:5173/` ou reutiliza um servidor nessa porta. Se ele já estiver rodando, confira que pertence a esta cópia do projeto. Quem preferir o Chromium gerenciado pelo Playwright pode instalá-lo com `npx playwright install chromium` e executar no PowerShell:

```powershell
$env:PLAYWRIGHT_CHANNEL = "chromium"
npm run test:e2e
Remove-Item Env:PLAYWRIGHT_CHANNEL
```

As suítes ficam em `tests/e2e/`: catálogo, tema/comparação, ativação, abertura, movimento reduzido e mecânicas do universo. Os testes gerais desativam as falhas pela URL `?chaos=0`; os cenários de energia e transformação errada usam `?chaos=1`, sorteio controlado e relógio virtual. A abertura tem cenários com `?intro=1`, pois é pulada normalmente sob automação. Ter arquivos de teste no repositório não comprova que a versão atual passou: execute os comandos e consulte o resultado da execução. Relatórios em `test-results/` são locais e ignorados pelo Git.

## Limitações e pendências

- A confirmação dos direitos para redistribuir publicamente imagens e sons continua pendente; consulte [CREDITS.md](CREDITS.md) antes de publicar esses arquivos.
- A referência não declara licença do código da Omnipedia. Este projeto tem componentes, estilos e lógica locais; não presuma licença daquela aplicação nem permissão automática sobre os dados e mídias consultados.
- Poderes e fraquezas mantêm, em geral, os termos em inglês da referência de fãs. Informações ausentes usam “Não informado”; não houve auditoria completa dos episódios. Conceitos não canônicos, formas Ultimate e imagens identificadas como aprimoradas por IA conservam suas distinções nos registros.
- Favoritos, seleção, captura, tema e preferência sonora dependem do armazenamento deste navegador/origem. Não há sincronização entre dispositivos; a abertura usa `sessionStorage` e pode reaparecer se esse armazenamento estiver indisponível.
- Animações, mapa, probabilidade de falha, energia, recarga e indicadores derivados são recursos demonstrativos. Para reproduzir uma apresentação ou um teste, confira as opções `intro` e `chaos` descritas acima; os testes gerais desativam explicitamente as falhas e a abertura é normalmente pulada sob automação.
- A equivalência com o enunciado original e a aceitação da mudança temática precisam ser tratadas na disciplina; este README não registra aprovação docente nem histórico de participação ou entrega.
