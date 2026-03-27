import { useState } from "react";
import { C, fontD, font } from "../../shared/design";
import { ATLETAS } from "../../shared/constants";
import { SearchBar, Tabs, Card, StatusDot, Tend } from "../../shared/atoms";
import computeTendencies from "../../shared/computeTendencies";

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
  return <div>
    <SearchBar ph="Buscar atleta..." val={search} onChange={setSearch}/>
    <Tabs items={posicoes} active={fp} onChange={setFp}/>
    <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10}}>
      {filtered.map(a=>{
        const t=tendMap[a.id]||"estável";
        return <Card key={a.id} onClick={()=>nav("atleta-detail",a.id)}>
          <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:10}}>
            {a.foto?<img src={a.foto} alt={a.nome} style={{width:42,height:42,borderRadius:"50%",objectFit:"cover",border:`2px solid ${C.gold}33`}}/>:<div style={{width:42,height:42,borderRadius:"50%",background:`${C.gold}22`,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:fontD,fontSize:18,color:C.gold,fontWeight:700,border:`2px solid ${C.gold}33`}}>{a.num||"\u2014"}</div>}
            <div style={{flex:1}}>
              <div style={{fontFamily:font,fontSize:13,color:C.text,fontWeight:700}}>{a.nome}</div>
              <div style={{display:"flex",gap:4,alignItems:"center",marginTop:2}}><StatusDot s={a.status}/><span style={{fontFamily:font,fontSize:9,color:C.textDim,textTransform:"uppercase"}}>{a.status}</span></div>
            </div>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6,paddingTop:8,borderTop:`1px solid ${C.border}`}}>
            <div style={{textAlign:"center"}}><div style={{fontFamily:fontD,fontSize:16,color:C.gold}}>{a.pos}</div><div style={{fontFamily:font,fontSize:8,color:C.textDim,textTransform:"uppercase"}}>Posição</div></div>
            <div style={{textAlign:"center"}}><div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:3}}><Tend t={t}/><span style={{fontFamily:font,fontSize:10,color:C.textDim}}>{t}</span></div><div style={{fontFamily:font,fontSize:8,color:C.textDim,textTransform:"uppercase"}}>Tendência</div></div>
          </div>
        </Card>;
      })}
    </div>
  </div>;
}
