// Testes de regressão para auditoria de acessos:
//   - Erros transitórios (rede / RLS) NÃO devem desabilitar o Supabase
//     pelo resto da sessão. Isso era o que fazia logs de cassiocabral
//     ficarem retidos no localStorage do device dele e nunca chegarem
//     ao banco.
//   - Apenas a ausência da tabela trava o circuit breaker.
//
// Cada teste usa jest.isolateModules para começar com o circuit breaker
// limpo, sem precisar exportar um reset helper só para os testes.

const mockInsertSpy = jest.fn();
const mockFromSpy = jest.fn();

jest.mock("../supabaseClient", () => ({
  supabase: { from: (...args) => mockFromSpy(...args) },
}));

beforeEach(() => {
  localStorage.clear();
  mockInsertSpy.mockReset();
  mockFromSpy.mockReset();
  mockFromSpy.mockImplementation(() => ({
    insert: mockInsertSpy,
    select: () => ({ order: () => ({ range: () => Promise.resolve({ data: [], error: null }) }) }),
    delete: () => ({ lt: () => Promise.resolve({ error: null }) }),
  }));
});

function withFreshAccess(fn) {
  let result;
  jest.isolateModules(() => {
    // eslint-disable-next-line global-require
    const mod = require("../shared/access");
    result = fn(mod);
  });
  return result;
}

describe("logAccess — circuit breaker", () => {
  it("does not disable Supabase on a transient network error", async () => {
    mockInsertSpy.mockResolvedValueOnce({ error: { code: "PGRST301", message: "fetch failed" } });
    mockInsertSpy.mockResolvedValueOnce({ error: null });

    const { logAccess } = withFreshAccess((m) => m);
    await logAccess({ username: "cassiocabral", event_type: "login_success" });
    await logAccess({ username: "cassiocabral", event_type: "page_view", path: "dashboard" });

    expect(mockInsertSpy).toHaveBeenCalledTimes(2);
  });

  it("does not disable Supabase on a generic 'does not exist' error message", async () => {
    mockInsertSpy.mockResolvedValueOnce({
      error: { code: "PGRST116", message: "Row level security policy does not exist for this user" },
    });
    mockInsertSpy.mockResolvedValueOnce({ error: null });

    const { logAccess } = withFreshAccess((m) => m);
    await logAccess({ username: "cassiocabral", event_type: "login_success" });
    await logAccess({ username: "cassiocabral", event_type: "page_view" });

    expect(mockInsertSpy).toHaveBeenCalledTimes(2);
  });

  it("DOES disable Supabase when the table is definitively missing (404)", async () => {
    mockInsertSpy.mockResolvedValue({ error: { status: 404, message: "Not Found" } });

    const { logAccess } = withFreshAccess((m) => m);
    await logAccess({ username: "x", event_type: "login_success" });
    await logAccess({ username: "x", event_type: "page_view" });

    expect(mockInsertSpy).toHaveBeenCalledTimes(1);
  });

  it("DOES disable Supabase on Postgres undefined_table (42P01)", async () => {
    mockInsertSpy.mockResolvedValue({ error: { code: "42P01", message: "relation \"access_logs\" does not exist" } });

    const { logAccess } = withFreshAccess((m) => m);
    await logAccess({ username: "x", event_type: "login_success" });
    await logAccess({ username: "x", event_type: "page_view" });

    expect(mockInsertSpy).toHaveBeenCalledTimes(1);
  });

  it("DOES disable Supabase on PostgREST schema-cache-miss (PGRST205)", async () => {
    mockInsertSpy.mockResolvedValue({ error: { code: "PGRST205", message: "Could not find the table" } });

    const { logAccess } = withFreshAccess((m) => m);
    await logAccess({ username: "x", event_type: "login_success" });
    await logAccess({ username: "x", event_type: "page_view" });

    expect(mockInsertSpy).toHaveBeenCalledTimes(1);
  });

  it("always writes to localStorage as cache, even when Supabase fails", async () => {
    mockInsertSpy.mockResolvedValue({ error: { code: "PGRST301", message: "boom" } });

    const { logAccess } = withFreshAccess((m) => m);
    await logAccess({ username: "cassiocabral", event_type: "login_success" });

    const stored = JSON.parse(localStorage.getItem("bfsa_access_logs"));
    expect(stored).toHaveLength(1);
    expect(stored[0].email).toBe("cassiocabral");
    expect(stored[0].event_type).toBe("login_success");
  });
});
