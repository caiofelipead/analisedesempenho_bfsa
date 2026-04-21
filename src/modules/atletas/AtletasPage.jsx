import { useState, useMemo } from "react";
import { C, fontD, font } from "../../shared/design";
import { ATLETAS, POS_METRICS } from "../../shared/constants";
import { SearchBar, Tabs, Card, StatusDot, Tend, SH, RadarChart } from "../../shared/atoms";
import { norm } from "../../shared/utils";
import computeTendencies from "../../shared/computeTendencies";
import { Users } from "lucide-react";

export default function AtletasPage({nav, individual=[]}) {
  const [search,setSearch]=useState("");
  const [fp,setFp]=useState("TODAS");
  const tendMap=computeTendencies(individual);
  const posicoes=["TODAS",...new Set(ATLETAS.map(a=>a.pos))];
  const filtered=ATLETAS.filter(a=>{
    const ms=a.nome.toLowerCase().includes(search.toLowerCase());
    const mp=fp==="TODAS"||a.pos===fp;
    return ms&&mp;
  });

  // Aggregated radar per position (per-90 averages of all athletes of that position)
  const athletePer90 = useMemo(() => {
    const map = {};
    ATLETAS.forEach(a => {
      const aN = norm(a.nome);
      const rows = individual.filter(r => {
        const rN = norm(r.atleta);
        return rN === aN || rN.includes(aN) || aN.includes(rN);
      });
      const mins = rows.reduce((s, r) => s + (r.min || 0), 0);
      const posM = POS_METRICS[a.pos] || POS_METRICS.Volante;
      const stats = {};
      posM.keys.forEach(({k}) => {
        const total = rows.reduce((s, r) => s + (r[k] || 0), 0);
        stats[k] = mins > 0 ? (total / mins) * 90 : 0;
      });
      map[a.id] = { pos: a.pos, stats, hasData: rows.length > 0 };
    });
    return map;
  }, [individual]);

  // Build radar summary for the selected position filter (or "TODAS" = first position group)
  const radarPos = fp === "TODAS" ? null : fp;
  const radarData = useMemo(() => {
    if (!radarPos) return null;
    const posM = POS_METRICS[radarPos];
    if (!posM) return null;
    const peers = ATLETAS.filter(a => a.pos === radarPos);
    const stats = peers.map(a => athletePer90[a.id]).filter(s => s && s.hasData);
    if (stats.length === 0) return null;
    const labels = posM.keys.map(m => m.label);
    const avg = posM.keys.map(({k}) => {
      const vals = stats.map(s => s.stats[k]).filter(v => isFinite(v));
      return vals.length > 0 ? vals.reduce((s,v)=>s+v,0) / vals.length : 0;
    });
    const best = posM.keys.map(({k}) => {
      const vals = stats.map(s => s.stats[k]).filter(v => isFinite(v));
      return vals.length > 0 ? Math.max(...vals) : 0;
    });
    return { labels, avg, best, count: stats.length };
  }, [radarPos, athletePer90]);

  return <div>
    <SearchBar ph="Buscar atleta..." val={search} onChange={setSearch}/>
    <Tabs items={posicoes} active={fp} onChange={setFp}/>

    {radarData && <Card style={{marginBottom:14}}>
      <SH title={`Radar do Elenco — ${fp}`} count={`${radarData.count} ${radarData.count===1?"atleta":"atletas"}`}/>
      <div style={{fontFamily:font,fontSize:10,color:C.textDim,marginBottom:10}}>
        Média do elenco vs melhor valor registrado na posição (por 90 min).
      </div>
      <div style={{display:"grid",gridTemplateColumns:"minmax(280px,1fr) minmax(220px,1fr)",gap:16,alignItems:"center"}}>
        <RadarChart labels={radarData.labels} values={radarData.best} values2={radarData.avg} color1={C.gold} color2={C.blue} size={300}/>
        <div>
          <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:10,flexWrap:"wrap"}}>
            <span style={{display:"flex",alignItems:"center",gap:5,fontFamily:font,fontSize:10,color:C.text}}>
              <span style={{width:10,height:10,borderRadius:"50%",background:C.gold}}/>Melhor do elenco
            </span>
            <span style={{display:"flex",alignItems:"center",gap:5,fontFamily:font,fontSize:10,color:C.text}}>
              <span style={{width:10,height:10,borderRadius:"50%",background:C.blue,opacity:0.7}}/>Média
            </span>
          </div>
          <div style={{fontFamily:font,fontSize:10,color:C.textDim,lineHeight:1.5}}>
            Use os cards abaixo para abrir cada atleta e ver a comparação individual com a média da posição no radar detalhado.
          </div>
        </div>
      </div>
    </Card>}

    {fp === "TODAS" && <Card style={{marginBottom:14}}>
      <SH title="Radar do Elenco" count={`${ATLETAS.length} atletas`}/>
      <div style={{fontFamily:font,fontSize:10,color:C.textDim,display:"flex",alignItems:"center",gap:8,padding:"8px 12px",background:C.bgInput,borderRadius:6,border:`1px solid ${C.border}`}}>
        <Users size={14} color={C.blue}/>
        Selecione uma posição acima para ver o radar comparativo (melhor do elenco vs média).
      </div>
    </Card>}

    <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10}}>
      {filtered.map(a=>{
        const t=tendMap[a.id]||"estável";
        const per90 = athletePer90[a.id];
        const posM = POS_METRICS[a.pos] || POS_METRICS.Volante;
        const miniLabels = posM.keys.slice(0,5).map(m=>m.label);
        const miniValues = posM.keys.slice(0,5).map(({k})=>per90?.stats?.[k]||0);
        return <Card key={a.id} onClick={()=>nav("atleta-detail",a.id)}>
          <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:10}}>
            {a.foto?<img src={a.foto} alt={a.nome} style={{width:42,height:42,borderRadius:"50%",objectFit:"cover",border:`2px solid ${C.gold}33`}}/>:<div style={{width:42,height:42,borderRadius:"50%",background:`${C.gold}22`,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:fontD,fontSize:18,color:C.gold,fontWeight:700,border:`2px solid ${C.gold}33`}}>{a.num||"—"}</div>}
            <div style={{flex:1}}>
              <div style={{fontFamily:font,fontSize:13,color:C.text,fontWeight:700}}>{a.nome}</div>
              <div style={{display:"flex",gap:4,alignItems:"center",marginTop:2}}><StatusDot s={a.status}/><span style={{fontFamily:font,fontSize:9,color:C.textDim,textTransform:"uppercase"}}>{a.status}</span></div>
            </div>
          </div>
          {per90?.hasData ? (
            <div style={{display:"flex",justifyContent:"center",padding:"4px 0",borderTop:`1px solid ${C.border}`,borderBottom:`1px solid ${C.border}`,marginBottom:8}}>
              <RadarChart labels={miniLabels} values={miniValues} color1={C.gold} size={150} rings={3} showLabels={false}/>
            </div>
          ) : (
            <div style={{textAlign:"center",fontFamily:font,fontSize:9,color:C.textDim,padding:"16px 0",borderTop:`1px solid ${C.border}`,borderBottom:`1px solid ${C.border}`,marginBottom:8,fontStyle:"italic"}}>Sem dados individuais ainda</div>
          )}
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6}}>
            <div style={{textAlign:"center"}}><div style={{fontFamily:fontD,fontSize:13,color:C.gold}}>{a.pos}</div><div style={{fontFamily:font,fontSize:8,color:C.textDim,textTransform:"uppercase"}}>Posição</div></div>
            <div style={{textAlign:"center"}}><div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:3}}><Tend t={t}/><span style={{fontFamily:font,fontSize:10,color:C.textDim}}>{t}</span></div><div style={{fontFamily:font,fontSize:8,color:C.textDim,textTransform:"uppercase"}}>Tendência</div></div>
          </div>
        </Card>;
      })}
    </div>
  </div>;
}
