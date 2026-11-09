# Auditoria da importação

Data: **09/11/2026**. Repositório: [PRABHMANNAT/Ben-10-Omnitrix-Database](https://github.com/PRABHMANNAT/Ben-10-Omnitrix-Database), commit **8d9c4cad125a812d41c6322a1b133217a75d7f7a**.

## Estrutura atual conferida

| Arquivo da referência | Estrutura efetivamente encontrada |
| --- | --- |
| `src/data/aliens.js` | Array literal JSON em módulo JS, 72 objetos; IDs numéricos únicos de 1 a 72. Não foi executado o módulo; somente seu literal JSON foi lido. |
| `src/data/artwork.json` | Objeto de ID → caminho local. 70 capas com extensão `.png`, mas bytes WebP, e 2 referências a WebPs já usados nas galerias. As extensões das 70 capas foram corrigidas localmente para `.webp`, sem recodificar ou alterar os bytes. |
| `src/data/galleries.json` | Objeto de ID → `{ name, conceptOnly, images }`; 72 associações e 560 imagens com dimensões, página de origem, página do arquivo, crédito, bytes e SHA-256. |
| `public/aliens/sources.json` | Objeto de ID → nome, página e URL original da capa. Conceitos 70/71 também contêm `canonical: false`, `enhanced: true` e crédito a Perkins. |
| `public/aliens/`, `public/gallery/` | Caminhos indicados nos manifestos foram baixados do commit fixado; 630 arquivos visuais distintos na entrega. |

`aliens.js` contém `strength`, `durability`, `power`, `intelligence` e `speed`, em escala **0–100** para todos os 72 registros. Há outras avaliações (`agility`, `utility`, `stealth`, `range`, `overall`); foram preservadas em `sourceStats`, sem serem convertidas em atributos adicionais da atividade. Nenhum atributo exigido precisou de um valor aleatório ou de preenchimento fictício.

Séries encontradas na base: `Original Series`, `Alien Force`, `Ultimate Alien`, `Omniverse`. Os metadados de série foram preservados em `sourceSeries`, mesmo quando a exibição precisou ser corrigida. Não se completaram aparições de um alien com base na série de uma imagem da galeria.

## Adaptação e fidelidade

- A aplicação usa `src/data/pokedex-data.json`, apesar do conteúdo adaptado para Ben 10. IDs originais preservados; slug derivado do nome original apenas como identificador adicional.
- Categorias são adaptação editorial rastreável: `classification` fornece a categoria ampla (`Tech` → Tecnologia, `Tank` → Resistência etc.) e tags explícitas acrescentam temas (`FIRE` → Fogo, `SONIC` → Som, `AQUATIC` → Água etc.). A tabela exata está em `scripts/import-data.mjs`. Não são tipos oficiais de Ben 10.
- Descrições são resumos novos em português dos temas factuais; não se copiou a redação completa dos dossiês da referência.
- Poderes e fraquezas preservam em geral as expressões inglesas da referência; essa decisão evita traduções improvisadas de termos. Sua presença na base foi conferida, mas não foi conduzida uma auditoria individual de todos os episódios.
- `Unknown`, `Unspecified`, `N/A` e campos ausentes são normalizados para **Não informado**.
- Nomes brasileiros só são usados quando confirmados nas páginas consultadas, listadas no relatório JSON. Os demais conservam o nome original. Aliases são variantes verificadas ou normalizações de grafia, não novos nomes atribuídos.
- `form` diferencia `Ultimate` de `Regular`; `canonStatus` distingue conceitos e jogo não canônico. Não se atribui automaticamente uma forma a Ben ou a qualquer operador.

## Divergências concretas tratadas

1. **Portaler, ID 69:** `aliens.js` o apresenta como um alien pequeno de Omniverse; a [página específica](https://ben10.fandom.com/wiki/Portaler) o identifica como transformação do jogo *Fuel Run*, não canônica à continuidade clássica, com criação de portais e transformação esférica. A descrição e poderes foram corrigidos; a série de exibição passa a “Não informado” para não sugerir participação em episódios. Fraquezas específicas não confirmadas passam a “Não informado”.
2. **Sandbox/Areal e Snakepit/Cobra, IDs 70/71:** a própria fonte de arte e as galerias declaram conceitos não canônicos de Thomas N. Perkins IV, enquanto `aliens.js` lhes atribui episódios de Omniverse. Essas participações não são mantidas. O nome canônico mencionado em *Ken 10* não é tratado como confirmação do design posterior. Espécie e planeta permanecem “Não informado”.
3. **Snakepit/Cobra:** o conceito de Perkins tem petrificação ocular; a projeção de cobras descrita na base não corresponde à [página do conceito](https://ben10.fandom.com/wiki/Snakepit_(Thomas_Perkins)). A lista foi corrigida e as fraquezas específicas dessa página foram resumidas.
4. **Ultimate Rath/Rath Supremo, ID 52:** série corrigida para Omniverse conforme [página específica](https://ben10.fandom.com/wiki/Ultimate_Rath); nota explicita uso por Albedo. O operador demonstrativo não representa essa relação canônica.
5. **Blitzwolfer, ID 13:** “prata (folclore)” não é tratada como fraqueza confirmada. [Página](https://ben10.fandom.com/wiki/Blitzwolfer) também confirma os aliases Benwolf/Lobisben.
6. **Chama, ID 1:** “Lava Projection” não foi mantida; a [página brasileira](https://ben10.fandom.com/pt-br/wiki/Chama_(Original)) registra que ele não manipula magma. As demais fraquezas continuam identificadas como registros da referência de fãs, sem equivalência a laudo canônico.

## Verificações executadas pelo importador

- 72 registros e IDs distintos.
- Igualdade exata entre nome/ID do array, manifesto de capas, manifesto de fontes e galeria.
- Existência e conteúdo não vazio dos **630 arquivos únicos** referenciados.
- **560 SHA-256** das galerias comparados ao manifesto do snapshot, sem divergências.
- 72 associações de capa (incluindo os 2 WebPs compartilhados), sem URL inferida.
- 8 imagens de galeria com `enhanced: true` preservadas com `aiEnhanced: true`; duas também são capas.
- 72 capas decodificadas pelo Chrome e examinadas em duas folhas de contato: [`cover-audit-01.png`](cover-audit-01.png) e [`cover-audit-02.png`](cover-audit-02.png). Todas retratam o alien/formato correspondente, incluindo o frame de Ultimate Way Big e os dois conceitos isolados. A associação visual foi cruzada com os nomes e caminhos dos manifestos.

Isso verifica a integridade e a associação declarada pelos manifestos, não certifica direitos de uso nem a correção de todas as alegações históricas. O resultado estruturado está em [`data-audit.json`](data-audit.json). A revisão visual e os testes da interface são relatados separadamente na validação geral do projeto.

## Como repetir a importação

Com Node.js e acesso à internet, execute `node scripts/download-reference.mjs` e depois `node scripts/import-data.mjs`. O primeiro baixa apenas dados, manifestos, README e os caminhos de imagens explicitamente listados, com commit fixado. O segundo interpreta o literal JSON (sem `eval`), adapta os campos e valida os arquivos. Uso normal, testes e build **não exigem executar esses scripts ou acessar a internet**.

## Pendências reais

- Licença/autorização específica de reutilização das artes não confirmada; páginas de arquivos bloqueadas no acesso. Consulte [CREDITS.md](../CREDITS.md).
- Tradução brasileira de todos os nomes ainda não foi confirmada; nomes originais estão disponíveis e pesquisáveis.
- Fonte de fãs contém avaliações e alegações de lore. As contradições identificadas foram tratadas, mas resta uma revisão integral com fontes primárias dos episódios. As avaliações numéricas são sempre apresentadas como convenção acadêmica baseada em fãs.
