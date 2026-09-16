# Performance — versão demonstrativa 2

App de treino com interface mobile (largura máxima de 440 px, inclusive no computador), fundo preto, cards cinza e verde neon.

## Rodar o projeto

Requisitos: Node.js 22.13 ou superior e pnpm 11.25.0. Extraia o ZIP, abra o terminal na pasta `Performance` e execute:

```sh
pnpm install --frozen-lockfile
pnpm dev
```

Abra o endereço informado no terminal (normalmente `http://localhost:5173`). Para gerar a versão de produção:

```sh
pnpm build
pnpm start
```

O projeto usa React, TypeScript e Vinext/Vite. O ZIP contém código, configurações, lockfile, scripts e todas as imagens usadas pelo app. As dependências são instaladas pelo comando acima; `node_modules`, arquivos temporários e histórico Git não estão incluídos.

## Perfis para testar

O seletor inicial é temporário, exclusivo desta demonstração, e deve ser removido quando a autenticação real for implementada.

- **Aluno autônomo:** cria e edita fichas, seleciona exercícios, define séries, repetições, cargas e descanso, executa e registra o treino.
- **Aluno acompanhado:** recebe as fichas publicadas pelo seu professor e executa os treinos. Não cria nem altera prescrições.
- **Professor:** seleciona um aluno vinculado, monta fichas, salva rascunhos e publica. O aluno continua vendo a última publicação enquanto o professor edita um novo rascunho.
- **Admin:** consulta alunos, professores e informações demonstrativas da academia.

Use **Trocar perfil** para alternar os papéis sem cadastrar uma conta. Os alunos e professores disponíveis são fictícios.

## Testar o ciclo completo

1. Entre como professor **Bruno Martins** e selecione o aluno **Lucas**.
2. Abra a ficha em rascunho, adicione exercícios e ajuste séries, repetições e cargas.
3. Salve o rascunho: ele ainda não fica disponível para execução pelo aluno.
4. Publique a ficha.
5. Troque para aluno acompanhado **Lucas** e abra a ficha recebida.
6. Inicie o treino, registre carga e repetições realizadas e marque as séries concluídas.
7. Finalize e confira o histórico e a evolução. Somente séries marcadas são registradas.
8. Entre como aluno autônomo **Cauê** para testar a criação da própria ficha.

O treino em andamento é preservado ao trocar de perfil e fica pausado. Alterações posteriores na ficha não mudam a sessão que já começou. É possível concluir um treino parcial; séries não marcadas não entram no registro.

## Dados locais

Esta versão não usa Firebase, banco de dados remoto, autenticação real nem biometria. Os dados são persistidos apenas no `localStorage` do navegador, na chave `performance-demo-v2`. Não existe sincronização entre aparelhos ou navegadores.

O primeiro acesso gera seis semanas de registros fictícios para demonstrar frequência, semanas consecutivas, tempo de treino e evolução de carga. Os novos registros feitos durante o teste passam a compor essas informações. Lucas começa sem histórico e sem ficha publicada para facilitar a validação do fluxo do professor.

Em **Perfil**, é possível restaurar os exemplos. Essa ação apaga as alterações locais da demonstração. A troca de perfil e as regras de permissão servem para testar o comportamento da interface; não substituem controle de acesso no servidor.

## Biblioteca de exercícios

São 55 exercícios, organizados em 11 grupos, com busca por nome e filtros. Cada exercício inclui uma ilustração vetorial da execução e um mapa muscular consistente com destaque verde. Os mapas indicam regiões musculares gerais; as instruções e os dados são demonstrativos.

Créditos e licenças estão em `public/ARTWORK-ATTRIBUTION.md` e `public/artwork-licenses/`. As ilustrações adaptadas seguem as licenças identificadas nesses arquivos; mantenha as atribuições ao redistribuí-las. A imagem de capa está em `public/images/athlete.webp`.

## Organização

- `app/performance/performance-app.tsx`: navegação, perfis e persistência local.
- `app/performance/model.ts`: regras dos perfis, fichas, sessões, histórico e estatísticas.
- `app/performance/catalog.ts`: catálogo e metadados dos exercícios.
- `app/performance/types.ts`: tipos do domínio.
- `app/performance/`: componentes de treino, biblioteca, editor, evolução e administração.
- `app/globals.css` e `app/performance/performance.css`: identidade visual e layout mobile.
- As ilustrações SVG da biblioteca e dos mapas musculares estão incorporadas em `app/performance/catalog.ts` para manter o projeto abaixo de 100 arquivos sem alterar o visual.
- `scripts/`: comandos de desenvolvimento e compilação.

A configuração de hospedagem original está em `.openai/hosting.json`; o app não utiliza os módulos opcionais de banco e autenticação presentes na base do projeto.

## Verificação desta entrega

A compilação de produção e a checagem TypeScript passaram. Foram exercitadas as regras de rascunho/publicação, separação dos alunos, autonomia, registro de séries, pausa/retomada, histórico, sequência semanal e recuperação dos dados locais. Os caminhos das 55 ilustrações e dos mapas musculares foram conferidos. Esta entrega não inclui uma rodada de validação visual automatizada no navegador.
