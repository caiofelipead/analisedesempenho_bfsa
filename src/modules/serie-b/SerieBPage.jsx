import { useState, useMemo } from "react";
import { C, fontD, font } from "../../shared/design";
import { Card, SH, StatCard, Escudo, CompLogo } from "../../shared/atoms";
import { Trophy, Target, Shield, Activity } from "lucide-react";
import { SERIE_B_TEAMS, SERIE_B_METRICS, computeSerieBAverages, formatMetric, mergeSerieBRows } from "./data";
import ScatterExplorer from "./ScatterExplorer";
import AuxiliaryCharts from "./AuxiliaryCharts";

const SORT_ARROW = (dir) => dir === "asc" ? "▲" : "▼";

export default function SerieBPage({ liveRows }) {
  const teams = useMemo(
    () => (Array.isArray(liveRows) && liveRows.length > 0 ? mergeSerieBRows(liveRows) : SERIE_B_TEAMS),
    [liveRows]
  );
  const avg = useMemo(() => computeSerieBAverages(teams), [teams]);
  const [sortKey, setSortKey] = useState("pos");
  const [sortDir, setSortDir] = useState("asc");

  const sorted = useMemo(() => {
    const arr = [...teams];
    arr.sort((a, b) => {
      const va = a[sortKey]; const vb = b[sortKey];
      if (va === vb) return 0;
      return sortDir === "asc" ? (va > vb ? 1 : -1) : (va < vb ? 1 : -1);
    });
    return arr;
  }, [teams, sortKey, sortDir]);

  const toggleSort = (key) => {
    if (sortKey === key) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir(key === "pos" ? "asc" : "desc"); }
  };

  const leader = [...teams].sort((a,b) => b.pontos - a.pontos)[0];
  const bestXg = [...teams].sort((a,b) => a.xGA - b.xGA)[0];
  const bestShots = [...teams].sort((a,b) => b.remates - a.remates)[0];

  return <div>
    {/* TOP KPIs */}
    <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:16}}>
      <StatCard label="Líder" value={leader.nome} sub={`${leader.pontos} pts · xPts ${formatMetric(leader.xPoints,"dec2")}`} icon={Trophy}/>
      <StatCard label="Melhor Defesa (xGA)" value={formatMetric(bestXg.xGA,"dec2")} sub={bestXg.nome} icon={Shield} accent={C.green}/>
      <StatCard label="Mais Remates" value={bestShots.remates} sub={`${bestShots.nome} · ${formatMetric(bestShots.rematesP90,"dec2")}/p90`} icon={Target} accent={C.blue}/>
      <StatCard label="Posse Média" value={formatMetric(avg.posse,"dec2") + "%"} sub={`Liga · ${teams.length} clubes`} icon={Activity} accent={C.yellow}/>
    </div>

    {/* SCATTER EXPLORER */}
    <div style={{marginBottom:16}}>
      <ScatterExplorer teams={teams}/>
    </div>

    {/* AUXILIARY CHARTS — Pts vs xPts + ranking por métrica */}
    <AuxiliaryCharts teams={teams}/>

    {/* CLASSIFICATION TABLE */}
    <Card>
      <SH title="Classificação — Série B 2026" count={teams.length} action={null}/>
      <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:10}}>
        <CompLogo comp="Série B" size={18}/>
        <span style={{fontFamily:font,fontSize:10,color:C.textDim,textTransform:"uppercase",letterSpacing:"0.08em",fontWeight:600}}>Brasileirão Série B · Rodada atual</span>
      </div>
      <div style={{overflowX:"auto"}}>
        <table style={{width:"100%",borderCollapse:"collapse",fontFamily:font,fontSize:11,minWidth:900}}>
          <thead>
            <tr style={{borderBottom:`1px solid ${C.border}`}}>
              <Th label="Pos" k="pos" sortKey={sortKey} sortDir={sortDir} onClick={toggleSort}/>
              <Th label="Equipa" k="nome" sortKey={sortKey} sortDir={sortDir} onClick={toggleSort} align="left"/>
              {SERIE_B_METRICS.map(m => (
                <Th key={m.key} label={m.label} k={m.key} sortKey={sortKey} sortDir={sortDir} onClick={toggleSort}/>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map(t => (
              <tr key={t.nome} style={{borderBottom:`1px solid ${C.border}`,transition:"background 0.15s"}} onMouseEnter={e=>e.currentTarget.style.background=C.bgCardHover} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                <td style={tdStyle({center:true,fontWeight:700})}>{t.pos}</td>
                <td style={tdStyle({align:"left"})}>
                  <div style={{display:"flex",alignItems:"center",gap:8}}>
                    <div style={{width:22,height:22,display:"flex",alignItems:"center",justifyContent:"center"}}>
                      <Escudo src={t.escudo} size={20}/>
                    </div>
                    <span style={{fontWeight:600,color:C.text}}>{t.nome}</span>
                  </div>
                </td>
                {SERIE_B_METRICS.map(m => (
                  <td key={m.key} style={tdStyle({center:true,color: cellColor(t[m.key], avg[m.key], m.key)})}>
                    {formatMetric(t[m.key], m.fmt)}
                  </td>
                ))}
              </tr>
            ))}
            <tr style={{background:C.goldDim,borderTop:`2px solid ${C.gold}44`}}>
              <td style={tdStyle({center:true,fontWeight:700,color:C.gold})}>—</td>
              <td style={tdStyle({align:"left",fontWeight:700,color:C.gold})}>MÉDIA LIGA</td>
              {SERIE_B_METRICS.map(m => (
                <td key={m.key} style={tdStyle({center:true,fontWeight:700,color:C.gold})}>
                  {formatMetric(avg[m.key], m.fmt)}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
      <div style={{fontFamily:font,fontSize:9,color:C.textDim,marginTop:10,lineHeight:1.5}}>
        Clique nos cabeçalhos para ordenar. Cores: <span style={{color:C.green}}>verde</span> = acima da média liga em métrica ofensiva (ou abaixo em métrica defensiva), <span style={{color:C.red}}>vermelho</span> = oposto.
      </div>
    </Card>
  </div>;
}

// Header cell
function Th({label, k, sortKey, sortDir, onClick, align="center"}) {
  const active = sortKey === k;
  return (
    <th onClick={()=>onClick(k)} style={{
      padding:"8px 6px",
      textAlign:align,
      fontFamily:font,
      fontSize:9,
      color:active?C.gold:C.textDim,
      textTransform:"uppercase",
      letterSpacing:"0.06em",
      fontWeight:700,
      cursor:"pointer",
      userSelect:"none",
      whiteSpace:"nowrap",
      background:active?C.goldDim:"transparent",
      borderBottom:active?`2px solid ${C.gold}`:"none",
    }}>
      {label}{active?` ${SORT_ARROW(sortDir)}`:""}
    </th>
  );
}

function tdStyle({align="center",center=false,fontWeight=500,color}={}) {
  return {
    padding:"7px 6px",
    textAlign: center ? "center" : align,
    fontFamily:font,
    fontSize:11,
    color: color || C.text,
    fontWeight,
    whiteSpace:"nowrap",
  };
}

// Green = better than league avg (offensive↑ / defensive↓); Red = worse.
const DEFENSIVE_KEYS = new Set(["gs","xGA","xGAremate"]);
function cellColor(v, avg, key) {
  if (!Number.isFinite(v) || !Number.isFinite(avg)) return undefined;
  const diff = v - avg;
  const defensive = DEFENSIVE_KEYS.has(key);
  const better = defensive ? diff < 0 : diff > 0;
  if (Math.abs(diff) / (Math.abs(avg) || 1) < 0.05) return undefined;
  return better ? C.green : C.red;
}
