export interface ShareData {
  title: string;
  names: { a: string; b: string };
  rangeLabel: string;
  total: number;
  days: number;
  avg: number;
  chars: number;
  peakHour: number;
  topWord?: string;
  topEmoji?: string;
  a: number;
  b: number;
  streak: number;
  longestStreak: number;
}

export type CardFormat = "portrait" | "square" | "story";
export type CardThemeKey = "midnight" | "sunset" | "paper";

export const CARD_FORMATS: { key: CardFormat; label: string; w: number; h: number }[] = [
  { key: "portrait", label: "4:5", w: 1080, h: 1350 },
  { key: "square", label: "1:1", w: 1080, h: 1080 },
  { key: "story", label: "9:16", w: 1080, h: 1920 },
];

interface Palette {
  bg: [string, string];
  glowA: string;
  glowB: string;
  text: string;
  sub: string;
  line: string;
  accentA: string;
  accentB: string;
  panel: string;
  panelBorder: string;
}

export const CARD_THEMES: { key: CardThemeKey; label: string; swatch: string }[] = [
  { key: "midnight", label: "ミッドナイト", swatch: "#1b2440" },
  { key: "sunset", label: "サンセット", swatch: "#ff8a5b" },
  { key: "paper", label: "ペーパー", swatch: "#f6efe4" },
];

const PALETTES: Record<CardThemeKey, Palette> = {
  midnight: {
    bg: ["#0A0F1F", "#141A30"],
    glowA: "rgba(91,157,255,0.30)",
    glowB: "rgba(255,168,92,0.22)",
    text: "#F5F7FF",
    sub: "#A7B0C9",
    line: "rgba(255,255,255,0.10)",
    accentA: "#5B9DFF",
    accentB: "#FFA85C",
    panel: "rgba(255,255,255,0.05)",
    panelBorder: "rgba(255,255,255,0.09)",
  },
  sunset: {
    bg: ["#1B0F14", "#2C1418"],
    glowA: "rgba(255,122,156,0.32)",
    glowB: "rgba(255,183,77,0.28)",
    text: "#FFF7F2",
    sub: "#D6B8B0",
    line: "rgba(255,255,255,0.10)",
    accentA: "#FF7A9C",
    accentB: "#FFB74D",
    panel: "rgba(255,255,255,0.06)",
    panelBorder: "rgba(255,255,255,0.10)",
  },
  paper: {
    bg: ["#FAF6EF", "#F1E8DA"],
    glowA: "rgba(47,111,235,0.14)",
    glowB: "rgba(217,119,6,0.14)",
    text: "#201A14",
    sub: "#7A6E5F",
    line: "rgba(32,26,20,0.10)",
    accentA: "#1F5FD6",
    accentB: "#A85A08",
    panel: "rgba(255,255,255,0.55)",
    panelBorder: "rgba(32,26,20,0.08)",
  },
};

const DISPLAY_FONT = '"Zen Maru Gothic", "Hiragino Maru Gothic ProN", sans-serif';
const BODY_FONT = '"Zen Kaku Gothic New", "Hiragino Kaku Gothic ProN", sans-serif';

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function fitText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  maxLines: number,
  font: string,
): string[] {
  ctx.font = font;
  const chars = Array.from(text);
  const lines: string[] = [];
  let current = "";
  for (const ch of chars) {
    if (ctx.measureText(current + ch).width > maxWidth && current) {
      lines.push(current);
      current = ch;
      if (lines.length === maxLines) break;
    } else {
      current += ch;
    }
  }
  if (lines.length < maxLines && current) lines.push(current);
  if (lines.length === maxLines) {
    const last = Array.from(lines[maxLines - 1]);
    while (last.length && ctx.measureText(last.join("") + "…").width > maxWidth) last.pop();
    if (lines.join("") !== chars.join("")) lines[maxLines - 1] = last.join("") + "…";
  }
  return lines;
}

function formatNumber(n: number): string {
  return Math.round(n).toLocaleString("ja-JP");
}

export async function drawShareCard(
  canvas: HTMLCanvasElement,
  format: CardFormat,
  themeKey: CardThemeKey,
  data: ShareData,
): Promise<void> {
  const preset = CARD_FORMATS.find((f) => f.key === format) || CARD_FORMATS[0];
  const { w, h } = preset;
  const dpr = 1;
  canvas.width = w * dpr;
  canvas.height = h * dpr;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  ctx.scale(dpr, dpr);
  const p = PALETTES[themeKey];

  // Background
  const bg = ctx.createLinearGradient(0, 0, w, h);
  bg.addColorStop(0, p.bg[0]);
  bg.addColorStop(1, p.bg[1]);
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);

  const glow1 = ctx.createRadialGradient(w * 0.12, h * 0.05, 0, w * 0.12, h * 0.05, w * 0.9);
  glow1.addColorStop(0, p.glowA);
  glow1.addColorStop(1, "transparent");
  ctx.fillStyle = glow1;
  ctx.fillRect(0, 0, w, h);

  const glow2 = ctx.createRadialGradient(w * 0.95, h * 0.95, 0, w * 0.95, h * 0.95, w * 0.85);
  glow2.addColorStop(0, p.glowB);
  glow2.addColorStop(1, "transparent");
  ctx.fillStyle = glow2;
  ctx.fillRect(0, 0, w, h);

  // Inner card
  const pad = Math.round(w * 0.055);
  const cardX = pad;
  const cardY = pad;
  const cardW = w - pad * 2;
  const cardH = h - pad * 2;
  roundRect(ctx, cardX, cardY, cardW, cardH, Math.round(w * 0.045));
  ctx.fillStyle = p.panel;
  ctx.fill();
  ctx.strokeStyle = p.panelBorder;
  ctx.lineWidth = 2;
  ctx.stroke();

  const left = cardX + Math.round(w * 0.06);
  const right = cardX + cardW - Math.round(w * 0.06);
  const contentW = right - left;
  let y = cardY + Math.round(h * (format === "story" ? 0.075 : 0.06));

  // Header
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  ctx.font = `700 ${Math.round(w * 0.022)}px ${BODY_FONT}`;
  ctx.fillStyle = p.sub;
  ctx.letterSpacing = "6px";
  ctx.fillText("TALK LOG", left, y);
  ctx.letterSpacing = "0px";
  y += Math.round(h * 0.055);

  const titleSize = Math.round(w * (format === "story" ? 0.056 : 0.05));
  ctx.font = `700 ${titleSize}px ${DISPLAY_FONT}`;
  ctx.fillStyle = p.text;
  const titleLines = fitText(ctx, data.title || "ふたりのトーク", contentW, 2, ctx.font);
  for (const line of titleLines) {
    ctx.fillText(line, left, y);
    y += Math.round(titleSize * 1.25);
  }
  y += Math.round(h * 0.005);

  ctx.font = `500 ${Math.round(w * 0.021)}px ${BODY_FONT}`;
  ctx.fillStyle = p.sub;
  ctx.fillText(data.rangeLabel, left, y);
  y += Math.round(h * (format === "story" ? 0.062 : 0.075));

  // Big total
  const bigSize = Math.round(w * (format === "story" ? 0.185 : 0.155));
  ctx.font = `700 ${bigSize}px ${DISPLAY_FONT}`;
  ctx.fillStyle = p.text;
  const totalText = formatNumber(data.total);
  ctx.fillText(totalText, left, y + bigSize * 0.72);
  const totalWidth = ctx.measureText(totalText).width;
  ctx.font = `700 ${Math.round(w * 0.045)}px ${BODY_FONT}`;
  ctx.fillStyle = p.accentA;
  ctx.fillText("件", left + totalWidth + 12, y + bigSize * 0.72);
  ctx.font = `500 ${Math.round(w * 0.028)}px ${BODY_FONT}`;
  ctx.fillStyle = p.sub;
  ctx.fillText("のやりとり", left, y + bigSize * 0.72 + Math.round(w * 0.05));
  y += bigSize + Math.round(h * (format === "story" ? 0.05 : 0.06));

  // Stat row
  const statH = Math.round(h * (format === "story" ? 0.115 : 0.11));
  const gap = Math.round(w * 0.02);
  const statW = (contentW - gap * 2) / 3;
  const stats = [
    { label: "やりとりした日", value: `${formatNumber(data.days)}日` },
    { label: "1日平均", value: `${data.avg.toFixed(1)}件` },
    { label: "よく話す時間", value: `${data.peakHour}時台` },
  ];
  stats.forEach((s, i) => {
    const x = left + i * (statW + gap);
    roundRect(ctx, x, y, statW, statH, Math.round(w * 0.022));
    ctx.fillStyle = p.panel;
    ctx.fill();
    ctx.strokeStyle = p.panelBorder;
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.font = `500 ${Math.round(w * 0.019)}px ${BODY_FONT}`;
    ctx.fillStyle = p.sub;
    ctx.fillText(s.label, x + statW * 0.09, y + statH * 0.36);
    ctx.font = `700 ${Math.round(w * 0.042)}px ${DISPLAY_FONT}`;
    ctx.fillStyle = p.text;
    ctx.fillText(s.value, x + statW * 0.09, y + statH * 0.72);
  });
  y += statH + Math.round(h * (format === "story" ? 0.035 : 0.05));

  // Split bar
  ctx.font = `700 ${Math.round(w * 0.024)}px ${BODY_FONT}`;
  ctx.fillStyle = p.accentA;
  ctx.textAlign = "left";
  ctx.fillText(data.names.a, left, y);
  ctx.fillStyle = p.accentB;
  ctx.textAlign = "right";
  ctx.fillText(data.names.b, right, y);
  ctx.textAlign = "left";
  y += Math.round(w * 0.018);

  const barH = Math.round(h * 0.018);
  const total = Math.max(1, data.a + data.b);
  const aW = (data.a / total) * contentW;
  roundRect(ctx, left, y, contentW, barH, barH / 2);
  ctx.fillStyle = p.accentB;
  ctx.fill();
  ctx.save();
  roundRect(ctx, left, y, contentW, barH, barH / 2);
  ctx.clip();
  ctx.fillStyle = p.accentA;
  ctx.fillRect(left, y, aW, barH);
  ctx.restore();
  y += barH + Math.round(h * 0.014);

  ctx.font = `700 ${Math.round(w * 0.022)}px ${BODY_FONT}`;
  ctx.fillStyle = p.accentA;
  ctx.textAlign = "left";
  ctx.fillText(`${Math.round((data.a / total) * 100)}%`, left, y);
  ctx.textAlign = "right";
  ctx.fillStyle = p.accentB;
  ctx.fillText(`${100 - Math.round((data.a / total) * 100)}%`, right, y);
  ctx.textAlign = "left";
  y += Math.round(h * (format === "story" ? 0.035 : 0.05));

  // Highlights
  if (format !== "square") {
    const hlH = Math.round(h * (format === "story" ? 0.15 : 0.13));
    const hlGap = Math.round(w * 0.02);
    const hlW = (contentW - hlGap) / 2;
    const items = [
      { label: "よく使った言葉", value: data.topWord ? `「${data.topWord}」` : "—" },
      { label: "よく使った絵文字", value: data.topEmoji || "—" },
    ];
    items.forEach((it, i) => {
      const x = left + i * (hlW + hlGap);
      roundRect(ctx, x, y, hlW, hlH, Math.round(w * 0.022));
      ctx.fillStyle = p.panel;
      ctx.fill();
      ctx.strokeStyle = p.panelBorder;
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.font = `500 ${Math.round(w * 0.019)}px ${BODY_FONT}`;
      ctx.fillStyle = p.sub;
      ctx.fillText(it.label, x + hlW * 0.08, y + hlH * 0.3);
      ctx.font = `700 ${Math.round(w * (i === 1 ? 0.06 : 0.036))}px ${DISPLAY_FONT}`;
      ctx.fillStyle = p.text;
      const valLines = fitText(ctx, it.value, hlW * 0.84, 1, ctx.font);
      ctx.fillText(valLines[0] || "", x + hlW * 0.08, y + hlH * 0.72);
    });
    y += hlH + Math.round(h * (format === "story" ? 0.03 : 0.045));
  }

  // Streak / extra for story
  if (format === "story") {
    const extraH = Math.round(h * 0.095);
    const extraGap = Math.round(w * 0.02);
    const halfW = (contentW - extraGap) / 2;
    const panels = [
      { label: "連続記録 / 最長記録", value: `${data.streak}日 / ${data.longestStreak}日` },
      { label: "打った文字数", value: `${formatNumber(data.chars)}字` },
    ];
    panels.forEach((panel, i) => {
      const x = left + i * (halfW + extraGap);
      roundRect(ctx, x, y, halfW, extraH, Math.round(w * 0.022));
      ctx.fillStyle = p.panel;
      ctx.fill();
      ctx.strokeStyle = p.panelBorder;
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.font = `500 ${Math.round(w * 0.019)}px ${BODY_FONT}`;
      ctx.fillStyle = p.sub;
      ctx.fillText(panel.label, x + halfW * 0.08, y + extraH * 0.38);
      ctx.font = `700 ${Math.round(w * 0.036)}px ${DISPLAY_FONT}`;
      ctx.fillStyle = p.text;
      ctx.fillText(panel.value, x + halfW * 0.08, y + extraH * 0.75);
    });
    y += extraH + Math.round(h * (format === "story" ? 0.018 : 0.03));
  }

  // Footer
  const footY = cardY + cardH - Math.round(h * 0.035);
  ctx.font = `500 ${Math.round(w * 0.017)}px ${BODY_FONT}`;
  ctx.fillStyle = p.sub;
  ctx.textAlign = "left";
  ctx.fillText("トーク分析 ・ この端末で作成", left, footY);
  ctx.textAlign = "right";
  ctx.fillText(new Date().toLocaleDateString("ja-JP"), right, footY);
  ctx.textAlign = "left";
}

export async function ensureFonts(): Promise<void> {
  try {
    await Promise.all([
      document.fonts.load(`700 64px "Zen Maru Gothic"`),
      document.fonts.load(`500 32px "Zen Kaku Gothic New"`),
      document.fonts.load(`700 32px "Zen Kaku Gothic New"`),
    ]);
  } catch {
    /* fonts may be unavailable offline */
  }
}

export async function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob((b) => resolve(b), "image/png"));
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}
