import { norm } from "./utils";
import { ATLETAS } from "./constants";

// Compute dynamic tendency for each athlete based on individual stats
// Compares average "acoes" (actions) in last 3 games vs previous games
export default function computeTendencies(individual) {
  const tendMap = {};
  ATLETAS.forEach(a => {
    const aN = norm(a.nome);
    const games = individual.filter(r => {
      const rN = norm(r.atleta);
      return rN === aN || rN.includes(aN) || aN.includes(rN);
    }).sort((x, y) => (x.data || "").localeCompare(y.data || ""));
    if (games.length < 3) { tendMap[a.id] = "estável"; return; }
    const recent = games.slice(-3);
    const older = games.slice(0, -3);
    if (older.length === 0) { tendMap[a.id] = "estável"; return; }
    const avgRecent = recent.reduce((s, r) => s + (r.acoes || 0), 0) / recent.length;
    const avgOlder = older.reduce((s, r) => s + (r.acoes || 0), 0) / older.length;
    const diff = avgOlder > 0 ? (avgRecent - avgOlder) / avgOlder : 0;
    tendMap[a.id] = diff > 0.05 ? "subindo" : diff < -0.05 ? "descendo" : "estável";
  });
  return tendMap;
}
