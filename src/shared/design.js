// Design system — Botafogo SP identity: preto + vermelho + branco
export const CDark = {
  bg: "#0a0a0e", bgCard: "rgba(18,18,24,0.65)", bgCardHover: "rgba(26,26,34,0.75)",
  bgInput: "rgba(12,12,18,0.8)", bgSidebar: "rgba(10,10,14,0.92)",
  border: "rgba(255,255,255,0.07)", borderActive: "#d4232b",
  gold: "#d4232b", goldLight: "#ff3b3b", goldDim: "rgba(212,35,43,0.12)",
  goldGlow: "rgba(212,35,43,0.25)",
  text: "#f0eee9", textDim: "#5a6070", textMid: "#8a92a4",
  green: "#22c55e", greenDim: "rgba(34,197,94,0.12)",
  red: "#ef4444", redDim: "rgba(239,68,68,0.12)",
  yellow: "#f59e0b", yellowDim: "rgba(245,158,11,0.12)",
  blue: "#3b82f6", blueDim: "rgba(59,130,246,0.12)",
  purple: "#8b5cf6", purpleDim: "rgba(139,92,246,0.12)",
  cyan: "#06b6d4", cyanDim: "rgba(6,182,212,0.12)",
  glass: "backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px);",
  shadow: "0 4px 24px rgba(0,0,0,0.25)",
  shadowHover: "0 8px 32px rgba(0,0,0,0.35)",
};

export const CLight = {
  bg: "#f0f2f5", bgCard: "rgba(255,255,255,0.82)", bgCardHover: "rgba(245,246,250,0.92)",
  bgInput: "rgba(240,241,246,0.9)", bgSidebar: "rgba(255,255,255,0.96)",
  border: "rgba(0,0,0,0.08)", borderActive: "#d4232b",
  gold: "#c41e28", goldLight: "#e02d2d", goldDim: "rgba(196,30,40,0.08)",
  goldGlow: "rgba(196,30,40,0.15)",
  text: "#1a1b2e", textDim: "#8a92a4", textMid: "#5a6070",
  green: "#16a34a", greenDim: "rgba(22,163,74,0.08)",
  red: "#dc2626", redDim: "rgba(220,38,38,0.07)",
  yellow: "#d97706", yellowDim: "rgba(217,119,6,0.08)",
  blue: "#2563eb", blueDim: "rgba(37,99,235,0.08)",
  purple: "#7c3aed", purpleDim: "rgba(124,58,237,0.08)",
  cyan: "#0891b2", cyanDim: "rgba(8,145,178,0.08)",
  glass: "backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);",
  shadow: "0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)",
  shadowHover: "0 4px 20px rgba(0,0,0,0.08), 0 1px 3px rgba(0,0,0,0.06)",
};

// Mutable theme reference — updated by setTheme()
export let C = CDark;

export const font = "'Inter','DM Sans','Helvetica Neue',Arial,sans-serif";
export const fontD = "'DM Sans','Inter','Helvetica Neue',sans-serif";

export function setTheme(isDark) {
  C = isDark ? CDark : CLight;
}
