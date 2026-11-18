import { Game } from "./game.js";
import { Renderer } from "./render.js";
import { Input } from "./input.js";
import { Sfx } from "./audio.js";
import { toFa } from "./utils.js";

const $ = (sel) => document.querySelector(sel);
const canvas = $("#game");
const ctx = canvas.getContext("2d", { alpha: false });
const frame = $("#frame");
const stage = $("#stage");
const ui = $("#ui");

const sfx = new Sfx();
const input = new Input();
const renderer = new Renderer();
const game = new Game(canvas, sfx, input);

const screens = {
  menu: $("#menu-screen"),
  pause: $("#pause-screen"),
  result: $("#result-screen"),
};
const touchControls = $("#touch-controls");
const rotateHint = $("#rotate-hint");

const isTouch =
  "ontouchstart" in window ||
  (navigator.maxTouchPoints || 0) > 0 ||
  window.matchMedia("(pointer: coarse)").matches;
document.body.classList.toggle("touch-device", isTouch);

let mode = "pvp";
let muted = localStorage.getItem("dos-muted") === "1";
sfx.setMuted(muted);
$("#btn-sound").setAttribute("aria-pressed", String(muted));

for (const f of game.fighters) {
  f._shown = f.health;
}

// ---------------- Screen helpers ----------------
function showScreen(name) {
  for (const [key, el] of Object.entries(screens)) {
    el.hidden = key !== name;
  }
}
function hideAllScreens() {
  for (const el of Object.values(screens)) el.hidden = true;
}
function setTouchVisible(visible) {
  touchControls.hidden = !visible || !isTouch;
  if (visible && isTouch) {
    touchControls.classList.toggle("cpu-mode", mode === "cpu");
  }
  updateRotateHint();
}

function updateRotateHint() {
  const portrait = window.innerHeight > window.innerWidth;
  const playing =
    !touchControls.hidden &&
    screens.pause.hidden &&
    screens.result.hidden &&
    game.state !== "menu";
  rotateHint.hidden = !(isTouch && portrait && playing);
}

/** Ask phones held upright to rotate into the natural landscape view. */
function requestMobileLandscape() {
  if (!isTouch || window.innerWidth >= window.innerHeight) return;
  const root = document.documentElement;
  if (!root.requestFullscreen || document.fullscreenElement) return;
  root
    .requestFullscreen({ navigationUI: "hide" })
    .then(() => screen.orientation?.lock?.("landscape") ?? null)
    .catch(() => {});
}

// ---------------- Menu wiring ----------------
document.querySelectorAll(".mode").forEach((btn) => {
  btn.addEventListener("click", () => {
    mode = btn.dataset.mode;
    game.setMode(mode);
    document.querySelectorAll(".mode").forEach((b) => {
      b.classList.toggle("active", b === btn);
      b.setAttribute("aria-pressed", String(b === btn));
    });
    sfx.ui();
    btn.blur();
    if (!touchControls.hidden) touchControls.classList.toggle("cpu-mode", mode === "cpu");
  });
});

$("#btn-controls").addEventListener("click", () => {
  const panel = $("#controls-panel");
  panel.hidden = !panel.hidden;
  $("#btn-controls").textContent = panel.hidden ? "راهنمای کنترل‌ها" : "بستن راهنما";
  sfx.resume();
  sfx.ui();
  $("#btn-controls").blur();
});

$("#btn-start").addEventListener("click", () => startMatch());
$("#btn-start").addEventListener("pointerenter", () => sfx.resume(), { once: true });

function startMatch() {
  sfx.resume();
  sfx.select();
  hideAllScreens();
  requestMobileLandscape();
  game.setMode(mode);
  game.startMatch(mode);
  setTouchVisible(true);
  input.clear();
  document.activeElement?.blur?.();
}

$("#btn-sound").addEventListener("click", (e) => {
  muted = !muted;
  sfx.resume();
  sfx.setMuted(muted);
  localStorage.setItem("dos-muted", muted ? "1" : "0");
  $("#btn-sound").setAttribute("aria-pressed", String(muted));
  if (!muted) sfx.ui();
  e.currentTarget.blur();
});

$("#btn-touch-pause").addEventListener("click", () => togglePause());

// ---------------- Pause ----------------
function togglePause() {
  if (!game.isPlaying) return;
  const nowPaused = game.togglePause();
  screens.pause.hidden = !nowPaused;
  if (nowPaused) {
    sfx.ui();
    setTouchVisible(false);
  } else {
    setTouchVisible(true);
    input.clear();
  }
}
$("#btn-resume").addEventListener("click", () => {
  game.setPaused(false);
  screens.pause.hidden = true;
  setTouchVisible(true);
  input.clear();
  document.activeElement?.blur?.();
});
$("#btn-restart").addEventListener("click", () => {
  screens.pause.hidden = true;
  hideAllScreens();
  requestMobileLandscape();
  game.startMatch(mode);
  setTouchVisible(true);
});
$("#btn-quit").addEventListener("click", () => {
  screens.pause.hidden = true;
  goMenu();
});

function goMenu() {
  hideAllScreens();
  showScreen("menu");
  game.resetToMenu();
  setTouchVisible(false);
  input.clear();
  if (document.fullscreenElement) {
    document.exitFullscreen?.()?.catch?.(() => {});
  }
}

$("#btn-rematch").addEventListener("click", () => {
  $("#result-screen").hidden = true;
  requestMobileLandscape();
  game.startMatch(mode);
  setTouchVisible(true);
});
$("#btn-result-menu").addEventListener("click", () => goMenu());

// ---------------- Match end ----------------
game.onMatchEnd = ({ winner, score }) => {
  const title = $("#result-title");
  const sub = $("#result-sub");
  const scoreEl = $("#result-score");
  title.textContent = `${winner.palette.name} برنده میدان شد`;
  title.style.color = winner.palette.secondary;
  title.style.textShadow = `0 0 34px ${winner.palette.glow}55`;
  sub.textContent = `نتیجه نهایی ${toFa(score[0])} — ${toFa(score[1])}`;
  scoreEl.innerHTML = "";
  for (let p = 0; p < 2; p++) {
    const group = document.createElement("div");
    group.className = `score-side ${p === 0 ? "p1" : "p2"}`;
    const name = document.createElement("span");
    name.className = "score-name";
    name.textContent = game.fighters[p].palette.name;
    const row = document.createElement("div");
    row.className = "score-pips";
    const wins = p === 0 ? score[0] : score[1];
    for (let i = 0; i < 2; i++) {
      const pip = document.createElement("span");
      pip.className = "score-pip";
      if (i < wins) pip.classList.add("win", p === 0 ? "p1" : "p2");
      row.appendChild(pip);
    }
    group.append(name, row);
    scoreEl.appendChild(group);
  }
  screens.result.hidden = false;
  setTouchVisible(false);
  sfx.select();
};

// ---------------- Keyboard shortcuts ----------------
window.addEventListener("keydown", (e) => {
  if (e.code === "Escape" || e.code === "KeyP") {
    if (game.isPlaying) {
      e.preventDefault();
      togglePause();
    }
  } else if (e.code === "KeyM") {
    if (e.repeat) return;
    $("#btn-sound").click();
  } else if (e.code === "Enter" || e.code === "Space") {
    if (game.state === "menu") {
      e.preventDefault();
      startMatch();
    } else if (!screens.result.hidden) {
      e.preventDefault();
      $("#btn-rematch").click();
    }
  }
});

// ---------------- Touch / pointer ----------------
input.bindTouch(touchControls);

document.addEventListener(
  "pointerdown",
  (e) => {
    if (e.target.closest("button")) return;
    if (game.state === "menu" && !e.target.closest(".screen")) startMatch();
  },
  { passive: true }
);

// Unlock audio on first interaction.
const unlock = () => {
  sfx.resume();
  window.removeEventListener("pointerdown", unlock);
  window.removeEventListener("keydown", unlock);
};
window.addEventListener("pointerdown", unlock);
window.addEventListener("keydown", unlock);

// Pause when tab is hidden.
document.addEventListener("visibilitychange", () => {
  if (document.hidden && game.state === "fight") {
    game.setPaused(true);
    screens.pause.hidden = false;
    setTouchVisible(false);
  }
});

// ---------------- Responsive canvas ----------------
function resize() {
  const rect = stage.getBoundingClientRect();
  const dpr = Math.min(window.devicePixelRatio || 1, 1.75, 2200 / Math.max(1, rect.width));
  const w = Math.max(640, Math.round(rect.width * dpr));
  const h = Math.round(w * (9 / 16));
  if (canvas.width !== w || canvas.height !== h) {
    canvas.width = w;
    canvas.height = h;
  }
  updateRotateHint();
}
window.addEventListener("resize", resize);
window.addEventListener("orientationchange", () => setTimeout(resize, 250));
document.addEventListener("fullscreenchange", () => setTimeout(resize, 250));
resize();

// ---------------- Main loop ----------------
const STEP = 1 / 60;
let acc = 0;
let last = performance.now();

const touchMeterButtons = [0, 1].map((id) => {
  const side = touchControls.querySelector(`.touch-side.p${id + 1}`);
  return {
    id,
    special: side?.querySelector(".abtn.a3"),
    super: side?.querySelector(".abtn.a4"),
  };
});

function syncTouchMeter() {
  for (const rec of touchMeterButtons) {
    const f = game.fighters[rec.id];
    if (!f) continue;
    rec.special?.classList.toggle("locked", f.meter < 25);
    rec.super?.classList.toggle("locked", f.meter < 100);
    rec.super?.classList.toggle("ready", f.meter >= 100);
  }
}

function frameLoop(now) {
  const elapsed = Math.min(0.1, (now - last) / 1000);
  last = now;
  acc += elapsed;
  let guard = 0;
  while (acc >= STEP && guard < 6) {
    game.update(STEP);
    acc -= STEP;
    guard++;
  }
  if (guard >= 6) acc = 0;

  ctx.setTransform(canvas.width / 1280, 0, 0, canvas.height / 720, 0, 0);
  renderer.render(ctx, game);
  syncTouchMeter();

  requestAnimationFrame(frameLoop);
}

document.fonts?.ready.finally(() => {
  resize();
});

requestAnimationFrame(frameLoop);
window.__game = game;
window.__renderer = renderer;
