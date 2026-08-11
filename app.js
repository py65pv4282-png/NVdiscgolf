const holes = [
  {
    number: 1,
    par: 2,
    length: 35,
    description: "",
    image: "Hål1.jpg"
  },
  {
    number: 2,
    par: 2,
    length: 27,
    description: "",
    image: "Hål2.jpg"
  },
  {
    number: 3,
    par: 4,
    length: 126,
    description: "",
    image: "Hål3.heic"
  },
  {
    number: 4,
    par: 3,
    length: 52,
    description: "",
    image: "Hål4.jpg"
  },
  {
    number: 5,
    par: 3,
    length: 78,
    description: "",
    image: "Hål5.jpg"
  },
  {
    number: 6,
    par: 3,
    length: 90,
    description: "",
    image: "Hål6.jpg"
  },
  {
    number: 7,
    par: 2,
    length: 38,
    description: "",
    image: "Hål7.jpg"
  }
];

const state = {
  view: "home",
  players: [""],
  currentHole: 0,
  scores: [],
  playOrder: [0],
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
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  })[c]);
}

function navigate(view) {
  state.view = view;

  Object.entries(views).forEach(([key, element]) =>
    element.classList.toggle("active", key === view)
  );

  document.querySelectorAll("[data-nav]").forEach(button =>
    button.classList.toggle("active", button.dataset.nav === view)
  );

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
        <div>
          <strong>${hole.number}</strong>
          <span>Hål</span>
        </div>

        <div>
          <strong>${hole.par}</strong>
          <span>Par</span>
        </div>

        <div>
          <strong>${hole.length} m</strong>
          <span>Längd</span>
        </div>
      </div>

      <h3>Hålbeskrivning</h3>
      <p>${hole.description || ""}</p>

      <h3>Speltips</h3>
      <p>${hole.tip || ""}</p>
    </div>
  `;

  holeDialog.showModal();
}


/* =========================
   SPELARE / NAMNFÄLT
   ========================= */

function renderPlayerInputs() {
  playerInputs.innerHTML = state.players.map((name, index) => `
    <div class="player-row">
      <div class="player-input-wrap">
        <input
          type="text"
          value="${escapeHtml(name)}"
          placeholder="Spelare ${index + 1}"
          maxlength="24"
          autocomplete="off"
          aria-label="Namn på spelare ${index + 1}"
          data-player-index="${index}"
        >

        <button
          type="button"
          class="clear-player-name"
          data-clear-player="${index}"
          aria-label="Rensa namn"
          title="Rensa namn"
        >×</button>
      </div>

      ${state.players.length > 1 ? `
        <button
          type="button"
          class="remove-player"
          data-remove-player="${index}"
          aria-label="Ta bort spelare"
          title="Ta bort spelare"
        >−</button>
      ` : ""}
    </div>
  `).join("");

  createShuffleButton();
}


/* =========================
   SLUMPA STARTORDNING
   ========================= */

function createShuffleButton() {
  if (document.querySelector("#shufflePlayersButton")) return;

  const startButton = document.querySelector("#startRoundButton");

  if (!startButton) return;

  const button = document.createElement("button");

  button.id = "shufflePlayersButton";
  button.type = "button";
  button.className = "secondary";
  button.style.width = "100%";
  button.style.marginBottom = "10px";
  button.textContent = "🎲 Slumpa startordning";

  startButton.parentNode.insertBefore(button, startButton);
}

function saveCurrentPlayerNames() {
  state.players = [...document.querySelectorAll("[data-player-index]")]
    .map(input => input.value);
}

function shufflePlayers() {
  saveCurrentPlayerNames();

  for (let i = state.players.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));

    [state.players[i], state.players[j]] =
      [state.players[j], state.players[i]];
  }

  renderPlayerInputs();
}


/* =========================
   SPELRUNDA
   ========================= */

function resetRound() {
  state.players = [""];
  state.currentHole = 0;
  state.scores = [];
  state.playOrder = [0];

  roundSetup.classList.remove("hidden");
  scorecard.classList.add("hidden");
  roundResult.classList.add("hidden");

  renderPlayerInputs();
}

function startRound() {
  const names = [...document.querySelectorAll("[data-player-index]")]
    .map((input, i) => input.value.trim() || `Spelare ${i + 1}`);

  state.players = names;

  state.scores = names.map(() =>
    holes.map(hole => hole.par)
  );

  /*
    playOrder innehåller spelarnas riktiga index.
    På hål 1 används den ordning de står i vid start.
  */
  state.playOrder = names.map((_, index) => index);

  state.currentHole = 0;

  roundSetup.classList.add("hidden");
  roundResult.classList.add("hidden");
  scorecard.classList.remove("hidden");

  renderScorecard();
}


/* =========================
   AUTOMATISK KASTORDNING
   ========================= */

function calculatePlayOrder() {
  /*
    Hål 1:
    använd den startordning som redan finns.
  */
  if (state.currentHole === 0) {
    return [...state.playOrder];
  }

  const previousHole = state.currentHole - 1;

  /*
    Gamla ordningen används som sista tie-breaker.
    Då hoppar inte spelare runt om allt annat är lika.
  */
  const oldOrderPosition = {};

  state.playOrder.forEach((playerIndex, position) => {
    oldOrderPosition[playerIndex] = position;
  });

  const order = state.players.map((_, index) => index);

  order.sort((a, b) => {
    /*
      Totalresultat fram till och med föregående hål.
    */
    const totalA = state.scores[a]
      .slice(0, state.currentHole)
      .reduce((sum, score) => sum + score, 0);

    const totalB = state.scores[b]
      .slice(0, state.currentHole)
      .reduce((sum, score) => sum + score, 0);

    /*
      Lägst totalresultat går först.
    */
    if (totalA !== totalB) {
      return totalA - totalB;
    }

    /*
      Vid lika totalt:
      bäst resultat på föregående hål går först.
    */
    const previousScoreA = state.scores[a][previousHole];
    const previousScoreB = state.scores[b][previousHole];

    if (previousScoreA !== previousScoreB) {
      return previousScoreA - previousScoreB;
    }

    /*
      Fortfarande lika:
      behåll tidigare inbördes ordning.
    */
    return oldOrderPosition[a] - oldOrderPosition[b];
  });

  return order;
}

function updatePlayOrder() {
  state.playOrder = calculatePlayOrder();
}


/* =========================
   SCORECARD
   ========================= */

function renderScorecard() {
  const hole = holes[state.currentHole];

  document.querySelector("#scoreHoleTitle").textContent =
    `Hål ${hole.number}`;

  document.querySelector("#scoreHoleMeta").textContent =
    `Par ${hole.par} · ${hole.length} m`;

  document.querySelector("#scoreHoleDescription").textContent =
    hole.description;

  document.querySelector("#scoreHoleImage").src =
    hole.image;

  document.querySelector("#scoreHoleImage").alt =
    `Karta för hål ${hole.number}`;

  /*
    Visa spelarna i aktuell kastordning.
    Viktigt: playerIndex är fortfarande spelarens riktiga index,
    så poängen hamnar alltid på rätt person.
  */
  scorePlayers.innerHTML = state.playOrder.map((playerIndex, orderIndex) => {
    const player = state.players[playerIndex];

    /*
      Visad total inkluderar aktuellt håls poäng.
    */
    const total = state.scores[playerIndex]
      .slice(0, state.currentHole + 1)
      .reduce((a, b) => a + b, 0);

    const parToHere = holes
      .slice(0, state.currentHole + 1)
      .reduce((a, h) => a + h.par, 0);

    const relative = total - parToHere;

    return `
      <article class="score-player">

        <div>
          <strong>
            ${orderIndex + 1}. ${escapeHtml(player)}
          </strong>

          <small>
            ${relative === 0
              ? "E"
              : relative > 0
                ? `+${relative}`
                : relative
            } efter hål ${hole.number}
          </small>
        </div>

        <div class="counter">
          <button
            data-score-minus="${playerIndex}"
            aria-label="Minska antal kast"
          >−</button>

          <strong>
            ${state.scores[playerIndex][state.currentHole]}
          </strong>

          <button
            data-score-plus="${playerIndex}"
            aria-label="Öka antal kast"
          >+</button>
        </div>

      </article>
    `;
  }).join("");

  document.querySelector("#previousHoleButton").disabled =
    state.currentHole === 0;

  document.querySelector("#nextHoleButton").textContent =
    state.currentHole === holes.length - 1
      ? "Avsluta rundan"
      : "Nästa hål →";
}

function changeScore(playerIndex, amount) {
  const current =
    state.scores[playerIndex][state.currentHole];

  state.scores[playerIndex][state.currentHole] =
    Math.max(1, current + amount);

  /*
    Vi sorterar INTE om mitt under aktuellt hål.
    Annars skulle spelarna hoppa upp och ner medan
    man trycker + och −.
  */
  renderScorecard();
}


/* =========================
   NÄSTA / FÖREGÅENDE HÅL
   ========================= */

function nextHole() {
  if (state.currentHole < holes.length - 1) {

    state.currentHole += 1;

    /*
      När vi går till nästa hål räknas ny kastordning ut
      från resultaten på avslutade hål.
    */
    updatePlayOrder();

    renderScorecard();

    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });

  } else {
    finishRound();
  }
}


/* =========================
   AVSLUTA RUNDA
   ========================= */

function finishRound() {
  const totalPar = holes.reduce(
    (sum, hole) => sum + hole.par,
    0
  );

  const results = state.players
    .map((name, playerIndex) => {

      const total = state.scores[playerIndex]
        .reduce((a, b) => a + b, 0);

      return {
        name,
        total,
        relative: total - totalPar,
        scores: state.scores[playerIndex]
      };
    })
    .sort((a, b) => a.total - b.total);

  const round = {
    date: new Date().toISOString(),
    totalPar,
    results
  };

  const history = getHistory();

  history.unshift(round);

  localStorage.setItem(
    "nvdiscgolf-history",
    JSON.stringify(history.slice(0, 50))
  );

  scorecard.classList.add("hidden");
  roundResult.classList.remove("hidden");

  roundResult.innerHTML = `
    <article class="result-card">

      <p class="eyebrow">RUNDAN ÄR KLAR</p>

      <h2>
        ${escapeHtml(results[0].name)} vinner! 🏆
      </h2>

      ${results.map((result, index) => `
        <div class="result-row">

          <span>
            ${index + 1}.
            <strong>${escapeHtml(result.name)}</strong>
          </span>

          <span>
            ${result.total} kast ·
            ${result.relative === 0
              ? "E"
              : result.relative > 0
                ? `+${result.relative}`
                : result.relative
            }
          </span>

        </div>
      `).join("")}

      <button
        class="primary"
        style="width:100%;margin-top:16px"
        data-action="new-round"
      >
        Spela en ny runda
      </button>

    </article>
  `;
}


/* =========================
   HISTORIK
   ========================= */

function getHistory() {
  try {
    return JSON.parse(
      localStorage.getItem("nvdiscgolf-history")
    ) || [];
  } catch {
    return [];
  }
}

function renderHistory() {
  const history = getHistory();
  const list = document.querySelector("#historyList");
  const clearButton =
    document.querySelector("#clearHistoryButton");

  if (!history.length) {
    list.innerHTML =
      `<div class="empty">Ingen sparad runda ännu.</div>`;

    clearButton.classList.add("hidden");
    return;
  }

  clearButton.classList.remove("hidden");

  list.innerHTML = history.map(round => {

    const date = new Intl.DateTimeFormat("sv-SE", {
      dateStyle: "medium",
      timeStyle: "short"
    }).format(new Date(round.date));

    return `
      <article class="history-card">

        <header>
          <strong>Norra Vare</strong>
          <time>${date}</time>
        </header>

        ${round.results.map(result => `
          <div class="history-player">

            <span>
              ${escapeHtml(result.name)}
            </span>

            <strong>
              ${result.total} ·
              ${result.relative === 0
                ? "E"
                : result.relative > 0
                  ? `+${result.relative}`
                  : result.relative
              }
            </strong>

          </div>
        `).join("")}

      </article>
    `;
  }).join("");
}


/* =========================
   KLICKHANTERING
   ========================= */

document.addEventListener("click", event => {

  const navButton =
    event.target.closest("[data-nav]");

  if (navButton) {
    navigate(navButton.dataset.nav);
  }


  const newRoundButton =
    event.target.closest('[data-action="new-round"]');

  if (newRoundButton) {
    resetRound();
    navigate("round");
  }


  const holeCard =
    event.target.closest("[data-hole]");

  if (holeCard) {
    openHole(Number(holeCard.dataset.hole));
  }


  /*
    Rensa bara namnet.
  */
  const clearButton =
    event.target.closest("[data-clear-player]");

  if (clearButton) {
    const index =
      Number(clearButton.dataset.clearPlayer);

    const input =
      document.querySelector(
        `[data-player-index="${index}"]`
      );

    if (input) {
      input.value = "";
      state.players[index] = "";
      input.focus();
    }
  }


  /*
    Ta bort hela spelaren.
  */
  const removeButton =
    event.target.closest("[data-remove-player]");

  if (removeButton) {
    saveCurrentPlayerNames();

    state.players.splice(
      Number(removeButton.dataset.removePlayer),
      1
    );

    renderPlayerInputs();
  }


  const minus =
    event.target.closest("[data-score-minus]");

  if (minus) {
    changeScore(
      Number(minus.dataset.scoreMinus),
      -1
    );
  }


  const plus =
    event.target.closest("[data-score-plus]");

  if (plus) {
    changeScore(
      Number(plus.dataset.scorePlus),
      1
    );
  }


  /*
    Slumpa spelarna.
  */
  const shuffleButton =
    event.target.closest("#shufflePlayersButton");

  if (shuffleButton) {
    shufflePlayers();
  }
});


/* =========================
   LÄGG TILL SPELARE
   ========================= */

document
  .querySelector("#addPlayerButton")
  .addEventListener("click", () => {

    saveCurrentPlayerNames();

    if (state.players.length < 6) {
      state.players.push("");
      renderPlayerInputs();
    }
  });


/* =========================
   RUNDA-KNAPPAR
   ========================= */

document
  .querySelector("#startRoundButton")
  .addEventListener("click", startRound);


document
  .querySelector("#previousHoleButton")
  .addEventListener("click", () => {

    if (state.currentHole > 0) {

      state.currentHole -= 1;

      /*
        Räkna om ordningen även när man går tillbaka.
      */
      updatePlayOrder();

      renderScorecard();
    }
  });


document
  .querySelector("#nextHoleButton")
  .addEventListener("click", nextHole);


document
  .querySelector("#cancelRoundButton")
  .addEventListener("click", () => {

    if (confirm("Vill du avbryta rundan?")) {
      resetRound();
    }
  });


document
  .querySelector("#openHoleInfoButton")
  .addEventListener("click", () =>
    openHole(holes[state.currentHole].number)
  );


document
  .querySelector("#closeHoleDialog")
  .addEventListener("click", () =>
    holeDialog.close()
  );


document
  .querySelector("#clearHistoryButton")
  .addEventListener("click", () => {

    if (confirm("Vill du radera all sparad historik?")) {
      localStorage.removeItem(
        "nvdiscgolf-history"
      );

      renderHistory();
    }
  });


/* =========================
   INSTALLATION / PWA
   ========================= */

window.addEventListener(
  "beforeinstallprompt",
  event => {

    event.preventDefault();

    state.deferredPrompt = event;

    document
      .querySelector("#installButton")
      .classList.remove("hidden");
  }
);


document
  .querySelector("#installButton")
  .addEventListener("click", async () => {

    if (!state.deferredPrompt) return;

    state.deferredPrompt.prompt();

    await state.deferredPrompt.userChoice;

    state.deferredPrompt = null;

    document
      .querySelector("#installButton")
      .classList.add("hidden");
  });


if ("serviceWorker" in navigator) {
  window.addEventListener(
    "load",
    () => navigator.serviceWorker.register("sw.js")
  );
}


/* =========================
   BANINFO
   ========================= */

document.querySelector("#courseHoleCount").textContent =
  holes.length;

document.querySelector("#coursePar").textContent =
  holes.reduce(
    (sum, hole) => sum + hole.par,
    0
  );

document.querySelector("#courseLength").textContent =
  `${holes.reduce(
    (sum, hole) => sum + hole.length,
    0
  )} m`;


/* =========================
   START
   ========================= */

renderGuide();
renderPlayerInputs();
