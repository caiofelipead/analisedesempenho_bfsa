// Série B 2026 — dados da aba "Série B 2026" da planilha "Análise Desempenho | BFSA".
// Estrutura estática para permitir visualização offline; pode ser substituída por
// sync do Google Sheets no futuro (ver useSheets.js).

export const SERIE_B_METRICS = [
  { key: "pontos",       label: "Pontos",        group: "Geral",         fmt: "int" },
  { key: "xPoints",      label: "xPoints",       group: "Geral",         fmt: "dec2" },
  { key: "idadeMedia",   label: "Idade Média",   group: "Geral",         fmt: "dec2" },
  { key: "posse",        label: "Posse %",       group: "Geral",         fmt: "dec2" },
  { key: "substituicoes",label: "Substituições", group: "Geral",         fmt: "int" },
  { key: "gs",           label: "GS",            group: "Geral",         fmt: "int" },
  { key: "xGA",          label: "xGA",           group: "Geral",         fmt: "dec2" },
  { key: "xGAremate",    label: "xGA/remate",    group: "Geral",         fmt: "dec2" },
  { key: "remates",      label: "Remates",       group: "Ataque/Remate", fmt: "int" },
  { key: "rematesP90",   label: "Remates p90",   group: "Ataque/Remate", fmt: "dec2" },
  { key: "pctAlvo",      label: "% Alvo",        group: "Ataque/Remate", fmt: "dec2" },
  { key: "cabeca",       label: "Cabeça",        group: "Ataque/Remate", fmt: "int" },
  { key: "postes",       label: "Postes",        group: "Ataque/Remate", fmt: "int" },
  { key: "foraArea",     label: "Fora Área",     group: "Ataque/Remate", fmt: "int" },
];

// Escudos: transfermarkt wappen CDN. Fallback gracioso via <Escudo onError>.
const TM = (id) => `https://tmssl.akamaized.net/images/wappen/head/${id}.png`;

export const SERIE_B_TEAMS = [
  { pos: 1,  nome: "Vila Nova",            escudo: TM(2427),  pontos: 11, xPoints: 7.80, idadeMedia: 28.50, posse: 49.60, substituicoes: 26, gs: 5, xGA: 5.62,  xGAremate: 0.10, remates: 62, rematesP90: 10.69, pctAlvo: 30.60, cabeca: 9,  postes: 3, foraArea: 32 },
  { pos: 2,  nome: "Fortaleza",            escudo: TM(10870), pontos: 10, xPoints: 6.10, idadeMedia: 27.10, posse: 50.00, substituicoes: 26, gs: 7, xGA: 5.76,  xGAremate: 0.11, remates: 60, rematesP90: 10.51, pctAlvo: 28.30, cabeca: 18, postes: 2, foraArea: 25 },
  { pos: 3,  nome: "Ceará",                escudo: TM(2029),  pontos: 9,  xPoints: 5.90, idadeMedia: 28.50, posse: 45.50, substituicoes: 25, gs: 2, xGA: 8.95,  xGAremate: 0.14, remates: 56, rematesP90: 10.08, pctAlvo: 37.50, cabeca: 6,  postes: 1, foraArea: 25 },
  { pos: 4,  nome: "Grêmio Novorizontino", escudo: TM(10244), pontos: 8,  xPoints: 9.40, idadeMedia: 27.30, posse: 49.00, substituicoes: 25, gs: 5, xGA: 4.63,  xGAremate: 0.10, remates: 83, rematesP90: 14.97, pctAlvo: 30.10, cabeca: 15, postes: 2, foraArea: 42 },
  { pos: 5,  nome: "Avaí",                 escudo: TM(2189),  pontos: 8,  xPoints: 5.30, idadeMedia: 25.60, posse: 46.30, substituicoes: 24, gs: 4, xGA: 8.38,  xGAremate: 0.13, remates: 62, rematesP90: 10.88, pctAlvo: 27.40, cabeca: 10, postes: 0, foraArea: 31 },
  { pos: 6,  nome: "Athletic Club",        escudo: TM(60636), pontos: 8,  xPoints: 5.50, idadeMedia: 23.70, posse: 41.30, substituicoes: 25, gs: 7, xGA: 9.87,  xGAremate: 0.11, remates: 51, rematesP90: 8.86,  pctAlvo: 41.20, cabeca: 2,  postes: 2, foraArea: 21 },
  { pos: 7,  nome: "Operário PR",          escudo: TM(13401), pontos: 8,  xPoints: 7.30, idadeMedia: 29.90, posse: 52.10, substituicoes: 25, gs: 3, xGA: 4.30,  xGAremate: 0.08, remates: 58, rematesP90: 10.32, pctAlvo: 43.10, cabeca: 8,  postes: 1, foraArea: 29 },
  { pos: 8,  nome: "Botafogo SP",          escudo: TM(2026),  pontos: 7,  xPoints: 8.30, idadeMedia: 28.10, posse: 46.50, substituicoes: 25, gs: 5, xGA: 4.10,  xGAremate: 0.08, remates: 59, rematesP90: 10.49, pctAlvo: 33.90, cabeca: 12, postes: 4, foraArea: 30 },
  { pos: 9,  nome: "São Bernardo FC",      escudo: TM(12594), pontos: 7,  xPoints: 5.70, idadeMedia: 30.90, posse: 47.00, substituicoes: 25, gs: 5, xGA: 7.55,  xGAremate: 0.10, remates: 55, rematesP90: 9.56,  pctAlvo: 40.00, cabeca: 6,  postes: 4, foraArea: 30 },
  { pos: 10, nome: "Sport Recife",         escudo: TM(2420),  pontos: 7,  xPoints: 7.10, idadeMedia: 26.20, posse: 52.70, substituicoes: 23, gs: 4, xGA: 5.98,  xGAremate: 0.10, remates: 61, rematesP90: 10.66, pctAlvo: 37.70, cabeca: 12, postes: 1, foraArea: 29 },
  { pos: 11, nome: "Criciúma",             escudo: TM(2188),  pontos: 7,  xPoints: 7.60, idadeMedia: 30.60, posse: 50.70, substituicoes: 25, gs: 5, xGA: 4.59,  xGAremate: 0.09, remates: 61, rematesP90: 10.79, pctAlvo: 26.20, cabeca: 16, postes: 1, foraArea: 23 },
  { pos: 12, nome: "Juventude",            escudo: TM(2191),  pontos: 7,  xPoints: 6.00, idadeMedia: 27.90, posse: 52.50, substituicoes: 25, gs: 4, xGA: 5.06,  xGAremate: 0.09, remates: 54, rematesP90: 9.82,  pctAlvo: 33.30, cabeca: 9,  postes: 0, foraArea: 22 },
  { pos: 13, nome: "Goiás",                escudo: TM(1093),  pontos: 7,  xPoints: 7.50, idadeMedia: 28.60, posse: 53.60, substituicoes: 25, gs: 7, xGA: 5.49,  xGAremate: 0.10, remates: 45, rematesP90: 8.13,  pctAlvo: 22.20, cabeca: 5,  postes: 0, foraArea: 21 },
  { pos: 14, nome: "Cuiabá",               escudo: TM(15647), pontos: 6,  xPoints: 7.50, idadeMedia: 26.10, posse: 44.50, substituicoes: 25, gs: 2, xGA: 3.64,  xGAremate: 0.07, remates: 51, rematesP90: 8.96,  pctAlvo: 29.40, cabeca: 6,  postes: 2, foraArea: 27 },
  { pos: 15, nome: "Náutico",              escudo: TM(2425),  pontos: 6,  xPoints: 8.10, idadeMedia: 29.80, posse: 59.80, substituicoes: 24, gs: 6, xGA: 5.98,  xGAremate: 0.13, remates: 68, rematesP90: 11.81, pctAlvo: 23.50, cabeca: 13, postes: 3, foraArea: 25 },
  { pos: 16, nome: "Londrina",             escudo: TM(2186),  pontos: 5,  xPoints: 4.70, idadeMedia: 27.60, posse: 43.90, substituicoes: 21, gs: 7, xGA: 10.37, xGAremate: 0.14, remates: 52, rematesP90: 9.32,  pctAlvo: 28.80, cabeca: 7,  postes: 0, foraArea: 22 },
  { pos: 17, nome: "Atlético GO",          escudo: TM(977),   pontos: 4,  xPoints: 6.20, idadeMedia: 27.60, posse: 49.10, substituicoes: 25, gs: 7, xGA: 6.82,  xGAremate: 0.12, remates: 50, rematesP90: 9.04,  pctAlvo: 26.00, cabeca: 12, postes: 4, foraArea: 22 },
  { pos: 18, nome: "Ponte Preta",          escudo: TM(1586),  pontos: 4,  xPoints: 6.70, idadeMedia: 28.80, posse: 47.70, substituicoes: 25, gs: 6, xGA: 8.58,  xGAremate: 0.12, remates: 50, rematesP90: 8.70,  pctAlvo: 48.00, cabeca: 8,  postes: 0, foraArea: 16 },
  { pos: 19, nome: "CRB",                  escudo: TM(2032),  pontos: 2,  xPoints: 8.00, idadeMedia: 28.70, posse: 56.30, substituicoes: 25, gs: 8, xGA: 5.57,  xGAremate: 0.10, remates: 71, rematesP90: 12.26, pctAlvo: 42.30, cabeca: 9,  postes: 1, foraArea: 35 },
  { pos: 20, nome: "América Mineiro",      escudo: TM(2420),  pontos: 2,  xPoints: 6.20, idadeMedia: 28.40, posse: 62.30, substituicoes: 25, gs: 9, xGA: 6.58,  xGAremate: 0.12, remates: 79, rematesP90: 14.08, pctAlvo: 34.20, cabeca: 13, postes: 0, foraArea: 41 },
];

export function computeSerieBAverages(teams = SERIE_B_TEAMS) {
  if (!teams.length) return {};
  const out = {};
  SERIE_B_METRICS.forEach(m => {
    const sum = teams.reduce((s, t) => s + (Number(t[m.key]) || 0), 0);
    out[m.key] = sum / teams.length;
  });
  return out;
}

export function formatMetric(v, fmt) {
  if (v === null || v === undefined || Number.isNaN(v)) return "—";
  if (fmt === "int") return Math.round(v).toString();
  return Number(v).toFixed(2).replace(".", ",");
}
