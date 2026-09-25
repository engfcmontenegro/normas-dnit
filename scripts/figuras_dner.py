"""
Insere as figuras dos PDFs nos markdowns das normas ME do DNER (cofre Obsidian),
no mesmo princípio usado no DNIT: recorte em PNG (markdown/_figuras/) + embed
![[<norma>_figNN.png]] no ponto certo do texto.

Os markdowns do DNER foram normalizados a partir do texto (sem coordenadas),
então o script NÃO reescreve o texto: só insere/atualiza os embeds de figura.

Detecção:
  - páginas digitais: mesmo detector do DNIT (imagens + desenhos vetoriais,
    sem tabelas), associado à legenda "Figura N";
  - páginas escaneadas (a página inteira é uma imagem + camada de OCR): faixas
    da página sem linha de texto corrido que contêm tinta viram figura.

Posição no markdown: o embed entra antes do parágrafo que contém a linha de
texto que vem logo depois da figura no PDF (ou antes da legenda, quando ela
fica embaixo da figura), achada por busca aproximada.

Correções manuais em data/figuras/<norma>.json: "ignorar": true, "clip" [x0,y0,x1,y1],
"inserir_antes": "<texto exato do md>" (posição do embed) e "manual": true (o embed
foi posto à mão no md, ex. anexo reescrito em data/formulas, e não é movido).

Folhas de anexo (formulário, tabela, página só de figuras) viram uma imagem só;
parágrafos do md formados só pelos rótulos da figura (cotas, "CORTE", carimbo)
são removidos e registrados em "texto_removido".

Uso: python scripts/figuras_dner.py [arquivos.md ...]
"""
import json
import re
import sys
import unicodedata
from pathlib import Path

import numpy as np
import pymupdf
from scipy import ndimage

sys.path.insert(0, str(Path(__file__).resolve().parent))
import normalizar_me_dnit as nd  # noqa: E402

ROOT = Path(__file__).resolve().parent.parent
ME_DIR = ROOT / "markdown" / "metodo-de-ensaio-me"
FIG_DIR = ROOT / "data" / "figuras"
FIG_IMG = ROOT / "markdown" / "_figuras"
NORMAS_JSON = ROOT / "data" / "normas.json"

CAPTION_RE = re.compile(r"^\s*(Figura|FIGURA|Fig\.|Gráfico|GRÁFICO|Foto|FOTO)\s*[A-Z]?[\d|]+", re.I)  # "FIGURA |": 1 lido como | no OCR
EMBED_RE = re.compile(r"\n*!\[\[dner[_-][^\]]*_fig\d+\.png\]\]\n*")  # dner_me_…, dner-pro-…


# ------------------------------------------------------------ utilidades

def norm_alnum(s):
    """Minúsculas, sem acento, só letras e dígitos (para busca aproximada)."""
    s = unicodedata.normalize("NFKD", s).encode("ascii", "ignore").decode().lower()
    return re.sub(r"[^a-z0-9]", "", s)


def build_index(text):
    """Texto normalizado + mapa posição-normalizada -> posição-original."""
    chars, pos = [], []
    for i, ch in enumerate(text):
        n = norm_alnum(ch)
        for c in n:
            chars.append(c)
            pos.append(i)
    return "".join(chars), pos


def clean(t):
    return re.sub("[\x01-\x04]", "", t)


def is_scanned(page):
    area = page.rect.width * page.rect.height
    for info in page.get_image_info():
        x0, y0, x1, y1 = info["bbox"]
        if (x1 - x0) * (y1 - y0) > 0.6 * area:
            return True
    return False


def long_line(t):
    t = t.strip()
    letters = sum(ch.isalpha() for ch in t)
    return len(t) >= 28 and letters >= 0.55 * len(t)


# ------------------------------------------------------------ detecção

DPI = 72
ZOOM = DPI / 72


def page_figures(page, plines):
    """Figuras da página = manchas de tinta FORA das caixas de texto (desenho,
    foto, grade). Vale para página escaneada (texto do OCR) e digital."""
    W, H = page.rect.width, page.rect.height
    pix = page.get_pixmap(dpi=DPI, colorspace=pymupdf.csGRAY)
    ink = np.frombuffer(pix.samples, dtype=np.uint8).reshape(pix.height, pix.width) < 200
    ink = ink.copy()
    h, w = ink.shape
    # moldura da página, fios de cabeçalho/rodapé e margens
    # (só perto das bordas: fio de tabela grande no meio da folha fica)
    col_frame = ink.sum(axis=0) > 0.6 * h
    col_frame[int(70 * ZOOM): w - int(70 * ZOOM)] = False
    ink[:, col_frame] = False
    row_frame = ink.sum(axis=1) > 0.8 * w
    row_frame[int(100 * ZOOM): h - int(80 * ZOOM)] = False
    ink[row_frame, :] = False
    ink[: int(62 * ZOOM), :] = False
    ink[int((H - 40) * ZOOM):, :] = False
    ink[:, : int(30 * ZOOM)] = False
    ink[:, int((W - 25) * ZOOM):] = False
    # texto (inclusive rótulos de figura) não conta
    for r in plines:
        x0, y0, x1, y1 = r["bbox"]
        ink[max(0, int((y0 - 1) * ZOOM)): int((y1 + 1) * ZOOM) + 1,
            max(0, int((x0 - 1) * ZOOM)): int((x1 + 1) * ZOOM) + 1] = False
    # traço reto isolado (borda torta da digitalização, fio, linha de assinatura)
    # não é figura; grade de tabela e desenho ficam (são uma peça só, não finas)
    lab0, n0 = ndimage.label(ink, structure=np.ones((3, 3)))
    for i, sl in enumerate(ndimage.find_objects(lab0), 1):
        hh, ww = (sl[0].stop - sl[0].start) / ZOOM, (sl[1].stop - sl[1].start) / ZOOM
        if min(hh, ww) < 5 and max(hh, ww) > 25:
            ink[sl][lab0[sl] == i] = False
            continue
        # borda de página torta: reta inclinada ou "L" de canto (tabela/moldura
        # fechada tem tinta nos 4 lados e fica)
        if max(hh, ww) > 60:
            comp = lab0[sl] == i
            ys, xs = np.nonzero(comp)
            if len(xs) > 10:
                ev = np.linalg.eigvalsh(np.cov(np.vstack([xs, ys])))
                reta = ev[0] ** 0.5 < 1.5
                h_, w_ = comp.shape
                lados = [(ys <= 2).mean() > 0.25, (ys >= h_ - 3).mean() > 0.25,
                         (xs <= 2).mean() > 0.25, (xs >= w_ - 3).mean() > 0.25]  # topo, base, esq, dir
                canto = (sum(lados) == 2 and not (lados[0] and lados[1]) and not (lados[2] and lados[3])
                         and len(xs) < 3 * (h_ + w_))
                if reta or canto:
                    ink[sl][comp] = False
    # agrupa a tinta que sobrou (manchas a até ~14 pt entre si)
    k = int(14 * ZOOM)
    grown = ndimage.binary_dilation(ink, structure=np.ones((k, k)))
    labels, _ = ndimage.label(grown)
    boxes = []
    for sl in ndimage.find_objects(labels):
        ys, xs = sl
        cnt = int(ink[sl].sum())
        bx = [xs.start / ZOOM, ys.start / ZOOM, xs.stop / ZOOM, ys.stop / ZOOM]
        bw, bh = bx[2] - bx[0], bx[3] - bx[1]
        if bw < 60 or bh < 35 or cnt < 60:
            continue
        # carimbo "Figura N" / "Anexo" no canto inferior direito da folha
        if bx[1] > H * 0.78 and bx[0] > W * 0.6 and bw < 170 and bh < 90:
            continue
        boxes.append(bx)
    # rótulos de texto dentro/encostados entram na caixa
    out = []
    for bx in boxes:
        grown = bx
        for r in plines:
            x0, y0, x1, y1 = r["bbox"]
            cx, cy = (x0 + x1) / 2, (y0 + y1) / 2
            # só rótulos (não texto corrido), e sempre em relação à caixa original
            # linha que atravessa a caixa (1ª coluna de tabela sem fio) também entra
            crosses = bx[1] + 2 <= cy <= bx[3] - 2 and x1 > bx[0] + 5 and x0 < bx[2] - 5
            if ((bx[0] - 4 <= cx <= bx[2] + 4 and bx[1] - 4 <= cy <= bx[3] + 4 or crosses)
                    and not CAPTION_RE.match(r["text"]) and not (long_line(r["text"]) and not crosses)):
                grown = nd._union(grown, r["bbox"])
        out.append(grown)
    merged = []
    for r in sorted(out, key=lambda r: (r[1], r[0])):
        for m in merged:
            if nd._rect_gap(m, r) <= 8:
                m[:] = nd._union(m, r)
                break
        else:
            merged.append(list(r))
    # peças da mesma figura (vistas, detalhes, painéis): junta as que não têm
    # texto corrido nem legenda entre si
    barriers = [r["bbox"] for r in plines if long_line(r["text"]) or CAPTION_RE.match(r["text"])]

    def separated(a, b):
        top, bot = (a, b) if a[1] <= b[1] else (b, a)
        if bot[1] <= top[3]:
            return False  # lado a lado
        x0, x1 = min(a[0], b[0]), max(a[2], b[2])
        return any(top[3] - 2 <= (r[1] + r[3]) / 2 <= bot[1] + 2 and min(r[2], x1) - max(r[0], x0) > 0
                   for r in barriers)
    changed = True
    while changed:
        changed = False
        for i in range(len(merged)):
            for j in range(i + 1, len(merged)):
                if not separated(merged[i], merged[j]):
                    merged[i] = nd._union(merged[i], merged.pop(j))
                    changed = True
                    break
            if changed:
                break
    final = []
    lab_g, _ = ndimage.label(ink, structure=np.ones((3, 3)))
    for bx in merged:
        if bx[3] - bx[1] < 70 and bx[2] - bx[0] < 250:
            continue  # fórmula pequena (já está no texto)
        # traço solto (borda torta da página escaneada): pouca tinta para o tamanho
        # da caixa e no máximo 1 lado da caixa desenhado (moldura/tabela fecha 3-4)
        y0i, y1i, x0i, x1i = int(bx[1] * ZOOM), int(bx[3] * ZOOM), int(bx[0] * ZOOM), int(bx[2] * ZOOM)
        box_ink = ink[y0i:y1i, x0i:x1i]
        hb, wb = box_ink.shape
        if hb > 4 and wb > 4:
            band = 3
            lados = sum([box_ink[:band].any(axis=0).mean() > 0.4, box_ink[-band:].any(axis=0).mean() > 0.4,
                         box_ink[:, :band].any(axis=1).mean() > 0.4, box_ink[:, -band:].any(axis=1).mean() > 0.4])
            if box_ink.sum() < 3.5 * (hb + wb) and lados <= 1 and hb < 0.45 * wb:
                ys_, xs_ = np.nonzero(box_ink)
                if len(xs_) > 20:
                    evals, evecs = np.linalg.eigh(np.cov(np.vstack([xs_, ys_])))
                    ang = abs(np.degrees(np.arctan2(evecs[1, 1], evecs[0, 1]))) % 180
                    ang = min(ang, 180 - ang)
                    # eixo principal inclinado (borda torta da digitalização)
                    if 2 < ang < 88 and evals[1] > 20 * max(evals[0], 1e-6):
                        continue
        # faixa baixa e larga cuja tinta é quase toda de "letras" soltas: linha de
        # texto torta que o OCR não cobriu (página escaneada em tiras), não figura
        if bx[3] - bx[1] < 120 and bx[2] - bx[0] > 150:
            sub = lab_g[int(bx[1] * ZOOM): int(bx[3] * ZOOM), int(bx[0] * ZOOM): int(bx[2] * ZOOM)]
            tot = glyph = 0
            for sl2 in ndimage.find_objects(sub):
                if sl2 is None:
                    continue
                n2 = int((sub[sl2] > 0).sum())
                tot += n2
                gh, gw = (sl2[0].stop - sl2[0].start) / ZOOM, (sl2[1].stop - sl2[1].start) / ZOOM
                if gh <= 11 and gw <= 11:
                    glyph += n2
            if tot and glyph / tot >= 0.7:
                continue
        # coberta de texto corrido = parágrafo com traços (sublinhado, fração)
        area = (bx[2] - bx[0]) * (bx[3] - bx[1])
        inner = [r for r in plines
                 if bx[0] - 2 <= (r["bbox"][0] + r["bbox"][2]) / 2 <= bx[2] + 2
                 and bx[1] - 2 <= (r["bbox"][1] + r["bbox"][3]) / 2 <= bx[3] + 2]
        text_area = sum((r["bbox"][2] - r["bbox"][0]) * (r["bbox"][3] - r["bbox"][1]) for r in inner)
        n_long = sum(1 for r in inner if long_line(r["text"]))
        if text_area / area > 0.35 and n_long >= 3:
            continue
        if bx[2] - bx[0] < 250 and text_area / area > 0.25:
            continue  # bloco de fórmula com traços de fração
        final.append(bx)
    return final


def prose(t):
    """Linha de texto corrido (não título em caixa alta, não legenda)."""
    letters = [c for c in t if c.isalpha()]
    upper = sum(c.isupper() for c in letters) / max(1, len(letters))
    return long_line(t) and upper < 0.7 and not CAPTION_RE.match(t)


def is_margin(r, W, H):
    """Cabeçalho (DNER-ME xxx, p. xx/xx), tarja lateral e carimbo de canto."""
    x0, y0, x1, y1 = r["bbox"]
    t = r["text"]
    if y1 < 62 or (y0 < 95 and re.search(r"DNER.{0,3}ME|^p\.?\s*\d+\s*/\s*\d+", t)):
        return True
    if x1 < 75 or "citado o DNER" in t:
        return True
    return y0 > H * 0.85 and x0 > W * 0.6 and len(t) < 30


def sheet_regions(page, plines, boxes):
    """Folha de anexo (formulário, tabela, página só de figuras): sem texto
    corrido fora das figuras -> uma imagem só com todo o conteúdo da folha.
    Só separa quando há mais de uma legenda "Figura N" (corta logo abaixo de
    cada legenda que não é a última)."""
    if not boxes:
        return None
    W, H = page.rect.width, page.rect.height

    def in_boxes(r):
        cx, cy = (r["bbox"][0] + r["bbox"][2]) / 2, (r["bbox"][1] + r["bbox"][3]) / 2
        return any(b[0] - 3 <= cx <= b[2] + 3 and b[1] - 3 <= cy <= b[3] + 3 for b in boxes)
    content = [r for r in plines if not is_margin(r, W, H)]
    # texto corrido de verdade ocupa a largura da mancha; legenda de símbolos
    # ("V = Potencial no Eletrodo M") ao lado da figura é estreita
    if any(prose(r["text"]) and not in_boxes(r) and r["bbox"][2] - r["bbox"][0] > 0.55 * W
           for r in content):
        return None
    caps = sorted((r for r in content if CAPTION_RE.match(r["text"])), key=lambda r: r["bbox"][1])
    cuts = [c["bbox"][3] + 2 for c in caps[:-1]]
    items = [b for b in boxes] + [r["bbox"] for r in content]
    out = []
    edges = [-1] + cuts + [H + 1]
    for y0, y1 in zip(edges, edges[1:]):
        band = [b for b in items if y0 <= (b[1] + b[3]) / 2 < y1]
        if not any(y0 <= (b[1] + b[3]) / 2 < y1 for b in boxes):
            continue  # faixa só de texto (título da folha): vai junto da vizinha
        box = band[0]
        for b in band[1:]:
            box = nd._union(box, b)
        out.append(box)
    # texto que ficou fora de toda faixa com figura (título do anexo no topo):
    # entra na primeira faixa
    if out:
        for r in content:
            cy = (r["bbox"][1] + r["bbox"][3]) / 2
            if not any(b[1] - 2 <= cy <= b[3] + 2 for b in out) and cy < out[0][1]:
                out[0] = nd._union(out[0], r["bbox"])
    return out


def detect(pdf_path):
    """Lista de figuras: page, bbox, legenda e âncoras de texto (depois/antes)."""
    doc = pymupdf.open(pdf_path)
    lines = []
    for page in doc:
        lines += [dict(r, text=clean(r["text"])) for r in nd.page_lines(page, 9.0)]
    figs = []
    for page in doc:
        if page.number == 0:
            continue  # capa: resumo, sumário, descritores
        pno = page.number
        plines = [r for r in lines if r["page"] == pno]
        boxes = page_figures(page, plines)
        sheet = sheet_regions(page, plines, boxes)
        for box in sheet or boxes:
            def overlap_x(r):
                return min(r["bbox"][2], box[2]) - max(r["bbox"][0], box[0]) > 0
            caps = [k for k, r in enumerate(lines) if r["page"] == pno and CAPTION_RE.match(r["text"])]
            cap_below = [k for k in caps if -6 <= lines[k]["bbox"][1] - box[3] <= 45 and overlap_x(lines[k])]
            cap_above = [k for k in caps if -6 <= box[1] - lines[k]["bbox"][3] <= 30 and overlap_x(lines[k])]
            if sheet:
                # na folha, a legenda fica dentro da imagem: o embed vai antes dela no md
                cap_below = [k for k in caps if box[1] <= lines[k]["bbox"][1] <= box[3]][:1] or cap_below
            cap = cap_below[0] if cap_below else (cap_above[-1] if cap_above else None)
            if cap is None and box[2] - box[0] < 200 and box[3] - box[1] < 150:
                continue  # pequena e sem legenda: fórmula com fração, não figura

            def inside(r):
                cy = (r["bbox"][1] + r["bbox"][3]) / 2
                cx = (r["bbox"][0] + r["bbox"][2]) / 2
                return r["page"] == pno and box[1] - 2 <= cy <= box[3] + 2 and box[0] - 2 <= cx <= box[2] + 2
            after = [i for i, r in enumerate(lines)
                     if ((r["page"] == pno and r["bbox"][1] >= box[3] - 2) or r["page"] > pno)
                     and long_line(r["text"]) and not inside(r)]
            before = [i for i, r in enumerate(lines)
                      if ((r["page"] == pno and r["bbox"][3] <= box[1] + 2) or r["page"] < pno)
                      and long_line(r["text"]) and not inside(r)]
            depois = ([lines[cap]["text"]] if cap in cap_below else []) + [lines[i]["text"] for i in after[:6]]
            antes = ([lines[cap]["text"]] if cap in cap_above else []) + [lines[i]["text"] for i in before[::-1][:6]]
            # rótulos (cotas, "CORTE", nomes de peças) e carimbo da folha: o OCR os
            # jogou no md como texto solto; a imagem já os mostra
            W, H = page.rect.width, page.rect.height
            rotulos = [r["text"] for r in plines
                       if (inside(r) and not CAPTION_RE.match(r["text"]))
                       or (is_margin(r, W, H) and r["bbox"][1] > H * 0.85)]
            figs.append({"page": pno, "bbox": box,
                         "legenda": lines[cap]["text"] if cap is not None else "",
                         "depois": depois, "antes": antes, "rotulos": rotulos})
    figs.sort(key=lambda f: (f["page"], f["bbox"][1], f["bbox"][0]))
    return doc, figs


def find_anchor(body, norm, pos, text, cursor, legenda):
    """Posição (no texto normalizado) da linha do PDF, a partir de cursor."""
    a = norm_alnum(text)
    if legenda and text == legenda:
        # legenda: só vale no começo de uma linha do md ("conforme Figura 1" não).
        # O número pode ter sido lido errado pelo OCR ("FIGURA |"), então compara
        # o que vem depois de "Figura N"
        rest = re.sub(r"^(figura|fig|grafico|foto)\d*", "", a)
        needle = rest[:25] if len(rest) >= 6 else a[:30]
        j = cursor
        while (j := norm.find(needle, j)) != -1:
            line_start = body.rfind("\n", 0, pos[j]) + 1
            if re.fullmatch(r"((figura|fig|grafico|foto)\d*)?", norm_alnum(body[line_start:pos[j]])):
                return j
            j += 1
        return None
    if len(a) < 15:
        return None
    for needle in (a[:40], a[:22], a[-22:]):
        j = norm.find(needle, cursor)
        if j != -1:
            return j
    return None


def insert_embeds(body, figs, stem):
    """Embed antes do parágrafo do texto que vem depois da figura no PDF; senão,
    depois do parágrafo do texto que vem antes; senão, junto da figura anterior."""
    # figura "manual": o embed foi posto à mão no md (anexo reescrito) e fica onde está
    fixed = {f"![[{stem}_{fig_id}.png]]" for fig_id, f in figs if f.get("manual")}
    body = EMBED_RE.sub(lambda m: m.group(0) if m.group(0).strip() in fixed else "\n\n", body)
    body = join_split_captions(body)
    norm, pos = build_index(body)
    inserts, cursor, last_at, missing = [], 0, None, []
    for n, (fig_id, f) in enumerate(figs):
        if f.get("manual"):
            if f"![[{stem}_{fig_id}.png]]" not in body:
                missing.append(fig_id)
            continue
        at = None
        if f.get("inserir_antes") and f["inserir_antes"] in body:
            # âncora manual (data/figuras): texto exato do md
            at = body.index(f["inserir_antes"])
            j = next((k for k, q in enumerate(pos) if q >= at), len(norm))
            cursor = max(cursor, j)
        for t in ([] if at is not None else f["depois"]):
            j = find_anchor(body, norm, pos, t, cursor, f["legenda"])
            if j is not None:
                p = body.rfind("\n\n", 0, pos[j])
                at, cursor = (p + 2 if p != -1 else 0), j
                break
        if at is None:
            for t in f["antes"]:
                j = find_anchor(body, norm, pos, t, max(0, cursor - 3000), f["legenda"])
                if j is not None:
                    p = body.find("\n\n", pos[j])
                    at = p + 2 if p != -1 else len(body)
                    cursor = max(cursor, j)
                    break
        if at is None:
            missing.append(fig_id)
            at = last_at if last_at is not None else len(body)
        if last_at is not None and at < last_at:
            at = last_at  # mantém a ordem das figuras
        last_at = at
        inserts.append((at, n, f"![[{stem}_{fig_id}.png]]\n\n"))
    for at, _, text in sorted(inserts, reverse=True):
        body = body[:at] + text + body[at:]
    if not body.endswith("\n"):
        body += "\n"
    return re.sub(r"\n{3,}", "\n\n", body), missing


KEEP_RE = re.compile(
    r"^(#+\s*)?(\*\*)?\d+(\.\d+)*(\*\*)?\s+[A-ZÁÉÍÓÚÂÊÔÃÕÇ][A-ZÁÉÍÓÚÂÊÔÃÕÇ ]{3,}"  # título de seção
    r"|^\*\*\d+(\.\d+)*\*\*"                                                      # item 4.1
    r"|^[a-z]\)\s"                                                                # alínea "b) peso;"
    r"|^#*\s*ANEXO|^\$\$|^!\[\["
    r"|^#*\s*(FIGURA|Figura|TABELA|Tabela|QUADRO|Quadro)\b")                       # legenda / título
ANEXO_MARK_RE = re.compile(r"^.{0,6}/\s*Anexos?(\s+normativos?)?\.?$", re.I)
WARN_RE = re.compile(r"^> \[!warning\][^\n]*\n?")


def words(t):
    return [w for w in (norm_alnum(x) for x in re.findall(r"\w+", t)) if len(w) >= 2]


def join_split_captions(body):
    """Legenda partida pelo OCR ("FIGURA" + "- MOLDE CILÍNDRICO..."): junta."""
    paras = body.split("\n\n")
    for i in range(len(paras) - 1, 0, -1):
        if re.fullmatch(r"(FIGURA|Figura)(\s+\d+)?", paras[i - 1].strip()) and paras[i].lstrip().startswith("-"):
            paras[i - 1] = paras[i - 1].strip() + " " + paras[i].strip()
            del paras[i]
    return "\n\n".join(paras)


def remove_labels(body, figs, stem, protected=frozenset()):
    """Tira do md os parágrafos formados só pelos rótulos da figura (cotas,
    'CORTE', 'VISTA SUPERIOR', carimbo), perto do embed dela. Parágrafos em
    `protected` (escritos à mão em data/formulas) nunca saem."""
    paras = body.split("\n\n")
    drop, removed = set(), {}
    for fig_id, f in figs:
        emb = f"![[{stem}_{fig_id}.png]]"
        idx = [i for i, p in enumerate(paras) if p.strip() == emb]
        if not idx or f.get("manual") or f.get("clip"):
            continue  # trecho escrito à mão ou recorte manual (a caixa detectada não vale): não mexe
        bag = set(w for t in f.get("rotulos", []) for w in words(t))
        e = idx[0]
        for i in range(max(0, e - 12), min(len(paras), e + 13)):
            p = paras[i].strip()
            if not p or i in drop or p in protected:
                continue
            plain = re.sub(r"[#*>`]", " ", WARN_RE.sub("", p)).strip()
            if CAPTION_RE.match(plain) or KEEP_RE.match(p):
                continue
            ws = words(plain)
            if len(ws) >= 25:
                continue  # texto corrido
            if (len(re.findall(r"\w+", plain)) >= 8 and re.match(r"^[A-ZÀ-Ú]", plain)
                    and re.search(r"[.:;]$", plain) and "|" not in plain):
                continue  # frase (texto corrido curto), não rótulo — mesmo que as palavras estejam na figura
            junk = (not ws and len(plain) <= 10) or (ws and sum(w in bag for w in ws) / len(ws) >= 0.9)
            if junk:
                drop.add(i)
                removed.setdefault(fig_id, []).append(p)
    for i, p in enumerate(paras):
        if ANEXO_MARK_RE.match(p.strip()):
            drop.add(i)  # marca de fim de página "/Anexo"
    body = "\n\n".join(p for i, p in enumerate(paras) if i not in drop)
    return re.sub(r"\n{3,}", "\n\n", body), removed


def process(md_path, entry):
    stem = md_path.stem
    doc, figs = detect(ROOT / entry["pdf"])
    # tabelas já transcritas por tabelas_dner.py (tabela markdown + imagem): não repete como figura
    tab_path = ROOT / "data" / "tabelas" / f"{stem}.json"
    if tab_path.exists():
        tabs = [(t["page"] - 1, t.get("clip") or t["bbox"]) for t in json.loads(tab_path.read_text(encoding="utf-8")).values()
                if not t.get("ignorar")]

        def inside_table(f):
            b = f["bbox"]
            area = max(1.0, (b[2] - b[0]) * (b[3] - b[1]))
            for p, t in tabs:
                if p == f["page"]:
                    w = min(b[2], t[2]) - max(b[0], t[0])
                    h = min(b[3], t[3]) - max(b[1], t[1])
                    if w > 0 and h > 0 and w * h / area > 0.5:
                        return True
            return False
        figs = [f for f in figs if not inside_table(f)]
    store_path = FIG_DIR / f"{stem}.json"
    store = json.loads(store_path.read_text(encoding="utf-8")) if store_path.exists() else {}

    new_store, keep = {}, []
    for n, f in enumerate(figs, 1):
        fig_id = f"fig{n:02d}"
        old = store.get(fig_id, {})
        entry_fig = {"page": f["page"] + 1, "bbox": [round(v, 1) for v in f["bbox"]],
                     "legenda": f["legenda"], "ancora": ((f["depois"] or f["antes"] or [""])[0])[:80]}
        for extra in ("clip", "ignorar", "nota", "inserir_antes", "manual"):
            if extra in old:
                entry_fig[extra] = old[extra]
                if extra in ("inserir_antes", "manual", "clip"):
                    f[extra] = old[extra]
        new_store[fig_id] = entry_fig
        if old.get("ignorar"):
            continue
        clip = old.get("clip") or [f["bbox"][0] - 4, f["bbox"][1] - 4, f["bbox"][2] + 4, f["bbox"][3] + 4]
        page = doc[f["page"]]
        FIG_IMG.mkdir(parents=True, exist_ok=True)
        page.get_pixmap(clip=pymupdf.Rect(clip) & page.rect, dpi=150).save(str(FIG_IMG / f"{stem}_{fig_id}.png"))
        keep.append((fig_id, f))

    # trechos reescritos à mão em data/formulas (fórmula + legenda, anexo refeito):
    # figura cujo embed está num deles fica onde foi posta, e nenhum parágrafo
    # deles é tirado como rótulo
    form_path = ROOT / "data" / "formulas" / f"{stem}.json"
    written = [v.get("para", "") for v in json.loads(form_path.read_text(encoding="utf-8")).values()] \
        if form_path.exists() else []
    protected = {q.strip() for w in written for q in w.split("\n\n") if q.strip()}
    for fig_id, f in keep:
        if any(f"![[{stem}_{fig_id}.png]]" in w for w in written):
            f["manual"] = True

    raw = md_path.read_text(encoding="utf-8")
    end = raw.find("\n---\n", 4) + 5
    front, body = raw[:end], raw[end:]
    new_body, missing = insert_embeds(body, keep, stem)
    removed = {}
    while True:  # tirar um rótulo aproxima outros do embed: repete até estabilizar
        new_body, rem = remove_labels(new_body, keep, stem, protected)
        if not rem:
            break
        for k, v in rem.items():
            removed.setdefault(k, []).extend(v)
    for fig_id, paras in removed.items():
        # registro do que saiu do md (conferência); acumula entre execuções
        prev = store.get(fig_id, {}).get("texto_removido", [])
        new_store[fig_id]["texto_removido"] = prev + paras
    for fig_id in new_store:
        if fig_id not in removed and store.get(fig_id, {}).get("texto_removido"):
            new_store[fig_id]["texto_removido"] = store[fig_id]["texto_removido"]
    if front + new_body != raw:
        md_path.write_text(front + new_body, encoding="utf-8")
    if new_store or store_path.exists():
        FIG_DIR.mkdir(parents=True, exist_ok=True)
        store_path.write_text(json.dumps(new_store, ensure_ascii=False, indent=2), encoding="utf-8")
    return len(keep), missing, sum(len(v) for v in removed.values())


def main():
    files = [Path(a).resolve() for a in sys.argv[1:]] or (sorted(ME_DIR.glob("dner_me_*.md"))
             + sorted((ME_DIR.parent / "especificacao-de-servico-es").glob("dner_es_*.md"))
             + sorted((ME_DIR.parent / "especificacao-de-material-em").glob("dner_em_*.md"))
             + sorted((ME_DIR.parent / "procedimento-pro").glob("dner[-_]pro*.md"))
             + [p for d in ("terminologia-ter", "instrucao-de-ensaio-ie", "padronizacao-pad", "classificacao-cla")
                for p in sorted((ME_DIR.parent / d).glob("dner_*.md"))])
    entries = {e["md"]: e for e in json.loads(NORMAS_JSON.read_text(encoding="utf-8"))}
    for f in files:
        entry = entries.get(f.relative_to(ROOT).as_posix())
        if not entry:
            print(f"PULADO {f.name}")
            continue
        n, missing, n_rem = process(f, entry)
        print(f"{f.name}: {n} figuras" + (f", {n_rem} parágrafos de rótulo removidos" if n_rem else "")
              + (f"  (sem âncora, no fim: {', '.join(missing)})" if missing else ""))


if __name__ == "__main__":
    main()
