import { useState, useMemo } from "react";
import { C, fontD, font } from "../../shared/design";
import { FIXED_CHECKLIST } from "../../shared/constants";
import { SH, Card, Badge, ResBadge, Escudo, ProgressBar, CompLogo } from "../../shared/atoms";
import {
  CheckCircle, Circle, Crosshair, Edit3, Trash2, Plus, Lock,
  Home, Plane, Link2, ExternalLink,
} from "lucide-react";

export default function AdversarioPage({partidas=[],calendario=[],proxAdv,checklist,setChecklist,advLinks={},setAdvLinks}) {
  const escudoMap=Object.fromEntries([...partidas,...calendario].filter(x=>x.escudo).map(x=>[x.adv,x.escudo]));
  const [editingIdx,setEditingIdx]=useState(null);
  const [editVal,setEditVal]=useState("");
  const [newItem,setNewItem]=useState("");
  const [editingLink,setEditingLink]=useState(null);
  const [linkVal,setLinkVal]=useState("");

  // Merge fixed items with user-added items; fixed items always appear first
  const mergedChecklist = useMemo(()=>{
    const hydrate = (item, base) => {
      const produzido = item?.produzido != null ? !!item.produzido : !!item?.done;
      const apresentado = item?.apresentado != null ? !!item.apresentado : !!item?.done;
      return {...base, ...item, produzido, apresentado, done: produzido && apresentado};
    };
    const fixed = FIXED_CHECKLIST.map(f=>{
      const saved = checklist.find(c=>c.label===f.label&&c.fixed);
      return saved ? hydrate(saved,{fixed:true}) : {...f,produzido:false,apresentado:false,done:false};
    });
    const custom = checklist.filter(c=>!c.fixed).map(c=>hydrate(c,{fixed:false}));
    return [...fixed,...custom];
  },[checklist]);

  const syncChecklist=(updated)=>{setChecklist(updated);};
  const toggleField=(i,field)=>{const u=[...mergedChecklist];const next={...u[i],[field]:!u[i][field]};next.done = !!next.produzido && !!next.apresentado;u[i]=next;syncChecklist(u);};
  const removeItem=(i)=>{if(mergedChecklist[i].fixed)return;syncChecklist(mergedChecklist.filter((_,idx)=>idx!==i));};
  const addItem=()=>{if(newItem.trim()){syncChecklist([...mergedChecklist,{label:newItem.trim(),produzido:false,apresentado:false,done:false,fixed:false}]);setNewItem("");}};
  const startEdit=(i)=>{if(mergedChecklist[i].fixed)return;setEditingIdx(i);setEditVal(mergedChecklist[i].label);};
  const saveEdit=(i)=>{if(editVal.trim()){const u=[...mergedChecklist];u[i]={...u[i],label:editVal.trim()};syncChecklist(u);}setEditingIdx(null);};
  const doneCount=mergedChecklist.filter(c=>c.done).length;

  const ToggleChip = ({active,label,onClick,color})=>(
    <div onClick={onClick} title={label} style={{display:"flex",alignItems:"center",gap:4,cursor:"pointer",padding:"2px 6px",borderRadius:10,border:`1px solid ${active?color:C.border}`,background:active?`${color}18`:"transparent",transition:"all 0.15s"}}>
      {active?<CheckCircle size={11} color={color}/>:<Circle size={11} color={C.textDim}/>}
      <span style={{fontFamily:font,fontSize:9,color:active?color:C.textDim,fontWeight:600,textTransform:"uppercase",letterSpacing:"0.04em"}}>{label}</span>
    </div>
  );
  return <div>
    {proxAdv && <Card style={{marginBottom:16,backgroundImage:`linear-gradient(135deg,${C.redDim} 0%,transparent 50%)`}}>
      <SH title="Em Andamento — Próximo Jogo"/>
      <div style={{display:"flex",alignItems:"center",gap:20}}>
        <div style={{width:64,height:64,borderRadius:"50%",background:`${C.red}22`,display:"flex",alignItems:"center",justifyContent:"center",border:`2px solid ${C.red}44`,overflow:"hidden"}}>
          {proxAdv.escudo?<img src={proxAdv.escudo} alt={proxAdv.nome} style={{width:44,height:44,objectFit:"contain"}} onError={e=>{e.target.style.display="none"}}/>:<Crosshair size={28} color={C.red}/>}
        </div>
        <div style={{flex:1}}>
          <div style={{fontFamily:fontD,fontSize:26,color:C.text,fontWeight:700}}>{proxAdv.nome}</div>
          <div style={{fontFamily:font,fontSize:12,color:C.textDim,display:"flex",alignItems:"center",gap:4}}><CompLogo comp={proxAdv.comp} size={16}/>{proxAdv.comp} · {proxAdv.data} · Formação esperada: {proxAdv.form}</div>
          <div style={{marginTop:10,display:"flex",alignItems:"center",gap:10}}>
            <ProgressBar pct={proxAdv.progresso} color={proxAdv.progresso>=80?C.green:C.yellow}/>
            <span style={{fontFamily:fontD,fontSize:16,color:C.yellow}}>{proxAdv.progresso}%</span>
          </div>
        </div>
      </div>
    </Card>}
    <Card style={{marginBottom:16}}>
      <SH title="Checklist — Análise de Adversário" count={`${doneCount}/${mergedChecklist.length}`}/>
      <div style={{marginBottom:10}}>
        <ProgressBar pct={mergedChecklist.length?Math.round((doneCount/mergedChecklist.length)*100):0} color={doneCount===mergedChecklist.length?C.green:C.yellow}/>
      </div>
      {mergedChecklist.map((item,i)=>(
        <div key={item.fixed?`fixed-${i}`:i} style={{display:"flex",alignItems:"center",gap:8,padding:"6px 0",borderBottom:i<mergedChecklist.length-1?`1px solid ${C.border}08`:"none"}} onMouseEnter={e=>e.currentTarget.style.background=C.bgCardHover} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
          <div style={{display:"flex",gap:4,flexShrink:0}}>
            <ToggleChip active={!!item.produzido} label="Produzido" color={C.yellow} onClick={()=>toggleField(i,"produzido")}/>
            <ToggleChip active={!!item.apresentado} label="Apresentado" color={C.green} onClick={()=>toggleField(i,"apresentado")}/>
          </div>
          {editingIdx===i?(
            <input value={editVal} onChange={e=>setEditVal(e.target.value)} onBlur={()=>saveEdit(i)} onKeyDown={e=>{if(e.key==="Enter")saveEdit(i);if(e.key==="Escape")setEditingIdx(null);}} autoFocus style={{flex:1,fontFamily:font,fontSize:12,color:C.text,background:C.bgCard,border:`1px solid ${C.border}`,borderRadius:4,padding:"2px 6px",outline:"none"}}/>
          ):(
            <span style={{flex:1,fontFamily:font,fontSize:12,color:item.done?C.textMid:C.text,textDecoration:item.done?"line-through":"none"}}>{item.label}{item.fixed&&<Lock size={9} color={C.textDim} style={{marginLeft:6,verticalAlign:"middle",opacity:0.4}}/>}</span>
          )}
          {!item.fixed&&<Edit3 size={12} color={C.textDim} style={{cursor:"pointer",opacity:0.5,flexShrink:0}} onClick={()=>startEdit(i)}/>}
          {!item.fixed&&<Trash2 size={12} color={C.red} style={{cursor:"pointer",opacity:0.5,flexShrink:0}} onClick={()=>removeItem(i)}/>}
        </div>
      ))}
      <div style={{display:"flex",alignItems:"center",gap:8,marginTop:10}}>
        <input value={newItem} onChange={e=>setNewItem(e.target.value)} onKeyDown={e=>{if(e.key==="Enter")addItem();}} placeholder="Novo item..." style={{flex:1,fontFamily:font,fontSize:12,color:C.text,background:C.bgCard,border:`1px solid ${C.border}`,borderRadius:4,padding:"5px 8px",outline:"none"}}/>
        <div onClick={addItem} style={{cursor:"pointer",background:C.green,borderRadius:4,padding:"4px 8px",display:"flex",alignItems:"center",gap:4}}>
          <Plus size={12} color="#fff"/><span style={{fontFamily:font,fontSize:11,color:"#fff",fontWeight:600}}>Adicionar</span>
        </div>
      </div>
    </Card>
    {/* Brasileiro Série B — jogos a avaliar com links */}
    <Card>
      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:8}}>
        <CompLogo comp="Série B" size={22}/>
        <SH title="Brasileiro Série B — Jogos do Adversário"/>
      </div>
      <div style={{fontFamily:font,fontSize:11,color:C.textDim,marginBottom:12}}>
        Insira os links dos jogos do adversário que serão avaliados para a análise.
      </div>
      {calendario.filter(c=>(c.comp||"").toLowerCase().includes("série b")||(c.comp||"").toLowerCase().includes("serie b")).map((c,i)=>{
        const key = `${c.adv}_${c.rodada}`;
        const link = advLinks[key] || "";
        const isEditing = editingLink === key;
        return (
          <div key={i} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 12px",borderRadius:6,marginBottom:6,border:`1px solid ${C.border}`,background:link?`${C.green}06`:C.bgCard}}>
            <Escudo src={c.escudo||escudoMap[c.adv]} size={22}/>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontFamily:font,fontSize:12,color:C.text,fontWeight:600}}>{c.adv}</div>
              <div style={{fontFamily:font,fontSize:10,color:C.textDim,display:"flex",alignItems:"center",gap:3}}>{c.rodada} · {c.data} · {c.local==="C"?<><Home size={10} color={C.green}/> Casa</>:<><Plane size={10} color={C.blue}/> Fora</>}</div>
              {link && !isEditing && (
                <div style={{marginTop:4,display:"flex",alignItems:"center",gap:4}}>
                  <Link2 size={10} color={C.blue}/>
                  <a href={link} target="_blank" rel="noopener noreferrer" style={{fontFamily:font,fontSize:10,color:C.blue,textDecoration:"none",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",maxWidth:300}} onClick={e=>e.stopPropagation()}>{link}</a>
                </div>
              )}
              {isEditing && (
                <div style={{marginTop:4,display:"flex",alignItems:"center",gap:4}}>
                  <input value={linkVal} onChange={e=>setLinkVal(e.target.value)} placeholder="https://..." autoFocus
                    onKeyDown={e=>{if(e.key==="Enter"){setAdvLinks({...advLinks,[key]:linkVal.trim()});setEditingLink(null);}if(e.key==="Escape")setEditingLink(null);}}
                    onBlur={()=>{setAdvLinks({...advLinks,[key]:linkVal.trim()});setEditingLink(null);}}
                    style={{flex:1,fontFamily:font,fontSize:11,color:C.text,background:C.bgCard,border:`1px solid ${C.blue}44`,borderRadius:4,padding:"4px 8px",outline:"none"}}/>
                </div>
              )}
            </div>
            <div style={{display:"flex",gap:4,flexShrink:0}}>
              {link && !isEditing && (
                <div onClick={()=>window.open(link,"_blank")} style={{cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",width:28,height:28,borderRadius:4,background:`${C.blue}15`,border:`1px solid ${C.blue}33`}} title="Abrir link">
                  <ExternalLink size={13} color={C.blue}/>
                </div>
              )}
              <div onClick={()=>{setEditingLink(isEditing?null:key);setLinkVal(link);}} style={{cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",width:28,height:28,borderRadius:4,background:isEditing?`${C.yellow}22`:`${C.textDim}15`,border:`1px solid ${isEditing?C.yellow:C.textDim}33`}} title={link?"Editar link":"Adicionar link"}>
                {link?<Edit3 size={13} color={isEditing?C.yellow:C.textDim}/>:<Plus size={13} color={C.textDim}/>}
              </div>
              {link && <div onClick={()=>{setAdvLinks({...advLinks,[key]:""});}} style={{cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",width:28,height:28,borderRadius:4,background:`${C.red}15`,border:`1px solid ${C.red}33`}} title="Remover link">
                <Trash2 size={13} color={C.red}/>
              </div>}
            </div>
          </div>
        );
      })}
      {calendario.filter(c=>(c.comp||"").toLowerCase().includes("série b")||(c.comp||"").toLowerCase().includes("serie b")).length===0 && (
        <div style={{fontFamily:font,fontSize:12,color:C.textDim,padding:16,textAlign:"center",background:C.bg,borderRadius:6,border:`1px solid ${C.border}`}}>
          Nenhum jogo do Brasileiro Série B no calendário ainda. Sincronize com Google Sheets.
        </div>
      )}
    </Card>

    {/* Análises Anteriores — Paulistão (histórico) */}
    {partidas.filter(p=>p.adversarioDone).length > 0 && <Card>
      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:4}}>
        <CompLogo comp="Paulistão" size={22}/>
        <SH title="Análises Anteriores — Paulistão"/>
      </div>
      {partidas.filter(p=>p.adversarioDone).map(p=>(
        <div key={p.id} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 10px",borderRadius:4,marginBottom:4,border:`1px solid ${C.border}`}}>
          <ResBadge r={p.res}/>
          <span style={{fontFamily:fontD,fontSize:16,color:C.text,fontWeight:700,width:50,textAlign:"center"}}>{p.pl}</span>
          <Escudo src={p.escudo||escudoMap[p.adv]} size={22}/>
          <div style={{flex:1}}>
            <span style={{fontFamily:font,fontSize:12,color:C.text}}>vs {p.adv}</span>
            <span style={{fontFamily:font,fontSize:10,color:C.textDim,marginLeft:8}}>R{p.rod} · {p.data}</span>
          </div>
          <Badge color={C.green}>COMPLETA</Badge>
        </div>
      ))}
    </Card>}
  </div>;
}
