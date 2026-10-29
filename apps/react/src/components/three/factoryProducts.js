import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { canvasTexture, hash } from "./kit";

/**
 * Factory products — the software the agent crew builds on the home page.
 *
 * Each is a real "Audience of One" tool from the talk: it arrives as a
 * problem (a messy file, a complaint) with an outcome someone wants, is specced
 * as a blueprint, and leaves as a working device on a screen. Everything is drawn to canvas at load, so
 * the scene needs no image requests.
 *
 * `parts` are the UI components the builder arms place, in screen space
 * ([x, y, w, h] from the top-left, 0..1) — the same rectangles the blueprint
 * traces and the finished UI fills in, so all three line up.
 */

const FONT = '"Space Grotesk", "Inter", system-ui, sans-serif';
const MONO = 'ui-monospace, "SF Mono", Menlo, monospace';

const rr = (ctx, x, y, w, h, r) => {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
};

export const PRODUCTS = [
  {
    id: "budget",
    name: "budget-dashboard",
    source: "chase_export.csv",
    outcome: "see where my money goes",
    complaint: "where did it ALL go??",
    device: "monitor",
    screen: [2.0, 1.15],
    accent: "#00e5b0",
    parts: [
      [0.03, 0.04, 0.94, 0.12],
      [0.03, 0.21, 0.29, 0.2],
      [0.355, 0.21, 0.29, 0.2],
      [0.68, 0.21, 0.29, 0.2],
      [0.03, 0.46, 0.55, 0.5],
      [0.61, 0.46, 0.36, 0.5],
    ],
    draw(ctx, w, h, px) {
      ctx.fillStyle = "#0b0f15";
      ctx.fillRect(0, 0, w, h);
      const [hdr, k1, k2, k3, c1, c2] = this.parts.map(px);
      ctx.fillStyle = "#e6edf3";
      ctx.font = `700 ${h * 0.055}px ${FONT}`;
      ctx.fillText("Budget · October", hdr[0] + 16, hdr[1] + hdr[3] * 0.68);
      [
        [k1, "SPENT", "$2,140", "#e6edf3"],
        [k2, "SAVED", "$610", "#00e5b0"],
        [k3, "TOP LEAK", "Takeout", "#ff5470"],
      ].forEach(([r, label, value, color]) => {
        ctx.fillStyle = "#7d8590";
        ctx.font = `600 ${h * 0.03}px ${FONT}`;
        ctx.fillText(label, r[0] + 14, r[1] + r[3] * 0.35);
        ctx.fillStyle = color;
        ctx.font = `700 ${h * 0.06}px ${FONT}`;
        ctx.fillText(value, r[0] + 14, r[1] + r[3] * 0.8);
      });
      const bars = [0.5, 0.8, 0.35, 0.62, 0.9, 0.45, 0.7];
      bars.forEach((b, i) => {
        const bw = (c1[2] - 40) / bars.length - 8;
        ctx.fillStyle = i === 4 ? "#ff5470" : "#00e5b0";
        ctx.fillRect(c1[0] + 20 + i * (bw + 8), c1[1] + c1[3] - 20 - b * (c1[3] - 50), bw, b * (c1[3] - 50));
      });
      ctx.strokeStyle = "#58a6ff";
      ctx.lineWidth = 5;
      ctx.beginPath();
      [0.7, 0.55, 0.6, 0.4, 0.45, 0.25, 0.2].forEach((v, i, a) => {
        const x = c2[0] + 20 + (i / (a.length - 1)) * (c2[2] - 40);
        const y = c2[1] + 20 + v * (c2[3] - 40);
        if (i) ctx.lineTo(x, y);
        else ctx.moveTo(x, y);
      });
      ctx.stroke();
    },
  },
  {
    id: "digest",
    name: "newsletter-digest",
    source: "newsletter_wk43.pdf",
    outcome: "three dates, not four pages",
    complaint: "4 pages for 3 dates",
    device: "phone",
    screen: [0.66, 1.3],
    accent: "#ffb300",
    parts: [
      [0.06, 0.05, 0.88, 0.1],
      [0.06, 0.2, 0.88, 0.15],
      [0.06, 0.38, 0.88, 0.15],
      [0.06, 0.56, 0.88, 0.15],
      [0.12, 0.8, 0.76, 0.09],
    ],
    draw(ctx, w, h, px) {
      ctx.fillStyle = "#fbf8f2";
      ctx.fillRect(0, 0, w, h);
      const [hdr, a, b, c, btn] = this.parts.map(px);
      ctx.fillStyle = "#111";
      ctx.font = `800 ${w * 0.09}px ${FONT}`;
      ctx.fillText("This week", hdr[0] + 8, hdr[1] + hdr[3] * 0.75);
      [
        [a, "FRI", "Field trip form due"],
        [b, "MON", "Picture day"],
        [c, "WED", "Book fair — $15"],
      ].forEach(([r, day, text]) => {
        ctx.fillStyle = "#ffb300";
        ctx.font = `800 ${w * 0.055}px ${FONT}`;
        ctx.fillText(day, r[0] + 14, r[1] + r[3] * 0.4);
        ctx.fillStyle = "#222";
        ctx.font = `600 ${w * 0.058}px ${FONT}`;
        ctx.fillText(text, r[0] + 14, r[1] + r[3] * 0.8);
      });
      ctx.fillStyle = "#fff";
      ctx.font = `700 ${w * 0.06}px ${FONT}`;
      ctx.fillText("Add to calendar", btn[0] + btn[2] * 0.14, btn[1] + btn[3] * 0.66);
    },
  },
  {
    id: "macros",
    name: "macros-cli",
    source: "groceries.xlsx",
    outcome: "hit protein without the math",
    complaint: "protein math AGAIN",
    device: "terminal",
    screen: [1.7, 1.0],
    accent: "#39ff88",
    parts: [
      [0.0, 0.0, 1.0, 0.1],
      [0.04, 0.16, 0.7, 0.08],
      [0.04, 0.3, 0.92, 0.36],
      [0.04, 0.74, 0.6, 0.1],
    ],
    draw(ctx, w, h, px) {
      ctx.fillStyle = "#06090a";
      ctx.fillRect(0, 0, w, h);
      const [, cmd, table, ok] = this.parts.map(px);
      ctx.font = `600 ${h * 0.05}px ${MONO}`;
      ctx.fillStyle = "#39ff88";
      ctx.fillText("$ macros --week groceries.csv", cmd[0], cmd[1] + cmd[3] * 0.8);
      ctx.fillStyle = "#b9c2c7";
      ["item        g    protein", "chicken   2400    744", "greek yog 1500    150", "lentils    900    225"].forEach((l, i) =>
        ctx.fillText(l, table[0], table[1] + 34 + i * table[3] * 0.25),
      );
      ctx.fillStyle = "#39ff88";
      ctx.fillText("✓ 160 g protein / day", ok[0], ok[1] + ok[3] * 0.8);
    },
  },
  {
    id: "pomidor",
    name: "pomidor",
    source: "focus app wants a login??",
    outcome: "start a timer, no login",
    complaint: "just start the timer",
    device: "browser",
    screen: [1.9, 1.1],
    accent: "#ff6b57",
    parts: [
      [0.0, 0.0, 1.0, 0.11],
      [0.36, 0.18, 0.28, 0.5],
      [0.3, 0.74, 0.18, 0.11],
      [0.52, 0.74, 0.18, 0.11],
      [0.36, 0.89, 0.28, 0.07],
    ],
    draw(ctx, w, h, px) {
      ctx.fillStyle = "#fff6f2";
      ctx.fillRect(0, 0, w, h);
      const [nav, dial, start, reset, langs] = this.parts.map(px);
      ctx.fillStyle = "#ff6b57";
      ctx.font = `800 ${h * 0.055}px ${FONT}`;
      ctx.fillText("pomidor", nav[0] + 22, nav[1] + nav[3] * 0.72);
      ctx.strokeStyle = "#ff6b57";
      ctx.lineWidth = h * 0.02;
      ctx.beginPath();
      ctx.arc(dial[0] + dial[2] / 2, dial[1] + dial[3] / 2, Math.min(dial[2], dial[3]) * 0.44, -Math.PI / 2, Math.PI * 1.3);
      ctx.stroke();
      ctx.fillStyle = "#2a1410";
      ctx.font = `800 ${h * 0.1}px ${FONT}`;
      ctx.textAlign = "center";
      ctx.fillText("24:59", dial[0] + dial[2] / 2, dial[1] + dial[3] * 0.6);
      ctx.font = `700 ${h * 0.04}px ${FONT}`;
      ctx.fillStyle = "#fff";
      ctx.fillText("Start", start[0] + start[2] / 2, start[1] + start[3] * 0.66);
      ctx.fillText("Reset", reset[0] + reset[2] / 2, reset[1] + reset[3] * 0.66);
      ctx.fillStyle = "#8a5a50";
      ctx.font = `600 ${h * 0.035}px ${FONT}`;
      ctx.fillText("EN · ES · HE · RU", langs[0] + langs[2] / 2, langs[1] + langs[3] * 0.75);
      ctx.textAlign = "left";
    },
  },
];

const texSize = ([w, h]) => (w >= h ? [1024, Math.round((1024 * h) / w)] : [Math.round((1024 * w) / h), 1024]);
const pxRect = (W, H) => ([x, y, w, h]) => [x * W, y * H, w * W, h * H];

/** The problem as it arrives: a crumpled printout, red pen, a sticky note. */
export const problemTexture = (product) =>
  canvasTexture(768, 960, (ctx, w, h) => {
    ctx.fillStyle = "#f4f1ea";
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = "#222";
    ctx.font = `700 34px ${MONO}`;
    ctx.fillText(product.source, 40, 70);
    ctx.strokeStyle = "rgba(0,0,0,0.18)";
    ctx.lineWidth = 2;
    for (let y = 110; y < h - 40; y += 34) {
      ctx.beginPath();
      ctx.moveTo(40, y);
      ctx.lineTo(w - 40, y);
      ctx.stroke();
    }
    for (let x = 40; x < w - 40; x += 140) {
      ctx.beginPath();
      ctx.moveTo(x, 110);
      ctx.lineTo(x, h - 40);
      ctx.stroke();
    }
    ctx.fillStyle = "rgba(0,0,0,0.55)";
    ctx.font = `500 20px ${MONO}`;
    for (let r = 0; r < 22; r++)
      for (let c = 0; c < 5; c++) if (hash(r * 7 + c) > 0.25) ctx.fillText(String(Math.floor(hash(r * 13 + c) * 9999)), 50 + c * 140, 136 + r * 34);
    // Red pen: circles, a slash, and the complaint.
    ctx.strokeStyle = "#d1242f";
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.ellipse(w * 0.62, h * 0.38, 120, 50, -0.2, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(w * 0.15, h * 0.7);
    ctx.lineTo(w * 0.55, h * 0.58);
    ctx.stroke();
    ctx.fillStyle = "#ffe066";
    ctx.save();
    ctx.translate(w * 0.5, h * 0.78);
    ctx.rotate(-0.08);
    ctx.fillRect(-170, -70, 340, 150);
    ctx.fillStyle = "#d1242f";
    ctx.font = `700 34px ${FONT}`;
    ctx.textAlign = "center";
    ctx.fillText(product.complaint, 0, 12);
    ctx.restore();
  });

/** The spec: white line drawing on blueprint blue, one box per part. */
export const blueprintTexture = (product) => {
  const [W, H] = texSize(product.screen);
  return canvasTexture(W, H, (ctx) => {
    ctx.fillStyle = "#0a3a8a";
    ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = "rgba(255,255,255,0.12)";
    ctx.lineWidth = 1;
    for (let x = 0; x < W; x += 32) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, H);
      ctx.stroke();
    }
    for (let y = 0; y < H; y += 32) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(W, y);
      ctx.stroke();
    }
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 4;
    ctx.setLineDash([14, 8]);
    product.parts.map(pxRect(W, H)).forEach(([x, y, w, h], i) => {
      ctx.strokeRect(x + 3, y + 3, w - 6, h - 6);
      ctx.fillStyle = "#ffffff";
      ctx.font = `600 ${Math.max(16, H * 0.028)}px ${MONO}`;
      ctx.fillText(`#${i + 1}`, x + 12, y + 30);
    });
    ctx.setLineDash([]);
    ctx.fillStyle = "#ffffff";
    ctx.font = `700 ${H * 0.04}px ${MONO}`;
    ctx.fillText(`SPEC — ${product.name}`, 16, H - 16);
  });
};

/** The shipped UI. */
export const finalTexture = (product) => {
  const [W, H] = texSize(product.screen);
  return canvasTexture(W, H, (ctx) => {
    product.draw(ctx, W, H, pxRect(W, H));
    ctx.save();
    product.parts.map(pxRect(W, H)).forEach(([x, y, w, h], i) => {
      // Faint card edges so the placed parts register on the finished screen.
      if (product.device === "terminal" && i > 0) return;
      ctx.strokeStyle = "rgba(127,127,127,0.25)";
      ctx.lineWidth = 2;
      rr(ctx, x + 2, y + 2, w - 4, h - 4, 10);
      ctx.stroke();
    });
    ctx.restore();
  });
};

/**
 * The device the product ships on. Origin at the bottom centre of the device,
 * screen facing +z. Returns the group and the screen planes to crossfade.
 */
export const buildDevice = (product, materials) => {
  const [sw, sh] = product.screen;
  const group = new THREE.Group();
  const bezel = product.device === "phone" ? 0.06 : 0.07;
  const top = product.device === "browser" || product.device === "terminal" ? 0.1 : 0;
  const frameW = sw + bezel * 2;
  const frameH = sh + bezel * 2 + top;
  const lift = product.device === "monitor" ? 0.35 : 0;
  const frame = new THREE.Mesh(new RoundedBoxGeometry(frameW, frameH, 0.09, 3, product.device === "phone" ? 0.08 : 0.04), materials.frame);
  frame.position.y = lift + frameH / 2;
  frame.castShadow = true;
  group.add(frame);
  if (top) {
    for (let i = 0; i < 3; i++) {
      const dot = new THREE.Mesh(new THREE.CircleGeometry(0.022, 16), materials.dots[i]);
      dot.position.set(-frameW / 2 + 0.09 + i * 0.065, lift + frameH - bezel - top / 2 + 0.02, 0.047);
      group.add(dot);
    }
  }
  if (product.device === "monitor") {
    const neck = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.36, 0.06), materials.frame);
    neck.position.set(0, 0.18, -0.03);
    const foot = new THREE.Mesh(new RoundedBoxGeometry(0.7, 0.04, 0.32, 2, 0.02), materials.frame);
    foot.position.set(0, 0.02, 0);
    group.add(neck, foot);
  }
  const screenGeo = new THREE.PlaneGeometry(sw, sh);
  const screenY = lift + bezel + sh / 2;
  const blueprint = new THREE.Mesh(screenGeo, new THREE.MeshBasicMaterial({ map: blueprintTexture(product), transparent: true, toneMapped: false }));
  const final = new THREE.Mesh(screenGeo, new THREE.MeshBasicMaterial({ map: finalTexture(product), transparent: true, opacity: 0, toneMapped: false }));
  blueprint.position.set(0, screenY, 0.047);
  final.position.set(0, screenY, 0.048);
  group.add(blueprint, final);

  // Slot positions for each part, in device space, on the face of the screen.
  const slots = product.parts.map(([x, y, w, h]) => ({
    center: new THREE.Vector3((x + w / 2 - 0.5) * sw, screenY + (0.5 - (y + h / 2)) * sh, 0.075),
    size: [w * sw, h * sh],
  }));
  return { group, blueprint, final, slots, height: lift + frameH };
};
