import { renderHook, act, waitFor } from "@testing-library/react";
import useAdvChecklist from "../useAdvChecklist";

// Mock mutável: cada teste injeta o mock que quiser via `mockSupabase`.
// Prefixo `mock` é exigido pelo babel-jest para variáveis usadas em
// jest.mock (que é hoisted antes do código do arquivo).
let mockSupabase = null;
jest.mock("../supabaseClient", () => ({
  get supabase() { return mockSupabase; },
}));

beforeEach(() => {
  localStorage.clear();
  mockSupabase = null;
});

describe("useAdvChecklist (sem supabase)", () => {
  it("initializes with empty array", () => {
    const { result } = renderHook(() => useAdvChecklist());
    expect(Array.isArray(result.current.checklist)).toBe(true);
    expect(result.current.loading).toBe(false);
  });

  it("updates checklist via setChecklist", () => {
    const { result } = renderHook(() => useAdvChecklist());
    act(() => {
      result.current.setChecklist([
        { label: "Item 1", done: false, fixed: true },
        { label: "Item 2", done: true, fixed: false },
      ]);
    });
    expect(result.current.checklist).toHaveLength(2);
    expect(result.current.checklist[0].label).toBe("Item 1");
    expect(result.current.checklist[1].done).toBe(true);
  });

  it("provides a refresh function", () => {
    const { result } = renderHook(() => useAdvChecklist());
    expect(typeof result.current.refresh).toBe("function");
  });
});

// Sincronização incremental: substituí o ciclo destrutivo "DELETE all
// → INSERT all" por UPDATE/INSERT/DELETE alvo. Os testes abaixo
// garantem que (a) itens existentes não são apagados ao salvar uma
// alteração e (b) o id retornado pelo INSERT é reutilizado nos saves
// seguintes — sem isso, o segundo save criaria duplicatas.
describe("useAdvChecklist (sincronização incremental)", () => {
  function makeSupabaseMock(initialRows) {
    const state = { rows: initialRows.map((r) => ({ ...r })) };
    let nextId = Math.max(0, ...state.rows.map((r) => r.id || 0)) + 1;

    const calls = { update: [], insert: [], delete: [], deleteNeq: 0 };

    const builder = () => ({
      select(cols) {
        const rows = state.rows.map((r) => {
          if (cols && cols !== "*") {
            const fields = cols.split(",").map((s) => s.trim());
            const o = {};
            fields.forEach((f) => { o[f] = r[f]; });
            return o;
          }
          return { ...r };
        });
        return {
          data: rows,
          error: null,
          order: () => Promise.resolve({ data: rows, error: null }),
          then: (resolve) => resolve({ data: rows, error: null }),
        };
      },
      delete() {
        return {
          in: (col, ids) => {
            calls.delete.push({ col, ids: [...ids] });
            state.rows = state.rows.filter((r) => !ids.includes(r[col]));
            return Promise.resolve({ error: null });
          },
          neq: () => {
            // Não deveria ser chamado pelo novo fluxo. Sinalizamos
            // para detectar regressões para o ciclo destrutivo antigo.
            calls.deleteNeq += 1;
            state.rows = [];
            return Promise.resolve({ error: null });
          },
        };
      },
      update(payload) {
        return {
          eq: (col, val) => {
            calls.update.push({ payload: { ...payload }, col, val });
            state.rows = state.rows.map((r) =>
              r[col] === val ? { ...r, ...payload } : r
            );
            return Promise.resolve({ error: null });
          },
        };
      },
      insert(rowsArg) {
        const rows = Array.isArray(rowsArg) ? rowsArg : [rowsArg];
        calls.insert.push(rows);
        const inserted = rows.map((r) => ({ ...r, id: nextId++ }));
        state.rows = [...state.rows, ...inserted];
        return {
          select: () => Promise.resolve({ data: inserted, error: null }),
          then: (resolve) => resolve({ error: null }),
        };
      },
    });

    return {
      supabase: { from: () => builder() },
      state,
      calls,
    };
  }

  it("UPDATE existing items by id; does NOT wipe the table", async () => {
    const initial = [
      { id: 10, label: "Relatório PDF", produzido: false, apresentado: false, done: false, fixed: true, position: 0 },
      { id: 11, label: "Vídeo Análise", produzido: false, apresentado: false, done: false, fixed: true, position: 1 },
    ];
    const mock = makeSupabaseMock(initial);
    mockSupabase = mock.supabase;

    const { result } = renderHook(() => useAdvChecklist());
    await waitFor(() => expect(result.current.checklist.length).toBe(2));

    await act(async () => {
      result.current.setChecklist([
        { ...result.current.checklist[0], produzido: true },
        result.current.checklist[1],
      ]);
    });
    await waitFor(() => expect(mock.calls.update.length).toBeGreaterThan(0));

    expect(mock.calls.deleteNeq).toBe(0);
    expect(mock.calls.update[0].col).toBe("id");
    expect(mock.calls.update[0].val).toBe(10);
    expect(mock.calls.update[0].payload.produzido).toBe(true);
    expect(mock.state.rows).toHaveLength(2);
    const updated = mock.state.rows.find((r) => r.id === 10);
    expect(updated.produzido).toBe(true);
  });

  it("INSERT only NEW items; reuses ids on subsequent saves (no duplicates)", async () => {
    const mock = makeSupabaseMock([]);
    mockSupabase = mock.supabase;

    const { result } = renderHook(() => useAdvChecklist());
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      result.current.setChecklist([
        { label: "Custom 1", produzido: true, apresentado: false, done: false, fixed: false },
      ]);
    });
    await waitFor(() => expect(mock.calls.insert.length).toBe(1));
    expect(mock.state.rows).toHaveLength(1);

    // Segundo save: marca apresentado no MESMO item. Não deve inserir
    // de novo — deve atualizar o id já existente.
    await act(async () => {
      result.current.setChecklist([
        { label: "Custom 1", produzido: true, apresentado: true, done: true, fixed: false },
      ]);
    });
    await waitFor(() => expect(mock.calls.update.length).toBeGreaterThan(0));
    expect(mock.calls.insert).toHaveLength(1);
    expect(mock.state.rows).toHaveLength(1);
    expect(mock.state.rows[0].apresentado).toBe(true);
  });

  it("DELETE only items the user removed (not all rows)", async () => {
    const initial = [
      { id: 1, label: "Keep", produzido: false, apresentado: false, done: false, fixed: false, position: 0 },
      { id: 2, label: "Remove", produzido: false, apresentado: false, done: false, fixed: false, position: 1 },
    ];
    const mock = makeSupabaseMock(initial);
    mockSupabase = mock.supabase;

    const { result } = renderHook(() => useAdvChecklist());
    await waitFor(() => expect(result.current.checklist.length).toBe(2));

    await act(async () => {
      result.current.setChecklist(
        result.current.checklist.filter((c) => c.label === "Keep")
      );
    });
    await waitFor(() => expect(mock.calls.delete.length).toBeGreaterThan(0));

    expect(mock.calls.deleteNeq).toBe(0);
    expect(mock.calls.delete[0].ids).toEqual([2]);
    expect(mock.state.rows).toHaveLength(1);
    expect(mock.state.rows[0].id).toBe(1);
  });
});
