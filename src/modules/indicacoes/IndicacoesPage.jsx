import { useState } from "react";
import { C, fontD, font } from "../../shared/design";
import { SH, Card, Badge } from "../../shared/atoms";
import {
  Plus, Send, Shield, MapPin, User, UserPlus, ExternalLink, Trash2,
} from "lucide-react";

const POSICOES = ["Goleiro","Lateral Direito","Lateral Esquerdo","Zagueiro","Volante","Meia","Atacante","Extremo","Centroavante"];
const PRIO_COLORS = {alta:C.red,media:C.yellow,baixa:C.green};
const STATUS_IND = {novo:"Novo",em_analise:"Em Análise",aprovado:"Aprovado",descartado:"Descartado"};
const STATUS_IND_COLORS = {novo:C.blue,em_analise:C.yellow,aprovado:C.green,descartado:C.red};

export default function IndicacoesPage({indicacoes=[],addIndicacao,updateIndicacao,removeIndicacao}) {
  const [showForm,setShowForm]=useState(false);
  const [form,setForm]=useState({nome:"",posicao:"",idade:"",clube_atual:"",link:"",foto_url:"",escudo_url:"",observacao:"",indicado_por:"",prioridade:"media"});
  const [filtroStatus,setFiltroStatus]=useState("todos");
  const [filtroPosicao,setFiltroPosicao]=useState("todas");

  const handleAdd=()=>{
    if(!form.nome.trim())return;
    addIndicacao({...form,status:"novo"});
    setForm({nome:"",posicao:"",idade:"",clube_atual:"",link:"",foto_url:"",escudo_url:"",observacao:"",indicado_por:"",prioridade:"media"});
    setShowForm(false);
  };

  const filtered=indicacoes.filter(ind=>{
    if(filtroStatus!=="todos"&&ind.status!==filtroStatus)return false;
    if(filtroPosicao!=="todas"&&ind.posicao!==filtroPosicao)return false;
    return true;
  });

  const counts={total:indicacoes.length,novo:indicacoes.filter(i=>i.status==="novo").length,em_analise:indicacoes.filter(i=>i.status==="em_analise").length,aprovado:indicacoes.filter(i=>i.status==="aprovado").length};

  const inputStyle={fontFamily:font,fontSize:12,color:C.text,background:C.bgInput,border:`1px solid ${C.border}`,borderRadius:6,padding:"8px 10px",outline:"none",width:"100%"};
  const selectStyle={...inputStyle,cursor:"pointer"};

  return <div>
    {/* Stats */}
    <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10,marginBottom:16}}>
      {[{label:"Total",value:counts.total,color:C.text},{label:"Novos",value:counts.novo,color:C.blue},{label:"Em Análise",value:counts.em_analise,color:C.yellow},{label:"Aprovados",value:counts.aprovado,color:C.green}].map((s,i)=>(
        <Card key={i} style={{textAlign:"center",padding:"14px 10px"}}>
          <div style={{fontFamily:fontD,fontSize:24,fontWeight:700,color:s.color}}>{s.value}</div>
          <div style={{fontFamily:font,fontSize:10,color:C.textDim,marginTop:2}}>{s.label}</div>
        </Card>
      ))}
    </div>

    {/* Filters + Add button */}
    <Card style={{marginBottom:16}}>
      <div style={{display:"flex",alignItems:"center",gap:10,flexWrap:"wrap"}}>
        <select value={filtroStatus} onChange={e=>setFiltroStatus(e.target.value)} style={{...selectStyle,width:"auto",minWidth:120}}>
          <option value="todos">Todos os Status</option>
          {Object.entries(STATUS_IND).map(([k,v])=><option key={k} value={k}>{v}</option>)}
        </select>
        <select value={filtroPosicao} onChange={e=>setFiltroPosicao(e.target.value)} style={{...selectStyle,width:"auto",minWidth:120}}>
          <option value="todas">Todas as Posições</option>
          {POSICOES.map(p=><option key={p} value={p}>{p}</option>)}
        </select>
        <div style={{flex:1}}/>
        <div onClick={()=>setShowForm(!showForm)} style={{cursor:"pointer",background:C.green,borderRadius:6,padding:"8px 14px",display:"flex",alignItems:"center",gap:6}}>
          <Plus size={14} color="#fff"/><span style={{fontFamily:font,fontSize:12,color:"#fff",fontWeight:600}}>Nova Indicação</span>
        </div>
      </div>
    </Card>

    {/* Add form */}
    {showForm&&<Card style={{marginBottom:16,border:`1px solid ${C.green}44`}}>
      <SH title="Nova Indicação de Jogador"/>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
        <div>
          <label style={{fontFamily:font,fontSize:10,color:C.textDim,marginBottom:4,display:"block"}}>Nome do Jogador *</label>
          <input value={form.nome} onChange={e=>setForm({...form,nome:e.target.value})} placeholder="Nome completo" style={inputStyle}/>
        </div>
        <div>
          <label style={{fontFamily:font,fontSize:10,color:C.textDim,marginBottom:4,display:"block"}}>Posição</label>
          <select value={form.posicao} onChange={e=>setForm({...form,posicao:e.target.value})} style={selectStyle}>
            <option value="">Selecione...</option>
            {POSICOES.map(p=><option key={p} value={p}>{p}</option>)}
          </select>
        </div>
        <div>
          <label style={{fontFamily:font,fontSize:10,color:C.textDim,marginBottom:4,display:"block"}}>Idade</label>
          <input value={form.idade} onChange={e=>setForm({...form,idade:e.target.value})} placeholder="Ex: 23" style={inputStyle}/>
        </div>
        <div>
          <label style={{fontFamily:font,fontSize:10,color:C.textDim,marginBottom:4,display:"block"}}>Clube Atual</label>
          <input value={form.clube_atual} onChange={e=>setForm({...form,clube_atual:e.target.value})} placeholder="Ex: Sport Recife" style={inputStyle}/>
        </div>
        <div>
          <label style={{fontFamily:font,fontSize:10,color:C.textDim,marginBottom:4,display:"block"}}>Link (Wyscout, Transfermarkt, etc)</label>
          <input value={form.link} onChange={e=>setForm({...form,link:e.target.value})} placeholder="https://..." style={inputStyle}/>
        </div>
        <div>
          <label style={{fontFamily:font,fontSize:10,color:C.textDim,marginBottom:4,display:"block"}}>Foto do Atleta (URL)</label>
          <input value={form.foto_url} onChange={e=>setForm({...form,foto_url:e.target.value})} placeholder="https://...foto.jpg" style={inputStyle}/>
        </div>
        <div>
          <label style={{fontFamily:font,fontSize:10,color:C.textDim,marginBottom:4,display:"block"}}>Escudo do Clube (URL)</label>
          <input value={form.escudo_url} onChange={e=>setForm({...form,escudo_url:e.target.value})} placeholder="https://...escudo.png" style={inputStyle}/>
        </div>
        <div>
          <label style={{fontFamily:font,fontSize:10,color:C.textDim,marginBottom:4,display:"block"}}>Indicado por</label>
          <input value={form.indicado_por} onChange={e=>setForm({...form,indicado_por:e.target.value})} placeholder="Nome do analista" style={inputStyle}/>
        </div>
        <div>
          <label style={{fontFamily:font,fontSize:10,color:C.textDim,marginBottom:4,display:"block"}}>Prioridade</label>
          <select value={form.prioridade} onChange={e=>setForm({...form,prioridade:e.target.value})} style={selectStyle}>
            <option value="baixa">Baixa</option>
            <option value="media">Média</option>
            <option value="alta">Alta</option>
          </select>
        </div>
        <div style={{gridColumn:"1/-1"}}>
          <label style={{fontFamily:font,fontSize:10,color:C.textDim,marginBottom:4,display:"block"}}>Observações</label>
          <textarea value={form.observacao} onChange={e=>setForm({...form,observacao:e.target.value})} placeholder="Características, pontos fortes, contexto..." rows={3} style={{...inputStyle,resize:"vertical"}}/>
        </div>
      </div>
      <div style={{display:"flex",justifyContent:"flex-end",gap:8,marginTop:12}}>
        <div onClick={()=>setShowForm(false)} style={{cursor:"pointer",background:C.bgInput,borderRadius:6,padding:"8px 16px",border:`1px solid ${C.border}`}}>
          <span style={{fontFamily:font,fontSize:12,color:C.textDim}}>Cancelar</span>
        </div>
        <div onClick={handleAdd} style={{cursor:"pointer",background:C.green,borderRadius:6,padding:"8px 16px",display:"flex",alignItems:"center",gap:6}}>
          <Send size={12} color="#fff"/><span style={{fontFamily:font,fontSize:12,color:"#fff",fontWeight:600}}>Salvar</span>
        </div>
      </div>
    </Card>}

    {/* List */}
    {filtered.length===0?(
      <Card><div style={{fontFamily:font,fontSize:12,color:C.textDim,padding:20,textAlign:"center"}}>Nenhuma indicação encontrada. Clique em "Nova Indicação" para adicionar.</div></Card>
    ):(
      filtered.map(ind=>(
        <Card key={ind.id} style={{marginBottom:8}}>
          <div style={{display:"flex",alignItems:"flex-start",gap:12}}>
            <div style={{width:48,height:48,borderRadius:"50%",background:`${STATUS_IND_COLORS[ind.status]||C.blue}22`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,border:`2px solid ${STATUS_IND_COLORS[ind.status]||C.blue}44`,overflow:"hidden"}}>
              {ind.foto_url?<img src={ind.foto_url} alt={ind.nome} style={{width:"100%",height:"100%",objectFit:"cover"}} onError={e=>{e.target.style.display="none";e.target.nextSibling.style.display="flex"}}/>:null}
              <UserPlus size={18} color={STATUS_IND_COLORS[ind.status]||C.blue} style={ind.foto_url?{display:"none"}:{}}/>
            </div>
            <div style={{flex:1,minWidth:0}}>
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}>
                <span style={{fontFamily:fontD,fontSize:15,fontWeight:700,color:C.text}}>{ind.nome}</span>
                {ind.idade&&<span style={{fontFamily:font,fontSize:10,color:C.textDim}}>{ind.idade} anos</span>}
                <Badge color={PRIO_COLORS[ind.prioridade]||C.yellow}>{ind.prioridade}</Badge>
              </div>
              <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap",marginBottom:4}}>
                {ind.posicao&&<span style={{fontFamily:font,fontSize:11,color:C.textMid,display:"flex",alignItems:"center",gap:3}}><MapPin size={10}/>{ind.posicao}</span>}
                {ind.clube_atual&&<span style={{fontFamily:font,fontSize:11,color:C.textMid,display:"flex",alignItems:"center",gap:3}}>
                  {ind.escudo_url?<img src={ind.escudo_url} alt="" style={{width:14,height:14,objectFit:"contain"}} onError={e=>{e.target.style.display="none"}}/>:<Shield size={10}/>}
                  {ind.clube_atual}
                </span>}
                {ind.indicado_por&&<span style={{fontFamily:font,fontSize:11,color:C.textDim,display:"flex",alignItems:"center",gap:3}}><User size={10}/>por {ind.indicado_por}</span>}
              </div>
              {ind.observacao&&<div style={{fontFamily:font,fontSize:11,color:C.textDim,marginTop:4,lineHeight:1.4}}>{ind.observacao}</div>}
              {ind.link&&<div style={{marginTop:6}}><a href={ind.link} target="_blank" rel="noopener noreferrer" style={{fontFamily:font,fontSize:10,color:C.blue,textDecoration:"none",display:"inline-flex",alignItems:"center",gap:4}}><ExternalLink size={10}/>Ver perfil</a></div>}
              {ind.created_at&&<div style={{fontFamily:font,fontSize:9,color:C.textDim,marginTop:4}}>{new Date(ind.created_at).toLocaleDateString("pt-BR")}</div>}
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:4,flexShrink:0}}>
              <select value={ind.status||"novo"} onChange={e=>updateIndicacao(ind.id,{status:e.target.value})} style={{fontFamily:font,fontSize:10,color:STATUS_IND_COLORS[ind.status]||C.blue,background:C.bgInput,border:`1px solid ${STATUS_IND_COLORS[ind.status]||C.blue}33`,borderRadius:4,padding:"4px 6px",cursor:"pointer",outline:"none"}}>
                {Object.entries(STATUS_IND).map(([k,v])=><option key={k} value={k}>{v}</option>)}
              </select>
              <div onClick={()=>{if(window.confirm("Remover indicação?"))removeIndicacao(ind.id)}} style={{cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",padding:"4px",borderRadius:4,background:`${C.red}11`}} title="Remover">
                <Trash2 size={12} color={C.red}/>
              </div>
            </div>
          </div>
        </Card>
      ))
    )}
  </div>;
}
