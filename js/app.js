const STORAGE_KEY = "nossa-historia-progresso-v1";
const chapterStage = document.getElementById("chapterStage");
const opening = document.getElementById("opening");
const experience = document.getElementById("experience");
const chapterMenu = document.getElementById("chapterMenu");
const progressBar = document.getElementById("progressBar");
const progressCount = document.getElementById("progressCount");
const progressTrack = document.querySelector(".progress-track");
const dialog = document.getElementById("memoryDialog");
const dialogContent = document.getElementById("dialogContent");
const coupleAudio = document.getElementById("coupleAudio");
const musicDock = document.getElementById("musicDock");
let currentChapter = 0;
let unlockedChapter = 0;
let quizIndex = 0;
let quizScore = 0;
let quizAnswered = false;
let gameFirstCard = null;
let gameLocked = false;
let gameMatches = 0;
let gameMoves = 0;
let counterTimer = null;
let capsuleTimer = null;
let toastTimer = null;
let capsuleReleased = false;

function escapeHTML(value) {
  return String(value ?? "").replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]);
}

function configured(value) {
  const text = String(value ?? "").trim();
  return text && !/^\[.*\]$/.test(text) && !text.includes("AAAA-MM-DD") ? text : "";
}

function personalize(value) {
  return String(value ?? "").replaceAll("[APELIDO]", configured(CONFIG.casal.apelido) || "[APELIDO]");
}

function safeStorageRead() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : null;
  } catch {
    return null;
  }
}

function safeStorageWrite() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ currentChapter, unlockedChapter }));
  } catch {
    showToast("O progresso não pôde ser salvo neste navegador.");
  }
}

function showToast(message) {
  const toast = document.getElementById("toast");
  toast.textContent = message;
  toast.classList.add("is-visible");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("is-visible"), 2600);
}

function createParticles() {
  const host = document.getElementById("ambientParticles");
  const fragment = document.createDocumentFragment();
  for (let index = 0; index < 34; index += 1) {
    const particle = document.createElement("span");
    particle.className = index % 7 === 0 ? "particle heart-particle" : "particle";
    if (particle.classList.contains("heart-particle")) particle.textContent = "♥";
    particle.style.left = `${(index * 37 + 11) % 100}%`;
    particle.style.top = `${(index * 53 + 8) % 100}%`;
    particle.style.animationDelay = `${(index % 9) * -0.7}s`;
    particle.style.animationDuration = `${4 + (index % 8)}s`;
    fragment.appendChild(particle);
  }
  host.appendChild(fragment);
}

function initApp() {
  createParticles();
  document.getElementById("footerPhrase").textContent = CONFIG.frases.principal;
  document.getElementById("musicLabel").textContent = DATA.musicas[0]?.titulo || "Nossa música";
  coupleAudio.src = CONFIG.musica.arquivo;
  coupleAudio.volume = Number(document.getElementById("musicVolume").value);
  const saved = safeStorageRead();
  if (saved && Number.isInteger(saved.unlockedChapter)) {
    unlockedChapter = Math.max(0, Math.min(DATA.capitulos.length - 1, saved.unlockedChapter));
    currentChapter = Math.max(0, Math.min(unlockedChapter, Number(saved.currentChapter) || 0));
  }
  document.getElementById("startButton").addEventListener("click", startExperience);
  document.getElementById("homeButton").addEventListener("click", returnToOpening);
  document.getElementById("restartButton").addEventListener("click", confirmRestart);
  document.getElementById("nextButton").addEventListener("click", advanceChapter);
  document.getElementById("backButton").addEventListener("click", retreatChapter);
  chapterMenu.addEventListener("change", () => loadChapter(Number(chapterMenu.value)));
  document.getElementById("dialogClose").addEventListener("click", closeModal);
  dialog.addEventListener("click", (event) => { if (event.target === dialog) closeModal(); });
  document.addEventListener("keydown", (event) => { if (event.key === "Escape" && dialog.open) closeModal(); });
  document.getElementById("musicToggle").addEventListener("click", startMusic);
  document.getElementById("musicVolume").addEventListener("input", (event) => { coupleAudio.volume = Number(event.target.value); });
  coupleAudio.addEventListener("play", () => { musicDock.classList.add("is-playing"); document.getElementById("musicToggle").setAttribute("aria-label", "Pausar nossa música"); });
  coupleAudio.addEventListener("pause", () => { musicDock.classList.remove("is-playing"); document.getElementById("musicToggle").setAttribute("aria-label", "Tocar nossa música"); });
  coupleAudio.addEventListener("error", showMissingMusicNotice);
  populateChapterMenu();
  updateProgress();
}

function populateChapterMenu() {
  chapterMenu.innerHTML = DATA.capitulos.slice(0, unlockedChapter + 1).map((chapter, index) => `<option value="${index}">${index + 1}. ${escapeHTML(chapter.titulo)}</option>`).join("");
}

function startExperience() {
  opening.classList.add("is-leaving");
  window.setTimeout(() => {
    opening.hidden = true;
    experience.hidden = false;
    loadChapter(currentChapter);
  }, 500);
}

function returnToOpening() {
  if (counterTimer) clearInterval(counterTimer);
  experience.hidden = true;
  opening.hidden = false;
  opening.classList.remove("is-leaving");
  coupleAudio.pause();
}

function confirmRestart() {
  if (!window.confirm("Recomeçar do zero? O progresso salvo desta história será apagado.")) return;
  currentChapter = 0;
  unlockedChapter = 0;
  safeStorageWrite();
  populateChapterMenu();
  updateProgress();
  returnToOpening();
}

function updateProgress() {
  const step = currentChapter + 1;
  progressBar.style.width = `${step / DATA.capitulos.length * 100}%`;
  progressCount.textContent = `${step} / ${DATA.capitulos.length}`;
  progressTrack.setAttribute("aria-valuenow", String(step));
  chapterMenu.value = String(currentChapter);
}

function advanceChapter() {
  if (currentChapter >= DATA.capitulos.length - 1) return;
  unlockedChapter = Math.max(unlockedChapter, currentChapter + 1);
  loadChapter(currentChapter + 1);
}

function retreatChapter() {
  if (currentChapter > 0) loadChapter(currentChapter - 1);
}

function loadChapter(index) {
  if (!Number.isInteger(index) || index < 0 || index > unlockedChapter || index >= DATA.capitulos.length) return;
  if (counterTimer) clearInterval(counterTimer);
  if (capsuleTimer) clearTimeout(capsuleTimer);
  capsuleTimer = null;
  currentChapter = index;
  safeStorageWrite();
  populateChapterMenu();
  updateProgress();
  const chapter = DATA.capitulos[index];
  chapterStage.innerHTML = `<header class="chapter-heading"><p class="chapter-index">CAPÍTULO ${String(index + 1).padStart(2, "0")} <span aria-hidden="true">/</span> 10</p><h2>${escapeHTML(chapter.titulo)}</h2><p>${escapeHTML(chapter.subtitulo)}</p></header>${renderChapterContent(index)}`;
  chapterStage.classList.remove("chapter");
  void chapterStage.offsetWidth;
  chapterStage.classList.add("chapter");
  document.getElementById("backButton").disabled = index === 0;
  document.getElementById("nextButton").hidden = index === DATA.capitulos.length - 1;
  document.getElementById("navHint").textContent = index === DATA.capitulos.length - 1 ? "" : "No seu tempo. Essa história é sua.";
  bindChapterEvents(index);
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function renderChapterContent(index) {
  const renderers = [renderBeginning, renderTimeline, renderGallery, renderQuiz, renderChoices, renderTraits, renderLetter, renderFuture, renderCapsuleAndGame, renderClosing];
  return renderers[index]();
}

function renderBeginning() {
  const date = configured(CONFIG.relacionamento.dataInicio) || "[DATA DO NAMORO]";
  const beats = [
    ["✧", "Primeiro encontro", "O primeiro capítulo de uma história que ainda não sabíamos contar."],
    ["☾", "Primeira conversa especial", "Quando o papo ficou tão bom que o tempo perdeu a importância."],
    ["♥", "O começo do namoro", "O nosso sim, no nosso tempo."],
    ["▧", "Primeiro momento inesquecível", "Uma lembrança que sempre encontra um jeito de voltar."],
    ["〰", "A primeira grande risada", "A prova de que juntos até o acaso fica mais divertido."],
  ];
  return `<div class="story-intro"><div><p class="story-quote">Antes de você, minha vida era uma história.<br><em>Depois de você, ela ganhou novos capítulos.</em></p><p class="section-note">Mas vamos voltar para o começo...</p></div><div class="story-date-card"><span>O dia em que começamos</span><strong>${escapeHTML(date)}</strong><small>O primeiro dia de tantos que vieram depois.</small></div></div><div class="story-timeline">${beats.map((beat, index) => `<article class="story-beat" style="animation-delay:${index * 110}ms"><span aria-hidden="true">${beat[0]}</span><h3>${escapeHTML(beat[1])}</h3><p>${escapeHTML(beat[2])}</p></article>`).join("")}</div>`;
}

function renderTimeline() {
  return `<div class="memory-grid">${DATA.momentos.map((memory, index) => `<button class="memory-card" type="button" data-memory="${index}" aria-label="Abrir memória: ${escapeHTML(memory.titulo)}"><span class="memory-icon" aria-hidden="true">${escapeHTML(memory.icone)}</span><h3>${escapeHTML(memory.titulo)}</h3><p>${escapeHTML(memory.frase)}</p></button>`).join("")}</div><p class="section-note">Toque em uma lembrança para abrir os detalhes.</p>`;
}

function renderGallery() {
  return `<div class="gallery-grid">${DATA.fotos.map((photo, index) => `<button class="photo-tile" type="button" data-photo="${index}" aria-label="Abrir foto: ${escapeHTML(photo.legenda)}"><img class="media-img" src="${escapeHTML(photo.arquivo)}" alt="${escapeHTML(photo.legenda)}" loading="lazy"><span class="photo-placeholder"><span aria-hidden="true">♥</span><span>Uma memória nossa aparecerá aqui ❤️</span></span><span class="photo-caption">${escapeHTML(photo.legenda)}</span></button>`).join("")}</div>`;
}

function renderQuiz() {
  return `<div class="quiz-panel" id="quizPanel" aria-live="polite"></div>`;
}

function renderChoices() {
  return `<div class="choice-list">${DATA.escolhas.map((choice, index) => `<section class="choice-block" data-choice="${index}"><h3>${escapeHTML(choice.pergunta)}</h3><div class="choice-options">${choice.opcoes.map((option, optionIndex) => `<button class="choice-option" type="button" data-option="${optionIndex}">${escapeHTML(option)}</button>`).join("")}</div><p class="choice-response" aria-live="polite"></p></section>`).join("")}</div>`;
}

function renderTraits() {
  return `<div class="trait-grid">${DATA.caracteristicas.map((trait, index) => `<article class="trait-card" style="animation-delay:${Math.min(index * 45, 700)}ms"><span aria-hidden="true">${index % 3 === 0 ? "✧" : index % 3 === 1 ? "♥" : "·"}</span><p>${escapeHTML(trait)}</p></article>`).join("")}</div>`;
}

function renderLetter() {
  const letter = DATA.cartas[0];
  const name = configured(CONFIG.casal.nomeDela) || "meu amor";
  const greeting = letter.saudacao.replace("Meu amor", name);
  const paragraphs = letter.paragrafos.map((paragraph) => `<p>${escapeHTML(paragraph)}</p>`).join("");
  return `<div class="letter-area"><div class="letter-envelope" id="letterEnvelope"><span class="envelope-label">Você recebeu uma carta.</span></div><button class="button button-primary letter-open-button" id="openLetter" type="button">Abrir <span aria-hidden="true">♥</span></button><article class="letter-paper" id="letterPaper" hidden><h3 class="letter-greeting">${escapeHTML(greeting)}</h3>${paragraphs}<p class="letter-signoff">${escapeHTML(letter.assinatura)}</p><p class="letter-signature">Feliz 2 anos de nós. ♥</p></article></div>`;
}

function renderFuture() {
  return `<div class="counter-layout"><section class="counter-card"><h3>Há quanto tempo somos nós?</h3><div class="counter-grid" id="counterGrid" aria-live="polite"><p class="section-note">${configured(CONFIG.relacionamento.dataInicio) ? "Preparando cada segundo…" : "Nossa contagem está esperando pela data em que tudo começou."}</p></div><p class="counter-phrase">E cada segundo ainda vale a pena.</p></section><section class="future-area"><h3>Um mapa sem roteiro</h3><div class="future-grid">${DATA.futuro.map((item, index) => `<button class="future-card" type="button" data-future="${index}"><span aria-hidden="true">${escapeHTML(item.icone)}</span><strong>${escapeHTML(item.titulo)}</strong></button>`).join("")}</div></section></div>`;
}

function renderCapsuleAndGame() {
  const testButton = CONFIG.capsula.modoTeste ? `<button class="test-release" id="testCapsule" type="button">Abrir cápsula (modo de teste)</button>` : "";
  return `<div class="capsule-layout"><section class="capsule-card"><span class="capsule-icon" aria-hidden="true">⌛</span><h3>Cápsula do tempo</h3><p>Essa mensagem só deveria ser aberta no futuro. Uma pequena lembrança enviada por nós de hoje.</p><div class="capsule-countdown" id="capsuleCountdown" aria-live="polite"></div><div id="capsuleContent"></div>${testButton}</section><div class="capsule-card"><span class="capsule-icon" aria-hidden="true">✧</span><h3>Uma pausa para brincar</h3><p>Encontre os pares. Cada símbolo guarda um pedacinho do que é nosso.</p><div class="memory-game" id="memoryGame" aria-label="Jogo da memória"></div><p class="game-status" id="gameStatus" aria-live="polite"></p><button class="button button-quiet" id="resetGame" type="button">↻ Embaralhar de novo</button></div></div>`;
}

function renderClosing() {
  return `<div class="closing-quote"><p>Se eu pudesse voltar para o dia em que tudo começou...</p><p>...eu escolheria viver tudo novamente.</p><p>Cada conversa. Cada abraço. Cada risada.</p><p>Cada dificuldade. Cada momento em que ficamos juntos mesmo quando as coisas não eram perfeitas.</p><p>Porque todos esses momentos me trouxeram até você.</p><p>Chegamos ao fim da nossa história...</p><p>Ou talvez... ao começo do próximo capítulo.</p></div><section class="surprise-area"><p>Uma última coisa espera por você.</p><p>Com todo o carinho destes dois anos.</p><button class="button button-primary surprise-button" id="surpriseButton" type="button">Descobrir a surpresa <span aria-hidden="true">♥</span></button></section>`;
}

function bindChapterEvents(index) {
  if (index === 1) chapterStage.querySelectorAll("[data-memory]").forEach((button) => button.addEventListener("click", () => openMemory(Number(button.dataset.memory))));
  if (index === 2) {
    chapterStage.querySelectorAll("[data-photo]").forEach((button) => button.addEventListener("click", () => openPhoto(Number(button.dataset.photo))));
    bindImageFallbacks(chapterStage);
  }
  if (index === 3) { quizIndex = 0; quizScore = 0; renderQuizQuestion(); }
  if (index === 4) bindChoiceEvents();
  if (index === 6) document.getElementById("openLetter").addEventListener("click", showLetter);
  if (index === 7) {
    updateRelationshipCounter();
    counterTimer = setInterval(updateRelationshipCounter, 1000);
    chapterStage.querySelectorAll("[data-future]").forEach((button) => button.addEventListener("click", () => showToast(DATA.futuro[Number(button.dataset.future)].mensagem)));
  }
  if (index === 8) {
    updateCapsule();
    renderMemoryGame();
    const test = document.getElementById("testCapsule");
    if (test) test.addEventListener("click", () => releaseCapsule(true));
    document.getElementById("resetGame").addEventListener("click", renderMemoryGame);
  }
  if (index === 9) document.getElementById("surpriseButton").addEventListener("click", showFinalSurprise);
}

function bindImageFallbacks(root) {
  root.querySelectorAll("img.media-img").forEach((image) => {
    image.addEventListener("load", () => image.closest(".photo-tile")?.classList.add("has-image"), { once: true });
    image.addEventListener("error", () => { image.hidden = true; }, { once: true });
    if (image.complete && image.naturalWidth > 0) image.closest(".photo-tile")?.classList.add("has-image");
  });
}

function openMemory(index) {
  const memory = DATA.momentos[index];
  if (!memory) return;
  const image = memory.imagem ? `<img class="dialog-photo" src="${escapeHTML(memory.imagem)}" alt="${escapeHTML(memory.titulo)}" hidden>` : "";
  dialogContent.innerHTML = `${image}<div class="dialog-photo-placeholder">Uma memória nossa aparecerá aqui ♥</div><div class="dialog-copy"><h2 id="dialogTitle">${escapeHTML(memory.titulo)}</h2><p>${escapeHTML(memory.descricao)}</p><blockquote>${escapeHTML(memory.frase)}</blockquote></div>`;
  bindDialogImage();
  dialog.showModal();
}

function openPhoto(index) {
  const photo = DATA.fotos[index];
  if (!photo) return;
  dialogContent.innerHTML = `<img class="dialog-photo" src="${escapeHTML(photo.arquivo)}" alt="${escapeHTML(photo.legenda)}" hidden><div class="dialog-photo-placeholder">Uma memória nossa aparecerá aqui ♥</div><div class="dialog-copy"><h2 id="dialogTitle">${escapeHTML(photo.legenda)}</h2><p>Um instante nosso, guardado com carinho.</p></div>`;
  bindDialogImage();
  dialog.showModal();
}

function bindDialogImage() {
  const image = dialogContent.querySelector("img");
  const placeholder = dialogContent.querySelector(".dialog-photo-placeholder");
  if (!image) return;
  image.addEventListener("load", () => { image.hidden = false; placeholder.hidden = true; }, { once: true });
  image.addEventListener("error", () => { image.hidden = true; placeholder.hidden = false; }, { once: true });
  if (image.complete && image.naturalWidth > 0) { image.hidden = false; placeholder.hidden = true; }
}

function closeModal() {
  if (dialog.open) dialog.close();
  dialogContent.replaceChildren();
}

function renderQuizQuestion() {
  const panel = document.getElementById("quizPanel");
  if (!panel) return;
  quizAnswered = false;
  if (quizIndex >= DATA.perguntas.length) {
    panel.innerHTML = `<div class="quiz-result"><p class="result-score">Você acertou ${quizScore} de ${DATA.perguntas.length}</p><h3>E sabe qual é a parte mais importante?</h3><p>Eu escolheria você de novo em todas as respostas. Obrigado por fazer parte de cada uma delas.</p><button class="button button-primary" id="quizFinish" type="button">Guardar essa lembrança →</button></div>`;
    document.getElementById("quizFinish").addEventListener("click", advanceChapter);
    document.getElementById("nextButton").hidden = true;
    return;
  }
  const question = DATA.perguntas[quizIndex];
  panel.innerHTML = `<div class="quiz-meta"><span>Uma lembrança nossa</span><span>${quizIndex + 1} / ${DATA.perguntas.length}</span></div><h3 class="quiz-question">${escapeHTML(personalize(question.texto))}</h3><div class="quiz-options">${question.opcoes.map((option, index) => `<button class="quiz-option" type="button" data-answer="${index}">${escapeHTML(personalize(option))}</button>`).join("")}</div><p class="quiz-feedback" id="quizFeedback" aria-live="polite"></p><button class="button button-primary quiz-next" id="quizNext" type="button" hidden>Próxima lembrança →</button>`;
  panel.querySelectorAll("[data-answer]").forEach((button) => button.addEventListener("click", () => answerQuiz(Number(button.dataset.answer))));
}

function answerQuiz(answerIndex) {
  if (quizAnswered) return;
  quizAnswered = true;
  const question = DATA.perguntas[quizIndex];
  const correct = answerIndex === question.correta;
  if (correct) quizScore += 1;
  chapterStage.querySelectorAll(".quiz-option").forEach((button) => {
    button.disabled = true;
    const chosen = Number(button.dataset.answer);
    if (chosen === question.correta) button.classList.add("correct");
    else if (chosen === answerIndex) button.classList.add("incorrect");
  });
  document.getElementById("quizFeedback").textContent = correct ? DATA.mensagens[0] : DATA.mensagens[1];
  const nextButton = document.getElementById("quizNext");
  nextButton.hidden = false;
  nextButton.addEventListener("click", () => { quizIndex += 1; renderQuizQuestion(); });
}

function bindChoiceEvents() {
  chapterStage.querySelectorAll(".choice-block").forEach((block) => {
    const choice = DATA.escolhas[Number(block.dataset.choice)];
    block.querySelectorAll(".choice-option").forEach((button) => button.addEventListener("click", () => {
      block.querySelectorAll(".choice-option").forEach((item) => item.classList.remove("selected"));
      button.classList.add("selected");
      block.querySelector(".choice-response").textContent = choice.respostas[Number(button.dataset.option)];
    }));
  });
}

function showLetter() {
  const envelope = document.getElementById("letterEnvelope");
  const openButton = document.getElementById("openLetter");
  const paper = document.getElementById("letterPaper");
  openButton.disabled = true;
  envelope.classList.add("is-open");
  window.setTimeout(() => { paper.hidden = false; openButton.hidden = true; paper.scrollIntoView({ behavior: "smooth", block: "nearest" }); }, 480);
}

function parseStartDate() {
  const start = configured(CONFIG.relacionamento.dataInicio);
  if (!start || !/^\d{4}-\d{2}-\d{2}$/.test(start)) return null;
  const date = new Date(`${start}T00:00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function updateRelationshipCounter() {
  const container = document.getElementById("counterGrid");
  if (!container) return;
  const start = parseStartDate();
  if (!start) {
    container.innerHTML = `<p class="section-note">Nossa contagem está esperando pela data em que tudo começou.</p>`;
    return;
  }
  const now = new Date();
  if (start > now) {
    container.innerHTML = `<p class="section-note">Nossa contagem começa quando chegar o dia.</p>`;
    return;
  }
  let years = now.getFullYear() - start.getFullYear();
  let months = now.getMonth() - start.getMonth();
  let days = now.getDate() - start.getDate();
  if (days < 0) { months -= 1; days += new Date(now.getFullYear(), now.getMonth(), 0).getDate(); }
  if (months < 0) { years -= 1; months += 12; }
  const elapsed = now.getTime() - start.getTime();
  const units = [
    [years, "anos"], [months, "meses"], [days, "dias"],
    [Math.floor(elapsed / 3600000) % 24, "horas"], [Math.floor(elapsed / 60000) % 60, "minutos"], [Math.floor(elapsed / 1000) % 60, "segundos"],
  ];
  container.innerHTML = units.map(([value, label]) => `<div class="counter-unit"><strong>${String(value).padStart(2, "0")}</strong><span>${label}</span></div>`).join("");
}

function updateCapsule() {
  if (capsuleReleased) return;
  if (capsuleTimer) clearTimeout(capsuleTimer);
  const targetValue = configured(CONFIG.capsula.dataAbertura);
  const target = targetValue ? new Date(targetValue) : null;
  const countdown = document.getElementById("capsuleCountdown");
  if (!target || Number.isNaN(target.getTime())) {
    countdown.textContent = "Essa mensagem está esperando pelo momento certo.";
    return;
  }
  const remaining = target.getTime() - Date.now();
  if (remaining <= 0) { releaseCapsule(false); return; }
  const days = Math.floor(remaining / 86400000);
  const hours = Math.floor(remaining / 3600000) % 24;
  const minutes = Math.floor(remaining / 60000) % 60;
  const seconds = Math.floor(remaining / 1000) % 60;
  countdown.textContent = `Ainda faltam ${days} dias, ${hours}h ${minutes}min ${seconds}s.`;
  capsuleTimer = window.setTimeout(updateCapsule, 1000);
}

function releaseCapsule(isTest) {
  capsuleReleased = true;
  if (capsuleTimer) clearTimeout(capsuleTimer);
  capsuleTimer = null;
  const countdown = document.getElementById("capsuleCountdown");
  const content = document.getElementById("capsuleContent");
  if (!countdown || !content) return;
  countdown.textContent = "Chegou o momento certo. ♥";
  content.innerHTML = `<p class="capsule-message">${escapeHTML(CONFIG.capsula.mensagem)}</p>${isTest ? `<p class="section-note">Visualização de teste. A data real continua configurada.</p>` : ""}`;
  const testButton = document.getElementById("testCapsule");
  if (testButton) testButton.hidden = true;
}

function renderMemoryGame() {
  const host = document.getElementById("memoryGame");
  if (!host) return;
  const symbols = ["♥", "▧", "✈", "☾", "☼", "♫", "▤", "✉"];
  const cards = [...symbols, ...symbols].map((symbol, index) => ({ symbol, id: index }));
  for (let index = cards.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [cards[index], cards[swapIndex]] = [cards[swapIndex], cards[index]];
  }
  gameFirstCard = null;
  gameLocked = false;
  gameMatches = 0;
  gameMoves = 0;
  document.getElementById("gameStatus").textContent = "Encontre os 8 pares. Cada descoberta conta.";
  host.innerHTML = cards.map((card, index) => `<button class="game-card" type="button" data-symbol="${escapeHTML(card.symbol)}" aria-label="Carta ${index + 1}, virada"><span class="card-back" aria-hidden="true">♥</span><span class="card-symbol" aria-hidden="true">${escapeHTML(card.symbol)}</span></button>`).join("");
  host.querySelectorAll(".game-card").forEach((button) => button.addEventListener("click", () => revealGameCard(button)));
}

function revealGameCard(button) {
  if (gameLocked || button.classList.contains("revealed") || button.classList.contains("matched")) return;
  button.classList.add("revealed");
  button.setAttribute("aria-label", `Carta revelada: ${button.dataset.symbol}`);
  if (!gameFirstCard) { gameFirstCard = button; return; }
  gameMoves += 1;
  if (gameFirstCard.dataset.symbol === button.dataset.symbol) {
    gameFirstCard.classList.replace("revealed", "matched");
    button.classList.replace("revealed", "matched");
    gameFirstCard.disabled = true;
    button.disabled = true;
    gameFirstCard = null;
    gameMatches += 1;
    document.getElementById("gameStatus").textContent = gameMatches === 8 ? "Você encontrou todas. Assim como encontrou um lugar especial na minha vida." : `${gameMatches} de 8 pares. Que bom descobrir isso com você.`;
    return;
  }
  gameLocked = true;
  const first = gameFirstCard;
  gameFirstCard = null;
  window.setTimeout(() => {
    first.classList.remove("revealed");
    button.classList.remove("revealed");
    first.setAttribute("aria-label", "Carta virada");
    button.setAttribute("aria-label", "Carta virada");
    gameLocked = false;
    document.getElementById("gameStatus").textContent = `${gameMoves} tentativas. Sem pressa, é só uma brincadeira nossa.`;
  }, 700);
}

async function startMusic() {
  if (!coupleAudio.paused) { coupleAudio.pause(); return; }
  try {
    await coupleAudio.play();
    document.getElementById("musicNotice").hidden = true;
  } catch {
    showMissingMusicNotice();
  }
}

function showMissingMusicNotice() {
  if (!CONFIG.mostrarAvisosDesenvolvimento) return;
  const notice = document.getElementById("musicNotice");
  notice.textContent = "Nossa música ainda não está disponível para tocar.";
  notice.hidden = false;
}

function showFinalSurprise() {
  coupleAudio.play().catch(() => {});
  const name = configured(CONFIG.casal.nomeDela) || "meu amor";
  const author = configured(CONFIG.casal.meuNome) || "[MEU NOME]";
  const date = configured(CONFIG.relacionamento.dataAniversario) || "[DATA DO ANIVERSÁRIO]";
  const finale = document.createElement("section");
  finale.className = "finale";
  finale.setAttribute("aria-labelledby", "finaleTitle");
  finale.innerHTML = `<span class="finale-heart" style="top:17%;left:13%" aria-hidden="true">♥</span><span class="finale-heart" style="top:24%;right:15%;animation-delay:1s" aria-hidden="true">✧</span><span class="finale-heart" style="bottom:15%;left:21%;animation-delay:2s" aria-hidden="true">♥</span><div class="finale-content"><p class="finale-kicker">UMA HISTÓRIA. DOIS ANOS. TANTOS CAMINHOS.</p><h2 id="finaleTitle">Feliz 2 anos,<br><span>${escapeHTML(name)}.</span></h2><p class="finale-message">Obrigado por todos os momentos.<br>Obrigado por ficar.<br>Obrigado por ser você.<br><strong>Eu amo você.</strong></p><p class="finale-manifesto">2 anos.<br>Uma história.<br>E ainda temos muito para viver.</p><p class="finale-signature">De: ${escapeHTML(author)}<br>Para: ${escapeHTML(name)}<br>Com todo meu amor.<br>${escapeHTML(date)}</p><p>${escapeHTML(CONFIG.frases.final)}</p><button class="button button-primary" id="replayButton" type="button">Reviver nossa história ↺</button></div>`;
  document.body.appendChild(finale);
  document.getElementById("replayButton").addEventListener("click", () => {
    finale.remove();
    currentChapter = 0;
    unlockedChapter = 0;
    safeStorageWrite();
    populateChapterMenu();
    updateProgress();
    returnToOpening();
  });
}

document.addEventListener("DOMContentLoaded", initApp, { once: true });