import { useEffect, useMemo, useState } from "react";
import {
  ShieldAlert, ShieldCheck, Lock, Eye, CheckCircle, XCircle,
  RefreshCw, Filter, UserCircle, Clock, Monitor,
} from "lucide-react";
import { C, font, fontD } from "../../shared/design";
import { Card, SH, Badge } from "../../shared/atoms";
import {
  ROLES, ROLE_LABELS, ROLE_DESCRIPTIONS, PERMISSIONS, PERMISSION_ACTIONS,
  listDirectoryUsers, isAdmin, getUserRole,
} from "../../shared/auth";
import {
  EVENT_LABELS, EVENT_COLORS, EVENT_TYPES, listAccessLogs, parseUserAgent,
} from "../../shared/access";

function fmtDateTime(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d)) return "—";
  return d.toLocaleString("pt-BR", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit", second: "2-digit",
  });
}

function RoleCard({ role, icon: I, accent }) {
  return (
    <div style={{
      background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 10,
      padding: 16, boxShadow: C.shadow, display: "flex", flexDirection: "column", gap: 8,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{
          width: 36, height: 36, borderRadius: 8, background: `${accent}15`,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <I size={18} color={accent} />
        </div>
        <div>
          <div style={{ fontFamily: fontD, fontSize: 13, fontWeight: 700, color: C.text, textTransform: "uppercase", letterSpacing: "0.08em" }}>
            {ROLE_LABELS[role]}
          </div>
          <div style={{ fontFamily: font, fontSize: 10, color: accent, textTransform: "uppercase", letterSpacing: "0.1em" }}>
            {role}
          </div>
        </div>
      </div>
      <div style={{ fontFamily: font, fontSize: 11, color: C.textMid, lineHeight: 1.5 }}>
        {ROLE_DESCRIPTIONS[role]}
      </div>
    </div>
  );
}

function PermissionMatrix() {
  const roles = [ROLES.ADMIN, ROLES.VIEWER, ROLES.ANALYST];
  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: font, fontSize: 11 }}>
        <thead>
          <tr style={{ textAlign: "left", color: C.textDim, textTransform: "uppercase", letterSpacing: "0.08em", fontSize: 10 }}>
            <th style={{ padding: "8px 10px", borderBottom: `1px solid ${C.border}` }}>Ação</th>
            {roles.map((r) => (
              <th key={r} style={{ padding: "8px 10px", borderBottom: `1px solid ${C.border}`, textAlign: "center" }}>
                {ROLE_LABELS[r]}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {PERMISSION_ACTIONS.map((a) => (
            <tr key={a.key}>
              <td style={{ padding: "8px 10px", color: C.text, borderBottom: `1px solid ${C.border}` }}>{a.label}</td>
              {roles.map((r) => {
                const ok = !!(PERMISSIONS[r] && PERMISSIONS[r][a.key]);
                return (
                  <td key={r} style={{ padding: "8px 10px", textAlign: "center", borderBottom: `1px solid ${C.border}` }}>
                    {ok
                      ? <CheckCircle size={14} color={C.green} style={{ verticalAlign: "middle" }} />
                      : <XCircle size={14} color={C.textDim} style={{ verticalAlign: "middle" }} />}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function RoleBadge({ role }) {
  const map = {
    [ROLES.ADMIN]: C.red,
    [ROLES.VIEWER]: C.blue,
    [ROLES.ANALYST]: C.gold,
  };
  return <Badge color={map[role] || C.textDim}>{ROLE_LABELS[role] || role}</Badge>;
}

function UsersTable() {
  const users = listDirectoryUsers().sort((a, b) => a.username.localeCompare(b.username));
  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: font, fontSize: 11 }}>
        <thead>
          <tr style={{ textAlign: "left", color: C.textDim, textTransform: "uppercase", letterSpacing: "0.08em", fontSize: 10 }}>
            <th style={{ padding: "8px 10px", borderBottom: `1px solid ${C.border}` }}>Usuário</th>
            <th style={{ padding: "8px 10px", borderBottom: `1px solid ${C.border}` }}>Nome</th>
            <th style={{ padding: "8px 10px", borderBottom: `1px solid ${C.border}` }}>Perfil</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.username}>
              <td style={{ padding: "8px 10px", color: C.text, borderBottom: `1px solid ${C.border}`, fontFamily: "ui-monospace,monospace" }}>
                {u.username}
              </td>
              <td style={{ padding: "8px 10px", color: C.textMid, borderBottom: `1px solid ${C.border}` }}>
                {u.displayName}
              </td>
              <td style={{ padding: "8px 10px", borderBottom: `1px solid ${C.border}` }}>
                <RoleBadge role={u.role} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function EventBadge({ type }) {
  const c = EVENT_COLORS[type] || "textDim";
  const color = C[c] || C.textDim;
  return <Badge color={color}>{EVENT_LABELS[type] || type}</Badge>;
}

function AuditLog({ currentUser }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filterUser, setFilterUser] = useState("");
  const [filterEvent, setFilterEvent] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const data = await listAccessLogs({
        limit: 200,
        email: filterUser.trim() || null,
        event_type: filterEvent || null,
      });
      setLogs(Array.isArray(data) ? data : []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, []);

  const inputStyle = {
    padding: "6px 8px", background: C.bgInput, border: `1px solid ${C.border}`,
    borderRadius: 4, color: C.text, fontFamily: font, fontSize: 11, outline: "none",
  };

  return (
    <Card style={{ marginTop: 16 }}>
      <SH title="Registro de Acessos" count={logs.length} />
      <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", marginBottom: 12 }}>
        <Filter size={14} color={C.textDim} />
        <input
          value={filterUser}
          onChange={(e) => setFilterUser(e.target.value)}
          placeholder="Filtrar por usuário"
          style={{ ...inputStyle, minWidth: 180 }}
        />
        <select value={filterEvent} onChange={(e) => setFilterEvent(e.target.value)} style={inputStyle}>
          <option value="">Todos os eventos</option>
          {Object.values(EVENT_TYPES).map((t) => (
            <option key={t} value={t}>{EVENT_LABELS[t]}</option>
          ))}
        </select>
        <button
          onClick={load}
          disabled={loading}
          style={{
            padding: "6px 10px", background: C.goldDim, border: `1px solid ${C.border}`,
            borderRadius: 4, color: C.gold, fontFamily: font, fontSize: 10, fontWeight: 700,
            textTransform: "uppercase", letterSpacing: "0.08em",
            display: "inline-flex", alignItems: "center", gap: 6,
            cursor: loading ? "wait" : "pointer",
          }}
        >
          <RefreshCw size={12} style={{ animation: loading ? "spin 1s linear infinite" : "none" }} />
          Atualizar
        </button>
        <span style={{ fontFamily: font, fontSize: 10, color: C.textDim, marginLeft: "auto" }}>
          Sessão atual: <strong style={{ color: C.text }}>{currentUser || "—"}</strong>
        </span>
      </div>

      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: font, fontSize: 11 }}>
          <thead>
            <tr style={{ textAlign: "left", color: C.textDim, textTransform: "uppercase", letterSpacing: "0.08em", fontSize: 10 }}>
              <th style={{ padding: "8px 10px", borderBottom: `1px solid ${C.border}` }}><Clock size={11} style={{ verticalAlign: "middle", marginRight: 4 }} />Data/hora</th>
              <th style={{ padding: "8px 10px", borderBottom: `1px solid ${C.border}` }}><UserCircle size={11} style={{ verticalAlign: "middle", marginRight: 4 }} />Usuário</th>
              <th style={{ padding: "8px 10px", borderBottom: `1px solid ${C.border}` }}>Evento</th>
              <th style={{ padding: "8px 10px", borderBottom: `1px solid ${C.border}` }}>Detalhe</th>
              <th style={{ padding: "8px 10px", borderBottom: `1px solid ${C.border}` }}>IP</th>
              <th style={{ padding: "8px 10px", borderBottom: `1px solid ${C.border}` }}><Monitor size={11} style={{ verticalAlign: "middle", marginRight: 4 }} />Dispositivo</th>
            </tr>
          </thead>
          <tbody>
            {logs.length === 0 && (
              <tr>
                <td colSpan={6} style={{ padding: 18, textAlign: "center", color: C.textDim, fontStyle: "italic" }}>
                  Nenhum registro encontrado.
                </td>
              </tr>
            )}
            {logs.map((r) => {
              const ua = parseUserAgent(r.user_agent);
              return (
                <tr key={r.id || `${r.email}-${r.created_at}`}>
                  <td style={{ padding: "8px 10px", color: C.textMid, borderBottom: `1px solid ${C.border}`, whiteSpace: "nowrap" }}>
                    {fmtDateTime(r.created_at)}
                  </td>
                  <td style={{ padding: "8px 10px", color: C.text, borderBottom: `1px solid ${C.border}`, fontFamily: "ui-monospace,monospace" }}>
                    {r.email || "—"}
                  </td>
                  <td style={{ padding: "8px 10px", borderBottom: `1px solid ${C.border}` }}>
                    <EventBadge type={r.event_type} />
                  </td>
                  <td style={{ padding: "8px 10px", color: C.textMid, borderBottom: `1px solid ${C.border}` }}>
                    {r.detail || r.path || "—"}
                  </td>
                  <td style={{ padding: "8px 10px", color: C.textDim, borderBottom: `1px solid ${C.border}`, fontFamily: "ui-monospace,monospace" }}>
                    {r.ip || "—"}
                  </td>
                  <td style={{ padding: "8px 10px", color: C.textMid, borderBottom: `1px solid ${C.border}` }}>
                    {ua.browser} · {ua.os}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

export default function ControleAcessoPage({ authedUser }) {
  const admin = isAdmin(authedUser);
  const myRole = getUserRole(authedUser);

  return (
    <div>
      {/* Banner */}
      <Card style={{
        marginBottom: 16,
        backgroundImage: `linear-gradient(135deg, ${C.redDim} 0%, transparent 60%)`,
        border: `1px solid ${C.red}33`,
      }}>
        <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
          <ShieldAlert size={22} color={C.red} style={{ flexShrink: 0, marginTop: 2 }} />
          <div>
            <div style={{
              fontFamily: fontD, fontSize: 15, fontWeight: 700, color: C.text,
              textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4,
            }}>
              Conteúdo Confidencial
            </div>
            <div style={{ fontFamily: font, fontSize: 11, color: C.textMid, lineHeight: 1.6 }}>
              Este sistema e todas as suas informações (relatórios, vídeos, dados de atletas, análises
              e indicações) são de uso exclusivo do Departamento de Análise de Desempenho do BFSA.
              É proibida qualquer reprodução, compartilhamento externo ou uso fora do contexto
              profissional autorizado. Todos os acessos e navegações são registrados.
            </div>
            {myRole && (
              <div style={{ marginTop: 8, fontFamily: font, fontSize: 11, color: C.textDim }}>
                Seu perfil atual: <RoleBadge role={myRole} />
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Perfis */}
      <SH title="Perfis de Acesso" />
      <div style={{
        display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
        gap: 12, marginBottom: 16,
      }}>
        <RoleCard role={ROLES.ADMIN} icon={ShieldCheck} accent={C.red} />
        <RoleCard role={ROLES.VIEWER} icon={Eye} accent={C.blue} />
        <RoleCard role={ROLES.ANALYST} icon={Lock} accent={C.gold} />
      </div>

      {/* Matriz */}
      <Card style={{ marginBottom: 16 }}>
        <SH title="Matriz de Permissões" />
        <PermissionMatrix />
      </Card>

      {/* Lista de usuários (admin) */}
      {admin && (
        <Card style={{ marginBottom: 16 }}>
          <SH title="Usuários Cadastrados" count={listDirectoryUsers().length} />
          <UsersTable />
        </Card>
      )}

      {/* Auditoria (admin) */}
      {admin ? (
        <AuditLog currentUser={authedUser} />
      ) : (
        <Card style={{ marginTop: 16 }}>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <Lock size={16} color={C.textDim} />
            <div style={{ fontFamily: font, fontSize: 11, color: C.textDim }}>
              O registro de acessos é restrito a administradores.
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
