import { renderHook, act } from "@testing-library/react";
import useIndicacoes from "../useIndicacoes";

jest.mock("../supabaseClient", () => ({ supabase: null }));

beforeEach(() => {
  localStorage.clear();
});

describe("useIndicacoes", () => {
  it("initializes with empty array", () => {
    const { result } = renderHook(() => useIndicacoes());
    expect(result.current.indicacoes).toEqual([]);
    expect(result.current.loading).toBe(false);
  });

  it("adds an indicacao with fallback (no supabase)", async () => {
    const { result } = renderHook(() => useIndicacoes());
    await act(async () => {
      await result.current.addIndicacao({ nome: "Jogador Teste", posicao: "Atacante", status: "novo" });
    });
    expect(result.current.indicacoes).toHaveLength(1);
    expect(result.current.indicacoes[0].nome).toBe("Jogador Teste");
  });

  it("updates an indicacao optimistically", async () => {
    localStorage.setItem("bfsa_indicacoes", JSON.stringify([{ id: 10, nome: "Player", status: "novo" }]));
    const { result } = renderHook(() => useIndicacoes());
    await act(async () => {
      await result.current.updateIndicacao(10, { status: "aprovado" });
    });
    expect(result.current.indicacoes[0].status).toBe("aprovado");
  });

  it("removes an indicacao", async () => {
    localStorage.setItem("bfsa_indicacoes", JSON.stringify([
      { id: 1, nome: "Keep" },
      { id: 2, nome: "Remove" },
    ]));
    const { result } = renderHook(() => useIndicacoes());
    await act(async () => {
      await result.current.removeIndicacao(2);
    });
    expect(result.current.indicacoes).toHaveLength(1);
    expect(result.current.indicacoes[0].nome).toBe("Keep");
  });
});
