export interface VibeCardData {
  areaName: string;
  cityName?: string;
  vibes: string[];
  safety: number;
  cost: string;
  quote: string;
}

const COST_COLORS: Record<string, string> = {
  "$": "#059669",
  "$$": "#d97706",
  "$$$": "#dc2626",
  "$$$$": "#7c3aed",
};

const VIBE_COLORS = [
  "#0d9488", "#2563eb", "#7c3aed", "#db2777", "#d97706",
  "#059669", "#dc2626", "#0891b2", "#65a30d", "#c026d3",
];

export async function generateVibeCard(data: VibeCardData): Promise<Blob> {
  const W = 800;
  const H = 450;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;

  // Background gradient
  const grad = ctx.createLinearGradient(0, 0, W, H);
  grad.addColorStop(0, "#0f766e");
  grad.addColorStop(0.5, "#0891b2");
  grad.addColorStop(1, "#1d4ed8");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  // Noise / texture overlay via semi-transparent circles
  ctx.globalAlpha = 0.05;
  for (let i = 0; i < 30; i++) {
    ctx.beginPath();
    ctx.arc(Math.random() * W, Math.random() * H, Math.random() * 100 + 20, 0, Math.PI * 2);
    ctx.fillStyle = "white";
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  // Brand tag top-right
  ctx.fillStyle = "rgba(255,255,255,0.15)";
  ctx.beginPath();
  roundRect(ctx, W - 150, 20, 130, 32, 16);
  ctx.fill();
  ctx.fillStyle = "rgba(255,255,255,0.85)";
  ctx.font = "bold 13px system-ui, sans-serif";
  ctx.textAlign = "right";
  ctx.fillText("PlaceLabels", W - 25, 42);

  // Area name
  ctx.textAlign = "left";
  ctx.fillStyle = "white";
  ctx.font = "bold 52px system-ui, sans-serif";
  // Word wrap if too long
  const name = data.areaName;
  if (ctx.measureText(name).width > W - 80) {
    ctx.font = "bold 38px system-ui, sans-serif";
  }
  ctx.fillText(name, 48, 130);

  // City name
  if (data.cityName) {
    ctx.font = "18px system-ui, sans-serif";
    ctx.fillStyle = "rgba(255,255,255,0.7)";
    ctx.fillText(data.cityName, 50, 162);
  }

  // Safety stars
  const starY = 195;
  ctx.font = "24px system-ui, sans-serif";
  for (let i = 0; i < 5; i++) {
    ctx.fillStyle = i < data.safety ? "#fbbf24" : "rgba(255,255,255,0.2)";
    ctx.fillText("★", 50 + i * 30, starY);
  }

  // Cost tier badge
  const costX = 50 + 5 * 30 + 20;
  ctx.fillStyle = COST_COLORS[data.cost] ?? "#6b7280";
  roundRect(ctx, costX, starY - 22, 60, 28, 8);
  ctx.fill();
  ctx.fillStyle = "white";
  ctx.font = "bold 16px system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(data.cost, costX + 30, starY);
  ctx.textAlign = "left";

  // Vibe chips
  const topVibes = data.vibes.slice(0, 3);
  let chipX = 50;
  const chipY = 235;
  topVibes.forEach((vibe, idx) => {
    const color = VIBE_COLORS[idx % VIBE_COLORS.length];
    const cw = ctx.measureText(vibe).width + 28;
    ctx.fillStyle = "rgba(255,255,255,0.18)";
    roundRect(ctx, chipX, chipY, cw, 32, 16);
    ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,0.4)";
    ctx.lineWidth = 1;
    roundRect(ctx, chipX, chipY, cw, 32, 16);
    ctx.stroke();
    ctx.fillStyle = "white";
    ctx.font = "bold 14px system-ui, sans-serif";
    ctx.fillText(vibe, chipX + 14, chipY + 21);
    chipX += cw + 10;
  });

  // Quote
  const quoteText = `"${data.quote.slice(0, 130)}${data.quote.length > 130 ? "…" : ""}"`;
  ctx.font = "italic 17px Georgia, serif";
  ctx.fillStyle = "rgba(255,255,255,0.88)";
  const maxW = W - 96;
  const words = quoteText.split(" ");
  let line = "";
  let qY = 310;
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxW && line) {
      ctx.fillText(line, 50, qY);
      line = word;
      qY += 26;
      if (qY > 380) break;
    } else {
      line = test;
    }
  }
  if (line && qY <= 380) ctx.fillText(line, 50, qY);

  // Footer bar
  ctx.fillStyle = "rgba(0,0,0,0.25)";
  ctx.fillRect(0, H - 48, W, 48);
  ctx.fillStyle = "rgba(255,255,255,0.55)";
  ctx.font = "13px system-ui, sans-serif";
  ctx.fillText("placelabels.com — crowd-sourced neighborhood insights", 50, H - 17);

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((b) => { b ? resolve(b) : reject(new Error("Canvas toBlob failed")); }, "image/png");
  });
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}
