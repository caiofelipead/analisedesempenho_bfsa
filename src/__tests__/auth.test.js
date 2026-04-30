import {
  ROLES, AUTH_USERS, USER_DIRECTORY, SEED_USERS, ATHLETE_DEFAULT_PASSWORD,
  getUserRole, getDisplayName, hasPermission, isAdmin, isViewer,
  listDirectoryUsers, listAthleteLogins, listAthletesWithoutLogin,
  isValidUsernameInput,
} from "../shared/auth";
import { ATLETAS, normalizeLogin } from "../shared/constants";

describe("auth seed directory", () => {
  it("seeds caiofelipe as admin", () => {
    expect(USER_DIRECTORY.caiofelipe).toBeDefined();
    expect(USER_DIRECTORY.caiofelipe.role).toBe(ROLES.ADMIN);
    expect(getUserRole("caiofelipe")).toBe(ROLES.ADMIN);
    expect(isAdmin("caiofelipe")).toBe(true);
  });

  it("seeds viewers with read-only role", () => {
    for (const u of ["adalbertobaptista", "fillipesoutto", "andreleite"]) {
      expect(USER_DIRECTORY[u]).toBeDefined();
      expect(USER_DIRECTORY[u].role).toBe(ROLES.VIEWER);
      expect(isViewer(u)).toBe(true);
    }
  });

  it("exposes AUTH_USERS with passwords for all seeded users", () => {
    for (const u of SEED_USERS) {
      expect(AUTH_USERS[u.username]).toBeDefined();
      expect(typeof AUTH_USERS[u.username]).toBe("string");
      expect(AUTH_USERS[u.username].length).toBeGreaterThan(0);
    }
  });

  it("falls back to analisebfsa when no env password is set", () => {
    // In jest, no REACT_APP_* envs are set → expect fallback.
    expect(AUTH_USERS.caiofelipe).toBe("analisebfsa");
    expect(AUTH_USERS.adalbertobaptista).toBe("analisebfsa");
  });

  it("collapses legacy email-style keys (no caiofelipe@… duplicated)", () => {
    const emailish = Object.keys(USER_DIRECTORY).filter((k) => k.includes("@"));
    expect(emailish).toHaveLength(0);
  });
});

describe("auth helpers", () => {
  it("returns display names from directory", () => {
    expect(getDisplayName("caiofelipe")).toBe("Caio Felipe");
    expect(getDisplayName("adalbertobaptista")).toBe("Adalberto Baptista");
  });

  it("hasPermission respects role", () => {
    expect(hasPermission("caiofelipe", "manage_users")).toBe(true);
    expect(hasPermission("caiofelipe", "view_audit")).toBe(true);
    expect(hasPermission("adalbertobaptista", "manage_users")).toBe(false);
    expect(hasPermission("adalbertobaptista", "view_all")).toBe(true);
    expect(hasPermission("adalbertobaptista", "edit_content")).toBe(false);
  });

  it("lists directory users excluding athletes", () => {
    const users = listDirectoryUsers();
    const usernames = users.map((u) => u.username);
    expect(usernames).toEqual(expect.arrayContaining(["caiofelipe", "adalbertobaptista", "fillipesoutto", "andreleite"]));
    // Atletas não devem vazar para a lista de diretório
    for (const u of users) {
      expect([ROLES.ADMIN, ROLES.VIEWER, ROLES.ANALYST]).toContain(u.role);
    }
  });
});

describe("athlete logins", () => {
  it("creates a login for every athlete in ATLETAS", () => {
    const missing = listAthletesWithoutLogin();
    expect(missing).toEqual([]);
  });

  it("returns one login record per athlete with default password", () => {
    const logins = listAthleteLogins();
    expect(logins).toHaveLength(ATLETAS.length);
    for (const a of ATLETAS) {
      const expected = normalizeLogin(a.nome);
      const rec = logins.find((l) => l.username === expected);
      expect(rec).toBeDefined();
      expect(rec.password).toBe(ATHLETE_DEFAULT_PASSWORD);
      expect(rec.role).toBe("athlete");
    }
  });

  it("materializes athlete credentials in AUTH_USERS", () => {
    for (const a of ATLETAS) {
      const key = normalizeLogin(a.nome);
      expect(AUTH_USERS[key]).toBe(ATHLETE_DEFAULT_PASSWORD);
    }
  });

  it("preserves directory passwords on collision (directory wins)", () => {
    // Sanity: nenhum atleta deve sobrescrever o admin/viewers do diretório.
    expect(AUTH_USERS.caiofelipe).toBe("analisebfsa");
    expect(AUTH_USERS.adalbertobaptista).toBe("analisebfsa");
  });
});

describe("isValidUsernameInput", () => {
  it("accepts simple usernames like caiofelipe", () => {
    expect(isValidUsernameInput("caiofelipe")).toBe(true);
    expect(isValidUsernameInput("adalbertobaptista")).toBe(true);
  });

  it("accepts emails too", () => {
    expect(isValidUsernameInput("foo@bar.com")).toBe(true);
  });

  it("rejects empty/whitespace", () => {
    expect(isValidUsernameInput("")).toBe(false);
    expect(isValidUsernameInput("   ")).toBe(false);
    expect(isValidUsernameInput(null)).toBe(false);
  });
});
