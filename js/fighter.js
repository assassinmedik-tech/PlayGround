import { clamp, TAU } from "./utils.js";

export const GROUND_Y = 606;
export const STAGE_L = 92;
export const STAGE_R = 1188;
const GRAVITY = 2650;
const FRAME = 1 / 60;

export const ATTACKS = {
  light: {
    label: "مشت",
    startup: 6, active: 3, recovery: 11,
    damage: 46, hitstun: 16, kb: 175, hitstop: 4,
    box: { x: 24, w: 84, y: -146, h: 58 },
    meterGain: 7, chip: 0.04, sfx: "hitLight",
  },
  heavy: {
    label: "لگد",
    startup: 13, active: 5, recovery: 22,
    damage: 104, hitstun: 27, kb: 350, hitstop: 8,
    box: { x: 30, w: 124, y: -140, h: 96 },
    meterGain: 10, chip: 0.07, sfx: "hitHeavy", launch: -300,
  },
  fireball: {
    label: "موج",
    startup: 16, active: 1, recovery: 26,
    damage: 0, cost: 25,
  },
  super: {
    label: "سوپر",
    startup: 14, active: 44, recovery: 18,
    damage: 58, hitstun: 18, kb: 120, hitstop: 3,
    box: { x: 18, w: 150, y: -158, h: 136 },
    cost: 100, meterGain: 0, chip: 0.05,
    multiInterval: 9, maxHits: 4,
  },
};

const POSE_KEYS = [
  "hx", "hy", "sx", "sy", "hdx", "hdy",
  "ffx", "ffy", "fkx", "fky", "bfx", "bfy", "bkx", "bky",
  "fhx", "fhy", "fex", "fey", "bhx", "bhy", "bex", "bey", "lean",
];

const BASE = {
  hx: 0, hy: -82, sx: 0, sy: -130, hdx: 4, hdy: -156,
  ffx: 26, ffy: 0, fkx: 22, fky: -44,
  bfx: -28, bfy: 0, bkx: -22, bky: -44,
  fhx: 24, fhy: -98, fex: 18, fey: -114,
  bhx: -14, bhy: -98, bex: -14, bey: -114,
  lean: 0.02,
};

const CROUCH = {
  hx: 2, hy: -60, sx: 0, sy: -106, hdx: 6, hdy: -130,
  ffx: 28, ffy: 0, fkx: 38, fky: -22,
  bfx: -28, bfy: 0, bkx: -36, bky: -22,
  fhx: 16, fhy: -78, fex: 24, fey: -86,
  bhx: -2, bhy: -80, bex: 6, bey: -86,
  lean: 0.1,
};

const GUARD = {
  hx: -2, hy: -78, sx: -3, sy: -124, hdx: 2, hdy: -150,
  ffx: 26, ffy: 0, fkx: 22, fky: -42,
  bfx: -27, bfy: 0, bkx: -21, bky: -42,
  fhx: 20, fhy: -124, fex: 18, fey: -106,
  bhx: 10, bhy: -108, bex: 12, bey: -118,
  lean: 0.06,
};

const JUMP = {
  hx: 0, hy: -88, sx: 0, sy: -134, hdx: 5, hdy: -160,
  ffx: 20, ffy: -46, fkx: 30, fky: -74,
  bfx: -24, bfy: -36, bkx: -12, bky: -68,
  fhx: 26, fhy: -120, fex: 30, fey: -134,
  bhx: -16, bhy: -118, bex: -22, bey: -132,
  lean: 0.06,
};

const HIT = {
  hx: -8, hy: -78, sx: -7, sy: -124, hdx: -6, hdy: -148,
  ffx: 32, ffy: 0, fkx: 26, fky: -42,
  bfx: -32, bfy: 0, bkx: -26, bky: -42,
  fhx: 4, fhy: -112, fex: -2, fey: -128,
  bhx: -24, bhy: -106, bex: -30, bey: -122,
  lean: -0.26,
};

const VICTORY = {
  hx: 0, hy: -82, sx: -2, sy: -132, hdx: 0, hdy: -158,
  ffx: 25, ffy: 0, fkx: 20, fky: -44,
  bfx: -27, bfy: 0, bkx: -22, bky: -44,
  fhx: 34, fhy: -198, fex: 38, fey: -172,
  bhx: -14, bhy: -100, bex: -14, bey: -114,
  lean: -0.05,
};

const ATTACK_POSES = {
  punchWindup: {
    hx: -4, hy: -82, sx: -2, sy: -130, hdx: 0, hdy: -156,
    ffx: 22, ffy: 0, fkx: 18, fky: -44,
    bfx: -26, bfy: 0, bkx: -20, bky: -44,
    fhx: 8, fhy: -108, fex: 6, fey: -120,
    bhx: -14, bhy: -118, bex: -8, bey: -124,
    lean: -0.06,
  },
  punchStrike: {
    hx: 6, hy: -80, sx: 4, sy: -126, hdx: 8, hdy: -152,
    ffx: 34, ffy: 0, fkx: 24, fky: -42,
    bfx: -30, bfy: 0, bkx: -24, bky: -42,
    fhx: 84, fhy: -128, fex: 50, fey: -124,
    bhx: -4, bhy: -120, bex: 2, bey: -126,
    lean: 0.17,
  },
  kickWindup: {
    hx: -4, hy: -82, sx: -2, sy: -130, hdx: 2, hdy: -156,
    ffx: 26, ffy: -20, fkx: 30, fky: -62,
    bfx: -26, bfy: 0, bkx: -20, bky: -44,
    fhx: 12, fhy: -104, fex: 10, fey: -118,
    bhx: -16, bhy: -110, bex: -16, bey: -124,
    lean: -0.08,
  },
  kickStrike: {
    hx: -6, hy: -80, sx: -4, sy: -128, hdx: -2, hdy: -148,
    ffx: 104, ffy: -126, fkx: 64, fky: -96,
    bfx: -30, bfy: 0, bkx: -24, bky: -42,
    fhx: -4, fhy: -112, fex: -10, fey: -124,
    bhx: -22, bhy: -118, bex: -26, bey: -128,
    lean: -0.3,
  },
  charge: {
    hx: 0, hy: -76, sx: 0, sy: -124, hdx: 3, hdy: -150,
    ffx: 28, ffy: 0, fkx: 26, fky: -38,
    bfx: -28, bfy: 0, bkx: -26, bky: -38,
    fhx: 14, fhy: -96, fex: 10, fey: -104,
    bhx: -14, bhy: -100, bex: -6, bey: -106,
    lean: 0.04,
  },
  release: {
    hx: 6, hy: -78, sx: 4, sy: -126, hdx: 7, hdy: -152,
    ffx: 32, ffy: 0, fkx: 26, fky: -42,
    bfx: -28, bfy: 0, bkx: -24, bky: -42,
    fhx: 62, fhy: -112, fex: 36, fey: -110,
    bhx: 26, bhy: -104, bex: 14, bey: -108,
    lean: 0.15,
  },
  rush: {
    hx: -2, hy: -78, sx: 2, sy: -126, hdx: 6, hdy: -152,
    ffx: 36, ffy: 0, fkx: 30, fky: -42,
    bfx: -36, bfy: 0, bkx: -30, bky: -42,
    fhx: 68, fhy: -118, fex: 42, fey: -116,
    bhx: -18, bhy: -112, bex: -12, bey: -120,
    lean: 0.22,
  },
};

function blend(a, b, t) {
  const out = {};
  for (const k of POSE_KEYS) out[k] = a[k] + (b[k] - a[k]) * t;
  return out;
}

export class Fighter {
  constructor(game, id, x, facing, palette) {
    this.game = game;
    this.id = id;
    this.palette = palette;
    this.name = palette.name;
    this.startX = x;
    this.startFacing = facing;

    this.x = x;
    this.y = GROUND_Y;
    this.facing = facing;
    this.vx = 0;
    this.vy = 0;
    this.onGround = true;

    this.maxHealth = 1000;
    this.health = 1000;
    this.meter = 20;
    this.wins = 0;

    this.attack = null;
    this.stun = 0;
    this.stunType = null;
    this.crouching = false;
    this.blocking = false;
    this.walking = 0;
    this.walkPhase = 0;
    this.airAttackUsed = false;
    this.hitstunFrame = 0;
    this.ko = false;
    this.koRot = 0;
    this.victory = false;
    this.time = Math.random() * 10;
    this.hurtFlash = 0;
    this.pose = { ...BASE };
    this.wins = 0;
    this.combo = 0;
    this.comboTimer = 0;
    this.aura = 0;
    this.lastAttackType = "light";
    this.walkSpeed = 278;
  }

  get other() { return this.game.fighters[1 - this.id]; }

  resetRound() {
    this.x = this.startX;
    this.facing = this.startFacing;
    this.y = GROUND_Y;
    this.vx = 0;
    this.vy = 0;
    this.onGround = true;
    this.health = this.maxHealth;
    this.attack = null;
    this.stun = 0;
    this.stunType = null;
    this.crouching = false;
    this.blocking = false;
    this.ko = false;
    this.koRot = 0;
    this.victory = false;
    this.airAttackUsed = false;
    this.combo = 0;
    this.comboTimer = 0;
    this.hurtFlash = 0;
    this.pose = { ...BASE };
  }

  resetMatch() {
    this.wins = 0;
    this.meter = 20;
    this.resetRound();
  }

  get attackData() {
    return this.attack ? ATTACKS[this.attack.type] : null;
  }

  canAttack() {
    return !this.attack && this.stun <= 0 && !this.ko && !this.victory;
  }

  hurtbox() {
    const h = this.crouching && this.onGround ? 100 : 148;
    return { x: this.x - 27, y: this.y - h, w: 54, h };
  }

  hitbox() {
    if (!this.attack) return null;
    const d = this.attackData;
    if (!d || !d.box) return null;
    const t = this.attack.t;
    if (t <= d.startup || t > d.startup + d.active) return null;
    const b = d.box;
    const x = this.facing === 1 ? this.x + b.x : this.x - b.x - b.w;
    return { x, y: this.y + b.y, w: b.w, h: b.h };
  }

  startAttack(type, game) {
    const d = ATTACKS[type];
    if (!d) return;
    if (d.cost && this.meter < d.cost) {
      game?.flashMeter?.(this);
      return;
    }
    if (type === "fireball" || type === "super") {
      if (!this.onGround) return;
    }
    if (!this.onGround && this.airAttackUsed) return;

    if (d.cost) this.meter = Math.max(0, this.meter - d.cost);
    this.attack = { type, t: 0, hasHit: false, hits: 0, facing: this.facing };
    this.lastAttackType = type;
    this.walking = 0;
    this.airAttackUsed = !this.onGround ? true : this.airAttackUsed;
    this.facing = this.other.x >= this.x ? 1 : -1;

    if (type === "super") {
      game?.onSuperStart?.(this);
    } else if (type === "fireball") {
      game?.onSpecialStart?.(this);
    } else {
      game?.onWhiff?.(this, d);
      game?.sfx?.whiff();
    }
  }

  update(dt, intent, game) {
    this.time += dt;
    const opp = this.other;

    if (this.hurtFlash > 0) this.hurtFlash--;
    if (this.comboTimer > 0) {
      this.comboTimer--;
      if (this.comboTimer === 0) this.combo = 0;
    }
    if (!this.ko && this.stun <= 0) {
      this.meter = Math.min(100, this.meter + 0.028);
    }

    if (this.ko) {
      this.updateKO(dt);
      return;
    }

    if (this.stun > 0) {
      this.stun--;
      this.vx *= 0.92;
      this.physicsStep(dt, game);
      if (this.stun === 0) {
        this.stunType = null;
        this.blocking = false;
      }
      this.updatePose(dt, opp);
      return;
    }

    if (this.victory) {
      this.vx *= 0.8;
      this.physicsStep(dt, game);
      this.updatePose(dt, opp);
      return;
    }

    if (this.attack) {
      this.advanceAttack(game);
      this.vx *= 0.86;
      this.physicsStep(dt, game);
      this.updatePose(dt, opp);
      return;
    }

    this.crouching = false;
    this.blocking = false;

    // Face the opponent while free.
    if (this.onGround) this.facing = opp.x >= this.x ? 1 : -1;

    const backKey = this.facing === 1 ? intent.left : intent.right;
    const fwdKey = this.facing === 1 ? intent.right : intent.left;

    // Guard: holding away while grounded, not attacking.
    if (this.onGround && backKey && !intent.down) this.blocking = true;
    if (this.onGround && backKey && intent.down) {
      this.blocking = true;
      this.crouching = true;
    }

    // Attacks have priority over movement.
    if (intent.superPressed && this.meter >= 100 && this.onGround) {
      this.startAttack("super", game);
      this.updatePose(dt, opp);
      return;
    }
    if (intent.specialPressed && this.meter >= 25 && this.onGround) {
      this.startAttack("fireball", game);
      this.updatePose(dt, opp);
      return;
    }
    if (intent.heavyPressed && (this.onGround || !this.airAttackUsed)) {
      this.startAttack("heavy", game);
      this.updatePose(dt, opp);
      if (this.onGround) this.vx = this.facing * 90;
      return;
    }
    if (intent.lightPressed && (this.onGround || !this.airAttackUsed)) {
      this.startAttack("light", game);
      this.updatePose(dt, opp);
      if (this.onGround) this.vx = this.facing * 60;
      return;
    }

    if (this.onGround) {
      if (intent.down) {
        this.crouching = true;
        this.vx *= 0.6;
      } else {
        if (intent.upPressed) {
          this.vy = -870;
          this.onGround = false;
          this.airAttackUsed = false;
          const dir = (intent.right ? 1 : 0) - (intent.left ? 1 : 0);
          this.vx = dir * 250;
          this.blocking = false;
          this.crouching = false;
          game?.sfx?.jump();
          game?.onJump?.(this);
        } else {
          const dir = (intent.right ? 1 : 0) - (intent.left ? 1 : 0);
          if (dir !== 0) {
            const spd = dir === -this.facing ? this.walkSpeed * 0.84 : this.walkSpeed;
            this.vx = dir * spd;
            this.walking = 1;
            this.walkPhase += dt * (dir === -this.facing ? 9 : 11);
          } else {
            this.vx *= 0.55;
            this.walking = 0;
          }
        }
      }
    } else {
      // gentle air drift
      const dir = (intent.right ? 1 : 0) - (intent.left ? 1 : 0);
      if (dir !== 0) this.vx += dir * 240 * dt;
      this.vx = clamp(this.vx, -360, 360);
    }

    if (!this.onGround) this.crouching = false;

    this.vx = clamp(this.vx, -560, 560);
    this.physicsStep(dt, game);
    this.updatePose(dt, opp);
  }

  advanceAttack(game) {
    const a = this.attack;
    const d = ATTACKS[a.type];
    a.t++;

    if (a.type === "fireball" && a.t === d.startup) {
      game.spawnProjectile(this);
    }

    if (a.type === "super") {
      if (a.t <= d.startup + 26) {
        this.vx = this.facing * 560;
      } else {
        this.vx *= 0.82;
      }
      if (a.t === d.startup) {
        game.flashScreen(0.55, this.palette.glow);
      }
    }

    if (a.t >= d.startup + (d.active || 0) + d.recovery) {
      this.attack = null;
      this.vx *= 0.5;
    }
  }

  physicsStep(dt, game) {
    if (!this.onGround) {
      this.vy += GRAVITY * dt;
      this.y += this.vy * dt;
      if (this.y >= GROUND_Y) {
        this.y = GROUND_Y;
        this.vy = 0;
        if (!this.onGround) {
          this.onGround = true;
          this.airAttackUsed = false;
          game?.onLand?.(this);
        }
      } else {
        this.onGround = false;
      }
    }
    this.x += this.vx * dt;
    if (this.x < STAGE_L) { this.x = STAGE_L; this.vx = 0; }
    if (this.x > STAGE_R) { this.x = STAGE_R; this.vx = 0; }

    // ground friction when idle
    if (this.onGround && !this.attack && this.stun <= 0) {
      this.vx *= 0.7;
      if (Math.abs(this.vx) < 2) this.vx = 0;
    }
  }

  updateKO(dt) {
    const wasAir = !this.onGround;
    this.vy += GRAVITY * dt;
    this.y += this.vy * dt;
    this.x += this.vx * dt;
    this.vx *= 0.985;
    this.x = clamp(this.x, STAGE_L, STAGE_R);
    if (this.y >= GROUND_Y) {
      this.y = GROUND_Y;
      if (this.vy > 60 && wasAir) this.game?.onLand?.(this, true);
      this.vy = 0;
      this.onGround = true;
    }
    const target = -1.34;
    this.koRot += (target - this.koRot) * 0.09;
  }

  takeHit(dmg, dir, d, game, opts = {}) {
    const wasStunned = this.stun > 0 || this.attack !== null;
    const finalDmg = Math.round(dmg * (opts.counter ? 1.18 : 1));
    this.health = Math.max(0, this.health - finalDmg);
    this.hurtFlash = 9;
    this.meter = Math.min(100, this.meter + 8);
    this.attack = null;
    this.stun = d.hitstun + (opts.counter ? 6 : 0);
    this.stunType = "hit";
    this.blocking = false;
    this.crouching = false;
    this.vx = dir * d.kb;
    this.vy = d.launch ? d.launch * (this.onGround ? 1 : 1.2) : this.vy;
    if (d.launch) {
      this.y -= 2;
      this.onGround = false;
    }
    this.facing = dir > 0 ? -1 : 1;
    this.counter = wasStunned && opts.counter;
    if (this.health <= 0) this.knockOut(dir);
    return { wasStunned, finalDmg };
  }

  takeBlock(chipDmg, dir, d, game) {
    const dmg = Math.max(1, Math.round(chipDmg));
    this.health = Math.max(0, this.health - dmg);
    this.meter = Math.min(100, this.meter + 5);
    this.stun = Math.max(8, Math.round((d.hitstun || 14) * 0.55));
    this.stunType = "block";
    this.blocking = true;
    this.vx = dir * 120;
    this.hurtFlash = 3;
    if (this.health <= 0) this.knockOut(dir);
  }

  knockOut(dir) {
    if (this.ko) return;
    this.ko = true;
    this.attack = null;
    this.stun = 0;
    this.victory = false;
    this.vy = -430;
    this.vx = dir * 300;
    this.onGround = false;
    this.koRot = 0;
    this.health = 0;
    this.game?.onKO?.(this);
  }

  setVictory() {
    this.victory = true;
    this.attack = null;
    this.crouching = false;
    this.blocking = false;
  }

  targetPose(opp) {
    const t = this.time;
    const breathe = Math.sin(t * 2.6);

    if (this.stun > 0) {
      if (this.stunType === "block") {
        const p = { ...GUARD };
        p.fhx += Math.sin(this.stun * 0.8) * 2;
        return p;
      }
      const p = { ...HIT };
      p.hdx += breathe * 1.5;
      return p;
    }

    if (this.attack) {
      const a = this.attack;
      const d = this.attackData;
      const type = a.type;
      if (type === "light") {
        const wind = ATTACK_POSES.punchWindup;
        const strike = ATTACK_POSES.punchStrike;
        if (a.t <= d.startup) return blend(BASE, wind, clamp(a.t / d.startup, 0, 1));
        if (a.t <= d.startup + d.active + 3) {
          const k = clamp((a.t - d.startup) / Math.max(1, d.active * 0.6), 0, 1);
          return blend(wind, strike, k);
        }
        const r = clamp((a.t - d.startup - d.active - 3) / Math.max(1, d.recovery - 4), 0, 1);
        return blend(strike, BASE, r);
      }
      if (type === "heavy") {
        const wind = ATTACK_POSES.kickWindup;
        const strike = ATTACK_POSES.kickStrike;
        if (a.t <= d.startup) return blend(BASE, wind, clamp(a.t / d.startup, 0, 1));
        if (a.t <= d.startup + d.active + 6) {
          const k = clamp((a.t - d.startup) / Math.max(1, d.active * 0.5), 0, 1);
          return blend(wind, strike, k);
        }
        const r = clamp((a.t - d.startup - d.active - 6) / Math.max(1, d.recovery - 7), 0, 1);
        return blend(strike, BASE, r);
      }
      if (type === "fireball") {
        const wind = ATTACK_POSES.charge;
        const rel = ATTACK_POSES.release;
        if (a.t <= d.startup) return blend(BASE, wind, clamp(a.t / d.startup, 0, 1));
        if (a.t <= d.startup + 8) return blend(wind, rel, clamp((a.t - d.startup) / 8, 0, 1));
        return blend(rel, BASE, clamp((a.t - d.startup - 8) / d.recovery, 0, 1));
      }
      if (type === "super") {
        const wind = ATTACK_POSES.charge;
        const rel = ATTACK_POSES.rush;
        if (a.t <= d.startup) return blend(BASE, wind, clamp(a.t / d.startup, 0, 1));
        if (a.t <= d.startup + 30) return rel;
        return blend(rel, BASE, clamp((a.t - d.startup - 30) / (d.active + d.recovery - 30), 0, 1));
      }
    }

    if (this.victory) {
      const p = { ...VICTORY };
      const bounce = Math.max(0, Math.sin(t * 5));
      p.hy -= bounce * 8;
      p.sy -= bounce * 8;
      p.hdy -= bounce * 8;
      p.fhy -= bounce * 10;
      p.fhx += Math.sin(t * 5) * 4;
      return p;
    }

    if (!this.onGround) {
      const p = { ...JUMP };
      const k = clamp((this.vy + 900) / 1800, 0, 1);
      p.ffy += k * 8;
      p.bfy += k * 12;
      p.fkx += k * 6;
      p.fhx += Math.sin(t * 8) * 4;
      return p;
    }

    if (this.crouching) {
      const p = { ...CROUCH };
      p.hy += breathe * 0.8;
      p.sy += breathe * 0.8;
      p.hdy += breathe * 0.8;
      return p;
    }

    const moving = Math.abs(this.vx) > 20 && this.stun <= 0 && !this.attack;
    if (moving) {
      const swing = Math.sin(this.walkPhase);
      const p = { ...BASE };
      p.ffx = 22 + swing * 24;
      p.fkx = 18 + swing * 18;
      p.ffy = -Math.max(0, swing) * 14;
      p.fky = -46 + Math.max(0, swing) * 6;
      p.bfx = -24 - swing * 24;
      p.bkx = -18 - swing * 18;
      p.bfy = -Math.max(0, -swing) * 14;
      p.bky = -46 + Math.max(0, -swing) * 6;
      p.fhx = 20 - swing * 12;
      p.fhy = -96 - Math.abs(swing) * 2;
      p.bhx = -10 + swing * 12;
      p.hy = -82 + Math.abs(swing) * 3;
      p.sy = -130 + Math.abs(swing) * 3;
      p.hdy = -156 + Math.abs(swing) * 3;
      return p;
    }

    if (this.blocking) {
      const p = { ...GUARD };
      p.hy += breathe * 0.7;
      p.sy += breathe * 0.7;
      p.hdy += breathe * 0.7;
      return p;
    }

    const p = { ...BASE };
    p.hy += breathe * 1.1;
    p.sy += breathe * 1.4;
    p.hdy += breathe * 1.4;
    p.fhx += breathe * 0.8;
    p.bhx -= breathe * 0.8;
    p.fhy += breathe * 0.7;
    p.bhy += breathe * 0.7;
    p.lean += breathe * 0.004;
    return p;
  }

  updatePose(dt, opp) {
    const target = this.targetPose(opp);
    const baseRate = this.attack ? 0.62 : 0.3;
    const k = 1 - Math.pow(1 - baseRate, Math.min(3, dt * 60));
    for (const key of POSE_KEYS) {
      this.pose[key] += (target[key] - this.pose[key]) * k;
    }
  }

  /** Draw only shadow; the full fighter is drawn by the renderer. */
  drawShadow(ctx) {
    const airborne = !this.onGround;
    const w = this.ko ? 64 : 44;
    const alpha = airborne ? 0.18 : 0.34;
    const g = ctx.createRadialGradient(this.x, GROUND_Y + 2, 2, this.x, GROUND_Y + 2, w);
    g.addColorStop(0, `rgba(0,0,0,${alpha})`);
    g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.save();
    ctx.translate(this.x, GROUND_Y + 2);
    ctx.scale(1, 0.24);
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(0, 0, w, 0, TAU);
    ctx.fill();
    ctx.restore();
  }
}
