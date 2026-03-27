import { renderHook, act } from "@testing-library/react";
import useTarefas from "../useTarefas";

// Mock supabase client
jest.mock("../supabaseClient", () => ({ supabase: null }));

beforeEach(() => {
  localStorage.clear();
});

describe("useTarefas", () => {
  it("initializes with empty array when localStorage is empty", () => {
    const { result } = renderHook(() => useTarefas());
    expect(result.current.tarefas).toEqual([]);
    expect(result.current.loading).toBe(false);
  });

  it("loads initial state from localStorage", () => {
    const stored = [{ id: 1, titulo: "Test", status: "pendente" }];
    localStorage.setItem("bfsa_tarefas", JSON.stringify(stored));
    const { result } = renderHook(() => useTarefas());
    expect(result.current.tarefas).toEqual(stored);
  });

  it("adds a tarefa with fallback (no supabase)", async () => {
    const { result } = renderHook(() => useTarefas());
    await act(async () => {
      await result.current.addTarefa({ titulo: "Nova tarefa", analista: "Test", prio: "alta", status: "pendente" });
    });
    expect(result.current.tarefas).toHaveLength(1);
    expect(result.current.tarefas[0].titulo).toBe("Nova tarefa");
    expect(result.current.tarefas[0].id).toBeDefined();
  });

  it("updates a tarefa optimistically", async () => {
    localStorage.setItem("bfsa_tarefas", JSON.stringify([{ id: 42, titulo: "Old", status: "pendente" }]));
    const { result } = renderHook(() => useTarefas());
    await act(async () => {
      await result.current.updateTarefa(42, { status: "concluida" });
    });
    expect(result.current.tarefas[0].status).toBe("concluida");
  });

  it("removes a tarefa", async () => {
    localStorage.setItem("bfsa_tarefas", JSON.stringify([
      { id: 1, titulo: "Keep" },
      { id: 2, titulo: "Remove" },
    ]));
    const { result } = renderHook(() => useTarefas());
    await act(async () => {
      await result.current.removeTarefa(2);
    });
    expect(result.current.tarefas).toHaveLength(1);
    expect(result.current.tarefas[0].titulo).toBe("Keep");
  });

  it("syncs to localStorage when tarefas change", async () => {
    const { result } = renderHook(() => useTarefas());
    await act(async () => {
      await result.current.addTarefa({ titulo: "Sync test", status: "pendente" });
    });
    const stored = JSON.parse(localStorage.getItem("bfsa_tarefas"));
    expect(stored).toHaveLength(1);
    expect(stored[0].titulo).toBe("Sync test");
  });

  it("provides a refresh function", () => {
    const { result } = renderHook(() => useTarefas());
    expect(typeof result.current.refresh).toBe("function");
  });
});
