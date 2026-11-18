import { GROUND_Y, STAGE_L, STAGE_R, ATTACKS } from "./fighter.js";
import { clamp, lerp, TAU, roundRect, rotateAround, toFa, easeOutBack, hash } from "./utils.js";

const W = 1280;
const H = 720;

function hexToRgb(hex) {
  const h = hex.replace("#", "");
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  const n = parseInt(full, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
function rgba(hex, a) {
  const [r, g, b] = hexToRgb(hex);
  return `rgba(${r},${g},${b},${a})`;
}
function mix(hexA, hexB, t) {
  const a = hexToRgb(hexA), b = hexToRgb(hexB);
  return `rgb(${Math.round(lerp(a[0], b[0], t))},${Math.round(lerp(a[1], b[1], t))},${Math.round(lerp(a[2], b[2], t))})`;
}

function skewedPath(ctx, x, y, w, h, skew = 10) {
  ctx.beginPath();
  ctx.moveTo(x + skew, y);
  ctx.lineTo(x + w, y);
  ctx.lineTo(x + w - skew, y + h);
  ctx.lineTo(x, y + h);
  ctx.closePath();
}

export class Renderer {
  constructor() {
    this.bg = null;
    this.lanterns = [
      { x: 250, y: 142, s: 1 },
      { x: 428, y: 176, s: 0.8 },
      { x: 610, y: 190, s: 0.9 },
      { x: 790, y: 184, s: 0.85 },
      { x: 970, y: 164, s: 0.95 },
      { x: 1120, y: 132, s: 1 },
    ];
    this.embers = Array.from({ length: 34 }, (_, i) => ({
      x: 120 + hash(i * 3.7) * 1040,
      y: hash(i * 9.1) * 480 + 140,
      speed: 8 + hash(i * 5.3) * 22,
      size: 1 + hash(i * 7.7) * 2.4,
      phase: hash(i * 2.2) * TAU,
      warm: hash(i * 4.4) > 0.35,
    }));
    this.buildBackground();
  }

  buildBackground() {
    const bg = document.createElement("canvas");
    bg.width = 1400;
    bg.height = 720;
    const c = bg.getContext("2d");
    c.translate(60, 0);

    // ---------- sky ----------
    const sky = c.createLinearGradient(0, 0, 0, 500);
    sky.addColorStop(0, "#0a0618");
    sky.addColorStop(0.28, "#241033");
    sky.addColorStop(0.55, "#55203f");
    sky.addColorStop(0.76, "#a03a44");
    sky.addColorStop(0.92, "#e56d4c");
    sky.addColorStop(1, "#ffa15e");
    c.fillStyle = sky;
    c.fillRect(0, 0, W, 500);

    // stars
    for (let i = 0; i < 90; i++) {
      const x = hash(i * 1.7) * W;
      const y = hash(i * 5.9) * 260;
      const s = hash(i * 8.3) * 1.4 + 0.3;
      c.fillStyle = `rgba(255,235,220,${0.15 + hash(i * 2.9) * 0.45})`;
      c.beginPath();
      c.arc(x, y, s, 0, TAU);
      c.fill();
    }

    // sun glow + disc
    const sx = 935, sy = 360, sr = 158;
    const glow = c.createRadialGradient(sx, sy, 20, sx, sy, sr * 2.4);
    glow.addColorStop(0, "rgba(255,190,120,0.5)");
    glow.addColorStop(0.55, "rgba(255,120,80,0.14)");
    glow.addColorStop(1, "rgba(255,90,60,0)");
    c.fillStyle = glow;
    c.fillRect(sx - sr * 2.4, sy - sr * 2.4, sr * 4.8, sr * 4.8);

    const sun = c.createLinearGradient(0, sy - sr, 0, sy + sr);
    sun.addColorStop(0, "#ffe9b8");
    sun.addColorStop(0.5, "#ffbe72");
    sun.addColorStop(1, "#ff7a5c");
    c.fillStyle = sun;
    c.beginPath();
    c.arc(sx, sy, sr, 0, TAU);
    c.fill();

    // retro sun bands
    c.fillStyle = "rgba(90,30,52,0.28)";
    for (let i = 0; i < 7; i++) {
      const yy = sy + 12 + i * 22;
      const hgt = 2 + i * 0.9;
      c.fillRect(sx - sr, yy, sr * 2, hgt);
    }

    // clouds
    const cloudBands = [
      { y: 186, alpha: 0.3, col: "#361c42", n: 7, scale: 1.25 },
      { y: 268, alpha: 0.24, col: "#4d2347", n: 6, scale: 1 },
      { y: 342, alpha: 0.18, col: "#7c3448", n: 5, scale: 1.4 },
    ];
    for (const band of cloudBands) {
      for (let i = 0; i < band.n; i++) {
        const x = (i * 220 + hash(i * 3.1 + band.y) * 140) % (W + 260) - 80;
        const w = 150 * band.scale + hash(i * 1.3) * 90;
        c.fillStyle = rgba(band.col, band.alpha);
        c.beginPath();
        c.ellipse(x, band.y + hash(i * 7.7) * 16, w, 14, 0, 0, TAU);
        c.fill();
      }
    }

    // ---------- far mountains ----------
    c.fillStyle = "#3a1c44";
    c.beginPath();
    c.moveTo(-40, 470);
    c.lineTo(40, 408);
    c.lineTo(130, 442);
    c.lineTo(240, 366);
    c.lineTo(340, 430);
    c.lineTo(430, 392);
    c.lineTo(520, 452);
    c.lineTo(650, 400);
    c.lineTo(760, 448);
    c.lineTo(860, 388);
    c.lineTo(980, 438);
    c.lineTo(1090, 372);
    c.lineTo(1200, 430);
    c.lineTo(1320, 402);
    c.lineTo(1320, 560);
    c.lineTo(-40, 560);
    c.closePath();
    c.fill();
    c.fillStyle = "rgba(255,170,120,0.10)";
    c.beginPath();
    c.moveTo(240, 366);
    c.lineTo(340, 430);
    c.lineTo(280, 430);
    c.closePath();
    c.fill();

    // mid ridge
    c.fillStyle = "#2a1432";
    c.beginPath();
    c.moveTo(-40, 500);
    c.lineTo(80, 452);
    c.lineTo(180, 486);
    c.lineTo(300, 442);
    c.lineTo(420, 492);
    c.lineTo(540, 456);
    c.lineTo(680, 498);
    c.lineTo(810, 460);
    c.lineTo(950, 492);
    c.lineTo(1090, 448);
    c.lineTo(1210, 490);
    c.lineTo(1320, 466);
    c.lineTo(1320, 570);
    c.lineTo(-40, 570);
    c.closePath();
    c.fill();

    // ---------- pagoda / town silhouettes ----------
    const silhouette = "#1c0e25";
    c.fillStyle = silhouette;
    // left temple roof
    c.beginPath();
    c.moveTo(70, 520);
    c.lineTo(128, 452);
    c.lineTo(140, 468);
    c.lineTo(210, 430);
    c.lineTo(216, 448);
    c.lineTo(270, 424);
    c.lineTo(292, 470);
    c.lineTo(330, 470);
    c.lineTo(330, 550);
    c.lineTo(70, 550);
    c.closePath();
    c.fill();
    // right pagoda
    c.beginPath();
    c.moveTo(1000, 540);
    c.lineTo(1010, 470);
    c.lineTo(976, 466);
    c.lineTo(1046, 414);
    c.lineTo(1074, 434);
    c.lineTo(1096, 400);
    c.lineTo(1118, 434);
    c.lineTo(1150, 416);
    c.lineTo(1206, 466);
    c.lineTo(1170, 470);
    c.lineTo(1178, 540);
    c.closePath();
    c.fill();
    // windows
    for (let i = 0; i < 14; i++) {
      const x = 90 + hash(i * 6.1) * 180;
      const y = 480 + hash(i * 2.7) * 56;
      c.fillStyle = `rgba(255,170,90,${0.18 + hash(i * 4.4) * 0.3})`;
      c.fillRect(x, y, 4, 6);
    }
    for (let i = 0; i < 10; i++) {
      const x = 1020 + hash(i * 9.4) * 160;
      const y = 470 + hash(i * 3.8) * 66;
      c.fillStyle = `rgba(255,150,120,${0.15 + hash(i * 1.9) * 0.25})`;
      c.fillRect(x, y, 3, 5);
    }

    // torii gates
    const torii = (x, base, s) => {
      c.fillStyle = "#2b1226";
      c.fillRect(x - 3 * s, base - 90 * s, 6 * s, 90 * s);
      c.fillRect(x + 45 * s, base - 90 * s, 6 * s, 90 * s);
      c.fillRect(x - 12 * s, base - 74 * s, 78 * s, 6 * s);
      c.beginPath();
      c.moveTo(x - 20 * s, base - 96 * s);
      c.lineTo(x + 68 * s, base - 96 * s);
      c.lineTo(x + 58 * s, base - 86 * s);
      c.lineTo(x - 10 * s, base - 86 * s);
      c.closePath();
      c.fill();
      c.fillStyle = "rgba(255,120,90,0.18)";
      c.fillRect(x - 3 * s, base - 90 * s, 2 * s, 90 * s);
    };
    torii(120, 552, 1.05);
    torii(1130, 552, 0.9);

    // ---------- crowd ----------
    // stand
    c.fillStyle = "#1a0e24";
    c.fillRect(0, 500, W, 76);
    c.fillStyle = "rgba(255,150,100,0.05)";
    c.fillRect(0, 500, W, 18);
    // row of backs (silhouette)
    for (let row = 0; row < 3; row++) {
      const baseY = 510 + row * 20;
      const size = 9 + row * 2;
      for (let i = 0; i < 27; i++) {
        const x = -10 + i * 49 + hash(i * 4.3 + row) * 22;
        const y = baseY + hash(i * 8.8 + row * 3) * 8;
        const col = row === 0 ? "#341c40" : row === 1 ? "#2b1737" : "#22122d";
        c.fillStyle = col;
        c.beginPath();
        c.ellipse(x, y, size * 0.8, size, 0, 0, TAU);
        c.fill();
        c.beginPath();
        c.ellipse(x, y + size * 1.3, size * 1.55, size * 1.15, 0, 0, TAU);
        c.fill();
        // warm rim light from the stage
        c.strokeStyle = `rgba(255,160,110,${0.08 + hash(i * 7.3) * 0.08})`;
        c.lineWidth = 1.2;
        c.beginPath();
        c.ellipse(x, y - 1, size * 0.8, size * 0.9, 0, Math.PI * 1.05, Math.PI * 1.95);
        c.stroke();
        if (hash(i * 2.2 + row * 9) > 0.55) {
          c.fillStyle = `rgba(255,180,100,${0.28 + hash(i) * 0.35})`;
          c.beginPath();
          c.arc(x + size, y + 4, 1.5, 0, TAU);
          c.fill();
        }
        // a few raised lanterns
        if (hash(i * 6.1 + row * 2.3) > 0.86) {
          const lx = x + size * 1.8;
          const ly = y - size * 1.6;
          const lg = c.createRadialGradient(lx, ly, 1, lx, ly, 14);
          lg.addColorStop(0, "rgba(255,190,110,0.5)");
          lg.addColorStop(1, "rgba(255,120,70,0)");
          c.fillStyle = lg;
          c.beginPath();
          c.arc(lx, ly, 14, 0, TAU);
          c.fill();
          c.fillStyle = "#ff8a4a";
          c.beginPath();
          c.ellipse(lx, ly, 2.6, 4, 0, 0, TAU);
          c.fill();
        }
      }
    }
    // railing and paper lanterns on the rail
    c.fillStyle = "#2a1535";
    c.fillRect(0, 556, W, 12);
    c.fillStyle = "rgba(255,180,120,0.22)";
    c.fillRect(0, 556, W, 1.5);
    for (let i = 0; i < 18; i++) {
      const x = 40 + i * 70;
      c.fillStyle = "rgba(255,120,80,0.5)";
      c.beginPath();
      c.ellipse(x, 552, 4, 6, 0, 0, TAU);
      c.fill();
      c.fillStyle = "rgba(255,210,150,0.22)";
      c.beginPath();
      c.arc(x, 552, 10, 0, TAU);
      c.fill();
    }

    // ---------- stage floor ----------
    c.fillStyle = "#120a18";
    c.fillRect(0, 566, W, 22);
    const rim = c.createLinearGradient(0, 566, 0, 586);
    rim.addColorStop(0, "rgba(255,150,90,0.08)");
    rim.addColorStop(1, "rgba(255,190,120,0.35)");
    c.fillStyle = rim;
    c.fillRect(0, 576, W, 3);

    const floor = c.createLinearGradient(0, 580, 0, 720);
    floor.addColorStop(0, "#2a1426");
    floor.addColorStop(0.35, "#241020");
    floor.addColorStop(1, "#120812");
    c.fillStyle = floor;
    c.fillRect(0, 580, W, 140);

    // perspective seams
    c.strokeStyle = "rgba(255,170,120,0.06)";
    c.lineWidth = 1.5;
    const vpx = 640, vpy = 430;
    for (let i = -6; i <= 12; i++) {
      const bx = i * 120 + 40;
      const t = (580 - vpy) / (720 - vpy);
      c.beginPath();
      c.moveTo(lerp(vpx, bx, 1), 580);
      c.lineTo(bx + (bx - vpx) * 0.7, 720);
      c.stroke();
    }
    // horizontal plank lines
    [600, 616, 636, 662, 694].forEach((y, i) => {
      c.strokeStyle = `rgba(255,180,130,${0.07 - i * 0.008})`;
      c.lineWidth = 1.4;
      c.beginPath();
      c.moveTo(0, y);
      c.lineTo(W, y);
      c.stroke();
    });
    // stage rim light along the back edge
    const edge = c.createLinearGradient(0, 566, 0, 590);
    edge.addColorStop(0, "rgba(255,140,80,0)");
    edge.addColorStop(1, "rgba(255,165,90,0.18)");
    c.fillStyle = edge;
    c.fillRect(0, 566, W, 24);

    // center emblem on floor
    c.save();
    c.translate(640, 664);
    c.scale(1, 0.26);
    c.strokeStyle = "rgba(255,180,110,0.10)";
    c.lineWidth = 8;
    c.beginPath();
    c.arc(0, 0, 190, 0, TAU);
    c.stroke();
    c.strokeStyle = "rgba(255,190,120,0.06)";
    c.lineWidth = 2;
    c.beginPath();
    c.arc(0, 0, 150, 0, TAU);
    c.stroke();
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * TAU;
      c.beginPath();
      c.moveTo(Math.cos(a) * 160, Math.sin(a) * 160);
      c.lineTo(Math.cos(a) * 190, Math.sin(a) * 190);
      c.stroke();
    }
    c.restore();

    // front edge glow
    const front = c.createLinearGradient(0, 700, 0, 720);
    front.addColorStop(0, "rgba(0,0,0,0)");
    front.addColorStop(1, "rgba(0,0,0,0.6)");
    c.fillStyle = front;
    c.fillRect(0, 690, W, 30);

    this.bg = bg;
  }

  render(ctx, game) {
    const { animTime } = game;
    ctx.save();
    ctx.clearRect(0, 0, W, H);

    // camera
    const baseZoom = 1.055;
    ctx.save();
    ctx.translate(W / 2, H / 2 + 18);
    ctx.scale(game.zoom * baseZoom, game.zoom * baseZoom);
    ctx.translate(-W / 2, -H / 2 - 18);
    ctx.translate(game.shakeX, game.shakeY);

    const midX = (game.fighters[0].x + game.fighters[1].x) / 2;
    const parallax = (midX - 640) * 0.035;
    ctx.drawImage(this.bg, -60 + parallax, 0);

    this.drawSkyDynamics(ctx, game, parallax);
    this.drawTorches(ctx, game);

    // ground shadows
    for (const f of game.fighters) f.drawShadow(ctx);

    // projectiles under fighters? draw after for pop
    const order = [...game.fighters].sort((a, b) => (a.ko ? -1 : 0) - (b.ko ? -1 : 0));
    for (const f of order) this.drawFighter(ctx, f, game);

    this.drawProjectiles(ctx, game);
    game.fx.draw(ctx);

    // super rush speed lines
    for (const f of game.fighters) {
      if (f.attack?.type !== "super" || f.attack.t < ATTACKS.super.startup) continue;
      const dir = -f.facing;
      const cy = f.y - 90;
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      ctx.lineCap = "round";
      for (let i = 0; i < 12; i++) {
        const y = cy + (hash(i * 3.7 + Math.floor(game.animTime * 14)) - 0.5) * 170;
        const len = 60 + hash(i * 5.1) * 150;
        const start = f.x + dir * (50 + hash(i * 9.3) * 90);
        ctx.strokeStyle = rgba(f.palette.glow, 0.12 + hash(i * 4.2) * 0.2);
        ctx.lineWidth = 1 + hash(i * 8.1) * 3;
        ctx.beginPath();
        ctx.moveTo(start, y);
        ctx.lineTo(start + dir * len, y);
        ctx.stroke();
      }
      ctx.restore();
    }

    ctx.restore();

    this.drawVignette(ctx);

    if (game.showHud) this.drawHUD(ctx, game);
    this.drawAnnouncement(ctx, game);

    if (game.flash.a > 0) {
      ctx.save();
      ctx.globalAlpha = Math.min(0.9, game.flash.a);
      ctx.fillStyle = game.flash.color;
      ctx.fillRect(0, 0, W, H);
      ctx.restore();
    }
  }

  drawSkyDynamics(ctx, game, parallax) {
    const t = game.animTime;

    // drifting fog band
    const fog = ctx.createLinearGradient(0, 420, 0, 580);
    fog.addColorStop(0, "rgba(255,140,100,0)");
    fog.addColorStop(0.6, "rgba(255,130,90,0.05)");
    fog.addColorStop(1, "rgba(20,8,24,0)");
    ctx.fillStyle = fog;
    ctx.fillRect(0, 420, W, 160);

    // lantern rope + lanterns
    ctx.save();
    ctx.strokeStyle = "rgba(20,10,24,0.6)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, 100);
    ctx.quadraticCurveTo(640, 210, W, 96);
    ctx.stroke();

    const ropeY = (x) => {
      const tt = clamp(x / W, 0, 1);
      const u = 1 - tt;
      return u * u * 100 + 2 * u * tt * 210 + tt * tt * 96;
    };

    for (let i = 0; i < this.lanterns.length; i++) {
      const l = this.lanterns[i];
      const sway = Math.sin(t * 1.1 + i * 1.3) * 0.06;
      const x = l.x + Math.sin(t * 0.7 + i) * 4;
      const y = l.y + Math.sin(t * 1.1 + i * 1.3) * 3;
      const s = l.s;
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(sway);
      // string up to the catenary
      const topLocal = ropeY(x) - y;
      if (topLocal < -4) {
        ctx.strokeStyle = "rgba(30,15,30,0.75)";
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.moveTo(0, topLocal);
        ctx.lineTo(0, -18 * s);
        ctx.stroke();
        ctx.fillStyle = "rgba(40,20,35,0.9)";
        ctx.beginPath();
        ctx.arc(0, topLocal + 1, 2, 0, TAU);
        ctx.fill();
      }
      // hanging ring
      ctx.strokeStyle = "rgba(255,210,150,0.55)";
      ctx.lineWidth = 1.3;
      ctx.beginPath();
      ctx.arc(0, -20 * s, 3.2 * s, 0, TAU);
      ctx.stroke();
      // glow
      const g = ctx.createRadialGradient(0, 10, 4, 0, 10, 52 * s);
      g.addColorStop(0, "rgba(255,190,110,0.5)");
      g.addColorStop(0.4, "rgba(255,120,70,0.18)");
      g.addColorStop(1, "rgba(255,90,50,0)");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(0, 10, 52 * s, 0, TAU);
      ctx.fill();
      // body
      const bodyGrad = ctx.createLinearGradient(0, -14, 0, 36);
      bodyGrad.addColorStop(0, "#ffcf8a");
      bodyGrad.addColorStop(0.5, "#ff7c47");
      bodyGrad.addColorStop(1, "#b7353c");
      ctx.fillStyle = bodyGrad;
      ctx.beginPath();
      ctx.ellipse(0, 10, 14 * s, 17 * s, 0, 0, TAU);
      ctx.fill();
      // ribs
      ctx.strokeStyle = "rgba(90,20,30,0.35)";
      ctx.lineWidth = 1;
      for (let k = -1; k <= 1; k++) {
        ctx.beginPath();
        ctx.ellipse(0, 10, 14 * s, 17 * s, 0, Math.PI * 0.15, Math.PI * 0.85);
        ctx.stroke();
      }
      // caps
      ctx.fillStyle = "#2a1420";
      ctx.fillRect(-6 * s, -6 * s, 12 * s, 3.5 * s);
      ctx.fillRect(-6 * s, 24 * s, 12 * s, 3.5 * s);
      // tassel
      ctx.strokeStyle = "#ffcf8a";
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(0, 29 * s);
      ctx.lineTo(0, 37 * s);
      ctx.stroke();
      ctx.restore();
    }
    ctx.restore();

    // floating embers
    for (const e of this.embers) {
      const y = 140 + ((e.y - t * e.speed + 5000) % 500);
      const x = e.x + Math.sin(t * 0.6 + e.phase) * 26;
      const a = 0.18 + (Math.sin(t * 1.7 + e.phase) + 1) * 0.15;
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      ctx.fillStyle = e.warm ? `rgba(255,170,100,${a})` : `rgba(140,230,255,${a * 0.7})`;
      ctx.beginPath();
      ctx.arc(x, y, e.size, 0, TAU);
      ctx.fill();
      ctx.restore();
    }

    // light pools on the floor from each side
    for (const f of game.fighters) {
      const g = ctx.createRadialGradient(f.x, GROUND_Y + 10, 4, f.x, GROUND_Y + 10, 150);
      g.addColorStop(0, rgba(f.palette.glow, 0.13));
      g.addColorStop(0.5, rgba(f.palette.glow, 0.045));
      g.addColorStop(1, rgba(f.palette.glow, 0));
      ctx.fillStyle = g;
      ctx.save();
      ctx.translate(f.x, GROUND_Y + 10);
      ctx.scale(1, 0.28);
      ctx.beginPath();
      ctx.arc(0, 0, 150, 0, TAU);
      ctx.fill();
      ctx.restore();
    }
  }

  drawTorches(ctx, game) {
    const t = game.animTime;
    for (const side of [-1, 1]) {
      const x = side === -1 ? 70 : 1210;
      const base = 590;
      // post
      ctx.fillStyle = "#1a0d1c";
      ctx.fillRect(x - 3, base - 62, 6, 62);
      ctx.fillStyle = "#2a1428";
      ctx.fillRect(x - 12, base - 66, 24, 6);
      // bowl
      ctx.fillStyle = "#2c1524";
      ctx.beginPath();
      ctx.moveTo(x - 18, base - 66);
      ctx.lineTo(x + 18, base - 66);
      ctx.lineTo(x + 11, base - 80);
      ctx.lineTo(x - 11, base - 80);
      ctx.closePath();
      ctx.fill();
      // flame
      const flick = Math.sin(t * 9 + side) * 0.12 + Math.sin(t * 15) * 0.06;
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      const g = ctx.createRadialGradient(x, base - 108, 2, x, base - 100, 70);
      g.addColorStop(0, "rgba(255,210,140,0.5)");
      g.addColorStop(0.4, "rgba(255,120,60,0.2)");
      g.addColorStop(1, "rgba(255,80,40,0)");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(x, base - 100, 70, 0, TAU);
      ctx.fill();

      ctx.fillStyle = "#ff7a3d";
      ctx.beginPath();
      ctx.moveTo(x - 12, base - 78);
      ctx.quadraticCurveTo(x - 16 + flick * 22, base - 104, x + flick * 30, base - 132);
      ctx.quadraticCurveTo(x + 16 + flick * 22, base - 100, x + 12, base - 78);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = "#ffe0a0";
      ctx.beginPath();
      ctx.moveTo(x - 6, base - 80);
      ctx.quadraticCurveTo(x - 7, base - 100, x + flick * 18, base - 116);
      ctx.quadraticCurveTo(x + 7, base - 96, x + 6, base - 80);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
  }

  drawFighter(ctx, f, game) {
    const p = f.pose;
    const pal = f.palette;
    const t = game.animTime;
    const isSuper = f.attack?.type === "super";
    const fullMeter = f.meter >= 100 && !f.ko;
    const hip = { x: p.hx, y: p.hy };
    const rot = (x, y) => {
      const [rx, ry] = rotateAround(x, y, hip.x, hip.y, p.lean);
      return { x: rx, y: ry };
    };

    ctx.save();
    ctx.translate(f.x, f.y);
    ctx.scale(f.facing, 1);
    if (f.ko) ctx.rotate(f.koRot);

    // aura
    if (fullMeter || isSuper) {
      const aura = ctx.createRadialGradient(0, -80, 10, 0, -80, 105);
      const col = isSuper ? pal.trim : pal.glow;
      aura.addColorStop(0, rgba(col, 0.16 + Math.sin(t * 6) * 0.04));
      aura.addColorStop(0.6, rgba(col, 0.05));
      aura.addColorStop(1, rgba(col, 0));
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      ctx.fillStyle = aura;
      ctx.beginPath();
      ctx.ellipse(0, -80, 100, 130, 0, 0, TAU);
      ctx.fill();
      ctx.restore();
    }

    // afterimages during super
    if (isSuper) {
      for (let i = 0; i < 3; i++) {
        ctx.save();
        ctx.globalAlpha = 0.12 - i * 0.03;
        ctx.globalCompositeOperation = "lighter";
        ctx.fillStyle = pal.glow;
        ctx.beginPath();
        ctx.ellipse(-20 - i * 16, -80, 22, 62, 0, 0, TAU);
        ctx.fill();
        ctx.restore();
      }
    }

    const sh = rot(p.sx + 10, p.sy + 3);
    const bsh = rot(p.sx - 9, p.sy + 5);
    const neck = rot(p.sx + 2, p.sy - 4);
    const head = rot(p.hdx, p.hdy);
    const fElbow = rot(p.fex, p.fey);
    const fHand = rot(p.fhx, p.fhy);
    const bElbow = rot(p.bex, p.bey);
    const bHand = rot(p.bhx, p.bhy);

    const skin = pal.skin;
    const outline = "rgba(12,6,16,0.72)";

    // ---------------- back leg ----------------
    this.limb(ctx, hip.x, hip.y, p.bkx, p.bky, p.bfx, p.bfy, 19, outline, pal.dark);
    this.drawBoot(ctx, p.bfx, p.bfy, p.bkx, p.bky, pal, true);

    // ---------------- back arm ----------------
    this.limb(ctx, bsh.x, bsh.y, bElbow.x, bElbow.y, bHand.x, bHand.y, 14, outline, pal.primary2);
    this.drawGlove(ctx, bHand.x, bHand.y, pal, true);

    // ---------------- torso ----------------
    const torsoGrad = ctx.createLinearGradient(hip.x - 20, p.sy, hip.x + 20, p.hy);
    torsoGrad.addColorStop(0, pal.primary);
    torsoGrad.addColorStop(0.55, pal.primary2);
    torsoGrad.addColorStop(1, mix(pal.primary2, "#12060f", 0.35));
    ctx.beginPath();
    ctx.moveTo(hip.x - 16, hip.y + 6);
    ctx.quadraticCurveTo(hip.x - 23, hip.y - 26, sh.x - 20, sh.y + 4);
    ctx.quadraticCurveTo(hip.x + 8, sh.y - 12, sh.x + 20, sh.y + 4);
    ctx.quadraticCurveTo(hip.x + 23, hip.y - 26, hip.x + 16, hip.y + 6);
    ctx.closePath();
    ctx.fillStyle = torsoGrad;
    ctx.fill();
    ctx.lineWidth = 2.4;
    ctx.strokeStyle = outline;
    ctx.stroke();

    // chest highlight
    ctx.save();
    ctx.globalAlpha = 0.35;
    ctx.strokeStyle = pal.trim;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(sh.x + 4, sh.y + 10);
    ctx.quadraticCurveTo(hip.x + 12, hip.y - 30, hip.x + 7, hip.y - 2);
    ctx.stroke();
    ctx.restore();

    // sash / coat tails
    this.drawGarment(ctx, f, pal, hip, sh, t);

    // belt
    ctx.lineCap = "round";
    ctx.strokeStyle = outline;
    ctx.lineWidth = 11;
    ctx.beginPath();
    ctx.moveTo(hip.x - 15, hip.y + 2);
    ctx.lineTo(hip.x + 15, hip.y + 2);
    ctx.stroke();
    ctx.strokeStyle = pal.trim;
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(hip.x - 14, hip.y + 2);
    ctx.lineTo(hip.x + 14, hip.y + 2);
    ctx.stroke();
    ctx.fillStyle = pal.trim;
    ctx.beginPath();
    ctx.arc(hip.x + 3, hip.y + 2, 3.4, 0, TAU);
    ctx.fill();

    // collar
    ctx.fillStyle = pal.dark;
    ctx.beginPath();
    ctx.moveTo(sh.x - 6, sh.y + 2);
    ctx.lineTo(sh.x + 2, sh.y + 22);
    ctx.lineTo(sh.x + 9, sh.y + 2);
    ctx.closePath();
    ctx.fill();

    // shoulder pads
    for (const [s, col] of [[sh, pal.primary], [bsh, pal.primary2]]) {
      const g = ctx.createRadialGradient(s.x - 2, s.y - 3, 1, s.x, s.y, 12);
      g.addColorStop(0, pal.secondary);
      g.addColorStop(1, col);
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(s.x, s.y, 10, 0, TAU);
      ctx.fill();
      ctx.strokeStyle = outline;
      ctx.lineWidth = 1.6;
      ctx.stroke();
    }

    // ---------------- front leg ----------------
    this.limb(ctx, hip.x + 2, hip.y, p.fkx, p.fky, p.ffx, p.ffy, 20, outline, pal.primary2);
    this.drawBoot(ctx, p.ffx, p.ffy, p.fkx, p.fky, pal, false);

    // ---------------- neck + head ----------------
    ctx.strokeStyle = outline;
    ctx.lineWidth = 13;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(sh.x + 1, sh.y - 3);
    ctx.lineTo(head.x - 1, head.y + 10);
    ctx.stroke();
    ctx.strokeStyle = skin;
    ctx.lineWidth = 9;
    ctx.beginPath();
    ctx.moveTo(sh.x + 1, sh.y - 5);
    ctx.lineTo(head.x - 1, head.y + 9);
    ctx.stroke();

    this.drawHead(ctx, f, pal, head, neck, t);

    // ---------------- front arm ----------------
    this.limb(ctx, sh.x, sh.y + 2, fElbow.x, fElbow.y, fHand.x, fHand.y, 15, outline, pal.primary);
    this.drawGlove(ctx, fHand.x, fHand.y, pal, false);

    // super charge at hand
    if (isSuper) {
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      const g = ctx.createRadialGradient(fHand.x, fHand.y, 2, fHand.x, fHand.y, 34);
      g.addColorStop(0, "rgba(255,255,255,0.9)");
      g.addColorStop(0.35, rgba(pal.glow, 0.6));
      g.addColorStop(1, rgba(pal.glow, 0));
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(fHand.x, fHand.y, 34, 0, TAU);
      ctx.fill();
      ctx.restore();
    }

    // blocking shield
    if (f.blocking && !f.attack && f.stun <= 0) {
      const pulse = 0.4 + Math.sin(t * 10) * 0.12;
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      ctx.strokeStyle = rgba(pal.glow, pulse);
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(16, -84, 48, -1.2, 1.2);
      ctx.stroke();
      ctx.strokeStyle = rgba("#ffffff", pulse * 0.5);
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(16, -84, 42, -1.05, 1.05);
      ctx.stroke();
      ctx.restore();
    }

    // hurt flash
    if (f.hurtFlash > 0) {
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      ctx.globalAlpha = Math.min(0.55, f.hurtFlash / 12);
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.ellipse(0, -80, 34, 62, 0, 0, TAU);
      ctx.fill();
      ctx.restore();
    }

    ctx.restore();
  }

  limb(ctx, x1, y1, x2, y2, x3, y3, width, outline, color) {
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = outline;
    ctx.lineWidth = width + 5;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.lineTo(x3, y3);
    ctx.stroke();

    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.lineTo(x3, y3);
    ctx.stroke();

    // subtle highlight
    ctx.strokeStyle = "rgba(255,255,255,0.12)";
    ctx.lineWidth = Math.max(2, width * 0.25);
    ctx.beginPath();
    ctx.moveTo(x1 + 1, y1 - width * 0.26);
    ctx.lineTo(x2 + 1, y2 - width * 0.26);
    ctx.lineTo(x3 + 1, y3 - width * 0.26);
    ctx.stroke();
  }

  drawBoot(ctx, fx, fy, kx, ky, pal, back) {
    const ang = Math.atan2(fy - ky, fx - kx);
    ctx.save();
    ctx.translate(fx, fy);
    ctx.rotate(clamp(ang * 0.5, -1.1, 1.1));
    ctx.fillStyle = "rgba(10,5,14,0.85)";
    roundRect(ctx, -10, -10, 28, 20, 8);
    ctx.fill();
    ctx.fillStyle = back ? mix(pal.dark, "#000000", 0.15) : pal.dark;
    roundRect(ctx, -9, -9, 25, 18, 7);
    ctx.fill();
    ctx.fillStyle = pal.trim;
    roundRect(ctx, 6, -7, 6, 14, 3);
    ctx.fill();
    ctx.restore();
  }

  drawGlove(ctx, x, y, pal, back) {
    ctx.save();
    const g = ctx.createRadialGradient(x - 2, y - 3, 1, x, y, 11);
    g.addColorStop(0, back ? mix(pal.primary, "#000", 0.2) : pal.secondary);
    g.addColorStop(1, back ? pal.dark : pal.primary2);
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, 9.5, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = "rgba(12,6,16,0.7)";
    ctx.lineWidth = 1.6;
    ctx.stroke();
    ctx.fillStyle = "rgba(255,255,255,0.3)";
    ctx.beginPath();
    ctx.arc(x + 2.5, y - 3, 2, 0, TAU);
    ctx.fill();
    ctx.restore();
  }

  drawGarment(ctx, f, pal, hip, sh, t) {
    const sway = Math.sin(t * 3 + f.id * 2) * 6;
    if (pal.style === "blaze") {
      // scarf around neck + two tails streaming behind
      ctx.lineCap = "round";
      for (let i = 0; i < 2; i++) {
        const wob = Math.sin(t * 3.4 + i * 1.7 + f.id) * 5;
        ctx.strokeStyle = i === 0 ? pal.secondary : mix(pal.secondary, pal.primary, 0.4);
        ctx.lineWidth = i === 0 ? 7 : 5;
        ctx.beginPath();
        ctx.moveTo(sh.x - 7, sh.y + 4 + i * 4);
        ctx.quadraticCurveTo(
          sh.x - 30, sh.y + 8 + wob,
          sh.x - 48 - f.vx * 0.02, sh.y + 24 + wob * 1.4 + i * 8
        );
        ctx.stroke();
      }
      // sash tail
      ctx.strokeStyle = pal.trim;
      ctx.lineWidth = 4.5;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(hip.x - 10, hip.y + 4);
      ctx.quadraticCurveTo(hip.x - 26, hip.y + 22, hip.x - 30 + sway * 0.5, hip.y + 44);
      ctx.stroke();
    } else {
      // long coat tails
      ctx.fillStyle = mix(pal.dark, "#0b0614", 0.2);
      ctx.beginPath();
      ctx.moveTo(hip.x - 14, hip.y);
      ctx.quadraticCurveTo(hip.x - 40 - f.vx * 0.03, hip.y + 30, hip.x - 48 - f.vx * 0.04, hip.y + 66 + sway * 0.3);
      ctx.lineTo(hip.x - 24, hip.y + 58);
      ctx.lineTo(hip.x - 10, hip.y + 18);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = rgba(pal.glow, 0.4);
      ctx.lineWidth = 1.4;
      ctx.stroke();
      // frost scarf
      ctx.strokeStyle = rgba("#c9f8ff", 0.7);
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(sh.x - 6, sh.y + 1);
      ctx.quadraticCurveTo(sh.x - 30, sh.y + 10 + sway, sh.x - 44, sh.y + 8 + sway);
      ctx.stroke();
    }
  }

  drawHead(ctx, f, pal, head, neck, t) {
    const outline = "rgba(12,6,16,0.72)";
    // face
    const skinGrad = ctx.createLinearGradient(head.x - 12, head.y - 18, head.x + 12, head.y + 18);
    skinGrad.addColorStop(0, mix(pal.skin, "#ffffff", 0.14));
    skinGrad.addColorStop(1, mix(pal.skin, "#7a4238", 0.18));
    ctx.fillStyle = skinGrad;
    ctx.beginPath();
    ctx.ellipse(head.x, head.y, 15.5, 17.5, 0, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = outline;
    ctx.lineWidth = 1.6;
    ctx.stroke();

    // jaw / chin highlight
    ctx.fillStyle = "rgba(255,255,255,0.13)";
    ctx.beginPath();
    ctx.ellipse(head.x + 4, head.y + 3, 8, 10, 0.2, 0, TAU);
    ctx.fill();

    // ear
    ctx.fillStyle = mix(pal.skin, "#8a5040", 0.2);
    ctx.beginPath();
    ctx.ellipse(head.x - 12, head.y + 2, 4, 5.5, 0, 0, TAU);
    ctx.fill();

    // hair
    ctx.fillStyle = pal.hair;
    if (pal.style === "blaze") {
      ctx.beginPath();
      ctx.moveTo(head.x - 16, head.y - 2);
      ctx.quadraticCurveTo(head.x - 22, head.y - 20, head.x - 8, head.y - 22);
      ctx.lineTo(head.x - 2, head.y - 30);
      ctx.lineTo(head.x + 5, head.y - 21);
      ctx.lineTo(head.x + 15, head.y - 25);
      ctx.lineTo(head.x + 17, head.y - 12);
      ctx.quadraticCurveTo(head.x + 10, head.y - 18, head.x + 8, head.y - 11);
      ctx.quadraticCurveTo(head.x - 2, head.y - 19, head.x - 8, head.y - 9);
      ctx.quadraticCurveTo(head.x - 12, head.y - 16, head.x - 16, head.y - 2);
      ctx.closePath();
      ctx.fill();
      // topknot
      ctx.beginPath();
      ctx.ellipse(head.x - 6, head.y - 30, 7, 9, -0.4, 0, TAU);
      ctx.fill();
    } else {
      ctx.beginPath();
      ctx.moveTo(head.x - 18, head.y + 4);
      ctx.quadraticCurveTo(head.x - 22, head.y - 20, head.x - 2, head.y - 23);
      ctx.quadraticCurveTo(head.x + 18, head.y - 20, head.x + 17, head.y - 2);
      ctx.quadraticCurveTo(head.x + 8, head.y - 13, head.x + 4, head.y - 8);
      ctx.quadraticCurveTo(head.x - 8, head.y - 16, head.x - 12, head.y + 5);
      ctx.closePath();
      ctx.fill();
      // ponytail
      ctx.strokeStyle = pal.hair;
      ctx.lineWidth = 9;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(head.x - 12, head.y - 12);
      ctx.quadraticCurveTo(head.x - 34, head.y - 10 + Math.sin(t * 3) * 4, head.x - 44, head.y + 20 + Math.sin(t * 2.4) * 5);
      ctx.stroke();
      ctx.strokeStyle = rgba(pal.glow, 0.5);
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    // headband
    if (pal.style === "blaze") {
      ctx.strokeStyle = pal.trim;
      ctx.lineWidth = 4.5;
      ctx.beginPath();
      ctx.moveTo(head.x - 15, head.y - 8);
      ctx.quadraticCurveTo(head.x, head.y - 12, head.x + 15, head.y - 7);
      ctx.stroke();
      // band tails
      ctx.strokeStyle = pal.trim;
      ctx.lineCap = "round";
      for (let i = 0; i < 2; i++) {
        ctx.lineWidth = i === 0 ? 3.4 : 2.6;
        ctx.beginPath();
        ctx.moveTo(head.x - 13, head.y - 5);
        ctx.quadraticCurveTo(
          head.x - 24 - i * 2, head.y + 5 + i * 6 + Math.sin(t * 4 + i) * 2,
          head.x - 26 - i * 7 - f.vx * 0.012, head.y + 24 + i * 18 + Math.sin(t * 3 + i) * 3
        );
        ctx.stroke();
      }
      // knot
      ctx.fillStyle = pal.primary;
      ctx.beginPath();
      ctx.arc(head.x - 13, head.y - 5, 3.4, 0, TAU);
      ctx.fill();
    } else {
      ctx.strokeStyle = "rgba(200,245,255,0.85)";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(head.x - 14, head.y - 9);
      ctx.quadraticCurveTo(head.x, head.y - 13, head.x + 14, head.y - 8);
      ctx.stroke();
      // ice crystal badge
      ctx.fillStyle = "#d8fbff";
      ctx.beginPath();
      ctx.moveTo(head.x + 16, head.y - 10);
      ctx.lineTo(head.x + 20, head.y - 6);
      ctx.lineTo(head.x + 16, head.y - 2);
      ctx.lineTo(head.x + 12, head.y - 6);
      ctx.closePath();
      ctx.fill();
    }

    // eye + brow
    ctx.fillStyle = "#160b14";
    ctx.beginPath();
    ctx.ellipse(head.x + 6, head.y - 1, 3.4, 4.1, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = pal.eye;
    ctx.beginPath();
    ctx.arc(head.x + 6.8, head.y - 2, 1.25, 0, TAU);
    ctx.fill();
    // brow
    ctx.strokeStyle = "rgba(20,10,20,0.85)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(head.x + 2, head.y - 7.5);
    ctx.lineTo(head.x + 10, head.y - 6);
    ctx.stroke();
    // mouth
    ctx.strokeStyle = "rgba(70,30,35,0.8)";
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(head.x + 3, head.y + 9);
    ctx.quadraticCurveTo(head.x + 6, head.y + 10, head.x + 9, head.y + 8);
    ctx.stroke();
  }

  drawProjectiles(ctx, game) {
    for (const p of game.projectiles) {
      const t = game.animTime;
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      // trail
      for (let i = p.trail.length - 1; i >= 0; i--) {
        const tr = p.trail[i];
        if (tr.t <= 0) continue;
        const k = tr.t / 0.28;
        ctx.globalAlpha = k * 0.35;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(tr.x, tr.y, p.r * k * 0.9, 0, TAU);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      // outer glow
      const g = ctx.createRadialGradient(p.x, p.y, 2, p.x, p.y, p.r * 2.2);
      g.addColorStop(0, "rgba(255,255,255,0.95)");
      g.addColorStop(0.22, rgba(p.color2, 0.95));
      g.addColorStop(0.55, rgba(p.color, 0.4));
      g.addColorStop(1, rgba(p.color, 0));
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r * 2.2, 0, TAU);
      ctx.fill();
      // core
      ctx.fillStyle = "#fff8e8";
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r * 0.46, 0, TAU);
      ctx.fill();
      // rotating shards
      ctx.strokeStyle = p.color2;
      ctx.lineWidth = 3;
      ctx.lineCap = "round";
      for (let i = 0; i < 4; i++) {
        const a = t * 5 + (i / 4) * TAU;
        ctx.beginPath();
        ctx.moveTo(p.x + Math.cos(a) * p.r * 0.7, p.y + Math.sin(a) * p.r * 0.7);
        ctx.lineTo(p.x + Math.cos(a) * p.r * 1.35, p.y + Math.sin(a) * p.r * 1.35);
        ctx.stroke();
      }
      ctx.restore();
    }
  }

  drawVignette(ctx) {
    const v = ctx.createRadialGradient(W / 2, H / 2 - 20, 260, W / 2, H / 2, 800);
    v.addColorStop(0, "rgba(5,2,10,0)");
    v.addColorStop(0.68, "rgba(5,2,10,0.18)");
    v.addColorStop(1, "rgba(5,2,10,0.72)");
    ctx.fillStyle = v;
    ctx.fillRect(0, 0, W, H);

    const top = ctx.createLinearGradient(0, 0, 0, 150);
    top.addColorStop(0, "rgba(6,3,12,0.5)");
    top.addColorStop(1, "rgba(6,3,12,0)");
    ctx.fillStyle = top;
    ctx.fillRect(0, 0, W, 150);

    const bottom = ctx.createLinearGradient(0, H - 130, 0, H);
    bottom.addColorStop(0, "rgba(4,2,8,0)");
    bottom.addColorStop(1, "rgba(4,2,8,0.55)");
    ctx.fillStyle = bottom;
    ctx.fillRect(0, H - 130, W, 130);
  }

  drawHUD(ctx, game) {
    const [f1, f2] = game.fighters;
    // ease health bars
    if (f1._shown === undefined || (game.state === "intro" && game.stateTime < 0.08)) f1._shown = f1.health;
    if (f2._shown === undefined || (game.state === "intro" && game.stateTime < 0.08)) f2._shown = f2.health;
    f1._shown = lerp(f1._shown, f1.health, 0.1);
    f2._shown = lerp(f2._shown, f2.health, 0.1);

    this.drawHealthBar(ctx, game, f1, 112, 44, 478, 26, "left");
    this.drawHealthBar(ctx, game, f2, 690, 44, 478, 26, "right");

    this.drawPortrait(ctx, f1, 68, 62, 36, game);
    this.drawPortrait(ctx, f2, 1212, 62, 36, game);

    // names + round pips
    this.drawNameplate(ctx, f1, 116, 84, "left");
    this.drawNameplate(ctx, f2, 1164, 84, "right");

    this.drawTimer(ctx, game);

    // meters
    this.drawMeter(ctx, game, f1, 66, 664, "left");
    this.drawMeter(ctx, game, f2, 1214, 664, "right");

    // combo
    if (f1.combo >= 2 && f1.comboTimer > 0 && !game.fighters[0].ko) {
      this.drawCombo(ctx, f1, 262, 300, "left");
    }
    if (f2.combo >= 2 && f2.comboTimer > 0 && !game.fighters[1].ko) {
      this.drawCombo(ctx, f2, 1018, 300, "right");
    }

    // round result pill
    if (game.state === "roundEnd" && game.stateTime > 0.55 && game.roundResult) {
      const rr = game.roundResult;
      let text;
      if (rr.draw) text = "مساوی — راند تکرار می‌شود";
      else {
        const w = game.fighters[rr.winnerId];
        text = `${w.palette.name} راند را برد`;
      }
      ctx.save();
      ctx.globalAlpha = clamp((game.stateTime - 0.55) * 3, 0, 1);
      ctx.font = "700 17px Vazirmatn, sans-serif";
      const tw = ctx.measureText(text).width;
      ctx.fillStyle = "rgba(10,5,16,0.62)";
      roundRect(ctx, 640 - tw / 2 - 22, 137, tw + 44, 34, 17);
      ctx.fill();
      ctx.strokeStyle = "rgba(255,220,180,0.22)";
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.fillStyle = "rgba(255,240,220,0.9)";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(text, 640, 155);
      ctx.restore();
    }
  }

  drawHealthBar(ctx, game, f, x, y, w, h, side) {
    const ratio = clamp(f.health / f.maxHealth, 0, 1);
    const shown = clamp(f._shown / f.maxHealth, 0, 1);
    const skew = 12;
    const pal = f.palette;

    // backdrop
    ctx.save();
    skewedPath(ctx, x - 3, y - 3, w + 6, h + 6, skew);
    ctx.fillStyle = "rgba(10,5,16,0.82)";
    ctx.fill();
    ctx.strokeStyle = "rgba(255,230,200,0.22)";
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // damage trail
    ctx.save();
    skewedPath(ctx, x, y, w, h, skew);
    ctx.clip();
    ctx.fillStyle = "rgba(255,236,205,0.35)";
    if (side === "left") {
      ctx.fillRect(x, y, w * shown, h);
    } else {
      ctx.fillRect(x + w * (1 - shown), y, w * shown, h);
    }
    ctx.restore();

    // fill
    ctx.save();
    skewedPath(ctx, x, y, w, h, skew);
    ctx.clip();
    const grad = ctx.createLinearGradient(side === "left" ? x : x + w, y, side === "left" ? x + w : x, y);
    grad.addColorStop(0, pal.primary2);
    grad.addColorStop(0.35, pal.primary);
    grad.addColorStop(0.75, pal.secondary);
    grad.addColorStop(1, mix(pal.secondary, "#fff", 0.35));
    ctx.fillStyle = grad;
    if (side === "left") {
      ctx.fillRect(x, y, w * ratio, h);
    } else {
      ctx.fillRect(x + w * (1 - ratio), y, w * ratio, h);
    }
    // gloss
    const gloss = ctx.createLinearGradient(0, y, 0, y + h);
    gloss.addColorStop(0, "rgba(255,255,255,0.34)");
    gloss.addColorStop(0.45, "rgba(255,255,255,0.06)");
    gloss.addColorStop(1, "rgba(0,0,0,0.28)");
    ctx.fillStyle = gloss;
    ctx.fillRect(x, y, w, h);
    // segment ticks
    ctx.strokeStyle = "rgba(10,5,16,0.22)";
    ctx.lineWidth = 2;
    for (let i = 1; i < 10; i++) {
      const tx = x + (w / 10) * i;
      ctx.beginPath();
      ctx.moveTo(tx + skew * 0.4, y);
      ctx.lineTo(tx - skew * 0.4, y + h);
      ctx.stroke();
    }
    // low health pulse
    if (ratio <= 0.25 && ratio > 0) {
      const pulse = 0.18 + Math.sin(game.animTime * 9) * 0.12;
      ctx.fillStyle = `rgba(255,60,50,${pulse})`;
      ctx.fillRect(x, y, w, h);
    }
    ctx.restore();

    // end cap glow
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    const ex = side === "left" ? x + w * ratio : x + w * (1 - ratio);
    const capGrad = ctx.createRadialGradient(ex, y + h / 2, 1, ex, y + h / 2, 26);
    capGrad.addColorStop(0, rgba(pal.secondary, 0.4));
    capGrad.addColorStop(1, rgba(pal.secondary, 0));
    ctx.fillStyle = capGrad;
    ctx.beginPath();
    ctx.arc(ex, y + h / 2, 26, 0, TAU);
    ctx.fill();
    ctx.restore();
    ctx.restore();
  }

  drawNameplate(ctx, f, x, y, side) {
    const pal = f.palette;
    ctx.save();
    ctx.textAlign = side === "left" ? "left" : "right";
    ctx.textBaseline = "middle";
    ctx.font = "700 17px Vazirmatn, sans-serif";
    ctx.fillStyle = "rgba(255,244,232,0.95)";
    ctx.fillText(pal.name, x, y);
    const nameW = ctx.measureText(pal.name).width;
    ctx.font = "700 9.5px Vazirmatn, sans-serif";
    ctx.fillStyle = "rgba(255,230,205,0.55)";
    ctx.fillText(pal.sub, side === "left" ? x + nameW + 12 : x - nameW - 12, y + 1);

    // round pips
    for (let i = 0; i < 2; i++) {
      const px = x + (side === "left" ? nameW + 78 + i * 15 : -nameW - 78 - i * 15);
      ctx.save();
      ctx.translate(px, y);
      ctx.rotate(Math.PI / 4);
      ctx.fillStyle = f.wins > i ? pal.secondary : "rgba(255,255,255,0.10)";
      ctx.strokeStyle = f.wins > i ? "rgba(255,255,255,0.65)" : "rgba(255,255,255,0.22)";
      ctx.lineWidth = 1;
      ctx.fillRect(-4, -4, 8, 8);
      ctx.strokeRect(-4, -4, 8, 8);
      ctx.restore();
    }
    ctx.restore();
  }

  drawPortrait(ctx, f, x, y, r, game) {
    const pal = f.palette;
    ctx.save();
    ctx.beginPath();
    ctx.arc(x, y, r, 0, TAU);
    ctx.clip();
    const bg = ctx.createLinearGradient(x - r, y - r, x + r, y + r);
    bg.addColorStop(0, mix(pal.dark, "#000", 0.2));
    bg.addColorStop(1, mix(pal.primary2, "#000", 0.45));
    ctx.fillStyle = bg;
    ctx.fillRect(x - r, y - r, r * 2, r * 2);

    // shoulders
    ctx.fillStyle = pal.primary;
    ctx.beginPath();
    ctx.ellipse(x, y + r * 0.9, r * 0.85, r * 0.55, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = pal.dark;
    ctx.beginPath();
    ctx.ellipse(x, y + r * 0.95, r * 0.6, r * 0.35, 0, 0, TAU);
    ctx.fill();

    // head
    const hy = y + r * 0.02;
    ctx.fillStyle = pal.skin;
    ctx.beginPath();
    ctx.ellipse(x, hy, r * 0.46, r * 0.53, 0, 0, TAU);
    ctx.fill();

    // hair
    ctx.fillStyle = pal.hair;
    ctx.beginPath();
    if (pal.style === "blaze") {
      ctx.moveTo(x - r * 0.52, hy);
      ctx.quadraticCurveTo(x - r * 0.55, hy - r * 0.68, x, hy - r * 0.62);
      ctx.lineTo(x + r * 0.12, hy - r * 0.88);
      ctx.lineTo(x + r * 0.28, hy - r * 0.55);
      ctx.quadraticCurveTo(x + r * 0.55, hy - r * 0.5, x + r * 0.46, hy - r * 0.02);
      ctx.quadraticCurveTo(x + r * 0.2, hy - r * 0.3, x + r * 0.1, hy - r * 0.15);
      ctx.quadraticCurveTo(x - r * 0.1, hy - r * 0.34, x - r * 0.2, hy + r * 0.05);
      ctx.closePath();
    } else {
      ctx.ellipse(x, hy - r * 0.18, r * 0.5, r * 0.42, 0, Math.PI, TAU);
      ctx.quadraticCurveTo(x + r * 0.48, hy - r * 0.1, x + r * 0.4, hy + r * 0.25);
      ctx.quadraticCurveTo(x + r * 0.15, hy - r * 0.1, x - r * 0.42, hy + r * 0.2);
      ctx.closePath();
    }
    ctx.fill();

    // headband
    ctx.strokeStyle = pal.style === "blaze" ? pal.trim : "rgba(210,250,255,0.9)";
    ctx.lineWidth = r * 0.13;
    ctx.beginPath();
    ctx.moveTo(x - r * 0.42, hy - r * 0.18);
    ctx.quadraticCurveTo(x, hy - r * 0.28, x + r * 0.42, hy - r * 0.16);
    ctx.stroke();

    // eye
    ctx.fillStyle = "#170b14";
    ctx.beginPath();
    ctx.ellipse(x + r * 0.18, hy, r * 0.075, r * 0.11, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = pal.eye;
    ctx.beginPath();
    ctx.arc(x + r * 0.2, hy - r * 0.02, r * 0.03, 0, TAU);
    ctx.fill();
    // mouth
    ctx.strokeStyle = "rgba(70,30,35,0.75)";
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(x + r * 0.06, hy + r * 0.28);
    ctx.quadraticCurveTo(x + r * 0.18, hy + r * 0.32, x + r * 0.28, hy + r * 0.26);
    ctx.stroke();
    ctx.restore();

    // ring
    ctx.save();
    const ringGrad = ctx.createLinearGradient(x - r, y - r, x + r, y + r);
    ringGrad.addColorStop(0, pal.secondary);
    ringGrad.addColorStop(1, pal.primary2);
    ctx.strokeStyle = ringGrad;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, TAU);
    ctx.stroke();
    ctx.strokeStyle = "rgba(10,5,16,0.7)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(x, y, r + 2, 0, TAU);
    ctx.stroke();
    // glow when super ready
    if (f.meter >= 100) {
      const pulse = 0.4 + Math.sin(game.animTime * 6) * 0.2;
      ctx.globalCompositeOperation = "lighter";
      ctx.strokeStyle = rgba(pal.secondary, pulse);
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(x, y, r + 4, 0, TAU);
      ctx.stroke();
    }
    ctx.restore();
  }

  drawTimer(ctx, game) {
    const timeLeft = Math.max(0, Math.ceil(game.timer));
    const low = game.timer <= 15 && game.state === "fight";
    const pulse = low ? 0.5 + Math.sin(game.animTime * 10) * 0.5 : 0;

    ctx.save();
    // panel
    ctx.beginPath();
    ctx.moveTo(640 - 50, 34);
    ctx.lineTo(640 + 50, 34);
    ctx.lineTo(640 + 38, 108);
    ctx.lineTo(640 - 38, 108);
    ctx.closePath();
    const bg = ctx.createLinearGradient(0, 34, 0, 108);
    bg.addColorStop(0, "rgba(32,18,42,0.95)");
    bg.addColorStop(1, "rgba(10,5,16,0.95)");
    ctx.fillStyle = bg;
    ctx.fill();
    ctx.strokeStyle = low ? `rgba(255,90,70,${0.5 + pulse * 0.4})` : "rgba(255,210,150,0.55)";
    ctx.lineWidth = 2;
    ctx.stroke();

    // number
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = "900 40px Vazirmatn, Tahoma, sans-serif";
    ctx.fillStyle = low ? "#ff8a70" : "#fff2da";
    ctx.shadowColor = low ? "rgba(255,70,40,0.7)" : "rgba(255,180,90,0.4)";
    ctx.shadowBlur = low ? 18 : 8;
    ctx.fillText(String(timeLeft).padStart(2, "0"), 640, 66);
    ctx.shadowBlur = 0;

    ctx.font = "700 8px Vazirmatn, sans-serif";
    ctx.fillStyle = "rgba(255,230,200,0.55)";
    ctx.fillText("R O U N D   " + ["", "1", "2", "3"][game.round], 640, 98);
    ctx.restore();
  }

  drawMeter(ctx, game, f, anchorX, y, side) {
    const w = 246, h = 14;
    const x = side === "left" ? anchorX : anchorX - w;
    const ratio = clamp(f.meter / 100, 0, 1);
    const pal = f.palette;
    const full = f.meter >= 100;
    const flash = game.meterFlash && game.meterFlash.id === f.id;

    ctx.save();
    // container
    skewedPath(ctx, x, y, w, h, 8);
    ctx.fillStyle = "rgba(8,4,14,0.72)";
    ctx.fill();
    ctx.strokeStyle = flash ? "rgba(255,90,70,0.9)" : full ? rgba(pal.glow, 0.8) : "rgba(255,255,255,0.16)";
    ctx.lineWidth = flash ? 2.5 : 1.2;
    ctx.stroke();

    // fill
    ctx.save();
    skewedPath(ctx, x, y, w, h, 8);
    ctx.clip();
    const grad = ctx.createLinearGradient(x, y, x + w, y);
    grad.addColorStop(0, mix(pal.primary2, "#000", 0.15));
    grad.addColorStop(0.55, pal.glow);
    grad.addColorStop(1, mix(pal.secondary, "#fff", 0.4));
    ctx.fillStyle = grad;
    const fw = w * ratio;
    ctx.fillRect(x, y, fw, h);
    // sheen
    const sheen = ctx.createLinearGradient(0, y, 0, y + h);
    sheen.addColorStop(0, "rgba(255,255,255,0.35)");
    sheen.addColorStop(1, "rgba(0,0,0,0.15)");
    ctx.fillStyle = sheen;
    ctx.fillRect(x, y, fw, h);
    // ticks at 25/50/75
    ctx.strokeStyle = "rgba(8,4,14,0.5)";
    ctx.lineWidth = 2;
    for (let i = 1; i < 4; i++) {
      const tx = x + (w / 4) * i;
      ctx.beginPath();
      ctx.moveTo(tx, y);
      ctx.lineTo(tx - 2, y + h);
      ctx.stroke();
    }
    if (full) {
      const sweep = (game.animTime * 0.6) % 1;
      const sx2 = x + sweep * w;
      const gl = ctx.createLinearGradient(sx2 - 30, 0, sx2 + 30, 0);
      gl.addColorStop(0, "rgba(255,255,255,0)");
      gl.addColorStop(0.5, "rgba(255,255,255,0.5)");
      gl.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = gl;
      ctx.fillRect(x, y, w, h);
    }
    ctx.restore();

    // labels
    ctx.font = "700 11px Vazirmatn, sans-serif";
    ctx.textAlign = side === "left" ? "left" : "right";
    ctx.textBaseline = "alphabetic";
    if (full) {
      ctx.fillStyle = rgba(pal.secondary, 0.85 + Math.sin(game.animTime * 7) * 0.15);
      ctx.font = "900 11px Vazirmatn, sans-serif";
      ctx.fillText("ضربه نهایی آماده!", side === "left" ? x : x + w, y - 7);
    } else {
      ctx.fillStyle = "rgba(255,235,215,0.55)";
      ctx.fillText("انرژی", side === "left" ? x : x + w, y - 7);
    }
    ctx.restore();
  }

  drawCombo(ctx, f, x, y, side) {
    const pal = f.palette;
    const decay = clamp(f.comboTimer / 100, 0, 1);
    const pop = 1 + Math.max(0, (f.comboTimer - 90) / 10) * 0.35;
    const alpha = clamp(decay * 3, 0, 1);
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(x, y);
    ctx.scale(pop, pop);
    ctx.rotate(-0.06);
    ctx.textAlign = side === "left" ? "left" : "right";
    ctx.textBaseline = "alphabetic";
    const num = toFa(f.combo);
    ctx.font = "900 44px Vazirmatn, sans-serif";
    ctx.lineWidth = 7;
    ctx.strokeStyle = "rgba(10,5,15,0.8)";
    ctx.strokeText(num, 0, 0);
    const grad = ctx.createLinearGradient(0, -40, 0, 6);
    grad.addColorStop(0, "#fff4dc");
    grad.addColorStop(0.55, pal.secondary);
    grad.addColorStop(1, pal.primary);
    ctx.fillStyle = grad;
    ctx.fillText(num, 0, 0);
    ctx.font = "700 15px Vazirmatn, sans-serif";
    ctx.strokeStyle = "rgba(10,5,15,0.8)";
    ctx.lineWidth = 4;
    const label = "ضربه پیاپی";
    ctx.strokeText(label, side === "left" ? 42 : -42, -3);
    ctx.fillStyle = "rgba(255,240,225,0.9)";
    ctx.fillText(label, side === "left" ? 42 : -42, -3);
    // underline
    ctx.strokeStyle = rgba(pal.secondary, 0.65);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, 10);
    ctx.lineTo(side === "left" ? 150 : -150, 10);
    ctx.stroke();
    ctx.restore();
  }

  drawAnnouncement(ctx, game) {
    const a = game.announcement;
    if (!a) return;
    const fadeIn = clamp(a.t / 0.16, 0, 1);
    const fadeOut = clamp((a.dur - a.t) / 0.3, 0, 1);
    const alpha = Math.min(fadeIn, fadeOut);
    const scale = 0.82 + 0.18 * easeOutBack(fadeIn);
    const yOff = (1 - fadeIn) * 18;

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(640, 296 + yOff);
    ctx.scale(scale, scale);
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    // glow bar
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    const glowGrad = ctx.createRadialGradient(0, 0, 20, 0, 0, 330);
    glowGrad.addColorStop(0, rgba(a.color, 0.22));
    glowGrad.addColorStop(0.5, rgba(a.color, 0.06));
    glowGrad.addColorStop(1, rgba(a.color, 0));
    ctx.fillStyle = glowGrad;
    ctx.beginPath();
    ctx.ellipse(0, 0, 360, 120, 0, 0, TAU);
    ctx.fill();
    ctx.restore();

    ctx.font = `900 ${a.size}px Vazirmatn, Tahoma, sans-serif`;
    ctx.lineJoin = "round";
    ctx.lineWidth = 12;
    ctx.strokeStyle = "rgba(8,4,14,0.85)";
    ctx.strokeText(a.text, 0, 0);
    ctx.lineWidth = 4;
    ctx.strokeStyle = "rgba(10,5,18,0.9)";
    ctx.strokeText(a.text, 0, 0);

    const grad = ctx.createLinearGradient(0, -a.size * 0.55, 0, a.size * 0.55);
    grad.addColorStop(0, "#ffffff");
    grad.addColorStop(0.45, mix(a.color, "#ffffff", 0.35));
    grad.addColorStop(1, a.color);
    ctx.fillStyle = grad;
    ctx.shadowColor = rgba(a.color, 0.6);
    ctx.shadowBlur = 22;
    ctx.fillText(a.text, 0, 0);
    ctx.shadowBlur = 0;

    if (a.sub) {
      const spaced = a.sub.split("").join(" ");
      ctx.font = "700 15px Vazirmatn, sans-serif";
      ctx.fillStyle = "rgba(255,240,225,0.8)";
      ctx.fillText(spaced, 0, a.size * 0.62);
      // lines
      const w = Math.max(70, spaced.length * 6);
      ctx.strokeStyle = rgba(a.color, 0.5);
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(-w - 26, a.size * 0.62);
      ctx.lineTo(-w - 8, a.size * 0.62);
      ctx.moveTo(w + 8, a.size * 0.62);
      ctx.lineTo(w + 26, a.size * 0.62);
      ctx.stroke();
    }
    ctx.restore();
  }
}
