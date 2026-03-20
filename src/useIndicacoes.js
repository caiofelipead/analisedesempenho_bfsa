import { useState, useEffect, useCallback } from "react";
import { supabase } from "./supabaseClient";

const LS_KEY = "bfsa_indicacoes";

function readLS() {
  try { const s = localStorage.getItem(LS_KEY); return s ? JSON.parse(s) : []; }
  catch { return []; }
}
function writeLS(arr) {
  try { localStorage.setItem(LS_KEY, JSON.stringify(arr)); } catch {}
}

export default function useIndicacoes() {
  const [indicacoes, setIndicacoes] = useState(readLS);
  const [loading, setLoading] = useState(false);

  useEffect(() => { writeLS(indicacoes); }, [indicacoes]);

  const fetchIndicacoes = useCallback(async () => {
    if (!supabase) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("indicacoes")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      if (data) setIndicacoes(data);
    } catch (e) {
      console.error("[BFSA] Erro ao carregar indicações:", e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchIndicacoes(); }, [fetchIndicacoes]);

  const addIndicacao = useCallback(async (item) => {
    const row = { ...item, created_at: new Date().toISOString() };
    if (supabase) {
      try {
        const { data, error } = await supabase.from("indicacoes").insert([row]).select();
        if (error) throw error;
        if (data && data[0]) {
          setIndicacoes(prev => [data[0], ...prev]);
          return;
        }
      } catch (e) {
        console.error("[BFSA] Erro ao criar indicação:", e.message);
      }
    }
    setIndicacoes(prev => [{ ...row, id: Date.now() }, ...prev]);
  }, []);

  const updateIndicacao = useCallback(async (id, updates) => {
    setIndicacoes(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
    if (supabase) {
      try {
        const { error } = await supabase.from("indicacoes").update(updates).eq("id", id);
        if (error) throw error;
      } catch (e) {
        console.error("[BFSA] Erro ao atualizar indicação:", e.message);
      }
    }
  }, []);

  const removeIndicacao = useCallback(async (id) => {
    setIndicacoes(prev => prev.filter(t => t.id !== id));
    if (supabase) {
      try {
        const { error } = await supabase.from("indicacoes").delete().eq("id", id);
        if (error) throw error;
      } catch (e) {
        console.error("[BFSA] Erro ao remover indicação:", e.message);
      }
    }
  }, []);

  return { indicacoes, loading, addIndicacao, updateIndicacao, removeIndicacao, refresh: fetchIndicacoes };
}
