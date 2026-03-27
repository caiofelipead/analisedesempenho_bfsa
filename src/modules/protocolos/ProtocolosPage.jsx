import { C, fontD, font } from "../../shared/design";
import { Card } from "../../shared/atoms";

const WORKFLOW = [
  {titulo:"PRÉ-JOGO",cor:()=>C.red,etapas:["Scout de adversário (tarefa URGENTE)","Análise tática compartilhada com comissão técnica"]},
  {titulo:"PÓS-JOGO (D+0 a D+2)",cor:()=>C.red,etapas:["Gerente cria tarefas","Analistas recebem atribuições","Dados coletivos e individuais coletados","Vídeo pós-jogo","Alimentação banco de dados interno","Feedback individual","Entrega PDF próximo adversário"]},
  {titulo:"DURANTE A SEMANA (>D+3)",cor:()=>C.red,etapas:["Montagem vídeo adversário junto ao auxiliar da casa","Revisão de tarefas","Dashboard atualiza","Vídeos feedback coletivo último jogo","Vídeos adversário"]},
  {titulo:"MENSAL",cor:()=>C.red,etapas:["Avaliação de evolução de cada atleta","Review de produtividade dos analistas","Relatório consolidado para diretoria","Reunião interna"]},
];

export default function ProtocolosPage() {
  return <div>
    <Card style={{marginBottom:16}}>
      <div style={{fontFamily:fontD,fontSize:20,fontWeight:700,color:C.text,marginBottom:16,textTransform:"uppercase",letterSpacing:1}}>Workflow do Departamento</div>
      <div style={{display:"flex",flexDirection:"column",gap:12}}>
        {WORKFLOW.map((w,i)=>(
          <div key={i} style={{background:C.bgInput,borderRadius:8,padding:"14px 16px",borderLeft:`4px solid ${w.cor()}`}}>
            <div style={{fontFamily:fontD,fontSize:14,fontWeight:700,color:w.cor(),marginBottom:8,textTransform:"uppercase"}}>{w.titulo}</div>
            <div style={{fontFamily:font,fontSize:12,color:C.textMid,lineHeight:1.6}}>
              {w.etapas.map((e,j)=><span key={j}>{e}{j<w.etapas.length-1?" → ":""}</span>)}
            </div>
          </div>
        ))}
      </div>
    </Card>
  </div>;
}
