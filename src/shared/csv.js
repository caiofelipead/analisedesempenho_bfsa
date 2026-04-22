import { ptNum, findCol, getAdv, getComp } from "./utils";

export const SHEETS_CSV_BASE = "https://docs.google.com/spreadsheets/d/e/2PACX-1vThRhCTfsLmX3ftpF-0m2UwZeDNBWjn5TxnDCBB3i5W82bh1dNW8m-sbORNTX5FBA/pub?output=csv";
export const SHEETS_API_URL = process.env.REACT_APP_SHEETS_API_URL || ""; // e.g. "https://api.example.com"
export const GID = { cadastro:2058075615, coletivo:1880381548, individual:2098013514, videos:789793586, calendario:429987536, serieB:437531422 };

export function parseCSV(text) {
  const clean = text.replace(/^\uFEFF/, "");
  const lines = clean.split("\n").filter(l => l.trim());
  if (lines.length < 2) return [];
  // Auto-detect delimiter
  const firstLine = lines[0];
  const sep = firstLine.includes("\t") ? "\t" : firstLine.split(";").length > firstLine.split(",").length ? ";" : ",";
  const splitLine = (line) => {
    const vals = [];
    let cur = "", inQ = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') { inQ = !inQ; continue; }
      if (ch === sep && !inQ) { vals.push(cur.trim().replace(/\r/g, "")); cur = ""; continue; }
      cur += ch;
    }
    vals.push(cur.trim().replace(/\r/g, ""));
    return vals;
  };
  // Find the real header row — skip title/metadata rows
  // Look for a row that has known column header keywords
  const headerKeywords = ["tipo","comp","data","rodada","link","atleta","nome","gols","nota","adversário","adversario","duração","plat"];
  let headerIdx = 0;
  for (let i = 0; i < Math.min(lines.length, 15); i++) {
    const vals = splitLine(lines[i]).map(v => v.replace(/^"|"$/g, "").trim().toLowerCase());
    const nonEmpty = vals.filter(v => v.length > 0).length;
    const hasKeyword = vals.some(v => headerKeywords.some(k => v.includes(k)));
    if (nonEmpty >= 3 && hasKeyword) { headerIdx = i; break; }
    // Fallback: if no keyword found, use first row with 5+ non-empty (more strict)
    if (nonEmpty >= 5 && headerIdx === 0) { headerIdx = i; }
  }
  // If still 0, use the original heuristic
  if (headerIdx === 0) {
    for (let i = 0; i < Math.min(lines.length, 10); i++) {
      const vals = splitLine(lines[i]).map(v => v.replace(/^"|"$/g, ""));
      const nonEmpty = vals.filter(v => v.length > 0).length;
      if (nonEmpty >= 3) { headerIdx = i; break; }
    }
  }
  const rawHeaders = splitLine(lines[headerIdx]).map(h => h.replace(/^"|"$/g, "").trim());
  // Fix merged headers: "Remates / à baliza" spans 2 cols (next is empty), split by " / " or "/ "
  const headers = [...rawHeaders];
  for (let i = 0; i < headers.length; i++) {
    const h = headers[i];
    if (!h) continue;
    // Check for slash-separated merged headers like "Remates / à baliza", "Passes / certos"
    const parts = h.split(/\s*\/\s*/);
    if (parts.length > 1) {
      // Count how many consecutive empty headers follow
      let emptyCount = 0;
      for (let j = i + 1; j < headers.length && !headers[j]; j++) emptyCount++;
      if (emptyCount >= parts.length - 1) {
        // Split: first part stays as-is, subsequent parts get prefixed to avoid duplicates
        // e.g. "Passes / certos" → "Passes", "Passes certos"
        // e.g. "curto/ médio / longo" → "curto", "médio", "longo" (but these get context from previous non-empty header)
        const prefix = parts[0];
        headers[i] = prefix;
        for (let p = 1; p < parts.length; p++) {
          headers[i + p] = `${prefix} ${parts[p]}`;
        }
      }
    }
  }
  // Ensure no empty headers — give them unique placeholder names
  for (let i = 0; i < headers.length; i++) {
    if (!headers[i]) headers[i] = `_col${i}`;
  }
  console.log("[BFSA parseCSV]", { sep, headerIdx, rawHeaders, headers, lineCount: lines.length });
  return lines.slice(headerIdx + 1).map(line => {
    const vals = splitLine(line);
    const obj = {};
    headers.forEach((h, i) => { obj[h] = vals[i] || ""; });
    return obj;
  });
}

export async function fetchSheet(gid) {
  // Try private API proxy first (backend with service account)
  if (SHEETS_API_URL) {
    try {
      const res = await fetch(`${SHEETS_API_URL}/api/sheets/${gid}`);
      if (res.ok) {
        const text = await res.text();
        const rows = parseCSV(text);
        if (rows.length > 0) return rows;
      }
      console.warn(`[BFSA] Backend proxy failed for gid=${gid}, falling back to public URL`);
    } catch (e) {
      console.warn(`[BFSA] Backend proxy unreachable, falling back to public URL:`, e.message);
    }
  }
  // Fallback: public CSV URL (requires spreadsheet to be published)
  const url = `${SHEETS_CSV_BASE}&gid=${gid}`;
  const res = await fetch(url, { redirect: "follow" });
  if (!res.ok) throw new Error(`Sheet ${gid}: ${res.status}`);
  const text = await res.text();
  if (text.trim().startsWith("<!") || text.trim().startsWith("<html")) {
    console.warn(`[BFSA] Sheet ${gid} returned HTML instead of CSV. Check if the spreadsheet is published or configure REACT_APP_SHEETS_API_URL.`);
    return [];
  }
  const rows = parseCSV(text);
  if (rows.length === 0) console.warn(`[BFSA] Sheet ${gid}: 0 rows parsed. First 200 chars:`, text.substring(0, 200));
  return rows;
}

export function mapColetivo(rows) {
  if (rows.length > 0) {
    console.log("[BFSA mapColetivo] headers:", Object.keys(rows[0]));
    console.log("[BFSA mapColetivo] sample row:", JSON.stringify(rows[0]).slice(0, 1200));
  }
  return rows.filter(r => getComp(r) && getAdv(r)).map((r, i) => {
    const placar = findCol(r,"Placar","placar","Score") || "";
    const local = findCol(r,"Local","local","Mando") || "";
    const isHome = local === "C" || local === "Casa" || local === "M";
    // Parse GM/GS from placar (format "X:Y" or "XxY") when dedicated columns missing
    const placarParts = placar.split(/[x:]/i).map(s => parseInt(s.trim(), 10));
    let gmRaw = ptNum(findCol(r,"GM","Golos","Gols Marcados","Gols Pro","Goals For","gm"));
    let gsRaw = ptNum(findCol(r,"GS","Gols Sofridos","Gols Contra","Goals Against","gs"));
    if (placarParts.length === 2 && !isNaN(placarParts[0]) && !isNaN(placarParts[1])) {
      if (gmRaw == null) gmRaw = isHome ? placarParts[0] : placarParts[1];
      if (gsRaw == null) gsRaw = isHome ? placarParts[1] : placarParts[0];
    }
    return {
      id: i + 1,
      data: findCol(r,"Data","data","Date") || "",
      adv: getAdv(r), comp: getComp(r),
      res: (findCol(r,"Res","res","Resultado","Result") || "").toUpperCase().trim(),
      pl: placar, mand: isHome,
      form: findCol(r,"Sistema","sistema","Formação","Formacao","Formation") || "",
      rod: parseInt((findCol(r,"Rodada","rodada","Round") || "").replace(/[^\d]/g, ""), 10) || i + 1,
      escudo: findCol(r,"escudo","Escudo") || "",
      posJogoDone: true, videosDone: true, adversarioDone: true,
      xg: ptNum(findCol(r,"xG","Expected Goals","s esper","esperados")),
      xgC: ptNum(findCol(r,"xGA","xG Against","xGC","xG Contra")),
      posse: ptNum(findCol(r,"Posse, %","Posse%","Posse","Posse de Bola","Possession","Posse %")),
      passes: ptNum(findCol(r,"Passes","passes","Total Passes")),
      passCrt: ptNum(findCol(r,"Passes certos","Pass Crt","Passes Certos","Passes Crt","Accurate Passes","certos")),
      passPct: ptNum(findCol(r,"Pass%","Passes%","Pass Pct","Passes %")),
      remates: ptNum(findCol(r,"Remates","remates","Shots","Finalizações","Finalizacoes","Chutes")),
      remAlvo: ptNum(findCol(r,"Remates à baliza","Remates a baliza","à baliza","a baliza","Rem Alvo","Remates Alvo","Shots on Target","Rem alvo","Chutes Alvo")),
      remPct: ptNum(findCol(r,"Rem%","Remates%","Shot%","Rem %")),
      cruz: ptNum(findCol(r,"Cruzamentos","cruzamentos","Crosses","Cruz")),
      cruzCrt: ptNum(findCol(r,"Cruz Crt","Cruzamentos Crt","Cruzamentos Certos","Accurate Crosses","Cruz crt")),
      cruzPct: ptNum(findCol(r,"Cruz%","Cruzamentos%","Cross%","Cruz %")),
      duelos: ptNum(findCol(r,"Duelos","duelos","Duels","Duelos Ganhos","Duels Won")),
      duelPct: ptNum(findCol(r,"Duelos%","Duels%","Duel%","Duelos %")),
      recup: ptNum(findCol(r,"Recup","Recuperações","Recuperacoes","Recoveries")),
      perdas: ptNum(findCol(r,"Perdas","perdas","Losses","Turnovers")),
      ppda: ptNum(findCol(r,"PPDA","ppda")),
      intercep: ptNum(findCol(r,"Intercep","Interceptações","Interceptacoes","Interceptions")),
      ataqPos: ptNum(findCol(r,"Ataq Pos","Ataques Posicionais","Positional Attacks","Ataq pos")),
      contraAtaq: ptNum(findCol(r,"Contra-Ataq","Contra Ataq","Counter Attacks","Contra-ataq","ContraAtaq")),
      bp: ptNum(findCol(r,"Bolas Paradas","bolas paradas","Set Pieces")),
      bpRem: ptNum(findCol(r,"BP Rem","BP Remates","BP rem")),
      toquesArea: ptNum(findCol(r,"Toques Área","Toques Area","Touches in Box","Toques area")),
      intensidade: ptNum(findCol(r,"Intensidade","intensidade","Intensity")),
      faltas: ptNum(findCol(r,"Faltas","faltas","Fouls","Faltas Cometidas")),
      cartAm: ptNum(findCol(r,"Cart Am","Cartões Amarelos","Cartoes Amarelos","Yellow Cards","Cart am")),
      cartVm: ptNum(findCol(r,"Cart Vm","Cartões Vermelhos","Cartoes Vermelhos","Red Cards","Cart vm")),
      gm: gmRaw,
      gs: gsRaw,
    };
  });
}

export function mapIndividual(rows) {
  if (rows.length > 0) {
    console.log("[BFSA mapIndividual] Sample row keys:", Object.keys(rows[0]), "Sample values:", JSON.stringify(rows[0]).slice(0, 500));
  }
  return rows.filter(r => (r.Atleta || r.atleta || findCol(r, "Atleta", "atleta", "Player", "Jogador") || "").trim()).map((r, i) => ({
    id: i + 1,
    atleta: r.Atleta || r.atleta || findCol(r, "Atleta", "atleta", "Player", "Jogador") || "",
    jogo: r.Jogo || r.jogo || findCol(r, "Jogo", "Adversário", "Adversario", "Match", "Opponent") || "",
    comp: r.Competition || r.Comp || r.comp || findCol(r, "Competição", "Competicao", "Competition", "Comp") || "",
    data: r.Date || r.Data || r.data || findCol(r, "Data", "Date") || "",
    pos: r["Posição"] || r.Posicao || r.posicao || r.Position || findCol(r, "Posição", "Posicao", "Position", "Pos") || "",
    min: ptNum(findCol(r, "Minutos", "Minutes", "Min", "Mins", "Minutos jogados", "Minutes played")),
    acoes: ptNum(findCol(r, "Ações totais/bem", "Ações totais", "Acoes totais", "Total actions", "Ações", "Acoes", "Acoes totais/bem sucedidas", "Successful actions", "Actions")),
    gols: ptNum(findCol(r, "Golos", "Gols", "Goals", "G", "Gol")),
    assist: ptNum(findCol(r, "Assistências", "Assistencias", "Assists", "A", "Assist")),
    remates: ptNum(findCol(r, "Remates/i", "Remates", "Shots", "Finalizações", "Finalizacoes", "Chutes")),
    remAlvo: ptNum(findCol(r, "Remates / a baliza", "Remates / à baliza", "Remates/a baliza", "Remates à baliza", "Remates a baliza", "Rem Alvo", "Shots on target")),
    xg: ptNum(findCol(r, "xG", "Expected goals")),
    passesCrt: ptNum(findCol(r, "Passes/cer", "Passes Certos", "Accurate passes", "Passes certos", "Passes precisos", "Passes bem sucedidos", "Passes/certos", "Passes cer")),
    passesLong: ptNum(findCol(r, "Passes long", "Passes Longos", "Long passes", "Passes longos", "Passes longos/precisos", "Long passes accurate")),
    cruz: ptNum(findCol(r, "Cruzamentos/certos", "Cruzamento/crt", "Cruzamentos certos", "Accurate crosses", "Cruz crt", "Cruz/crt")),
    cruzTotal: ptNum(findCol(r, "Cruzamento", "Cruzamentos", "Crosses", "Cruz")),
    dribles: ptNum(findCol(r, "Dribbles/com sucesso", "Dribles", "Dribbles", "Dribles com sucesso", "Dribles/com sucesso", "Successful dribbles")),
    duelos: ptNum(findCol(r, "Duelos/ganhos", "Duelos", "Duels", "Duelos ganhos", "Duels won")),
  }));
}

// ────────────────────────────────────────────────────────────
// Série B — aba "base" (headers completos conforme planilha)
// Mantém merge com o dataset estático: quando a célula vem vazia
// o consumidor faz fallback para o valor pré-existente.
// ────────────────────────────────────────────────────────────
export function mapSerieB(rows) {
  if (rows.length > 0) {
    console.log("[BFSA mapSerieB] headers:", Object.keys(rows[0]));
  }
  return rows
    .filter(r => (findCol(r, "Equipa", "equipa", "Team", "Equipe") || "").trim() && ptNum(findCol(r, "Pos", "pos", "Position")) != null)
    .map(r => ({
      pos:                  ptNum(findCol(r, "Pos")),
      nome:                 String(findCol(r, "Equipa", "equipa", "Team", "Equipe") || "").trim(),
      escudo:               String(findCol(r, "foto", "Foto", "escudo", "Escudo") || "").trim(),
      pontos:               ptNum(findCol(r, "Pontos")),
      xPoints:              ptNum(findCol(r, "xPoints")),
      idadeMedia:           ptNum(findCol(r, "Idade Média", "Idade Media")),
      posse:                ptNum(findCol(r, "Posse %", "Posse%", "Posse")),
      substituicoes:        ptNum(findCol(r, "Substituições", "Substituicoes")),
      golos:                ptNum(findCol(r, "Golos", "Gols")),
      xG:                   ptNum(findCol(r, "xG")),
      xGremate:             ptNum(findCol(r, "xG/remate", "xG por remate")),
      gs:                   ptNum(findCol(r, "GS")),
      xGA:                  ptNum(findCol(r, "xGA")),
      xGAremate:            ptNum(findCol(r, "xGA/remate", "xGA por remate")),
      remates:              ptNum(findCol(r, "Remates")),
      rematesP90:           ptNum(findCol(r, "Remates p90")),
      pctAlvo:              ptNum(findCol(r, "% Alvo", "%Alvo")),
      cabeca:               ptNum(findCol(r, "Cabeça", "Cabeca")),
      postes:               ptNum(findCol(r, "Postes")),
      foraArea:             ptNum(findCol(r, "Fora Área", "Fora Area")),
      aPartirJogo:          ptNum(findCol(r, "A Partir Jogo", "A partir de jogo")),
      cruzamentos:          ptNum(findCol(r, "Cruzamentos")),
      cruzP90:              ptNum(findCol(r, "Cruz p90")),
      pctAcertosCruz:       ptNum(findCol(r, "% Acertos")),
      flancoDir:            ptNum(findCol(r, "Flanco Dir")),
      flancoEsq:            ptNum(findCol(r, "Flanco Esq")),
      areaBaliza:           ptNum(findCol(r, "Área Baliza", "Area Baliza")),
      um1v1Dribles:         ptNum(findCol(r, "1v1 Driblbes", "1v1 Dribles", "1v1 Driblles")),
      um1v1P90:             ptNum(findCol(r, "1v1 p90")),
      pctExito1v1:          ptNum(findCol(r, "% Êxito 1v1", "% Exito 1v1")),
      toquesArea:           ptNum(findCol(r, "Toques Área", "Toques Area")),
      toquesAreaP90:        ptNum(findCol(r, "Toques Área p90", "Toques Area p90")),
      faltasSofr:           ptNum(findCol(r, "Faltas Sofr")),
      faltasSofrP90:        ptNum(findCol(r, "Faltas Sofr p90")),
      forasJogo:            ptNum(findCol(r, "Foras Jogo")),
      forasJogoP90:         ptNum(findCol(r, "Foras Jogo p90")),
      cantosP90:            ptNum(findCol(r, "Cantos p90")),
      cantosSofrP90:        ptNum(findCol(r, "Cantos Sofr p90")),
      remSofr:              ptNum(findCol(r, "Rem Sofr")),
      remSofrP90:           ptNum(findCol(r, "Rem Sofr p90")),
      remIntercet:          ptNum(findCol(r, "Rem Intercet")),
      remIntercetP90:       ptNum(findCol(r, "Rem Intercet p90")),
      pctRemIntercet:       ptNum(findCol(r, "% Rem Intercet")),
      pctRemIntercetSofr:   ptNum(findCol(r, "% Rem Intercet Sofr")),
      duelosDef:            ptNum(findCol(r, "Duelos Def")),
      duelosDefP90:         ptNum(findCol(r, "Duelos Def p90")),
      pctExitoDuelosDef:    ptNum(findCol(r, "% Êxito Duelos Def", "% Exito Duelos Def")),
      intersecoes:          ptNum(findCol(r, "Interseções", "Intersecoes")),
      intersecoesP90:       ptNum(findCol(r, "Interseções p90", "Intersecoes p90")),
      duelosAer:            ptNum(findCol(r, "Duelos Aer")),
      duelosAerP90:         ptNum(findCol(r, "Duelos Aer p90")),
      pctExitoDuelosAer:    ptNum(findCol(r, "% Êxito Duelos Aer", "% Exito Duelos Aer")),
      perdasBola:           ptNum(findCol(r, "Perdas Bola")),
      perdasBolaP90:        ptNum(findCol(r, "Perdas Bola p90")),
      intensDesafio:        ptNum(findCol(r, "Intens Desafio")),
      ppda:                 ptNum(findCol(r, "PPDA")),
      faltasCom:            ptNum(findCol(r, "Faltas Com")),
      faltasComP90:         ptNum(findCol(r, "Faltas Com p90")),
      gsCabeca:             ptNum(findCol(r, "GS Cabeça", "GS Cabeca")),
      gsPenalti:            ptNum(findCol(r, "GS Pênalti", "GS Penalti")),
      gsLivre:              ptNum(findCol(r, "GS Livre")),
      gsForaArea:           ptNum(findCol(r, "GS Fora Área", "GS Fora Area")),
      passes:               ptNum(findCol(r, "Passes")),
      passesP90:            ptNum(findCol(r, "Passes p90")),
      pctAcertosPasses:     ptNum(findCol(r, "% Acertos Passes")),
      passeProf:            ptNum(findCol(r, "Passe Prof")),
      passeProfP90:         ptNum(findCol(r, "Passe Prof p90")),
      pctAcertosPasseProf:  ptNum(findCol(r, "% Acertos Passe Prof")),
      passeDec:             ptNum(findCol(r, "Passe Dec")),
      passeDecP90:          ptNum(findCol(r, "Passe Dec p90")),
      passesLong:           ptNum(findCol(r, "Passes Long", "Passes Longos")),
      passesLongP90:        ptNum(findCol(r, "Passes Long p90", "Passes Longos p90")),
      pctAcertosPassesLong: ptNum(findCol(r, "% Acertos Passes Long", "% Acertos Passes Longos")),
      tercoFinal:           ptNum(findCol(r, "Terço Final", "Terco Final")),
      tercoFinalP90:        ptNum(findCol(r, "Terço Final p90", "Terco Final p90")),
      pctAcertosTercoFinal: ptNum(findCol(r, "% Acertos Terço Final", "% Acertos Terco Final")),
    }));
}

export function mapCalendario(rows) {
  return rows.filter(r => getComp(r) && getAdv(r)).map(r => ({
    comp: getComp(r), rodada: r.Rodada || r.rodada || "", data: r.Data || r.data || "", adv: getAdv(r), local: r.Local || r.local || "",
    escudo: r.escudo || r.Escudo || "",
    adv_ok: r.ADV === "\u2713", pre_ok: r.PRE === "\u2713", pos_ok: r.POS === "\u2713",
    dat_ok: r.DAT === "\u2713", wys_ok: r.WYS === "\u2713", tre_ok: r.TRE === "\u2713",
    bsp_ok: r.BSP === "\u2713", ind_ok: r.IND === "\u2713",
  }));
}

function getLink(r) { return findCol(r,"Link Vídeo","Link Video","Link vídeo","Link","URL") || ""; }
function getLinkAlt(r) { return findCol(r,"Link Alternativo","Link Alt") || ""; }

export function mapVideos(rows) {
  if(rows.length>0) console.log("[BFSA mapVideos] headers:", Object.keys(rows[0]), "sample row[0]:", rows[0]);
  const mapped = rows.filter(r => getLink(r).trim()).map((r, i) => {
    const desc = findCol(r,"Adversário/Descrição","Adversario/Descricao","Título","Titulo") || "";
    const comp = findCol(r,"Comp","comp","Competição","competição","Competicao") || "";
    const rodada = findCol(r,"Rodada","rodada") || "";
    const tipoRaw = (findCol(r,"Tipo","tipo") || "").toLowerCase().trim();
    const tipoNorm = tipoRaw.normalize("NFD").replace(/[\u0300-\u036f]/g,"");
    const tipo = tipoNorm.includes("jogo completo") ? "jogo_completo"
      : tipoNorm.includes("relat") ? "analise_adversario"
      : tipoNorm.includes("prelec") ? "prelecao"
      : (tipoNorm.includes("adv") || tipoNorm.includes("analise de adv")) ? "analise_adversario"
      : (tipoNorm.includes("bola") || tipoNorm.includes("parada")) && tipoNorm.includes("goleiro") ? "bola_parada_goleiro"
      : tipoNorm.includes("bola") || tipoNorm.includes("parada") ? "bola_parada"
      : tipoNorm.includes("modelo") ? "modelo_jogo"
      : tipoNorm.includes("treino") ? "treino"
      : tipoNorm.includes("col") ? "coletivo"
      : tipoNorm.includes("descritivo") ? "descritivo_individual"
      : (tipoNorm.includes("compilado") || tipoNorm.includes("recorte") || tipoNorm.includes("clip")) ? "clip_individual"
      : tipoNorm.includes("ind") ? "clip_individual"
      : tipoNorm.includes("material") || tipoNorm.includes("orientador") ? "material_orientador"
      : tipoNorm.includes("pos jogo") || tipoNorm.includes("pos-jogo") ? "pos_jogo"
      : tipoRaw || "clip_individual";
    const dataStr = findCol(r,"Data","data") || "";
    let titulo = desc || [comp, rodada].filter(Boolean).join(" - ") || `Vídeo ${i + 1}`;
    if (tipo === "treino" && dataStr) titulo = `${titulo} — ${dataStr}`;
    const linkUrl = getLink(r);
    return {
      id: i + 1, titulo, tipo,
      plat: findCol(r,"Plataforma","Plat") || (()=>{const l=linkUrl.toLowerCase();return l.includes("youtu")?"youtube":l.includes("vimeo")?"vimeo":l.includes("wyscout")?"wyscout":"google_drive"})(),
      atleta: findCol(r,"Atleta","atleta") || "",
      partida: desc,
      dur: findCol(r,"Duração","Dur","duracao") || "",
      data: dataStr,
      comp, rodada,
      link: linkUrl,
      linkAlt: getLinkAlt(r),
      responsavel: findCol(r,"Responsável","Responsavel") || "",
    };
  });
  console.log("[BFSA mapVideos] total rows:", rows.length, "with link:", mapped.length, "types:", mapped.reduce((a,v)=>{a[v.tipo]=(a[v.tipo]||0)+1;return a},{}));
  return mapped;
}
