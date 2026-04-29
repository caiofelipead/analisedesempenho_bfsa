// ═══════════════════════════════════════════════
// ACCESS LOGS — persistência e leitura
// ═══════════════════════════════════════════════
//
// Eventos auditados:
//   login_success | login_failure | page_view | user_created | user_deleted
//
// Estratégia:
//   - Se Supabase estiver configurado, persiste em `access_logs`.
//   - Caso contrário (ou em caso de falha definitiva), cai para localStorage.
//   - Erros transitórios (rede, RLS) não desabilitam o Supabase — o write é
//     re-tentado em chamadas futuras. Apenas a ausência da tabela trava o
//     circuit breaker, evitando flood do console com 404 repetidos.
//   - TODOS os erros são logados no console com contexto, para que o time
//     possa diagnosticar problemas de cross-device sync.

import { supabase } from "../supabaseClient";

const LS_KEY = "bfsa_access_logs";
const LS_CAP = 500; // evita crescer sem limite no fallback local

// Circuit breaker: só dispara quando temos certeza de que a tabela
// `access_logs` não existe. Erros transitórios (rede, RLS, conflito de
// schema cache momentâneo) NÃO devem desabilitar o Supabase pelo resto
// da sessão — caso contrário, perdemos persistência cross-device.
let supabaseDisabled = false;
function isDefinitelyMissingTable(error) {
  if (!error) return false;
  const code = error.code || "";
  const status = error.status || 0;
  // Sinais inequívocos de tabela ausente:
  //   - PostgREST: PGRST205 (relação não encontrada)
  //   - Postgres:  42P01   (undefined_table)
  //   - HTTP 404 explícito da PostgREST
  return status === 404 || code === "PGRST205" || code === "42P01";
}

function describeError(error, action) {
  if (!error) return null;
  const parts = [];
  if (error.code) parts.push(`code=${error.code}`);
  if (error.status) parts.push(`status=${error.status}`);
  if (error.message) parts.push(error.message);
  return `[BFSA access_logs] ${action} falhou: ${parts.join(" | ") || "erro desconhecido"}`;
}

// ─────────────────────────────────────────────
// EVENT TYPES
// ─────────────────────────────────────────────
export const EVENT_TYPES = {
  LOGIN_SUCCESS: "login_success",
  LOGIN_FAILURE: "login_failure",
  PAGE_VIEW: "page_view",
  USER_CREATED: "user_created",
  USER_DELETED: "user_deleted",
};

export const EVENT_LABELS = {
  login_success: "Login",
  login_failure: "Falha de login",
  page_view: "Navegação",
  user_created: "Usuário criado",
  user_deleted: "Usuário removido",
};

export const EVENT_COLORS = {
  login_success: "green",
  login_failure: "red",
  page_view: "blue",
  user_created: "purple",
  user_deleted: "yellow",
};

// ─────────────────────────────────────────────
// LOCAL STORAGE FALLBACK
// ─────────────────────────────────────────────
function readLS() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeLS(arr) {
  try {
    const trimmed = arr.slice(0, LS_CAP);
    localStorage.setItem(LS_KEY, JSON.stringify(trimmed));
  } catch {}
}

// ─────────────────────────────────────────────
// CLIENT INFO
// ─────────────────────────────────────────────
function getUserAgent() {
  try {
    return (typeof navigator !== "undefined" && navigator.userAgent) || "";
  } catch {
    return "";
  }
}

export function parseUserAgent(ua) {
  if (!ua) return { browser: "—", os: "—" };
  let browser = "—";
  let os = "—";
  if (/Edg\//.test(ua)) browser = "Edge";
  else if (/OPR\//.test(ua)) browser = "Opera";
  else if (/Chrome\//.test(ua)) browser = "Chrome";
  else if (/Firefox\//.test(ua)) browser = "Firefox";
  else if (/Safari\//.test(ua)) browser = "Safari";
  if (/Windows NT/.test(ua)) os = "Windows";
  else if (/Mac OS X/.test(ua)) os = "macOS";
  else if (/Android/.test(ua)) os = "Android";
  else if (/iPhone|iPad|iPod/.test(ua)) os = "iOS";
  else if (/Linux/.test(ua)) os = "Linux";
  return { browser, os };
}

// ─────────────────────────────────────────────
// WRITE
// ─────────────────────────────────────────────
export async function logAccess({ username, event_type, path = null, detail = null }) {
  const row = {
    email: username || "anonymous", // a coluna no banco chama "email" por convenção
    event_type,
    path,
    detail,
    user_agent: getUserAgent(),
    ip: null, // em ambiente 100% client-side não temos acesso confiável ao IP
    created_at: new Date().toISOString(),
  };

  // Sempre grava no LS primeiro (instantâneo, serve de fallback e de cache).
  try {
    const cur = readLS();
    writeLS([{ id: `ls_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`, ...row }, ...cur]);
  } catch {}

  if (supabase && !supabaseDisabled) {
    try {
      const { error } = await supabase.from("access_logs").insert([row]);
      if (error) {
        if (isDefinitelyMissingTable(error)) {
          supabaseDisabled = true;
          console.warn("[BFSA access_logs] tabela ausente no Supabase — usando fallback local pelo resto da sessão. Rode supabase_setup.sql para habilitar a auditoria cross-device.");
        } else {
          // Erro transitório: NÃO desabilita o Supabase, apenas reporta para
          // o console. A próxima chamada tentará de novo. Sem isso, falhas
          // silenciosas escondem problemas reais de cross-device sync.
          console.warn(describeError(error, "insert"));
        }
      }
    } catch (e) {
      // Erro de rede / fetch — também não desabilita, só reporta.
      console.warn(describeError(e, "insert (exception)"));
    }
  }
}

// ─────────────────────────────────────────────
// READ
// ─────────────────────────────────────────────
export async function listAccessLogs({ limit = 100, offset = 0, email = null, event_type = null } = {}) {
  if (supabase && !supabaseDisabled) {
    try {
      let q = supabase
        .from("access_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1);
      if (email) q = q.eq("email", email);
      if (event_type) q = q.eq("event_type", event_type);
      const { data, error } = await q;
      if (!error && Array.isArray(data)) return data;
      if (error) {
        if (isDefinitelyMissingTable(error)) {
          supabaseDisabled = true;
          console.warn("[BFSA access_logs] tabela ausente no Supabase — usando fallback local pelo resto da sessão.");
        } else {
          console.warn(describeError(error, "select"));
        }
      }
    } catch (e) {
      console.warn(describeError(e, "select (exception)"));
    }
  }
  // Fallback local
  let arr = readLS();
  if (email) arr = arr.filter((r) => r.email === email);
  if (event_type) arr = arr.filter((r) => r.event_type === event_type);
  return arr.slice(offset, offset + limit);
}

// ─────────────────────────────────────────────
// PURGE (admin)
// ─────────────────────────────────────────────
export async function purgeAccessLogs(days = 90) {
  const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
  if (supabase && !supabaseDisabled) {
    try {
      const { error } = await supabase.from("access_logs").delete().lt("created_at", cutoff);
      if (error) {
        if (isDefinitelyMissingTable(error)) {
          supabaseDisabled = true;
          console.warn("[BFSA access_logs] tabela ausente no Supabase — usando fallback local pelo resto da sessão.");
        } else {
          console.warn(describeError(error, "delete"));
        }
      }
    } catch (e) {
      console.warn(describeError(e, "delete (exception)"));
    }
  }
  try {
    const cur = readLS().filter((r) => r.created_at >= cutoff);
    writeLS(cur);
  } catch {}
}
