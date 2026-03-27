import { C, fontD, font } from "../../shared/design";
import { ATLETAS, POS_METRICS } from "../../shared/constants";
import { norm } from "../../shared/utils";
import { SH, Card, Badge, ResBadge, Escudo, PlatBadge, Sparkline } from "../../shared/atoms";
import {
  ArrowLeft, Play,
} from "lucide-react";

export default function AtletaDetailPage({id, onBack, videos=[], partidas=[], individual=[]}) {
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

  return <div>
    <button onClick={onBack} style={{background:"none",border:"none",color:C.textDim,cursor:"pointer",fontFamily:font,fontSize:11,display:"flex",alignItems:"center",gap:4,marginBottom:14,padding:0}}><ArrowLeft size={13}/>VOLTAR</button>

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

    {/* ── VÍDEOS ── */}
    <Card><SH title="Vídeos" count={aVideos.length}/>
      {aVideos.length>0?aVideos.map(v=>{
        const vLink = v.link || v.linkAlt || "";
        return <div key={v.id} onClick={vLink?()=>window.open(vLink,"_blank"):undefined} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 10px",borderRadius:4,border:`1px solid ${C.border}`,marginBottom:4,cursor:vLink?"pointer":"default"}} onMouseEnter={e=>e.currentTarget.style.borderColor=C.gold} onMouseLeave={e=>e.currentTarget.style.borderColor=C.border}>
          <Play size={14} color={C.gold}/><div style={{flex:1}}><div style={{fontFamily:font,fontSize:12,color:C.text}}>{v.titulo}</div><div style={{fontFamily:font,fontSize:9,color:C.textDim}}>{v.data}{v.dur?` · ${v.dur}`:""}</div></div>{vLink&&<span style={{fontFamily:font,fontSize:8,color:C.green,background:`${C.green}18`,padding:"2px 6px",borderRadius:3,textTransform:"uppercase",fontWeight:600}}>Link</span>}<PlatBadge p={v.plat}/>
        </div>;}):<div style={{fontFamily:font,fontSize:11,color:C.textDim,padding:10}}>Nenhum vídeo individual cadastrado.</div>}
    </Card>
  </div>;
}
