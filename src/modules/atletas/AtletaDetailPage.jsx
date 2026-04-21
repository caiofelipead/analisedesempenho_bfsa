import { useState } from "react";
import { C, fontD, font } from "../../shared/design";
import { ATLETAS, POS_METRICS } from "../../shared/constants";
import { norm } from "../../shared/utils";
import { SH, Card, Badge, ResBadge, Escudo, PlatBadge, Sparkline, RadarChart } from "../../shared/atoms";
import VideosPage from "../videos/VideosPage";
import {
  ArrowLeft, Play, BarChart3, Film, Activity,
} from "lucide-react";

export default function AtletaDetailPage({id, onBack, videos=[], partidas=[], individual=[], calendario=[], athleteMode=false}) {
  const [tab, setTab] = useState(athleteMode ? "videos" : "dados");
  const a=ATLETAS.find(x=>x.id===id)||ATLETAS[0];
  const aN = norm(a.nome);
  const aVideos=videos.filter(v=>{ if(v.tipo!=="clip_individual") return false; const vN=norm(v.atleta); return vN===aN || vN.includes(aN) || aN.includes(vN); });

  // Filter individual stats for this athlete
  const aInd = individual.filter(r => {
    const rN = norm(r.atleta);
    return rN === aN || rN.includes(aN) || aN.includes(rN);
  }).sort((a, b) => (a.data || "").localeCompare(b.data || ""));

  // Aggregate stats
  const totalJogos = aInd.length;
  const totalMin = aInd.reduce((s, r) => s + (r.min || 0), 0);
  const totalGols = aInd.reduce((s, r) => s + (r.gols || 0), 0);
  const totalAssist = aInd.reduce((s, r) => s + (r.assist || 0), 0);
  const totalXg = aInd.reduce((s, r) => s + (r.xg || 0), 0);
  const avgAcoes = totalJogos > 0 ? (aInd.reduce((s, r) => s + (r.acoes || 0), 0) / totalJogos) : 0;
  const avgDuelos = totalJogos > 0 ? (aInd.reduce((s, r) => s + (r.duelos || 0), 0) / totalJogos) : 0;
  const avgPassesCrt = totalJogos > 0 ? (aInd.reduce((s, r) => s + (r.passesCrt || 0), 0) / totalJogos) : 0;
  const avgDribles = totalJogos > 0 ? (aInd.reduce((s, r) => s + (r.dribles || 0), 0) / totalJogos) : 0;
  const avgCruz = totalJogos > 0 ? (aInd.reduce((s, r) => s + (r.cruz || 0), 0) / totalJogos) : 0;

  // Position-specific metrics
  const posM = POS_METRICS[a.pos] || POS_METRICS["Volante"];
  const posKeys = posM.keys;

  // Compute aggregated values for position keys (per 90 min)
  const posValues = {};
  posKeys.forEach(({k}) => {
    const vals = aInd.map(r => r[k] || 0);
    const total = vals.reduce((s, v) => s + v, 0);
    posValues[k] = {
      total,
      avg: vals.length > 0 ? total / vals.length : 0,
      per90: totalMin > 0 ? (total / totalMin) * 90 : (vals.length > 0 ? total / vals.length : 0),
      data: vals,
    };
  });

  // ── Correlation with collective stats ──
  // Match individual games to collective games by opponent name
  const correlationData = aInd.map(r => {
    const indAdv = norm(r.jogo || "");
    const match = partidas.find(p => {
      const pAdv = norm(p.adv || "");
      return indAdv.includes(pAdv) || pAdv.includes(indAdv);
    });
    return { ind: r, col: match || null };
  }).filter(c => c.col);

  // Compute correlation insights
  const corrInsights = [];
  if (correlationData.length >= 3) {
    // Wins vs losses performance
    const wins = correlationData.filter(c => c.col.res === "V");
    const losses = correlationData.filter(c => c.col.res === "D");
    if (wins.length > 0 && losses.length > 0) {
      const wAvgAcoes = wins.reduce((s, c) => s + (c.ind.acoes || 0), 0) / wins.length;
      const lAvgAcoes = losses.reduce((s, c) => s + (c.ind.acoes || 0), 0) / losses.length;
      const diff = ((wAvgAcoes - lAvgAcoes) / (lAvgAcoes || 1) * 100).toFixed(0);
      if (Math.abs(diff) > 5) corrInsights.push({ label: "Ações em Vitórias vs Derrotas", valor: `${diff > 0 ? "+" : ""}${diff}%`, pos: diff > 0, desc: `Média de ${wAvgAcoes.toFixed(0)} ações em vitórias vs ${lAvgAcoes.toFixed(0)} em derrotas` });
    }
    // Performance in high vs low possession games
    const highPoss = correlationData.filter(c => c.col.posse != null && c.col.posse >= 50);
    const lowPoss = correlationData.filter(c => c.col.posse != null && c.col.posse < 50);
    if (highPoss.length > 0 && lowPoss.length > 0) {
      const hAvg = highPoss.reduce((s, c) => s + (c.ind.acoes || 0), 0) / highPoss.length;
      const lAvg = lowPoss.reduce((s, c) => s + (c.ind.acoes || 0), 0) / lowPoss.length;
      corrInsights.push({ label: "Ações: Posse Alta vs Baixa", valor: `${hAvg.toFixed(0)} vs ${lAvg.toFixed(0)}`, pos: hAvg > lAvg, desc: `Rendimento com posse ≥50% (${highPoss.length} jogos) vs <50% (${lowPoss.length} jogos)` });
    }
    // Duels correlation with team PPDA
    const withPPDA = correlationData.filter(c => c.col.ppda != null && c.ind.duelos != null);
    if (withPPDA.length >= 3) {
      const highPPDA = withPPDA.filter(c => c.col.ppda >= 10);
      const lowPPDA = withPPDA.filter(c => c.col.ppda < 10);
      if (highPPDA.length > 0 && lowPPDA.length > 0) {
        const hDuel = highPPDA.reduce((s, c) => s + (c.ind.duelos || 0), 0) / highPPDA.length;
        const lDuel = lowPPDA.reduce((s, c) => s + (c.ind.duelos || 0), 0) / lowPPDA.length;
        corrInsights.push({ label: "Duelos: PPDA Alto vs Baixo", valor: `${hDuel.toFixed(1)} vs ${lDuel.toFixed(1)}`, pos: true, desc: `Duelos ganhos quando equipe pressiona menos (PPDA≥10) vs mais (PPDA<10)` });
      }
    }
    // xG individual contribution vs team xG
    const withXG = correlationData.filter(c => c.col.xg != null && c.ind.xg != null && c.ind.xg > 0);
    if (withXG.length > 0) {
      const avgContrib = withXG.reduce((s, c) => s + (c.ind.xg / (c.col.xg || 1)), 0) / withXG.length * 100;
      corrInsights.push({ label: "Contribuição xG Individual", valor: `${avgContrib.toFixed(1)}%`, pos: avgContrib > 15, desc: `Percentual médio do xG da equipe gerado pelo atleta` });
    }
  }

  // ── Longitudinal trend calculation ──
  const trendColor = (data) => {
    if (data.length < 3) return C.textDim;
    const last3 = data.slice(-3);
    const first3 = data.slice(0, 3);
    const avgLast = last3.reduce((s, v) => s + v, 0) / last3.length;
    const avgFirst = first3.reduce((s, v) => s + v, 0) / first3.length;
    return avgLast > avgFirst * 1.05 ? C.green : avgLast < avgFirst * 0.95 ? C.red : C.yellow;
  };

  const trendLabel = (data) => {
    if (data.length < 3) return "Dados insuficientes";
    const last3 = data.slice(-3);
    const first3 = data.slice(0, 3);
    const avgLast = last3.reduce((s, v) => s + v, 0) / last3.length;
    const avgFirst = first3.reduce((s, v) => s + v, 0) / first3.length;
    const pct = ((avgLast - avgFirst) / (avgFirst || 1) * 100).toFixed(0);
    return avgLast > avgFirst * 1.05 ? `↑ +${pct}%` : avgLast < avgFirst * 0.95 ? `↓ ${pct}%` : "→ Estável";
  };

  // ── Position peers comparison (avg per-90 of same-position athletes) ──
  const posPeers = ATLETAS.filter(x => x.pos === a.pos && x.id !== a.id);
  const posPeerStats = posPeers.map(peer => {
    const peerN = norm(peer.nome);
    const rows = individual.filter(r => {
      const rN = norm(r.atleta);
      return rN === peerN || rN.includes(peerN) || peerN.includes(rN);
    });
    const mins = rows.reduce((s, r) => s + (r.min || 0), 0);
    const stats = {};
    posKeys.forEach(({k}) => {
      const total = rows.reduce((s, r) => s + (r[k] || 0), 0);
      stats[k] = mins > 0 ? (total / mins) * 90 : 0;
    });
    return { peer, stats, hasData: rows.length > 0 };
  }).filter(p => p.hasData);
  const posAvg = {};
  posKeys.forEach(({k}) => {
    const vals = posPeerStats.map(p => p.stats[k]).filter(v => isFinite(v));
    posAvg[k] = vals.length > 0 ? vals.reduce((s,v)=>s+v,0) / vals.length : 0;
  });
  const athletePer90 = Object.fromEntries(posKeys.map(({k}) => [k, posValues[k].per90]));
  const radarLabels = posKeys.map(({label}) => label);
  const radarValues = posKeys.map(({k}) => athletePer90[k] || 0);
  const radarAvg = posKeys.map(({k}) => posAvg[k] || 0);
  const hasPeerData = posPeerStats.length > 0;

  const TABS = athleteMode ? [
    { id: "videos", label: "Vídeos", Icon: Film },
    { id: "dados", label: "Dados", Icon: BarChart3 },
    { id: "fisica", label: "Parte Física", Icon: Activity },
  ] : [
    { id: "dados", label: "Dados", Icon: BarChart3 },
    { id: "videos", label: "Vídeos", Icon: Film },
    { id: "fisica", label: "Parte Física", Icon: Activity },
  ];

  return <div>
    {onBack && <button onClick={onBack} style={{background:"none",border:"none",color:C.textDim,cursor:"pointer",fontFamily:font,fontSize:11,display:"flex",alignItems:"center",gap:4,marginBottom:14,padding:0}}><ArrowLeft size={13}/>VOLTAR</button>}

    {/* ── PERFIL ── */}
    <Card style={{marginBottom:16,backgroundImage:`linear-gradient(135deg,${C.goldDim} 0%,transparent 50%)`}}>
      <div style={{display:"flex",alignItems:"center",gap:20}}>
        {a.foto?<img src={a.foto} alt={a.nome} style={{width:70,height:70,borderRadius:"50%",objectFit:"cover",border:`3px solid ${C.gold}55`}}/>:<div style={{width:70,height:70,borderRadius:"50%",background:`${C.gold}33`,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:fontD,fontSize:32,color:C.gold,fontWeight:700,border:`3px solid ${C.gold}55`}}>{a.num||"\u2014"}</div>}
        <div style={{flex:1}}>
          <div style={{fontFamily:fontD,fontSize:26,color:C.text,fontWeight:700,textTransform:"uppercase"}}>{a.nome}</div>
          <div style={{display:"flex",gap:8,marginTop:6,flexWrap:"wrap"}}>
            <Badge color={C.gold}>{a.pos}</Badge>
            <Badge color={a.status==="ativo"?C.green:C.red}>{a.status}</Badge>
            {totalJogos>0&&<Badge color={C.text}>{totalJogos}J · {totalMin}min</Badge>}
            {totalGols>0&&<Badge color={C.green}>{totalGols}G · {totalAssist}A</Badge>}
          </div>
        </div>
      </div>
    </Card>

    {/* ── TABS ── */}
    <div style={{display:"flex",gap:4,marginBottom:14,borderBottom:`1px solid ${C.border}`}}>
      {TABS.map(({id,label,Icon})=>{
        const active = tab === id;
        return <button key={id} onClick={()=>setTab(id)} style={{display:"flex",alignItems:"center",gap:6,padding:"8px 14px",background:"none",border:"none",borderBottom:`2px solid ${active?C.gold:"transparent"}`,color:active?C.gold:C.textDim,fontFamily:font,fontSize:11,fontWeight:active?700:500,textTransform:"uppercase",letterSpacing:"0.06em",cursor:"pointer",marginBottom:-1}}>
          <Icon size={12}/>{label}
        </button>;
      })}
    </div>

    {tab === "dados" && <>
    {/* ── RADAR: ATLETA vs MÉDIA DA POSIÇÃO ── */}
    {totalJogos > 0 && <Card style={{marginBottom:14}}>
      <SH title={`Radar — ${a.nome.split(" ")[0]} vs Média ${a.pos}`}/>
      <div style={{fontFamily:font,fontSize:10,color:C.textDim,marginBottom:10}}>
        {hasPeerData ? `Comparação das métricas por 90 min do atleta vs média dos ${posPeerStats.length} atletas da mesma posição.` : "Sem dados de outros atletas da mesma posição para comparar."}
      </div>
      <div style={{display:"grid",gridTemplateColumns:"minmax(280px,1fr) minmax(240px,1fr)",gap:16,alignItems:"center"}}>
        <RadarChart labels={radarLabels} values={radarValues} values2={hasPeerData?radarAvg:null} color1={C.gold} color2={C.blue} size={320}/>
        <div>
          <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:10,flexWrap:"wrap"}}>
            <span style={{display:"flex",alignItems:"center",gap:5,fontFamily:font,fontSize:10,color:C.text}}>
              <span style={{width:10,height:10,borderRadius:"50%",background:C.gold}}/>{a.nome}
            </span>
            {hasPeerData && <span style={{display:"flex",alignItems:"center",gap:5,fontFamily:font,fontSize:10,color:C.text}}>
              <span style={{width:10,height:10,borderRadius:"50%",background:C.blue,opacity:0.7}}/>Média {a.pos}
            </span>}
          </div>
          <table style={{width:"100%",borderCollapse:"collapse",fontFamily:font,fontSize:10}}>
            <thead><tr style={{borderBottom:`1px solid ${C.border}`}}>
              <th style={{padding:"5px 6px",textAlign:"left",color:C.textDim,fontSize:8,textTransform:"uppercase",fontWeight:600}}>Métrica</th>
              <th style={{padding:"5px 6px",textAlign:"right",color:C.gold,fontSize:8,textTransform:"uppercase",fontWeight:600}}>Atleta</th>
              {hasPeerData && <th style={{padding:"5px 6px",textAlign:"right",color:C.blue,fontSize:8,textTransform:"uppercase",fontWeight:600}}>Média</th>}
              {hasPeerData && <th style={{padding:"5px 6px",textAlign:"right",color:C.textDim,fontSize:8,textTransform:"uppercase",fontWeight:600}}>Δ</th>}
            </tr></thead>
            <tbody>{posKeys.map(({k,label},i)=>{
              const v = athletePer90[k] || 0;
              const m = posAvg[k] || 0;
              const diff = v - m;
              const diffColor = diff > 0.01 ? C.green : diff < -0.01 ? C.red : C.textDim;
              const fmt = (x) => (k==="xg"||k==="gols"||k==="assist") ? x.toFixed(2) : x.toFixed(1);
              return <tr key={i} style={{borderBottom:`1px solid ${C.border}33`}}>
                <td style={{padding:"5px 6px",color:C.text}}>{label}</td>
                <td style={{padding:"5px 6px",textAlign:"right",color:C.gold,fontFamily:fontD,fontWeight:700}}>{fmt(v)}</td>
                {hasPeerData && <td style={{padding:"5px 6px",textAlign:"right",color:C.textMid,fontFamily:fontD}}>{fmt(m)}</td>}
                {hasPeerData && <td style={{padding:"5px 6px",textAlign:"right",color:diffColor,fontFamily:fontD,fontWeight:600}}>{diff>=0?"+":""}{fmt(diff)}</td>}
              </tr>;
            })}</tbody>
          </table>
        </div>
      </div>
    </Card>}

    {/* ── MÉTRICAS-CHAVE POR POSIÇÃO ── */}
    <Card style={{marginBottom:14}}>
      <SH title={`Métricas-Chave — ${a.pos}`}/>
      <div style={{display:"grid",gridTemplateColumns:`repeat(${Math.min(posKeys.length,5)},1fr)`,gap:8}}>
        {posKeys.map(({k,label},i)=>{
          const v = posValues[k];
          const displayVal = k === "min" ? v.total : v.per90;
          const isDecimal = k === "xg" || k === "gols" || k === "assist";
          return <div key={i} style={{textAlign:"center",padding:"10px 6px",borderRadius:4,background:C.bgInput,border:`1px solid ${C.border}`}}>
            <div style={{fontFamily:fontD,fontSize:18,color:C.gold,fontWeight:700}}>{totalJogos > 0 ? (isDecimal ? displayVal.toFixed(2) : displayVal.toFixed(k==="min"?0:1)) : "\u2014"}</div>
            <div style={{fontFamily:font,fontSize:8,color:C.textDim,textTransform:"uppercase",marginTop:2}}>{label}{k!=="min"?" /90":""}</div>
          </div>;
        })}
      </div>
      {posM.indices && <div style={{marginTop:10}}>
        <div style={{fontFamily:font,fontSize:9,color:C.textDim,fontWeight:600,textTransform:"uppercase",marginBottom:4}}>Índices de Referência (Wyscout / SkillCorner)</div>
        <div style={{display:"flex",flexWrap:"wrap",gap:4}}>
          {posM.indices.map((idx,i) => <span key={i} style={{fontFamily:font,fontSize:9,color:C.text,background:C.bgInput,border:`1px solid ${C.border}`,padding:"2px 6px",borderRadius:3}}>{idx}</span>)}
        </div>
      </div>}
      <div style={{fontFamily:font,fontSize:10,color:C.textDim,marginTop:8,padding:"8px 10px",background:C.bgInput,borderRadius:4,lineHeight:1.5}}>
        <strong style={{color:C.text}}>Referencial teórico:</strong> {posM.desc}
      </div>
    </Card>

    {/* ── AVALIAÇÃO LONGITUDINAL ── */}
    {totalJogos >= 2 && <Card style={{marginBottom:14}}>
      <SH title="Avaliação Longitudinal"/>
      <div style={{fontFamily:font,fontSize:10,color:C.textDim,marginBottom:10}}>Evolução das métricas ao longo dos {totalJogos} jogos disputados. Linha tracejada = média.</div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))",gap:12}}>
        {posKeys.map(({k,label})=>{
          const data = posValues[k].data;
          const tc = trendColor(data);
          return <div key={k} style={{padding:"10px 12px",borderRadius:6,background:C.bgInput,border:`1px solid ${C.border}`}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
              <span style={{fontFamily:font,fontSize:10,color:C.text,fontWeight:600,textTransform:"uppercase"}}>{label}</span>
              <span style={{fontFamily:fontD,fontSize:10,color:tc,fontWeight:700}}>{trendLabel(data)}</span>
            </div>
            <Sparkline data={data} width={170} height={32} color={tc}/>
            <div style={{display:"flex",justifyContent:"space-between",marginTop:4}}>
              <span style={{fontFamily:font,fontSize:8,color:C.textDim}}>Jogo 1</span>
              <span style={{fontFamily:font,fontSize:8,color:C.textDim}}>Jogo {data.length}</span>
            </div>
          </div>;
        })}
      </div>
    </Card>}

    {/* ── CORRELAÇÃO INDIVIDUAL × COLETIVO ── */}
    {correlationData.length > 0 && <Card style={{marginBottom:14}}>
      <SH title="Correlação Individual × Coletivo"/>
      <div style={{fontFamily:font,fontSize:10,color:C.textDim,marginBottom:10}}>Análise cruzada entre desempenho individual e métricas coletivas da equipe nos mesmos jogos.</div>

      {corrInsights.length > 0 && <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(240px,1fr))",gap:8,marginBottom:12}}>
        {corrInsights.map((ci,i)=>(
          <div key={i} style={{padding:"10px 12px",borderRadius:6,background:C.bgInput,border:`1px solid ${ci.pos?C.green:C.red}33`}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <span style={{fontFamily:font,fontSize:10,color:C.text,fontWeight:600}}>{ci.label}</span>
              <span style={{fontFamily:fontD,fontSize:14,color:ci.pos?C.green:C.red,fontWeight:700}}>{ci.valor}</span>
            </div>
            <div style={{fontFamily:font,fontSize:9,color:C.textDim,marginTop:4}}>{ci.desc}</div>
          </div>
        ))}
      </div>}

      {/* Performance per match table */}
      <div style={{overflowX:"auto"}}>
        <table style={{width:"100%",borderCollapse:"collapse",fontFamily:font,fontSize:10}}>
          <thead><tr style={{borderBottom:`1px solid ${C.border}`}}>
            {["Adversário","Res","Posse%","PPDA","Min","Ações","Duelos","Passes","Dribles","xG"].map(h=>(
              <th key={h} style={{padding:"5px 8px",textAlign:"left",color:C.textDim,fontSize:8,textTransform:"uppercase",fontWeight:600}}>{h}</th>
            ))}
          </tr></thead>
          <tbody>{correlationData.map((c,i)=>(
            <tr key={i} onMouseEnter={e=>e.currentTarget.style.background=C.bgCardHover} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
              <td style={{padding:"6px 8px",color:C.text}}>{c.col.adv}</td>
              <td style={{padding:"6px 8px"}}><ResBadge r={c.col.res}/></td>
              <td style={{padding:"6px 8px",color:C.text}}>{c.col.posse!=null?`${c.col.posse}%`:"\u2014"}</td>
              <td style={{padding:"6px 8px",color:C.textMid}}>{c.col.ppda!=null?c.col.ppda.toFixed(1):"\u2014"}</td>
              <td style={{padding:"6px 8px",color:C.text,fontWeight:600}}>{c.ind.min||"\u2014"}</td>
              <td style={{padding:"6px 8px",color:C.gold}}>{c.ind.acoes||"\u2014"}</td>
              <td style={{padding:"6px 8px",color:C.green}}>{c.ind.duelos||"\u2014"}</td>
              <td style={{padding:"6px 8px",color:C.text}}>{c.ind.passesCrt||"\u2014"}</td>
              <td style={{padding:"6px 8px",color:C.text}}>{c.ind.dribles||"\u2014"}</td>
              <td style={{padding:"6px 8px",color:C.green}}>{c.ind.xg!=null&&c.ind.xg>0?c.ind.xg.toFixed(2):"\u2014"}</td>
            </tr>
          ))}</tbody>
        </table>
      </div>
    </Card>}

    {/* ── PARTIDAS COLETIVAS ── */}
    <Card style={{marginBottom:14}}><SH title="Partidas Coletivas" count={partidas.length}/>
      {partidas.length>0 ? <table style={{width:"100%",borderCollapse:"collapse",fontFamily:font,fontSize:11}}>
        <thead><tr style={{borderBottom:`1px solid ${C.border}`}}>{["R","Adversário","Res","Placar","xG","xGA","Posse%","PPDA"].map(h=><th key={h} style={{padding:"6px 10px",textAlign:"left",color:C.textDim,fontSize:9,textTransform:"uppercase",fontWeight:600}}>{h}</th>)}</tr></thead>
        <tbody>{partidas.map((p,i)=>(
          <tr key={i} onMouseEnter={e=>e.currentTarget.style.background=C.bgCardHover} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
            <td style={{padding:"8px 10px",color:C.textDim}}>{p.rod}</td>
            <td style={{padding:"8px 10px",color:C.text}}><div style={{display:"flex",alignItems:"center",gap:6}}><Escudo src={p.escudo} size={16}/>{p.adv}</div></td>
            <td style={{padding:"8px 10px"}}><ResBadge r={p.res}/></td>
            <td style={{padding:"8px 10px",color:C.text,fontFamily:fontD,fontSize:14}}>{p.pl}</td>
            <td style={{padding:"8px 10px",color:C.green}}>{p.xg!=null?p.xg.toFixed(2):"\u2014"}</td>
            <td style={{padding:"8px 10px",color:C.red}}>{p.xgC!=null?p.xgC.toFixed(2):"\u2014"}</td>
            <td style={{padding:"8px 10px",color:C.text}}>{p.posse!=null?`${p.posse}%`:"\u2014"}</td>
            <td style={{padding:"8px 10px",color:C.textMid}}>{p.ppda!=null?p.ppda.toFixed(1):"\u2014"}</td>
          </tr>
        ))}</tbody>
      </table> : <div style={{fontFamily:font,fontSize:12,color:C.textDim,padding:20,textAlign:"center"}}>Nenhuma partida carregada.</div>}
    </Card>
    </>}

    {tab === "videos" && <div>
      <div style={{fontFamily:fontD,fontSize:14,color:C.text,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:4,display:"flex",alignItems:"center",gap:8}}>
        <Film size={14} color={C.gold}/> Biblioteca de Vídeos
        <span style={{fontFamily:font,fontSize:10,color:C.gold,background:C.goldDim,padding:"2px 7px",borderRadius:3,fontWeight:600}}>{aVideos.length}</span>
      </div>
      <div style={{fontFamily:font,fontSize:10,color:C.textDim,marginBottom:14}}>Clipes individuais, análises e materiais do atleta.</div>
      {aVideos.length > 0
        ? <VideosPage videos={aVideos} athleteMode athleteInfo={a} partidas={partidas} calendario={calendario}/>
        : <Card><div style={{fontFamily:font,fontSize:12,color:C.textDim,padding:30,textAlign:"center"}}>Nenhum vídeo individual cadastrado.</div></Card>}
    </div>}

    {tab === "fisica" && <FisicaTab athlete={a}/>}
  </div>;
}

// ═══════════════════════════════════════════════
// PARTE FÍSICA — placeholder preparado para receber dados
// Schema flexível: categorias (Antropometria, GPS, Testes, Monitoramento) → métricas → valores
// ═══════════════════════════════════════════════
function FisicaTab({athlete}) {
  const categorias = [
    { key:"antropo", label:"Antropometria", desc:"Peso, altura, % gordura, massa magra", metricas:["Peso (kg)","Altura (cm)","% Gordura","Massa Magra (kg)"] },
    { key:"gps", label:"GPS / Carga Externa", desc:"Distância total, HSR, sprints, acelerações (por treino/jogo)", metricas:["Distância Total (m)","HSR >19km/h (m)","Sprints >25km/h","Acelerações >3m/s²","Desacelerações >-3m/s²","Vel. Máx (km/h)"] },
    { key:"testes", label:"Testes Físicos", desc:"Salto, sprint 10/30m, YoYo, isométricos", metricas:["Salto CMJ (cm)","Sprint 10m (s)","Sprint 30m (s)","YoYo IR1 (m)","Isométrico Posterior (N)","Isométrico Adutor (N)"] },
    { key:"monit", label:"Monitoramento Subjetivo", desc:"PSE, RPE, qualidade de sono, dor", metricas:["PSE (1-10)","RPE da sessão","Sono (h)","Qualidade do Sono (1-5)","Dor Muscular (1-5)","Prontidão (1-5)"] },
  ];
  return <div>
    <Card style={{marginBottom:14,background:`linear-gradient(135deg,${C.blue}11,transparent)`,border:`1px dashed ${C.blue}55`}}>
      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:6}}>
        <Activity size={16} color={C.blue}/>
        <span style={{fontFamily:fontD,fontSize:14,color:C.text,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.06em"}}>Parte Física — {athlete.nome}</span>
      </div>
      <div style={{fontFamily:font,fontSize:11,color:C.textDim,lineHeight:1.5}}>
        Estrutura preparada para receber dados da preparação física. As categorias abaixo são sugestões — conforme você alimentar a planilha (ou integração futura), os valores aparecerão aqui automaticamente. Basta me informar o nome das colunas/fonte que eu conecto.
      </div>
    </Card>
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))",gap:12}}>
      {categorias.map(cat => (
        <Card key={cat.key} style={{padding:14}}>
          <div style={{fontFamily:fontD,fontSize:12,color:C.gold,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:4}}>{cat.label}</div>
          <div style={{fontFamily:font,fontSize:9,color:C.textDim,marginBottom:10,lineHeight:1.4}}>{cat.desc}</div>
          <div style={{display:"flex",flexDirection:"column",gap:4}}>
            {cat.metricas.map(m => (
              <div key={m} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"6px 8px",background:C.bgInput,borderRadius:4,border:`1px solid ${C.border}`}}>
                <span style={{fontFamily:font,fontSize:10,color:C.text}}>{m}</span>
                <span style={{fontFamily:fontD,fontSize:10,color:C.textDim,opacity:0.5}}>—</span>
              </div>
            ))}
          </div>
        </Card>
      ))}
    </div>
  </div>;
}
