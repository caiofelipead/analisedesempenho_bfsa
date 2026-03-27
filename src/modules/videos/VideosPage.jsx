import { useState, useMemo } from "react";
import { C, fontD, font } from "../../shared/design";
import { ATLETAS } from "../../shared/constants";
import { normalizeLogin } from "../../shared/utils";
import { SearchBar, Tabs, CompLogo, Badge } from "../../shared/atoms";
import { Play, User } from "lucide-react";

export default function VideosPage({videos=[],athleteMode=false,athleteInfo=null,partidas=[],calendario=[]}) {
  const [search,setSearch]=useState("");
  const [ft,setFt]=useState("TODOS");
  const tipos=["TODOS","jogo_completo","clip_individual","analise_adversario","treino","prelecao","bola_parada","bola_parada_goleiro","modelo_jogo"];
  const tipoLabel={jogo_completo:"Jogos",clip_individual:"Individual",analise_adversario:"Adversário",treino:"Treinos",prelecao:"Preleção",bola_parada:"Bola Parada",bola_parada_goleiro:"BP Goleiro",modelo_jogo:"Modelo Jogo"};
  const filtered=videos.filter(v=>(v.titulo.toLowerCase().includes(search.toLowerCase()))&&(ft==="TODOS"||v.tipo===ft));
  const escudoMap=useMemo(()=>Object.fromEntries([...partidas,...calendario].filter(x=>x.escudo).map(x=>[x.adv?.toLowerCase(),x.escudo])),[partidas,calendario]);

  // Color palette for video thumbnails based on type
  const thumbColors={
    clip_individual:["#d4232b","#ff4757"],
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

  return <div>
    <SearchBar ph="Buscar vídeo..." val={search} onChange={setSearch}/>
    {!athleteMode&&<Tabs items={tipos.map(t=>tipoLabel[t]||t)} active={tipoLabel[ft]||ft} onChange={label=>{const key=Object.entries(tipoLabel).find(([k,v])=>v===label);setFt(key?key[0]:label==="TODOS"?"TODOS":label);}}/>}
    {videos.length===0&&<div style={{fontFamily:font,fontSize:12,color:C.textDim,padding:20,textAlign:"center",background:C.bgCard,borderRadius:6,border:`1px solid ${C.border}`}}>{athleteMode?"Nenhum vídeo individual disponível no momento.":"Nenhum vídeo carregado. Sincronize com Google Sheets para carregar os vídeos da planilha."}</div>}
    <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:14}}>
      {filtered.map(v=>{
        const videoLink = v.link || v.linkAlt || "";
        const colors = thumbColors[v.tipo] || ["#2a2a3e","#3a3a4e"];
        const advName = v.partida || v.titulo || "";
        const BFSA_ESCUDO = "/3154_imgbank_1685113109.png";
        const advEscudo = escudoMap[advName.toLowerCase()] || Object.entries(escudoMap).find(([k])=>advName.toLowerCase().includes(k))?.[1] || "";
        const escudo = advEscudo || BFSA_ESCUDO;
        return <div key={v.id} onClick={videoLink?()=>window.open(videoLink,"_blank"):undefined} style={{
          background:C.bgCard,border:`1px solid ${C.border}`,borderRadius:10,overflow:"hidden",
          cursor:videoLink?"pointer":"default",transition:"all 0.2s ease",boxShadow:"0 2px 8px rgba(0,0,0,0.15)"
        }} onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-2px)";e.currentTarget.style.boxShadow="0 6px 20px rgba(0,0,0,0.25)";e.currentTarget.style.borderColor=colors[0]+"66"}} onMouseLeave={e=>{e.currentTarget.style.transform="translateY(0)";e.currentTarget.style.boxShadow="0 2px 8px rgba(0,0,0,0.15)";e.currentTarget.style.borderColor=C.border}}>
          {/* Thumbnail cover */}
          <div style={{
            width:"100%",height:120,position:"relative",overflow:"hidden",
            background:`linear-gradient(135deg, ${colors[0]}, ${colors[1]})`
          }}>
            {/* Decorative pattern */}
            <div style={{position:"absolute",top:0,left:0,right:0,bottom:0,background:"radial-gradient(circle at 80% 20%, rgba(255,255,255,0.08) 0%, transparent 50%)"}}/>
            <div style={{position:"absolute",top:0,left:0,right:0,bottom:0,background:"radial-gradient(circle at 20% 80%, rgba(255,255,255,0.05) 0%, transparent 40%)"}}/>
            {/* Escudo do adversário ou Botafogo */}
            <img src={escudo} alt="" style={{position:"absolute",top:"50%",left:"50%",transform:"translate(-50%,-50%)",width:64,height:64,objectFit:"contain",opacity:0.15,filter:"brightness(2)"}} onError={e=>{e.target.style.display="none"}}/>
            {/* Stripe accent */}
            <div style={{position:"absolute",bottom:0,left:0,right:0,height:3,background:`linear-gradient(90deg, ${C.gold}, ${colors[0]})`}}/>
            {/* Play button */}
            <div style={{position:"absolute",top:"50%",left:"50%",transform:"translate(-50%,-50%)",width:48,height:48,borderRadius:"50%",background:"rgba(0,0,0,0.45)",backdropFilter:"blur(4px)",display:"flex",alignItems:"center",justifyContent:"center",border:"2px solid rgba(255,255,255,0.2)",transition:"all 0.2s"}}>
              <Play size={20} color="#fff" fill="#fff" style={{marginLeft:2}}/>
            </div>
            {/* Duration badge */}
            {v.dur&&<span style={{position:"absolute",bottom:8,right:8,fontFamily:font,fontSize:10,color:"#fff",background:"rgba(0,0,0,0.65)",padding:"2px 8px",borderRadius:4,fontWeight:600,backdropFilter:"blur(4px)"}}>{v.dur}</span>}
            {/* Platform badge on thumbnail */}
            {v.plat&&<span style={{position:"absolute",top:8,left:8,fontFamily:fontD,fontSize:9,color:"#fff",background:"rgba(0,0,0,0.55)",padding:"2px 8px",borderRadius:4,fontWeight:700,letterSpacing:"0.05em",backdropFilter:"blur(4px)",textTransform:"uppercase"}}>{platIcon[v.plat]||v.plat}</span>}
            {/* Link indicator */}
            {videoLink&&<span style={{position:"absolute",top:8,right:8,fontFamily:font,fontSize:8,color:"#4ade80",background:"rgba(0,0,0,0.55)",padding:"2px 6px",borderRadius:4,fontWeight:600,backdropFilter:"blur(4px)",display:"flex",alignItems:"center",gap:3}}>
              <span style={{width:5,height:5,borderRadius:"50%",background:"#4ade80",display:"inline-block"}}/>LINK
            </span>}
            {/* Type label overlay */}
            <div style={{position:"absolute",bottom:8,left:8,fontFamily:fontD,fontSize:9,color:"rgba(255,255,255,0.7)",textTransform:"uppercase",letterSpacing:"0.1em",fontWeight:600}}>{tipoLabel[v.tipo]||v.tipo}</div>
          </div>
          {/* Info section */}
          <div style={{padding:"12px 14px"}}>
            <div style={{fontFamily:font,fontSize:13,color:C.text,fontWeight:600,marginBottom:6,lineHeight:1.3}}>{v.titulo}</div>
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
              <img src={escudo} alt="" style={{width:16,height:16,objectFit:"contain",flexShrink:0}} onError={e=>{e.target.style.display="none"}}/>
              {v.data&&<span style={{fontFamily:font,fontSize:9,color:C.textDim,display:"inline-flex",alignItems:"center",gap:3}}>{v.data}{v.comp&&<><CompLogo comp={v.comp} size={10}/> {v.comp}</>}{v.rodada?` · ${v.rodada}`:""}</span>}
            </div>
          </div>
        </div>;
      })}
    </div>
  </div>;
}
