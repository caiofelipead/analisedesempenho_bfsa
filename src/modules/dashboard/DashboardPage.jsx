import { C, fontD, font } from "../../shared/design";
import { ATLETAS } from "../../shared/constants";
import { StatCard, SH, Card, Badge, Tend, PrioBadge, ResBadge, ProgressBar, CompLogo, Escudo } from "../../shared/atoms";
import computeTendencies from "../../shared/computeTendencies";
import {
  BarChart, Bar, XAxis, ResponsiveContainer, Cell,
} from "recharts";
import {
  Users, Video, ClipboardList, AlertTriangle, Shield, Crosshair, Clock,
} from "lucide-react";

export default function DashboardPage({nav,tarefas=[],videos=[],partidas=[],proxAdv,individual=[]}) {
  const ativos=ATLETAS.filter(a=>a.status==="ativo").length;
  const vit=partidas.filter(p=>p.res==="V").length;
  const emp=partidas.filter(p=>p.res==="E").length;
  const der=partidas.filter(p=>p.res==="D").length;
  const atrasadas=tarefas.filter(t=>t.status==="atrasada");
  const pendentes=tarefas.filter(t=>t.status!=="concluida");
  const chartData=partidas.filter(p=>p.res==="V"||p.res==="E"||p.res==="D").slice(-8).map(p=>({j:`vs ${p.adv}`,r:p.res==="V"?3:p.res==="E"?2:1,res:p.res}));
  const tendMap=computeTendencies(individual);
  const subindo=ATLETAS.filter(a=>a.status==="ativo"&&tendMap[a.id]==="subindo");

  return <div>
    <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:12,marginBottom:20}}>
      <StatCard label="Atletas Ativos" value={ativos} icon={Users}/>
      <StatCard label="Jogos" value={partidas.length} sub={`${vit}V ${emp}E ${der}D`} icon={Shield} accent={C.green}/>
      <StatCard label="Vídeos" value={videos.length} icon={Video} accent={C.blue}/>
      <StatCard label="Tarefas Pendentes" value={pendentes.length} icon={ClipboardList} accent={C.yellow}/>
      <StatCard label="Atrasadas" value={atrasadas.length} icon={AlertTriangle} accent={atrasadas.length>0?C.red:C.green}/>
    </div>

    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,marginBottom:16}}>
      {proxAdv ? <Card>
        <SH title="Próximo Adversário"/>
        <div style={{display:"flex",alignItems:"center",gap:16}}>
          <div style={{width:56,height:56,borderRadius:"50%",background:`${C.red}22`,display:"flex",alignItems:"center",justifyContent:"center",border:`2px solid ${C.red}44`,overflow:"hidden"}}>
            {proxAdv.escudo?<img src={proxAdv.escudo} alt={proxAdv.nome} style={{width:38,height:38,objectFit:"contain"}} onError={e=>{e.target.style.display="none"}}/>:<Crosshair size={24} color={C.red}/>}
          </div>
          <div style={{flex:1}}>
            <div style={{fontFamily:fontD,fontSize:22,color:C.text,fontWeight:700}}>{proxAdv.nome}</div>
            <div style={{fontFamily:font,fontSize:11,color:C.textDim,display:"flex",alignItems:"center",gap:4}}><CompLogo comp={proxAdv.comp} size={14}/>{proxAdv.comp} · {proxAdv.data} · {proxAdv.form}</div>
            <div style={{marginTop:8,display:"flex",alignItems:"center",gap:8}}>
              <ProgressBar pct={proxAdv.progresso} color={C.yellow}/>
              <span style={{fontFamily:fontD,fontSize:14,color:C.yellow}}>{proxAdv.progresso}%</span>
            </div>
          </div>
        </div>
      </Card> : <Card><div style={{fontFamily:font,fontSize:12,color:C.textDim,padding:20,textAlign:"center"}}>Sincronize com Google Sheets para ver o próximo adversário.</div></Card>}
      <Card>
        <SH title="Resultados Recentes"/>
        {chartData.length>0 ? <ResponsiveContainer width="100%" height={120}>
          <BarChart data={chartData} barSize={28}>
            <XAxis dataKey="j" tick={{fill:C.textDim,fontSize:9,fontFamily:font}} axisLine={false} tickLine={false}/>
            <Bar dataKey="r" radius={[3,3,0,0]}>{chartData.map((e,i)=><Cell key={i} fill={e.res==="V"?C.green:e.res==="E"?C.yellow:C.red}/>)}</Bar>
          </BarChart>
        </ResponsiveContainer> : <div style={{fontFamily:font,fontSize:12,color:C.textDim,padding:20,textAlign:"center"}}>Nenhuma partida carregada.</div>}
      </Card>
    </div>

    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
      <Card>
        <SH title="Tendência Positiva" count={subindo.length}/>
        {subindo.map((a,i)=>(
          <div key={a.id} onClick={()=>nav("atleta-detail",a.id)} style={{display:"flex",alignItems:"center",gap:10,padding:"7px 10px",borderRadius:4,cursor:"pointer",background:i===0?C.goldDim:"transparent",border:i===0?`1px solid ${C.gold}33`:"1px solid transparent",marginBottom:2}} onMouseEnter={e=>{if(i!==0)e.currentTarget.style.background=C.bgCardHover}} onMouseLeave={e=>{if(i!==0)e.currentTarget.style.background="transparent"}}>
            {a.foto?<img src={a.foto} alt={a.nome} style={{width:28,height:28,borderRadius:"50%",objectFit:"cover",border:`2px solid ${C.gold}33`}}/>:<div style={{width:28,height:28,borderRadius:"50%",background:`${C.gold}22`,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:fontD,fontSize:12,color:C.gold}}>{a.num||"—"}</div>}
            <div style={{flex:1}}>
              <div style={{fontFamily:font,fontSize:12,color:C.text,fontWeight:600}}>{a.nome}</div>
              <div style={{fontFamily:font,fontSize:9,color:C.textDim}}>{a.pos}</div>
            </div>
            <Tend t={tendMap[a.id]}/>
          </div>
        ))}
      </Card>
      <Card>
        <SH title="Cobrança — Pendentes" count={pendentes.length}/>
        <div style={{display:"flex",flexDirection:"column",gap:4,maxHeight:220,overflowY:"auto"}}>
          {pendentes.slice(0,6).map(t=>(
            <div key={t.id} style={{display:"flex",alignItems:"center",gap:8,padding:"8px 10px",borderRadius:4,background:t.atraso>0||t.status==="atrasada"?C.redDim:"transparent",border:`1px solid ${t.atraso>0||t.status==="atrasada"?`${C.red}33`:C.border}`}}>
              {t.atraso>0||t.status==="atrasada"?<AlertTriangle size={14} color={C.red}/>:<Clock size={14} color={C.textDim}/>}
              <div style={{flex:1}}>
                <div style={{fontFamily:font,fontSize:11,color:C.text}}>{t.titulo}</div>
                <div style={{fontFamily:font,fontSize:9,color:C.textDim}}>{t.analista} · {t.prazo}{(t.atraso>0||t.status==="atrasada")&&<span style={{color:C.red,fontWeight:700}}> · ATRASADA</span>}</div>
              </div>
              <PrioBadge p={t.prio}/>
            </div>
          ))}
        </div>
      </Card>
    </div>
  </div>;
}
