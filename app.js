const holes = [

  {

    number: 1,

    par: 2,

    distance: 35,

    description: "",

    image: "images/hole1.jpg"

  },

  {

    number: 2,

    par: 2,

    distance: 27,

    description: "",

    image: "images/hole2.jpg"

  },

  {

    number: 3,

    par: 4,

    distance: 126,

    description: "",

    image: "images/hole3.jpg"

  },

  {

    number: 4,

    par: 3,

    distance: 52,

    description: "",

    image: "images/hole4.jpg"

  },

  {

    number: 5,

    par: 3,

    distance: 78,

    description: "",

    image: "images/hole5.jpg"

  },

  {

    number: 6,

    par: 3,

    distance: 90,

    description: "",

    image: "images/hole6.jpg"

  },

  {

    number: 7,

    par: 2,

    distance: 38,

    description: "",

    image: "images/hole7.jpg"

  }

];

const state = {
  view: "home",
  players: ["Spelare 1"],
  currentHole: 0,
  scores: [],
  deferredPrompt: null
};

const views = {
  home: document.querySelector("#homeView"),
  guide: document.querySelector("#guideView"),
  round: document.querySelector("#roundView"),
  history: document.querySelector("#historyView"),
  more: document.querySelector("#moreView")
};

const holeList = document.querySelector("#holeList");
const holeDialog = document.querySelector("#holeDialog");
const holeDialogContent = document.querySelector("#holeDialogContent");
const playerInputs = document.querySelector("#playerInputs");
const roundSetup = document.querySelector("#roundSetup");
const scorecard = document.querySelector("#scorecard");
const roundResult = document.querySelector("#roundResult");
const scorePlayers = document.querySelector("#scorePlayers");

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, c => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
  })[c]);
}

function navigate(view) {
  state.view = view;
  Object.entries(views).forEach(([key, element]) => element.classList.toggle("active", key === view));
  document.querySelectorAll("[data-nav]").forEach(button => button.classList.toggle("active", button.dataset.nav === view));
  if (view === "history") renderHistory();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function renderGuide() {
  holeList.innerHTML = holes.map(hole => `
    <button class="hole-card" data-hole="${hole.number}">
      <img src="${hole.image}" alt="Karta för hål ${hole.number}">
      <div class="hole-card-body">
        <div class="hole-card-title">
          <h3>Hål ${hole.number}</h3>
          <span class="pill">Par ${hole.par} · ${hole.length} m</span>
        </div>
        <p>${hole.description}</p>
      </div>
    </button>
  `).join("");
}

function openHole(number) {
  const hole = holes.find(item => item.number === number);
  if (!hole) return;
  holeDialogContent.innerHTML = `
    <img class="dialog-image" src="${hole.image}" alt="Karta för hål ${hole.number}">
    <div class="dialog-body">
      <span class="pill">HÅL ${hole.number}</span>
      <h2>Par ${hole.par} · ${hole.length} meter</h2>
      <div class="dialog-facts">
        <div><strong>${hole.number}</strong><span>Hål</span></div>
        <div><strong>${hole.par}</strong><span>Par</span></div>
        <div><strong>${hole.length} m</strong><span>Längd</span></div>
      </div>
      <h3>Hålbeskrivning</h3>
      <p>${hole.description}</p>
      <h3>Speltips</h3>
      <p>${hole.tip}</p>
    </div>
  `;
  holeDialog.showModal();
}

function renderPlayerInputs() {
  playerInputs.innerHTML = state.players.map((name, index) => `
    <div class="player-row">
      <input type="text" value="${escapeHtml(name)}" maxlength="24"
             aria-label="Namn på spelare ${index + 1}" data-player-index="${index}">
      ${state.players.length > 1 ? `<button class="remove-player" data-remove-player="${index}" aria-label="Ta bort spelare">×</button>` : ""}
    </div>
  `).join("");
}

function resetRound() {
  state.players = ["Spelare 1"];
  state.currentHole = 0;
  state.scores = [];
  roundSetup.classList.remove("hidden");
  scorecard.classList.add("hidden");
  roundResult.classList.add("hidden");
  renderPlayerInputs();
}

function startRound() {
  const names = [...document.querySelectorAll("[data-player-index]")]
    .map((input, i) => input.value.trim() || `Spelare ${i + 1}`);
  state.players = names;
  state.scores = names.map(() => holes.map(hole => hole.par));
  state.currentHole = 0;
  roundSetup.classList.add("hidden");
  roundResult.classList.add("hidden");
  scorecard.classList.remove("hidden");
  renderScorecard();
}

function renderScorecard() {
  const hole = holes[state.currentHole];
  document.querySelector("#scoreHoleTitle").textContent = `Hål ${hole.number}`;
  document.querySelector("#scoreHoleMeta").textContent = `Par ${hole.par} · ${hole.length} m`;
  document.querySelector("#scoreHoleDescription").textContent = hole.description;
  document.querySelector("#scoreHoleImage").src = hole.image;
  document.querySelector("#scoreHoleImage").alt = `Karta för hål ${hole.number}`;

  scorePlayers.innerHTML = state.players.map((player, playerIndex) => {
    const total = state.scores[playerIndex].slice(0, state.currentHole + 1).reduce((a,b) => a+b, 0);
    const parToHere = holes.slice(0, state.currentHole + 1).reduce((a,h) => a+h.par, 0);
    const relative = total - parToHere;
    return `
      <article class="score-player">
        <div>
          <strong>${escapeHtml(player)}</strong>
          <small>${relative === 0 ? "E" : relative > 0 ? `+${relative}` : relative} efter hål ${hole.number}</small>
        </div>
        <div class="counter">
          <button data-score-minus="${playerIndex}" aria-label="Minska antal kast">−</button>
          <strong>${state.scores[playerIndex][state.currentHole]}</strong>
          <button data-score-plus="${playerIndex}" aria-label="Öka antal kast">+</button>
        </div>
      </article>
    `;
  }).join("");

  document.querySelector("#previousHoleButton").disabled = state.currentHole === 0;
  document.querySelector("#nextHoleButton").textContent =
    state.currentHole === holes.length - 1 ? "Avsluta rundan" : "Nästa hål →";
}

function changeScore(playerIndex, amount) {
  const current = state.scores[playerIndex][state.currentHole];
  state.scores[playerIndex][state.currentHole] = Math.max(1, current + amount);
  renderScorecard();
}

function nextHole() {
  if (state.currentHole < holes.length - 1) {
    state.currentHole += 1;
    renderScorecard();
    window.scrollTo({ top: 0, behavior: "smooth" });
  } else {
    finishRound();
  }
}

function finishRound() {
  const totalPar = holes.reduce((sum, hole) => sum + hole.par, 0);
  const results = state.players.map((name, playerIndex) => {
    const total = state.scores[playerIndex].reduce((a,b) => a+b, 0);
    return { name, total, relative: total - totalPar, scores: state.scores[playerIndex] };
  }).sort((a,b) => a.total - b.total);

  const round = { date: new Date().toISOString(), totalPar, results };
  const history = getHistory();
  history.unshift(round);
  localStorage.setItem("nvdiscgolf-history", JSON.stringify(history.slice(0, 50)));

  scorecard.classList.add("hidden");
  roundResult.classList.remove("hidden");
  roundResult.innerHTML = `
    <article class="result-card">
      <p class="eyebrow">RUNDAN ÄR KLAR</p>
      <h2>${escapeHtml(results[0].name)} vinner! 🏆</h2>
      ${results.map((result, index) => `
        <div class="result-row">
          <span>${index + 1}. <strong>${escapeHtml(result.name)}</strong></span>
          <span>${result.total} kast · ${result.relative === 0 ? "E" : result.relative > 0 ? `+${result.relative}` : result.relative}</span>
        </div>
      `).join("")}
      <button class="primary" style="width:100%;margin-top:16px" data-action="new-round">Spela en ny runda</button>
    </article>
  `;
}

function getHistory() {
  try {
    return JSON.parse(localStorage.getItem("nvdiscgolf-history")) || [];
  } catch {
    return [];
  }
}

function renderHistory() {
  const history = getHistory();
  const list = document.querySelector("#historyList");
  const clearButton = document.querySelector("#clearHistoryButton");
  if (!history.length) {
    list.innerHTML = `<div class="empty">Ingen sparad runda ännu.</div>`;
    clearButton.classList.add("hidden");
    return;
  }
  clearButton.classList.remove("hidden");
  list.innerHTML = history.map(round => {
    const date = new Intl.DateTimeFormat("sv-SE", { dateStyle:"medium", timeStyle:"short" }).format(new Date(round.date));
    return `
      <article class="history-card">
        <header><strong>Norra Vare</strong><time>${date}</time></header>
        ${round.results.map(result => `
          <div class="history-player">
            <span>${escapeHtml(result.name)}</span>
            <strong>${result.total} · ${result.relative === 0 ? "E" : result.relative > 0 ? `+${result.relative}` : result.relative}</strong>
          </div>
        `).join("")}
      </article>
    `;
  }).join("");
}

document.addEventListener("click", event => {
  const navButton = event.target.closest("[data-nav]");
  if (navButton) navigate(navButton.dataset.nav);

  const newRoundButton = event.target.closest('[data-action="new-round"]');
  if (newRoundButton) { resetRound(); navigate("round"); }

  const holeCard = event.target.closest("[data-hole]");
  if (holeCard) openHole(Number(holeCard.dataset.hole));

  const removeButton = event.target.closest("[data-remove-player]");
  if (removeButton) {
    state.players.splice(Number(removeButton.dataset.removePlayer), 1);
    renderPlayerInputs();
  }

  const minus = event.target.closest("[data-score-minus]");
  if (minus) changeScore(Number(minus.dataset.scoreMinus), -1);
  const plus = event.target.closest("[data-score-plus]");
  if (plus) changeScore(Number(plus.dataset.scorePlus), 1);
});

document.querySelector("#addPlayerButton").addEventListener("click", () => {
  state.players = [...document.querySelectorAll("[data-player-index]")].map(input => input.value);
  if (state.players.length < 6) {
    state.players.push(`Spelare ${state.players.length + 1}`);
    renderPlayerInputs();
  }
});
document.querySelector("#startRoundButton").addEventListener("click", startRound);
document.querySelector("#previousHoleButton").addEventListener("click", () => {
  if (state.currentHole > 0) { state.currentHole -= 1; renderScorecard(); }
});
document.querySelector("#nextHoleButton").addEventListener("click", nextHole);
document.querySelector("#cancelRoundButton").addEventListener("click", () => {
  if (confirm("Vill du avbryta rundan?")) resetRound();
});
document.querySelector("#openHoleInfoButton").addEventListener("click", () => openHole(holes[state.currentHole].number));
document.querySelector("#closeHoleDialog").addEventListener("click", () => holeDialog.close());
document.querySelector("#clearHistoryButton").addEventListener("click", () => {
  if (confirm("Vill du radera all sparad historik?")) {
    localStorage.removeItem("nvdiscgolf-history");
    renderHistory();
  }
});

window.addEventListener("beforeinstallprompt", event => {
  event.preventDefault();
  state.deferredPrompt = event;
  document.querySelector("#installButton").classList.remove("hidden");
});
document.querySelector("#installButton").addEventListener("click", async () => {
  if (!state.deferredPrompt) return;
  state.deferredPrompt.prompt();
  await state.deferredPrompt.userChoice;
  state.deferredPrompt = null;
  document.querySelector("#installButton").classList.add("hidden");
});

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => navigator.serviceWorker.register("sw.js"));
}

document.querySelector("#courseHoleCount").textContent = holes.length;
document.querySelector("#coursePar").textContent = holes.reduce((sum,hole) => sum + hole.par, 0);
document.querySelector("#courseLength").textContent = `${holes.reduce((sum,hole) => sum + hole.length, 0)} m`;
renderGuide();
renderPlayerInputs();
