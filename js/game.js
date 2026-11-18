import { Fighter, ATTACKS, GROUND_Y, STAGE_L, STAGE_R } from "./fighter.js";
import { Fx } from "./fx.js";
import { clamp, rand, overlap, lerp } from "./utils.js";

export const W = 1280;
export const H = 720;
const ROUND_TIME = 75;
const ROUNDS_TO_WIN = 2;

export const PALETTES = [
  {
    name: "آتش", latin: "ATASH", sub: "بازیکن ۱",
    primary: "#ff5a36", primary2: "#b9273f", secondary: "#ffb15c",
    dark: "#3a1024", trim: "#ffd27a", hair: "#181020", skin: "#f0b28c",
    glow: "#ff7a45", energy: "#ff8a4c", eye: "#ffe0b0", style: "blaze",
  },
  {
    name: "یخ", latin: "YAKH", sub: "بازیکن ۲",
    primary: "#45d3f7", primary2: "#4c6ef0", secondary: "#b7f4ff",
    dark: "#0a2b4a", trim: "#d6fbff", hair: "#eaf8ff", skin: "#e2bda8",
    glow: "#6fe8ff", energy: "#5be7ff", eye: "#e6ffff", style: "frost",
  },
];

const INPUT_MAP = [
  { left: "KeyA", right: "KeyD", up: "KeyW", down: "KeyS", light: "KeyJ", heavy: "KeyK", special: "KeyL", super: "KeyI" },
  { left: "ArrowLeft", right: "ArrowRight", up: "ArrowUp", down: "ArrowDown", light: "Digit1", heavy: "Digit2", special: "Digit3", super: "Digit4" },
];
const NUMPAD_MAP = [
  null,
  { light: "Numpad1", heavy: "Numpad2", special: "Numpad3", super: "Numpad4" },
];

const emptyIntent = () => ({
  left: false, right: false, down: false,
  upPressed: false, lightPressed: false, heavyPressed: false,
  specialPressed: false, superPressed: false,
});

export class Game {
  constructor(canvas, sfx, input) {
    this.canvas = canvas;
    this.sfx = sfx;
    this.input = input;
    this.fx = new Fx();

    this.state = "menu";
    this.mode = "pvp";
    this.time = 0;
    this.animTime = 0;
    this.stateTime = 0;
    this.round = 1;
    this.timer = ROUND_TIME;
    this.timerMax = ROUND_TIME;
    this.hitstop = 0;
    this.shakeMag = 0;
    this.shakeX = 0;
    this.shakeY = 0;
    this.zoom = 1;
    this.zoomTarget = 1;
    this.flash = { a: 0, color: "#ffffff" };
    this.announcement = null;
    this.projectiles = [];
    this.roundResult = null;
    this.matchWinner = null;
    this.matchEndShown = false;
    this.pausedFrom = null;
    this.meterFlash = null;
    this.showHud = false;

    this.onMatchEnd = null;
    this.onStateChange = null;

    this.fighters = [
      new Fighter(this, 0, 430, 1, PALETTES[0]),
      new Fighter(this, 1, 850, -1, PALETTES[1]),
    ];

    this.cpu = {
      cooldown: 0,
      guard: 0,
      guardCheck: 0,
      lastFoeAttack: null,
      jumpCd: 0,
    };

    this.attractPhase = 0;
  }

  setMode(mode) {
    this.mode = mode;
    if (this.fighters) this.fighters[1].isCpu = mode === "cpu";
  }

  startMatch(mode = this.mode) {
    this.mode = mode;
    this.input.clear();
    this.fx.clear();
    this.projectiles.length = 0;
    this.round = 1;
    this.matchWinner = null;
    this.matchEndShown = false;
    this.roundResult = null;
    this.announcement = null;
    this.flash.a = 0;
    this.zoom = 1;
    this.zoomTarget = 1;
    this.hitstop = 0;
    this.showHud = true;
    this.fighters.forEach((f) => {
      f.resetMatch();
      f.isCpu = f.id === 1 && mode === "cpu";
    });
    this.fighters[1].x = 880;
    this.fighters[1].facing = -1;
    this.fighters[0].x = 400;
    this.fighters[0].facing = 1;
    this.beginRound(true);
    this.onStateChange?.("fight");
  }

  beginRound(first = false) {
    this.state = "intro";
    this.stateTime = 0;
    this.fightAnnounced = false;
    this.roundResult = null;
    this.timer = ROUND_TIME;
    this.projectiles.length = 0;
    this.hitstop = 0;
    this.fx.clear();
    this.fighters.forEach((f) => f.resetRound());
    this.fighters[0].x = 400;
    this.fighters[1].x = 880;
    this.fighters[0].facing = 1;
    this.fighters[1].facing = -1;
    this.cpu.cooldown = 0.4;
    this.cpu.guard = 0;
    this.cpu.lastFoeAttack = null;
    this.announce(
      first ? "آماده" : `راند ${["", "۱", "۲", "۳"][this.round] || this.round}`,
      first ? "READY" : "ROUND",
      "#ffe8c8", 1.1, 82
    );
  }

  resetToMenu() {
    this.state = "menu";
    this.showHud = false;
    this.stateTime = 0;
    this.matchWinner = null;
    this.announcement = null;
    this.projectiles.length = 0;
    this.fx.clear();
    this.zoom = 1;
    this.zoomTarget = 1;
    this.shakeMag = 0;
    this.flash.a = 0;
    this.fighters.forEach((f) => f.resetMatch());
    this.fighters[0].x = 440;
    this.fighters[1].x = 840;
    this.fighters[0].facing = 1;
    this.fighters[1].facing = -1;
    this.fighters[1].isCpu = false;
    this.input.clear();
    this.onStateChange?.("menu");
  }

  setPaused(paused) {
    if (paused) {
      if (["fight", "intro", "roundEnd"].includes(this.state)) {
        this.pausedFrom = this.state;
        this.state = "paused";
        this.input.clear();
      }
    } else if (this.state === "paused") {
      this.state = this.pausedFrom || "fight";
      this.pausedFrom = null;
      this.input.clear();
    }
  }

  togglePause() {
    if (this.state === "paused") this.setPaused(false);
    else this.setPaused(true);
    return this.state === "paused";
  }

  get isPlaying() {
    return ["intro", "fight", "roundEnd", "matchEnd", "paused"].includes(this.state);
  }

  readIntent(fighter) {
    if (fighter.isCpu) return this.cpuIntent();
    const map = INPUT_MAP[fighter.id];
    const pad = NUMPAD_MAP[fighter.id];
    const input = this.input;
    const was = (a, b) => input.wasPressed(a) || (b ? input.wasPressed(b) : false);
    return {
      left: input.isHeld(map.left),
      right: input.isHeld(map.right),
      down: input.isHeld(map.down),
      upPressed: input.wasPressed(map.up),
      lightPressed: was(map.light, pad?.light),
      heavyPressed: was(map.heavy, pad?.heavy),
      specialPressed: was(map.special, pad?.special),
      superPressed: was(map.super, pad?.super),
    };
  }

  cpuIntent() {
    const me = this.fighters[1];
    const foe = this.fighters[0];
    const intent = emptyIntent();
    if (me.ko || me.victory || this.state !== "fight") return intent;

    const dist = foe.x - me.x;
    const ad = Math.abs(dist);
    const dir = Math.sign(dist) || 1;
    const cpu = this.cpu;

    cpu.cooldown = Math.max(0, cpu.cooldown - 1 / 60);
    cpu.guard = Math.max(0, cpu.guard - 1 / 60);
    cpu.jumpCd = Math.max(0, cpu.jumpCd - 1 / 60);

    // React to a fresh opponent attack by guarding sometimes.
    const foeT = foe.attack ? foe.attack.t : null;
    if (foeT !== null && foeT <= 3 && foeT !== cpu.lastFoeAttack && ad < 240) {
      if (Math.random() < 0.55) cpu.guard = rand(0.22, 0.4);
    }
    cpu.lastFoeAttack = foeT;

    if (cpu.guard > 0 && me.canAttack()) {
      if (dir > 0) intent.left = true;
      else intent.right = true;
      return intent;
    }

    if (me.stun > 0) return intent;

    if (
      me.canAttack() &&
      me.onGround &&
      ad < 170 &&
      cpu.cooldown <= 0
    ) {
      const r = Math.random();
      if (me.meter >= 100 && ad < 150 && r < 0.4) intent.superPressed = true;
      else if (r < 0.32) intent.lightPressed = true;
      else if (r < 0.72) intent.heavyPressed = true;
      else if (me.meter >= 25) intent.specialPressed = true;
      cpu.cooldown = rand(0.26, 0.62);
      return intent;
    }

    if (
      me.canAttack() &&
      me.meter >= 25 &&
      me.meter < 100 &&
      ad > 230 &&
      Math.random() < 0.018
    ) {
      intent.specialPressed = true;
      cpu.cooldown = rand(0.5, 0.9);
      return intent;
    }

    if (ad > 130) {
      if (dir > 0) intent.right = true;
      else intent.left = true;
    } else if (ad < 76) {
      if (dir > 0) intent.left = true;
      else intent.right = true;
    }

    if (me.onGround && ad > 150 && ad < 320 && cpu.jumpCd <= 0 && Math.random() < 0.008) {
      intent.upPressed = true;
      cpu.jumpCd = 2.2;
      if (dir > 0) intent.right = true;
      else intent.left = true;
    }

    return intent;
  }

  update(dt) {
    this.animTime += dt;
    this.fx.update(dt);
    this.updateCamera(dt);

    if (this.state === "paused") return;

    // announcement & flash always animate
    if (this.announcement) {
      this.announcement.t += dt;
      if (this.announcement.t > this.announcement.dur) this.announcement = null;
    }
    if (this.flash.a > 0) this.flash.a = Math.max(0, this.flash.a - dt * 2.6);
    if (this.meterFlash) {
      this.meterFlash.t -= dt;
      if (this.meterFlash.t <= 0) this.meterFlash = null;
    }

    if (this.state === "menu") {
      this.time += dt;
      const idle = emptyIntent();
      for (const f of this.fighters) {
        f.update(dt, idle, this);
      }
      this.separate();
      return;
    }

    if (this.hitstop > 0) {
      this.hitstop--;
      this.input.endFrame();
      return;
    }

    if (this.state === "intro") {
      this.time += dt;
      this.stateTime += dt;
      const idle = emptyIntent();
      for (const f of this.fighters) f.update(dt, idle, this);
      this.separate();
      if (!this.fightAnnounced && this.stateTime > 0.9) {
        this.fightAnnounced = true;
        this.state = "fight";
        this.time = 0;
        this.announce("مبارزه!", "FIGHT", "#ffd9a0", 1.0, 108);
        this.sfx.fight();
        this.addShake(5);
        this.zoomTarget = 1.015;
      }
      this.input.endFrame();
      return;
    }

    if (this.state === "fight") {
      this.time += dt;
      this.timer -= dt;
      this.zoomTarget += (1 - this.zoomTarget) * 0.05;
      const intents = this.readIntent(this.fighters[0]);
      const intents2 = this.readIntent(this.fighters[1]);
      for (const f of this.fighters) {
        if (this.state !== "fight") break;
        f.update(dt, f.id === 0 ? intents : intents2, this);
      }
      this.separate();
      this.resolveHits();
      this.updateProjectiles(dt);
      this.checkRoundOver();
      this.input.endFrame();
      return;
    }

    if (this.state === "roundEnd") {
      this.time += dt;
      this.stateTime += dt;
      this.zoomTarget += (1.03 - this.zoomTarget) * 0.04;
      const idle = emptyIntent();
      for (const f of this.fighters) f.update(dt, idle, this);
      this.separate();
      if (this.stateTime > 2.6) {
        const ended = this.fighters.some((f) => f.wins >= ROUNDS_TO_WIN);
        if (ended) {
          this.enterMatchEnd();
        } else {
          this.round++;
          this.beginRound(false);
        }
      }
      this.input.endFrame();
      return;
    }

    if (this.state === "matchEnd") {
      this.time += dt;
      this.stateTime += dt;
      this.zoomTarget += (1.02 - this.zoomTarget) * 0.03;
      if (this.stateTime > 1.15 && !this.matchEndShown) {
        this.matchEndShown = true;
        this.onMatchEnd?.({
          winner: this.matchWinner,
          fighters: this.fighters,
          score: [this.fighters[0].wins, this.fighters[1].wins],
          mode: this.mode,
        });
      }
      this.input.endFrame();
      return;
    }

    this.input.endFrame();
  }

  separate() {
    const [a, b] = this.fighters;
    if (a.ko || b.ko) return;
    if (Math.abs(a.y - b.y) > 110) return;
    const min = 76;
    let dx = b.x - a.x;
    if (Math.abs(dx) >= min) return;
    const push = (min - Math.abs(dx)) / 2;
    const s = Math.sign(dx) || 1;
    a.x -= s * push;
    b.x += s * push;
    // keep inside arena; if one is cornered, shift the other
    if (a.x < STAGE_L) { const d = STAGE_L - a.x; a.x = STAGE_L; b.x = Math.min(STAGE_R, b.x + d); }
    if (b.x > STAGE_R) { const d = b.x - STAGE_R; b.x = STAGE_R; a.x = Math.max(STAGE_L, a.x - d); }
    if (a.x > STAGE_R) a.x = STAGE_R;
    if (b.x < STAGE_L) b.x = STAGE_L;
  }

  resolveHits() {
    for (const f of this.fighters) {
      if (!f.attack) continue;
      const d = f.attackData;
      if (!d || !d.box) continue;
      const target = f.other;
      if (target.ko) continue;

      if (f.attack.type === "super") {
        // Multi-hit rush
        const window = f.attack.t > d.startup && f.attack.t <= d.startup + d.active;
        const ready = f.attack.hits < d.maxHits &&
          (f.attack.lastHit === undefined || f.attack.t - f.attack.lastHit >= d.multiInterval);
        if (!window || !ready) continue;
        const hb = f.hitbox();
        if (!hb) continue;
        const hu = target.hurtbox();
        if (!overlap(hb, hu)) continue;
        this.applyHit(f, target, d, hb, hu);
        f.attack.hits++;
        f.attack.lastHit = f.attack.t;
        continue;
      }

      if (f.attack.hasHit) continue;
      const hb = f.hitbox();
      if (!hb) continue;
      const hu = target.hurtbox();
      if (!overlap(hb, hu)) continue;
      f.attack.hasHit = true;
      this.applyHit(f, target, d, hb, hu);
    }
  }

  applyHit(attacker, target, d, hb, hu) {
    const dir = attacker.facing;
    const cx = (Math.max(hb.x, hu.x) + Math.min(hb.x + hb.w, hu.x + hu.w)) / 2;
    const cy = (Math.max(hb.y, hu.y) + Math.min(hb.y + hb.h, hu.y + hu.h)) / 2;
    const blocked = target.blocking && target.onGround && target.stun <= 0;

    if (blocked) {
      const chip = d.damage * (d.chip || 0.05);
      target.takeBlock(chip, dir, d, this);
      this.fx.spawnBlock(cx, cy, "#bff4ff");
      this.fx.spawnText(cx, cy - 30, "دفاع", "#bfe9ff", 18);
      this.sfx.block();
      this.hitstop = Math.max(this.hitstop, 3);
      this.addShake(3);
      attacker.meter = Math.min(100, attacker.meter + 4);
      return;
    }

    const counter = !!target.attack && target.attack.t <= (target.attackData?.startup || 0) + (target.attackData?.active || 0);
    const wasCombo = target.stunType === "hit" && target.stun > 0;
    attacker.combo = wasCombo ? attacker.combo + 1 : 1;
    attacker.comboTimer = 100;

    const scaling = clamp(1 - Math.max(0, attacker.combo - 1) * 0.07, 0.55, 1);
    const dmg = d.damage * scaling * (attacker.attack?.type === "super" ? 1 : 1);
    const result = target.takeHit(dmg, dir, d, this, { counter });
    attacker.meter = Math.min(100, attacker.meter + (d.meterGain || 0));

    const isSuper = attacker.attack?.type === "super";
    const strong = d.damage >= 90 || isSuper;
    this.fx.spawnHit(cx, cy, isSuper ? "super" : strong ? "heavy" : "light", attacker.palette.glow, dir, { core: attacker.palette.secondary });
    this.sfx[d.sfx || (strong ? "hitHeavy" : "hitLight")]();
    this.hitstop = Math.max(this.hitstop, d.hitstop || 4);
    this.addShake(isSuper ? 14 : strong ? 9 : 4.5);
    if (strong) {
      this.flashScreen(isSuper ? 0.5 : 0.18, attacker.palette.glow);
      this.zoomTarget = isSuper ? 1.05 : 1.02;
    }
    if (counter) {
      this.fx.spawnText(cx, cy - 56, "ضربه متقابل!", "#ffe6a8", 24);
    }
    if (isSuper) {
      this.fx.spawnShock(cx, cy, attacker.palette.glow);
    }
    if (target.health > 0 && result.finalDmg >= 40 && attacker.combo >= 2) {
      // combo feedback is drawn by HUD
    }
  }

  spawnProjectile(f) {
    const p = {
      x: f.x + f.facing * 58,
      y: f.y - 112,
      vx: f.facing * 660,
      owner: f.id,
      ownerFighter: f,
      color: f.palette.glow,
      color2: f.palette.secondary,
      life: 2.2,
      r: 24,
      t: 0,
      trail: [],
    };
    this.projectiles.push(p);
    this.sfx.fireball();
    this.fx.spawnFireBurst(p.x, p.y, f.palette.glow, 14);
    this.addShake(3);
  }

  updateProjectiles(dt) {
    const list = this.projectiles;
    for (let i = list.length - 1; i >= 0; i--) {
      const p = list[i];
      p.t += dt;
      p.life -= dt;
      p.x += p.vx * dt;
      p.trail.unshift({ x: p.x, y: p.y, t: 0.28 });
      if (p.trail.length > 10) p.trail.pop();
      for (const tr of p.trail) tr.t -= dt;

      if (p.x < STAGE_L - 80 || p.x > STAGE_R + 80 || p.life <= 0) {
        this.fx.spawnFireBurst(p.x, p.y, p.color, 10);
        list.splice(i, 1);
        continue;
      }

      // clash with the other projectile
      let clashed = false;
      for (let j = list.length - 1; j >= 0; j--) {
        if (j === i) continue;
        const q = list[j];
        if (q.owner === p.owner) continue;
        if (Math.abs(q.x - p.x) < 52 && Math.abs(q.y - p.y) < 46) {
          this.fx.spawnFireBurst((p.x + q.x) / 2, (p.y + q.y) / 2, "#fff0d0", 26);
          this.fx.spawnShock((p.x + q.x) / 2, (p.y + q.y) / 2, "#fff2c8");
          this.sfx.hitHeavy();
          this.hitstop = Math.max(this.hitstop, 6);
          this.addShake(9);
          const a = Math.max(i, j);
          list.splice(a, 1);
          list.splice(Math.min(i, j), 1);
          clashed = true;
          break;
        }
      }
      if (clashed) continue;

      const target = this.fighters[1 - p.owner];
      if (target.ko) continue;
      const hu = target.hurtbox();
      const closestX = clamp(p.x, hu.x, hu.x + hu.w);
      const closestY = clamp(p.y, hu.y, hu.y + hu.h);
      const dx = p.x - closestX;
      const dy = p.y - closestY;
      if (dx * dx + dy * dy < (p.r + 6) * (p.r + 6)) {
        const blocked = target.blocking && target.onGround && target.stun <= 0;
        if (blocked) {
          target.takeBlock(9, Math.sign(p.vx), { hitstun: 20 }, this);
          this.fx.spawnBlock(p.x, p.y, "#c7f6ff");
          this.fx.spawnText(p.x, p.y - 36, "دفاع", "#c7f6ff", 18);
          this.sfx.block();
          this.hitstop = Math.max(this.hitstop, 3);
        } else {
          const d = {
            damage: 74, hitstun: 24, kb: 300, hitstop: 7, launch: -180,
            chip: 0.05, sfx: "hitHeavy",
          };
          const opp = target.stunType === "hit" && target.stun > 0;
          p.ownerFighter.combo = opp ? p.ownerFighter.combo + 1 : 1;
          p.ownerFighter.comboTimer = 100;
          target.takeHit(74, Math.sign(p.vx), d, this, {});
          p.ownerFighter.meter = Math.min(100, p.ownerFighter.meter + 6);
          this.fx.spawnHit(p.x, p.y, "heavy", p.color, Math.sign(p.vx));
          this.fx.spawnFireBurst(p.x, p.y, p.color, 22);
          this.sfx.hitHeavy();
          this.hitstop = Math.max(this.hitstop, 7);
          this.addShake(11);
          this.flashScreen(0.24, p.color);
          if (target.health <= 0) target.knockOut(Math.sign(p.vx));
        }
        this.fx.spawnFireBurst(p.x, p.y, p.color, 16);
        list.splice(i, 1);
      }
    }
  }

  checkRoundOver() {
    const [a, b] = this.fighters;
    if (a.ko || b.ko) return; // KO is triggered via callback
    if (this.timer <= 0) {
      this.timer = 0;
      this.state = "roundEnd";
      this.stateTime = 0;
      this.sfx.timeUp();
      const aw = a.wins, bw = b.wins;
      if (a.health === b.health) {
        this.roundResult = { draw: true, reason: "time" };
        this.announce("مساوی", "DRAW", "#e8d9ff", 2.2, 92);
      } else {
        const winner = a.health > b.health ? a : b;
        winner.wins++;
        this.roundResult = { winnerId: winner.id, reason: "time" };
        winner.setVictory();
        this.announce("زمان تمام", "TIME UP", winner.palette.trim, 2.2, 92);
        this.announceSub = `${winner.palette.name} راند را برد`;
      }
      this.addShake(5);
      this.zoomTarget = 1.04;
    }
  }

  onKO(loser) {
    if (this.state !== "fight") return;
    const winner = loser.other;
    if (!winner.victory) winner.wins++;
    winner.setVictory();
    this.state = "roundEnd";
    this.stateTime = 0;
    this.roundResult = { winnerId: winner.id, reason: "ko" };
    this.announce("ناک‌اوت", "K.O.", winner.palette.trim, 2.4, 116);
    this.sfx.ko();
    this.flashScreen(0.85, "#ffffff");
    this.addShake(18);
    this.zoomTarget = 1.08;
    this.hitstop = Math.max(this.hitstop, 10);
  }

  enterMatchEnd() {
    const a = this.fighters[0], b = this.fighters[1];
    const winner = a.wins > b.wins ? a : b;
    this.state = "matchEnd";
    this.stateTime = 0;
    this.matchWinner = winner;
    this.matchEndShown = false;
    this.announce(`${winner.palette.name} برنده شد`, "VICTORY", winner.palette.trim, 3.0, 88);
    this.addShake(8);
    this.zoomTarget = 1.03;
  }

  flashScreen(a, color) {
    this.flash.a = Math.max(this.flash.a, a);
    this.flash.color = color || "#ffffff";
  }

  flashMeter(fighter) {
    this.meterFlash = { id: fighter.id, t: 0.4 };
  }

  addShake(mag) {
    this.shakeMag = Math.max(this.shakeMag, mag);
  }

  updateCamera(dt) {
    this.shakeMag *= Math.pow(0.86, dt * 60);
    if (this.shakeMag < 0.2) this.shakeMag = 0;
    this.shakeX = rand(-1, 1) * this.shakeMag;
    this.shakeY = rand(-1, 1) * this.shakeMag * 0.7;
    this.zoom += (this.zoomTarget - this.zoom) * Math.min(1, dt * 8);
  }

  announce(text, sub, color = "#fff", dur = 1.6, size = 96) {
    this.announcement = { text, sub, color, dur, size, t: 0 };
  }

  onJump(f) {
    this.fx.spawnDust(f.x, GROUND_Y, 5, f.facing);
  }

  onLand(f) {
    this.fx.spawnDust(f.x, GROUND_Y, 7, 0);
    this.sfx.land();
  }

  onWhiff(f, d) {}

  onSpecialStart(f) {
    this.fx.spawnFireBurst(f.x + f.facing * 36, f.y - 108, f.palette.glow, 8);
  }

  onSuperStart(f) {
    this.sfx.superMove();
    this.flashScreen(0.4, f.palette.glow);
    this.addShake(10);
    this.hitstop = Math.max(this.hitstop, 8);
    this.zoomTarget = 1.045;
    this.fx.spawnShock(f.x, f.y - 80, f.palette.glow);
    this.fx.spawnText(f.x, f.y - 190, "حداکثر قدرت!", f.palette.trim, 24);
  }
}
