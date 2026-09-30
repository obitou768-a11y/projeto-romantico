# Nossa história — 2 anos de nós

Uma experiência romântica interativa feita em HTML, CSS e JavaScript puro. Funciona como site estático: não precisa de conta, servidor, banco de dados ou dependências.

## Como abrir

Abra `index.html` no navegador. Para uma experiência mais consistente com arquivos locais, você também pode abrir a pasta no VS Code e iniciar a extensão Live Server, se já a tiver instalada. O projeto não depende dela.

## Personalização

As informações pessoais e opções gerais ficam em `js/config.js`. Substitua os placeholders antes de compartilhar o site:

```js
casal: {
  meuNome: "Seu nome",
  nomeDela: "Nome dela",
  apelido: "Apelido carinhoso",
},
relacionamento: {
  dataInicio: "AAAA-MM-DD",
  dataAniversario: "AAAA-MM-DD",
},
```

Substitua `AAAA-MM-DD` pelas datas reais de vocês. Se a data de início ficar vazia ou no formato de placeholder, o contador mostrará uma orientação em vez de inventar um tempo.

Edite `frases`, `musica` e `capsula` no mesmo objeto. A cápsula aceita `AAAA-MM-DDTHH:MM`; `modoTeste: true` revela um botão para pré-visualizar a mensagem antes da data configurada.

## Fotos

As cinco fotos enviadas já estão em `assets/fotos/` e aparecem na galeria. Para adicionar outras, coloque os arquivos nessa pasta e edite a lista `fotos` em `js/data.js` com o caminho e a legenda. Memórias da linha do tempo podem ficar sem foto; o modal mostra um placeholder nesses casos.

## Música

O arquivo atual está em `assets/audio/YTDown.com_YouTube_Media_qBBwXuEV4jA_Eu-Amo-Você_009_128k.mp3`, já conectado em `CONFIG.musica.arquivo`. Para trocar a faixa, substitua o caminho nesse campo. A música só toca após a pessoa usar o controle; se o arquivo estiver ausente, o site continua funcionando e mostra a orientação de configuração.

## Perguntas e memórias

Em `js/data.js`, edite:

- `perguntas`: texto, alternativas e índice da resposta correta (`correta`, começando em zero);
- `momentos`: data, título, descrição, imagem, frase e ícone;
- `escolhas`: situações, opções e mensagens correspondentes;
- `caracteristicas`: textos dos cartões “Coisas que amo em você”;
- `cartas.paragrafos`: conteúdo da carta, um parágrafo por item;
- `futuro`: cartões simbólicos dos próximos capítulos.

Os dados do casal não precisam ser repetidos em `data.js`; nomes, datas, música e mensagem da cápsula estão concentrados em `config.js`.

## Progresso e recomeço

O progresso dos capítulos desbloqueados é guardado em `localStorage`. O botão de reiniciar pede confirmação antes de apagar esse progresso. Ao testar, use o controle de capítulos para voltar a qualquer parte já desbloqueada.

## Publicar na internet

Este é um site estático. Para publicar no GitHub Pages:

1. Crie um repositório no GitHub e envie para a raiz dele o conteúdo desta pasta. O arquivo `index.html` deve ficar na raiz, ao lado das pastas `assets`, `css` e `js`.
2. Confira se foram enviados `assets/fotos/` e `assets/audio/`, além dos arquivos de código. O MP3 atual tem cerca de 5,5 MB, abaixo do limite de 100 MB por arquivo do GitHub.
3. No repositório, abra **Settings > Pages**. Em **Build and deployment**, selecione **Deploy from a branch**, escolha a branch `main` e a pasta `/(root)`, depois clique em **Save**.
4. Aguarde a publicação indicada em **Actions** e abra o endereço mostrado em **Settings > Pages**.

Os caminhos das fotos e da música são relativos à raiz e já funcionam em endereços do GitHub Pages que incluem o nome do repositório. Preserve exatamente os nomes e as maiúsculas/minúsculas dos arquivos: o servidor do GitHub diferencia letras maiúsculas de minúsculas. No site publicado, a pessoa precisa tocar em **Nossa música** para iniciar a reprodução; navegadores bloqueiam música automática.

Antes de publicar, troque os placeholders e confirme que deseja compartilhar as fotos e a música escolhidas. As mesmas pastas `assets`, `css` e `js` devem ser mantidas ao usar outra hospedagem estática.