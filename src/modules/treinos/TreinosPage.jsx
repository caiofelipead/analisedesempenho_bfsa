import { useState } from "react";
import { C, fontD, font } from "../../shared/design";
import { PRAZO_LABELS, PROGRAMACAO_SEMANAL } from "../../shared/constants";
import { parseDateBR, normDateKey, fmtDateKey, getWeekStart } from "../../shared/utils";
import { Card, CompLogo, Escudo } from "../../shared/atoms";
import {
  CheckCircle, ChevronDown, Crosshair, Plus,
} from "lucide-react";

export default function TreinosPage({videos=[],partidas=[],calendario=[]}) {
  const treinos = videos.filter(v => v.tipo === "treino" && v.data);
  // Deduplicate: if a jogo exists in both partidas and calendario (same date+adv), keep only partidas version
  const partidaKeys = new Set(partidas.map(p => `${normDateKey(p.data)}_${(p.adv||"").toLowerCase()}`));
  const dedupCalendario = calendario.filter(c => !partidaKeys.has(`${normDateKey(c.data)}_${(c.adv||"").toLowerCase()}`));
  const jogos = [...partidas, ...dedupCalendario];

  // Weekly tasks stored in localStorage
  const [weekTasks, setWeekTasks] = useState(() => {
    try { return JSON.parse(localStorage.getItem("bfsa_week_tasks") || "{}"); } catch { return {}; }
  });
  const [addingTask, setAddingTask] = useState(null);
  const [taskInput, setTaskInput] = useState("");

  // Deadline/prazo toggles stored in localStorage per jogo
  const [prazos, setPrazos] = useState(() => {
    try { return JSON.parse(localStorage.getItem("bfsa_prazos") || "{}"); } catch { return {}; }
  });
  const [expandedJogo, setExpandedJogo] = useState(null);

  const saveWeekTasks = (t) => { setWeekTasks(t); localStorage.setItem("bfsa_week_tasks", JSON.stringify(t)); };
  const savePrazos = (p) => { setPrazos(p); localStorage.setItem("bfsa_prazos", JSON.stringify(p)); };

  const togglePrazo = (jogoKey, field) => {
    const updated = { ...prazos };
    if (!updated[jogoKey]) updated[jogoKey] = {};
    updated[jogoKey][field] = !updated[jogoKey][field];
    savePrazos(updated);
  };

  const addTask = (dateStr) => {
    if (!taskInput.trim()) return;
    const updated = { ...weekTasks };
    if (!updated[dateStr]) updated[dateStr] = [];
    updated[dateStr].push({ text: taskInput.trim(), done: false, id: Date.now() });
    saveWeekTasks(updated);
    setTaskInput("");
    setAddingTask(null);
  };
  const toggleTask = (dateStr, id) => {
    const updated = { ...weekTasks };
    const task = (updated[dateStr]||[]).find(t => t.id === id);
    if (task) { task.done = !task.done; saveWeekTasks(updated); }
  };
  const removeTask = (dateStr, id) => {
    const updated = { ...weekTasks };
    updated[dateStr] = (updated[dateStr]||[]).filter(t => t.id !== id);
    if (updated[dateStr].length === 0) delete updated[dateStr];
    saveWeekTasks(updated);
  };

  // Group treinos and jogos by normalized date key
  const treinosByDate = {};
  treinos.forEach(t => { const k = normDateKey(t.data); if (!treinosByDate[k]) treinosByDate[k] = []; treinosByDate[k].push(t); });
  const jogosByDate = {};
  jogos.forEach(j => { const k = normDateKey(j.data); if (k) { if (!jogosByDate[k]) jogosByDate[k] = []; jogosByDate[k].push(j); } });

  // Collect all dates
  const allDates = new Set([...Object.keys(treinosByDate), ...Object.keys(jogosByDate)]);

  const weekMap = {};
  const weekOrder = [];
  const localISO = (d) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
  const addWeek = (d) => {
    const ws = getWeekStart(d);
    const wk = localISO(ws);
    if (!weekMap[wk]) { weekMap[wk] = ws; weekOrder.push(wk); }
  };
  addWeek(new Date());
  allDates.forEach(ds => { const d = parseDateBR(ds); if (d) addWeek(d); });
  // Also add weeks from PROGRAMACAO_SEMANAL so training-only weeks appear
  Object.keys(PROGRAMACAO_SEMANAL).forEach(isoStr => { addWeek(new Date(isoStr + "T12:00:00")); });
  // Sort: current week first, then future weeks ascending, then past weeks descending
  const currentWk = localISO(getWeekStart(new Date()));
  weekOrder.sort((a, b) => {
    const aFuture = a >= currentWk;
    const bFuture = b >= currentWk;
    if (aFuture && bFuture) return a.localeCompare(b); // both future/current: ascending
    if (!aFuture && !bFuture) return b.localeCompare(a); // both past: descending (recent first)
    return aFuture ? -1 : 1; // future before past
  });

  const diasSemana = ["SEG","TER","QUA","QUI","SEX","SÁB","DOM"];
  const escudoMap = Object.fromEntries([...partidas,...calendario].filter(x=>x.escudo).map(x=>[x.adv?.toLowerCase(),x.escudo]));

  return <div style={{display:"flex",flexDirection:"column",gap:16}}>
    {weekOrder.map(wk => {
      const wsDate = weekMap[wk];
      const weDate = new Date(wsDate); weDate.setDate(weDate.getDate() + 6);
      const fmtD = d => `${String(d.getDate()).padStart(2,"0")}/${String(d.getMonth()+1).padStart(2,"0")}`;

      const weekDays = [];
      for (let i = 0; i < 7; i++) {
        const dayDate = new Date(wsDate); dayDate.setDate(dayDate.getDate() + i);
        const dayStr = fmtDateKey(dayDate);
        const isoStr = `${dayDate.getFullYear()}-${String(dayDate.getMonth()+1).padStart(2,"0")}-${String(dayDate.getDate()).padStart(2,"0")}`;
        weekDays.push({
          label: diasSemana[i], date: dayDate, dateStr: dayStr,
          treinos: treinosByDate[dayStr] || [],
          jogos: jogosByDate[dayStr] || [],
          tasks: weekTasks[dayStr] || [],
          programacao: PROGRAMACAO_SEMANAL[isoStr] || null,
        });
      }

      const hasContent = weekDays.some(d => d.treinos.length > 0 || d.jogos.length > 0 || d.tasks.length > 0 || d.programacao) || wk === currentWk;
      if (!hasContent) return null;

      const hasProgramacao = weekDays.some(d => d.programacao);

      return <Card key={wk}>
        <div style={{fontFamily:fontD,fontSize:13,color:C.gold,fontWeight:700,marginBottom:hasProgramacao?4:12,letterSpacing:"0.05em"}}>
          SEMANA {fmtD(wsDate)} — {fmtD(weDate)}
        </div>
        {hasProgramacao && <div style={{marginBottom:10}}>
          <div style={{fontFamily:fontD,fontSize:10,color:C.text,fontWeight:700,letterSpacing:"0.05em",marginBottom:2}}>QUADRO DE TRABALHO SEMANAL</div>
          <div style={{fontFamily:font,fontSize:8,color:C.red,fontWeight:600}}>Atletas que necessitarem de atendimento do DM: chegar 30 minutos antes</div>
        </div>}
        <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:6}}>
          {weekDays.map((wd, i) => {
            const isToday = new Date().toDateString() === wd.date.toDateString();
            const hasJogo = wd.jogos.length > 0;
            const hasTreino = wd.treinos.length > 0;
            const hasProg = wd.programacao && (wd.programacao.manha?.tipo === "treino" || wd.programacao.tarde?.tipo === "treino");
            const hasProgJogo = wd.programacao && (wd.programacao.manha?.tipo === "jogo" || wd.programacao.tarde?.tipo === "jogo");
            const bgColor = isToday ? `${C.gold}12` : (hasJogo||hasProgJogo) ? `${C.red}08` : (hasTreino||hasProg) ? `${C.green}08` : C.bg;
            const borderColor = isToday ? C.gold+"55" : (hasJogo||hasProgJogo) ? C.red+"33" : (hasTreino||hasProg) ? C.green+"33" : C.border;

            return <div key={i} style={{
              background: bgColor, border: `1px solid ${borderColor}`,
              borderRadius: 8, padding: "8px 6px", minHeight: 110, display: "flex", flexDirection: "column"
            }}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
                <span style={{fontFamily:fontD,fontSize:9,color:isToday?C.gold:C.textDim,fontWeight:700,letterSpacing:"0.1em"}}>{wd.label}</span>
                <span style={{fontFamily:font,fontSize:10,color:isToday?C.gold:C.text,fontWeight:isToday?700:400}}>{String(wd.date.getDate()).padStart(2,"0")}</span>
              </div>

              <div style={{display:"flex",flexDirection:"column",gap:4,flex:1}}>
                {/* Jogos with prazo selectors */}
                {wd.jogos.map((j, ji) => {
                  const esc = escudoMap[j.adv?.toLowerCase()] || "";
                  const jogoKey = `${wd.dateStr}_${j.adv}`;
                  const isExpanded = expandedJogo === jogoKey;
                  const jogoPrazos = prazos[jogoKey] || {};
                  // Merge spreadsheet checks with local toggles
                  const getCheck = (key) => j[key+"_ok"] || jogoPrazos[key] || false;
                  const doneCount = PRAZO_LABELS.filter(p => getCheck(p.key)).length;
                  const totalCount = PRAZO_LABELS.length;

                  return <div key={`j${ji}`} style={{borderRadius: 5, overflow:"hidden", border: `1px solid ${C.red}33`}}>
                    <div onClick={()=>setExpandedJogo(isExpanded?null:jogoKey)} style={{
                      background: `${C.red}18`, padding: "5px 6px",
                      display:"flex", alignItems:"center", gap:5, cursor:"pointer"
                    }}>
                      {esc ? <img src={esc} alt="" style={{width:14,height:14,objectFit:"contain",flexShrink:0}} onError={e=>{e.target.style.display="none"}}/> : <Crosshair size={10} color={C.red}/>}
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{fontFamily:font,fontSize:8,color:C.red,fontWeight:700,textTransform:"uppercase",marginBottom:1}}>JOGO</div>
                        <div style={{fontFamily:font,fontSize:9,color:C.text,fontWeight:600,lineHeight:1.2,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{j.adv}</div>
                        {j.comp&&<div style={{fontFamily:font,fontSize:7,color:C.textDim,display:"flex",alignItems:"center",gap:2}}><CompLogo comp={j.comp} size={9}/>{j.comp} {j.rodada||""}</div>}
                      </div>
                      <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:1,flexShrink:0}}>
                        <div style={{fontFamily:font,fontSize:8,color:doneCount===totalCount?C.green:C.gold,fontWeight:700}}>{doneCount}/{totalCount}</div>
                        <ChevronDown size={10} color={C.textDim} style={{transform:isExpanded?"rotate(180deg)":"rotate(0deg)",transition:"transform 0.15s"}}/>
                      </div>
                    </div>
                    {/* Prazo selector grid */}
                    {isExpanded && <div style={{background:`${C.red}08`,padding:"6px",borderTop:`1px solid ${C.red}22`}}>
                      <div style={{fontFamily:fontD,fontSize:7,color:C.textDim,marginBottom:4,letterSpacing:"0.1em",textTransform:"uppercase"}}>Prazos Adversário</div>
                      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:3}}>
                        {PRAZO_LABELS.map(p => {
                          const done = getCheck(p.key);
                          const fromSheet = j[p.key+"_ok"];
                          return <div key={p.key} onClick={fromSheet?undefined:()=>togglePrazo(jogoKey,p.key)}
                            title={p.tip}
                            style={{
                              padding:"3px 2px",borderRadius:3,textAlign:"center",
                              background: done ? `${C.green}25` : `${C.bg}`,
                              border: `1px solid ${done ? C.green+"55" : C.border}`,
                              cursor: fromSheet ? "default" : "pointer",
                              opacity: fromSheet ? 0.85 : 1,
                              transition:"all 0.15s",
                            }}>
                            <div style={{fontFamily:fontD,fontSize:7,color:done?C.green:C.textDim,fontWeight:700,letterSpacing:"0.05em"}}>{p.label}</div>
                            {done && <CheckCircle size={8} color={C.green} style={{marginTop:1}}/>}
                            {fromSheet && done && <div style={{fontFamily:font,fontSize:5,color:C.green+"99",marginTop:1}}>SHEET</div>}
                          </div>;
                        })}
                      </div>
                    </div>}
                  </div>;
                })}

                {/* Treinos */}
                {wd.treinos.map((t, ti) => {
                  const link = t.link || t.linkAlt || "";
                  return <div key={`t${ti}`} onClick={link?()=>window.open(link,"_blank"):undefined} style={{
                    background: `${C.green}18`, borderRadius: 5, padding: "5px 6px",
                    cursor: link?"pointer":"default", transition: "all 0.15s",
                    border: `1px solid ${C.green}33`
                  }} onMouseEnter={e=>{if(link){e.currentTarget.style.background=`${C.green}30`;e.currentTarget.style.borderColor=C.green}}}
                     onMouseLeave={e=>{e.currentTarget.style.background=`${C.green}18`;e.currentTarget.style.borderColor=`${C.green}33`}}>
                    <div style={{fontFamily:font,fontSize:8,color:C.green,fontWeight:700,textTransform:"uppercase",marginBottom:1}}>TREINO</div>
                    <div style={{fontFamily:font,fontSize:9,color:C.text,fontWeight:600,lineHeight:1.2,marginBottom:2}}>{t.partida||t.titulo||"Treino"}</div>
                    {link&&<div style={{display:"flex",alignItems:"center",gap:3}}>
                      <span style={{width:4,height:4,borderRadius:"50%",background:C.green,display:"inline-block"}}/>
                      <span style={{fontFamily:font,fontSize:7,color:C.green,fontWeight:600}}>LINK</span>
                    </div>}
                  </div>;
                })}

                {/* Programação Semanal */}
                {wd.programacao && [
                  {periodo:"MANHÃ",data:wd.programacao.manha},
                  {periodo:"TARDE",data:wd.programacao.tarde}
                ].map(({periodo,data}) => {
                  if (!data) return null;
                  if (data.tipo === "descanso") return (
                    <div key={periodo} style={{background:`${C.textDim}10`,borderRadius:5,padding:"4px 6px",border:`1px solid ${C.border}`}}>
                      <div style={{fontFamily:fontD,fontSize:7,color:C.textDim,fontWeight:700,letterSpacing:"0.08em",marginBottom:1}}>{periodo}</div>
                      <div style={{fontFamily:font,fontSize:8,color:C.textDim,fontStyle:"italic"}}>Descanso Programado</div>
                    </div>
                  );
                  if (data.tipo === "viagem") return (
                    <div key={periodo} style={{background:`${C.gold}12`,borderRadius:5,padding:"5px 6px",border:`1px solid ${C.gold}28`}}>
                      <div style={{fontFamily:fontD,fontSize:7,color:C.gold,fontWeight:700,letterSpacing:"0.08em",marginBottom:2}}>{periodo}</div>
                      {data.local && <div style={{fontFamily:font,fontSize:8,color:C.gold,fontWeight:600}}>{data.local}</div>}
                    </div>
                  );
                  if (data.tipo === "jogo") return (
                    <div key={periodo} style={{background:`${C.red}12`,borderRadius:5,padding:"5px 6px",border:`1px solid ${C.red}28`}}>
                      <div style={{fontFamily:fontD,fontSize:7,color:C.red,fontWeight:700,letterSpacing:"0.08em",marginBottom:2}}>{periodo}</div>
                      {data.local && <div style={{fontFamily:font,fontSize:7,color:C.gold,fontWeight:600,marginBottom:3}}>{data.local}</div>}
                      {data.atividades && data.atividades.map((a,ai) => (
                        <div key={ai} style={{display:"flex",gap:4,alignItems:"baseline",marginBottom:1}}>
                          <span style={{fontFamily:fontD,fontSize:7,color:C.red,fontWeight:700,flexShrink:0}}>{a.hora}</span>
                          <span style={{fontFamily:font,fontSize:8,color:C.text,lineHeight:1.2}}>{a.desc}</span>
                        </div>
                      ))}
                    </div>
                  );
                  return (
                    <div key={periodo} style={{background:`${C.green}12`,borderRadius:5,padding:"5px 6px",border:`1px solid ${C.green}28`}}>
                      <div style={{fontFamily:fontD,fontSize:7,color:C.green,fontWeight:700,letterSpacing:"0.08em",marginBottom:2}}>{periodo}</div>
                      {data.local && <div style={{fontFamily:font,fontSize:7,color:C.gold,fontWeight:600,marginBottom:3}}>{data.local}</div>}
                      {data.atividades && data.atividades.map((a,ai) => (
                        <div key={ai} style={{display:"flex",gap:4,alignItems:"baseline",marginBottom:1}}>
                          <span style={{fontFamily:fontD,fontSize:7,color:C.green,fontWeight:700,flexShrink:0}}>{a.hora}</span>
                          <span style={{fontFamily:font,fontSize:8,color:C.text,lineHeight:1.2}}>{a.desc}</span>
                        </div>
                      ))}
                      {data.apos && <div style={{fontFamily:font,fontSize:7,color:C.textDim,marginTop:2,fontStyle:"italic"}}>Após: {data.apos}</div>}
                    </div>
                  );
                })}

                {/* Tasks */}
                {wd.tasks.map(task => (
                  <div key={task.id} style={{display:"flex",alignItems:"flex-start",gap:4,padding:"3px 0"}}>
                    <input type="checkbox" checked={task.done} onChange={()=>toggleTask(wd.dateStr,task.id)}
                      style={{margin:"2px 0 0",cursor:"pointer",accentColor:C.gold,flexShrink:0,width:12,height:12}}/>
                    <span style={{fontFamily:font,fontSize:9,color:task.done?C.textDim:C.text,textDecoration:task.done?"line-through":"none",lineHeight:1.3,flex:1,wordBreak:"break-word"}}>{task.text}</span>
                    <button onClick={()=>removeTask(wd.dateStr,task.id)} style={{background:"none",border:"none",cursor:"pointer",padding:0,lineHeight:1,color:C.textDim,fontSize:10,flexShrink:0}} title="Remover">×</button>
                  </div>
                ))}

                {/* Add task */}
                {addingTask===wd.dateStr ? (
                  <div style={{display:"flex",flexDirection:"column",gap:3,marginTop:2}}>
                    <input autoFocus value={taskInput} onChange={e=>setTaskInput(e.target.value)}
                      onKeyDown={e=>{if(e.key==="Enter")addTask(wd.dateStr);if(e.key==="Escape"){setAddingTask(null);setTaskInput("");}}}
                      placeholder="Tarefa..."
                      style={{fontFamily:font,fontSize:9,padding:"4px 6px",borderRadius:4,border:`1px solid ${C.gold}55`,background:C.bg,color:C.text,outline:"none",width:"100%",boxSizing:"border-box"}}/>
                    <div style={{display:"flex",gap:3}}>
                      <button onClick={()=>addTask(wd.dateStr)} style={{flex:1,fontFamily:font,fontSize:8,padding:"3px",borderRadius:3,border:"none",background:C.gold,color:"#000",cursor:"pointer",fontWeight:600}}>OK</button>
                      <button onClick={()=>{setAddingTask(null);setTaskInput("");}} style={{flex:1,fontFamily:font,fontSize:8,padding:"3px",borderRadius:3,border:`1px solid ${C.border}`,background:"none",color:C.textDim,cursor:"pointer"}}>X</button>
                    </div>
                  </div>
                ) : (
                  <div onClick={()=>{setAddingTask(wd.dateStr);setTaskInput("");}}
                    style={{marginTop:"auto",paddingTop:4,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:3,opacity:0.5,transition:"opacity 0.15s"}}
                    onMouseEnter={e=>e.currentTarget.style.opacity=1} onMouseLeave={e=>e.currentTarget.style.opacity=0.5}>
                    <Plus size={10} color={C.textDim}/>
                    <span style={{fontFamily:font,fontSize:8,color:C.textDim}}>tarefa</span>
                  </div>
                )}

                {!hasTreino && !hasJogo && wd.tasks.length === 0 && addingTask !== wd.dateStr && (
                  <div style={{flex:1}}/>
                )}
              </div>
            </div>;
          })}
        </div>
      </Card>;
    })}
  </div>;
}
