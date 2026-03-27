import { C, fontD, font } from "../../shared/design";
import { Badge, Card } from "../../shared/atoms";
import { Zap, TrendingUp, Shield, AlertTriangle } from "lucide-react";

const fases = [
  { fase:"Organização Ofensiva", color:()=>C.blue, icon:Zap,
    regras:[
      {se:"Setor bloqueado",entao:"Jogar para trás e mudar corredor",pq:"Criar novos ângulos e desorganizar o bloco"},
      {se:"Sob pressão",entao:"Entrelinhas ou bola nas costas",pq:"Usar a pressão contra o adversário"},
      {se:"Espaço disponível",entao:"Triangulações e losangos de apoio",pq:"Manter ritmo e conexão entre linhas"},
      {se:"Marcação zonal baixa",entao:"Circular até abrir corredor interno",pq:"Atrair e explorar o lado oposto"},
      {se:"Em progressão ofensiva",entao:"Cobertura defensiva preventiva",pq:"Evitar exposição a contra-ataques"},
    ]},
  { fase:"Transição Ofensiva", color:()=>C.green, icon:TrendingUp,
    regras:[
      {se:"Recuperação em zona de pressão",entao:"Passe vertical imediato",pq:"Explorar desequilíbrio antes da recomposição"},
      {se:"Recuperação sob pressão",entao:"Mudar corredor",pq:"Aliviar e criar nova linha de progressão"},
      {se:"Espaço nas costas",entao:"Diagonal em profundidade",pq:"Atacar a ruptura defensiva"},
      {se:"Sem opção vertical",entao:"Condução 1x1 para atrair",pq:"Abrir espaços para companheiros"},
      {se:"Adversário recomposto",entao:"Circular e reorganizar ataque posicional",pq:"Não forçar — construir com paciência"},
    ]},
  { fase:"Organização Defensiva", color:()=>C.yellow, icon:Shield,
    regras:[
      {se:"Adversário sai jogando curto",entao:"Pressão alta coordenada",pq:"Induzir erro e recuperar em zona perigosa"},
      {se:"Zagueiro recua pro goleiro",entao:"Pressionar goleiro e fechar linhas",pq:"Forçar bola longa ou erro"},
      {se:"Adversário perto da área",entao:"Compactar e dominar duelos",pq:"Densidade máxima no último terço"},
      {se:"Jogo pelo corredor central",entao:"Funilar e fechar espaços internos",pq:"Proteger eixo central"},
      {se:"Pressão vencida",entao:"Reagrupar atrás da bola",pq:"Evitar rupturas entre linhas"},
    ]},
  { fase:"Transição Defensiva", color:()=>C.red, icon:AlertTriangle,
    regras:[
      {se:"Perda de posse",entao:"Pressionar até 8 segundos",pq:"Recuperar no terço ofensivo"},
      {se:"Não recuperou rápido",entao:"Falta tática ou recompor",pq:"Interromper contra-ataque"},
      {se:"Fora da zona de pressão",entao:"Funil para as laterais",pq:"Proteger eixo central"},
      {se:"Pressão vencida",entao:"Reagrupar atrás da linha da bola",pq:"Reequilibrar setores"},
      {se:"Superioridade adversária",entao:"Temporizar e chamar cobertura",pq:"Ganhar tempo para reposicionamento"},
    ]},
];

export default function ModeloJogoPage() {
  return <div>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
      <div>
        <div style={{fontFamily:fontD,fontSize:18,color:C.text,fontWeight:700}}>Modelo de Jogo Tencati</div>
        <div style={{fontFamily:font,fontSize:11,color:C.textDim,marginTop:2}}>Estrutura SE → ENTÃO → PORQUÊ</div>
      </div>
      <Badge color={C.green}>VIGENTE</Badge>
    </div>
    {fases.map((f,fi)=>{
      const I=f.icon;
      const color = f.color();
      return <Card key={fi} style={{marginBottom:14}}>
        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:12}}>
          <div style={{width:32,height:32,borderRadius:6,background:`${color}22`,display:"flex",alignItems:"center",justifyContent:"center"}}><I size={16} color={color}/></div>
          <div style={{fontFamily:fontD,fontSize:14,color,fontWeight:700,textTransform:"uppercase"}}>{f.fase}</div>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
          {f.regras.map((r,ri)=>(
            <div key={ri} style={{padding:12,borderRadius:6,border:`1px solid ${color}22`,background:`${color}06`}}>
              <div style={{fontFamily:font,fontSize:11,color:C.text,fontWeight:700,marginBottom:4}}>SE {r.se}</div>
              <div style={{fontFamily:font,fontSize:11,color:C.text}}><span style={{fontWeight:700,color}}>ENTÃO:</span> {r.entao}</div>
              <div style={{fontFamily:font,fontSize:10,color:C.textDim,marginTop:2}}>{r.pq}</div>
            </div>
          ))}
        </div>
      </Card>;
    })}
    <div style={{fontFamily:font,fontSize:9,color:C.textDim,textAlign:"center",marginTop:8}}>Comissão Técnica Tencati 3 · Base conceitual para treinamento e análise tática</div>
  </div>;
}
