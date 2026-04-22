import { useState, useEffect } from "react";
import useTarefas from "./useTarefas";
import useAdvChecklist from "./useAdvChecklist";
import useAdvLinks from "./useAdvLinks";
import useIndicacoes from "./useIndicacoes";
import useSheets from "./hooks/useSheets";

// Shared
import { C, CDark, CLight, setTheme, font, fontD } from "./shared/design";
import { ATLETAS, FIXED_CHECKLIST, NAV, isAthleteUser, getAthleteData } from "./shared/constants";

// Pages (lazy-loaded for code splitting)
import DashboardPage from "./modules/dashboard/DashboardPage";
import ModeloJogoPage from "./modules/modelo-jogo/ModeloJogoPage";
import AdversarioPage from "./modules/adversario/AdversarioPage";
import PrelecaoPage from "./modules/prelecao/PrelecaoPage";
import PartidasPage from "./modules/partidas/PartidasPage";
import BolasParadasPage from "./modules/bolas-paradas/BolasParadasPage";
import TreinosPage from "./modules/treinos/TreinosPage";
import AtletasPage from "./modules/atletas/AtletasPage";
import AtletaDetailPage from "./modules/atletas/AtletaDetailPage";
import VideosPage from "./modules/videos/VideosPage";
import AnalistasPage from "./modules/analistas/AnalistasPage";
import IndicacoesPage from "./modules/indicacoes/IndicacoesPage";
import ProtocolosPage from "./modules/protocolos/ProtocolosPage";
import ControleAcessoPage from "./modules/controle-acesso/ControleAcessoPage";
import SerieBPage from "./modules/serie-b/SerieBPage";
import LoginPage from "./modules/auth/LoginPage";
import WatermarkOverlay from "./shared/WatermarkOverlay";
import { logAccess, EVENT_TYPES } from "./shared/access";
import { getDisplayName } from "./shared/auth";

import {
  ChevronRight, ChevronDown, User, XCircle, Sun, Moon, RefreshCw,
} from "lucide-react";

export default function PantherPerformance() {
  const [authedUser,setAuthedUser]=useState(()=>sessionStorage.getItem("bfsa_user")||null);
  const isAthlete = authedUser && isAthleteUser(authedUser);
  const athleteData = authedUser ? getAthleteData(authedUser) : null;
  const [page,setPage]=useState(()=>{const u=sessionStorage.getItem("bfsa_user");return u&&isAthleteUser(u)?"videos":"dashboard"});
  const [sub,setSub]=useState(null);
  const [selId,setSelId]=useState(null);
  const [collapsed,setCollapsed]=useState({});
  const [time,setTime]=useState(new Date());
  const {tarefas,addTarefa:addTarefaDB,updateTarefa:updateTarefaDB,removeTarefa:removeTarefaDB}=useTarefas();
  const [showAddTarefa,setShowAddTarefa]=useState(false);
  const [isDark,setIsDark]=useState(()=>{try{return localStorage.getItem("bfsa_dark")==="true"}catch{return false}});
  const {checklist:advChecklist,setChecklist:setAdvChecklist}=useAdvChecklist();
  const {links:advLinks,setLinks:setAdvLinks}=useAdvLinks();
  const {indicacoes,addIndicacao,updateIndicacao,removeIndicacao}=useIndicacoes();
  const sheets = useSheets();

  const handleLogin=(u)=>{sessionStorage.setItem("bfsa_user",u);setAuthedUser(u);if(isAthleteUser(u))setPage("videos")};
  const handleLogout=()=>{sessionStorage.removeItem("bfsa_user");setAuthedUser(null)};

  // Update theme colors before render
  setTheme(isDark);

  useEffect(()=>{const t=setInterval(()=>setTime(new Date()),60000);return()=>clearInterval(t)},[]);
  useEffect(()=>{if(authedUser) sheets.sync()},[authedUser]);// eslint-disable-line
  useEffect(()=>{try{localStorage.setItem("bfsa_dark",isDark?"true":"false")}catch{}},[isDark]);
  useEffect(()=>{
    if(!authedUser) return;
    logAccess({ username: authedUser, event_type: EVENT_TYPES.PAGE_VIEW, path: sub==="atleta-detail"?`atletas/${selId}`:page, detail: sub==="atleta-detail"?`Atleta #${selId}`:page });
  },[authedUser,page,sub,selId]);

  if(!authedUser) return <LoginPage onLogin={handleLogin}/>;

  const partidas = sheets.livePartidas || [];
  const calendario = sheets.liveCalendario || [];
  const videos = sheets.liveVideos || [];
  const individual = sheets.liveIndividual || [];
  const serieBLive = sheets.liveSerieB || null;

  const proxAdv = calendario.length > 0 ? (() => {
    const pending = calendario.find(c => !c.adv_ok);
    const match = pending || calendario[0];
    const mergedForPct = [...FIXED_CHECKLIST.map(f=>{const s=advChecklist.find(c=>c.label===f.label&&c.fixed);return s||{...f,done:false};}),...advChecklist.filter(c=>!c.fixed)];
    const isDone = (c)=>{const p=c.produzido!=null?!!c.produzido:!!c.done;const a=c.apresentado!=null?!!c.apresentado:!!c.done;return p && a;};
    const checkDone = mergedForPct.filter(isDone).length;
    const checkTotal = mergedForPct.length;
    const pct = checkTotal > 0 ? Math.round((checkDone / checkTotal) * 100) : (match.adv_ok ? 100 : 0);
    return { nome: match.adv, data: match.data, comp: `${match.comp} ${match.rodada}`, form: "", escudo: match.escudo || "", progresso: pct };
  })() : null;

  const addTarefa=(t)=>{addTarefaDB(t);setShowAddTarefa(false)};
  const updateTarefa=(id,updates)=>updateTarefaDB(id,updates);
  const removeTarefa=(id)=>removeTarefaDB(id);

  const nav=(target,id)=>{
    if(target==="atleta-detail"){setSub("atleta-detail");setSelId(id)}
    else{setPage(target);setSub(null);setSelId(null)}
  };
  const goBack=()=>{setSub(null);setSelId(null);setPage("atletas")};
  const atrasadas=tarefas.filter(t=>t.status==="atrasada").length;

  const renderPage=()=>{
    if(isAthlete) {
      return <AtletaDetailPage id={athleteData.id} videos={videos} partidas={partidas} individual={individual} calendario={calendario} athleteMode/>;
    }
    if(sub==="atleta-detail") return <AtletaDetailPage id={selId} onBack={goBack} videos={videos} partidas={partidas} individual={individual} calendario={calendario}/>;
    switch(page){
      case "dashboard": return <DashboardPage nav={nav} tarefas={tarefas} videos={videos} partidas={partidas} proxAdv={proxAdv} individual={individual}/>;
      case "modelo-jogo": return <ModeloJogoPage/>;
      case "adversario": return <AdversarioPage partidas={partidas} calendario={calendario} proxAdv={proxAdv} checklist={advChecklist} setChecklist={setAdvChecklist} advLinks={advLinks} setAdvLinks={setAdvLinks}/>;
      case "prelecao": return <PrelecaoPage videos={videos} proxAdv={proxAdv} checklist={advChecklist} advLinks={advLinks} partidas={partidas}/>;
      case "partidas": return <PartidasPage videos={videos} partidas={partidas} calendario={calendario}/>;
      case "bolas-paradas": return <BolasParadasPage videos={videos} partidas={partidas} calendario={calendario} individual={individual} proxAdv={proxAdv}/>;
      case "treinos": return <TreinosPage videos={videos} partidas={partidas} calendario={calendario}/>;
      case "serie-b": return <SerieBPage liveRows={serieBLive}/>;
      case "atletas": return <AtletasPage nav={nav} individual={individual}/>;
      case "videos": return <VideosPage videos={videos} partidas={partidas} calendario={calendario}/>;
      case "analistas": return <AnalistasPage tarefas={tarefas} addTarefa={addTarefa} updateTarefa={updateTarefa} removeTarefa={removeTarefa} showAddTarefa={showAddTarefa} setShowAddTarefa={setShowAddTarefa}/>;
      case "indicacoes": return <IndicacoesPage indicacoes={indicacoes} addIndicacao={addIndicacao} updateIndicacao={updateIndicacao} removeIndicacao={removeIndicacao}/>;
      case "protocolos": return <ProtocolosPage/>;
      case "controle-acesso": return <ControleAcessoPage authedUser={authedUser}/>;
      default: return <DashboardPage nav={nav} tarefas={tarefas} videos={videos} partidas={partidas} proxAdv={proxAdv} individual={individual}/>;
    }
  };

  const allItems=NAV.flatMap(s=>s.items);
  const pageTitle=sub==="atleta-detail"?(ATLETAS.find(a=>a.id===selId)?.nome||"Atleta"):allItems.find(n=>n.id===page)?.label||"Dashboard";
  const toggleSection=(s)=>setCollapsed(p=>({...p,[s]:!p[s]}));

  const watermarkLabel = getDisplayName(authedUser) || authedUser;

  // Athlete-only layout: no sidebar, clean header with logo + logout
  if(isAthlete) return (
    <div style={{minHeight:"100vh",background:C.bg,fontFamily:font,color:C.text,transition:"background 0.3s ease, color 0.3s ease"}}>
      <WatermarkOverlay user={watermarkLabel} isDark={isDark}/>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400&family=Inter:wght@300;400;500;600;700&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        ::-webkit-scrollbar{width:5px}::-webkit-scrollbar-track{background:${C.bg}}::-webkit-scrollbar-thumb{background:${isDark?"rgba(255,255,255,0.12)":"rgba(0,0,0,0.15)"};border-radius:3px}::-webkit-scrollbar-thumb:hover{background:${C.gold}44}
        @keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
        body{transition:background 0.3s ease}
      `}</style>
      {/* ATHLETE HEADER */}
      <div style={{background:C.bgSidebar,backdropFilter:"blur(20px)",WebkitBackdropFilter:"blur(20px)",borderBottom:`1px solid ${C.border}`,padding:"12px 24px",display:"flex",alignItems:"center",justifyContent:"space-between",position:"sticky",top:0,zIndex:10}}>
        <div style={{display:"flex",alignItems:"center",gap:12}}>
          <img src="/3154_imgbank_1685113109.png" alt="Botafogo FC" style={{width:32,height:32,objectFit:"contain"}} onError={e=>{e.target.style.display="none"}}/>
          <div>
            <div style={{fontFamily:fontD,fontSize:15,fontWeight:700,color:C.gold,textTransform:"uppercase",letterSpacing:"0.12em",lineHeight:1}}>BFSA</div>
            <div style={{fontFamily:font,fontSize:8,color:C.textDim,textTransform:"uppercase",letterSpacing:"0.15em"}}>Portal do Atleta</div>
          </div>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:12}}>
          {athleteData&&<div style={{display:"flex",alignItems:"center",gap:8}}>
            {athleteData.foto&&<img src={athleteData.foto} alt={athleteData.nome} style={{width:28,height:28,borderRadius:"50%",objectFit:"cover",border:`2px solid ${C.gold}`}} onError={e=>{e.target.style.display="none"}}/>}
            <div>
              <div style={{fontFamily:fontD,fontSize:11,fontWeight:700,color:C.text,lineHeight:1}}>{athleteData.nome}</div>
              <div style={{fontFamily:font,fontSize:8,color:C.textDim}}>#{athleteData.num} · {athleteData.pos}</div>
            </div>
          </div>}
          <div style={{width:1,height:20,background:C.border,margin:"0 4px"}}/>
          <button onClick={()=>setIsDark(d=>!d)} style={{background:"none",border:`1px solid ${C.border}`,borderRadius:6,cursor:"pointer",padding:"6px 8px",display:"flex",alignItems:"center",gap:4}}>
            {isDark?<Sun size={12} color={C.yellow}/>:<Moon size={12} color={C.gold}/>}
            <span style={{fontFamily:font,fontSize:9,color:C.textMid,fontWeight:500}}>{isDark?"Claro":"Escuro"}</span>
          </button>
          <button onClick={sheets.sync} disabled={sheets.loading} style={{background:sheets.loading?C.bgInput:C.goldDim,border:`1px solid ${C.border}`,borderRadius:6,cursor:sheets.loading?"wait":"pointer",padding:"6px 8px",display:"flex",alignItems:"center",gap:4}}>
            <RefreshCw size={10} color={C.gold} style={{animation:sheets.loading?"spin 1s linear infinite":"none"}}/>
            <span style={{fontFamily:font,fontSize:9,color:C.gold,fontWeight:500}}>{sheets.loading?"Sincronizando...":"Sync"}</span>
          </button>
          <button onClick={handleLogout} title="Sair" style={{background:"none",border:`1px solid ${C.border}`,cursor:"pointer",padding:"6px 8px",borderRadius:6,display:"flex",alignItems:"center",gap:4}} onMouseEnter={e=>e.currentTarget.style.borderColor=C.red} onMouseLeave={e=>e.currentTarget.style.borderColor=C.border}>
            <XCircle size={12} color={C.red}/>
            <span style={{fontFamily:font,fontSize:9,color:C.red,fontWeight:500}}>Sair</span>
          </button>
        </div>
      </div>
      {/* ATHLETE CONTENT */}
      <div style={{maxWidth:1200,margin:"0 auto",padding:"24px 20px"}}>
        {renderPage()}
      </div>
    </div>
  );

  return (
    <div style={{minHeight:"100vh",background:C.bg,fontFamily:font,color:C.text,display:"flex",transition:"background 0.3s ease, color 0.3s ease"}}>
      <WatermarkOverlay user={watermarkLabel} isDark={isDark}/>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400&family=Inter:wght@300;400;500;600;700&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        ::-webkit-scrollbar{width:5px}::-webkit-scrollbar-track{background:${C.bg}}::-webkit-scrollbar-thumb{background:${isDark?"rgba(255,255,255,0.12)":"rgba(0,0,0,0.15)"};border-radius:3px}::-webkit-scrollbar-thumb:hover{background:${C.gold}44}
        @keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
        body{transition:background 0.3s ease}
      `}</style>

      {/* SIDEBAR */}
      <div style={{width:210,minHeight:"100vh",background:C.bgSidebar,backdropFilter:"blur(20px)",WebkitBackdropFilter:"blur(20px)",borderRight:`1px solid ${C.border}`,display:"flex",flexDirection:"column",position:"fixed",left:0,top:0,bottom:0,zIndex:10,overflowY:"auto",transition:"background 0.3s ease, border-color 0.3s ease"}}>
        <div style={{padding:"16px 14px",borderBottom:`1px solid ${C.border}`,display:"flex",alignItems:"center",gap:10}}>
          <img src="/3154_imgbank_1685113109.png" alt="Botafogo FC" style={{width:36,height:36,objectFit:"contain"}} onError={e=>{e.target.style.display="none"}}/>
          <div>
            <div style={{fontFamily:fontD,fontSize:16,fontWeight:700,color:C.gold,textTransform:"uppercase",letterSpacing:"0.12em",lineHeight:1}}>BFSA</div>
            <div style={{fontFamily:font,fontSize:8,color:C.textDim,textTransform:"uppercase",letterSpacing:"0.15em"}}>Análise de Desempenho</div>
          </div>
        </div>
        <div style={{padding:"8px 6px",flex:1}}>
          {NAV.map(section=>(
            <div key={section.section} style={{marginBottom:4}}>
              <button onClick={()=>toggleSection(section.section)} style={{width:"100%",display:"flex",alignItems:"center",justifyContent:"space-between",padding:"6px 8px",background:"none",border:"none",cursor:"pointer",fontFamily:font,fontSize:9,color:C.textDim,textTransform:"uppercase",letterSpacing:"0.12em",fontWeight:700}}>
                {section.section}
                {collapsed[section.section]?<ChevronRight size={10}/>:<ChevronDown size={10}/>}
              </button>
              {!collapsed[section.section]&&section.items.map(item=>{
                const active=page===item.id&&!sub;
                const I=item.icon;
                return <button key={item.id} onClick={()=>nav(item.id)} style={{width:"100%",display:"flex",alignItems:"center",gap:8,padding:"7px 10px",marginBottom:1,borderRadius:4,border:"none",cursor:"pointer",background:active?C.goldDim:"transparent",color:active?C.gold:C.textDim,fontFamily:font,fontSize:11,fontWeight:active?700:500,textAlign:"left",transition:"all 0.12s"}} onMouseEnter={e=>{if(!active){e.currentTarget.style.color=C.text;e.currentTarget.style.background=C.bgCardHover}}} onMouseLeave={e=>{if(!active){e.currentTarget.style.color=C.textDim;e.currentTarget.style.background="transparent"}}}>
                  <I size={14}/>
                  <span style={{flex:1}}>{item.label}</span>
                  {item.id==="analistas"&&atrasadas>0&&<span style={{width:16,height:16,borderRadius:"50%",background:C.red,color:"#fff",fontSize:9,fontWeight:700,display:"flex",alignItems:"center",justifyContent:"center"}}>{atrasadas}</span>}
                  {item.id==="adversario"&&proxAdv&&proxAdv.progresso<100&&<span style={{width:16,height:16,borderRadius:"50%",background:C.yellow,color:C.bg,fontSize:9,fontWeight:700,display:"flex",alignItems:"center",justifyContent:"center"}}>!</span>}
                </button>;
              })}
            </div>
          ))}
        </div>
        <div style={{padding:"10px 14px",borderTop:`1px solid ${C.border}`}}>
          <button onClick={()=>setIsDark(d=>!d)} style={{width:"100%",padding:"7px 8px",background:isDark?C.bgInput:`${C.gold}10`,border:`1px solid ${C.border}`,borderRadius:6,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:6,marginBottom:8,transition:"all 0.2s ease"}}>
            {isDark?<Sun size={12} color={C.yellow}/>:<Moon size={12} color={C.gold}/>}
            <span style={{fontFamily:font,fontSize:10,color:C.textMid,fontWeight:500}}>{isDark?"Modo Claro":"Modo Escuro"}</span>
          </button>
          <button onClick={sheets.sync} disabled={sheets.loading} style={{width:"100%",padding:"6px 8px",background:sheets.loading?C.bgInput:C.goldDim,border:`1px solid ${C.border}`,borderRadius:6,cursor:sheets.loading?"wait":"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:6,marginBottom:6}}>
            <RefreshCw size={10} color={C.gold} style={{animation:sheets.loading?"spin 1s linear infinite":"none"}}/>
            <span style={{fontFamily:font,fontSize:9,color:C.gold,fontWeight:500}}>{sheets.loading?"Sincronizando...":"Sync Google Sheets"}</span>
          </button>
          {sheets.lastSync && <div style={{fontFamily:font,fontSize:8,color:C.green,textAlign:"center"}}>✓ {sheets.lastSync}</div>}
          {sheets.error && <div style={{fontFamily:font,fontSize:8,color:C.red,textAlign:"center",wordBreak:"break-all"}}>✗ {sheets.error}</div>}
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginTop:6}}>
            <div>
              <div style={{fontFamily:font,fontSize:9,color:C.textDim}}>
                <User size={9} style={{marginRight:3,verticalAlign:"middle"}}/>{authedUser}
              </div>
              <div style={{fontFamily:font,fontSize:8,color:C.textDim,marginTop:1}}>{time.toLocaleDateString("pt-BR")} · {time.toLocaleTimeString("pt-BR",{hour:"2-digit",minute:"2-digit"})}</div>
            </div>
            <button onClick={handleLogout} title="Sair" style={{background:"none",border:"none",cursor:"pointer",padding:4,borderRadius:4}} onMouseEnter={e=>e.currentTarget.style.background=C.redDim} onMouseLeave={e=>e.currentTarget.style.background="none"}>
              <XCircle size={14} color={C.red}/>
            </button>
          </div>
        </div>
      </div>

      {/* MAIN */}
      <div style={{marginLeft:210,flex:1,padding:"16px 20px",minHeight:"100vh"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20,paddingBottom:12,borderBottom:`1px solid ${C.border}`}}>
          <h1 style={{fontFamily:fontD,fontSize:22,fontWeight:700,color:C.text,textTransform:"uppercase",letterSpacing:"0.06em"}}>{pageTitle}</h1>
          <div style={{fontFamily:font,fontSize:10,color:C.textDim}}></div>
        </div>
        {renderPage()}
      </div>
    </div>
  );
}
