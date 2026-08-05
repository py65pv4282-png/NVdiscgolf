const $ = (id) => document.getElementById(id);
const views = ["setupView", "roundView", "resultView", "historyView"];
let state = null;
let previousView = "setupView";

function showView(id) {
  views.forEach(v => $(v).classList.toggle("active", v === id));
}

function addPlayer(name = "") {
  const tpl = $("playerInputTemplate").content.cloneNode(true);
  const row = tpl.querySelector(".player-input-row");
  const input = row.querySelector("input");
  input.value = name;
  row.querySelector("button").addEventListener("click", () => {
    if (document.querySelectorAll(".player-input-row").length > 1) row.remove();
  });
  $("playersSetup").appendChild(row);
}

function initSetup() {
  $("playersSetup").innerHTML = "";
  addPlayer("Eric");
  addPlayer("");
}

function buildRound() {
  const names = [...document.querySelectorAll(".player-name-input")]
    .map(i => i.value.trim())
    .filter(Boolean);
  if (!names.length) return alert("Lägg till minst en spelare.");
  const holes = Number($("holeCount").value);
  const par = Number($("defaultPar").value);
  state = {
    course: $("courseName").value.trim() || "Hemmabanan",
    date: new Date().toISOString(),
    currentHole: 0,
    pars: Array(holes).fill(par),
    players: names.map(name => ({ name, scores: Array(holes).fill(par) }))
  };
  renderHole();
  showView("roundView");
}

function relative(n) { return n === 0 ? "E" : n > 0 ? `+${n}` : String(n); }
function playerTotal(player) { return player.scores.reduce((a,b) => a+b, 0); }
function totalPar() { return state.pars.reduce((a,b) => a+b, 0); }

function renderHole() {
  const h = state.currentHole;
  $("roundCourse").textContent = state.course;
  $("holeTitle").textContent = `Hål ${h + 1} av ${state.pars.length}`;
  $("parValue").textContent = state.pars[h];
  $("prevHoleBtn").disabled = h === 0;
  $("nextHoleBtn").textContent = h === state.pars.length - 1 ? "Visa resultat" : "Nästa →";
  const wrap = $("scoreCards");
  wrap.innerHTML = "";
  state.players.forEach((player, idx) => {
    const card = document.createElement("article");
    card.className = "score-card";
    const totalRel = player.scores.slice(0, h + 1).reduce((sum, s, i) => sum + s - state.pars[i], 0);
    card.innerHTML = `
      <div class="score-name-row">
        <div class="score-name"></div>
        <div class="score-relative">Totalt ${relative(totalRel)}</div>
      </div>
      <div class="score-controls">
        <button class="minus" aria-label="Minska kast">−</button>
        <div class="score-number">${player.scores[h]}</div>
        <button class="plus" aria-label="Öka kast">+</button>
      </div>`;
    card.querySelector(".score-name").textContent = player.name;
    card.querySelector(".minus").addEventListener("click", () => {
      player.scores[h] = Math.max(1, player.scores[h] - 1); renderHole();
    });
    card.querySelector(".plus").addEventListener("click", () => {
      player.scores[h] += 1; renderHole();
    });
    wrap.appendChild(card);
  });
}

function changePar(delta) {
  const h = state.currentHole;
  const old = state.pars[h];
  const next = Math.max(2, Math.min(7, old + delta));
  const diff = next - old;
  state.pars[h] = next;
  state.players.forEach(p => p.scores[h] = Math.max(1, p.scores[h] + diff));
  renderHole();
}

function finishRound() {
  const sorted = [...state.players].sort((a,b) => playerTotal(a)-playerTotal(b));
  const best = playerTotal(sorted[0]);
  const winners = sorted.filter(p => playerTotal(p) === best).map(p => p.name);
  $("winnerText").textContent = winners.length > 1 ? `${winners.join(" & ")} delar segern` : `${winners[0]} vinner!`;
  $("resultMeta").textContent = `${state.course} • ${state.pars.length} hål • Par ${totalPar()}`;
  const board = $("leaderboard");
  board.innerHTML = "";
  sorted.forEach((p, i) => {
    const total = playerTotal(p);
    const row = document.createElement("div");
    row.className = "leader-row";
    row.innerHTML = `<div class="rank">${i+1}</div><div><div class="leader-name"></div><div class="leader-detail">${total} kast</div></div><div class="leader-score">${relative(total-totalPar())}</div>`;
    row.querySelector(".leader-name").textContent = p.name;
    board.appendChild(row);
  });
  saveHistory();
  showView("resultView");
}

function saveHistory() {
  const history = JSON.parse(localStorage.getItem("discgolfHistory") || "[]");
  history.unshift({ ...state, players: state.players.map(p => ({...p})) });
  localStorage.setItem("discgolfHistory", JSON.stringify(history.slice(0, 50)));
}

function renderHistory() {
  const history = JSON.parse(localStorage.getItem("discgolfHistory") || "[]");
  const list = $("historyList");
  list.innerHTML = "";
  if (!history.length) {
    list.innerHTML = '<div class="empty">Ingen sparad runda ännu.</div>';
    return;
  }
  history.forEach(round => {
    const par = round.pars.reduce((a,b) => a+b, 0);
    const sorted = [...round.players].sort((a,b) => a.scores.reduce((x,y)=>x+y,0)-b.scores.reduce((x,y)=>x+y,0));
    const item = document.createElement("article");
    item.className = "history-item";
    const when = new Date(round.date).toLocaleString("sv-SE", { dateStyle: "medium", timeStyle: "short" });
    const lines = sorted.map(p => {
      const total = p.scores.reduce((a,b)=>a+b,0);
      return `${p.name} ${relative(total-par)}`;
    }).join(" • ");
    item.innerHTML = `<h3></h3><p>${when}</p><p>${lines}</p>`;
    item.querySelector("h3").textContent = `${round.course} – ${round.pars.length} hål`;
    list.appendChild(item);
  });
}

async function shareResult() {
  const sorted = [...state.players].sort((a,b) => playerTotal(a)-playerTotal(b));
  const text = `${state.course}\n${sorted.map((p,i) => `${i+1}. ${p.name}: ${playerTotal(p)} kast (${relative(playerTotal(p)-totalPar())})`).join("\n")}`;
  if (navigator.share) {
    try { await navigator.share({ title: "Discgolfresultat", text }); } catch (_) {}
  } else {
    await navigator.clipboard.writeText(text);
    alert("Resultatet är kopierat.");
  }
}

$("addPlayerBtn").addEventListener("click", () => addPlayer(""));
$("startRoundBtn").addEventListener("click", buildRound);
$("parMinus").addEventListener("click", () => changePar(-1));
$("parPlus").addEventListener("click", () => changePar(1));
$("prevHoleBtn").addEventListener("click", () => { state.currentHole--; renderHole(); });
$("nextHoleBtn").addEventListener("click", () => {
  if (state.currentHole === state.pars.length - 1) finishRound();
  else { state.currentHole++; renderHole(); }
});
$("finishRoundBtn").addEventListener("click", finishRound);
$("newRoundBtn").addEventListener("click", () => { initSetup(); showView("setupView"); });
$("shareBtn").addEventListener("click", shareResult);
$("historyBtn").addEventListener("click", () => { previousView = document.querySelector(".view.active").id; renderHistory(); showView("historyView"); });
$("closeHistoryBtn").addEventListener("click", () => showView(previousView));
$("clearHistoryBtn").addEventListener("click", () => {
  if (confirm("Radera all sparad historik?")) { localStorage.removeItem("discgolfHistory"); renderHistory(); }
});

if ("serviceWorker" in navigator) navigator.serviceWorker.register("sw.js").catch(() => {});
initSetup();
