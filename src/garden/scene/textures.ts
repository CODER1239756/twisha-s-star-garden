import * as THREE from "three";

function noiseCanvas(size: number, paint: (ctx: CanvasRenderingContext2D, s: number) => void) {
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const ctx = c.getContext("2d")!;
  paint(ctx, size);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.anisotropy = 4;
  return tex;
}

function speckle(ctx: CanvasRenderingContext2D, s: number, colors: string[], n: number, rMax: number) {
  for (let i = 0; i < n; i++) {
    ctx.fillStyle = colors[(Math.random() * colors.length) | 0];
    ctx.globalAlpha = 0.25 + Math.random() * 0.5;
    const r = Math.random() * rMax + 0.5;
    ctx.beginPath();
    ctx.arc(Math.random() * s, Math.random() * s, r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

let lawn: THREE.CanvasTexture | null = null;
export function lawnTexture() {
  if (lawn) return lawn;
  lawn = noiseCanvas(512, (ctx, s) => {
    ctx.fillStyle = "#6b7a55";
    ctx.fillRect(0, 0, s, s);
    speckle(ctx, s, ["#52634a", "#87906c", "#5d6b4a", "#75604f", "#aeb99a"], 9000, 2.2);
    speckle(ctx, s, ["#4a5840", "#7f8a62"], 400, 14);
  });
  lawn.repeat.set(14, 14);
  return lawn;
}

let soil: THREE.CanvasTexture | null = null;
export function soilTexture() {
  if (soil) return soil;
  soil = noiseCanvas(512, (ctx, s) => {
    ctx.fillStyle = "#5e4a3b";
    ctx.fillRect(0, 0, s, s);
    speckle(ctx, s, ["#75604f", "#4a3a2e", "#6b5646", "#3d3027", "#8a7461"], 14000, 2);
    speckle(ctx, s, ["#9a8a78", "#b0a28f"], 300, 2.5);
  });
  soil.repeat.set(3, 3);
  return soil;
}

let stone: THREE.CanvasTexture | null = null;
export function stoneTexture() {
  if (stone) return stone;
  stone = noiseCanvas(256, (ctx, s) => {
    ctx.fillStyle = "#b9b1a2";
    ctx.fillRect(0, 0, s, s);
    speckle(ctx, s, ["#a39a8a", "#cfc7b8", "#8d8576", "#87906c"], 5000, 1.8);
  });
  return stone;
}

let glow: THREE.CanvasTexture | null = null;
export function glowTexture() {
  if (glow) return glow;
  const c = document.createElement("canvas");
  c.width = c.height = 128;
  const ctx = c.getContext("2d")!;
  const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  g.addColorStop(0, "rgba(255,248,230,1)");
  g.addColorStop(0.25, "rgba(255,226,170,0.55)");
  g.addColorStop(0.6, "rgba(247,214,154,0.12)");
  g.addColorStop(1, "rgba(247,214,154,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 128, 128);
  glow = new THREE.CanvasTexture(c);
  glow.colorSpace = THREE.SRGBColorSpace;
  return glow;
}
