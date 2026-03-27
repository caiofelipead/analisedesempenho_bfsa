import { renderHook, act } from "@testing-library/react";
import useAdvLinks from "../useAdvLinks";

jest.mock("../supabaseClient", () => ({ supabase: null }));

beforeEach(() => {
  localStorage.clear();
});

describe("useAdvLinks", () => {
  it("initializes with empty object", () => {
    const { result } = renderHook(() => useAdvLinks());
    expect(typeof result.current.links).toBe("object");
    expect(result.current.loading).toBe(false);
  });

  it("updates links", () => {
    const { result } = renderHook(() => useAdvLinks());
    act(() => {
      result.current.setLinks({ "team_r1": "https://new.com", "team_r2": "https://other.com" });
    });
    expect(result.current.links["team_r1"]).toBe("https://new.com");
    expect(result.current.links["team_r2"]).toBe("https://other.com");
  });

  it("provides a refresh function", () => {
    const { result } = renderHook(() => useAdvLinks());
    expect(typeof result.current.refresh).toBe("function");
  });
});
