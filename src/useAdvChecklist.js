import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "./supabaseClient";

const LS_KEY = "bfsa_advChecklist";

function readLS() {
  try { const s = localStorage.getItem(LS_KEY); return s ? JSON.parse(s) : []; }
  catch { return []; }
}
function writeLS(arr) {
  try { localStorage.setItem(LS_KEY, JSON.stringify(arr)); } catch {}
}

// Chave estável de identidade do item para sincronização. Não temos
// constraint única no banco, então usamos label + flag fixed como
// identidade lógica: é o mesmo critério que a UI usa para casar
// itens fixos com seus registros salvos.
const itemKey = (i) => `${(i.label || "").trim().toLowerCase()}|${!!i.fixed}`;

function buildRow(item, position, withExtras) {
  const produzido = !!item.produzido;
  const apresentado = !!item.apresentado;
  const base = {
    label: item.label,
    done: produzido && apresentado,
    fixed: !!item.fixed,
    position,
  };
  return withExtras ? { ...base, produzido, apresentado } : base;
}

export default function useAdvChecklist() {
  const [checklist, setChecklist] = useState(readLS);
  const [loading, setLoading] = useState(false);
  // Mapa label|fixed → id no Supabase. Mantém referência estável para
  // que updates subsequentes ataquem o mesmo registro em vez de criar
  // duplicatas.
  const idMapRef = useRef(new Map());
  // Flag indicando se o schema do Supabase tem as colunas
  // produzido/apresentado. Em instalações antigas que não rodaram o
  // ALTER TABLE, precisamos pular essas colunas para não falhar — e
  // sem perder o estado em memória.
  const hasExtrasRef = useRef(true);

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
      const map = new Map();
      const rows = Array.isArray(data) ? data : [];
      rows.forEach((r) => {
        map.set(itemKey({ label: r.label, fixed: r.fixed }), r.id);
      });
      idMapRef.current = map;
      if (rows.length > 0) {
        setChecklist(rows.map(r => {
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
      console.error("[BFSA] Erro ao carregar checklist:", e.message || e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchChecklist(); }, [fetchChecklist]);

  // Sincronização incremental:
  //   - Itens existentes (pelo label+fixed) são atualizados por id (UPDATE).
  //   - Itens novos são inseridos.
  //   - Itens que sumiram da lista são deletados (apenas eles).
  //
  // Isso elimina o ciclo destrutivo "DELETE all → INSERT all", que (a)
  // perdia tudo se o INSERT falhasse após o DELETE e (b) provocava race
  // entre múltiplos usuários editando ao mesmo tempo.
  const syncToSupabase = useCallback(async (items) => {
    if (!supabase) return;

    // Garante que temos o mapa de IDs atual antes de decidir o que
    // atualizar/inserir/deletar. Sem isso, o primeiro save após o load
    // poderia inserir duplicatas dos itens já existentes.
    let idMap = idMapRef.current;
    if (idMap.size === 0) {
      try {
        const { data, error } = await supabase
          .from("adv_checklist")
          .select("id, label, fixed");
        if (!error && Array.isArray(data)) {
          idMap = new Map(data.map(r => [itemKey({ label: r.label, fixed: r.fixed }), r.id]));
          idMapRef.current = idMap;
        }
      } catch (e) {
        console.warn("[BFSA] Erro ao listar checklist para diff:", e.message || e);
      }
    }

    const newKeys = new Set(items.map(itemKey));
    const toDelete = [];
    for (const [key, id] of idMap.entries()) {
      if (!newKeys.has(key)) toDelete.push(id);
    }

    const updates = [];
    const inserts = [];
    items.forEach((item, i) => {
      const key = itemKey(item);
      const existingId = idMap.get(key);
      const row = buildRow(item, i, hasExtrasRef.current);
      if (existingId != null) {
        updates.push({ id: existingId, ...row });
      } else {
        inserts.push({ key, row });
      }
    });

    try {
      // 1) Deleta apenas os itens que o usuário realmente removeu.
      if (toDelete.length > 0) {
        const { error } = await supabase
          .from("adv_checklist")
          .delete()
          .in("id", toDelete);
        if (error) throw error;
        toDelete.forEach((id) => {
          for (const [k, v] of idMap.entries()) if (v === id) idMap.delete(k);
        });
      }

      // 2) Atualiza os itens existentes — preserva o id original.
      for (const u of updates) {
        const { id, ...payload } = u;
        let { error } = await supabase
          .from("adv_checklist")
          .update(payload)
          .eq("id", id);
        if (error && /produzido|apresentado|column/i.test(error.message || "")) {
          // Schema legado sem produzido/apresentado: tenta sem essas
          // colunas e marca para os próximos saves não tentarem.
          hasExtrasRef.current = false;
          const fallback = { ...payload };
          delete fallback.produzido;
          delete fallback.apresentado;
          ({ error } = await supabase
            .from("adv_checklist")
            .update(fallback)
            .eq("id", id));
        }
        if (error) throw error;
      }

      // 3) Insere os novos itens — captura os ids retornados para a
      // próxima sincronização.
      if (inserts.length > 0) {
        const payload = inserts.map(({ row }) => row);
        let { data, error } = await supabase
          .from("adv_checklist")
          .insert(payload)
          .select();
        if (error && /produzido|apresentado|column/i.test(error.message || "")) {
          hasExtrasRef.current = false;
          const fallback = payload.map((r) => {
            const { produzido, apresentado, ...rest } = r;
            return rest;
          });
          ({ data, error } = await supabase
            .from("adv_checklist")
            .insert(fallback)
            .select());
        }
        if (error) throw error;
        if (Array.isArray(data)) {
          data.forEach((r, idx) => {
            const key = inserts[idx]?.key || itemKey({ label: r.label, fixed: r.fixed });
            idMap.set(key, r.id);
          });
        }
      }
    } catch (e) {
      console.error("[BFSA] Erro ao sincronizar checklist:", e.message || e);
    }
  }, []);

  const updateChecklist = useCallback((items) => {
    setChecklist(items);
    syncToSupabase(items);
  }, [syncToSupabase]);

  return { checklist, setChecklist: updateChecklist, loading, refresh: fetchChecklist };
}
