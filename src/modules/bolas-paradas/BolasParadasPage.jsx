import { useState } from "react";
import { C, fontD, font } from "../../shared/design";
import { ATLETAS, BP_PLAYBOOK } from "../../shared/constants";
import { SH, Card, Badge, Escudo, ResBadge, CompLogo, PlatBadge, ProgressBar } from "../../shared/atoms";
import { parseDateBR } from "../../shared/utils";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import {
  Video, BarChart3, BookOpen, Crosshair, Target, Shield, Flag,
  AlertTriangle, Play, ChevronRight, Circle,
} from "lucide-react";

export default function BolasParadasPage({videos=[],partidas=[],calendario=[],individual=[],proxAdv}) {
  const [activeTab, setActiveTab] = useState("resumo");
  const [playFilter, setPlayFilter] = useState("todos");

  // Filter set piece videos
  const bpVideos = videos.filter(v => v.tipo === "bola_parada" || v.tipo === "bola_parada_goleiro");
  const escudoMap = Object.fromEntries([...partidas,...calendario].filter(x=>x.escudo).map(x=>[(x.adv||"").toLowerCase(),x.escudo]));

  // Compute set piece stats from partidas
  const totalJogos = partidas.length;
  const totalGM = partidas.reduce((s,p) => s + (p.gm||0), 0);
  const totalGS = partidas.reduce((s,p) => s + (p.gs||0), 0);
  const totalBP = partidas.reduce((s,p) => s + (p.bp||p.bpRem||0), 0);
  const totalFaltas = partidas.reduce((s,p) => s + (p.faltas||0), 0);
  const totalCruz = partidas.reduce((s,p) => s + (p.cruz||0), 0);
  const totalCruzCrt = partidas.reduce((s,p) => s + (p.cruzCrt||0), 0);
  const avgBP = totalJogos > 0 ? (totalBP/totalJogos).toFixed(1) : "0";
  const avgFaltas = totalJogos > 0 ? (totalFaltas/totalJogos).toFixed(1) : "0";
  const avgCruz = totalJogos > 0 ? (totalCruz/totalJogos).toFixed(1) : "0";
  const cruzPct = totalCruz > 0 ? ((totalCruzCrt/totalCruz)*100).toFixed(0) : "0";

  // Individual top scorers/assisters
  const playerStats = {};
  individual.forEach(r => {
    const name = r.atleta;
    if (!name) return;
    if (!playerStats[name]) playerStats[name] = {nome:name,gols:0,assist:0,cruz:0,cruzTotal:0,jogos:0};
    playerStats[name].gols += (r.gols||0);
    playerStats[name].assist += (r.assist||0);
    playerStats[name].cruz += (r.cruz||0);
    playerStats[name].cruzTotal += (r.cruzTotal||r.cruz||0);
    playerStats[name].jogos += 1;
  });
  const playerList = Object.values(playerStats);
  const topScorers = [...playerList].filter(p=>p.gols>0).sort((a,b)=>b.gols-a.gols).slice(0,8);
  const topCrossers = [...playerList].filter(p=>p.cruzTotal>0).sort((a,b)=>b.cruzTotal-a.cruzTotal).slice(0,8);

  // Per-match BP data for chart
  const bpChartData = partidas.map(p => ({
    adv: (p.adv||"").slice(0,10),
    bp: p.bp||p.bpRem||0,
    faltas: p.faltas||0,
    cruz: p.cruz||0,
  }));

  // Videos grouped by adversary
  const bpByAdv = {};
  bpVideos.forEach(v => {
    const key = (v.partida||v.titulo||"Geral").toUpperCase();
    if (!bpByAdv[key]) bpByAdv[key] = [];
    bpByAdv[key].push(v);
  });

  const tabs = [
    {key:"resumo",label:"Resumo",icon:<BarChart3 size={12}/>},
    {key:"videos",label:"Vídeos",icon:<Video size={12}/>},
    {key:"playbook",label:"Playbook",icon:<BookOpen size={12}/>},
    {key:"scouting",label:"Scouting",icon:<Crosshair size={12}/>},
  ];

  const StatBox = ({label,value,sub,icon,color=C.text}) => (
    <div style={{background:C.bgCard,border:`1px solid ${C.border}`,borderRadius:8,padding:"12px 14px",display:"flex",alignItems:"center",gap:10}}>
      <div style={{width:36,height:36,borderRadius:8,background:`${color}15`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
        {icon}
      </div>
      <div>
        <div style={{fontFamily:fontD,fontSize:20,fontWeight:700,color,lineHeight:1}}>{value}</div>
        <div style={{fontFamily:font,fontSize:9,color:C.textDim,marginTop:2}}>{label}</div>
        {sub && <div style={{fontFamily:font,fontSize:8,color:C.textMid}}>{sub}</div>}
      </div>
    </div>
  );

  return <div style={{display:"flex",flexDirection:"column",gap:16}}>
    {/* Tabs */}
    <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
      {tabs.map(t => (
        <button key={t.key} onClick={()=>setActiveTab(t.key)} style={{
          display:"flex",alignItems:"center",gap:5,padding:"6px 14px",borderRadius:6,border:`1px solid ${activeTab===t.key?C.gold:C.border}`,
          background:activeTab===t.key?`${C.gold}18`:"transparent",color:activeTab===t.key?C.gold:C.textDim,
          fontFamily:fontD,fontSize:10,fontWeight:700,letterSpacing:"0.08em",textTransform:"uppercase",cursor:"pointer",transition:"all 0.15s"
        }}>{t.icon}{t.label}</button>
      ))}
    </div>

    {/* ═══ TAB: RESUMO ═══ */}
    {activeTab === "resumo" && <>
      {/* KPI Cards */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))",gap:10}}>
        <StatBox label="Bolas Paradas (total)" value={totalBP} sub={`Média ${avgBP}/jogo`} icon={<Target size={18} color={C.gold}/>} color={C.gold}/>
        <StatBox label="Cruzamentos" value={totalCruz} sub={`${cruzPct}% precisão · ${avgCruz}/jogo`} icon={<Flag size={18} color={C.blue}/>} color={C.blue}/>
        <StatBox label="Faltas Sofridas/Cometidas" value={totalFaltas} sub={`Média ${avgFaltas}/jogo`} icon={<AlertTriangle size={18} color={C.yellow}/>} color={C.yellow}/>
        <StatBox label="Vídeos de BP" value={bpVideos.length} sub={`${Object.keys(bpByAdv).length} adversários`} icon={<Video size={18} color={C.purple}/>} color={C.purple}/>
      </div>

      {/* Chart - BP Stats by Match */}
      {bpChartData.length > 0 && <Card>
        <SH title="Bolas Paradas por Jogo"/>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={bpChartData} margin={{top:5,right:10,left:0,bottom:5}}>
            <CartesianGrid strokeDasharray="3 3" stroke={C.border}/>
            <XAxis dataKey="adv" tick={{fontSize:8,fill:C.textDim,fontFamily:font}} interval={0} angle={-30} textAnchor="end" height={50}/>
            <YAxis tick={{fontSize:9,fill:C.textDim}} width={30}/>
            <Tooltip contentStyle={{background:C.bgCard,border:`1px solid ${C.border}`,borderRadius:6,fontFamily:font,fontSize:11}} labelStyle={{color:C.text,fontWeight:700}}/>
            <Bar dataKey="bp" name="Bolas Paradas" fill={C.gold} radius={[3,3,0,0]} barSize={14}/>
            <Bar dataKey="cruz" name="Cruzamentos" fill={C.blue} radius={[3,3,0,0]} barSize={14}/>
            <Bar dataKey="faltas" name="Faltas" fill={C.yellow} radius={[3,3,0,0]} barSize={14}/>
          </BarChart>
        </ResponsiveContainer>
      </Card>}

      {/* Top Scorers & Crossers */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
        <Card>
          <SH title="Artilheiros" count={topScorers.length}/>
          {topScorers.length === 0 ? <div style={{fontFamily:font,fontSize:11,color:C.textDim,textAlign:"center",padding:10}}>Sem dados individuais</div> :
          topScorers.map((p,i) => {
            const atleta = ATLETAS.find(a => a.nome.toLowerCase() === p.nome.toLowerCase());
            return <div key={i} style={{display:"flex",alignItems:"center",gap:8,padding:"6px 0",borderBottom:i<topScorers.length-1?`1px solid ${C.border}`:"none"}}>
              <div style={{width:22,height:22,borderRadius:"50%",background:`${C.gold}18`,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:fontD,fontSize:10,fontWeight:700,color:i<3?C.gold:C.textDim,flexShrink:0}}>{i+1}</div>
              {atleta?.foto && <img src={atleta.foto} alt="" style={{width:24,height:24,borderRadius:"50%",objectFit:"cover",flexShrink:0}} onError={e=>{e.target.style.display="none"}}/>}
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontFamily:font,fontSize:11,color:C.text,fontWeight:600,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{p.nome}</div>
                <div style={{fontFamily:font,fontSize:8,color:C.textDim}}>{atleta?.pos||""}</div>
              </div>
              <div style={{fontFamily:fontD,fontSize:16,fontWeight:700,color:C.gold}}>{p.gols}</div>
              <div style={{fontFamily:font,fontSize:7,color:C.textDim}}>gols</div>
            </div>;
          })}
        </Card>
        <Card>
          <SH title="Top Cruzadores" count={topCrossers.length}/>
          {topCrossers.length === 0 ? <div style={{fontFamily:font,fontSize:11,color:C.textDim,textAlign:"center",padding:10}}>Sem dados individuais</div> :
          topCrossers.map((p,i) => {
            const atleta = ATLETAS.find(a => a.nome.toLowerCase() === p.nome.toLowerCase());
            return <div key={i} style={{display:"flex",alignItems:"center",gap:8,padding:"6px 0",borderBottom:i<topCrossers.length-1?`1px solid ${C.border}`:"none"}}>
              <div style={{width:22,height:22,borderRadius:"50%",background:`${C.blue}18`,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:fontD,fontSize:10,fontWeight:700,color:i<3?C.blue:C.textDim,flexShrink:0}}>{i+1}</div>
              {atleta?.foto && <img src={atleta.foto} alt="" style={{width:24,height:24,borderRadius:"50%",objectFit:"cover",flexShrink:0}} onError={e=>{e.target.style.display="none"}}/>}
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontFamily:font,fontSize:11,color:C.text,fontWeight:600,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{p.nome}</div>
                <div style={{fontFamily:font,fontSize:8,color:C.textDim}}>{atleta?.pos||""}</div>
              </div>
              <div style={{fontFamily:fontD,fontSize:16,fontWeight:700,color:C.blue}}>{p.cruzTotal}</div>
              <div style={{fontFamily:font,fontSize:7,color:C.textDim}}>cruz</div>
            </div>;
          })}
        </Card>
      </div>

      {/* Per-match details table */}
      <Card>
        <SH title="Detalhamento por Jogo" count={partidas.length}/>
        <div style={{overflowX:"auto"}}>
          <table style={{width:"100%",borderCollapse:"collapse",fontFamily:font,fontSize:10}}>
            <thead>
              <tr style={{borderBottom:`2px solid ${C.border}`}}>
                {["","Adversário","Data","Placar","BP","Cruzamentos","Cruz%","Faltas","GM","GS"].map((h,i) => (
                  <th key={i} style={{padding:"6px 8px",textAlign:i<4?"left":"center",fontFamily:fontD,fontSize:9,color:C.textDim,fontWeight:700,letterSpacing:"0.08em",textTransform:"uppercase"}}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[...partidas].sort((a,b)=>{const da=parseDateBR(a.data),db=parseDateBR(b.data);if(da&&db)return db-da;return 0;}).map((p,i) => (
                <tr key={i} style={{borderBottom:`1px solid ${C.border}`,transition:"background 0.1s"}} onMouseEnter={e=>e.currentTarget.style.background=`${C.gold}08`} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                  <td style={{padding:"5px 4px"}}><Escudo src={p.escudo||escudoMap[(p.adv||"").toLowerCase()]} size={18}/></td>
                  <td style={{padding:"5px 8px",color:C.text,fontWeight:600}}>{p.adv}</td>
                  <td style={{padding:"5px 8px",color:C.textDim}}>{p.data}</td>
                  <td style={{padding:"5px 8px"}}><ResBadge r={p.res}/> <span style={{color:C.text,fontWeight:700,marginLeft:4}}>{p.pl}</span></td>
                  <td style={{padding:"5px 8px",textAlign:"center",color:C.gold,fontWeight:700}}>{p.bp ?? p.bpRem ?? "-"}</td>
                  <td style={{padding:"5px 8px",textAlign:"center",color:C.blue,fontWeight:600}}>{p.cruz ?? "-"}{p.cruzCrt!=null ? ` (${p.cruzCrt})` : ""}</td>
                  <td style={{padding:"5px 8px",textAlign:"center",color:C.textMid}}>{p.cruzPct!=null ? `${p.cruzPct}%` : "-"}</td>
                  <td style={{padding:"5px 8px",textAlign:"center",color:C.yellow,fontWeight:600}}>{p.faltas ?? "-"}</td>
                  <td style={{padding:"5px 8px",textAlign:"center",color:C.green,fontWeight:700}}>{p.gm ?? "-"}</td>
                  <td style={{padding:"5px 8px",textAlign:"center",color:C.red,fontWeight:700}}>{p.gs ?? "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </>}

    {/* ═══ TAB: VÍDEOS ═══ */}
    {activeTab === "videos" && <>
      <Card>
        <SH title="Vídeos de Bolas Paradas" count={bpVideos.length}/>
        {bpVideos.length === 0 ? (
          <div style={{fontFamily:font,fontSize:12,color:C.textDim,padding:20,textAlign:"center"}}>Nenhum vídeo de bolas paradas encontrado. Adicione vídeos com tipo "Bolas Paradas" na planilha.</div>
        ) : Object.entries(bpByAdv).map(([adv,vids]) => (
          <div key={adv} style={{marginBottom:12}}>
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}>
              <Escudo src={escudoMap[adv.toLowerCase()]} size={18}/>
              <span style={{fontFamily:fontD,fontSize:11,color:C.text,fontWeight:700,letterSpacing:"0.05em"}}>{adv}</span>
              <Badge color={C.purple}>{vids.length}</Badge>
            </div>
            {vids.map((v,vi) => (
              <div key={vi} onClick={v.link?()=>window.open(v.link,"_blank"):undefined} style={{
                display:"flex",alignItems:"center",gap:10,padding:"8px 10px",borderRadius:5,
                border:`1px solid ${C.border}`,marginBottom:4,cursor:v.link?"pointer":"default",transition:"border-color 0.15s"
              }} onMouseEnter={e=>e.currentTarget.style.borderColor=C.gold} onMouseLeave={e=>e.currentTarget.style.borderColor=C.border}>
                <Play size={14} color={v.tipo==="bola_parada_goleiro"?C.cyan:C.purple}/>
                <div style={{flex:1}}>
                  <div style={{fontFamily:font,fontSize:11,color:C.text}}>{v.titulo}</div>
                  <div style={{fontFamily:font,fontSize:9,color:C.textDim,display:"flex",alignItems:"center",gap:4}}>
                    {v.data} {v.comp && <><CompLogo comp={v.comp} size={10}/>{v.comp}</>} {v.rodada && `R${v.rodada}`}
                    {v.tipo==="bola_parada_goleiro" && <Badge color={C.cyan}>Goleiro</Badge>}
                  </div>
                </div>
                <PlatBadge p={v.plat}/>
              </div>
            ))}
          </div>
        ))}
      </Card>
    </>}

    {/* ═══ TAB: PLAYBOOK ═══ */}
    {activeTab === "playbook" && <>
      {/* Filter */}
      <div style={{display:"flex",gap:6}}>
        {[{k:"todos",l:"Todos"},{k:"ofensivo",l:"Ofensivo"},{k:"defensivo",l:"Defensivo"}].map(f => (
          <button key={f.k} onClick={()=>setPlayFilter(f.k)} style={{
            padding:"5px 12px",borderRadius:5,border:`1px solid ${playFilter===f.k?C.gold:C.border}`,
            background:playFilter===f.k?`${C.gold}15`:"transparent",color:playFilter===f.k?C.gold:C.textDim,
            fontFamily:fontD,fontSize:9,fontWeight:700,letterSpacing:"0.08em",textTransform:"uppercase",cursor:"pointer"
          }}>{f.l}</button>
        ))}
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(320px,1fr))",gap:12}}>
        {BP_PLAYBOOK.filter(p => playFilter==="todos" || p.tipo===playFilter).map(play => (
          <Card key={play.id}>
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
              <div style={{width:32,height:32,borderRadius:8,background:play.tipo==="ofensivo"?`${C.green}18`:`${C.red}18`,display:"flex",alignItems:"center",justifyContent:"center"}}>
                {play.tipo==="ofensivo" ? <Target size={16} color={C.green}/> : <Shield size={16} color={C.red}/>}
              </div>
              <div>
                <div style={{fontFamily:fontD,fontSize:13,color:C.text,fontWeight:700}}>{play.nome}</div>
                <Badge color={play.tipo==="ofensivo"?C.green:C.red}>{play.tipo}</Badge>
              </div>
            </div>
            <div style={{fontFamily:font,fontSize:11,color:C.textMid,lineHeight:1.5,marginBottom:10}}>{play.desc}</div>
            <div style={{background:`${C.bg}`,borderRadius:6,padding:"8px 10px",border:`1px solid ${C.border}`}}>
              <div style={{fontFamily:fontD,fontSize:8,color:C.textDim,fontWeight:700,letterSpacing:"0.1em",marginBottom:6,textTransform:"uppercase"}}>Movimentações</div>
              {play.movimentos.map((m,mi) => (
                <div key={mi} style={{display:"flex",alignItems:"center",gap:6,padding:"3px 0"}}>
                  <div style={{width:16,height:16,borderRadius:"50%",background:`${play.tipo==="ofensivo"?C.green:C.red}22`,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:fontD,fontSize:8,fontWeight:700,color:play.tipo==="ofensivo"?C.green:C.red,flexShrink:0}}>{mi+1}</div>
                  <span style={{fontFamily:font,fontSize:10,color:C.text}}>{m}</span>
                </div>
              ))}
            </div>
          </Card>
        ))}
      </div>
    </>}

    {/* ═══ TAB: SCOUTING ═══ */}
    {activeTab === "scouting" && <>
      {/* Next opponent scouting */}
      {proxAdv ? <Card style={{backgroundImage:`linear-gradient(135deg,${C.goldDim} 0%,transparent 50%)`}}>
        <SH title="Próximo Adversário — Bolas Paradas"/>
        <div style={{display:"flex",alignItems:"center",gap:16,marginBottom:14}}>
          <div style={{width:52,height:52,borderRadius:8,background:`${C.gold}15`,display:"flex",alignItems:"center",justifyContent:"center",overflow:"hidden"}}>
            {proxAdv.escudo?<img src={proxAdv.escudo} alt="" style={{width:38,height:38,objectFit:"contain"}} onError={e=>{e.target.style.display="none"}}/>:<Shield size={24} color={C.gold}/>}
          </div>
          <div>
            <div style={{fontFamily:fontD,fontSize:20,color:C.text,fontWeight:700}}>vs {proxAdv.nome}</div>
            <div style={{fontFamily:font,fontSize:11,color:C.textDim}}>{proxAdv.data} · {proxAdv.comp}</div>
          </div>
        </div>
        {/* Scouting checklist for set pieces */}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
          {[
            {title:"Escanteios a Favor",items:["Tipo de cobrança predominante","Jogadores referência no cabeceio","Posicionamento ofensivo","Jogadas ensaiadas identificadas"]},
            {title:"Escanteios Contra",items:["Marcação zonal ou individual","Pontos fracos aéreos","Saída em contra-ataque","Goleiro sai no cruzamento?"]},
            {title:"Faltas / Cobranças",items:["Cobradores de falta direta","Jogadas ensaiadas em faltas laterais","Barreira — quantos jogadores?","Cobrança de pênalti — cobrador principal"]},
            {title:"Pontos de Atenção",items:["Laterais longos ofensivos","Comportamento no 2º lance","Transição após bola parada","Organização defensiva pós-BP"]}
          ].map((section,si) => (
            <div key={si} style={{background:C.bgCard,border:`1px solid ${C.border}`,borderRadius:8,padding:"10px 12px"}}>
              <div style={{fontFamily:fontD,fontSize:10,color:C.gold,fontWeight:700,letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:8}}>{section.title}</div>
              {section.items.map((item,ii) => (
                <div key={ii} style={{display:"flex",alignItems:"center",gap:6,padding:"4px 0",borderBottom:ii<section.items.length-1?`1px solid ${C.border}`:undefined}}>
                  <Circle size={8} color={C.textDim}/>
                  <span style={{fontFamily:font,fontSize:10,color:C.textMid}}>{item}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      </Card> : <Card><div style={{fontFamily:font,fontSize:12,color:C.textDim,padding:20,textAlign:"center"}}>Sincronize com Google Sheets para ver o scouting do próximo adversário.</div></Card>}

      {/* Previous opponents BP videos */}
      {bpVideos.length > 0 && <Card>
        <SH title="Análises de BP por Adversário" count={Object.keys(bpByAdv).length}/>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(220px,1fr))",gap:8}}>
          {Object.entries(bpByAdv).map(([adv,vids]) => (
            <div key={adv} style={{background:C.bgCard,border:`1px solid ${C.border}`,borderRadius:8,padding:"10px 12px",cursor:"pointer",transition:"border-color 0.15s"}}
              onMouseEnter={e=>e.currentTarget.style.borderColor=C.gold} onMouseLeave={e=>e.currentTarget.style.borderColor=C.border}
              onClick={()=>{setActiveTab("videos")}}>
              <div style={{display:"flex",alignItems:"center",gap:8}}>
                <Escudo src={escudoMap[adv.toLowerCase()]} size={22}/>
                <div style={{flex:1}}>
                  <div style={{fontFamily:font,fontSize:11,color:C.text,fontWeight:600}}>{adv}</div>
                  <div style={{fontFamily:font,fontSize:9,color:C.textDim}}>{vids.length} vídeo{vids.length>1?"s":""}</div>
                </div>
                <ChevronRight size={14} color={C.textDim}/>
              </div>
            </div>
          ))}
        </div>
      </Card>}
    </>}
  </div>;
}
