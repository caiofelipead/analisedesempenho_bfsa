import { C, fontD, font } from "../../shared/design";
import { FIXED_CHECKLIST } from "../../shared/constants";
import { SH, Card, Badge, ProgressBar, CompLogo, PlatBadge } from "../../shared/atoms";
import {
  Play, FileText, ExternalLink, CheckCircle,
} from "lucide-react";

export default function PrelecaoPage({videos=[],proxAdv,checklist=[],advLinks={},partidas=[]}) {
  const advName = proxAdv ? proxAdv.nome.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"") : "";
  const matchVideo = (v) => {
    if(!advName) return false;
    const t = (v.titulo||"").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"");
    const p = (v.partida||"").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"");
    return t.includes(advName) || p.includes(advName);
  };

  // Videos related to the next opponent
  const advVideos = videos.filter(v=>(v.tipo==="analise_adversario"||v.tipo==="jogo_completo") && matchVideo(v));
  const bpVideos = videos.filter(v=>(v.tipo==="bola_parada"||v.tipo==="bola_parada_goleiro") && matchVideo(v));
  const prelecaoVideos = videos.filter(v=>v.tipo==="prelecao" && matchVideo(v));
  const allRelated = [...prelecaoVideos,...advVideos,...bpVideos];

  // All prelecao-type videos (for "anteriores")
  const allPrelecoes = videos.filter(v=>v.tipo==="prelecao");
  // Also show adversário analysis videos as usable preleção material
  const allAdvVideos = videos.filter(v=>v.tipo==="analise_adversario"||v.tipo==="jogo_completo");

  // Checklist merged — derive done from produzido && apresentado (with legacy fallback)
  const hydrate = (item, base={}) => {
    const produzido = item?.produzido != null ? !!item.produzido : !!item?.done;
    const apresentado = item?.apresentado != null ? !!item.apresentado : !!item?.done;
    return {...base, ...item, produzido, apresentado, done: produzido && apresentado};
  };
  const mergedChecklist = (()=>{
    const fixed = FIXED_CHECKLIST.map(f=>{const s=checklist.find(c=>c.label===f.label&&c.fixed);return s?hydrate(s,{fixed:true}):{...f,produzido:false,apresentado:false,done:false};});
    const custom = checklist.filter(c=>!c.fixed).map(c=>hydrate(c,{fixed:false}));
    return [...fixed,...custom];
  })();
  const doneCount = mergedChecklist.filter(c=>c.done).length;

  const tipoColors = {analise_adversario:C.red,jogo_completo:C.blue,bola_parada:C.yellow,bola_parada_goleiro:C.cyan,prelecao:C.purple};
  const tipoLabels = {analise_adversario:"Análise Adv.",jogo_completo:"Jogo Completo",bola_parada:"Bola Parada",bola_parada_goleiro:"BP Goleiro",prelecao:"Preleção"};

  const VideoRow = ({v}) => (
    <div style={{display:"flex",alignItems:"center",gap:10,padding:"8px 10px",borderRadius:4,border:`1px solid ${C.border}`,marginBottom:4,cursor:v.link?"pointer":"default"}}
      onClick={()=>v.link&&window.open(v.link,"_blank")}
      onMouseEnter={e=>e.currentTarget.style.borderColor=C.gold} onMouseLeave={e=>e.currentTarget.style.borderColor=C.border}>
      <Play size={14} color={tipoColors[v.tipo]||C.purple}/>
      <div style={{flex:1}}>
        <div style={{fontFamily:font,fontSize:12,color:C.text}}>{v.titulo}</div>
        <div style={{fontFamily:font,fontSize:9,color:C.textDim}}>{v.data}{v.dur?` · ${v.dur}`:""}{v.responsavel?` · ${v.responsavel}`:""}</div>
      </div>
      <Badge color={tipoColors[v.tipo]||C.purple}>{tipoLabels[v.tipo]||v.tipo}</Badge>
      <PlatBadge p={v.plat}/>
    </div>
  );

  return <div>
    {/* Próxima Preleção */}
    {proxAdv ? <Card style={{marginBottom:16,backgroundImage:`linear-gradient(135deg,${C.purpleDim} 0%,transparent 50%)`}}>
      <SH title="Próxima Preleção"/>
      <div style={{display:"flex",alignItems:"center",gap:16,marginBottom:12}}>
        <div style={{width:56,height:56,borderRadius:8,background:`${C.purple}22`,display:"flex",alignItems:"center",justifyContent:"center",overflow:"hidden",border:`2px solid ${C.purple}44`}}>
          {proxAdv.escudo?<img src={proxAdv.escudo} alt={proxAdv.nome} style={{width:38,height:38,objectFit:"contain"}} onError={e=>{e.target.style.display="none"}}/>:<FileText size={22} color={C.purple}/>}
        </div>
        <div style={{flex:1}}>
          <div style={{fontFamily:fontD,fontSize:22,color:C.text,display:"flex",alignItems:"center",gap:8,fontWeight:700}}>vs {proxAdv.nome} — {proxAdv.data} <CompLogo comp={proxAdv.comp} size={18}/></div>
          <div style={{marginTop:6,display:"flex",alignItems:"center",gap:10}}>
            <ProgressBar pct={proxAdv.progresso} color={proxAdv.progresso>=80?C.green:C.yellow}/>
            <span style={{fontFamily:fontD,fontSize:14,color:proxAdv.progresso>=80?C.green:C.yellow}}>{proxAdv.progresso}%</span>
          </div>
        </div>
        <Badge color={proxAdv.progresso>=80?C.green:C.textDim}>{proxAdv.progresso>=80?"PRONTO P/ MONTAR":"AGUARDANDO ANÁLISE"}</Badge>
      </div>
    </Card> : <Card style={{marginBottom:16}}><div style={{fontFamily:font,fontSize:12,color:C.textDim,padding:20,textAlign:"center"}}>Sincronize com Google Sheets para ver a próxima preleção.</div></Card>}

    {/* Checklist da Análise */}
    {proxAdv && <Card style={{marginBottom:16}}>
      <SH title="Checklist — Materiais da Preleção" count={`${doneCount}/${mergedChecklist.length}`}/>
      <div style={{marginBottom:10}}>
        <ProgressBar pct={mergedChecklist.length?Math.round((doneCount/mergedChecklist.length)*100):0} color={doneCount===mergedChecklist.length?C.green:C.yellow}/>
      </div>
      {mergedChecklist.map((item,i)=>{
        const key = `chk-${item.label}`;
        const link = advLinks[key] || advLinks[item.label] || "";
        return <div key={i} style={{display:"flex",alignItems:"center",gap:8,padding:"6px 0",borderBottom:i<mergedChecklist.length-1?`1px solid ${C.border}08`:"none"}}>
          <div style={{width:18,height:18,borderRadius:4,border:`2px solid ${item.done?C.green:C.border}`,background:item.done?`${C.green}22`:"transparent",display:"flex",alignItems:"center",justifyContent:"center"}}>
            {item.done&&<CheckCircle size={12} color={C.green}/>}
          </div>
          <span style={{fontFamily:font,fontSize:12,color:item.done?C.green:C.text,flex:1,textDecoration:item.done?"line-through":"none",opacity:item.done?0.7:1}}>{item.label}</span>
          {link&&<a href={link} target="_blank" rel="noreferrer" style={{display:"flex",alignItems:"center",gap:3,fontFamily:font,fontSize:9,color:C.purple,textDecoration:"none",padding:"2px 6px",borderRadius:4,border:`1px solid ${C.purple}33`,background:`${C.purple}11`}} onClick={e=>e.stopPropagation()}><ExternalLink size={10}/> Link</a>}
          <Badge color={item.done?C.green:C.textDim}>{item.done?"PRONTO":"PENDENTE"}</Badge>
        </div>;
      })}
    </Card>}

    {/* Vídeos do Próximo Adversário */}
    {proxAdv && <Card style={{marginBottom:16}}>
      <SH title={`Vídeos — ${proxAdv.nome}`} count={allRelated.length}/>
      {allRelated.length===0 ? <div style={{fontFamily:font,fontSize:12,color:C.textDim,padding:16,textAlign:"center"}}>Nenhum vídeo encontrado para "{proxAdv.nome}". Verifique se há vídeos com o nome do adversário na planilha.</div>
        : allRelated.map(v=><VideoRow key={v.id} v={v}/>)}
    </Card>}

    {/* Preleções Anteriores */}
    <Card style={{marginBottom:16}}>
      <SH title="Preleções Anteriores" count={allPrelecoes.length}/>
      {allPrelecoes.length===0 ? <div style={{fontFamily:font,fontSize:12,color:C.textDim,padding:16,textAlign:"center"}}>Nenhuma preleção encontrada. Adicione vídeos com tipo "Preleção" na planilha.</div>
        : allPrelecoes.map(v=><VideoRow key={v.id} v={v}/>)}
    </Card>

    {/* Todos os Vídeos de Análise */}
    <Card>
      <SH title="Vídeos de Análise e Jogo Completo" count={allAdvVideos.length}/>
      {allAdvVideos.length===0 ? <div style={{fontFamily:font,fontSize:12,color:C.textDim,padding:16,textAlign:"center"}}>Nenhum vídeo de análise encontrado. Adicione vídeos com tipo "Análise de Adversário" ou "Jogo Completo" na planilha.</div>
        : allAdvVideos.map(v=><VideoRow key={v.id} v={v}/>)}
    </Card>
  </div>;
}
