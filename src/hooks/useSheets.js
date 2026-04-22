import { useState, useCallback } from "react";
import { fetchSheet, GID, mapColetivo, mapCalendario, mapVideos, mapIndividual, mapSerieB } from "../shared/csv";

export default function useSheets() {
  const [livePartidas, setLivePartidas] = useState(null);
  const [liveCalendario, setLiveCalendario] = useState(null);
  const [liveVideos, setLiveVideos] = useState(null);
  const [liveIndividual, setLiveIndividual] = useState(null);
  const [liveSerieB, setLiveSerieB] = useState(null);
  const [loading, setLoading] = useState(false);
  const [lastSync, setLastSync] = useState(null);
  const [error, setError] = useState(null);

  const sync = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const [colRows, calRows, vidRows, indRows, sbRows] = await Promise.all([
        fetchSheet(GID.coletivo), fetchSheet(GID.calendario), fetchSheet(GID.videos), fetchSheet(GID.individual), fetchSheet(GID.serieB),
      ]);
      const p = mapColetivo(colRows);
      const c = mapCalendario(calRows);
      const v = mapVideos(vidRows);
      const ind = mapIndividual(indRows);
      const sb = mapSerieB(sbRows);
      console.log("[BFSA Sync]", {rawRows:{col:colRows.length,cal:calRows.length,vid:vidRows.length,ind:indRows.length,sb:sbRows.length}, mapped:{p:p.length,c:c.length,v:v.length,ind:ind.length,sb:sb.length}, colHeaders: colRows[0] && Object.keys(colRows[0]), indHeaders: indRows[0] && Object.keys(indRows[0]), sbHeaders: sbRows[0] && Object.keys(sbRows[0])});
      if (ind.length > 0) {
        const sample = ind[0];
        const nullFields = Object.entries(sample).filter(([,v]) => v === null || v === "").map(([k]) => k);
        const okFields = Object.entries(sample).filter(([,v]) => v !== null && v !== "").map(([k]) => k);
        console.log("[BFSA mapIndividual] Fields OK:", okFields, "| Fields NULL:", nullFields);
      }
      if (p.length > 0) setLivePartidas(p);
      if (c.length > 0) setLiveCalendario(c);
      if (v.length > 0) setLiveVideos(v);
      if (ind.length > 0) setLiveIndividual(ind);
      if (sb.length > 0) setLiveSerieB(sb);
      const total = p.length + c.length + v.length;
      if (total === 0 && (colRows.length > 0 || calRows.length > 0)) {
        setError("CSV carregado mas headers não bateram. Veja console (F12).");
      }
      setLastSync(new Date().toLocaleTimeString("pt-BR"));
    } catch (e) { console.error("[BFSA Sync Error]", e); setError(e.message); }
    finally { setLoading(false); }
  }, []);

  return { livePartidas, liveCalendario, liveVideos, liveIndividual, liveSerieB, loading, lastSync, error, sync };
}
