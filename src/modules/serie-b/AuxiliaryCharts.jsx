import { useState, useMemo } from "react";
import { C, fontD, font } from "../../shared/design";
import { Card, SH, Escudo } from "../../shared/atoms";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer,
  Cell, Tooltip, ReferenceLine,
} from "recharts";
import { SERIE_B_METRICS, SERIE_B_DEFENSIVE_KEYS, computeSerieBAverages, formatMetric } from "./data";

// ───────────────────────────────────────────────
// 1) Points vs xPoints — sort by delta to highlight over/underperformers
// ───────────────────────────────────────────────
export function PtsVsXptsChart({ teams }) {
  const data = useMemo(() => [...teams]
    .map(t => ({ ...t, delta: t.pontos - t.xPoints }))
    .sort((a, b) => b.delta - a.delta), [teams]);

  return (
    <Card>
      <SH title="Pontos vs xPoints — Sorte na Tabela"/>
      <div style={{fontFamily:font,fontSize:10,color:C.textDim,marginBottom:10}}>
        Positivo (verde) = somando mais pontos do que o desempenho esperado; negativo (vermelho) = abaixo do merecido.
      </div>
      <div style={{height:Math.max(320, data.length * 22),width:"100%"}}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{top:4,right:24,left:8,bottom:4}}>
            <CartesianGrid stroke={C.border} strokeDasharray="2 3" horizontal={false}/>
            <XAxis type="number" tick={{fill:C.textDim,fontSize:10,fontFamily:font}} axisLine={{stroke:C.border}} tickLine={false}/>
            <YAxis
              type="category" dataKey="nome" width={110}
              tick={<TeamTick/>}
              axisLine={false} tickLine={false}
              interval={0}
            />
            <ReferenceLine x={0} stroke={C.border}/>
            <Tooltip content={<DeltaTooltip/>} cursor={{fill:C.bgCardHover}}/>
            <Bar dataKey="delta" radius={[0,3,3,0]}>
              {data.map((d, i) => (
                <Cell key={i} fill={d.delta >= 0 ? C.green : C.red}/>
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}

function DeltaTooltip({active, payload}) {
  if (!active || !payload || !payload.length) return null;
  const p = payload[0].payload;
  return (
    <div style={{background:C.bgCard,backdropFilter:"blur(16px)",border:`1px solid ${C.border}`,borderRadius:6,padding:"8px 10px",fontFamily:font,fontSize:11,color:C.text,boxShadow:C.shadow}}>
      <div style={{fontWeight:700,color:C.gold,marginBottom:4,fontFamily:fontD}}>{p.nome}</div>
      <div>Pontos: <b>{p.pontos}</b></div>
      <div>xPoints: <b>{formatMetric(p.xPoints,"dec2")}</b></div>
      <div style={{color: p.delta >= 0 ? C.green : C.red, fontWeight:700, marginTop:2}}>
        Δ: {p.delta >= 0 ? "+" : ""}{formatMetric(p.delta, "dec2")}
      </div>
    </div>
  );
}

// Custom Y-axis tick: team crest + name
function TeamTick(props) {
  const { x, y, payload } = props;
  const team = payload.value;
  return (
    <g transform={`translate(${x - 4},${y})`}>
      <text x={0} y={0} textAnchor="end" dominantBaseline="central" fontSize="10" fontFamily={font} fill={C.textMid} fontWeight={600}>
        {team}
      </text>
    </g>
  );
}

// ───────────────────────────────────────────────
// 2) Metric ranking — user picks one metric, shows horizontal ranking
// ───────────────────────────────────────────────
export function MetricRankingChart({ teams }) {
  const [metric, setMetric] = useState("xGA");
  const meta = SERIE_B_METRICS.find(m => m.key === metric);
  const avg = useMemo(() => computeSerieBAverages(teams), [teams]);

  // Defensive metrics: lower is better, so invert the sort semantic for color.
  const isDefensive = SERIE_B_DEFENSIVE_KEYS.has(metric);

  const data = useMemo(() => [...teams]
    .sort((a, b) => isDefensive ? a[metric] - b[metric] : b[metric] - a[metric])
    .map(t => ({ ...t, __v: t[metric] })), [teams, metric, isDefensive]);

  return (
    <Card>
      <SH title="Ranking por Métrica"/>
      <div style={{display:"flex",gap:10,marginBottom:12,alignItems:"center",flexWrap:"wrap"}}>
        <label style={{fontFamily:font,fontSize:10,color:C.textDim,textTransform:"uppercase",letterSpacing:"0.08em",fontWeight:700}}>Métrica</label>
        <select value={metric} onChange={e=>setMetric(e.target.value)} style={{
          padding:"6px 10px",background:C.bgInput,border:`1px solid ${C.border}`,borderRadius:4,color:C.text,fontFamily:font,fontSize:11,outline:"none",cursor:"pointer",minWidth:180,
        }}>
          {SERIE_B_METRICS.map(m => <option key={m.key} value={m.key}>{m.label}</option>)}
        </select>
        <div style={{flex:1}}/>
        <div style={{fontFamily:font,fontSize:9,color:C.textDim}}>
          Média liga: <b style={{color:C.gold}}>{formatMetric(avg[metric], meta?.fmt)}</b>
          {isDefensive && <span style={{marginLeft:8,color:C.textMid}}>(menor é melhor)</span>}
        </div>
      </div>
      <div style={{height:Math.max(320, teams.length * 22),width:"100%"}}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{top:4,right:40,left:8,bottom:4}}>
            <CartesianGrid stroke={C.border} strokeDasharray="2 3" horizontal={false}/>
            <XAxis type="number" tick={{fill:C.textDim,fontSize:10,fontFamily:font}} axisLine={{stroke:C.border}} tickLine={false}/>
            <YAxis type="category" dataKey="nome" width={110} tick={<TeamTick/>} axisLine={false} tickLine={false} interval={0}/>
            <ReferenceLine x={avg[metric]} stroke={C.gold} strokeDasharray="4 4" label={{value:"média",fill:C.gold,fontSize:9,fontFamily:font,position:"top"}}/>
            <Tooltip content={<MetricTooltip meta={meta} avgV={avg[metric]}/>} cursor={{fill:C.bgCardHover}}/>
            <Bar dataKey="__v" radius={[0,3,3,0]}>
              {data.map((d, i) => {
                const aboveAvg = d.__v > avg[metric];
                const good = isDefensive ? !aboveAvg : aboveAvg;
                return <Cell key={i} fill={good ? C.green : C.red}/>;
              })}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}

function MetricTooltip({active, payload, meta, avgV}) {
  if (!active || !payload || !payload.length) return null;
  const p = payload[0].payload;
  return (
    <div style={{background:C.bgCard,backdropFilter:"blur(16px)",border:`1px solid ${C.border}`,borderRadius:6,padding:"8px 10px",fontFamily:font,fontSize:11,color:C.text,boxShadow:C.shadow}}>
      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}>
        <Escudo src={p.escudo} size={18}/>
        <span style={{fontWeight:700,color:C.gold,fontFamily:fontD}}>{p.nome}</span>
      </div>
      <div>Posição: #{p.pos} · {p.pontos} pts</div>
      <div style={{marginTop:2}}>{meta?.label}: <b>{formatMetric(p.__v, meta?.fmt)}</b></div>
      <div style={{color:C.textDim,fontSize:10}}>vs média: {formatMetric(p.__v - avgV, meta?.fmt)}</div>
    </div>
  );
}

// ───────────────────────────────────────────────
// 3) Combined view — layout grid for both
// ───────────────────────────────────────────────
export default function AuxiliaryCharts({ teams }) {
  return (
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,marginBottom:16}}>
      <PtsVsXptsChart teams={teams}/>
      <MetricRankingChart teams={teams}/>
    </div>
  );
}
