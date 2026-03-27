// ═══════════════════════════════════════════════
// SHARED UI ATOM COMPONENTS
// ═══════════════════════════════════════════════
import React from "react";
import { C, font, fontD } from "./design";
import {
  TrendingUp, TrendingDown, Minus, Search, Plus, ChevronRight,
} from "lucide-react";

// ═══════════════════════════════════════════════
// COMP LOGO HELPERS
// ═══════════════════════════════════════════════
const COMP_LOGOS = {
  "série b": "https://tmssl.akamaized.net//images/logo/header/bra2.png?lm=1731436730",
  "serie b": "https://tmssl.akamaized.net//images/logo/header/bra2.png?lm=1731436730",
  "brasileirão série b": "https://tmssl.akamaized.net//images/logo/header/bra2.png?lm=1731436730",
  "paulistão": "https://upload.wikimedia.org/wikipedia/pt/1/1c/Paulistão_2026.png",
  "paulistao": "https://upload.wikimedia.org/wikipedia/pt/1/1c/Paulistão_2026.png",
  "campeonato paulista": "https://upload.wikimedia.org/wikipedia/pt/1/1c/Paulistão_2026.png",
};
export function getCompLogo(comp) {
  if (!comp) return null;
  const c = comp.toLowerCase().trim();
  for (const [key, url] of Object.entries(COMP_LOGOS)) {
    if (c.includes(key) || key.includes(c)) return url;
  }
  return null;
}

// ═══════════════════════════════════════════════
// COMP LOGO COMPONENT
// ═══════════════════════════════════════════════
export function CompLogo({comp, size=14, style={}}) {
  const logo = getCompLogo(comp);
  if (!logo) return null;
  return <img src={logo} alt="" style={{width:size,height:size,objectFit:"contain",verticalAlign:"middle",...style}} onError={e=>{e.target.style.display="none"}}/>;
}

// ═══════════════════════════════════════════════
// UI ATOMS
// ═══════════════════════════════════════════════
export const Badge = ({children,color=C.gold,bg}) => (
  <span style={{display:"inline-flex",alignItems:"center",gap:3,padding:"2px 7px",borderRadius:3,fontSize:10,fontWeight:700,letterSpacing:"0.08em",textTransform:"uppercase",fontFamily:font,color,background:bg||`${color}22`,border:`1px solid ${color}33`}}>{children}</span>
);
export const StatusDot = ({s}) => {
  const m={ativo:C.green,lesionado:C.red,emprestado:C.yellow};
  return <span style={{display:"inline-block",width:7,height:7,borderRadius:"50%",background:m[s]||C.textDim,boxShadow:`0 0 5px ${m[s]||C.textDim}66`}}/>;
};
export const Tend = ({t}) => t==="subindo"?<TrendingUp size={13} color={C.green}/>:t==="descendo"?<TrendingDown size={13} color={C.red}/>:<Minus size={13} color={C.textDim}/>;
export const Nota = ({v}) => {
  let c=C.red; if(v>=7.5)c=C.green;else if(v>=6.5)c=C.gold;else if(v>=5.5)c=C.yellow;
  return <span style={{fontFamily:fontD,fontSize:17,fontWeight:700,color:c}}>{v.toFixed(1)}</span>;
};
export const PrioBadge = ({p}) => {
  const m={urgente:{c:C.red,l:"URGENTE"},alta:{c:C.yellow,l:"ALTA"},media:{c:C.blue,l:"MÉDIA"},baixa:{c:C.textDim,l:"BAIXA"}};
  const x=m[p]||m.media; return <Badge color={x.c}>{x.l}</Badge>;
};
export const ResBadge = ({r}) => {
  const m={V:{c:C.green,bg:C.greenDim},D:{c:C.red,bg:C.redDim},E:{c:C.yellow,bg:C.yellowDim}};
  const x=m[r]||m.E; return <Badge color={x.c} bg={x.bg}>{r}</Badge>;
};
export const Escudo = ({src,size=20}) => src ? (
  <img src={src} alt="" style={{width:size,height:size,objectFit:"contain",borderRadius:2,flexShrink:0}} onError={e=>{e.target.style.display="none"}}/>
) : null;
export const PlatBadge = ({p}) => {
  const m={youtube:"#FF0000",vimeo:"#1AB7EA",google_drive:"#0F9D58",wyscout:"#FF6B00",instat:"#6366f1"};
  return <Badge color={m[p]||C.textDim}>{p.replace("_"," ")}</Badge>;
};
export const StatCard = ({label,value,sub,icon:I,accent=C.gold}) => (
  <div style={{background:C.bgCard,backdropFilter:"blur(16px)",WebkitBackdropFilter:"blur(16px)",border:`1px solid ${C.border}`,borderRadius:10,padding:"14px 18px",display:"flex",alignItems:"center",gap:14,boxShadow:C.shadow}}>
    <div style={{width:40,height:40,borderRadius:8,background:`${accent}15`,display:"flex",alignItems:"center",justifyContent:"center"}}><I size={18} color={accent}/></div>
    <div>
      <div style={{fontSize:22,fontWeight:700,fontFamily:fontD,color:C.text,letterSpacing:"0.02em"}}>{value}</div>
      <div style={{fontSize:10,color:C.textDim,fontFamily:font,textTransform:"uppercase",letterSpacing:"0.06em",fontWeight:500}}>{label}</div>
      {sub&&<div style={{fontSize:10,color:C.textMid,fontFamily:font,marginTop:1}}>{sub}</div>}
    </div>
  </div>
);
export const SH = ({title,count,action,onAction}) => (
  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14,paddingBottom:10,borderBottom:`1px solid ${C.border}`}}>
    <div style={{display:"flex",alignItems:"center",gap:8}}>
      <h2 style={{fontFamily:fontD,fontSize:18,fontWeight:700,color:C.text,textTransform:"uppercase",letterSpacing:"0.08em",margin:0}}>{title}</h2>
      {count!==undefined&&<span style={{fontFamily:font,fontSize:10,color:C.gold,background:C.goldDim,padding:"2px 7px",borderRadius:3}}>{count}</span>}
    </div>
    {action&&<button onClick={onAction} style={{background:C.gold,color:C.bg,border:"none",padding:"5px 12px",borderRadius:4,cursor:"pointer",fontFamily:font,fontSize:10,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.05em",display:"flex",alignItems:"center",gap:4}}><Plus size={12}/>{action}</button>}
  </div>
);
export const SearchBar = ({ph,val,onChange}) => (
  <div style={{position:"relative",marginBottom:14}}>
    <Search size={14} color={C.textDim} style={{position:"absolute",left:10,top:9}}/>
    <input type="text" placeholder={ph} value={val} onChange={e=>onChange(e.target.value)} style={{width:"100%",boxSizing:"border-box",padding:"7px 10px 7px 32px",background:C.bgInput,border:`1px solid ${C.border}`,borderRadius:4,color:C.text,fontFamily:font,fontSize:12,outline:"none"}} onFocus={e=>e.target.style.borderColor=C.borderActive} onBlur={e=>e.target.style.borderColor=C.border}/>
  </div>
);
export const Tabs = ({items,active,onChange}) => (
  <div style={{display:"flex",gap:4,marginBottom:14,flexWrap:"wrap"}}>
    {items.map(t=><button key={t} onClick={()=>onChange(t)} style={{padding:"3px 10px",borderRadius:3,border:`1px solid ${active===t?C.gold:C.border}`,background:active===t?C.goldDim:"transparent",color:active===t?C.gold:C.textDim,fontFamily:font,fontSize:10,cursor:"pointer",fontWeight:600,textTransform:"uppercase",letterSpacing:"0.05em"}}>{t}</button>)}
  </div>
);
export const ProgressBar = ({pct,color=C.green}) => (
  <div style={{width:"100%",height:5,background:C.border,borderRadius:3,overflow:"hidden"}}>
    <div style={{width:`${pct}%`,height:"100%",borderRadius:3,background:color,boxShadow:`0 0 6px ${color}66`,transition:"width 0.4s ease"}}/>
  </div>
);
export const Card = ({children,onClick,style:s}) => (
  <div onClick={onClick} style={{background:C.bgCard,backdropFilter:"blur(16px)",WebkitBackdropFilter:"blur(16px)",border:`1px solid ${C.border}`,borderRadius:10,padding:16,cursor:onClick?"pointer":"default",transition:"all 0.2s ease",boxShadow:C.shadow,...s}} onMouseEnter={e=>{if(onClick){e.currentTarget.style.borderColor=C.gold;e.currentTarget.style.transform="translateY(-2px)";e.currentTarget.style.boxShadow=`${C.shadowHover}, 0 0 0 1px ${C.gold}33`}}} onMouseLeave={e=>{if(onClick){e.currentTarget.style.borderColor=C.border;e.currentTarget.style.transform="translateY(0)";e.currentTarget.style.boxShadow=C.shadow}}}>
    {children}
  </div>
);

// Mini sparkline SVG component
export const Sparkline = ({data, width=120, height=30, color}) => {
  if (!data || data.length < 2) return null;
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const range = max - min || 1;
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * width},${height - ((v - min) / range) * (height - 4) - 2}`).join(" ");
  const avg = data.reduce((s, v) => s + v, 0) / data.length;
  const avgY = height - ((avg - min) / range) * (height - 4) - 2;
  return <svg width={width} height={height} style={{display:"block"}}>
    <line x1={0} y1={avgY} x2={width} y2={avgY} stroke={`${color}44`} strokeWidth={1} strokeDasharray="3,3"/>
    <polyline fill="none" stroke={color} strokeWidth={1.5} points={pts}/>
    {data.map((v, i) => <circle key={i} cx={(i / (data.length - 1)) * width} cy={height - ((v - min) / range) * (height - 4) - 2} r={2} fill={color}/>)}
  </svg>;
};
