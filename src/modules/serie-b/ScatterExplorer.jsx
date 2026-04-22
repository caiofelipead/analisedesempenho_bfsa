import { useState, useMemo } from "react";
import { C, fontD, font } from "../../shared/design";
import { Card, SH } from "../../shared/atoms";
import {
  ScatterChart, Scatter, XAxis, YAxis, ZAxis, CartesianGrid,
  ResponsiveContainer, ReferenceLine, Tooltip,
} from "recharts";
import { SERIE_B_METRICS, computeSerieBAverages, formatMetric } from "./data";

// Custom scatter point: team crest with subtle halo.
function CrestPoint(props) {
  const { cx, cy, payload } = props;
  if (cx == null || cy == null) return null;
  const size = 22;
  return (
    <g>
      <circle cx={cx} cy={cy} r={size/2 + 2} fill={C.bgCard} stroke={C.border} strokeWidth={1}/>
      {payload.escudo
        ? <image href={payload.escudo} x={cx - size/2} y={cy - size/2} width={size} height={size} style={{pointerEvents:"none"}}/>
        : <text x={cx} y={cy} textAnchor="middle" dominantBaseline="central" fontSize="8" fontFamily={font} fill={C.gold} fontWeight={700}>{(payload.nome||"").slice(0,3).toUpperCase()}</text>}
    </g>
  );
}

function ScatterTooltip({active, payload, xKey, yKey}) {
  if (!active || !payload || !payload.length) return null;
  const p = payload[0].payload;
  const xMeta = SERIE_B_METRICS.find(m => m.key === xKey);
  const yMeta = SERIE_B_METRICS.find(m => m.key === yKey);
  return (
    <div style={{background:C.bgCard,backdropFilter:"blur(16px)",border:`1px solid ${C.border}`,borderRadius:6,padding:"8px 10px",fontFamily:font,fontSize:11,color:C.text,boxShadow:C.shadow,minWidth:160}}>
      <div style={{fontWeight:700,color:C.gold,marginBottom:4,fontFamily:fontD,fontSize:12}}>{p.nome}</div>
      <div style={{color:C.textDim,fontSize:10}}>Posição: #{p.pos} · {p.pontos} pts</div>
      <div style={{marginTop:6,display:"flex",justifyContent:"space-between",gap:12}}>
        <span style={{color:C.textDim}}>{xMeta?.label||xKey}:</span>
        <span style={{fontWeight:600}}>{formatMetric(p[xKey], xMeta?.fmt)}</span>
      </div>
      <div style={{display:"flex",justifyContent:"space-between",gap:12}}>
        <span style={{color:C.textDim}}>{yMeta?.label||yKey}:</span>
        <span style={{fontWeight:600}}>{formatMetric(p[yKey], yMeta?.fmt)}</span>
      </div>
    </div>
  );
}

export default function ScatterExplorer({ teams }) {
  const [xKey, setXKey] = useState("posse");
  const [yKey, setYKey] = useState("xPoints");
  const avg = useMemo(() => computeSerieBAverages(teams), [teams]);

  const xMeta = SERIE_B_METRICS.find(m => m.key === xKey);
  const yMeta = SERIE_B_METRICS.find(m => m.key === yKey);

  const data = useMemo(() => teams.map(t => ({
    ...t,
    __x: t[xKey],
    __y: t[yKey],
  })), [teams, xKey, yKey]);

  return (
    <Card>
      <SH title="Cruzamento de Dados — Scatter Plot"/>
      <div style={{display:"flex",gap:12,flexWrap:"wrap",marginBottom:14,alignItems:"center"}}>
        <AxisSelect label="Eixo X" value={xKey} onChange={setXKey}/>
        <AxisSelect label="Eixo Y" value={yKey} onChange={setYKey}/>
        <button
          onClick={()=>{ const a=xKey; setXKey(yKey); setYKey(a); }}
          style={{padding:"6px 10px",background:C.goldDim,border:`1px solid ${C.gold}44`,borderRadius:4,color:C.gold,fontFamily:font,fontSize:10,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.05em",cursor:"pointer"}}>
          Inverter eixos
        </button>
        <div style={{flex:1,minWidth:0}}/>
        <div style={{fontFamily:font,fontSize:9,color:C.textDim,textAlign:"right"}}>
          Linhas pontilhadas = média da liga ({formatMetric(avg[xKey], xMeta?.fmt)} × {formatMetric(avg[yKey], yMeta?.fmt)})
        </div>
      </div>

      <div style={{height:420,width:"100%"}}>
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{top:12,right:24,bottom:40,left:40}}>
            <CartesianGrid stroke={C.border} strokeDasharray="2 3"/>
            <XAxis
              type="number" dataKey="__x" name={xMeta?.label}
              tick={{fill:C.textDim,fontSize:10,fontFamily:font}}
              axisLine={{stroke:C.border}} tickLine={{stroke:C.border}}
              domain={["dataMin - 1","dataMax + 1"]}
              label={{value:xMeta?.label,position:"insideBottom",offset:-20,fill:C.textMid,fontSize:11,fontFamily:fontD,fontWeight:700}}
            />
            <YAxis
              type="number" dataKey="__y" name={yMeta?.label}
              tick={{fill:C.textDim,fontSize:10,fontFamily:font}}
              axisLine={{stroke:C.border}} tickLine={{stroke:C.border}}
              domain={["dataMin - 1","dataMax + 1"]}
              label={{value:yMeta?.label,angle:-90,position:"insideLeft",offset:-10,fill:C.textMid,fontSize:11,fontFamily:fontD,fontWeight:700}}
            />
            <ZAxis range={[180,180]}/>
            <ReferenceLine x={avg[xKey]} stroke={C.gold} strokeDasharray="4 4" strokeOpacity={0.6}/>
            <ReferenceLine y={avg[yKey]} stroke={C.gold} strokeDasharray="4 4" strokeOpacity={0.6}/>
            <Tooltip cursor={{strokeDasharray:"3 3",stroke:C.gold}} content={<ScatterTooltip xKey={xKey} yKey={yKey}/>}/>
            <Scatter data={data} shape={<CrestPoint/>} fill={C.gold}/>
          </ScatterChart>
        </ResponsiveContainer>
      </div>

      <QuadrantLegend xMeta={xMeta} yMeta={yMeta}/>
    </Card>
  );
}

function AxisSelect({label, value, onChange}) {
  return (
    <div style={{display:"flex",flexDirection:"column",gap:3}}>
      <label style={{fontFamily:font,fontSize:9,color:C.textDim,textTransform:"uppercase",letterSpacing:"0.08em",fontWeight:700}}>{label}</label>
      <select value={value} onChange={e=>onChange(e.target.value)} style={{
        padding:"6px 10px",background:C.bgInput,border:`1px solid ${C.border}`,borderRadius:4,color:C.text,fontFamily:font,fontSize:11,outline:"none",cursor:"pointer",minWidth:160,
      }}>
        {Object.entries(groupByMetricGroup()).map(([g, items]) => (
          <optgroup key={g} label={g}>
            {items.map(m => <option key={m.key} value={m.key}>{m.label}</option>)}
          </optgroup>
        ))}
      </select>
    </div>
  );
}

function groupByMetricGroup() {
  return SERIE_B_METRICS.reduce((acc, m) => {
    (acc[m.group] = acc[m.group] || []).push(m);
    return acc;
  }, {});
}

function QuadrantLegend({xMeta, yMeta}) {
  return (
    <div style={{marginTop:12,display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,fontFamily:font,fontSize:10,color:C.textDim}}>
      <div style={{padding:"6px 8px",background:`${C.green}0a`,border:`1px solid ${C.green}22`,borderRadius:4}}>
        <span style={{color:C.green,fontWeight:700}}>↗ Superior direito:</span> acima da média em {xMeta?.label} e {yMeta?.label}
      </div>
      <div style={{padding:"6px 8px",background:`${C.red}0a`,border:`1px solid ${C.red}22`,borderRadius:4}}>
        <span style={{color:C.red,fontWeight:700}}>↙ Inferior esquerdo:</span> abaixo da média em ambos
      </div>
    </div>
  );
}
