"""
Normaliza as normas ME do DNIT para o formato do cofre Obsidian
(modelo: markdown/metodo-de-ensaio-me/dnit_036_2004_me.md, revisado à mão).

Diferente do DNER, aqui o texto é reextraído DIRETO DO PDF, respeitando as
duas colunas da página (a extração linear embaralhava colunas e páginas) e
guardando a posição de cada linha. Isso permite:
  - remontar parágrafos pelo espaçamento vertical;
  - achar cada fórmula (bloco com fonte maior ou caracteres matemáticos),
    recortá-la em imagem e deixar um marcador no texto.

Fórmulas: o LaTeX transcrito fica em data/formulas/<arquivo>.json (id ->
latex). Quando existe, entra no markdown como bloco $$...$$; quando não,
entra um callout "pendente" com a imagem recortada (em markdown/_formulas/).

Uso:
  python scripts/normalizar_me_dnit.py [arquivos.md ...] [--force]
Sem --force, pula arquivos que já têm `Citada por` (normalizados/revisados).
"""
import json
import re
import sys
import unicodedata
from collections import Counter
from pathlib import Path

import pymupdf

sys.path.insert(0, str(Path(__file__).resolve().parent))
import build_graph as bg  # noqa: E402
from normalizar_me_dner import area_for, video_for, dump_front_matter, parse_front_matter, parse_date  # noqa: E402

ROOT = Path(__file__).resolve().parent.parent
MD_ROOT = ROOT / "markdown"
ME_DIR = MD_ROOT / "metodo-de-ensaio-me"
FORMULAS_DIR = ROOT / "data" / "formulas"
FORMULAS_IMG = MD_ROOT / "_formulas"
FIGURAS_DIR = ROOT / "data" / "figuras"
FIGURAS_IMG = MD_ROOT / "_figuras"
NORMAS_JSON = ROOT / "data" / "normas.json"
GRAPH_JSON = ROOT / "data" / "graph.json"

MATH_CHARS = re.compile(r"[\U0001D400-\U0001D7FFℎ]")
DEBUG_FORMULAS = False
COVER_NOISE = re.compile(
    r"Autor|Processo|Origem|Aprova[çc]ão|Direitos autorais|citada a fonte|propaganda|comercial"
    r"|Palavras|Total de|páginas|NORMA DNIT|^DNIT$|MINIST|DEPARTAMENTO|DIRETORIA|INSTITUTO"
    r"|PESQUISA|TRANSPORTES|RODOVI|Setor|Quadra|Ed\.|Edifício|Brasília|Rodovia|Centro Rodovi"
    r"|Rio de Janeiro|Tel|E-mail|CEP|INFRA",
    re.I,
)
PRONOUNS = {"se", "lo", "la", "los", "las", "lhe", "lhes"}
NAMED_HEADINGS = {"resumo": "Resumo", "abstract": "Abstract", "sumário": "Sumário",
                  "prefácio": "Prefácio", "índice geral": "Índice geral"}
# tipos em que cada tabela markdown ganha também a imagem recortada do PDF
TABLE_IMAGES = {t: True for t in ("ES", "EM", "PRO", "CLA", "TER", "IE", "PAD")}
INTRO_RE = re.compile(r"(fórmula|expressão|equação|equações|seguinte|a seguir)[^.]{0,40}[:.]?\s*$", re.I)
LEGEND_START_RE = re.compile(r"^(onde|em que|sendo)\s*:?\s*$", re.I)


# --------------------------------------------------------------- vocabulário
_VOCAB = None
DOC_VOCAB = set()  # palavras do documento em processamento (preenchido em process)


def doc_vocab(lines):
    words = set()
    for r in lines:
        for w in re.findall(r"[A-Za-zÀ-ÿ]+(?:-[A-Za-zÀ-ÿ]+)*(?=[\s,.;:)]|$)", r["text"]):
            words.add(w.lower())
    return words


def vocab():
    """Contagem de palavras do acervo, para decidir hifenização em fim de linha
    ('laborató-/rio' -> 'laboratório', mas 'banho-/maria' -> 'banho-maria')."""
    global _VOCAB
    if _VOCAB is None:
        c = Counter()
        for f in MD_ROOT.rglob("*.md"):
            for line in f.read_text(encoding="utf-8").split("\n"):
                # só palavras no meio da linha (a última pode estar partida)
                for w in re.findall(r"[A-Za-zÀ-ÿ]+(?:-[A-Za-zÀ-ÿ]+)*(?=[\s,.;:)])", line):
                    c[w.lower()] += 1
        _VOCAB = c
    return _VOCAB


def join_lines(a, b):
    if not a:
        return b
    if re.search(r"\s[-–]$", a) or a.endswith("–"):
        return a + " " + b
    if a.endswith("-") and re.search(r"[A-Za-zÀ-ÿ0-9]-$", a):
        first = re.match(r"\S*", b).group(0)
        last = a.split()[-1][:-1]
        if not first or not first[0].islower():
            return a + b  # "DNER-" + "EM 035/95"
        # compara a palavra inteira: "corpos-" + "de-prova" -> "corpos-de-prova" x "corposde-prova"
        tail = re.match(r"[A-Za-zÀ-ÿ]+(?:-[A-Za-zÀ-ÿ]+)*", first)
        tail = tail.group(0) if tail else ""
        hyph, joined = f"{last}-{tail}".lower(), f"{last}{tail}".lower()
        # a grafia usada no próprio documento vale mais que a do acervo
        if hyph in DOC_VOCAB:
            return a + b
        if joined in DOC_VOCAB:
            return a[:-1] + b
        v = vocab()
        if v[joined] > v[hyph]:
            return a[:-1] + b  # quebra silábica: "recen-" + "te" -> "recente"
        if v[hyph] > v[joined] or tail.lower() in PRONOUNS:
            return a + b  # composto ou ênclise: "banho-maria", "utilizando-se"
        return a[:-1] + b
    return a + " " + b


# ------------------------------------------------------------- extração PDF

def is_bold(span):
    return bool(span["flags"] & 16) or "Bold" in span["font"]


# marcadores internos de índice (removidos/convertidos em finish_scripts)
SUB_A, SUB_B, SUP_A, SUP_B = "\x01", "\x02", "\x03", "\x04"

# fonte Symbol usa códigos da área privada (U+F0xx): μ vem como U+F06D etc.
SYMBOL_MAP = {
    0x2D: "−", 0x2B: "+", 0x3D: "=", 0x3C: "<", 0x3E: ">", 0x28: "(", 0x29: ")", 0x20: " ",
    0x61: "α", 0x62: "β", 0x63: "χ", 0x64: "δ", 0x65: "ε", 0x66: "φ", 0x67: "γ", 0x68: "η",
    0x69: "ι", 0x6A: "ϕ", 0x6B: "κ", 0x6C: "λ", 0x6D: "μ", 0x6E: "ν", 0x70: "π", 0x71: "θ",
    0x72: "ρ", 0x73: "σ", 0x74: "τ", 0x75: "υ", 0x77: "ω", 0x78: "ξ", 0x79: "ψ", 0x7A: "ζ",
    0x44: "Δ", 0x46: "Φ", 0x47: "Γ", 0x4C: "Λ", 0x50: "Π", 0x51: "Θ", 0x53: "Σ", 0x57: "Ω",
    0x59: "Ψ", 0xB0: "°", 0xB1: "±", 0xB4: "×", 0xB8: "÷", 0xA3: "≤", 0xB3: "≥", 0xB9: "≠",
    0xBB: "≈", 0xB7: "•", 0xA5: "∞", 0xD6: "√", 0xE5: "∑", 0xB6: "∂", 0xAE: "→",
}
GREEK_TEX = {"α": r"\alpha", "β": r"\beta", "γ": r"\gamma", "δ": r"\delta", "ε": r"\varepsilon",
             "η": r"\eta", "θ": r"\theta", "λ": r"\lambda", "μ": r"\mu", "ν": r"\nu", "π": r"\pi",
             "ρ": r"\rho", "σ": r"\sigma", "τ": r"\tau", "φ": r"\varphi", "ω": r"\omega",
             "Δ": r"\Delta", "Σ": r"\Sigma", "Ω": r"\Omega", "γ": r"\gamma"}


def fix_private_chars(t, font):
    """Traduz caracteres da área privada (fontes Symbol/Wingdings) para Unicode."""
    out = []
    for ch in t:
        cp = ord(ch)
        if 0xF020 <= cp <= 0xF0FF:
            low = cp - 0xF000
            if "Symbol" in font and low in SYMBOL_MAP:
                out.append(SYMBOL_MAP[low])
            else:
                out.append("•")  # marcadores Wingdings (▪, ➢ ...) viram item de lista
        else:
            out.append(ch)
    return "".join(out)


def spans_text(spans):
    """Junta os trechos de uma linha. O espaço vem da distância real entre eles
    no PDF (evita '( G sa )' e 'formaçã o'), e trechos menores deslocados da
    linha de base viram subscrito/sobrescrito (ME_sa, cm³)."""
    size = max(s["size"] for s in spans)
    base = next(s for s in spans if s["size"] == size)["origin"][1]
    text, prev = "", None
    for s in spans:
        t = fix_private_chars(s["text"], s["font"])
        kind = None
        if s["size"] < size * 0.85:
            dy = s["origin"][1] - base
            kind = "sup" if dy < -1 else ("sub" if dy > 1 else None)
        if s["flags"] & 1:
            kind = "sup"
        if prev is not None and text and not text.endswith(" ") and not t.startswith(" ") and kind is None:
            if s["bbox"][0] - prev["bbox"][2] > s["size"] * 0.2:
                text += " "
        if kind == "sub":
            text += SUB_A + t.strip() + SUB_B
        elif kind == "sup":
            text += SUP_A + t.strip() + SUP_B
        else:
            text += t
        prev = s
    return text


SUPERSCRIPT_DIGITS = {"2": "²", "3": "³", "1": "¹", "0": "⁰", "-": "⁻"}


def finish_scripts(t):
    """Converte os marcadores de índice em LaTeX/Unicode."""
    def sub(m):
        base, idx = unmath(m.group(1)), unmath(m.group(2)).strip()
        base = "".join(GREEK_TEX.get(c, c) for c in base)
        return f"${base}_{{{idx}}}$"

    def sup(m):
        base, idx = m.group(1), unmath(m.group(2)).strip()
        if all(ch in SUPERSCRIPT_DIGITS for ch in idx):  # unidades: cm³, kgf/cm²
            return base + "".join(SUPERSCRIPT_DIGITS[ch] for ch in idx)
        return f"${unmath(base)}^{{{idx}}}$" if base else f"$^{{{idx}}}$"

    t = re.sub(r"([A-Za-zΑ-ω\U0001D400-\U0001D7FFℎ’']{1,4})" + SUB_A + "([^" + SUB_B + "]+)" + SUB_B,
               sub, t)
    t = re.sub(r"(\S{0,4}?)" + SUP_A + "([^" + SUP_B + "]+)" + SUP_B, sup, t)
    t = re.sub("[" + SUB_A + SUB_B + SUP_A + SUP_B + "]", "", t)
    return re.sub(r"(\$[^$\s][^$]*\$)(?=[–=])", r"\1 ", t)


def page_lines(page, body_size):
    """Linhas da página com posição, em ordem de leitura por coluna."""
    mid = page.rect.width / 2
    raw = []
    for b in page.get_text("dict")["blocks"]:
        if b["type"] == 1:
            # imagem pequena dentro da coluna = fórmula colada como figura
            x0, y0, x1, y1 = b["bbox"]
            if 8 < y1 - y0 <= 70 and x1 - x0 <= 300:
                raw.append({"text": "", "bbox": [x0, y0, x1, y1], "size": body_size, "bold": False,
                            "math": True, "img": True, "page": page.number})
            continue
        if b["type"] != 0:
            continue
        for l in b["lines"]:
            spans = [s for s in l["spans"] if s["text"].strip()]
            if not spans:
                continue
            text = spans_text(spans)
            x0, y0, x1, y1 = l["bbox"]
            raw.append({
                "text": re.sub(r"\s+", " ", text).strip(),
                "bbox": [x0, y0, x1, y1],
                "size": max(s["size"] for s in spans),
                "bold": all(is_bold(s) for s in spans),
                "math": bool(MATH_CHARS.search(text)) or any(
                    "Math" in s["font"] or "MT Extra" in s["font"] for s in spans),
                "page": page.number,
            })
    for r in raw:
        x0, _, x1, _ = r["bbox"]
        # largura total de verdade ocupa mais da metade da página; uma linha de
        # sumário com pontilhado longo pode cruzar o meio sem ser largura total
        wide = x0 < mid - 25 and x1 > mid + 25 and (x1 - x0) > page.rect.width * 0.55
        r["col"] = "full" if wide else ("L" if x0 < mid else "R")

    # junta pedaços da mesma linha visual ("b)" + "observar...", "1" + "Objetivo")
    raw.sort(key=lambda r: (r["col"] != "full", r["col"], round(r["bbox"][1]), r["bbox"][0]))
    merged = []
    for r in raw:
        p = merged[-1] if merged else None
        # só junta pedaços próximos: blocos distantes na mesma altura (logo "DNIT" e
        # data da capa, palavra-chave e "Total de páginas") são coisas diferentes
        if (p and p["col"] == r["col"] and abs(p["bbox"][1] - r["bbox"][1]) < 2.5
                and not (p["math"] or r["math"]) and r["bbox"][0] >= p["bbox"][0]
                and r["bbox"][0] - p["bbox"][2] < 40):
            p["text"] = f"{p['text']} {r['text']}"
            p["bbox"] = [p["bbox"][0], min(p["bbox"][1], r["bbox"][1]),
                         max(p["bbox"][2], r["bbox"][2]), max(p["bbox"][3], r["bbox"][3])]
            p["bold"] = p["bold"] and r["bold"]
            p["size"] = max(p["size"], r["size"])
        else:
            merged.append(dict(r))

    # ordem de leitura: blocos de largura total separam faixas; em cada faixa,
    # coluna esquerda inteira e depois a direita
    merged.sort(key=lambda r: r["bbox"][1])
    out, left, right = [], [], []
    for r in merged:
        if r["col"] == "full":
            out += sorted(left, key=lambda q: q["bbox"][1]) + sorted(right, key=lambda q: q["bbox"][1])
            left, right = [], []
            out.append(r)
        else:
            (left if r["col"] == "L" else right).append(r)
    out += sorted(left, key=lambda q: q["bbox"][1]) + sorted(right, key=lambda q: q["bbox"][1])
    return out


def is_header_footer(r, page_height):
    t = r["text"]
    # cabeçalho de página: até y≈51 nas normas de 2022+, até y≈43 nas anteriores
    if r["bbox"][3] < 58 and (re.search(r"NORMA\s+DNIT", t) or re.fullmatch(r"\d{1,3}", t)):
        return True
    if r["bbox"][1] > page_height - 45 and re.fullmatch(r"\d{1,3}", t):
        return True
    return False


# ------------------------------------------------------------------ capa

def split_cover(lines):
    """Linhas da página 1 acima do 'Resumo' são a capa."""
    resumo = next((r for r in lines if r["page"] == 0 and r["text"].lower() == "resumo"), None)
    limit = resumo["bbox"][1] - 2 if resumo else 320

    def in_cover(r):
        # linhas do sumário podem começar acima do "Resumo" na coluna da direita
        return r["page"] == 0 and r["bbox"][1] < limit and not re.search(r"\.{5,}", r["text"])

    cover = [r for r in lines if in_cover(r)]
    rest = [r for r in lines if not in_cover(r)]
    return cover, rest, limit


def cover_metadata(cover, body_size):
    ordered = sorted(cover, key=lambda r: (round(r["bbox"][1]), r["bbox"][0]))
    for r in ordered:
        r["text"] = finish_scripts(r["text"])
    title_parts = [
        r["text"] for r in ordered
        if r["size"] >= body_size * 1.3
        and not re.search(r"NORMA\s+DNIT|^DNIT$", r["text"])
        and not re.fullmatch(r"(DNIT\s*)?[A-Za-zÇç]+\s*[/ ]\s*\d{4}", r["text"])
    ]
    title = re.sub(r"\s+", " ", " ".join(title_parts)).strip()

    text = " ".join(r["text"] for r in ordered)
    aprov = None
    m = re.search(r"Aprova(?:[çc]ão|d[ao])[^0-9]{0,80}?(\d{1,2})\s*/\s*(\d{1,2})\s*/\s*(\d{4})", text)
    if m:
        aprov = parse_date(*m.groups())

    kw_lines = [
        r["text"] for r in ordered
        if r["bbox"][0] >= 200 and r["size"] < body_size * 1.3
        and not COVER_NOISE.search(r["text"]) and not re.fullmatch(r"[\d\s]+", r["text"])
    ]
    # às vezes a palavra-chave vem na mesma linha do endereço:
    # "Rio de Janeiro/RJ – CEP: 21240-000 Mistura asfáltica, módulo dinâmico,"
    for r in ordered:
        m = re.search(r"CEP:?\s*[\d.\-]+\s+(.*,.*)$", r["text"])
        if m:
            kw_lines.append(m.group(1))
    kws = []
    for k in " ".join(kw_lines).split(","):
        k = k.strip().rstrip(".").strip()
        # data da capa colada na 1ª palavra-chave ("OUTUBRO 2022 Pavimentação")
        k = re.sub(r"^(janeiro|fevereiro|março|abril|maio|junho|julho|agosto|setembro|outubro"
                   r"|novembro|dezembro)\s*/?\s*\d{4}\s*", "", k, flags=re.I)
        if k:
            kws.append(k[0].upper() + k[1:])
    return title, aprov, kws


# --------------------------------------------------------------- fórmulas

def legend_like(t):
    # "σ = tensão no ponto i" é legenda; "σ = + ω + ω A A cos( t )" é fórmula
    return bool(re.search(r"\s[–=]\s+[A-Za-zÀ-ÿ]{3,}\S*\s+\S+", t)) and len(t) > 20


def find_formulas(lines, body_size):
    """Agrupa linhas de fórmula (fonte maior / matemática) e anexa rótulo e número."""
    def formulaish(r):
        t = unmath(r["text"])
        if r.get("in_table") or legend_like(r["text"]):
            return False
        # títulos em fonte grande ("Anexo A (normativo)") têm palavras de verdade;
        # fórmulas têm só símbolos, variáveis curtas e números
        if re.search(r"[A-Za-zÀ-ÿ]{4,}\s+\(?[A-Za-zÀ-ÿ]{3,}", t):
            return False
        if not r["math"] and re.search(r"[A-Za-zÀ-ÿ]{5,}", t):
            return False
        return r["size"] >= body_size * 1.25 or r["math"]

    # margem esquerda de cada coluna, para reconhecer linhas recuadas/centralizadas
    # (linhas de largura total usam a margem da coluna esquerda)
    col_left = {}
    for r in lines:
        key = (r["page"], "R" if r["col"] == "R" else "L")
        col_left[key] = min(col_left.get(key, 1e9), r["bbox"][0])

    def text_fraction(i):
        """'ISC = Pressão calculada ... x100,' sobre 'pressão padrão' (fração em texto):
        numerador recuado com '=', denominador logo abaixo e dentro da largura dele."""
        if i + 1 >= len(lines):
            return False
        a, b = lines[i], lines[i + 1]
        if a.get("in_table") or b.get("in_table"):
            return False
        # dentro de legenda ("Onde:" / "σ i = tensão ...") é legenda, não fração
        seen = 0
        for k in range(i - 1, max(-1, i - 7), -1):
            prev_t = re.sub("[\x01-\x04]", "", unmath(lines[k]["text"])).strip()
            if len(prev_t) <= 3:
                continue  # pedaços de fórmula intercalados na ordem de leitura
            if LEGEND_START_RE.match(prev_t) or re.match(r"^(\S{1,4}(\s\S{1,3})?\s*)?[=–]\s+\S+\s+\S+", prev_t):
                return False
            seen += 1
            if seen >= 2:
                break
        left = col_left[(a["page"], "R" if a["col"] == "R" else "L")]
        return (" = " in a["text"] and len(a["text"]) <= 100 and a["bbox"][0] >= left + 8
                and b["page"] == a["page"]
                and 0 <= b["bbox"][1] - a["bbox"][3] < 6 and "=" not in b["text"]
                and b["bbox"][0] > a["bbox"][0] + 15 and b["bbox"][2] <= a["bbox"][2] + 5
                and len(b["text"]) <= 60)

    def intro_before(i):
        """Linha de texto anterior termina em ':' (ex.: 'pela fórmula:')."""
        for k in range(i - 1, max(-1, i - 4), -1):
            if lines[k].get("img") or formulaish(lines[k]):
                continue
            return lines[k]["text"].rstrip().endswith(":")
        return False

    def legend_after(g):
        k = g[-1] + 1
        return k < len(lines) and LEGEND_START_RE.match(lines[k]["text"]) is not None

    groups, i = [], 0
    while i < len(lines):
        if text_fraction(i):
            groups.append([i, i + 1])
            i += 2
            continue
        if not formulaish(lines[i]):
            i += 1
            continue
        g = [i]
        j = i + 1
        while j < len(lines) and formulaish(lines[j]) and lines[j]["page"] == lines[i]["page"] \
                and lines[j]["bbox"][1] - max(lines[k]["bbox"][3] for k in g) < 20:
            g.append(j)
            j += 1
        groups.append(g)
        i = j

    def box(g):
        return (lines[g[0]]["page"], min(lines[k]["bbox"][0] for k in g), min(lines[k]["bbox"][1] for k in g),
                max(lines[k]["bbox"][2] for k in g), max(lines[k]["bbox"][3] for k in g))

    by_page = {}
    for k, r in enumerate(lines):
        by_page.setdefault(r["page"], []).append(k)

    def piece(r):
        """Pedaço que pode pertencer a uma fórmula vizinha: trecho matemático,
        fragmento curto, rótulo terminado em '=' ou número da equação."""
        t = r["text"]
        if r.get("in_table") or legend_like(t) or t.rstrip().endswith(":"):
            return False
        if not formulaish(r) and not t.endswith("=") and re.search(r"[A-Za-zÀ-ÿ]{4,}", unmath(t)):
            return False  # texto corrido (ex.: "a seguir:"), não pedaço de fórmula
        return ((formulaish(r) or len(unmath(t)) <= 12 or t.endswith("=")
                     or re.fullmatch(r"\(\d+[a-z]?\)", t) is not None))

    # expansão: o grupo absorve pedaços encostados nele (rótulo à esquerda,
    # denominador embaixo, fim da expressão à direita, número da equação)
    grown = []
    for g in groups:
        cols = {lines[k]["col"] for k in g}
        g = set(g)
        changed = True
        while changed:
            changed = False
            p, x0, y0, x1, y1 = box(sorted(g))
            for k in by_page[p]:
                if k in g or not piece(lines[k]):
                    continue
                same_col = "full" in cols or lines[k]["col"] in cols or lines[k]["col"] == "full"
                a0, b0, a1, b1 = lines[k]["bbox"]
                vgap = max(b0 - y1, y0 - b1)
                hgap = max(a0 - x1, x0 - a1)
                same_row = min(y1, b1) - max(y0, b0) > 0
                t_k = lines[k]["text"].strip()
                # número "(7)" à direita, ou rótulo com texto "Resíduo (mg/l) =" à esquerda
                is_tag = re.fullmatch(r"\(\d+[a-z]?\)", t_k) is not None and a0 >= x1
                is_label = t_k.endswith("=") and len(t_k) > 2 and a1 <= x0 + 5
                # denominador/índice curto pode ficar um pouco mais afastado
                vlim = 10 if len(re.sub("[\x01-\x04]", "", unmath(t_k))) <= 3 else 7
                # encostado pode cruzar a divisão de coluna; longe, nunca (legendas vizinhas)
                if (vgap <= vlim and hgap <= 30) or (same_col and same_row and (is_tag or is_label) and hgap <= 260):
                    g.add(k)
                    changed = True
        grown.append(sorted(g))

    # uma mesma equação pode vir partida em grupos que se sobrepõem: funde
    grown.sort(key=lambda g: (box(g)[0], box(g)[2]))
    merged = []
    for g in grown:
        for m in merged:
            p, a0, b0, a1, b1 = box(m)
            q, c0, d0, c1, d1 = box(g)
            if p == q and c0 < a1 + 6 and a0 < c1 + 6 and d0 < b1 + 6 and b0 < d1 + 6:
                m[:] = sorted(set(m) | set(g))
                break
        else:
            merged.append(list(g))
    merged.sort(key=min)

    def same_row(r, q):
        return min(r["bbox"][3], q["bbox"][3]) - max(r["bbox"][1], q["bbox"][1]) > 2

    def is_legend(g):
        """Variáveis de legenda em 3 colunas ('A_σ1  =  descrição'): cada variável do
        grupo tem, na mesma altura e coluna, um '=' (ou '–') e depois texto com palavra."""
        seps = ("=", "–", "-")

        def clean(k):
            return re.sub("[\x01-\x04]", "", unmath(lines[k]["text"])).strip()

        # fragmentos de 1–2 caracteres (índice "i", "0" em linha própria) não decidem
        def near_row(r, q):
            # índices ficam deslocados da letra base: aceita folga vertical de 6 pt
            cy = (q["bbox"][1] + q["bbox"][3]) / 2
            return r["bbox"][1] - 6 <= cy <= r["bbox"][3] + 6

        def described(k):
            r = lines[k]
            same = [lines[q] for q in by_page[r["page"]]
                    if q != k and lines[q]["col"] == r["col"] and near_row(r, lines[q])
                    and 0 <= lines[q]["bbox"][0] - r["bbox"][2] < 260]
            has_sep = clean(k).endswith(tuple(seps)) or any(
                unmath(q["text"]).strip() in seps or unmath(q["text"]).strip()[:1] in seps for q in same)
            has_word = any(re.search(r"[A-Za-zÀ-ÿ]{4,}", q["text"]) and not formulaish(q) for q in same)
            return has_sep and has_word

        # só conta como variável o que tem cara de variável (letra, índice, apóstrofo,
        # '*', '|'); unidades da descrição como "(kPa);" não entram na decisão
        var_re = re.compile(r"^[A-Za-zͰ-Ͽ∀-⋿][A-Za-z0-9Ͱ-Ͽ∀-⋿'’*|\s^ˆ]{0,10}[=–]?$")
        rows = [k for k in g if clean(k) not in seps and 2 < len(clean(k)) <= 12
                and var_re.match(clean(k)) and not re.search(r"[A-Za-zÀ-ÿ]{4,}", clean(k))]
        if rows:
            return all(described(k) for k in rows)
        # só variáveis de 1 letra ("n", "i"): legenda se alguma tem '=' + descrição
        # e o grupo não tem nenhum operador de fórmula
        tiny = [k for k in g if clean(k) not in seps and len(clean(k)) <= 2 and var_re.match(clean(k))]
        ops = re.compile(r"[+−×/÷Σ∑√∫^]|\\frac")
        # operador só conta em linha de fonte matemática ("(rad/s);" é unidade da descrição)
        return (bool(tiny) and any(described(k) for k in tiny)
                and not any(ops.search(clean(k)) for k in g if formulaish(lines[k])))

    result = []
    for g in merged:
        if DEBUG_FORMULAS:
            print("GRUPO p%d" % (lines[g[0]]["page"] + 1), "legenda=%s" % is_legend(g),
                  [re.sub("[\x01-\x04]", "|", lines[k]["text"])[:25] for k in g])
        if is_legend(g):
            continue
        # imagem sozinha só conta como fórmula se o texto a anuncia ("pela fórmula:")
        # ou se vem seguida de "onde:"; senão é pedaço de figura (ex.: rótulos do anexo)
        if all(lines[k].get("img") for k in g) and not (intro_before(g[0]) or legend_after(g)):
            continue
        result.append(g)
    return result


def find_tables(doc, lines, cover_limit):
    """Tabelas pela detecção nativa do PyMuPDF. Devolve [(índices de linhas cobertas, markdown)]
    e marca as linhas cobertas com in_table (para não virarem fórmula)."""
    found = []
    for page in doc:
        try:
            tabs = page.find_tables().tables
        except Exception:
            continue
        for t in tabs:
            x0, y0, x1, y1 = t.bbox
            if page.number == 0 and y0 < cover_limit:
                continue  # bloco da capa
            rows = [[re.sub(r"\s+", " ", fix_private_chars(c or "", "Symbol")).strip().replace("|", "\\|")
                     for c in row] for row in t.extract()]
            flat = " ".join(c for r in rows for c in r)
            if re.search(r"Figura\s+\d|_{5,}", flat):
                continue  # moldura de página de figura lida como tabela
            # fim da legenda ("...dos" / "grãos") capturado como 1ª linha: devolve ao texto
            if len(rows) > 1 and sum(1 for c in rows[0] if c) == 1 and next(c for c in rows[0] if c)[:1].islower():
                rows = rows[1:]
                y0 = t.rows[1].bbox[1]
            rows = [r for r in rows if any(r)]
            if not rows or t.col_count < 2:
                continue
            # gráfico com grade lido como tabela: uma célula com os valores dos eixos
            # ("100 90 80 70 ... 0 200 400") -> não é tabela, vira figura
            if any(len(re.findall(r"(?<![\w,.])\d+(?:[.,]\d+)?(?![\w,.])", c)) >= 8 for r in rows for c in r):
                continue
            if len(rows) < 3 and not any(re.search(r"\d", c) for r in rows for c in r):
                continue  # rótulos de figura/foto lidos como tabela
            n = max(len(r) for r in rows)
            rows = [r + [""] * (n - len(r)) for r in rows]
            md = ["| " + " | ".join(rows[0]) + " |", "|" + " --- |" * n]
            md += ["| " + " | ".join(r) + " |" for r in rows[1:]]
            covered = [k for k, r in enumerate(lines)
                       if r["page"] == page.number
                       and x0 - 2 <= (r["bbox"][0] + r["bbox"][2]) / 2 <= x1 + 2
                       and y0 - 2 <= (r["bbox"][1] + r["bbox"][3]) / 2 <= y1 + 2]
            if not covered:
                continue
            for k in covered:
                lines[k]["in_table"] = True
            found.append((covered, "\n".join(md), (page.number, [x0, y0, x1, y1])))
    return found


CAPTION_RE = re.compile(r"^(Figura|Gráfico|Grafico|Foto|Fotografia)\s*[A-Z]?\d+\s*[–—:\-]\s*\S")


def _rect_gap(a, b):
    """Distância entre dois retângulos (0 se se tocam/sobrepõem)."""
    dx = max(b[0] - a[2], a[0] - b[2], 0)
    dy = max(b[1] - a[3], a[1] - b[3], 0)
    return max(dx, dy)


def _union(a, b):
    return [min(a[0], b[0]), min(a[1], b[1]), max(a[2], b[2]), max(a[3], b[3])]


def find_figures(doc, lines, eq_by_line, cover_limit, table_boxes, formula_boxes):
    """Figuras = imagens raster + desenhos vetoriais agrupados, associados à
    legenda "Figura N – ..." mais próxima. Devolve lista de dicts com page, bbox,
    legenda, índices de linhas cobertas (rótulos dentro da figura) e onde inserir."""
    def overlaps_any(r, boxes, page):
        return any(p == page and _rect_gap(r, b) <= 2 for p, b in boxes)

    figs = []
    for page in doc:
        pno = page.number
        W, H = page.rect.width, page.rect.height
        cands = []
        for info in page.get_image_info():
            r = list(info["bbox"])
            if r[2] - r[0] < 20 or r[3] - r[1] < 20:
                continue
            if pno == 0 and r[1] < cover_limit:
                continue  # logotipo e capa
            if overlaps_any(r, formula_boxes, pno) or overlaps_any(r, table_boxes, pno):
                continue
            cands.append(r)
        n_raster = len(cands)  # as primeiras são imagens raster; depois vêm os vetoriais
        # desenhos vetoriais (sem moldura da página, linhas separadoras, tabelas, fórmulas)
        keep = []
        for d in page.get_drawings():
            r = d["rect"]
            if r.width > 0.8 * W and r.height > 0.8 * H:
                continue
            if (r.height < 2 and r.width > 0.5 * W) or (r.width < 2 and r.height > 0.5 * H):
                continue
            if r.y1 < 60 or r.y0 > H - 50:
                continue
            rr = [r.x0, r.y0, r.x1, r.y1]
            if pno == 0 and rr[1] < cover_limit:
                continue
            if overlaps_any(rr, formula_boxes, pno) or overlaps_any(rr, table_boxes, pno):
                continue
            keep.append(d)
        if keep:
            try:
                for c in page.cluster_drawings(drawings=keep, x_tolerance=8, y_tolerance=8):
                    if c.width >= 40 and c.height >= 30:
                        cands.append([c.x0, c.y0, c.x1, c.y1])
            except Exception:
                pass
        # funde candidatos próximos
        merged = []
        for r in sorted(cands, key=lambda r: (r[1], r[0])):
            for m in merged:
                if _rect_gap(m, r) <= 12:
                    m[:] = _union(m, r)
                    break
            else:
                merged.append(list(r))
        changed = True
        while changed:
            changed = False
            for i in range(len(merged)):
                for j in range(i + 1, len(merged)):
                    if _rect_gap(merged[i], merged[j]) <= 12:
                        merged[i] = _union(merged[i], merged.pop(j))
                        changed = True
                        break
                if changed:
                    break

        # legendas da página
        caps = [k for k, r in enumerate(lines)
                if r["page"] == pno and CAPTION_RE.match(re.sub("[\x01-\x04]", "", r["text"]))]
        # na página, as legendas ficam acima OU abaixo das figuras (decide pela
        # maioria); cada região vai para a legenda nesse sentido — assim as várias
        # partes de uma figura (vistas, cortes, detalhes) ficam juntas
        def aligned(ks, reg):
            # fotos lado a lado com legenda própria embaixo de cada uma: prefere a
            # legenda que cruza horizontalmente a imagem
            al = [k for k in ks if min(reg[2], lines[k]["bbox"][2]) - max(reg[0], lines[k]["bbox"][0]) > 5]
            return al or ks

        def cap_above(reg):
            ks = aligned([k for k in caps if lines[k]["bbox"][3] <= reg[1] + 5], reg)
            return max(ks, key=lambda k: lines[k]["bbox"][1]) if ks else None

        def cap_below(reg):
            ks = aligned([k for k in caps if lines[k]["bbox"][1] >= reg[3] - 5], reg)
            return min(ks, key=lambda k: lines[k]["bbox"][1]) if ks else None

        # gráficos vetoriais vizinhos podem ter sido agrupados por cima da legenda que
        # fica entre eles: corta a região em cada legenda que a atravessa
        def split_by_captions(r):
            for k in caps:
                cb = lines[k]["bbox"]
                cy = (cb[1] + cb[3]) / 2
                if r[1] + 5 < cy < r[3] - 5 and min(r[2], cb[2]) - max(r[0], cb[0]) > 0:
                    parts = [[r[0], r[1], r[2], cb[1] - 1], [r[0], cb[3] + 1, r[2], r[3]]]
                    return [q for part in parts if part[3] - part[1] > 15 for q in split_by_captions(part)]
            return [r]

        # só gráficos vetoriais são cortados; imagem raster (página escaneada com várias
        # figuras) fica inteira — cortá-la partiria desenhos lado a lado
        cands = cands[:n_raster] + [q for r in cands[n_raster:] for q in split_by_captions(r)]

        # associa cada peça (não a união) à legenda; a união vem depois, por legenda
        pieces = []
        for r in sorted(cands, key=lambda r: (r[1], r[0])):
            if any(_rect_gap(p, r) == 0 and p[0] <= r[0] and p[1] <= r[1] and p[2] >= r[2] and p[3] >= r[3]
                   for p in pieces):
                continue  # peça contida em outra
            pieces.append(list(r))
        merged = pieces

        def assign(above_mode):
            out, loose, dist = {}, [], 0.0
            for reg in merged:
                # página escaneada: a legenda está DENTRO da imagem -> a primeira delas
                inside = [k for k in caps if reg[1] < (lines[k]["bbox"][1] + lines[k]["bbox"][3]) / 2 < reg[3]
                          and reg[0] - 5 <= lines[k]["bbox"][0] <= reg[2]]
                if inside:
                    out.setdefault(min(inside, key=lambda k: lines[k]["bbox"][1]), []).append(reg)
                    continue
                first, second = (cap_above, cap_below) if above_mode else (cap_below, cap_above)
                k = first(reg)
                if k is None:
                    k = second(reg)
                    # no sentido "errado" só aceita se estiver bem perto
                    if k is not None and min(abs(lines[k]["bbox"][1] - reg[3]),
                                             abs(reg[1] - lines[k]["bbox"][3])) > 60:
                        k = None
                if k is None:
                    loose.append(reg)
                else:
                    out.setdefault(k, []).append(reg)
                    dist += min(abs(lines[k]["bbox"][1] - reg[3]), abs(reg[1] - lines[k]["bbox"][3]))
            return out, loose, dist

        # testa "legenda acima" e "legenda abaixo": vale o modo que dá figura a mais
        # legendas diferentes (empate: menor distância total)
        options = [assign(True), assign(False)]
        assigned, free, _ = max(options, key=lambda o: (len(o[0]), -o[2]))
        page_figs = []
        for k, regs in assigned.items():
            box = regs[0]
            for r in regs[1:]:
                box = _union(box, r)
            page_figs.append({"page": pno, "bbox": box, "caption": k})
        # painéis "(a) (b) (c)" de uma figura com legenda única: peças soltas encostadas
        # (até 45 pt) numa figura com legenda entram nela, em cadeia
        changed = True
        while changed and page_figs:
            changed = False
            for r in list(free):
                near = [f for f in page_figs if _rect_gap(f["bbox"], r) <= 45]
                if near:
                    tgt = min(near, key=lambda f: _rect_gap(f["bbox"], r))
                    tgt["bbox"] = _union(tgt["bbox"], r)
                    free.remove(r)
                    changed = True
        figs.extend(page_figs)
        # peças sem legenda: funde as vizinhas entre si
        joined = []
        for r in free:
            for m in joined:
                if _rect_gap(m, r) <= 12:
                    m[:] = _union(m, r)
                    break
            else:
                joined.append(list(r))
        free = joined
        for reg in free:
            area = (reg[2] - reg[0]) * (reg[3] - reg[1])
            if area < 100 * 60:
                continue
            # sem legenda e coberta de texto = bloco de texto (referência com fio
            # decorativo, quadro de legenda, parágrafo em imagem), não figura
            text_area = sum(
                (r["bbox"][2] - r["bbox"][0]) * (r["bbox"][3] - r["bbox"][1])
                for r in lines
                if r["page"] == pno and len(r["text"]) > 3
                and reg[0] - 2 <= (r["bbox"][0] + r["bbox"][2]) / 2 <= reg[2] + 2
                and reg[1] - 2 <= (r["bbox"][1] + r["bbox"][3]) / 2 <= reg[3] + 2)
            if text_area / area > 0.3:
                continue
            figs.append({"page": pno, "bbox": reg, "caption": None})

    # rótulos soltos dentro da figura (cotas, "Secção A-A") saem do texto
    caption_idx = {f["caption"] for f in figs if f["caption"] is not None}
    for f in figs:
        x0, y0, x1, y1 = f["bbox"]
        f["covered"] = [k for k, r in enumerate(lines)
                        if r["page"] == f["page"] and k not in eq_by_line and k not in caption_idx
                        and x0 - 6 <= (r["bbox"][0] + r["bbox"][2]) / 2 <= x1 + 6
                        and y0 - 6 <= (r["bbox"][1] + r["bbox"][3]) / 2 <= y1 + 6]
        # ponto de inserção: antes da legenda se ela está embaixo; depois dela se está em cima
        k = f["caption"]
        if k is not None and lines[k]["bbox"][1] >= y1 - 5:
            f["insert_at"] = k
        elif k is not None:
            end = k
            while (end + 1 < len(lines) and lines[end + 1]["page"] == f["page"]
                   and 0 <= lines[end + 1]["bbox"][1] - lines[end]["bbox"][3] < 4
                   and not CAPTION_RE.match(lines[end + 1]["text"])):
                end += 1
            f["insert_at"] = min(f["covered"]) if f["covered"] else end + 1
        else:
            # próxima linha depois da figura (na mesma página ou nas seguintes)
            after = [i for i, r in enumerate(lines)
                     if (r["page"] == f["page"] and r["bbox"][1] >= y1 - 5) or r["page"] > f["page"]]
            f["insert_at"] = min(f["covered"]) if f["covered"] else (after[0] if after else len(lines))
        f["legenda"] = re.sub("[\x01-\x04]", "", lines[k]["text"]) if k is not None else ""
    figs.sort(key=lambda f: (f["page"], f["bbox"][1]))
    return figs


def latex_block(latex):
    """LaTeX de uma entrada -> markdown. Aceita string ou lista; na lista, itens
    {"texto": "..."} são frases do texto que caíram dentro do recorte e voltam
    como parágrafo normal, na posição certa entre as equações."""
    items = latex if isinstance(latex, list) else [latex]
    parts = []
    for x in items:
        if isinstance(x, dict):
            parts.append(x.get("texto", ""))
        else:
            parts.append(f"$$\n{x}\n$$")
    return "\n\n".join(p for p in parts if p)


def crop_formula(doc, lines, g, out_png):
    page = doc[lines[g[0]]["page"]]
    xs0 = min(lines[k]["bbox"][0] for k in g)
    ys0 = min(lines[k]["bbox"][1] for k in g)
    xs1 = max(lines[k]["bbox"][2] for k in g)
    ys1 = max(lines[k]["bbox"][3] for k in g)
    clip = pymupdf.Rect(xs0 - 8, ys0 - 8, xs1 + 8, ys1 + 8) & page.rect
    out_png.parent.mkdir(parents=True, exist_ok=True)
    page.get_pixmap(clip=clip, dpi=250).save(str(out_png))
    return [round(v, 1) for v in (clip.x0, clip.y0, clip.x1, clip.y1)]


# -------------------------------------------------------- texto e parágrafos

def unmath(t):
    return unicodedata.normalize("NFKC", t)


def math_to_latex_inline(t):
    """'𝐺 𝑠𝑎 – ...' -> '$G_{sa}$ – ...'; '𝑃1, 𝑃2, . . . 𝑃𝑛' -> '$P_1$, $P_2$, ..., $P_n$'."""
    def conv(m):
        s = m.group(0).strip()
        parts = unmath(s).split()
        if len(parts) == 2 and re.fullmatch(r"[a-z0-9]{1,4}", parts[1]):
            return f"${parts[0]}_{{{parts[1]}}}$"
        s2 = unmath(s).replace(" ", "")
        mm = re.fullmatch(r"([A-Za-z])([a-z0-9]{1,3})", s2)
        if mm and len(s2) > 1:
            return f"${mm.group(1)}_{{{mm.group(2)}}}$"
        return f"${s2}$"
    t = re.sub(r"(?:[\U0001D400-\U0001D7FFℎ][0-9]*)(?:\s?[\U0001D400-\U0001D7FFℎ0-9]+)*", conv, t)
    return t.replace(". . .", "...")


def plain_var_to_latex(v):
    v = v.strip()
    m = re.fullmatch(r"([A-Za-z]{1,3})\s+(\d{1,2}|[a-z]{1,3})", v)  # "V 1", "G sb"
    if m:
        return f"${m.group(1)}_{{{m.group(2)}}}$"
    m = re.fullmatch(r"([A-Z])[’']([a-z0-9]{1,2})", v)  # "P’h" -> P'_h
    if m:
        return f"${m.group(1)}'_{{{m.group(2)}}}$"
    m = re.fullmatch(r"([A-Z])([a-z]{1,2})", v)  # "Ph", "Gsa" -> P_h, G_sa (índice em texto corrido)
    if m:
        return f"${m.group(1)}_{{{m.group(2)}}}$"
    return f"${v}$"


LEGEND_VAR = r"[A-Za-z][A-Za-z’']{0,3}(?:\s(?:\d{1,2}|[a-z]{1,3}))?"


def build_paragraphs(lines, eq_by_line, insert_before=None):
    """Remonta parágrafos pelo espaçamento vertical; fórmulas viram marcadores."""
    paras = []  # dicts: text, kind ('p', 'eq', 'heading'), first line meta
    col_right = {}
    for r in lines:
        key = (r["page"], r["col"])
        col_right[key] = max(col_right.get(key, 0), r["bbox"][2])

    insert_before = insert_before or {}
    prev = None
    for idx, r in enumerate(lines):
        for block in insert_before.get(idx, []):
            paras.append({"kind": "eq", "text": block})
            prev = None
        if idx in eq_by_line:
            eq = eq_by_line[idx]
            if eq is not None:
                paras.append({"kind": "eq", "text": eq})
            prev = None
            continue
        t = r["text"]
        new = True
        if prev is not None and paras and paras[-1]["kind"] == "p":
            same_flow = prev["page"] == r["page"] and prev["col"] == r["col"]
            gap = r["bbox"][1] - prev["bbox"][3]
            starts_item = re.match(
                r"^([a-z]\)|\d+(\.\d+)*\.?\s+[A-ZÀ-Ú]|Nota|NOTA"
                # "– IE)." continua "(DNIT 179": é o sufixo do código da norma, não item
                r"|[–•−▪]\s?(?!\s*(ME|ES|IE|PRO|EM|TER|CLA|PAD)\b)"
                # legenda "Tabela A1 – ..." (não "...indicadas na Tabela A1 do Anexo A")
                r"|(Tabela|Figura|Quadro|Gráfico)\s+[A-Z]?\d+\s*([–—:\-]|$))", t)
            # texto justificado: linha anterior curta + linha nova começando em
            # maiúscula = fim de parágrafo
            short_prev = prev["bbox"][2] < col_right[(prev["page"], prev["col"])] - 40
            ends_para = short_prev and re.match(r"^[A-ZÀ-Ú0-9“\"(]", t)
            bold_ended = prev["bold"] and not r["bold"]
            if (same_flow and gap < 8.5 and not starts_item and not prev.get("heading")
                    and not ends_para and not bold_ended):
                new = False
        if new:
            paras.append({"kind": "p", "text": t, "first": r, "last": r})
        else:
            paras[-1]["text"] = join_lines(paras[-1]["text"], t)
            paras[-1]["last"] = r
        prev = r
        prev["heading"] = bool(r["bold"] and len(t) < 80 and re.match(r"^\d+(\.\d+)*\.?\s+\S", t))
    for block in insert_before.get(len(lines), []):  # figura no fim do documento
        paras.append({"kind": "eq", "text": block})
    return paras


def classify(paras):
    out = []
    for p in paras:
        if p["kind"] == "eq":
            out.append(p)
            continue
        t = finish_scripts(p["text"]).strip()
        low = t.lower().rstrip(":")
        r = p["first"]
        if low in NAMED_HEADINGS:
            out.append({"kind": "heading", "text": f"## {NAMED_HEADINGS[low]}"})
            continue
        m = re.match(r"^(\d+)\.?\s+([A-ZÀ-Ú].{0,79})$", t)
        if m and (r["bold"] or len(t.split()) <= 6) and not t.endswith((".", ";", ",")):
            out.append({"kind": "heading", "text": f"## {m.group(1)} {m.group(2)}"})
            continue
        m = re.match(r"^Anexo\s+[A-Z]\b.{0,80}$", t)
        if m and not t.endswith("."):
            out.append({"kind": "heading", "text": f"## {t}"})
            continue
        # só é cláusula se o texto depois do número começa em maiúscula
        # ("5.1 e 5.2 tantas vezes..." é referência no meio da frase)
        t = re.sub(r"^(\d+(?:\.\d+)+)\.?\s+(?=[A-ZÀ-Ú])", r"**\1** ", t)
        dash = bool(re.match(r"^[–•−▪]\s*", t))
        t = re.sub(r"^[–•−▪]\s*", "- ", t)
        out.append({"kind": "p", "text": t, "first": p["first"], "last": p["last"], "dash": dash})
    return out


def cut_sections(items):
    """Remove o Sumário, o Índice geral e os separadores '____ /Anexo'.
    O sumário sai linha a linha (pontilhado até a página), não por intervalo:
    em colunas, a ordem de leitura pode intercalar sumário e texto."""
    res = []
    for it in items:
        t = it["text"]
        if it["kind"] == "heading" and t == "## Sumário":
            continue
        if re.search(r"\.{5,}|…{2,}", t) or re.fullmatch(r"\d{1,2}", t.strip()):
            continue
        if it["kind"] == "heading" and t == "## Índice geral":
            break
        if re.match(r"^_{5,}", t):
            # "____ /Índice Geral" fica no pé da coluna esquerda da última página de
            # texto: na ordem de leitura vem ANTES da coluna direita, que ainda tem
            # texto (critérios de medição etc.). Só o separador sai; o corte é no
            # título "Índice geral" da página seguinte.
            continue
        res.append(it)
    return res


def continue_across_breaks(items):
    """Parágrafo aberto no fim de coluna/página continua no próximo bloco."""
    out = []
    for it in items:
        prev = out[-1] if out else None
        open_prev = (prev is not None and prev["kind"] == "p" and it["kind"] == "p"
                     and not re.search(r"[.:;!?]$", prev["text"]))
        if not open_prev:
            out.append(it)
            continue
        t, pt = it["text"], prev["text"]
        # travessão que continua a frase ("...agregado graúdo" / "– Método de ensaio"),
        # não item de lista: frase anterior longa e sem pontuação final
        if it.get("dash") and len(pt) > 60 and not pt.startswith("**"):
            prev["text"] = pt + " – " + t[2:]
            continue
        continues_ = (
            t[:1].islower() or pt.endswith("-")
            or (t[:1].isdigit() and re.search(r"[a-zà-ÿ]$", pt) and not re.match(r"^\d+\)", t))
        )
        if continues_ and not re.match(r"^([a-z]\)|- |\*\*)", t):
            prev["text"] = join_lines(pt, t)
            continue
        out.append(it)
    return out


def format_legends(items):
    """Após 'onde:', cada variável da legenda em LaTeX, uma por linha."""
    out, in_legend = [], False
    for it in items:
        if it["kind"] != "p":
            in_legend = False
            out.append(it)
            continue
        t = it["text"]
        if LEGEND_START_RE.match(t):
            in_legend = True
            out.append({**it, "text": t[0].lower() + t[1:] if t[0].isupper() and len(t) < 8 else t})
            continue
        if in_legend:
            # várias entradas coladas numa linha: "P’h – massa...; V – volume..."
            parts = re.split(r";\s+(?=" + LEGEND_VAR + r"\s*[=–]\s)", math_to_latex_inline(t))
            converted = []
            for i, part in enumerate(parts):
                part = part + (";" if i < len(parts) - 1 else "")
                m = re.match(r"^(?!\$)(" + LEGEND_VAR + r")\s*([=–])\s+(.*)$", part)
                if m:
                    part = f"{plain_var_to_latex(m.group(1))} {m.group(2)} {m.group(3)}"
                converted.append(part)
            if re.match(r"^\$[^$]+\$\s*(,\s*\$[^$]+\$\s*)*(,?\s*\.\.\.\s*\$[^$]+\$)?\s*[=–]", converted[0]):
                t2 = "\n".join(converted)
                prev = out[-1]
                if prev.get("legend"):
                    prev["text"] += "\n" + t2
                else:
                    out.append({**it, "text": t2, "legend": True})
                continue
            in_legend = False
        out.append({**it, "text": math_to_latex_inline(t) if MATH_CHARS.search(t) else t})
    return out


def render(items):
    blocks = []
    for it in items:
        t = it["text"].strip()
        if not t:
            continue
        # itens de lista "- " consecutivos ficam colados, como no modelo da 036
        if t.startswith("- ") and blocks and blocks[-1].split("\n")[-1].startswith("- "):
            blocks[-1] += "\n" + t
        else:
            blocks.append(t)
    return "\n\n".join(blocks) + "\n"


# ----------------------------------------------------------------- links

def fix_notation(body):
    """Notação do controle estatístico (igual em todas as ES do DNIT) que a
    extração quebra: X com barra combinante, "k s" lido como índice, legenda
    partida no fim da linha justificada."""
    # separador "_____ /Índice geral" (ou "/Anexo") grudado no fim do último parágrafo
    body = re.sub(r"[ \t]*_{3,}\s*/\s*(Índice\s+[Gg]eral|Anexo\s*[A-Z]?)\b", "", body)
    body = re.sub(r"\n\n/\s*(Índice\s+[Gg]eral|Anexo\s*[A-Z]?)\s*(?=\n)", "", body)
    body = re.sub("\\$([A-Za-z])\\$̅", r"$\\bar{\1}$", body)           # $X$̅ -> $\bar{X}$
    body = re.sub(r"\$\\bar\{X\}\$\s*([−+-])\s*\$k_\{s\}\$",
                  lambda m: "$\\bar{X} " + ("-" if m.group(1) in "−-" else "+") + " ks$", body)
    # item de legenda ("$k$ é o coeficiente ... Tabela B1 – Amostragem") partido antes
    # do fim ("Variável (Anexo B);"): junta
    body = re.sub(r"(\n\$[^\n]*[A-Za-zÀ-ú])\n\n([A-ZÀ-Ú][^\n]{0,60}[;.])\n", r"\1 \2" + "\n", body)
    return body


def add_wikilinks(body, entries, self_id):
    lookup = bg.build_lookup(entries)
    id_to_stem = {e["id"]: Path(e["md"]).stem for e in entries}
    cites = bg.find_citations(body, lookup, self_id)
    for target, start, end in sorted(cites, key=lambda c: c[1], reverse=True):
        # em linha de tabela o "|" do wikilink separaria células: Obsidian usa "\|"
        in_table = body[body.rfind("\n", 0, start) + 1:start].lstrip().startswith("|")
        sep = "\\|" if in_table else "|"
        body = body[:start] + f"[[{id_to_stem[target]}{sep}{body[start:end]}]]" + body[end:]
    return body, sorted({id_to_stem[t] for t, _, _ in cites})


# ------------------------------------------------------------------ main

def process(md_path, entry, entries, graph):
    stem = md_path.stem
    doc = pymupdf.open(ROOT / entry["pdf"])

    sizes = Counter()
    for page in doc:
        for b in page.get_text("dict")["blocks"]:
            for l in b.get("lines", []):
                for s in l["spans"]:
                    if s["text"].strip():
                        sizes[round(s["size"], 1)] += len(s["text"])
    body_size = sizes.most_common(1)[0][0]

    lines = []
    for page in doc:
        lines += [r for r in page_lines(page, body_size) if not is_header_footer(r, page.rect.height)]
    cover, lines, cover_limit = split_cover(lines)
    title, aprov, kws = cover_metadata(cover, body_size)
    DOC_VOCAB.clear()
    DOC_VOCAB.update(doc_vocab(lines))

    # tabelas (antes das fórmulas: linhas dentro de tabela não viram fórmula)
    eq_by_line = {}
    table_boxes, formula_boxes = [], []
    for n, (covered, md, tbox) in enumerate(find_tables(doc, lines, cover_limit), 1):
        table_boxes.append(tbox)
        for k in covered:
            eq_by_line[k] = None
        if TABLE_IMAGES.get(entry["tipo"]):
            # ES: tabela em markdown + a imagem do PDF logo abaixo, para conferência
            png = FIGURAS_IMG / f"{stem}_tab{n:02d}.png"
            png.parent.mkdir(parents=True, exist_ok=True)
            page = doc[tbox[0]]
            x0, y0, x1, y1 = tbox[1]
            page.get_pixmap(clip=pymupdf.Rect(x0 - 3, y0 - 3, x1 + 3, y1 + 3) & page.rect, dpi=150).save(str(png))
            md += f"\n\n![[{png.name}]]"
        eq_by_line[min(covered)] = md

    # fórmulas
    store_path = FORMULAS_DIR / f"{stem}.json"
    store = json.loads(store_path.read_text(encoding="utf-8")) if store_path.exists() else {}
    new_store, pending = {}, 0
    # a transcrição acompanha o CONTEÚDO (texto bruto da fórmula), não só a posição:
    # se uma detecção nova surgir no meio, as seguintes não herdam LaTeX errado
    by_raw, used = {}, set()
    for k, v in store.items():
        if not v.get("manual") and v.get("raw"):
            by_raw.setdefault(v["raw"], []).append(k)
    for n, g in enumerate(find_formulas(lines, body_size), 1):
        eq_id = f"eq{n:02d}"
        png = FORMULAS_IMG / f"{stem}_{eq_id}.png"
        raw = re.sub("[\x01-\x04]", " ", " ".join(lines[k]["text"] for k in g))
        raw = re.sub(r"\s+", " ", raw).strip()
        cands = [k for k in by_raw.get(raw, []) if k not in used] if raw else []
        if cands:
            old_key = eq_id if eq_id in cands else cands[0]
        elif not raw and eq_id in store and not store[eq_id].get("raw"):
            old_key = eq_id  # fórmula em imagem (sem texto): casa pela posição
        else:
            old_key = None
            if eq_id in store and store[eq_id].get("latex") and not store[eq_id].get("manual"):
                print(f"  AVISO {stem} {eq_id}: fórmula nova ou alterada, sem transcrição correspondente")
        if old_key:
            used.add(old_key)
        old = store.get(old_key, {}) if old_key else {}
        if old.get("clip"):  # recorte manual (fórmula que o agrupamento cortou)
            page = doc[lines[g[0]]["page"]]
            page.get_pixmap(clip=pymupdf.Rect(old["clip"]), dpi=250).save(str(png))
            bbox = old["clip"]
        else:
            bbox = crop_formula(doc, lines, g, png)
        entry_eq = {"page": lines[g[0]]["page"] + 1, "bbox": bbox, "raw": raw,
                    "latex": old.get("latex", "")}
        if not old.get("ignorar"):
            formula_boxes.append((lines[g[0]]["page"], list(bbox)))
        for extra in ("clip", "ignorar", "nota"):
            if extra in old:
                entry_eq[extra] = old[extra]
        new_store[eq_id] = entry_eq
        if old.get("ignorar"):
            continue  # falso positivo marcado na revisão: as linhas continuam como texto
        if entry_eq["latex"]:
            block = latex_block(entry_eq["latex"])
        else:
            pending += 1
            block = (f"> [!todo] Fórmula {eq_id} pendente de transcrição — conferir no PDF, página {entry_eq['page']}\n"
                     f"> ![[{png.name}]]")
        for k in g:
            eq_by_line[k] = None
        eq_by_line[g[0]] = block

    # fórmulas cadastradas à mão (o detector não achou): página + retângulo.
    # As linhas dentro do retângulo são trocadas pelo LaTeX.
    for eq_id, man in store.items():
        if not man.get("manual"):
            continue
        new_store[eq_id] = man
        p = man["page"] - 1
        x0, y0, x1, y1 = man["clip"]
        formula_boxes.append((p, list(man["clip"])))
        png = FORMULAS_IMG / f"{stem}_{eq_id}.png"
        doc[p].get_pixmap(clip=pymupdf.Rect(man["clip"]), dpi=250).save(str(png))
        covered = [k for k, r in enumerate(lines)
                   if r["page"] == p and k not in eq_by_line
                   and x0 <= (r["bbox"][0] + r["bbox"][2]) / 2 <= x1
                   and y0 <= (r["bbox"][1] + r["bbox"][3]) / 2 <= y1]
        if not covered:
            print(f"  AVISO {stem} {eq_id}: fórmula manual sem linhas no retângulo")
            continue
        block = latex_block(man["latex"]) if man.get("latex") else ""
        for k in covered:
            eq_by_line[k] = None
        eq_by_line[min(covered)] = block or None

    # correções de texto ("todas": troca todas as ocorrências no markdown final),
    # para variável de legenda que a extração quebrou ($D_{0}$$m$é$d_{io}$ etc.)
    text_fixes = {k: v for k, v in store.items() if v.get("todas")}
    new_store.update(text_fixes)
    FORMULAS_DIR.mkdir(parents=True, exist_ok=True)
    store_path.write_text(json.dumps(new_store, ensure_ascii=False, indent=2), encoding="utf-8")

    # figuras: recortadas do PDF e embutidas como ![[...]] (mesmo princípio das fórmulas)
    fig_path = FIGURAS_DIR / f"{stem}.json"
    fig_store = json.loads(fig_path.read_text(encoding="utf-8")) if fig_path.exists() else {}
    new_figs, insert_before = {}, {}
    for n, f in enumerate(find_figures(doc, lines, eq_by_line, cover_limit, table_boxes, formula_boxes), 1):
        fig_id = f"fig{n:02d}"
        old = fig_store.get(fig_id, {})
        clip = old.get("clip") or [f["bbox"][0] - 4, f["bbox"][1] - 4, f["bbox"][2] + 4, f["bbox"][3] + 4]
        entry_fig = {"page": f["page"] + 1, "bbox": [round(v, 1) for v in f["bbox"]], "legenda": f["legenda"]}
        for extra in ("clip", "ignorar", "nota"):
            if extra in old:
                entry_fig[extra] = old[extra]
        new_figs[fig_id] = entry_fig
        if old.get("ignorar"):
            continue
        png = FIGURAS_IMG / f"{stem}_{fig_id}.png"
        png.parent.mkdir(parents=True, exist_ok=True)
        page = doc[f["page"]]
        page.get_pixmap(clip=pymupdf.Rect(clip) & page.rect, dpi=150).save(str(png))
        for k in f["covered"]:
            eq_by_line[k] = None
        insert_before.setdefault(f["insert_at"], []).append(f"![[{png.name}]]")
    if new_figs or fig_path.exists():
        FIGURAS_DIR.mkdir(parents=True, exist_ok=True)
        fig_path.write_text(json.dumps(new_figs, ensure_ascii=False, indent=2), encoding="utf-8")

    items = classify(build_paragraphs(lines, eq_by_line, insert_before))
    items = cut_sections(items)
    items = continue_across_breaks(items)
    items = format_legends(items)

    m = re.match(r"DNIT\s*(\d+)/(\d{4})-?\s*(\w+)", entry["codigo"])
    norma_h1 = f"# NORMA DNIT {m.group(1)}/{m.group(2)} - {m.group(3)}" if m else f"# {entry['codigo']}"
    body = f"{norma_h1}\n\n# {title or entry['titulo']}\n\n" + render(items)
    body = fix_notation(body)
    for fix in text_fixes.values():
        body = body.replace(fix["de_inicio"], fix["para"])
    body, cita = add_wikilinks(body, entries, entry["id"])

    id_to_stem = {e["id"]: Path(e["md"]).stem for e in entries}
    citada = sorted({id_to_stem[e["from"]] for e in graph["edges"]
                     if e["to"] == entry["id"] and e["from"] in id_to_stem})
    old_fm, _ = parse_front_matter(md_path.read_text(encoding="utf-8")) if md_path.exists() else ({}, "")
    fm = {
        "codigo": entry["codigo"], "titulo": entry["titulo"], "orgao": entry["orgao"],
        "tipo": entry["tipo"],
    }
    if entry["tipo"] == "ES":
        fm["area"] = area_for(entry["codigo"], title or entry["titulo"])
    fm |= {
        "ano": entry["ano"], "aprovacao": aprov, "status": entry["status"],
        "pdf_original": f"../../{entry['pdf']}", "video": old_fm.get("video") or video_for(stem),
        "Palavras-chave": kws,
        "Citada por": [f"[[{s}]]" for s in citada],
        "Esta Norma cita": [f"[[{s}]]" for s in cita],
    }
    return dump_front_matter(fm) + "\n" + body, len(new_store), pending


def main():
    args = sys.argv[1:]
    force = "--force" in args
    args = [a for a in args if a != "--force"]
    files = [Path(a).resolve() for a in args] or sorted(ME_DIR.glob("dnit[_-]*.md"))

    entries = json.loads(NORMAS_JSON.read_text(encoding="utf-8"))
    by_md = {e["md"]: e for e in entries}
    graph = json.loads(GRAPH_JSON.read_text(encoding="utf-8"))

    for f in files:
        rel = f.relative_to(ROOT).as_posix()
        entry = by_md.get(rel)
        if entry is None:
            print(f"PULADO {f.name}: sem entrada em normas.json")
            continue
        if not force and f.exists():
            fm, _ = parse_front_matter(f.read_text(encoding="utf-8"))
            if "Citada por" in fm:
                print(f"PULADO {f.name}: já normalizado/revisado (use --force)")
                continue
        text, n_eq, pending = process(f, entry, entries, graph)
        f.write_text(text, encoding="utf-8")
        print(f"normalizado {f.name}: {n_eq} fórmulas, {pending} pendentes")


if __name__ == "__main__":
    main()
