import { useState, useEffect, useCallback } from "react";
import { supabase } from "./supabaseClient";

const LS_KEY = "bfsa_advLinks";

function readLS() {
  try { const s = localStorage.getItem(LS_KEY); return s ? JSON.parse(s) : {}; }
  catch { return {}; }
}
function writeLS(obj) {
  try { localStorage.setItem(LS_KEY, JSON.stringify(obj)); } catch {}
}

export default function useAdvLinks() {
  const [links, setLinks] = useState(readLS);
  const [loading, setLoading] = useState(false);

  useEffect(() => { writeLS(links); }, [links]);

  const fetchLinks = useCallback(async () => {
    if (!supabase) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("adv_links")
        .select("*");
      if (error) throw error;
      if (data) {
        const obj = {};
        data.forEach(r => { obj[r.match_key] = r.url; });
        setLinks(obj);
      }
    } catch (e) {
      console.error("[BFSA] Erro ao carregar links:", e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchLinks(); }, [fetchLinks]);

  const updateLinks = useCallback(async (newLinks) => {
    setLinks(newLinks);
    if (!supabase) return;
    try {
      // Upsert all links
      const rows = Object.entries(newLinks)
        .filter(([, url]) => url && url.trim())
        .map(([key, url]) => ({ match_key: key, url }));
      // Delete removed links
      await supabase.from("adv_links").delete().neq("match_key", "");
      if (rows.length > 0) {
        const { error } = await supabase.from("adv_links").insert(rows);
        if (error) throw error;
      }
    } catch (e) {
      console.error("[BFSA] Erro ao sincronizar links:", e.message);
    }
  }, []);

  return { links, setLinks: updateLinks, loading, refresh: fetchLinks };
}
