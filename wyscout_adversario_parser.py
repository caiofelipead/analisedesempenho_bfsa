"""
Wyscout PDF Team Report Parser → Adversário Database Importer
==============================================================
Extrai dados estruturados de relatórios Wyscout de equipe (PDF)
e prepara para importação no sistema analisedesempenho_bfsa.

Uso standalone:
    python wyscout_adversario_parser.py "Fortaleza EC.pdf"
    python wyscout_adversario_parser.py "Fortaleza EC.pdf" --output xlsx
    python wyscout_adversario_parser.py "Fortaleza EC.pdf" --post http://localhost:8000

Uso como módulo:
    from wyscout_adversario_parser import parse_wyscout_team_report
    relatorio = parse_wyscout_team_report("Fortaleza EC.pdf")
"""

import pdfplumber
import pandas as pd
import re
import json
import sys
from dataclasses import dataclass, field, asdict
from typing import Optional
from pathlib import Path


# ─── Data Models ──────────────────────────────────────────────

@dataclass
class JogadorAdversario:
    numero: int
    nome: str
    posicao: str
    idade: Optional[int] = None
    pe: Optional[str] = None
    altura: Optional[int] = None
    jogos: Optional[int] = None
    minutos: Optional[int] = None
    media_minutos: Optional[int] = None
    gols: Optional[int] = None
    assistencias: Optional[int] = None
    cartoes_amarelos: Optional[int] = None
    cartoes_vermelhos: Optional[int] = None
    xg: Optional[float] = None
    xa: Optional[float] = None
    remates_total: Optional[int] = None
    remates_no_alvo: Optional[int] = None
    remates_precisao: Optional[float] = None
    passes_total: Optional[int] = None
    passes_certos: Optional[int] = None
    passes_precisao: Optional[float] = None
    cruzamentos_total: Optional[int] = None
    cruzamentos_certos: Optional[int] = None
    dribles_total: Optional[int] = None
    dribles_certos: Optional[int] = None
    duelos_total: Optional[int] = None
    duelos_ganhos: Optional[int] = None
    duelos_precisao: Optional[float] = None
    perdas_meio_campo: Optional[str] = None
    recuperacoes: Optional[str] = None
    touches_area: Optional[int] = None
    duelos_def_total: Optional[int] = None
    duelos_def_ganhos: Optional[int] = None
    duelos_of_total: Optional[int] = None
    duelos_of_ganhos: Optional[int] = None
    duelos_aereos_total: Optional[int] = None
    duelos_aereos_ganhos: Optional[int] = None
    interceptacoes: Optional[str] = None
    cortes_carrinho: Optional[str] = None
    faltas_sofridas: Optional[str] = None
    passes_frente: Optional[str] = None
    passes_tras: Optional[str] = None
    passes_laterais: Optional[str] = None
    passes_curtos_medios: Optional[str] = None
    passes_longos: Optional[str] = None
    passes_progressivos: Optional[str] = None
    passes_terco_final: Optional[str] = None
    passes_diagonal: Optional[str] = None
    deep_completions: Optional[int] = None
    passes_decisivos: Optional[int] = None
    shot_assists: Optional[int] = None


@dataclass
class FormacaoAdversario:
    sistema: str
    frequencia_pct: float
    gols_favor: Optional[int] = None
    gols_contra: Optional[int] = None
    xg: Optional[float] = None
    xg_contra: Optional[float] = None
    posse_pct: Optional[float] = None
    posse_adversario_pct: Optional[float] = None
    precisao_passe_pct: Optional[float] = None
    precisao_passe_adv_pct: Optional[float] = None
    intensidade_jogo: Optional[float] = None
    intensidade_jogo_adv: Optional[float] = None
    passe_profundidade_pct: Optional[float] = None
    passe_profundidade_adv_pct: Optional[float] = None
    ppda: Optional[float] = None
    ppda_adv: Optional[float] = None


@dataclass
class FinalizacaoAdversario:
    remates_total: int = 0
    remates_no_alvo: int = 0
    precisao_remates_pct: float = 0.0
    xg_total: float = 0.0
    gols_total: int = 0
    remates_pe: Optional[str] = None
    cabeceamentos: Optional[str] = None
    dentro_area: Optional[str] = None
    fora_area: Optional[str] = None
    apos_cruzamentos: Optional[str] = None
    jogada_organizada: Optional[str] = None
    livres_penaltis: Optional[str] = None


@dataclass
class TransicoesAdversario:
    recuperacoes: list = field(default_factory=list)
    perdas: list = field(default_factory=list)
    faltas: list = field(default_factory=list)


@dataclass
class ResultadoJogo:
    data: str
    competicao: str
    adversario: str
    gols_favor: int
    gols_contra: int
    mandante: bool


@dataclass
class RelatorioAdversario:
    equipe: str
    jogos_analisados: int = 0
    resultados: list = field(default_factory=list)
    jogadores: list = field(default_factory=list)
    formacoes: list = field(default_factory=list)
    finalizacao: Optional[FinalizacaoAdversario] = None
    transicoes: Optional[TransicoesAdversario] = None


# ─── Helpers ──────────────────────────────────────────────────

def _safe_int(text: str) -> Optional[int]:
    if not text or text == '-' or text.strip() == '':
        return None
    m = re.match(r'(\d+)', text.strip())
    return int(m.group(1)) if m else None


def _safe_float(text: str) -> Optional[float]:
    if not text or text == '-' or text.strip() == '':
        return None
    m = re.match(r'([\d.]+)', text.strip())
    return float(m.group(1)) if m else None


# ─── Page Parsers ─────────────────────────────────────────────

def parse_capa(text: str) -> tuple:
    """Page 1 — team name + match results."""
    lines = text.strip().split('\n')
    equipe = None
    resultados = []

    for line in lines:
        stripped = line.strip()
        if stripped and stripped not in ['R E L AT Ó R I O D E E Q U I PA', 'RELATÓRIO DE EQUIPA']:
            if not any(c in stripped for c in ['×', 'COPA', 'CEARENSE', 'PAULISTA', 'SÉRIE']):
                equipe = stripped
                break

    result_pattern = re.compile(r'(.+?)\s+(\d+)\s*×\s*(\d+)(?:\s*\(P\))?\s+(.+?)$')
    date_pattern = re.compile(r'(\d{2}\.\d{2}\.\d{4})')
    comp_pattern = re.compile(r'(COPA DO BRASIL|CEARENSE \d|PAULIST[ÃA]O|SÉRIE [A-D]|BRASILEIR[ÃA]O)', re.IGNORECASE)

    i = 0
    while i < len(lines):
        line = lines[i].strip()
        m = result_pattern.match(line)
        if m:
            team1, g1, g2, team2 = m.group(1).strip(), int(m.group(2)), int(m.group(3)), m.group(4).strip()
            data = comp = ''
            for j in range(i+1, min(i+3, len(lines))):
                dm = date_pattern.search(lines[j])
                if dm:
                    data = dm.group(1)
                cm = comp_pattern.search(lines[j])
                if cm:
                    comp = cm.group(1)

            if equipe:
                mandante = equipe.lower() in team1.lower()
                gf = g1 if mandante else g2
                gc = g2 if mandante else g1
                adv = team2 if mandante else team1
            else:
                mandante, gf, gc, adv = True, g1, g2, team2

            resultados.append(ResultadoJogo(
                data=data, competicao=comp, adversario=adv,
                gols_favor=gf, gols_contra=gc, mandante=mandante
            ))
        i += 1

    return equipe, resultados


def parse_jogadores_page2(text: str) -> list:
    """Page 2 — player roster."""
    jogadores = []
    player_pattern = re.compile(
        r'(\d{1,2})\s+(.+?)\s+(GK|LB|RB|LWB|RWB|CB|RCB|LCB|DMF|RDMF|LDMF|CMF|RCMF|LCMF|AMF|RAMF|LAMF|LW|RW|LWF|RWF|CF|SS)\s+'
        r'(\d{1,2})\s+'
        r'(\d{2,3}|-)\s+'
        r'(\d+)\s+'
        r"(\d+)'\s+"
        r"(\d+)'\s+"
        r'(\d+|-)\s+'
        r'(\d+|-)\s+'
        r'(\d+/\d+|-)\s*'
        r'(\d+/\d+|-)?'
    )

    for line in text.split('\n'):
        line = line.strip()
        if line in ('DEFESAS', 'MÉDIOS', 'ATACANTES', 'JOGADORES', ''):
            continue
        m = player_pattern.search(line)
        if m:
            cards = m.group(11)
            ca, cv = 0, 0
            if cards and cards != '-':
                parts = cards.split('/')
                ca, cv = int(parts[0]), int(parts[1])

            jogadores.append(JogadorAdversario(
                numero=int(m.group(1)),
                nome=m.group(2).strip(),
                posicao=m.group(3),
                idade=_safe_int(m.group(4)),
                altura=_safe_int(m.group(5)),
                jogos=_safe_int(m.group(6)),
                minutos=_safe_int(m.group(7)),
                media_minutos=_safe_int(m.group(8)),
                gols=_safe_int(m.group(9)),
                assistencias=_safe_int(m.group(10)),
                cartoes_amarelos=ca,
                cartoes_vermelhos=cv,
            ))
    return jogadores


def parse_dados_jogador_page3(text: str, jogadores: list) -> list:
    """Page 3 — detailed player stats."""
    jogador_map = {j.nome: j for j in jogadores}

    for line in text.split('\n'):
        line = line.strip()
        if not line or 'RELATÓRIO' in line or 'DADOS' in line or 'Jogador' in line:
            continue

        m = re.match(
            r'(\d{1,2})\s+(.+?)\s+(\d{2,3})\s+'
            r'([\d/.\-]+)\s+'
            r'([\d/.\-]+)\s+'
            r'([\d/.\-]+%?)\s+'
            r'([\d/.\-]+%?)\s+'
            r'([\d/.\-]+%?)\s+'
            r'([\d/.\-]+%?)\s+'
            r'([\d/.\-]+%?)\s+'
            r'([\d/.\-]+)\s+'
            r'([\d/.\-]+)\s+'
            r'(\d+|-)\s*'
            r'([\d/.\-]+)?',
            line
        )
        if m:
            nome = m.group(2).strip()
            if nome not in jogador_map:
                continue
            j = jogador_map[nome]

            # goals/xG
            gxg = m.group(4)
            if gxg and gxg != '-':
                parts = gxg.split('/')
                if len(parts) == 2:
                    j.gols = _safe_int(parts[0])
                    j.xg = _safe_float(parts[1])

            # assists/xA
            axa = m.group(5)
            if axa and axa != '-':
                parts = axa.split('/')
                if len(parts) == 2:
                    j.assistencias = _safe_int(parts[0])
                    j.xa = _safe_float(parts[1])

            # shots: "11/436%" → total=11, on_target=4, pct=36
            shots = m.group(6)
            if shots and shots != '-':
                sm = re.match(r'(\d+)/(\d+)(\d{2,3})%', shots)
                if sm:
                    j.remates_total = int(sm.group(1))
                    j.remates_no_alvo = int(sm.group(2))
                    j.remates_precisao = float(sm.group(3))

            # passes: "184/13272%" → total=184, accurate=132, pct=72
            passes = m.group(7)
            if passes and passes != '-':
                pm = re.match(r'(\d+)/(\d+)(\d{2,3})%', passes)
                if pm:
                    j.passes_total = int(pm.group(1))
                    j.passes_certos = int(pm.group(2))
                    j.passes_precisao = float(pm.group(3))

            # duels
            duels = m.group(10)
            if duels and duels != '-':
                dm = re.match(r'(\d+)/(\d+)(\d{2,3})%', duels)
                if dm:
                    j.duelos_total = int(dm.group(1))
                    j.duelos_ganhos = int(dm.group(2))
                    j.duelos_precisao = float(dm.group(3))

            j.perdas_meio_campo = m.group(11) if m.group(11) != '-' else None
            j.recuperacoes = m.group(12) if m.group(12) != '-' else None
            j.touches_area = _safe_int(m.group(13))

    return jogadores


def parse_duelos_page4(text: str, jogadores: list) -> list:
    """Page 4 — duel stats."""
    jogador_map = {j.nome: j for j in jogadores}

    for line in text.split('\n'):
        m = re.match(
            r'(\d{1,2})\s+(.+?)\s+(\d{2,3})\s+'
            r'([\d/]+%?)\s+'
            r'([\d/]+%?)\s+'
            r'([\d/]+%?)\s+'
            r'([\d/]+%?)\s+'
            r'(\d+|-)\s+'
            r'([\d/]+|-)\s+'
            r'([\d/]+%?|-)\s+'
            r'([\d/]+)',
            line.strip()
        )
        if m:
            nome = m.group(2).strip()
            if nome not in jogador_map:
                continue
            j = jogador_map[nome]

            for field_name, group_idx in [('duelos_def', 4), ('duelos_of', 5), ('duelos_aereos', 6)]:
                val = m.group(group_idx)
                fm = re.match(r'(\d+)/(\d+)', val)
                if fm:
                    setattr(j, f'{field_name}_total', int(fm.group(1)))
                    setattr(j, f'{field_name}_ganhos', int(fm.group(2)))

            j.interceptacoes = m.group(9) if m.group(9) != '-' else None
            j.cortes_carrinho = m.group(10) if m.group(10) != '-' else None
            j.faltas_sofridas = m.group(11) if m.group(11) != '-' else None

    return jogadores


def parse_passes_page5(text: str, jogadores: list) -> list:
    """Page 5 — passing stats."""
    jogador_map = {j.nome: j for j in jogadores}

    for line in text.split('\n'):
        m = re.match(
            r'(\d{1,2})\s+(.+?)\s+(\d{2,3})\s+'
            r'([\d/]+%?)\s+'
            r'([\d/]+%?)\s+'
            r'([\d/]+%?)\s+'
            r'([\d/]+%?)\s+'
            r'([\d/]+%?)\s+'
            r'([\d/]+%?)\s+'
            r'([\d/]+%?)\s+'
            r'([\d/]+%?)\s+'
            r'(\d+|-)\s+'
            r'(\d+|-)\s+'
            r'([\d/]+|-)\s+'
            r'(\d+|-)',
            line.strip()
        )
        if m:
            nome = m.group(2).strip()
            if nome not in jogador_map:
                continue
            j = jogador_map[nome]
            j.passes_frente = m.group(4)
            j.passes_tras = m.group(5)
            j.passes_laterais = m.group(6)
            j.passes_curtos_medios = m.group(7)
            j.passes_longos = m.group(8)
            j.passes_progressivos = m.group(9)
            j.passes_terco_final = m.group(10)
            j.passes_diagonal = m.group(11)
            j.deep_completions = _safe_int(m.group(12))
            j.passes_decisivos = _safe_int(m.group(13))
            j.shot_assists = _safe_int(m.group(15))

    return jogadores


def parse_formacoes_page6(text: str) -> list:
    """Page 6 — formations with KPIs."""
    formacoes = []
    blocks = re.split(r'(?=\d-\d-\d(?:-\d)?\n)', text)

    for block in blocks:
        lines = block.strip().split('\n')
        if not lines:
            continue

        fm = re.match(r'^(\d-\d-\d(?:-\d)?)\s*$', lines[0].strip())
        if not fm:
            continue

        sistema = fm.group(1)
        freq = None
        for line in lines[1:5]:
            pm = re.search(r'(\d+)%', line)
            if pm:
                freq = float(pm.group(1))
                break

        if freq is None:
            continue

        f = FormacaoAdversario(sistema=sistema, frequencia_pct=freq)
        block_text = '\n'.join(lines)

        patterns = {
            'gols': (r'(\d+)\s+GOLO\s+(\d+)', ['gols_favor', 'gols_contra'], int),
            'xg': (r'([\d.]+)\s+XG\s+([\d.]+)', ['xg', 'xg_contra'], float),
            'posse': (r'([\d.]+)\s+POSSE,?\s*%\s+([\d.]+)', ['posse_pct', 'posse_adversario_pct'], float),
            'passe': (r'([\d.]+)\s+PRECISÃO DO PASSE,?\s*%\s+([\d.]+)', ['precisao_passe_pct', 'precisao_passe_adv_pct'], float),
            'intensidade': (r'([\d.]+)\s+INTENSIDADE DE JOGO\s+([\d.]+)', ['intensidade_jogo', 'intensidade_jogo_adv'], float),
            'profundidade': (r'([\d.]+)\s+PARTILHA DE PASSE EM\s+(?:PROFUNDIDADE,?\s*%\s+)?([\d.]+)', ['passe_profundidade_pct', 'passe_profundidade_adv_pct'], float),
            'ppda': (r'([\d.]+)\s+PPDA\s+(?:RC_PPDA_ABBR\s+)?([\d.]+)', ['ppda', 'ppda_adv'], float),
        }

        for _, (pat, fields, cast) in patterns.items():
            matches = re.findall(pat, block_text)
            if matches:
                setattr(f, fields[0], cast(matches[0][0]))
                setattr(f, fields[1], cast(matches[0][1]))

        formacoes.append(f)

    return formacoes


def parse_finalizacao_page15(text: str) -> FinalizacaoAdversario:
    """Page 15 — shooting/finishing."""
    fin = FinalizacaoAdversario()
    m = re.search(r'Total\s+(\d+)/(\d+)\s+([\d.]+)%\s+([\d.]+)\s+(\d+)', text)
    if m:
        fin.remates_total = int(m.group(1))
        fin.remates_no_alvo = int(m.group(2))
        fin.precisao_remates_pct = float(m.group(3))
        fin.xg_total = float(m.group(4))
        fin.gols_total = int(m.group(5))
    return fin


def parse_transicoes_page16(text: str) -> TransicoesAdversario:
    """Page 16 — transitions."""
    trans = TransicoesAdversario()
    player_pattern = re.compile(r'(\d{1,2})\s+(.+?)\s+(\d+)\'\s+(\d+)\s+([\d.]+)')

    sections = text.split('Perdas da poss')
    if len(sections) >= 2:
        for m in player_pattern.finditer(sections[0]):
            trans.recuperacoes.append({
                'numero': int(m.group(1)), 'nome': m.group(2).strip(),
                'minutos': int(m.group(3)), 'total': int(m.group(4)), 'media_90': float(m.group(5))
            })

        rest = sections[1]
        falta_sections = rest.split('Faltas cometidas')

        for m in player_pattern.finditer(falta_sections[0]):
            trans.perdas.append({
                'numero': int(m.group(1)), 'nome': m.group(2).strip(),
                'minutos': int(m.group(3)), 'total': int(m.group(4)), 'media_90': float(m.group(5))
            })

        if len(falta_sections) >= 2:
            for m in player_pattern.finditer(falta_sections[1]):
                trans.faltas.append({
                    'numero': int(m.group(1)), 'nome': m.group(2).strip(),
                    'minutos': int(m.group(3)), 'total': int(m.group(4)), 'media_90': float(m.group(5))
                })

    return trans


# ─── Main Parser ──────────────────────────────────────────────

def parse_wyscout_team_report(pdf_path: str) -> RelatorioAdversario:
    """Parse a complete Wyscout team report PDF → structured data."""
    with pdfplumber.open(pdf_path) as pdf:
        pages_text = [page.extract_text() or '' for page in pdf.pages]

    equipe, resultados = parse_capa(pages_text[0])
    relatorio = RelatorioAdversario(
        equipe=equipe or "Unknown",
        jogos_analisados=len(resultados),
        resultados=[asdict(r) for r in resultados],
    )

    jogadores = parse_jogadores_page2(pages_text[1])
    if len(pages_text) > 2:
        jogadores = parse_dados_jogador_page3(pages_text[2], jogadores)
    if len(pages_text) > 3:
        jogadores = parse_duelos_page4(pages_text[3], jogadores)
    if len(pages_text) > 4:
        jogadores = parse_passes_page5(pages_text[4], jogadores)

    relatorio.jogadores = [asdict(j) for j in jogadores]

    if len(pages_text) > 5:
        relatorio.formacoes = [asdict(f) for f in parse_formacoes_page6(pages_text[5])]
    if len(pages_text) > 14:
        relatorio.finalizacao = asdict(parse_finalizacao_page15(pages_text[14]))
    if len(pages_text) > 15:
        relatorio.transicoes = asdict(parse_transicoes_page16(pages_text[15]))

    return relatorio


# ─── Export ───────────────────────────────────────────────────

def export_json(relatorio: RelatorioAdversario, output_path: str):
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(asdict(relatorio), f, ensure_ascii=False, indent=2)
    print(f"[OK] JSON: {output_path}")


def export_xlsx(relatorio: RelatorioAdversario, output_path: str):
    with pd.ExcelWriter(output_path, engine='openpyxl') as writer:
        if relatorio.jogadores:
            df = pd.DataFrame(relatorio.jogadores)
            cols = [c for c in ['numero','nome','posicao','idade','altura','jogos','minutos',
                    'gols','xg','assistencias','xa','remates_total','remates_no_alvo',
                    'passes_total','passes_certos','passes_precisao',
                    'duelos_total','duelos_ganhos','duelos_precisao',
                    'duelos_def_total','duelos_def_ganhos','duelos_of_total','duelos_of_ganhos',
                    'duelos_aereos_total','duelos_aereos_ganhos',
                    'passes_decisivos','shot_assists',
                    'cartoes_amarelos','cartoes_vermelhos'] if c in df.columns]
            df[cols].to_excel(writer, sheet_name='Jogadores', index=False)
        if relatorio.formacoes:
            pd.DataFrame(relatorio.formacoes).to_excel(writer, sheet_name='Formações', index=False)
        if relatorio.resultados:
            pd.DataFrame(relatorio.resultados).to_excel(writer, sheet_name='Resultados', index=False)
        if relatorio.finalizacao:
            pd.DataFrame([relatorio.finalizacao]).to_excel(writer, sheet_name='Finalização', index=False)
        if relatorio.transicoes:
            if relatorio.transicoes.get('recuperacoes'):
                pd.DataFrame(relatorio.transicoes['recuperacoes']).to_excel(writer, sheet_name='Recuperações', index=False)
            if relatorio.transicoes.get('perdas'):
                pd.DataFrame(relatorio.transicoes['perdas']).to_excel(writer, sheet_name='Perdas', index=False)
    print(f"[OK] Excel: {output_path}")


def to_api_payload(relatorio: RelatorioAdversario) -> dict:
    return asdict(relatorio)


# ─── CLI ──────────────────────────────────────────────────────

if __name__ == '__main__':
    if len(sys.argv) < 2:
        print("Uso: python wyscout_adversario_parser.py <pdf> [--output json|xlsx] [--post URL]")
        sys.exit(1)

    pdf_path = sys.argv[1]
    output_format = 'json'
    api_url = None

    for i, arg in enumerate(sys.argv[2:], 2):
        if arg == '--output' and i + 1 < len(sys.argv):
            output_format = sys.argv[i + 1]
        elif arg == '--post' and i + 1 < len(sys.argv):
            api_url = sys.argv[i + 1]

    print(f"[*] Parsing: {pdf_path}")
    relatorio = parse_wyscout_team_report(pdf_path)
    print(f"[*] {relatorio.equipe} | {relatorio.jogos_analisados} jogos | {len(relatorio.jogadores)} jogadores | {len(relatorio.formacoes)} formações")

    stem = Path(pdf_path).stem.replace(' ', '_')
    if output_format == 'json':
        export_json(relatorio, f"{stem}_parsed.json")
    elif output_format == 'xlsx':
        export_xlsx(relatorio, f"{stem}_parsed.xlsx")

    if api_url:
        import requests
        resp = requests.post(f"{api_url}/api/adversario/importar", json=to_api_payload(relatorio))
        print(f"[*] API: {resp.status_code} — {resp.json()}")
