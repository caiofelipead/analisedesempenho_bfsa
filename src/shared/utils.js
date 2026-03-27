// Shared utility functions

export function ptNum(s) {
  if (!s || s === "") return null;
  const v = parseFloat(String(s).trim().replace(",", "."));
  return isNaN(v) ? null : v;
}

// Fuzzy column finder — normalizes header names to handle accent/case/slash variations
export function colNorm(s) { return (s||"").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9]/g,""); }

export function findCol(row, ...candidates) {
  for (const c of candidates) { if (row[c] !== undefined && row[c] !== "") return row[c]; }
  const keys = Object.keys(row);
  for (const c of candidates) {
    const cn = colNorm(c);
    if (!cn) continue;
    for (const k of keys) {
      const kn = colNorm(k);
      if (kn === cn) {
        if (row[k] !== undefined && row[k] !== "") return row[k];
      }
    }
  }
  for (const c of candidates) {
    const cn = colNorm(c);
    if (!cn || cn.length < 5) continue;
    for (const k of keys) {
      const kn = colNorm(k);
      if (kn.length < 5) continue;
      if ((kn.includes(cn) || cn.includes(kn)) && row[k] !== undefined && row[k] !== "") return row[k];
    }
  }
  return undefined;
}

export function getField(r, ...keys) { for(const k of keys) { if(r[k]) return r[k]; } return ""; }
export function getAdv(r) { return getField(r, "Adversário", "Adversario", "adversário", "adversario"); }
export function getComp(r) { return getField(r, "Comp", "comp", "Competição", "competição", "Competicao"); }

export function parseDateBR(s) {
  const p = (s||"").trim().split("/");
  if (p.length === 3) return new Date(+p[2], +p[1]-1, +p[0]);
  if (p.length === 2 && p[0] && p[1]) return new Date(new Date().getFullYear(), +p[1]-1, +p[0]);
  const d = new Date(s);
  return isNaN(d) ? null : d;
}

export function normDateKey(s) {
  const d = parseDateBR(s);
  if (!d || isNaN(d)) return (s||"").trim();
  return `${String(d.getDate()).padStart(2,"0")}/${String(d.getMonth()+1).padStart(2,"0")}/${d.getFullYear()}`;
}

export function fmtDateKey(d) {
  return `${String(d.getDate()).padStart(2,"0")}/${String(d.getMonth()+1).padStart(2,"0")}/${d.getFullYear()}`;
}

export function getWeekStart(d) {
  const dt = new Date(d); dt.setHours(0,0,0,0);
  const day = dt.getDay();
  dt.setDate(dt.getDate() - (day === 0 ? 6 : day - 1));
  return dt;
}

export const norm = s => (s||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().trim();
export const normalizeLogin = (name) => name.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/\s+/g,"").replace(/[^a-z0-9]/g,"");
