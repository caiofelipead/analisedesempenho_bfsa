import { useState, useEffect, useCallback } from "react";
import { supabase } from "./supabaseClient";

const LS_KEY = "bfsa_advChecklist";

function readLS() {
  try { const s = localStorage.getItem(LS_KEY); return s ? JSON.parse(s) : []; }
  catch { return []; }
}
function writeLS(arr) {
  try { localStorage.setItem(LS_KEY, JSON.stringify(arr)); } catch {}
}

export default function useAdvChecklist() {
  const [checklist, setChecklist] = useState(readLS);
  const [loading, setLoading] = useState(false);

  useEffect(() => { writeLS(checklist); }, [checklist]);

  const fetchChecklist = useCallback(async () => {
    if (!supabase) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("adv_checklist")
        .select("*")
        .order("position", { ascending: true });
      if (error) throw error;
      if (data && data.length > 0) {
        setChecklist(data.map(r => ({
          id: r.id,
          label: r.label,
          done: r.done,
          fixed: r.fixed,
        })));
      }
    } catch (e) {
      console.error("[BFSA] Erro ao carregar checklist:", e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchChecklist(); }, [fetchChecklist]);

  const syncToSupabase = useCallback(async (items) => {
    if (!supabase) return;
    try {
      // Delete all and re-insert to keep order
      await supabase.from("adv_checklist").delete().neq("id", 0);
      const rows = items.map((item, i) => ({
        label: item.label,
        done: !!item.done,
        fixed: !!item.fixed,
        position: i,
      }));
      if (rows.length > 0) {
        const { error } = await supabase.from("adv_checklist").insert(rows);
        if (error) throw error;
      }
    } catch (e) {
      console.error("[BFSA] Erro ao sincronizar checklist:", e.message);
    }
  }, []);

  const updateChecklist = useCallback((items) => {
    setChecklist(items);
    syncToSupabase(items);
  }, [syncToSupabase]);

  return { checklist, setChecklist: updateChecklist, loading, refresh: fetchChecklist };
}
