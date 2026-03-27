import { useState } from "react";
import { C, fontD, font } from "../../shared/design";
import { ATRIBUICOES_TAREFA } from "../../shared/constants";
import { SH, Card, Badge, PrioBadge } from "../../shared/atoms";
import {
  AlertTriangle, Plus, CheckCircle, XCircle, RefreshCw, Clock,
} from "lucide-react";

function AddTarefaForm({onAdd,onCancel}) {
  const [titulo,setTitulo]=useState("");
  const [analista,setAnalista]=useState("Semir");
  const [prazo,setPrazo]=useState("");
  const [prio,setPrio]=useState("media");
  const [atribuicao,setAtribuicao]=useState("analise_adversario");
  const [atribuicaoCustom,setAtribuicaoCustom]=useState("");
  const submit=()=>{if(!titulo.trim())return;const tipoFinal=atribuicao==="outro"?atribuicaoCustom.trim()||"outro":atribuicao;onAdd({titulo,analista,prazo,prio,tipo:tipoFinal,status:"pendente"})};
  const labelStyle={fontFamily:font,fontSize:9,color:C.textDim,marginBottom:3,textTransform:"uppercase"};
  const inputStyle={width:"100%",padding:"6px 8px",background:C.bgInput,border:`1px solid ${C.border}`,borderRadius:4,color:C.text,fontFamily:font,fontSize:11,outline:"none"};
  const selectStyle={width:"100%",padding:"6px 8px",background:C.bgInput,border:`1px solid ${C.border}`,borderRadius:4,color:C.text,fontFamily:font,fontSize:11};
  return <Card style={{marginBottom:12,border:`1px solid ${C.gold}44`}}>
    <SH title="Nova Tarefa"/>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:8}}>
      <div><div style={labelStyle}>Título</div><input value={titulo} onChange={e=>setTitulo(e.target.value)} style={inputStyle} placeholder="Descrição da tarefa..."/></div>
      <div><div style={labelStyle}>Analista</div><select value={analista} onChange={e=>setAnalista(e.target.value)} style={selectStyle}><option value="Semir">Semir</option><option value="Cassio">Cassio</option><option value="Caio">Caio</option></select></div>
      <div><div style={labelStyle}>Atribuição</div><select value={atribuicao} onChange={e=>setAtribuicao(e.target.value)} style={selectStyle}>{ATRIBUICOES_TAREFA.map(a=><option key={a.value} value={a.value}>{a.label}</option>)}</select></div>
      <div><div style={labelStyle}>Prioridade</div><select value={prio} onChange={e=>setPrio(e.target.value)} style={selectStyle}><option value="urgente">Urgente</option><option value="alta">Alta</option><option value="media">Média</option><option value="baixa">Baixa</option></select></div>
      {atribuicao==="outro"&&<div style={{gridColumn:"1 / -1"}}><div style={labelStyle}>Especificar Atribuição</div><input value={atribuicaoCustom} onChange={e=>setAtribuicaoCustom(e.target.value)} style={inputStyle} placeholder="Descreva a atribuição..."/></div>}
      <div><div style={labelStyle}>Prazo</div><input value={prazo} onChange={e=>setPrazo(e.target.value)} style={inputStyle} placeholder="dd/mm"/></div>
    </div>
    <div style={{display:"flex",gap:8,justifyContent:"flex-end"}}>
      <button onClick={onCancel} style={{padding:"5px 12px",background:"transparent",border:`1px solid ${C.border}`,borderRadius:4,color:C.textDim,fontFamily:font,fontSize:10,cursor:"pointer"}}>Cancelar</button>
      <button onClick={submit} style={{padding:"5px 12px",background:C.gold,border:"none",borderRadius:4,color:C.bg,fontFamily:font,fontSize:10,fontWeight:700,cursor:"pointer"}}>Adicionar</button>
    </div>
  </Card>;
}

export default function AnalistasPage({tarefas=[],addTarefa,updateTarefa,removeTarefa,showAddTarefa,setShowAddTarefa}) {
  const atrasadas=tarefas.filter(t=>t.status==="atrasada");
  return <div>
    {atrasadas.length>0&&<Card style={{backgroundImage:`linear-gradient(135deg,${C.redDim} 0%,transparent 40%)`,border:`1px solid ${C.red}33`}}>
      <SH title="Tarefas Atrasadas" count={atrasadas.length}/>
      {atrasadas.map(t=>(
        <div key={t.id} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 12px",borderRadius:4,border:`1px solid ${C.red}22`,background:`${C.red}08`,marginBottom:4}}>
          <AlertTriangle size={16} color={C.red}/>
          <div style={{flex:1}}>
            <div style={{fontFamily:font,fontSize:12,color:C.text,fontWeight:600}}>{t.titulo}</div>
            <div style={{fontFamily:font,fontSize:10,color:C.textDim}}><span style={{color:C.red,fontWeight:700}}>{t.analista}</span> · Prazo: {t.prazo}</div>
          </div>
          <PrioBadge p={t.prio}/>
        </div>
      ))}
    </Card>}
    {showAddTarefa&&<AddTarefaForm onAdd={addTarefa} onCancel={()=>setShowAddTarefa(false)}/>}
    <Card style={{marginTop:16}}>
      <SH title="Todas as Tarefas" count={tarefas.length} action="Nova Tarefa" onAction={()=>setShowAddTarefa(true)}/>
      {tarefas.length===0&&<div style={{fontFamily:font,fontSize:12,color:C.textDim,padding:16,textAlign:"center"}}>Nenhuma tarefa cadastrada. Clique em "Nova Tarefa" para adicionar.</div>}
      {tarefas.map(t=>{
        const sc={concluida:C.green,em_andamento:C.yellow,pendente:C.textDim,atrasada:C.red};
        const atribLabel=(ATRIBUICOES_TAREFA.find(a=>a.value===t.tipo)||{}).label||t.tipo||"";
        const isDone=t.status==="concluida";
        return <div key={t.id} style={{display:"flex",alignItems:"center",gap:8,padding:"8px 10px",borderRadius:4,border:`1px solid ${isDone?C.green+"33":C.border}`,marginBottom:4,opacity:isDone?0.7:1}}>
          <div style={{width:8,height:8,borderRadius:"50%",background:sc[t.status]||C.textDim,cursor:"pointer",flexShrink:0}} onClick={()=>{const next={pendente:"em_andamento",em_andamento:"concluida",concluida:"pendente",atrasada:"em_andamento"};updateTarefa(t.id,{status:next[t.status]||"pendente"})}} title="Clique para mudar status"/>
          <div style={{flex:1,minWidth:0}}>
            <div style={{fontFamily:font,fontSize:11,color:C.text,textDecoration:isDone?"line-through":"none"}}>{t.titulo}</div>
            <div style={{fontFamily:font,fontSize:9,color:C.textDim}}>{t.analista} · {t.prazo}{atribLabel?` · ${atribLabel}`:""}</div>
          </div>
          <Badge color={sc[t.status]}>{(t.status||"pendente").replace("_"," ")}</Badge>
          <PrioBadge p={t.prio}/>
          {!isDone&&<button onClick={()=>updateTarefa(t.id,{status:"concluida"})} title="Marcar como feito" style={{background:"none",border:`1px solid ${C.green}44`,borderRadius:4,cursor:"pointer",padding:"2px 6px",display:"flex",alignItems:"center",gap:3}}><CheckCircle size={12} color={C.green}/><span style={{fontFamily:font,fontSize:9,color:C.green,fontWeight:600}}>Feito</span></button>}
          {isDone&&<button onClick={()=>updateTarefa(t.id,{status:"pendente"})} title="Reabrir tarefa" style={{background:"none",border:`1px solid ${C.yellow}44`,borderRadius:4,cursor:"pointer",padding:"2px 6px",display:"flex",alignItems:"center",gap:3}}><RefreshCw size={12} color={C.yellow}/><span style={{fontFamily:font,fontSize:9,color:C.yellow,fontWeight:600}}>Reabrir</span></button>}
          <button onClick={()=>removeTarefa(t.id)} style={{background:"none",border:"none",cursor:"pointer",padding:2}}><XCircle size={14} color={C.red}/></button>
        </div>;
      })}
    </Card>
  </div>;
}
