"""
Normaliza os markdowns das normas ME do DNER para o formato do cofre Obsidian
(modelo: markdown/metodo-de-ensaio-me/dner_me_006_00.md, revisado à mão).

- Propriedades: descritores (Macro/Micro/Palavras-chave/SINORTEC) viram listas,
  data de aprovação vira `aprovacao`, `Citada por`/`Esta Norma cita` como
  wikilinks a partir de data/graph.json, `video` vazio, YAML sem aspas.
- Corpo: remove cabeçalho institucional, título, SUMÁRIO, rodapés de página e
  bloco de aprovação; normaliza cabeçalhos; junta linhas/parágrafos quebrados;
  monta tabelas simples; sinaliza fórmulas que a extração do PDF destruiu;
  converte links internos em wikilinks.

Arquivos que já têm a propriedade `Citada por` são considerados normalizados
(ou revisados à mão) e só têm os campos de citação atualizados.

Uso:
  python scripts/normalizar_me_dner.py [arquivos...] [--dry-run DIR]
Sem arquivos: processa todos os markdown/metodo-de-ensaio-me/dner_me_*.md.
"""
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
MD_DIR = ROOT / "markdown"
ME_DIR = MD_DIR / "metodo-de-ensaio-me"
NORMAS_JSON = ROOT / "data" / "normas.json"
GRAPH_JSON = ROOT / "data" / "graph.json"

# grafias variam entre os PDFs (e o OCR às vezes perde palavras):
# "Macrodescritores DNER" no lugar de MT, "Microdescritores" sem "DNER",
# "Palavras-chave: IRRD/IPR" com dois-pontos no meio
DESCRITORES = [
    ("Macrodescritores MT", r"Macrodescritores(?:\s+(?:MT|DNER))?"),
    ("Microdescritores DNER", r"Microdescritores(?:\s+DNER)?"),
    ("Palavras-chave IRRD/IPR", r"Palavras-chave\s*:?\s*IRRD\s*/\s*IPR"),
    ("Descritores SINORTEC", r"Descritores\s+SINORTEC"),
]
APROVACAO_STOP = r"Aprovad[ao]|Autor\s*:|Resolução|Sessão|Revisão\s+d|Adaptação|Processo\s+n"
KEY_ORDER = [
    "codigo", "titulo", "orgao", "tipo", "area", "ano", "aprovacao", "status", "pdf_original", "link", "video",
    "Macrodescritores MT", "Microdescritores DNER", "Palavras-chave IRRD/IPR", "Descritores SINORTEC",
    "Palavras-chave", "Citada por", "Esta Norma cita",
]

# área da norma (ES): prefixo do título ("Pavimentação – Base ..."), com variantes unificadas
AREA_ALIASES = {
    "pavimentação": "Pavimentação", "pavimentação rodoviária": "Pavimentação",
    "pavimentos flexíveis": "Pavimentação", "pavimento flexível": "Pavimentação",
    "pavimentação asfáltica": "Pavimentação", "pavimentos asfálticos": "Pavimentação",
    "pavimento rígido": "Pavimento rígido", "pavimentos rígidos": "Pavimento rígido",
    "pontes e viadutos rodoviários": "Pontes e viadutos rodoviários",
}


def video_for(stem):
    """Link do vídeo da norma (data/videos.json, preenchido por scripts/videos_youtube.py)."""
    p = ROOT / "data" / "videos.json"
    if not p.exists():
        return None
    return (json.loads(p.read_text(encoding="utf-8")).get(stem) or {}).get("url")


def area_for(codigo, title):
    """Área da ES: data/areas.json (normas sem prefixo de área no título) ou o prefixo do título."""
    p = ROOT / "data" / "areas.json"
    overrides = json.loads(p.read_text(encoding="utf-8")) if p.exists() else {}
    return overrides.get(codigo) or area_from_title(title)


def area_from_title(title):
    title = re.sub(r"^ES:\s*", "", title or "")
    title = re.sub(r"\bPré\s+-\s+", "Pré-", title)  # "Pré - misturado" não é "área – assunto"
    parts = [p.strip() for p in re.split(r"\s+[–—-]\s+", title)]
    if parts and re.fullmatch(r"especifica[çc][ãa]o de servi[çc]o", parts[-1], re.I):
        parts = parts[:-1]
    if len(parts) < 2 or len(parts[0]) > 45:
        return None  # título sem prefixo de área ("Base estabilizada ... - Especificação de serviço")
    head = parts[0]
    return AREA_ALIASES.get(head.lower(), head[:1].upper() + head[1:])


FOOTER_RES = [
    re.compile(r"^#*\s*Reprodução permitida desde que citado o DNER como fonte\.?$", re.I),
    re.compile(r"^#*\s*DNER\s*-?\s*(?:ME|ES|EM|PRO|CLA|TER|IE|PAD)\s*\d+\s*/\s*\d+$"),
    re.compile(r"^#*\s*[“\"'’]?[Pp]{1,2}\.\s*\d+\s*/\s*\d+$"),
    re.compile(r"^#*\s*MT\s*-\s*DEPARTAMENTO NACIONAL DE ESTRADAS DE RODAGEM$"),
]
STRUCTURAL_RE = re.compile(
    r"^(#{1,6}\s|\*\*\d+(\.\d+)*\*\*|[a-z]\)\s|\d+\)\s|Notas?\s*\d*\s*:|\||>|[-–•]\s)"
)
LINK_MD_RE = re.compile(r"\[([^\[\]]+)\]\(([^()]+?\.md)\)")


# ---------------------------------------------------------------- front-matter

def parse_front_matter(text):
    if not text.startswith("---\n"):
        return {}, text
    end = text.find("\n---\n", 4)
    if end == -1:
        return {}, text
    fm_lines = text[4:end].split("\n")
    body = text[end + 5:]
    data, key = {}, None
    for line in fm_lines:
        m = re.match(r"^\s+-\s*(.*)$", line)
        if m and key is not None:
            if not isinstance(data[key], list):
                data[key] = []
            data[key].append(_unquote(m.group(1)))
            continue
        if ":" in line:
            key, _, val = line.partition(":")
            key = key.strip()
            val = val.strip()
            data[key] = _unquote(val) if val else None
    return data, body


def _unquote(v):
    v = v.strip()
    if len(v) >= 2 and v[0] == v[-1] == '"':
        try:
            return json.loads(v)
        except ValueError:
            return v[1:-1]
    return v


def _yaml_scalar(v):
    s = str(v)
    if s == "" or re.search(r":\s|\s#|^[\[\]{},&*!|>'\"%@`#-]|^(yes|no|true|false|null)$", s, re.I):
        return json.dumps(s, ensure_ascii=False)
    return s


def dump_front_matter(data):
    keys = [k for k in KEY_ORDER if k in data] + [k for k in data if k not in KEY_ORDER]
    out = ["---"]
    for k in keys:
        v = data[k]
        if isinstance(v, list):
            if v:
                out.append(f"{k}:")
                out.extend(f"  - {_yaml_scalar(i)}" for i in v)
            else:
                out.append(f"{k}:")
        elif v is None or v == "":
            out.append(f"{k}:")
        else:
            out.append(f"{k}: {_yaml_scalar(v)}")
    out.append("---")
    return "\n".join(out) + "\n"


# ------------------------------------------------------------------- helpers

def is_footer(line):
    s = line.strip()
    return any(r.match(s) for r in FOOTER_RES)


def strip_hashes(line):
    return re.sub(r"^#{1,6}\s*", "", line.strip())


def section_heading(line):
    """Retorna (numero, titulo) se a linha é cabeçalho de seção numerada."""
    s = strip_hashes(line)
    m = re.match(r"^(\d+)\s+([A-Za-zÀ-ÿ].{0,79})$", s)
    if not m:
        return None
    num, title = m.group(1), m.group(2).strip()
    if not line.lstrip().startswith("#") and not title.isupper():
        return None  # sem '#', só aceita "0    PREFÁCIO" (título em caixa alta)
    if title.endswith((".", ";", ",")):
        return None
    return num, title


def parse_date(d, m, y):
    d, m = int(d), int(m)
    y = int(y)
    if y < 100:
        y += 1900 if y >= 30 else 2000
    if not (1 <= m <= 12 and 1 <= d <= 31):
        return None
    return f"{y:04d}-{m:02d}-{d:02d}"


# -------------------------------------------------------------- extrações

def extract_descritores(lines):
    """Remove o bloco de descritores/aprovação (fim da 1ª página) e devolve os dados."""
    start = next((i for i, l in enumerate(lines) if "Macrodescritores" in l), None)
    if start is None:
        return lines, {}, None
    end = start + 1
    while end < len(lines):
        l = lines[end]
        sh = section_heading(l)
        # só cabeçalho em caixa alta encerra o bloco: linhas quebradas como
        # "### 8 betuminosos (geral)" também parecem "número + texto"
        if is_footer(l) or (sh and sh[1].isupper()) or re.match(r"^\*\*\d+(\.\d+)+\*\*", l.strip()):
            break
        end += 1
    region = " ".join(strip_hashes(l) for l in lines[start:end])
    region = re.sub(r"\s+", " ", region)

    found = {}
    key_positions = []
    for name, pat in DESCRITORES:
        m = re.search(pat, region)
        if m:
            key_positions.append((m.start(), m.end(), name))
    for m in re.finditer(APROVACAO_STOP, region):
        key_positions.append((m.start(), m.end(), None))
    key_positions.sort()
    for i, (s, e, name) in enumerate(key_positions):
        if name is None:
            continue
        nxt = key_positions[i + 1][0] if i + 1 < len(key_positions) else len(region)
        value = region[e:nxt].strip().lstrip(":").strip().rstrip(".").strip()
        items = [v.strip().rstrip(".") for v in value.split(",")]
        found[name] = [v for v in items if v]

    aprov = None
    m = re.search(r"Aprovad[ao][^0-9]{0,80}?em\s+(\d{1,2})\s*/\s*(\d{1,2})\s*/\s*(\d{2,4})", region)
    if m:
        aprov = parse_date(*m.groups())
    return lines[:start] + lines[end:], found, aprov


def normalize_headings(lines):
    out = []
    for line in lines:
        s = line.strip()
        sh = section_heading(line)
        bare = strip_hashes(s)
        if sh:
            out.append(f"## {sh[0]} {sh[1]}")
        elif re.match(r"^#*\s*[^\wÀ-ÿ]*\s*(RESUMO|ABSTRACT|SUMÁRIO)\s*$", s):
            out.append("## " + re.sub(r"^[^\wÀ-ÿ]+", "", bare))
        elif s.startswith("#"):
            # OCR deixa lixo antes do título: "[ABSTRACT", "| ABSTRACT", "“LEITURA", "- PROSPECÇÃO"
            clean = re.sub(r"^[^\wÀ-ÿ]+", "", bare)
            if re.match(r"^(Tabela|Figura|Quadro|Anexo)\b", clean, re.I):
                out.append(f"### {clean}")
            elif (
                clean.isupper() and 4 <= len(clean) <= 60
                and re.search(r"[A-ZÀ-Ú]{3}", clean) and not clean.endswith(",")
            ):
                out.append(f"## {clean}")
            else:
                out.append(bare)  # '#' falso vindo de fonte em negrito
        else:
            # cláusula numerada que já veio na mesma linha do texto: "4.3.2.1 Proceder..."
            out.append(re.sub(r"^(\d+(?:\.\d+)+)\s+(?=[A-ZÀ-Ú])", r"**\1** ", line.rstrip()))
    return out


def cut_header_and_sumario(lines):
    def idx(pred):
        return next((i for i, l in enumerate(lines) if pred(l)), None)

    candidates = [
        idx(lambda l: l.strip() in ("## RESUMO", "## SUMÁRIO")),
        idx(lambda l: re.match(r"^## \d+ ", l) is not None),
    ]
    candidates = [c for c in candidates if c is not None]
    if candidates:
        lines = lines[min(candidates):]

    s = idx(lambda l: l.strip() == "## SUMÁRIO")
    if s is not None:
        seen = set()
        for j in range(s + 1, len(lines)):
            m = re.match(r"^## (\d+) (.+)$", lines[j])
            if m:
                num, title = m.groups()
                if num in seen or title.isupper():
                    lines = lines[:s] + lines[j:]
                    break
                seen.add(num)
    return lines


def to_blocks(lines):
    blocks, cur = [], []
    for l in lines:
        if l.strip():
            cur.append(l.strip())
        elif cur:
            blocks.append(cur)
            cur = []
    if cur:
        blocks.append(cur)
    return blocks


def mark_broken_formulas(blocks):
    """Sequências de fragmentos curtos (letras/operadores soltos) = fórmula destruída."""
    flat = [(bi, li) for bi, b in enumerate(blocks) for li in range(len(b))]

    def short(bi, li):
        l = blocks[bi][li]
        return len(l) <= 10 and not l.endswith((":", ";", ".")) and not STRUCTURAL_RE.match(l)

    i = 0
    runs = []
    while i < len(flat):
        j = i
        while j < len(flat) and short(*flat[j]):
            j += 1
        run = flat[i:j]
        if len(run) >= 4 and sum(1 for bi, li in run if len(blocks[bi][li]) <= 2) >= 2:
            runs.append(run)
        i = max(j, i + 1)

    if not runs:
        return blocks
    drop = {}
    for run in runs:
        text = " ".join(blocks[bi][li] for bi, li in run)
        first_bi = run[0][0]
        for bi, li in run:
            drop.setdefault(bi, set()).add(li)
        drop.setdefault(("callout", first_bi), text)

    new_blocks = []
    for bi, b in enumerate(blocks):
        callout = drop.get(("callout", bi))
        if callout:
            new_blocks.append([
                "> [!warning]- Fórmula não extraída corretamente do PDF — consulte o original",
                f"> `{callout}`",
            ])
        keep = [l for li, l in enumerate(b) if li not in drop.get(bi, set())]
        if keep:
            new_blocks.append(keep)
    return new_blocks


def is_cell(l, maxlen=45):
    return len(l) <= maxlen and not l.endswith((".", ";", ":")) and not STRUCTURAL_RE.match(l)


def build_tables(blocks):
    out = []
    i = 0
    while i < len(blocks):
        b = blocks[i]
        prev = out[-1][-1] if out else ""
        nxt = blocks[i + 1] if i + 1 < len(blocks) else None
        if (
            nxt
            and prev.endswith(":")
            and 2 <= len(b) <= 6
            and all(is_cell(l, 40) for l in b)
            and len(nxt) >= len(b)
            and len(nxt) % len(b) == 0
            and all(is_cell(l) for l in nxt)
        ):
            n = len(b)
            rows = [nxt[k:k + n] for k in range(0, len(nxt), n)]
            table = ["| " + " | ".join(b) + " |", "|" + " --- |" * n]
            table += ["| " + " | ".join(r) + " |" for r in rows]
            out.append(table)
            i += 2
            continue
        out.append(b)
        i += 1
    return out


def is_open(line):
    return not line.rstrip().endswith((".", ":", ";", "!", "?"))


def join_text(a, b):
    if re.search(r"[A-Za-zÀ-ÿ0-9]-$", a):
        return a + b
    return a + " " + b


FORMULA_INTRO_RE = re.compile(r"(fórmula|expressão|equação)\s*:$", re.I)
FORMULA_LEGEND_RE = re.compile(r"^(onde|em que)\s*:", re.I)
MISSING_FORMULA = [
    "> [!warning] Fórmula ausente na extração do PDF — consulte o original",
]


def is_noise(block):
    """Blocos de 1 caractere que são sujeira de digitalização ('|', 'o', '“')."""
    return len(block) == 1 and len(block[0]) == 1 and not re.match(r"[A-Z0-9]", block[0])


def continues(last, first):
    if STRUCTURAL_RE.match(first) and not (len(last) <= 4 and first.startswith("- ")):
        return False
    if last.startswith(("|", ">")) or not is_open(last):
        return False
    return bool(
        first[:1].islower()
        or first[:1] == "("
        or re.search(r"[A-Za-zÀ-ÿ0-9]-$", last)
        or (first[:1].isdigit() and re.search(r"[a-zà-ÿ]$", last) and not re.match(r"^\d+\)", first))
        or (len(last) <= 4 and first.startswith("- "))  # símbolo "X" + "- definição"
    )


def reflow(blocks):
    paras = []  # cada item: lista de linhas lógicas (normalmente 1)
    blocks = [[l for l in b if not is_noise([l])] for b in blocks]
    # "|" no começo de linha fora de tabela de verdade é borda/traço lido pelo
    # OCR; se ficar, o Obsidian renderiza como tabela quebrada
    blocks = [
        b if any(re.match(r"^\|\s*-{3}", l) for l in b)
        else [re.sub(r"^\|+\s*", "", l) or l for l in b]
        for b in blocks
    ]
    blocks = [[l for l in b if l.strip() and not is_noise([l])] for b in blocks]
    blocks = [b for b in blocks if b and not re.match(r"^/\w+$", b[0])]
    for b in blocks:
        b = [re.sub(r"(?<=\S) {2,}(?=\S)", " ", l) if not l.startswith("|") else l for l in b]
        if (
            paras
            and FORMULA_INTRO_RE.search(paras[-1][-1])
            and FORMULA_LEGEND_RE.match(b[0])
        ):
            paras.append(list(MISSING_FORMULA))
        if b[0].startswith(("|", ">")):
            paras.append(list(b))
            continue
        # junta com o parágrafo anterior quando ele ficou aberto (quebra de página/coluna)
        if paras and not paras[-1][-1].startswith(("|", ">")):
            last = paras[-1][-1]
            if continues(last, b[0]):
                paras[-1][-1] = join_text(last, b[0])
                b = b[1:]
                if not b:
                    continue
                cur = paras[-1]
            else:
                cur = None
        else:
            cur = None
        if cur is None:
            cur = [b[0]]
            paras.append(cur)
            b = b[1:]
        for l in b:
            prev = cur[-1]
            if len(prev) <= 4 and l.startswith("- ") and not prev.startswith("#"):
                cur[-1] = join_text(prev, l)
            elif STRUCTURAL_RE.match(l) or prev.startswith("#"):
                cur = [l]
                paras.append(cur)
            elif prev.endswith((";", ":")):
                cur.append(l)  # listas "A = ...; B = ..." ficam uma por linha
            else:
                cur[-1] = join_text(prev, l)
    return "\n\n".join("\n".join(p) for p in paras) + "\n"


LEFTOVER_RES = [
    re.compile(r"Reprodução permitida desde que citado o DNER", re.I),
    re.compile(r"^#*\s*DNER\s*-?\s*(?:ME|ES|EM|PRO|CLA|TER|IE|PAD)\s*[\dIl]+\s*/\s*\d+$"),  # "I07/94" = OCR de 107/94
    re.compile(r"^#*\s*DNER\s*-?\s*(?:ME|ES|EM|PRO|CLA|TER|IE|PAD)$"),  # cabeçalho de página partido: "DNER-ME" / "011/94"
    re.compile(r"^\d{3}\s*/\s*\d{2}$"),
    re.compile(r"^/\s*\w+$"),  # "/Anexo", "/ Anexo": aviso de continuação de página
]


def drop_leftovers(text):
    """Última passada: rodapés que só ficam reconhecíveis depois do reflow
    (ex.: 'p.' + '02/03' em linhas separadas viram 'p. 02/03')."""
    paras = [p.strip() for p in text.split("\n\n")]
    keep = []
    for p in paras:
        if not p or (("\n" not in p) and (is_footer(p) or any(r.search(p) for r in LEFTOVER_RES))):
            continue
        # cabeçalho de página grudado na continuação da frase da página anterior:
        # "...onde estiver sendo" + "DNER-ES 393/99 feito o espalhamento..."
        m = re.match(r"^DNER\s*-?\s*(?:ME|ES|EM|PRO|CLA|TER|IE|PAD)\s*\d+\s*/\s*\d+\s+(?=[a-zà-ú])", p)
        if m:
            p = p[m.end():]
            if keep and not re.search(r"[.:;!?]$", keep[-1]) and not keep[-1].startswith(("#", "|", "!", "$", ">")):
                keep[-1] = keep[-1] + " " + p
                continue
        keep.append(p)
    return "\n\n".join(keep) + "\n"


def to_wikilinks(text, stem_exists):
    def repl(m):
        label, target = m.group(1), m.group(2)
        stem = Path(target).stem
        if stem in stem_exists:
            return f"[[{stem}|{label}]]"
        return m.group(0)

    text = LINK_MD_RE.sub(repl, text)
    return escape_table_wikilinks(text)


def escape_table_wikilinks(text):
    """Em linha de tabela, [[a|b]] -> [[a\\|b]] (o "|" sem escape separa células no Obsidian)."""
    out = []
    for line in text.split("\n"):
        if line.lstrip().startswith("|"):
            line = re.sub(r"\[\[([^\[\]|\\]+)\|([^\[\]]+)\]\]", r"[[\1\\|\2]]", line)
        out.append(line)
    return "\n".join(out)


# ------------------------------------------------------------------ main

def citation_fields(graph, id_to_stem, norma_id):
    cita = sorted({id_to_stem[e["to"]] for e in graph["edges"] if e["from"] == norma_id and e["to"] in id_to_stem})
    citada = sorted({id_to_stem[e["from"]] for e in graph["edges"] if e["to"] == norma_id and e["from"] in id_to_stem})
    return [f"[[{s}]]" for s in citada], [f"[[{s}]]" for s in cita]


def process(path, normas_by_md, graph, id_to_stem, stems):
    text = path.read_text(encoding="utf-8")
    fm, body = parse_front_matter(text)
    rel = path.relative_to(ROOT).as_posix()
    entry = normas_by_md.get(rel)
    if entry is None:
        return None, "sem entrada em normas.json"

    citada, cita = citation_fields(graph, id_to_stem, entry["id"])

    if "Citada por" in fm:  # já normalizado / revisado à mão: só atualiza citações
        fm["Citada por"] = citada
        fm["Esta Norma cita"] = cita
        if entry["tipo"] == "ES" and not fm.get("area"):  # área vazia (título sem prefixo)
            fm["area"] = area_for(entry["codigo"], entry["titulo"])
        return dump_front_matter(fm) + body, "citações atualizadas"

    lines = body.split("\n")
    lines, descr, aprov = extract_descritores(lines)
    lines = [l for l in lines if not is_footer(l)]
    lines = normalize_headings(lines)
    lines = cut_header_and_sumario(lines)
    blocks = to_blocks(lines)
    blocks = mark_broken_formulas(blocks)
    blocks = build_tables(blocks)
    new_body = to_wikilinks(drop_leftovers(reflow(blocks)), stems)

    new_fm = {
        "codigo": entry["codigo"],
        "titulo": entry["titulo"],
        "orgao": entry["orgao"],
        "tipo": entry["tipo"],
        "area": area_for(entry["codigo"], entry["titulo"]) if entry["tipo"] == "ES" else None,
        "ano": entry["ano"],
        "aprovacao": aprov,
        "status": entry["status"],
        "pdf_original": f"../../{entry['pdf']}",
        "link": entry.get("url"),
        "video": video_for(path.stem),
    }
    if entry["tipo"] != "ES":
        del new_fm["area"]
    for name, _ in DESCRITORES:
        new_fm[name] = descr.get(name, [])
    new_fm["Citada por"] = citada
    new_fm["Esta Norma cita"] = cita
    for k, v in fm.items():  # preserva qualquer propriedade extra que já exista
        if k not in new_fm:
            new_fm[k] = v
    return dump_front_matter(new_fm) + new_body, "normalizado"


def main():
    args = sys.argv[1:]
    dry_dir = None
    if "--dry-run" in args:
        k = args.index("--dry-run")
        dry_dir = Path(args[k + 1])
        dry_dir.mkdir(parents=True, exist_ok=True)
        args = args[:k] + args[k + 2:]

    files = [Path(a).resolve() for a in args] or (sorted(ME_DIR.glob("dner_me_*.md"))
             + sorted((MD_DIR / "especificacao-de-servico-es").glob("dner_es_*.md"))
             + sorted((MD_DIR / "especificacao-de-material-em").glob("dner_em_*.md"))
             + sorted((MD_DIR / "procedimento-pro").glob("dner[-_]pro*.md"))
             + [p for d in ("terminologia-ter", "instrucao-de-ensaio-ie", "padronizacao-pad", "classificacao-cla")
                for p in sorted((MD_DIR / d).glob("dner_*.md"))])

    normas = json.loads(NORMAS_JSON.read_text(encoding="utf-8"))
    normas_by_md = {e["md"]: e for e in normas}
    id_to_stem = {e["id"]: Path(e["md"]).stem for e in normas}
    stems = set(id_to_stem.values())
    graph = json.loads(GRAPH_JSON.read_text(encoding="utf-8"))

    for f in files:
        result, status = process(f, normas_by_md, graph, id_to_stem, stems)
        if result is None:
            print(f"PULADO {f.name}: {status}")
            continue
        target = (dry_dir / f.name) if dry_dir else f
        target.write_text(result, encoding="utf-8")
        print(f"{status:22s} {f.name}" + (f" -> {target}" if dry_dir else ""))


if __name__ == "__main__":
    main()
