import { rand, TAU, clamp } from "./utils.js";

export class Fx {
  constructor() {
    this.particles = [];
    this.rings = [];
    this.texts = [];
    this.slashes = [];
    this.maxParticles = 220;
  }

  clear() {
    this.particles.length = 0;
    this.rings.length = 0;
    this.texts.length = 0;
    this.slashes.length = 0;
  }

  spawnHit(x, y, power, color, dir = 1, opts = {}) {
    const n = power === "heavy" || power === "super" ? 18 : 10;
    const speed = power === "heavy" ? 620 : 380;
    for (let i = 0; i < n; i++) {
      const a = rand(-0.9, 0.9) + (dir > 0 ? 0 : Math.PI);
      const v = rand(0.3, 1) * speed;
      this.particles.push({
        x, y,
        vx: Math.cos(a) * v + dir * 40,
        vy: Math.sin(a) * v * 0.8 - rand(0, 120),
        life: rand(0.18, 0.4),
        maxLife: 0.4,
        size: rand(2, 6),
        color,
        type: i % 3 === 0 ? "shard" : "spark",
        gravity: 900,
        drag: 0.94,
        rot: rand(0, TAU),
        spin: rand(-16, 16),
      });
    }
    // bright core streaks
    for (let i = 0; i < 5; i++) {
      const a = rand(-0.5, 0.5) + (dir > 0 ? 0 : Math.PI);
      const v = rand(300, 760);
      this.particles.push({
        x, y,
        vx: Math.cos(a) * v,
        vy: Math.sin(a) * v,
        life: rand(0.12, 0.22),
        maxLife: 0.22,
        size: rand(9, 18),
        color: opts.core || "#fff4d8",
        type: "streak",
        gravity: 0,
        drag: 0.9,
        rot: 0,
        spin: 0,
      });
    }
    this.rings.push({
      x, y, r: 6, vr: power === "heavy" ? 760 : 520,
      life: 0.24, maxLife: 0.24, color, width: power === "heavy" ? 7 : 4,
      impact: true,
    });
    if (power === "heavy" || power === "super") {
      this.rings.push({
        x, y, r: 2, vr: 380, life: 0.34, maxLife: 0.34, color: "#fff0d8",
        width: 2.5, impact: true,
      });
    }
    if (power === "super") {
      this.rings.push({ x, y, r: 24, vr: 1200, life: 0.45, maxLife: 0.45, color: "#fff2c8", width: 10 });
      this.spawnShock(x, y, color);
    }
  }

  spawnBlock(x, y, color) {
    for (let i = 0; i < 10; i++) {
      const a = rand(0, TAU);
      const v = rand(90, 320);
      this.particles.push({
        x, y,
        vx: Math.cos(a) * v,
        vy: Math.sin(a) * v - 60,
        life: rand(0.15, 0.3),
        maxLife: 0.3,
        size: rand(2, 4),
        color,
        type: "spark",
        gravity: 300,
        drag: 0.93,
        rot: 0,
        spin: 0,
      });
    }
    this.rings.push({ x, y, r: 10, vr: 420, life: 0.22, maxLife: 0.22, color, width: 3 });
  }

  spawnShock(x, y, color) {
    this.rings.push({ x, y, r: 16, vr: 520, life: 0.6, maxLife: 0.6, color, width: 5 });
    this.rings.push({ x, y, r: 4, vr: 260, life: 0.8, maxLife: 0.8, color: "#fff0d8", width: 2 });
  }

  spawnDust(x, y, n = 6, dir = 0, color = "rgba(220,190,170,0.5)") {
    for (let i = 0; i < n; i++) {
      const a = -Math.PI / 2 + rand(-0.9, 0.9);
      const v = rand(30, 140);
      this.particles.push({
        x: x + rand(-16, 16), y: y - 4,
        vx: Math.cos(a) * v + dir * 60,
        vy: Math.sin(a) * v * 0.5,
        life: rand(0.3, 0.6),
        maxLife: 0.6,
        size: rand(6, 14),
        color,
        type: "dust",
        gravity: -30,
        drag: 0.92,
        rot: 0,
        spin: 0,
      });
    }
  }

  spawnTrail(x, y, color, size = 5, vy = 0) {
    this.particles.push({
      x, y,
      vx: rand(-24, 24),
      vy: vy + rand(-18, 18),
      life: rand(0.2, 0.4),
      maxLife: 0.4,
      size,
      color,
      type: "ember",
      gravity: -40,
      drag: 0.95,
      rot: 0,
      spin: 0,
    });
  }

  spawnFireBurst(x, y, color, n = 20) {
    for (let i = 0; i < n; i++) {
      const a = rand(0, TAU);
      const v = rand(60, 360);
      this.particles.push({
        x, y,
        vx: Math.cos(a) * v,
        vy: Math.sin(a) * v,
        life: rand(0.25, 0.6),
        maxLife: 0.6,
        size: rand(5, 15),
        color,
        type: "orb",
        gravity: -60,
        drag: 0.92,
        rot: 0,
        spin: 0,
      });
    }
    this.rings.push({ x, y, r: 10, vr: 600, life: 0.4, maxLife: 0.4, color, width: 6 });
  }

  spawnText(x, y, text, color = "#fff", size = 26) {
    this.texts.push({ x, y, text, color, size, life: 0.8, maxLife: 0.8, vy: -46 });
  }

  update(dt) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= dt;
      if (p.life <= 0) {
        this.particles.splice(i, 1);
        continue;
      }
      p.vy += p.gravity * dt;
      p.vx *= Math.pow(p.drag, dt * 60);
      p.vy *= Math.pow(p.drag, dt * 60);
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.rot += p.spin * dt;
    }
    for (let i = this.rings.length - 1; i >= 0; i--) {
      const r = this.rings[i];
      r.life -= dt;
      if (r.life <= 0) {
        this.rings.splice(i, 1);
        continue;
      }
      r.r += r.vr * dt;
      r.vr *= 0.9;
    }
    for (let i = this.texts.length - 1; i >= 0; i--) {
      const t = this.texts[i];
      t.life -= dt;
      if (t.life <= 0) {
        this.texts.splice(i, 1);
        continue;
      }
      t.y += t.vy * dt;
      t.vy *= 0.92;
    }
    for (let i = this.slashes.length - 1; i >= 0; i--) {
      const s = this.slashes[i];
      s.life -= dt;
      if (s.life <= 0) this.slashes.splice(i, 1);
    }
    if (this.particles.length > this.maxParticles) {
      this.particles.splice(0, this.particles.length - this.maxParticles);
    }
  }

  draw(ctx) {
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    for (const p of this.particles) {
      const k = clamp(p.life / p.maxLife, 0, 1);
      ctx.globalAlpha = k;
      if (p.type === "streak") {
        ctx.strokeStyle = p.color;
        ctx.lineWidth = p.size * 0.4;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p.x - p.vx * 0.028, p.y - p.vy * 0.028);
        ctx.stroke();
      } else if (p.type === "shard") {
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size, -p.size * 0.35, p.size * 2 * k + 2, p.size * 0.7);
        ctx.restore();
      } else if (p.type === "dust") {
        ctx.globalAlpha = k * 0.4;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * (1.6 - k * 0.6), 0, TAU);
        ctx.fill();
      } else {
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, Math.max(0.5, p.size * k), 0, TAU);
        ctx.fill();
      }
    }
    for (const r of this.rings) {
      const k = clamp(r.life / r.maxLife, 0, 1);
      ctx.globalAlpha = k * (r.impact ? 0.55 : 0.9);
      ctx.strokeStyle = r.color;
      ctx.lineWidth = r.width * k + 0.5;
      if (r.impact) {
        ctx.setLineDash([r.r * 0.85, r.r * 0.5]);
        ctx.lineDashOffset = r.r * 0.35;
      } else {
        ctx.setLineDash([]);
      }
      ctx.beginPath();
      ctx.arc(r.x, r.y, r.r, 0, TAU);
      ctx.stroke();
      ctx.setLineDash([]);
    }
    ctx.restore();

    for (const t of this.texts) {
      const k = clamp(t.life / t.maxLife, 0, 1);
      const pop = 1 + (1 - k) * 0.15;
      ctx.save();
      ctx.globalAlpha = Math.min(1, k * 2);
      ctx.translate(t.x, t.y);
      ctx.scale(pop, pop);
      ctx.font = `900 ${t.size}px Vazirmatn, sans-serif`;
      ctx.textAlign = "center";
      ctx.lineWidth = 4;
      ctx.strokeStyle = "rgba(10,5,15,0.75)";
      ctx.strokeText(t.text, 0, 0);
      ctx.fillStyle = t.color;
      ctx.fillText(t.text, 0, 0);
      ctx.restore();
    }
  }
}
