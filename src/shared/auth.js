// ═══════════════════════════════════════════════
// ACCESS CONTROL — Roles, permissions & seeded accounts
// ═══════════════════════════════════════════════
//
// Três perfis:
//   - admin    → pleno acesso + edição + gestão de usuários/auditoria
//   - viewer   → pleno acesso em leitura (sem edição / sem gestão)
//   - analyst  → perfil operacional padrão do dia-a-dia
//
// Atletas continuam tratados no fluxo separado (isAthleteUser) e não
// participam desse RBAC.

import { ATLETAS, ATHLETE_LOGINS } from "./constants";
import { normalizeLogin } from "./utils";

export const ROLES = { ADMIN: "admin", VIEWER: "viewer", ANALYST: "analyst" };

export const ROLE_LABELS = {
  admin: "Admin",
  viewer: "Viewer",
  analyst: "Analyst",
};

export const ROLE_DESCRIPTIONS = {
  admin:
    "Pleno acesso ao sistema, pode editar qualquer registro e gerenciar usuários, auditoria e configurações.",
  viewer:
    "Leitura plena de todas as áreas do sistema. Não edita registros nem acessa gestão de usuários.",
  analyst:
    "Perfil operacional: trabalha no fluxo normal de análise com suas próprias tarefas e conteúdos.",
};

// Lista de ações auditáveis na matriz de permissões
export const PERMISSION_ACTIONS = [
  { key: "view_all", label: "Visualizar todas as abas" },
  { key: "edit_content", label: "Editar conteúdo operacional" },
  { key: "manage_tasks", label: "Criar/editar tarefas" },
  { key: "sync_sheets", label: "Acionar ressync de planilhas" },
  { key: "view_users", label: "Ver lista de usuários" },
  { key: "view_audit", label: "Ver registro de acessos" },
  { key: "manage_users", label: "Criar/remover usuários" },
];

export const PERMISSIONS = {
  admin: {
    view_all: true,
    edit_content: true,
    manage_tasks: true,
    sync_sheets: true,
    view_users: true,
    view_audit: true,
    manage_users: true,
  },
  viewer: {
    view_all: true,
    edit_content: false,
    manage_tasks: false,
    sync_sheets: false,
    view_users: false,
    view_audit: false,
    manage_users: false,
  },
  analyst: {
    view_all: true,
    edit_content: true,
    manage_tasks: true,
    sync_sheets: true,
    view_users: false,
    view_audit: false,
    manage_users: false,
  },
};

// ─────────────────────────────────────────────
// SEED / ENV
// ─────────────────────────────────────────────
// Em CRA, apenas variáveis REACT_APP_* chegam ao bundle.
// Mantemos nomes limpos aqui e o .env.example documenta cada um.
const env =
  (typeof process !== "undefined" && process.env) ||
  (typeof window !== "undefined" && window.__ENV__) ||
  {};

const ADMIN_PW_FALLBACK = "analisebfsa";
const VIEWER_PW_FALLBACK = "analisebfsa";

const pick = (...keys) => {
  for (const k of keys) {
    const v = env[k];
    if (v !== undefined && v !== null && String(v).length > 0) return String(v);
  }
  return null;
};

// Contas fixas seedadas pelo app. Senhas resolvidas por env com fallbacks.
export const SEED_USERS = [
  {
    username: "caiofelipe",
    role: ROLES.ADMIN,
    displayName: "Caio Felipe",
    password:
      pick("REACT_APP_CAIOFELIPE_PASSWORD", "REACT_APP_ADMIN_PASSWORD") ||
      ADMIN_PW_FALLBACK,
  },
  {
    username: "adalbertobaptista",
    role: ROLES.VIEWER,
    displayName: "Adalberto Baptista",
    password:
      pick("REACT_APP_PRESIDENT_PASSWORD", "REACT_APP_VIEWER_DEFAULT_PASSWORD") ||
      VIEWER_PW_FALLBACK,
  },
  {
    username: "fillipesoutto",
    role: ROLES.VIEWER,
    displayName: "Fillipe Soutto",
    password:
      pick("REACT_APP_FILLIPE_PASSWORD", "REACT_APP_VIEWER_DEFAULT_PASSWORD") ||
      VIEWER_PW_FALLBACK,
  },
  {
    username: "andreleite",
    role: ROLES.VIEWER,
    displayName: "André Leite",
    password:
      pick("REACT_APP_ANDRE_PASSWORD", "REACT_APP_VIEWER_DEFAULT_PASSWORD") ||
      VIEWER_PW_FALLBACK,
  },
];

// Analistas legados / extras (mantém compatibilidade com AUTH_USERS anterior).
const LEGACY_ANALYSTS = [
  { username: "semirabrao", displayName: "Semir Abrão", password: "analisebfsa" },
  { username: "cassiocabral", displayName: "Cassio Cabral", password: "analisebfsa" },
];

// Índice username → { role, displayName, password }
export const USER_DIRECTORY = (() => {
  const dir = {};

  // 1) Seed fixo (admin + viewers)
  for (const u of SEED_USERS) {
    dir[u.username] = {
      username: u.username,
      role: u.role,
      displayName: u.displayName,
      password: u.password,
    };
  }

  // 2) Analistas legados — só registra se não houver conflito com o seed
  for (const u of LEGACY_ANALYSTS) {
    if (!dir[u.username]) {
      dir[u.username] = {
        username: u.username,
        role: ROLES.ANALYST,
        displayName: u.displayName,
        password: u.password,
      };
    }
  }

  // 3) Remove registros legados com e-mails equivalentes para não duplicar
  // (ex.: "caiofelipe@dominio.com" → collapsing para "caiofelipe")
  for (const key of Object.keys(dir)) {
    const at = key.indexOf("@");
    if (at > 0) {
      const base = normalizeLogin(key.slice(0, at));
      if (dir[base]) delete dir[key];
    }
  }

  return dir;
})();

// Senha padrão dos atletas. Exposta para a UI de Controle de Acesso poder
// orientar a comissão técnica sobre como entregar o acesso ao jogador.
export const ATHLETE_DEFAULT_PASSWORD =
  pick("REACT_APP_ATHLETE_DEFAULT_PASSWORD") || "atleta";

// Tabela de login compatível com o formato antigo: { username: password }
// Inclui atletas (senha padrão ATHLETE_DEFAULT_PASSWORD) para não quebrar o
// Portal do Atleta. Atletas entram primeiro para que, em caso de colisão de
// nome com um usuário do diretório (admin/viewer/analyst), o registro do
// diretório prevaleça e mantenha as permissões corretas.
export const AUTH_USERS = (() => {
  const t = {};
  for (const k of Object.keys(ATHLETE_LOGINS)) t[k] = ATHLETE_DEFAULT_PASSWORD;
  for (const u of Object.values(USER_DIRECTORY)) t[u.username] = u.password;
  return t;
})();

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────
export const ATHLETE_ROLE = "athlete";

export function getUserRole(username) {
  if (!username) return null;
  const key = normalizeLogin(String(username));
  if (USER_DIRECTORY[key]) return USER_DIRECTORY[key].role;
  if (ATHLETE_LOGINS[key]) return ATHLETE_ROLE;
  return null;
}

export function getUserRecord(username) {
  if (!username) return null;
  const key = normalizeLogin(String(username));
  return USER_DIRECTORY[key] || null;
}

export function getDisplayName(username) {
  if (!username) return "";
  const key = normalizeLogin(String(username));
  const rec = USER_DIRECTORY[key];
  if (rec && rec.displayName) return rec.displayName;
  const ath = ATLETAS.find((a) => normalizeLogin(a.nome) === key);
  if (ath) return ath.nome;
  return username;
}

export function hasPermission(username, action) {
  const role = getUserRole(username);
  if (!role) return false;
  if (role === ATHLETE_ROLE) return false; // atletas não têm permissões operacionais
  return !!(PERMISSIONS[role] && PERMISSIONS[role][action]);
}

export const isAdmin = (u) => getUserRole(u) === ROLES.ADMIN;
export const isViewer = (u) => getUserRole(u) === ROLES.VIEWER;
export const isAnalyst = (u) => getUserRole(u) === ROLES.ANALYST;

// Lista de usuários (não-atletas) para exibir na tela de Controle de Acesso.
export function listDirectoryUsers() {
  return Object.values(USER_DIRECTORY).map((u) => ({
    username: u.username,
    displayName: u.displayName,
    role: u.role,
  }));
}

// Lista de logins de atletas — gera um login (username + senha padrão) para
// CADA atleta cadastrado em ATLETAS. Usada na aba Controle de Acesso para
// auditar quem do elenco já tem login. A geração é idempotente: rodar várias
// vezes não cria duplicatas, e atletas adicionados ao roster aparecem
// automaticamente na próxima leitura.
export function listAthleteLogins() {
  return ATLETAS.map((a) => ({
    id: a.id,
    username: normalizeLogin(a.nome),
    displayName: a.nome,
    posicao: a.pos,
    numero: a.num,
    status: a.status,
    role: ATHLETE_ROLE,
    password: ATHLETE_DEFAULT_PASSWORD,
  }));
}

// Diagnóstico: retorna atletas cujo login NÃO foi materializado em AUTH_USERS.
// Em condições normais a lista é vazia (a geração é automática), mas o
// helper protege contra regressões silenciosas no fluxo de seed.
export function listAthletesWithoutLogin() {
  return ATLETAS.filter((a) => {
    const key = normalizeLogin(a.nome);
    return !AUTH_USERS[key];
  }).map((a) => ({ id: a.id, displayName: a.nome, expectedUsername: normalizeLogin(a.nome) }));
}

// Validação permissiva de username: aceita letras/números simples ou e-mail.
const USERNAME_RE = /^[a-z0-9][a-z0-9._-]{1,63}$/i;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export function isValidUsernameInput(raw) {
  if (!raw) return false;
  const s = String(raw).trim();
  if (!s) return false;
  return USERNAME_RE.test(s) || EMAIL_RE.test(s);
}
