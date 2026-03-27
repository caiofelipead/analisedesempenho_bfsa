import { C, fontD, font } from "../../shared/design";
import { parseDateBR } from "../../shared/utils";
import { SH, Card, Badge, ResBadge, Escudo, CompLogo } from "../../shared/atoms";
import { Video } from "lucide-react";

export default function PartidasPage({videos=[],partidas=[],calendario=[]}) {
  const escudoMap=Object.fromEntries([...partidas,...calendario].filter(x=>x.escudo).map(x=>[x.adv,x.escudo]));
  const sorted=[...partidas].sort((a,b)=>{
    const da=parseDateBR(a.data), db=parseDateBR(b.data);
    if(da&&db) return da-db;
    return (a.data||"").localeCompare(b.data||"");
  });
  const posVideos = (adv) => videos.filter(v=>v.partida===adv||v.tipo==="jogo_completo"&&(v.titulo||"").toLowerCase().includes(adv.toLowerCase()));
  return <div>
    <SH title="Partidas + Pós-Jogo" count={partidas.length}/>
    {partidas.length===0&&<Card><div style={{fontFamily:font,fontSize:12,color:C.textDim,padding:20,textAlign:"center"}}>Nenhuma partida carregada. Sincronize com Google Sheets.</div></Card>}
    {sorted.map((p)=>{
      const rodNum = p.rod || "";
      const matchVideos = posVideos(p.adv);
      const firstVideo = matchVideos.find(v=>v.link||v.linkAlt);
      const videoLink = firstVideo ? (firstVideo.link||firstVideo.linkAlt) : null;
      return (
      <Card key={p.id} style={{marginBottom:8,display:"flex",alignItems:"center",gap:14}}>
        <div style={{width:50,textAlign:"center"}}><ResBadge r={p.res}/></div>
        <div style={{fontFamily:fontD,fontSize:22,color:C.text,fontWeight:700,width:55,textAlign:"center"}}>{p.pl}</div>
        <Escudo src={p.escudo||escudoMap[p.adv]} size={24}/>
        <div style={{flex:1}}>
          <div style={{fontFamily:font,fontSize:13,color:C.text,fontWeight:600,display:"flex",alignItems:"center",gap:6}}>
            {p.mand?"Botafogo-SP":p.adv} vs {p.mand?p.adv:"Botafogo-SP"}
          </div>
          <div style={{fontFamily:font,fontSize:10,color:C.textDim,display:"flex",alignItems:"center",gap:4}}>
            <CompLogo comp={p.comp} size={12}/>R{rodNum} · {p.data} · {p.form}{p.xg!=null?` · xG ${p.xg.toFixed(2)}`:""}{p.xgC!=null?` / xGA ${p.xgC.toFixed(2)}`:""}{p.comp?` · ${p.comp}`:""}
          </div>
        </div>
        <div style={{display:"flex",gap:6}}>
          <span onClick={videoLink?()=>window.open(videoLink,"_blank"):undefined} style={{cursor:videoLink?"pointer":"default"}} title={videoLink?"Abrir vídeo pós-jogo":""}>
            <Badge color={p.posJogoDone?C.green:C.yellow}>{p.posJogoDone?"PÓS ✓":"PENDENTE"}</Badge>
          </span>
          <span onClick={videoLink?()=>window.open(videoLink,"_blank"):undefined} style={{cursor:videoLink?"pointer":"default"}} title={videoLink?"Abrir vídeo":""}>
            <Badge color={C.blue}><Video size={9}/> {matchVideos.length}</Badge>
          </span>
        </div>
      </Card>
    );})}
  </div>;
}
