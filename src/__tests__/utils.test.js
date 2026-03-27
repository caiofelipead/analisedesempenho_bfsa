import { ptNum, colNorm, findCol, parseDateBR, norm, normalizeLogin } from "../shared/utils";

describe("ptNum", () => {
  it("parses integer strings", () => {
    expect(ptNum("42")).toBe(42);
  });
  it("parses decimal with comma", () => {
    expect(ptNum("3,14")).toBeCloseTo(3.14);
  });
  it("parses decimal with dot", () => {
    expect(ptNum("2.71")).toBeCloseTo(2.71);
  });
  it("returns null for empty string", () => {
    expect(ptNum("")).toBeNull();
  });
  it("returns null for null/undefined", () => {
    expect(ptNum(null)).toBeNull();
    expect(ptNum(undefined)).toBeNull();
  });
  it("returns null for non-numeric string", () => {
    expect(ptNum("abc")).toBeNull();
  });
});

describe("colNorm", () => {
  it("normalizes accented characters", () => {
    expect(colNorm("Posição")).toBe("posicao");
  });
  it("lowercases and removes non-alphanumeric", () => {
    expect(colNorm("Passes Certos %")).toBe("passescertos");
  });
  it("handles empty/null", () => {
    expect(colNorm("")).toBe("");
    expect(colNorm(null)).toBe("");
  });
});

describe("findCol", () => {
  const row = { "Atleta": "João", "Posição": "Meia", "Gols": "3" };

  it("finds exact match", () => {
    expect(findCol(row, "Atleta")).toBe("João");
  });
  it("tries multiple candidates", () => {
    expect(findCol(row, "Player", "Jogador", "Atleta")).toBe("João");
  });
  it("finds normalized match (accent insensitive)", () => {
    expect(findCol(row, "Posicao")).toBe("Meia");
  });
  it("returns undefined when no match", () => {
    expect(findCol(row, "Nonexistent")).toBeUndefined();
  });
});

describe("parseDateBR", () => {
  it("parses DD/MM/YYYY format", () => {
    const d = parseDateBR("25/12/2025");
    expect(d.getDate()).toBe(25);
    expect(d.getMonth()).toBe(11);
    expect(d.getFullYear()).toBe(2025);
  });
  it("returns null for empty string", () => {
    expect(parseDateBR("")).toBeNull();
  });
});

describe("norm", () => {
  it("normalizes and lowercases", () => {
    expect(norm("José Félix")).toBe("jose felix");
  });
});

describe("normalizeLogin", () => {
  it("creates login key from name", () => {
    expect(normalizeLogin("Caio Felipe")).toBe("caiofelipe");
  });
  it("removes accents", () => {
    expect(normalizeLogin("Éricson")).toBe("ericson");
  });
});
