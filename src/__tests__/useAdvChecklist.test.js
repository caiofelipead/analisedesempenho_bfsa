import { renderHook, act } from "@testing-library/react";
import useAdvChecklist from "../useAdvChecklist";

jest.mock("../supabaseClient", () => ({ supabase: null }));

beforeEach(() => {
  localStorage.clear();
});

describe("useAdvChecklist", () => {
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
