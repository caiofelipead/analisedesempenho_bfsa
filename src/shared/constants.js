import { BarChart3, BookOpen, Crosshair, FileText, Shield, Target, Dumbbell, Users, Video, UserPlus, ClipboardList, Settings } from "lucide-react";
import { C } from "./design";

// ═══════════════════════════════════════════════
// COMP LOGOS
// ═══════════════════════════════════════════════
export const COMP_LOGOS = {
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
// PLAYER BASE URL + ATLETAS
// ═══════════════════════════════════════════════
export const PB = "https://raw.githubusercontent.com/caiofelipead/performance_dashboard/main/public/players/";

export const ATLETAS = [
  { id:1,nome:"Victor Souza",pos:"Goleiro",num:1,status:"ativo",foto:`${PB}VICTOR%20SOUZA.png`,videos:"",tend:"estavel",cat:"profissional" },
  { id:2,nome:"Jonathan Lemos",pos:"Lateral Direito",num:2,status:"ativo",foto:`${PB}JONATHAN.png`,videos:"",tend:"estavel",cat:"profissional" },
  { id:3,nome:"Éricson",pos:"Zagueiro",num:3,status:"ativo",foto:`${PB}ERICSON.png`,videos:"",tend:"estavel",cat:"profissional" },
  { id:4,nome:"Gustavo Vilar",pos:"Zagueiro",num:4,status:"ativo",foto:`${PB}GUSTAVO%20VILAR.png`,videos:"",tend:"estavel",cat:"profissional" },
  { id:5,nome:"Leandro Maciel",pos:"Volante",num:5,status:"ativo",foto:`${PB}LEANDRO%20MACIEL.png`,videos:"",tend:"subindo",cat:"profissional" },
  { id:6,nome:"Patrick Brey",pos:"Lateral Esquerdo",num:6,status:"ativo",foto:`${PB}PATRICK%20BREY.png`,videos:"",tend:"estavel",cat:"profissional" },
  { id:7,nome:"Kelvin Giacobe",pos:"Extremo",num:7,status:"ativo",foto:`${PB}KELVIN.png`,videos:"",tend:"subindo",cat:"profissional" },
  { id:8,nome:"Éverton Morelli",pos:"Volante",num:8,status:"ativo",foto:`${PB}MORELLI.png`,videos:"",tend:"estavel",cat:"profissional" },
  { id:9,nome:"Hygor Cléber",pos:"Atacante",num:9,status:"ativo",foto:`${PB}HYGOR.png`,videos:"",tend:"subindo",cat:"profissional" },
  { id:10,nome:"Rafael Gava",pos:"Meia",num:10,status:"ativo",foto:`${PB}RAFAEL%20GAVA.png`,videos:"",tend:"subindo",cat:"profissional" },
  { id:11,nome:"Jéfferson Nem",pos:"Extremo",num:11,status:"ativo",foto:`${PB}JEFFERSON%20NEM.png`,videos:"",tend:"estavel",cat:"profissional" },
  { id:12,nome:"Jordan Esteves",pos:"Goleiro",num:12,status:"ativo",foto:`${PB}JORDAN.png`,videos:"",tend:"estavel",cat:"profissional" },
  { id:13,nome:"Wallace Fortuna",pos:"Zagueiro",num:13,status:"ativo",foto:`${PB}WALLACE.png`,videos:"",tend:"estavel",cat:"profissional" },
  { id:14,nome:"Carlão",pos:"Zagueiro",num:14,status:"ativo",foto:`${PB}CARLOS%20EDUARDO.png`,videos:"",tend:"subindo",cat:"profissional" },
  { id:15,nome:"Guilherme Mariano",pos:"Zagueiro",num:15,status:"ativo",foto:`${PB}GUI%20MARIANO.png`,videos:"",tend:"estavel",cat:"profissional" },
  { id:16,nome:"Matheus Sales",pos:"Volante",num:16,status:"ativo",foto:`${PB}MATHEUS%20SALES.png`,videos:"",tend:"estavel",cat:"profissional" },
  { id:17,nome:"Guilherme Queiróz",pos:"Atacante",num:17,status:"ativo",foto:`${PB}GUILHERME%20QUEIROZ.png`,videos:"",tend:"subindo",cat:"profissional" },
  { id:19,nome:"Maranhão",pos:"Extremo",num:19,status:"ativo",foto:`${PB}MARANHAO.png`,videos:"",tend:"estavel",cat:"profissional" },
  { id:20,nome:"Marquinho",pos:"Meia",num:20,status:"ativo",foto:`${PB}MARQUINHO%20JR..png`,videos:"",tend:"estavel",cat:"profissional" },
  { id:21,nome:"Luizão",pos:"Atacante",num:21,status:"ativo",foto:`${PB}LUIZAO.png`,videos:"",tend:"estavel",cat:"profissional" },
  { id:22,nome:"Gabriel Inocêncio",pos:"Lateral Direito",num:22,status:"ativo",foto:`${PB}GABRIEL%20INOCENCIO.png`,videos:"",tend:"estavel",cat:"profissional" },
  { id:23,nome:"Wesley Pinheiro",pos:"Extremo",num:23,status:"ativo",foto:`${PB}WESLEY.png`,videos:"",tend:"subindo",cat:"profissional" },
  { id:25,nome:"Brenno Klippel",pos:"Goleiro",num:25,status:"ativo",foto:`${PB}BRENNO.png`,videos:"",tend:"estavel",cat:"profissional" },
  { id:26,nome:"Felipe Vieira",pos:"Lateral Esquerdo",num:26,status:"ativo",foto:`${PB}FELIPE%20VIEIRA.png`,videos:"",tend:"estavel",cat:"profissional" },
  { id:27,nome:"Darlan Batista",pos:"Zagueiro",num:27,status:"ativo",foto:`${PB}DARLAN.png`,videos:"",tend:"estavel",cat:"profissional" },
  { id:29,nome:"Thiaguinho",pos:"Volante",num:29,status:"ativo",foto:`${PB}THIAGUINHO.png`,videos:"",tend:"estavel",cat:"profissional" },
  { id:30,nome:"Zé Hugo",pos:"Extremo",num:30,status:"ativo",foto:`${PB}ZE%20HUGO.png`,videos:"",tend:"subindo",cat:"profissional" },
  { id:31,nome:"Pedro Tortello",pos:"Volante",num:0,status:"ativo",foto:`${PB}PEDRO%20TORTELLO.png`,videos:"",tend:"estavel",cat:"profissional" },
  { id:32,nome:"Thalles",pos:"Atacante",num:0,status:"ativo",foto:`${PB}THALLES.png`,videos:"",tend:"estavel",cat:"profissional" },
  { id:33,nome:"Hebert Badaró",pos:"Zagueiro",num:0,status:"ativo",foto:`${PB}HEBERT.png`,videos:"",tend:"estavel",cat:"profissional" },
  { id:34,nome:"Érik",pos:"Volante",num:0,status:"ativo",foto:`${PB}ERIK.png`,videos:"",tend:"estavel",cat:"profissional" },
  { id:35,nome:"Adriano",pos:"Goleiro",num:0,status:"ativo",foto:`${PB}ADRIANO.png`,videos:"",tend:"estavel",cat:"profissional" },
  { id:36,nome:"Whalacy Ermeliano",pos:"Extremo",num:0,status:"ativo",foto:`${PB}WHALACY.png`,videos:"",tend:"estavel",cat:"profissional" },
  { id:37,nome:"Yuri Felipe",pos:"Volante",num:0,status:"ativo",foto:`${PB}YURI.png`,videos:"",tend:"estavel",cat:"profissional" },
  { id:38,nome:"Henrique Teles",pos:"Lateral Esquerdo",num:0,status:"ativo",foto:`${PB}HENRIQUE%20TELES.png`,videos:"",tend:"estavel",cat:"profissional" },
  { id:39,nome:"Felipe Penha",pos:"Meia",num:0,status:"ativo",foto:"",videos:"",tend:"estavel",cat:"profissional" },
  { id:40,nome:"Pedrinho",pos:"Lateral Direito",num:0,status:"ativo",foto:`${PB}PEDRINHO.png`,videos:"",tend:"estavel",cat:"profissional" },
  { id:41,nome:"Marco Antonio",pos:"Volante",num:0,status:"ativo",foto:"https://botafogofutebolsa.com.br/wp-content/uploads/2026/03/marco-antonio_site.jpg",videos:"",tend:"estavel",cat:"profissional" },
];

// ═══════════════════════════════════════════════
// FIXED CHECKLIST
// ═══════════════════════════════════════════════
export const FIXED_CHECKLIST = [
  {label:"Relatório PDF",fixed:true},
  {label:"Vídeo bolas paradas | Goleiros",fixed:true},
  {label:"Vídeo bolas paradas | Comissão Técnica",fixed:true},
  {label:"Vídeo Análise de Adversário",fixed:true},
  {label:"Descritivo individual",fixed:true},
  {label:"Pós-jogo",fixed:true},
];

// ═══════════════════════════════════════════════
// BOLAS PARADAS PLAYBOOK
// ═══════════════════════════════════════════════
export const BP_PLAYBOOK = [
  {id:1,nome:"Escanteio Curto",tipo:"ofensivo",desc:"Bola curta no 1º pau com infiltração do meia pelo lado oposto. Opção de cruzamento rasteiro ou inversão.",movimentos:["Cobrador → passe curto","Meia infiltra 1º pau","Zagueiro ataca 2º pau"]},
  {id:2,nome:"Escanteio Longo (2º Pau)",tipo:"ofensivo",desc:"Bola aberta no 2º pau para cabeceio do zagueiro. Bloqueio na marca do pênalti para liberar espaço.",movimentos:["Cobrador → bola aberta 2º pau","Bloqueio na marca do pênalti","Zagueiro cabeceia"]},
  {id:3,nome:"Falta Frontal (Barreira)",tipo:"ofensivo",desc:"Cobrança direta ao gol por cima da barreira ou bola na segunda trave com desvio.",movimentos:["Cobrador 1 → bola direta","Cobrador 2 → opção cruzamento","Atacante ataca rebote"]},
  {id:4,nome:"Falta Lateral (Cruzamento)",tipo:"ofensivo",desc:"Cruzamento na área com movimentação coordenada. Ataque ao 1º pau e 2º pau simultaneamente.",movimentos:["Cobrador → cruzamento área","Atacante 1 → 1º pau","Zagueiro → 2º pau"]},
  {id:5,nome:"Lateral Ofensivo",tipo:"ofensivo",desc:"Lateral longo na área com bloqueios. Bola no 1º pau para desvio ou no 2º pau para finalização.",movimentos:["Cobrador → arremesso longo","Jogador 1 → desvio 1º pau","Jogador 2 → finalização 2º pau"]},
  {id:6,nome:"Defesa Escanteio (Zona)",tipo:"defensivo",desc:"Marcação zonal com 3 jogadores fixos (1º pau, marca do pênalti, 2º pau). Restante marca individual nos referências.",movimentos:["Jogador A → 1º pau","Jogador B → marca do pênalti","Jogador C → 2º pau","Restante → marcação individual"]},
  {id:7,nome:"Defesa Falta Frontal",tipo:"defensivo",desc:"Barreira de 3-4 jogadores. Goleiro posicionado para cobrir o lado aberto. Um jogador deita na barreira.",movimentos:["Barreira de 3-4 jogadores","1 jogador deita atrás","Goleiro cobre lado aberto","Zagueiro cobre rebote"]},
];

// ═══════════════════════════════════════════════
// POSITION-SPECIFIC METRICS
// ═══════════════════════════════════════════════
export const POS_METRICS = {
  "Goleiro": {
    keys: [{k:"min",label:"Minutos"},{k:"acoes",label:"Ações"},{k:"passesCrt",label:"Passes Certos"},{k:"passesLong",label:"Passes Longos"}],
    desc: "Goleiros são avaliados por defesas%, gols sofridos/90, xG defendido/90 e distribuição com os pés (passes longos certos%). Pappalardo et al. (2019) PlayeRank: goleiros de elite se diferenciam pela participação na construção e leitura de jogo aéreo.",
    indices: ["Defesas %", "Golos sofridos/90", "xG defendido/90", "Passes longos certos %"],
  },
  "Zagueiro": {
    keys: [{k:"duelos",label:"Duelos Ganhos"},{k:"passesCrt",label:"Passes Certos"},{k:"passesLong",label:"Passes Longos"},{k:"acoes",label:"Ações Totais"},{k:"min",label:"Minutos"}],
    desc: "Zagueiros: duelos defensivos ganhos%, duelos aéreos ganhos%, cortes, interceptações e construção (passes progressivos, passes longos certos%). Decroos et al. (2019) VAEP: ações defensivas com êxito são o melhor preditor de impacto defensivo. SkillCorner: Physical & Aggressive Defender vs Ball-Playing CB.",
    indices: ["Duelos defensivos ganhos %", "Duelos aéreos ganhos %", "Cortes/90", "Interceptações/90", "Passes progressivos/90", "Passes longos certos %"],
  },
  "Lateral Direito": {
    keys: [{k:"cruz",label:"Cruzamentos"},{k:"dribles",label:"Dribles"},{k:"duelos",label:"Duelos Ganhos"},{k:"passesCrt",label:"Passes Certos"},{k:"acoes",label:"Ações Totais"}],
    desc: "Laterais: cruzamentos certos%, corridas progressivas/90, acelerações/90, dribles e duelos defensivos ganhos%. Bransen & Van Haaren (2020): passes progressivos e contribuição em terço final são os KPIs diferenciais. SkillCorner: Intense Full Back vs Technical Full Back index.",
    indices: ["Cruzamentos certos %", "Corridas progressivas/90", "Acelerações/90", "Duelos defensivos ganhos %", "Assistências/90", "Dribles/90"],
  },
  "Lateral Esquerdo": {
    keys: [{k:"cruz",label:"Cruzamentos"},{k:"dribles",label:"Dribles"},{k:"duelos",label:"Duelos Ganhos"},{k:"passesCrt",label:"Passes Certos"},{k:"acoes",label:"Ações Totais"}],
    desc: "Laterais: cruzamentos certos%, corridas progressivas/90, acelerações/90, dribles e duelos defensivos ganhos%. Bransen & Van Haaren (2020): passes progressivos e contribuição em terço final são os KPIs diferenciais. SkillCorner: Intense Full Back vs Technical Full Back index.",
    indices: ["Cruzamentos certos %", "Corridas progressivas/90", "Acelerações/90", "Duelos defensivos ganhos %", "Assistências/90", "Dribles/90"],
  },
  "Volante": {
    keys: [{k:"passesCrt",label:"Passes Certos"},{k:"duelos",label:"Duelos Ganhos"},{k:"acoes",label:"Ações Totais"},{k:"passesLong",label:"Passes Longos"},{k:"min",label:"Minutos"}],
    desc: "Volantes: ações defensivas com êxito/90, interceptações ajust. à posse, duelos defensivos ganhos%, passes progressivos/90 e passes longos certos%. MDPI (2025) SciSkill: interceptações e passes progressivos são os melhores preditores no setor médio. SkillCorner: Number 6 vs Box-to-Box index.",
    indices: ["Ações defensivas/90", "Interceptações ajust. posse", "Duelos defensivos ganhos %", "Passes progressivos/90", "Passes longos certos %", "Cortes/90"],
  },
  "Meia": {
    keys: [{k:"passesCrt",label:"Passes Certos"},{k:"assist",label:"Assistências"},{k:"dribles",label:"Dribles"},{k:"xg",label:"xG"},{k:"acoes",label:"Ações Totais"}],
    desc: "Meias: assistências esperadas (xA)/90, passes chave/90, passes inteligentes/90, passes progressivos/90 e corridas progressivas/90. ICSPORTS (2025): trajetórias de desenvolvimento > atributos estáticos — meias top realizam 2-3x mais ações em terço final. SkillCorner: Dynamic No.8 vs Box-to-Box index.",
    indices: ["xA/90", "Passes chave/90", "Passes inteligentes/90", "Passes progressivos/90", "Corridas progressivas/90", "Dribles com sucesso %"],
  },
  "Extremo": {
    keys: [{k:"dribles",label:"Dribles"},{k:"gols",label:"Gols"},{k:"assist",label:"Assistências"},{k:"cruz",label:"Cruzamentos"},{k:"xg",label:"xG"}],
    desc: "Extremos: dribles com sucesso%, gols/90, xG/90, cruzamentos certos%, acelerações/90 e corridas progressivas/90. Bhatt et al. (2025) KickClone: efetividade 1v1 e participação direta em gol (G+A) são os KPIs diferenciais via similaridade por cosseno. SkillCorner: Inverted Winger vs Wide Winger index.",
    indices: ["Dribles com sucesso %", "Gols/90", "xG/90", "Cruzamentos certos %", "Acelerações/90", "Corridas progressivas/90"],
  },
  "Atacante": {
    keys: [{k:"gols",label:"Gols"},{k:"xg",label:"xG"},{k:"remates",label:"Remates"},{k:"duelos",label:"Duelos Ganhos"},{k:"acoes",label:"Ações Totais"}],
    desc: "Atacantes: gols/90, xG/90, remates à baliza%, toques na área/90, duelos ofensivos ganhos% e dribles/90. Decroos et al. (2019) VAEP: ΔP(marca gol) é o componente dominante. MDPI (2025): atacantes de elite mantêm ratio gols/xG ≥ 1.0. SkillCorner: Direct Striker vs Link-Up Striker index.",
    indices: ["Gols/90", "xG/90", "Remates à baliza %", "Toques na área/90", "Duelos ofensivos ganhos %", "Dribles/90"],
  },
};

// ═══════════════════════════════════════════════
// PRAZO LABELS
// ═══════════════════════════════════════════════
export const PRAZO_LABELS = [
  {key:"adv",label:"ADV",tip:"Análise Adversário"},
  {key:"pre",label:"PRE",tip:"Preleção"},
  {key:"pos",label:"PÓS",tip:"Pós-Jogo"},
  {key:"dat",label:"DAT",tip:"Dados/Estatísticas"},
  {key:"wys",label:"WYS",tip:"Wyscout"},
  {key:"tre",label:"TRE",tip:"Treino"},
  {key:"bsp",label:"BSP",tip:"Bolas Paradas"},
  {key:"ind",label:"IND",tip:"Individual"},
];

// ═══════════════════════════════════════════════
// PROGRAMACAO SEMANAL
// ═══════════════════════════════════════════════
export const PROGRAMACAO_SEMANAL = {
  "2026-03-23": {
    manha: { tipo: "descanso" },
    tarde: { tipo: "descanso" },
  },
  "2026-03-24": {
    manha: {
      tipo: "treino",
      local: "Campo Auxiliar",
      atividades: [
        { hora: "07h30", desc: "Apresentação" },
        { hora: "08h20", desc: "Pré Treino (Sala anexa)" },
        { hora: "09h00", desc: "Treino" },
      ],
      apos: "Almoço Obrigatório",
    },
    tarde: { tipo: "descanso" },
  },
  "2026-03-25": {
    manha: {
      tipo: "treino",
      local: "Campo Auxiliar",
      atividades: [
        { hora: "07h30", desc: "Apresentação" },
        { hora: "08h20", desc: "Pré Treino (Sala anexa)" },
        { hora: "09h00", desc: "Treino" },
      ],
      apos: "Confraternização no CT",
    },
    tarde: { tipo: "descanso" },
  },
  "2026-03-26": {
    manha: { tipo: "descanso" },
    tarde: {
      tipo: "treino",
      local: "Estádio Santa Cruz",
      atividades: [
        { hora: "14h30", desc: "Apresentação" },
        { hora: "15h20", desc: "Pré Treino (Sala anexa)" },
        { hora: "16h00", desc: "Treino" },
      ],
      apos: "Lanche (Sala anexa)",
    },
  },
  "2026-03-27": {
    manha: { tipo: "descanso" },
    tarde: {
      tipo: "treino",
      local: "Estádio Santa Cruz",
      atividades: [
        { hora: "14h30", desc: "Apresentação" },
        { hora: "15h20", desc: "Pré Treino (Sala anexa)" },
        { hora: "16h00", desc: "Treino" },
      ],
      apos: "Lanche (Sala anexa)",
    },
  },
  "2026-03-28": {
    manha: {
      tipo: "treino",
      local: "CT Botafogo Academy",
      atividades: [
        { hora: "07h30", desc: "Apresentação" },
        { hora: "08h20", desc: "Pré Treino (Sala anexa)" },
        { hora: "09h00", desc: "Treino" },
      ],
      apos: "Almoço Obrigatório",
    },
    tarde: { tipo: "descanso" },
  },
  "2026-03-29": {
    manha: {
      tipo: "treino",
      local: "Campo Auxiliar",
      atividades: [
        { hora: "07h30", desc: "Apresentação" },
        { hora: "08h20", desc: "Pré Treino (Sala anexa)" },
        { hora: "09h00", desc: "Treino" },
      ],
      apos: "Almoço Obrigatório",
    },
    tarde: { tipo: "descanso" },
  },
  // Semana 30/03 — 05/04
  "2026-03-30": {
    manha: { tipo: "descanso" },
    tarde: {
      tipo: "treino",
      local: "CT Botafogo Academy",
      atividades: [
        { hora: "14h30", desc: "Apresentação" },
        { hora: "15h20", desc: "Pré Treino" },
        { hora: "16h00", desc: "Treino" },
      ],
      apos: "Lanche",
    },
  },
  "2026-03-31": {
    manha: {
      tipo: "treino",
      local: "Estádio Santa Cruz",
      atividades: [
        { hora: "07h00", desc: "Apresentação" },
        { hora: "08h00", desc: "Treino" },
      ],
      apos: "Lanche + Saída para Aeroporto",
    },
    tarde: {
      tipo: "viagem",
      local: "Viagem para Belo Horizonte-MG",
      atividades: [],
    },
  },
  "2026-04-01": {
    manha: {
      tipo: "treino",
      local: "Campo Auxiliar",
      atividades: [
        { hora: "07h30", desc: "Apresentação" },
        { hora: "08h30", desc: "Pré Treino (Sala anexa)" },
        { hora: "09h00", desc: "Treino Não Relacionados" },
      ],
      apos: "Almoço Obrigatório",
    },
    tarde: {
      tipo: "jogo",
      local: "Arena MRV",
      atividades: [
        { hora: "18h00", desc: "Brasileiro Série B — 2ª Rodada" },
      ],
    },
  },
  "2026-04-02": {
    manha: { tipo: "descanso" },
    tarde: { tipo: "descanso" },
  },
  "2026-04-03": {
    manha: { tipo: "descanso" },
    tarde: {
      tipo: "treino",
      local: "Campo Auxiliar",
      atividades: [
        { hora: "14h30", desc: "Apresentação" },
        { hora: "15h20", desc: "Pré Treino (Sala anexa)" },
        { hora: "16h00", desc: "Treino" },
      ],
      apos: "Lanche (Sala anexa)",
    },
  },
  "2026-04-04": {
    manha: { tipo: "descanso" },
    tarde: {
      tipo: "treino",
      local: "Estádio Santa Cruz",
      atividades: [
        { hora: "14h30", desc: "Apresentação" },
        { hora: "15h20", desc: "Pré Treino (Sala anexa)" },
        { hora: "16h00", desc: "Treino" },
      ],
      apos: "INÍCIO DE CONCENTRAÇÃO",
    },
  },
  "2026-04-05": {
    manha: {
      tipo: "treino",
      local: "Campo Auxiliar",
      atividades: [
        { hora: "07h30", desc: "Apresentação" },
        { hora: "08h30", desc: "Pré Treino (Sala anexa)" },
        { hora: "09h00", desc: "Treino Não Relacionados" },
      ],
      apos: "Almoço Obrigatório",
    },
    tarde: {
      tipo: "jogo",
      local: "Estádio Santa Cruz",
      atividades: [
        { hora: "20h30", desc: "Brasileiro Série B — 3ª Rodada" },
      ],
    },
  },
  // Semana 06/04 — 12/04
  "2026-04-06": {
    manha: { tipo: "descanso" },
    tarde: {
      tipo: "treino",
      local: "Campo Auxiliar",
      atividades: [
        { hora: "14h30", desc: "Apresentação" },
        { hora: "15h20", desc: "Pré Treino (Sala anexa)" },
        { hora: "16h00", desc: "Treino" },
      ],
      apos: "Lanche (Sala Anexa)",
    },
  },
  "2026-04-07": {
    manha: {
      tipo: "treino",
      local: "Estádio Santa Cruz",
      atividades: [
        { hora: "07h30", desc: "Apresentação" },
        { hora: "08h20", desc: "Pré Treino (Sala anexa)" },
        { hora: "09h00", desc: "Treino" },
      ],
      apos: "Almoço Obrigatório",
    },
    tarde: { tipo: "descanso" },
  },
  "2026-04-08": {
    manha: {
      tipo: "treino",
      local: "Estádio Santa Cruz",
      atividades: [
        { hora: "07h30", desc: "Apresentação" },
        { hora: "08h00", desc: "Pré Treino (Sala anexa)" },
        { hora: "08h30", desc: "Treino" },
      ],
      apos: "Lanche + Saída para Aeroporto",
    },
    tarde: {
      tipo: "viagem",
      local: "Viagem para Criciúma-SC",
      atividades: [],
    },
  },
  "2026-04-09": {
    manha: {
      tipo: "treino",
      local: "Campo Auxiliar",
      atividades: [
        { hora: "07h30", desc: "Apresentação" },
        { hora: "08h20", desc: "Pré Treino (Sala anexa)" },
        { hora: "09h00", desc: "Treino Não Relacionados" },
      ],
      apos: "Almoço Obrigatório",
    },
    tarde: {
      tipo: "treino",
      local: "Criciúma-SC",
      atividades: [
        { hora: "", desc: "Treino em Criciúma-SC" },
      ],
    },
  },
  "2026-04-10": {
    manha: {
      tipo: "treino",
      local: "Campo Auxiliar",
      atividades: [
        { hora: "07h30", desc: "Apresentação" },
        { hora: "08h20", desc: "Pré Treino (Sala anexa)" },
        { hora: "09h00", desc: "Treino Não Relacionados" },
      ],
      apos: "Almoço Obrigatório",
    },
    tarde: {
      tipo: "jogo",
      local: "Heriberto Hülse",
      atividades: [
        { hora: "20h30", desc: "Brasileiro Série B — 4ª Rodada" },
      ],
    },
  },
  "2026-04-11": {
    manha: {
      tipo: "treino",
      local: "Campo Auxiliar",
      atividades: [
        { hora: "07h30", desc: "Apresentação" },
        { hora: "08h20", desc: "Pré Treino (Sala anexa)" },
        { hora: "09h00", desc: "Treino Não Relacionados" },
      ],
      apos: "Almoço Obrigatório",
    },
    tarde: { tipo: "descanso" },
  },
  "2026-04-12": {
    manha: { tipo: "descanso" },
    tarde: { tipo: "descanso" },
  },
};

// ═══════════════════════════════════════════════
// POSICOES
// ═══════════════════════════════════════════════
export const POSICOES = ["Goleiro","Lateral Direito","Lateral Esquerdo","Zagueiro","Volante","Meia","Atacante","Extremo","Centroavante"];

// ═══════════════════════════════════════════════
// PRIO COLORS & STATUS IND (functions to use current C)
// ═══════════════════════════════════════════════
export const getPrioColors = () => ({alta: C.red, media: C.yellow, baixa: C.green});
export const getStatusIndColors = () => ({novo: C.blue, em_analise: C.yellow, aprovado: C.green, descartado: C.red});

export const STATUS_IND = {novo:"Novo",em_analise:"Em Análise",aprovado:"Aprovado",descartado:"Descartado"};

// ═══════════════════════════════════════════════
// ATRIBUICOES TAREFA
// ═══════════════════════════════════════════════
export const ATRIBUICOES_TAREFA = [
  {value:"analise_adversario",label:"Análise de Adversário"},
  {value:"video_individual",label:"Vídeos Individuais"},
  {value:"prelecao",label:"Preleção"},
  {value:"modelo_jogo",label:"Modelo de Jogo"},
  {value:"bola_parada",label:"Bolas Paradas"},
  {value:"treino",label:"Treino / Coletivo"},
  {value:"material_orientador",label:"Material Orientador"},
  {value:"edicao_video",label:"Edição de Vídeo"},
  {value:"relatorio",label:"Relatório"},
  {value:"outro",label:"Outro (especificar)"},
];

// ═══════════════════════════════════════════════
// NAV CONFIGURATION
// ═══════════════════════════════════════════════
export const NAV = [
  { section: "GERAL", items: [{ id:"dashboard",label:"Dashboard",icon:BarChart3 }]},
  { section: "OPERACIONAL", items: [
    { id:"modelo-jogo",label:"Modelo de Jogo",icon:BookOpen },
    { id:"adversario",label:"Adversário",icon:Crosshair },
    { id:"prelecao",label:"Preleção",icon:FileText },
    { id:"partidas",label:"Partidas / Pós-Jogo",icon:Shield },
    { id:"bolas-paradas",label:"Bolas Paradas",icon:Target },
    { id:"treinos",label:"Treinos",icon:Dumbbell },
  ]},
  { section: "ELENCO", items: [
    { id:"atletas",label:"Atletas",icon:Users },
    { id:"videos",label:"Biblioteca de Vídeos",icon:Video },
    { id:"indicacoes",label:"Indicação de Jogadores",icon:UserPlus },
  ]},
  { section: "GESTÃO", items: [
    { id:"analistas",label:"Analistas",icon:ClipboardList },
    { id:"protocolos",label:"Protocolos",icon:Settings },
  ]},
];

// ═══════════════════════════════════════════════
// AUTH — Users & Athlete Logins
// ═══════════════════════════════════════════════
export const normalizeLogin = (name) => name.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/\s+/g,"").replace(/[^a-z0-9]/g,"");

export const ATHLETE_LOGINS = {};
ATLETAS.forEach(a => { ATHLETE_LOGINS[normalizeLogin(a.nome)] = a; });

export const AUTH_USERS = {
  semirabrao: "analisebfsa",
  cassiocabral: "analisebfsa",
  caiofelipe: "analisebfsa",
  fillipesoutto: "analisebfsa",
  andreleite: "analisebfsa",
  ...Object.keys(ATHLETE_LOGINS).reduce((acc, k) => { acc[k] = "atleta"; return acc; }, {}),
};

export const isAthleteUser = (u) => !!ATHLETE_LOGINS[u];
export const getAthleteData = (u) => ATHLETE_LOGINS[u] || null;
