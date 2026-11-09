# Fontes, créditos e condições identificadas

Consulta realizada em **9 de novembro de 2026**. Este é um projeto acadêmico de fãs, sem afiliação ou endosso dos titulares de Ben 10.

## Referência principal e rastreabilidade

- [Omnipedia — repositório de Prabhmannat Singh](https://github.com/PRABHMANNAT/Ben-10-Omnitrix-Database).
- [Catálogo publicado](https://ben-10-omnitrix-database.vercel.app/).
- Snapshot efetivamente importado: [`8d9c4cad125a812d41c6322a1b133217a75d7f7a`](https://github.com/PRABHMANNAT/Ben-10-Omnitrix-Database/tree/8d9c4cad125a812d41c6322a1b133217a75d7f7a).
- Dados consultados: `src/data/aliens.js`; capas: `src/data/artwork.json`; galerias: `src/data/galleries.json`; fontes das capas: `public/aliens/sources.json`.

O README da referência declara ausência de licença de código. Os componentes, estilos, interações e importador do OMNIDEX foram escritos para este projeto. Não foi copiada nem executada a aplicação da Omnipedia. Foram consultados os registros e manifestos de dados e arte solicitados. Os resumos em português e as categorias de habilidades são adaptações editoriais do OMNIDEX; as avaliações numéricas originais foram preservadas em `sourceStats`.

## Imagens e seus titulares

O catálogo contém **72 associações de capa**, **560 associações de galeria** e **630 arquivos visuais distintos**. As capas de Areal/Sandbox (70) e Cobra/Snakepit (71) usam o mesmo arquivo que já integra a respectiva galeria: por isso 72 + 560 referências não são 632 arquivos distintos.

As imagens são arquivos reais associados aos IDs pelos manifestos da referência, baixados do snapshot acima. Nenhuma URL de imagem foi deduzida. As capas estão em `public/images/aliens/` e as galerias em `public/images/gallery/`. Embora a referência use a extensão `.png` em 70 capas, os bytes são WebP (assinatura RIFF/WEBP). As extensões locais foram normalizadas para `.webp`, sem mudar o conteúdo, para servir o MIME correto.

As origens declaradas são **Ben 10 Wiki / Fandom**, **Cartoon Network / Man of Action** e, nos conceitos indicados, **Thomas N. Perkins IV**. Os créditos originais de cada galeria foram preservados. O registro completo por arquivo, com página de origem, página do arquivo, URL original, dimensões, indicação de aprimoramento e SHA-256, está em [`public/images/source-manifest.json`](public/images/source-manifest.json). O JSON da aplicação também traz as fontes de cada registro e de cada imagem. A capa pode retratar uma versão de outra série; não foi usada para inferir novas aparições no cânone.

### O que foi e o que não foi confirmado

A [política de licenciamento do Fandom](https://www.fandom.com/licensing) distingue textos de mídias não textuais: a licença CC BY-SA normalmente associada ao texto **não deve ser presumida para as imagens**. A [orientação oficial sobre reutilização](https://support.fandom.com/hc/en-us/articles/360035075654-I-want-to-reuse-text-or-images-from-a-Fandom-wiki) informa que muitas imagens são enviadas pelos usuários sob alegação de _fair use_. Essa alegação não é uma autorização geral, nem foi apresentada aqui como licença aplicável automaticamente ao Brasil ou a esta entrega.

As páginas específicas dos arquivos de imagem consultadas ficaram indisponíveis por bloqueios de acesso/Cloudflare. Os manifestos da Omnipedia fornecem crédito e origem, **mas não fornecem uma licença específica de redistribuição de cada arte**. Não foi obtida autorização expressa dos titulares. Os arquivos locais estão incluídos para a apresentação acadêmica solicitada; essa inclusão, a finalidade acadêmica, a disponibilidade pública e os créditos **não certificam permissão de reutilização**. A confirmação dos direitos para redistribuir/publicar essas artes permanece pendente. Nenhuma licença aberta do código do OMNIDEX, se vier a ser adotada pelos integrantes, deve ser interpretada como uma licença dessas artes.

### Conceitos não canônicos e aprimoramento por IA

- IDs **70 e 71**: conceitos de **Thomas N. Perkins IV**, não canônicos. A arte isolada de capa foi identificada pela referência como aprimorada por IA. As galerias preservam essa identificação individualmente. As páginas [Sandbox (Thomas Perkins)](<https://ben10.fandom.com/wiki/Sandbox_(Thomas_Perkins)>) e [Snakepit (Thomas Perkins)](<https://ben10.fandom.com/wiki/Snakepit_(Thomas_Perkins)>) distinguem esses conceitos das transformações apenas mencionadas na série.
- Há **8 arquivos de galeria identificados como aprimorados** no manifesto: `/gallery/38/2.webp`, `/gallery/38/3.webp`, `/gallery/47/3.webp`, `/gallery/47/4.webp`, `/gallery/51/3.webp`, `/gallery/69/3.webp`, `/gallery/70/3.webp` e `/gallery/71/3.webp`. A aplicação mantém a etiqueta em cada imagem afetada. Não foram geradas novas artes por IA para esta entrega.
- ID **69, Portaler**: transformação do jogo _Fuel Run_, não canônica à continuidade das séries clássicas, conforme [sua página](https://ben10.fandom.com/wiki/Portaler). Não foi apresentada como transformação usada em um episódio de Omniverse.

A galeria de Portaler também inclui interpretações de fãs creditadas individualmente: [TheHawkDown](https://www.thehawkdown.com/portaler), [Spyro2108](https://www.deviantart.com/spyro2108/art/Ben-10-Alien-Portaler-849661335) e [WhiteSnakeShinobi / A.S.K. AIR](https://askair.weebly.com/unseen-ben-10-aliens.html). Esses créditos e os links específicos estão preservados nos manifestos; a inclusão não confirma licença de redistribuição dessas artes.

## Nomes brasileiros e correções específicas

Os nomes brasileiros utilizados foram confirmados nas páginas listadas individualmente no campo `sources` do JSON. Os demais mantêm o nome original; não se inventaram traduções. Os nomes originais e aliases confirmados, como **Benwolf/Lobisben**, foram preservados para pesquisa. O relatório [`docs/data-audit.json`](docs/data-audit.json) lista as páginas de confirmação.

- [Chama](<https://ben10.fandom.com/pt-br/wiki/Chama_(Original)>), [Besta](https://ben10.fandom.com/pt-br/wiki/Besta), [Massa Cinzenta](<https://ben10.fandom.com/pt-br/wiki/Massa_Cinzenta_(Original)>), [Insectóide](<https://ben10.fandom.com/pt-br/wiki/Insectóide_(Original)>), [Aquático](https://ben10.fandom.com/pt-br/wiki/Aquático), [Ultra T](<https://ben10.fandom.com/pt-br/wiki/Ultra_T_(Original)>) e [Fantasmático](https://ben10.fandom.com/pt-br/wiki/Fantasmático).
- [Diamante](<https://ben10.fandom.com/wiki/Diamondhead_(Classic)>), [Quatro Braços](<https://ben10.fandom.com/wiki/Four_Arms_(Classic)>), [Blitzwolfer/Lobisben](https://ben10.fandom.com/wiki/Blitzwolfer) e [Rath Supremo](https://ben10.fandom.com/wiki/Ultimate_Rath).
- Areal e Cobra são nomes presentes nas tabelas de tradução das páginas específicas dos conceitos, citadas acima.

As listas de poderes e fraquezas da base conservam em geral a nomenclatura original em inglês. São registros da referência de fãs, não fatos canônicos certificados por uma revisão de todos os episódios. Alegações contraditórias identificadas foram removidas ou corrigidas, sem extrapolar relações de operadores; veja [`docs/SOURCE-AUDIT.md`](docs/SOURCE-AUDIT.md). Informações ausentes usam **“Não informado”**.

## Efeitos sonoros do Omnitrix clássico

Dois efeitos curtos foram incluídos localmente, sem modificar ou sintetizar seus bytes:

| Arquivo local                                 | Duração medida | Caminho efetivamente conferido na fonte |
| --------------------------------------------- | -------------- | --------------------------------------- |
| `public/audio/omnitrix-classic-select.mp3`    | 0,294603 s     | `sounds/spin3.mp3`                      |
| `public/audio/omnitrix-classic-transform.mp3` | 2,328 s        | `sounds/omnitrix-transform.mp3`         |

Fonte técnica: [Omnitrix-Simulator, mantido por fabi0casa](https://github.com/fabi0casa/Omnitrix-Simulator), commit [`20afb0d9ab658f2ae5d3679ba2ee74430f344946`](https://github.com/fabi0casa/Omnitrix-Simulator/tree/20afb0d9ab658f2ae5d3679ba2ee74430f344946). O README identifica expressamente a experiência como Ben 10 Clássico. Foram consultados seus arquivos de áudio; nenhum código de aplicação dessa fonte foi copiado ou executado.

Os codecs e durações foram medidos com ffprobe, ambos os MP3s foram decodificados sem erro com ffmpeg e os hashes locais coincidiram com os blobs do snapshot. Isso comprova integridade e associação ao repositório consultado. **Não comprova que o mantenedor seja o autor do efeito, nem confirma um episódio ou master oficial de origem.** Não há licença de reutilização de áudio declarada na fonte e a autorização específica dos titulares permanece não confirmada. Crédito, disponibilidade e finalidade acadêmica não equivalem a autorização. Os links completos, hashes e limitações estão em [`public/audio/sources.json`](public/audio/sources.json).

Os demais bipes e sinais são sintetizados pelo código local da interface. A nova animação de ativação foi escrita com React, SVG e CSS, inspirada no dispositivo clássico; não usa vídeo ou frames extraídos da série.

## Identidade visual e tipografia

Nome, composição visual, ícones geométricos em SVG, layout, componentes e CSS foram produzidos para o OMNIDEX. A inspiração temática no Omnitrix não implica titularidade sobre Ben 10. Os perfis de operadores são criações demonstrativas da atividade, não personagens da franquia.

Fontes servidas localmente pelos pacotes Fontsource: **Inter**, The Inter Project Authors ([projeto](https://github.com/rsms/inter)), e **Space Grotesk**, The Space Grotesk Project Authors ([projeto](https://github.com/floriankarsten/space-grotesk)). Ambas usam SIL Open Font License 1.1; cópias integrais acompanham a entrega em [`public/licenses/Inter-OFL.txt`](public/licenses/Inter-OFL.txt) e [`public/licenses/Space-Grotesk-OFL.txt`](public/licenses/Space-Grotesk-OFL.txt). As bibliotecas e versões estão registradas em `package.json` e `package-lock.json`.
