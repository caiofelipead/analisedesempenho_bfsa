import { useState, useMemo } from "react";
import { C, fontD, font } from "../../shared/design";
import { ATLETAS } from "../../shared/constants";
import { normalizeLogin } from "../../shared/utils";
import { SearchBar, Tabs, CompLogo, Badge } from "../../shared/atoms";
import { Play, User } from "lucide-react";

export default function VideosPage({videos=[],athleteMode=false,athleteInfo=null,partidas=[],calendario=[]}) {
  const [search,setSearch]=useState("");
  const [ft,setFt]=useState("TODOS");
  const tipos=["TODOS","jogo_completo","clip_individual","descritivo_individual","analise_adversario","treino","prelecao","bola_parada","bola_parada_goleiro","modelo_jogo"];
  const tipoLabel={jogo_completo:"Jogos",clip_individual:"Compilado",descritivo_individual:"Descritivo",analise_adversario:"Adversário",treino:"Treinos",prelecao:"Preleção",bola_parada:"Bola Parada",bola_parada_goleiro:"BP Goleiro",modelo_jogo:"Modelo Jogo"};
  const filtered=videos.filter(v=>(v.titulo.toLowerCase().includes(search.toLowerCase()))&&(ft==="TODOS"||v.tipo===ft));
  const escudoMap=useMemo(()=>Object.fromEntries([...partidas,...calendario].filter(x=>x.escudo).map(x=>[x.adv?.toLowerCase(),x.escudo])),[partidas,calendario]);

  // Color palette for video thumbnails based on type
  const thumbColors={
    clip_individual:["#d4232b","#ff4757"],
    descritivo_individual:["#4a4a4a","#6a6a6a"],
    jogo_completo:["#1a1a2e","#16213e"],
    analise_adversario:["#0f3460","#533483"],
    treino:["#1b5e20","#2e7d32"],
    prelecao:["#e65100","#ff6d00"],
    bola_parada:["#4a148c","#7b1fa2"],
    bola_parada_goleiro:["#1a237e","#283593"],
    modelo_jogo:["#01579b","#0288d1"],
  };
  // Platform icons mapping
  const platIcon={google_drive:"GD",youtube:"YT",vimeo:"VM",wyscout:"WS",instat:"IN"};

  // Extract YouTube video ID for real thumbnail preview
  const getYoutubeThumb = (url) => {
    if (!url) return null;
    const m = url.match(/(?:youtube\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?/\s]{11})/);
    return m ? `https://img.youtube.com/vi/${m[1]}/hqdefault.jpg` : null;
  };

  return <div>
    <SearchBar ph="Buscar vídeo..." val={search} onChange={setSearch}/>
    {!athleteMode&&<Tabs items={tipos.map(t=>tipoLabel[t]||t)} active={tipoLabel[ft]||ft} onChange={label=>{const key=Object.entries(tipoLabel).find(([k,v])=>v===label);setFt(key?key[0]:label==="TODOS"?"TODOS":label);}}/>}
    {videos.length===0&&<div style={{fontFamily:font,fontSize:12,color:C.textDim,padding:20,textAlign:"center",background:C.bgCard,borderRadius:6,border:`1px solid ${C.border}`}}>{athleteMode?"Nenhum vídeo individual disponível no momento.":"Nenhum vídeo carregado. Sincronize com Google Sheets para carregar os vídeos da planilha."}</div>}
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(320px,1fr))",gap:16}}>
      {filtered.map(v=>{
        const videoLink = v.link || v.linkAlt || "";
        const colors = thumbColors[v.tipo] || ["#2a2a3e","#3a3a4e"];
        const advName = (v.partida || v.titulo || "").trim();
        const advNameLow = advName.toLowerCase();
        const BFSA_ESCUDO = "/3154_imgbank_1685113109.png";
        // Try exact → substring (both directions) to find the opponent escudo
        const advEscudo = escudoMap[advNameLow]
          || Object.entries(escudoMap).find(([k])=>k && (advNameLow.includes(k) || k.includes(advNameLow)))?.[1]
          || "";
        const escudo = advEscudo || BFSA_ESCUDO;
        const hasAdvEscudo = !!advEscudo;
        const ytThumb = getYoutubeThumb(videoLink);
        const isCompilado = v.tipo === "clip_individual";
        return <div key={v.id} onClick={videoLink?()=>window.open(videoLink,"_blank"):undefined} style={{
          background:C.bgCard,border:`1px solid ${C.border}`,borderRadius:12,overflow:"hidden",
          cursor:videoLink?"pointer":"default",transition:"all 0.25s ease",boxShadow:"0 2px 10px rgba(0,0,0,0.18)"
        }} onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-4px)";e.currentTarget.style.boxShadow=`0 10px 28px rgba(0,0,0,0.35), 0 0 0 1px ${colors[0]}66`;e.currentTarget.style.borderColor=colors[0]+"88"}} onMouseLeave={e=>{e.currentTarget.style.transform="translateY(0)";e.currentTarget.style.boxShadow="0 2px 10px rgba(0,0,0,0.18)";e.currentTarget.style.borderColor=C.border}}>
          {/* Thumbnail cover — 16:9 */}
          <div style={{
            width:"100%",aspectRatio:"16 / 9",position:"relative",overflow:"hidden",
            background:`linear-gradient(135deg, ${colors[0]}, ${colors[1]})`
          }}>
            {/* Real YouTube thumbnail (if applicable) */}
            {ytThumb && <img src={ytThumb} alt="" style={{position:"absolute",inset:0,width:"100%",height:"100%",objectFit:"cover",transition:"transform 0.3s ease"}} onError={e=>{e.target.style.display="none"}}/>}
            {/* Dark gradient overlay for text legibility */}
            <div style={{position:"absolute",inset:0,background:ytThumb ? "linear-gradient(180deg, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.0) 30%, rgba(0,0,0,0.0) 60%, rgba(0,0,0,0.75) 100%)" : "transparent"}}/>
            {/* Decorative pattern (only when no thumb) */}
            {!ytThumb && <>
              <div style={{position:"absolute",inset:0,background:"radial-gradient(circle at 80% 20%, rgba(255,255,255,0.08) 0%, transparent 50%)"}}/>
              <div style={{position:"absolute",inset:0,background:"radial-gradient(circle at 20% 80%, rgba(255,255,255,0.05) 0%, transparent 40%)"}}/>
              <img src={escudo} alt="" style={{position:"absolute",top:"50%",left:"50%",transform:"translate(-50%,-50%)",width:96,height:96,objectFit:"contain",opacity:0.28,filter:"brightness(1.5) drop-shadow(0 2px 8px rgba(0,0,0,0.5))"}} onError={e=>{e.target.style.display="none"}}/>
            </>}
            {/* Opponent escudo — prominent top-right badge (only when we actually matched an opponent) */}
            {hasAdvEscudo && <div style={{position:"absolute",top:10,right:10,width:44,height:44,borderRadius:"50%",background:"rgba(255,255,255,0.95)",display:"flex",alignItems:"center",justifyContent:"center",boxShadow:"0 4px 12px rgba(0,0,0,0.4)",zIndex:4,border:"2px solid rgba(255,255,255,0.8)"}}>
              <img src={advEscudo} alt={advName} style={{width:32,height:32,objectFit:"contain"}} onError={e=>{e.currentTarget.parentElement.style.display="none"}}/>
            </div>}
            {/* Stripe accent */}
            <div style={{position:"absolute",bottom:0,left:0,right:0,height:3,background:`linear-gradient(90deg, ${C.gold}, ${colors[0]})`,zIndex:2}}/>
            {/* Play button */}
            <div style={{position:"absolute",top:"50%",left:"50%",transform:"translate(-50%,-50%)",width:58,height:58,borderRadius:"50%",background:"rgba(0,0,0,0.55)",backdropFilter:"blur(6px)",display:"flex",alignItems:"center",justifyContent:"center",border:"2px solid rgba(255,255,255,0.35)",transition:"all 0.2s",boxShadow:"0 4px 14px rgba(0,0,0,0.4)"}}>
              <Play size={24} color="#fff" fill="#fff" style={{marginLeft:3}}/>
            </div>
            {/* Duration badge */}
            {v.dur&&<span style={{position:"absolute",bottom:10,right:10,fontFamily:font,fontSize:10,color:"#fff",background:"rgba(0,0,0,0.75)",padding:"3px 8px",borderRadius:4,fontWeight:600,backdropFilter:"blur(4px)",zIndex:3}}>{v.dur}</span>}
            {/* Platform badge on thumbnail */}
            {v.plat&&<span style={{position:"absolute",top:10,left:10,fontFamily:fontD,fontSize:9,color:"#fff",background:"rgba(0,0,0,0.65)",padding:"3px 9px",borderRadius:4,fontWeight:700,letterSpacing:"0.05em",backdropFilter:"blur(4px)",textTransform:"uppercase",zIndex:3}}>{platIcon[v.plat]||v.plat}</span>}
            {/* Link indicator (moved left so it doesn't collide with the escudo) */}
            {videoLink&&<span style={{position:"absolute",top:v.plat?38:10,left:10,fontFamily:font,fontSize:8,color:"#4ade80",background:"rgba(0,0,0,0.65)",padding:"3px 7px",borderRadius:4,fontWeight:600,backdropFilter:"blur(4px)",display:"flex",alignItems:"center",gap:3,zIndex:3}}>
              <span style={{width:5,height:5,borderRadius:"50%",background:"#4ade80",display:"inline-block"}}/>LINK
            </span>}
            {/* Type label overlay */}
            <div style={{position:"absolute",bottom:10,left:10,fontFamily:fontD,fontSize:9,color:"#fff",textTransform:"uppercase",letterSpacing:"0.1em",fontWeight:700,background:`${colors[0]}ee`,padding:"3px 9px",borderRadius:4,zIndex:3,boxShadow:"0 2px 6px rgba(0,0,0,0.3)"}}>{tipoLabel[v.tipo]||v.tipo}</div>
          </div>
          {/* Info section */}
          <div style={{padding:"12px 14px"}}>
            {isCompilado && <div style={{fontFamily:font,fontSize:9,color:colors[0],fontWeight:700,textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:3}}>Compilado do Jogo</div>}
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}>
              {hasAdvEscudo && <img src={advEscudo} alt={advName} style={{width:22,height:22,objectFit:"contain",flexShrink:0}} onError={e=>{e.target.style.display="none"}}/>}
              <div style={{fontFamily:font,fontSize:13,color:C.text,fontWeight:700,lineHeight:1.3}}>
                {isCompilado && <span style={{color:C.textDim,fontWeight:500}}>vs </span>}{v.titulo}
              </div>
            </div>
            {v.atleta&&(()=>{
              const matchedAthlete = athleteInfo || ATLETAS.find(a=>normalizeLogin(a.nome)===normalizeLogin(v.atleta));
              return <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}>
                {matchedAthlete&&matchedAthlete.foto?<img src={matchedAthlete.foto} alt={v.atleta} style={{width:24,height:24,borderRadius:"50%",objectFit:"cover",border:`1.5px solid ${C.gold}`,flexShrink:0}} onError={e=>{e.target.style.display="none"}}/>:<User size={10} color={C.gold}/>}
                <div>
                  <div style={{fontFamily:font,fontSize:10,color:C.gold,fontWeight:600}}>{v.atleta}</div>
                  {matchedAthlete&&<div style={{fontFamily:font,fontSize:8,color:C.textDim}}>{matchedAthlete.pos}{matchedAthlete.num?` · #${matchedAthlete.num}`:""}</div>}
                </div>
              </div>;
            })()}
            <div style={{display:"flex",alignItems:"center",gap:6}}>
              {v.data&&<span style={{fontFamily:font,fontSize:9,color:C.textDim,display:"inline-flex",alignItems:"center",gap:3}}>{v.data}{v.comp&&<><CompLogo comp={v.comp} size={10}/> {v.comp}</>}{v.rodada?` · ${v.rodada}`:""}</span>}
            </div>
          </div>
        </div>;
      })}
    </div>
  </div>;
}
