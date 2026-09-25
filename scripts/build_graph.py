"""
Varre os .md gerados procurando menções a códigos de outras normas
(DNER-XXX 000/00, DNIT 000/0000-XX etc.), monta:
  - data/graph.json (nós + arestas de citação + posições pré-calculadas do layout)
  - insere wikilinks do Obsidian ([[arquivo|DNER-ME 000/00]]) no corpo dos .md
    apontando para a norma citada (o front-matter não é alterado)

Idempotente: qualquer link já inserido numa execução anterior é desfeito antes
de procurar novas citações, para que rodar o script várias vezes não aninhe
links um dentro do outro.
"""
import json
import re
from pathlib import Path

import networkx as nx

ROOT = Path(__file__).resolve().parent.parent
NORMAS_JSON = ROOT / "data" / "normas.json"
GRAPH_JSON = ROOT / "data" / "graph.json"

EXISTING_LINK_RE = re.compile(r"\[([^\[\]]+)\]\([^()]+\.md\)")
EXISTING_WIKILINK_RE = re.compile(r"\[\[([^\[\]|]+)\|([^\[\]]+)\]\]")


def split_front_matter(text):
    if text.startswith("---\n"):
        end = text.find("\n---\n", 4)
        if end != -1:
            return text[: end + 5], text[end + 5:]
    return "", text


def unlink(body, stems):
    """Desfaz links internos de execuções anteriores (markdown ou wikilink com alias)."""
    body = EXISTING_LINK_RE.sub(r"\1", body)
    return EXISTING_WIKILINK_RE.sub(lambda m: m.group(2) if m.group(1) in stems else m.group(0), body)

TIPOS = ["PRO", "ES", "ME", "EM", "TER", "CLA", "IE", "PAD"]
TIPO_RE = "|".join(TIPOS)

# Padrões de citação dentro do corpo das normas (mais tolerantes que o parser de metadados,
# pois o texto das normas usa varias grafias: "DNER-ME 006/00", "DNER ME-006/00",
# "DNER-ME nº 006/00", "DNIT 049/2013 - ES", "DNIT-ES 049/2013", "NORMA DNIT 413/2021 - ME" etc.)
DNER_CITATION_RE = re.compile(
    rf"DNER[\s-]*({TIPO_RE})[\s-]*(?:n[ºo]\.?\s*)?(\d{{2,3}})[\s/-]+(\d{{2,4}})",
    re.IGNORECASE,
)
DNIT_CITATION_RE = re.compile(
    rf"DNIT[\s-]*(?:n[ºo]\.?\s*)?(\d{{2,3}})[\s/-]+(\d{{4}})(?:[\s-]*({TIPO_RE}))?",
    re.IGNORECASE,
)


def norm_year_dner(yy: str) -> str:
    return yy if len(yy) == 4 else str(1900 + int(yy) if int(yy) >= 50 else 2000 + int(yy))


def build_lookup(entries):
    """
    Mapeia chaves normalizadas -> id da norma.
    Para DNER: chave = ("DNER", TIPO, num_sem_zeros, ano_4digitos)
    Para DNIT: chave = ("DNIT", num_sem_zeros, ano_4digitos) e também com tipo quando disponível.
    """
    lookup = {}
    for e in entries:
        codigo = e["codigo"]
        orgao = e["orgao"]
        tipo = e["tipo"]
        ano = e["ano"]
        if orgao == "DNER":
            m = re.search(r"(\d{2,3})/(\d{2,4})", codigo)
            if not m:
                continue
            num = str(int(m.group(1)))
            yy = norm_year_dner(m.group(2))
            lookup[("DNER", tipo, num, yy)] = e["id"]
        elif orgao == "DNIT":
            m = re.search(r"(\d{2,3})/(\d{4})", codigo)
            if not m:
                continue
            num = str(int(m.group(1)))
            yy = m.group(2)
            lookup[("DNIT", num, yy)] = e["id"]
    return lookup


def find_citations(text: str, lookup: dict, self_id: str):
    """Retorna set de ids citados no texto (exceto self_id)."""
    found = set()

    for m in DNER_CITATION_RE.finditer(text):
        tipo = m.group(1).upper()
        num = str(int(m.group(2)))
        yy = norm_year_dner(m.group(3))
        target = lookup.get(("DNER", tipo, num, yy))
        if target and target != self_id:
            found.add((target, m.start(), m.end()))

    for m in DNIT_CITATION_RE.finditer(text):
        num = str(int(m.group(1)))
        yy = m.group(2)
        target = lookup.get(("DNIT", num, yy))
        if target and target != self_id:
            found.add((target, m.start(), m.end()))

    return found


def main():
    entries = json.loads(NORMAS_JSON.read_text(encoding="utf-8"))
    id_to_entry = {e["id"]: e for e in entries}
    lookup = build_lookup(entries)

    nodes = [
        {"id": e["id"], "label": e["codigo"], "titulo": e["titulo"], "tipo": e["tipo"], "orgao": e["orgao"]}
        for e in entries
    ]
    edges_set = set()

    stems = {Path(e["md"]).stem for e in entries}

    for e in entries:
        md_path = ROOT / e["md"]
        if not md_path.exists():
            continue
        original = md_path.read_text(encoding="utf-8")
        # só o corpo: o front-matter (propriedades do Obsidian) não é tocado
        front, body = split_front_matter(original)
        text = unlink(body, stems)

        citations = find_citations(text, lookup, e["id"])

        # ordena por posição decrescente para poder substituir no texto sem invalidar offsets
        citations_sorted = sorted(citations, key=lambda c: c[1], reverse=True)
        new_text = text
        targets_linked = set()
        for target_id, start, end in citations_sorted:
            edges_set.add((e["id"], target_id))
            target_stem = Path(id_to_entry[target_id]["md"]).stem
            original_snippet = new_text[start:end]
            key = (target_id, start)
            if key in targets_linked:
                continue
            targets_linked.add(key)
            replacement = f"[[{target_stem}|{original_snippet}]]"
            new_text = new_text[:start] + replacement + new_text[end:]

        if front + new_text != original:
            md_path.write_text(front + new_text, encoding="utf-8")

    edges = [{"from": a, "to": b} for a, b in sorted(edges_set)]

    # Layout pré-calculado no build (evita depender de simulação de física em
    # tempo real no navegador, que com ~400 nós tende a "explodir" antes de
    # convergir). Cada componente conexo é layoutado separadamente, normalizado
    # para caber numa célula quadrada e distribuído numa grade (em vez de lado
    # a lado, o que resultava numa faixa horizontal muito larga e rasa).
    G = nx.Graph()
    G.add_nodes_from(n["id"] for n in nodes)
    G.add_edges_from((e["from"], e["to"]) for e in edges)

    positions = {}
    components = [c for c in nx.connected_components(G) if len(c) > 1]
    components.sort(key=len, reverse=True)
    isolated = sorted(n for n in G.nodes if G.degree(n) == 0)

    # tamanhos de componente variam MUITO (um componente gigante com dezenas
    # de nós convive com dezenas de pares isolados), então cada "célula" tem
    # tamanho proporcional a sqrt(nº de nós) em vez de tamanho fixo — senão o
    # componente grande fica espremido e ilegível. Empacotamento em prateleiras
    # (shelf packing): preenche uma linha até estourar a largura alvo, quebra.
    BASE = 2.6
    GAP = 2.0
    cells = [("comp", comp) for comp in components] + [("iso", [n]) for n in isolated]
    sizes = [BASE * max(len(m), 1) ** 0.5 for _, m in cells]
    # a largura-alvo precisa acomodar pelo menos a maior célula (senão ela
    # sozinha já "estoura" a linha e tudo mais empilha numa coluna estreitíssima);
    # o fator 2.2 mira um resultado final mais "widescreen" (perto de 4:3~16:9),
    # já que janelas de navegador tipicamente são mais largas que altas
    target_row_width = max(sizes) * 2.2

    cursor_x = 0.0
    cursor_y = 0.0
    row_height = 0.0
    for (kind, members), size in zip(cells, sizes):
        if cursor_x > 0 and cursor_x + size > target_row_width:
            cursor_x = 0.0
            cursor_y += row_height + GAP
            row_height = 0.0
        origin_x, origin_y = cursor_x, cursor_y
        row_height = max(row_height, size)

        if kind == "iso":
            positions[members[0]] = (origin_x + size / 2, origin_y + size / 2)
        else:
            sub = G.subgraph(members)
            layout = nx.spring_layout(sub, seed=42, k=1.8 / (len(members) ** 0.5), iterations=150)
            xs = [p[0] for p in layout.values()]
            ys = [p[1] for p in layout.values()]
            span = max((max(xs) - min(xs)) or 1.0, (max(ys) - min(ys)) or 1.0)
            for node_id, (x, y) in layout.items():
                positions[node_id] = (
                    origin_x + (x - min(xs)) / span * size,
                    origin_y + (y - min(ys)) / span * size,
                )

        cursor_x += size + GAP

    SCALE = 60
    for n in nodes:
        x, y = positions.get(n["id"], (0.0, 0.0))
        n["x"] = round(x * SCALE, 1)
        n["y"] = round(y * SCALE, 1)

    graph = {"nodes": nodes, "edges": edges}
    GRAPH_JSON.write_text(json.dumps(graph, ensure_ascii=False, indent=2), encoding="utf-8")

    connected = {n for edge in edges for n in (edge["from"], edge["to"])}
    print(f"Nós: {len(nodes)}  Arestas: {len(edges)}  Normas com alguma conexão: {len(connected)}")
    print(f"Componentes conexos (>1 nó): {len(components)}  Isolados: {len(isolated)}")


if __name__ == "__main__":
    main()
