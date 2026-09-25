"""
Tabelas das normas DNER com PDF digital (ES de 1997-2000): a normalização do
DNER parte do texto extraído, que achata as tabelas ("Peneira de malha quadrada
Percentagem passando ...") ou as confunde com fórmula (aviso [!warning]).
Aqui cada tabela é lida DIRETO DO PDF (detecção nativa do PyMuPDF) e entra no
markdown como tabela + a imagem recortada logo abaixo (conferência), no lugar
do texto achatado.

Localização no md: o texto achatado é a sequência de parágrafos cujas palavras
são (quase) todas palavras da tabela; ela é trocada pelo bloco da tabela. Se o
texto achatado não é achado, a tabela entra depois do parágrafo que contém o
texto que vem logo antes dela no PDF.

Registro em data/tabelas/<norma>.json (page, bbox, texto_removido). Correções
manuais: "ignorar": true (não é tabela), "clip": [x0, y0, x1, y1].
As caixas das tabelas são lidas por figuras_dner.py, que não as repete como figura.

Uso: python scripts/tabelas_dner.py arquivos.md ...
"""
import json
import re
import sys
from pathlib import Path

import pymupdf

sys.path.insert(0, str(Path(__file__).resolve().parent))
import normalizar_me_dnit as nd  # noqa: E402
from figuras_dner import norm_alnum, words, is_scanned, long_line  # noqa: E402

ROOT = Path(__file__).resolve().parent.parent
TAB_DIR = ROOT / "data" / "tabelas"
FIG_IMG = ROOT / "markdown" / "_figuras"
NORMAS_JSON = ROOT / "data" / "normas.json"
TAB_EMBED_RE = re.compile(r"!\[\[(dner[_-][^\]]*_tab\d+\.png)\]\]")
WARN_RE = re.compile(r"^> \[!warning\][^\n]*\n?")


def clean_cell(c):
    return re.sub(r"\s+", " ", nd.fix_private_chars(c or "", "Symbol")).strip().replace("|", "\\|")


def extend_table(page, t):
    """Nas tabelas do DNER a 1ª coluna (peneira, "n/k/α") e às vezes a última
    linha ficam fora dos fios: a detecção por linhas as perde. Mantém a grade
    dos fios e acrescenta a coluna de texto alinhado à esquerda/direita e as
    linhas de texto logo abaixo que seguem as mesmas colunas."""
    x0, y0, x1, y1 = t.bbox
    # linhas de dados sem fio horizontal entre elas saem numa célula só, com uma
    # linha de texto por linha da tabela ("100\n95-100\n70-90..."): desdobra em
    # uma linha por valor quando as células cheias têm o mesmo número de linhas
    ws = [w for w in page.get_text("words") if w[3] > y0 - 2 and w[1] < y1 + 60]
    rows, row_boxes = [], []
    for r, rb in zip(t.extract(), t.rows):
        k = max(len((c or "").split("\n")) for c in r)
        cells = [c for c in rb.cells]
        if k >= 3 and sum(1 for c in r if c and len(c.split("\n")) >= 3) >= 2:
            # posição de cada linha de texto dentro da linha da grade (colunas mais
            # curtas têm linhas em branco, então a contagem de linhas não alinha)
            inner = [w for w in ws if rb.bbox[1] - 1 <= (w[1] + w[3]) / 2 <= rb.bbox[3] + 1]
            ys = []
            for yc in sorted((w[1] + w[3]) / 2 for w in inner):
                if not ys or yc - ys[-1][-1] > 2.5:
                    ys.append([yc])
                else:
                    ys[-1].append(yc)
            centers = [sum(g) / len(g) for g in ys]
            edges = [rb.bbox[1]] + [(a + b) / 2 for a, b in zip(centers, centers[1:])] + [rb.bbox[3]]
            for a, b in zip(edges, edges[1:]):
                sub = [""] * len(cells)
                for w in sorted(inner, key=lambda w: w[0]):
                    wc, hc = (w[0] + w[2]) / 2, (w[1] + w[3]) / 2
                    if not (a <= hc < b):
                        continue
                    for j, c in enumerate(cells):
                        if c and c[0] - 1 <= wc <= c[2] + 1:
                            sub[j] = (sub[j] + " " + w[4]).strip()
                            break
                rows.append([clean_cell(s) for s in sub])
                row_boxes.append([rb.bbox[0], a, rb.bbox[2], b])
        else:
            rows.append([clean_cell(c) for c in r])
            row_boxes.append(list(rb.bbox))
    n_grid = len(rows)

    def cx(w):
        return (w[0] + w[2]) / 2

    def cy(w):
        return (w[1] + w[3]) / 2

    # linhas de texto abaixo da grade, alinhadas com ela (até um espaço grande)
    below = sorted((w for w in ws if cy(w) > y1 and x0 - 80 < cx(w) < x1 + 10), key=lambda w: (round(cy(w)), w[0]))
    lines_below, last = [], y1
    for w in below:
        if lines_below and abs(cy(w) - cy(lines_below[-1][0])) < 3:
            lines_below[-1].append(w)
        elif cy(w) - last < 16:
            lines_below.append([w])
        else:
            break
        last = w[3]
    # nota de rodapé da tabela ("n = nº de amostras k = ...") não é linha de dados:
    # volta como parágrafo logo depois da tabela
    def is_note(l):
        return any(w[4] == "=" or w[4].endswith("=") for w in l)
    note = " ".join(w[4] for l in lines_below if is_note(l) for w in sorted(l, key=lambda w: w[0]))
    lines_below = [l for l in lines_below if len(l) >= 2 and not is_note(l)]
    for l in lines_below:
        row_boxes.append([x0, min(w[1] for w in l) - 1, x1, max(w[3] for w in l) + 1])
        rows.append([""] * len(rows[0]))
    # coluna à esquerda / à direita dos fios
    col_edges = sorted({round(c[0]) for r in t.rows for c in r.cells if c} | {round(x1)})
    left = [w for w in ws if cx(w) < x0 - 2 and row_boxes[0][1] - 2 < cy(w) < row_boxes[-1][3] + 2]
    right = [w for w in ws if cx(w) > x1 + 2 and cx(w) < x1 + 90 and row_boxes[0][1] - 2 < cy(w) < row_boxes[-1][3] + 2]
    if left:
        rows = [[""] + r for r in rows]
    if right:
        rows = [r + [""] for r in rows]

    def put(i, j, w):
        rows[i][j] = (rows[i][j] + " " + w[4]).strip()

    for i, rb in enumerate(row_boxes):
        in_row = sorted((w for w in ws if rb[1] - 1 <= cy(w) <= rb[3] + 1), key=lambda w: (round(w[1]), w[0]))
        if left:
            for w in in_row:
                if cx(w) < x0 - 2:
                    put(i, 0, w)
        if right:
            for w in in_row:
                if x1 + 2 < cx(w) < x1 + 90:
                    put(i, len(rows[i]) - 1, w)
        if i >= n_grid:  # linha nova (abaixo dos fios): distribui pelas colunas da grade
            for w in in_row:
                if x0 - 2 <= cx(w) <= x1 + 2:
                    j = max(0, sum(1 for e in col_edges[:-1] if cx(w) >= e) - 1)
                    put(i, j + (1 if left else 0), w)
    bbox = [min([x0] + [w[0] for w in left]), y0, max([x1] + [w[2] for w in right]), row_boxes[-1][3]]
    return rows, bbox, note


def pdf_tables(doc):
    """[(page, bbox, rows, nota)] das tabelas das páginas digitais."""
    out = []
    for page in doc:
        if page.number == 0 or is_scanned(page):
            continue  # capa (quadro de descritores) / página escaneada
        try:
            tabs = page.find_tables().tables
        except Exception:
            continue
        for t in tabs:
            if t.row_count < 2 or t.col_count < 2:
                continue
            rows, bbox, note = extend_table(page, t)
            rows = [r for r in rows if any(r)]
            flat = " ".join(c for r in rows for c in r)
            if len(rows) < 2 or re.search(r"_{5,}", flat) or len(flat) < 15:
                continue
            # pedaço já absorvido pela extensão de uma tabela anterior da página
            def overlap(a, b):
                w, h = min(a[2], b[2]) - max(a[0], b[0]), min(a[3], b[3]) - max(a[1], b[1])
                return max(0, w) * max(0, h) / max(1.0, (b[2] - b[0]) * (b[3] - b[1]))
            if any(p == page.number and overlap(bb, list(t.bbox)) > 0.5 for p, bb, _, _ in out):
                continue
            out.append((page.number, bbox, rows, note))
    return out


def to_markdown(rows):
    n = max(len(r) for r in rows)
    rows = [r + [""] * (n - len(r)) for r in rows]
    md = ["| " + " | ".join(rows[0]) + " |", "|" + " --- |" * n]
    md += ["| " + " | ".join(r) + " |" for r in rows[1:]]
    return "\n".join(md)


def paragraph_words(p):
    return words(re.sub(r"[#*>`|]", " ", WARN_RE.sub("", p)))


def place(paras, bag, anchor, start):
    """Índices [i, j) dos parágrafos com o texto achatado da tabela (a partir de start)."""
    def is_table_text(p):
        if re.fullmatch(r"#+\s*\d+\s*\S{0,3}", p.strip()):
            return True  # título falso do OCR com pedaço da tabela ("## 21 k")
        if p.startswith(("![[", "$$", "|")) or re.match(r"^#+\s*\d", p) or re.match(r"^\*\*\d", p):
            return False
        ws = paragraph_words(p)
        return bool(ws) and sum(w in bag for w in ws) / len(ws) >= 0.8
    for i in range(start, len(paras)):
        if is_table_text(paras[i]) and len(paragraph_words(paras[i])) >= 3:
            j = i
            while j < len(paras) and (is_table_text(paras[j]) or not paras[j].strip()):
                j += 1
            return i, j
    # não achou: logo depois do parágrafo com o texto que antecede a tabela no PDF
    a = norm_alnum(anchor)[:40]
    if len(a) >= 12:
        for i in range(start, len(paras)):
            if a in norm_alnum(paras[i]):
                return i + 1, i + 1
    return None


def process(md_path, entry):
    stem = md_path.stem
    doc = pymupdf.open(ROOT / entry["pdf"])
    store_path = TAB_DIR / f"{stem}.json"
    store = json.loads(store_path.read_text(encoding="utf-8")) if store_path.exists() else {}
    tables = pdf_tables(doc)
    if not tables and not store:
        return 0, []

    lines = []
    for page in doc:
        lines += nd.page_lines(page, 9.0)

    raw = md_path.read_text(encoding="utf-8")
    end = raw.find("\n---\n", 4) + 5
    front, body = raw[:end], raw[end:]
    # reaplicação: tira os blocos de tabela inseridos antes (tabela md + imagem)
    body = re.sub(r"\n*(\|[^\n]*\n)+\n*!\[\[" + re.escape(stem) + r"_tab\d+\.png\]\]\n*", "\n\n@@TAB@@\n\n", body)
    for t in store.values():  # nota de rodapé reinserida numa execução anterior
        if t.get("nota_tabela"):
            body = body.replace("@@TAB@@\n\n" + t["nota_tabela"], "@@TAB@@")
    paras = [p for p in body.split("\n\n")]

    new_store, missing, cursor = {}, [], 0
    for n, (pno, bbox, rows, note) in enumerate(tables, 1):
        tab_id = f"tab{n:02d}"
        old = store.get(tab_id, {})
        entry_t = {"page": pno + 1, "bbox": [round(v, 1) for v in bbox]}
        for extra in ("ignorar", "clip", "nota", "texto_removido"):
            if extra in old:
                entry_t[extra] = old[extra]
        if note:
            entry_t["nota_tabela"] = note
        new_store[tab_id] = entry_t
        if old.get("ignorar"):
            continue
        clip = old.get("clip") or [bbox[0] - 3, bbox[1] - 3, bbox[2] + 3, bbox[3] + 3]
        png = FIG_IMG / f"{stem}_{tab_id}.png"
        png.parent.mkdir(parents=True, exist_ok=True)
        page = doc[pno]
        page.get_pixmap(clip=pymupdf.Rect(clip) & page.rect, dpi=150).save(str(png))
        block = to_markdown(rows) + f"\n\n![[{png.name}]]" + (f"\n\n{note}" if note else "")

        # lugar reservado numa execução anterior
        k = next((i for i in range(cursor, len(paras)) if paras[i].strip() == "@@TAB@@"), None)
        if k is not None:
            paras[k] = block
            cursor = k + 1
            continue
        bag = set(w for r in rows for c in r for w in words(c)) | set(words(note))
        before = [r["text"] for r in lines
                  if (r["page"] == pno and r["bbox"][3] <= bbox[1] + 2 or r["page"] < pno) and long_line(r["text"])]
        where = place(paras, bag, before[-1] if before else "", cursor)
        if where is None:
            missing.append(tab_id)
            continue
        i, j = where
        removed = [p for p in paras[i:j] if p.strip()]
        if removed:
            entry_t["texto_removido"] = removed
        paras[i:j] = [block]
        cursor = i + 1
    body = "\n\n".join(p for p in paras if p.strip() != "@@TAB@@")

    # tabelas cadastradas à mão (sem fios verticais: a detecção não as acha):
    # "manual": true, page, clip, md (tabela markdown) e de_inicio (parágrafo achatado)
    for tab_id, man in store.items():
        if not man.get("manual"):
            continue
        new_store[tab_id] = man
        png = FIG_IMG / f"{stem}_{tab_id}.png"
        page = doc[man["page"] - 1]
        page.get_pixmap(clip=pymupdf.Rect(man["clip"]) & page.rect, dpi=150).save(str(png))
        block = man["md"] + f"\n\n![[{png.name}]]"
        if man["de_inicio"] in body:
            body = body.replace(man["de_inicio"], block, 1)
        elif block not in body:
            missing.append(tab_id)
    body = re.sub(r"\n{3,}", "\n\n", body)
    md_path.write_text(front + body, encoding="utf-8")
    TAB_DIR.mkdir(parents=True, exist_ok=True)
    store_path.write_text(json.dumps(new_store, ensure_ascii=False, indent=2), encoding="utf-8")
    return len(new_store), missing


def main():
    entries = {e["md"]: e for e in json.loads(NORMAS_JSON.read_text(encoding="utf-8"))}
    args = sys.argv[1:] or [str(p) for d, g in (("especificacao-de-servico-es", "dner_es_*.md"), ("especificacao-de-material-em", "dner_em_*.md"), ("procedimento-pro", "dner[-_]pro*.md"), ("terminologia-ter", "dner_*.md"), ("instrucao-de-ensaio-ie", "dner_*.md"), ("padronizacao-pad", "dner_*.md"))
                            for p in sorted((ROOT / "markdown" / d).glob(g))]
    for a in args:
        f = Path(a).resolve()
        n, missing = process(f, entries[f.relative_to(ROOT).as_posix()])
        print(f"{f.name}: {n} tabelas" + (f"  (sem lugar no md: {', '.join(missing)})" if missing else ""))


if __name__ == "__main__":
    main()
