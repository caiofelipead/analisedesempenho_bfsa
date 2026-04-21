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
        setChecklist(data.map(r => {
          const produzido = r.produzido != null ? !!r.produzido : !!r.done;
          const apresentado = r.apresentado != null ? !!r.apresentado : !!r.done;
          return {
            id: r.id,
            label: r.label,
            produzido,
            apresentado,
            done: produzido && apresentado,
            fixed: r.fixed,
          };
        }));
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
    const buildRows = (withExtras) => items.map((item, i) => {
      const produzido = !!item.produzido;
      const apresentado = !!item.apresentado;
      const base = {
        label: item.label,
        done: produzido && apresentado,
        fixed: !!item.fixed,
        position: i,
      };
      return withExtras ? { ...base, produzido, apresentado } : base;
    });
    try {
      await supabase.from("adv_checklist").delete().neq("id", 0);
      if (items.length === 0) return;
      let { error } = await supabase.from("adv_checklist").insert(buildRows(true));
      if (error && /produzido|apresentado|column/i.test(error.message || "")) {
        console.warn("[BFSA] Colunas produzido/apresentado ausentes no Supabase. Rode o ALTER TABLE do supabase_setup.sql. Salvando sem elas.");
        ({ error } = await supabase.from("adv_checklist").insert(buildRows(false)));
      }
      if (error) throw error;
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
