# Atualizar o OMNIDEX no GitHub manualmente

Este projeto já possui um repositório Git, branch `main` e remoto `origin` configurado para:

[engsoftmarcelo/engsoftmarcelo-OMNIDEX](https://github.com/engsoftmarcelo/engsoftmarcelo-OMNIDEX)

Não é necessário inicializar outro repositório ou cadastrar um novo `origin` para atualizar esse destino. Este guia não executa publicação, commit ou push.

## 1. Abrir o terminal na pasta do projeto

Abra a pasta do OMNIDEX no Explorador de Arquivos. Clique na barra de endereço, digite `powershell` e pressione Enter. Confira:

```powershell
git branch --show-current
git remote -v
git status
```

A branch esperada é `main`; o remoto deve ser o endereço acima. Arquivos novos aparecem como não rastreados até serem adicionados. Eles também precisam entrar no commit.

## 2. Conferir a aplicação

```powershell
npm install
npm run check
npm run test:e2e
```

`check` reúne testes unitários, integridade dos dados e build. Os testes de navegador usam Chrome instalado; a alternativa Chromium está descrita no README. Para experimentar a produção, execute `npm run preview` e abra o endereço informado no terminal. Encerre o servidor com Ctrl+C quando terminar.

As mecânicas de falha e energia permanecem ligadas por padrão, conforme a opção do projeto. `?chaos=0` desliga e `?chaos=1` liga explicitamente. A abertura pode ser conferida com `?intro=1`. A suíte testa os modos determinístico e ativo separadamente.

## 3. Preparar e revisar os arquivos

```powershell
git add .
git diff --cached --stat
git diff --cached --name-only
git diff --cached --check
```

Confira se entraram as alterações em `src/`, os novos componentes/utilitários, os testes, o README, os créditos e este guia. `node_modules/`, `dist/`, `.source-reference/`, `.claude/`, `.env*` e relatórios internos não devem fazer parte da lista. O `.gitignore` preserva um eventual `.env.example` como exemplo, caso seja criado sem valores privados.

É normal que `package-lock.json`, imagens utilizadas, dados locais, manifestos e arquivos de licença façam parte do repositório. Se um arquivo entrou por engano, retire somente ele do staging com `git restore --staged -- CAMINHO-DO-ARQUIVO` e confira a regra de exclusão antes de prosseguir.

## 4. Criar o commit e enviar

```powershell
git commit -m "Atualiza OMNIDEX com mecanicas e documentacao revisadas"
git push origin main
```

Se o Git Credential Manager abrir o navegador para autenticação, conclua o login com sua conta do GitHub. A senha da conta não funciona como senha de operações Git por HTTPS. Não escreva tokens em arquivos ou no comando `git remote`.

Caso outra pessoa tenha atualizado o remoto e o push seja recusado, integre essas alterações antes de tentar novamente. Não sobrescreva o histórico remoto para contornar uma divergência. Na ausência de conflitos, o fluxo usual é `git pull --rebase origin main` seguido de `git push origin main`; havendo conflitos, resolva-os antes de continuar.

## 5. Conferir no GitHub

Abra o repositório, atualize a página e verifique o novo commit, o README renderizado, os componentes novos e os testes. Opcionalmente, clone o repositório em outra pasta e execute `npm ci` e `npm run check` para confirmar que ele funciona sem arquivos locais não publicados.

A atividade prevê Pair Programming e os dois integrantes devem entregar o link do repositório no Canvas. Isso é uma entrega dos estudantes; este guia não afirma que o envio foi feito.

## Condições de publicação

A validação técnica não comprova autorização de redistribuição das imagens ou dos áudios. As condições e as pendências reais estão em [CREDITS.md](../CREDITS.md). As mídias não devem ser apresentadas como domínio público ou cobertas automaticamente por uma futura licença do código.

Referências oficiais: [adicionar código local ao GitHub](https://docs.github.com/en/migrations/importing-source-code/using-the-command-line-to-import-source-code/adding-locally-hosted-code-to-github), [autenticação e credenciais](https://docs.github.com/en/get-started/git-basics/caching-your-github-credentials-in-git) e [limites do repositório](https://docs.github.com/en/repositories/creating-and-managing-repositories/repository-limits).
