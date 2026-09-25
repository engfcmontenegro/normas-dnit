"""
Dependências entre métodos de ensaio (ME) e normas que faltam no acervo.

Para cada ME, varre o texto do markdown atrás de outros ME citados (referências
normativas e corpo) e resolve cada código contra o acervo:
  - "acervo":        a norma citada está no acervo (mesma edição);
  - "substituida":   não está, mas uma norma do acervo declara que "cancela e
                     substitui" o código citado (sucessora oficial);
  - "outra_edicao":  não está nessa edição, mas outra edição do mesmo número está;
  - "faltante":      não há nada no acervo.
As frases de "cancela e substitui" (prefácio) não contam como dependência.

Gera:
  data/dependencias.json            -> {me_id: {"depende": [...], "usado_por": [...]}, "_faltantes": [...]}
  site/data/dependencias_data.js    -> window.DEPENDENCIAS = {...}
  site/normas_faltantes.html        -> lista das normas citadas que não estão no acervo

Uso: python scripts/dependencias.py
"""
import html
import json
import re
from collections import defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
TIPOS = "PRO|ES|ME|EM|TER|CLA|IE|PAD"
DNER_RE = re.compile(
    rf"DNER\s*[-–]?\s*({TIPOS})\s*[-–]?\s*(?:n[º°o]\.?\s*)?(\d{{2,3}})\s*[/-]\s*(\d{{2,4}})\b", re.I)
DNIT_RE = re.compile(
    rf"DNIT\s*(?:n[º°o]\.?\s*)?(\d{{2,3}})(?:\s*/\s*(\d{{4}}))?\s*[-–]\s*({TIPOS})\b", re.I)
SUBST_RE = re.compile(r"cancela\w*\s+e\s+substitu|substitui\w*\s+(a|as|o|os)\s+(norma|vers)", re.I)
TITULO_RE = re.compile(r"^\s*(?:\\?\|[^\]]*)?(?:\]\])?\s*[-–:]\s*(.+?)\s*[;.]?\s*$")


def ano4(yy):
    return yy if len(yy) == 4 else str(1900 + int(yy) if int(yy) >= 50 else 2000 + int(yy))


def front(text):
    if text.startswith("---"):
        end = text.find("\n---", 3)
        if end != -1:
            return text[end + 4:]
    return text


def codigos(texto):
    """(chave, rótulo, fim do match) de cada código DNER/DNIT citado no texto."""
    out = []
    for m in DNER_RE.finditer(texto):
        tipo, num, ano = m.group(1).upper(), int(m.group(2)), ano4(m.group(3))
        out.append((("DNER", tipo, num, ano), f"DNER-{tipo} {num:03d}/{ano[-2:]}", m.end()))
    for m in DNIT_RE.finditer(texto):
        num, ano, tipo = int(m.group(1)), m.group(2), m.group(3).upper()
        out.append((("DNIT", tipo, num, ano), f"DNIT {num:03d}/{ano}-{tipo}" if ano else f"DNIT {num:03d}-{tipo}", m.end()))
    return out


def cancelamentos():
    """data/canceladas.json indexado por (órgão, tipo, número) -> lista de cancelamentos."""
    p = ROOT / "data/canceladas.json"
    out = defaultdict(list)
    for c in (json.loads(p.read_text(encoding="utf-8")) if p.exists() else []):
        org, tipo, num, ano = c["_chave"]
        out[(org, tipo, num)].append(c)
    return out


def cancelada(canc, chave):
    """Cancelamento que corresponde ao código citado (mesmo ano, ou qualquer ano se a citação não traz ano)."""
    org, tipo, num, ano = chave
    for c in canc.get((org, tipo, num), []):
        if not ano or c["_chave"][3] == ano:
            return c
    return None


def main():
    entries = json.loads((ROOT / "data/normas.json").read_text(encoding="utf-8"))
    by_id = {e["id"]: e for e in entries}
    # índice do acervo: (órgão, tipo, número) -> {ano: id}
    idx = defaultdict(dict)
    for e in entries:
        m = re.search(r"(\d{2,3})/(\d{2,4})", e["codigo"])
        if m:
            idx[(e["orgao"], e["tipo"], int(m.group(1)))][ano4(m.group(2))] = e["id"]

    textos = {e["id"]: front((ROOT / e["md"]).read_text(encoding="utf-8")) for e in entries if (ROOT / e["md"]).exists()}

    # sucessoras oficiais: frases "cancela e substitui ..." em qualquer norma do acervo
    sucessora = {}
    for nid, t in textos.items():
        for frase in re.split(r"(?<=[.;])\s+|\n", t):
            if SUBST_RE.search(frase):
                for chave, _, _ in codigos(frase):
                    if chave[:3] != (by_id[nid]["orgao"], by_id[nid]["tipo"], None) and idx[chave[:3]].get(chave[3]) != nid:
                        sucessora.setdefault(chave, nid)

    canc = cancelamentos()

    def resolve(chave):
        org, tipo, num, ano = chave
        edicoes = idx.get((org, tipo, num), {})
        if ano and ano in edicoes:
            return "acervo", edicoes[ano]
        if not ano and edicoes:
            return "acervo", edicoes[max(edicoes)]
        c = cancelada(canc, chave)
        if c:
            return "cancelada", (c["sucessoras"] or [sucessora.get(chave)])[0]
        if chave in sucessora:
            return "substituida", sucessora[chave]
        if edicoes:
            return "outra_edicao", edicoes[max(edicoes)]
        return "faltante", None

    # títulos das normas citadas, tirados das listas de referências de qualquer norma do acervo
    titulos = defaultdict(list)   # rótulo -> títulos vistos
    for t in textos.values():
        for linha in t.split("\n"):
            if SUBST_RE.search(linha):
                continue
            for chave, rot, fim in codigos(linha):
                m = TITULO_RE.match(linha[fim:])
                if m and 8 < len(m.group(1)) < 160 and not (DNER_RE.search(m.group(1)) or DNIT_RE.search(m.group(1))):
                    tit = re.sub(r"\[\[[^\]|]*\\?\|([^\]]*)\]\]", r"\1", m.group(1))
                    # sem o rabo bibliográfico ("Rio de Janeiro: IPR, 1994", "- Método de ensaio.")
                    tit = re.split(r"\.?\s*(?:Rio de Janeiro|Bras[ií]lia)\b", tit)[0]
                    tit = re.sub(r"\s*[-–.]?\s*M[ée]todo de ensaio\.?$", "", tit, flags=re.I).strip(" .;-–")
                    if len(tit) > 8:
                        titulos[rot].append(tit)

    deps = {}
    citantes = defaultdict(set)   # rótulo faltante -> ids que o citam
    for e in entries:
        if e["tipo"] != "ME" or e["id"] not in textos:
            continue
        vistos = {}
        for linha in textos[e["id"]].split("\n"):
            if SUBST_RE.search(linha):
                continue
            for chave, rot, fim in codigos(linha):
                if chave[1] != "ME":
                    continue
                via, alvo = resolve(chave)
                if alvo == e["id"] or rot in vistos:
                    continue
                vistos[rot] = {"codigo": rot, "via": via, "id": alvo, "_chave": chave}
        deps[e["id"]] = {"depende": sorted(vistos.values(), key=lambda d: d["codigo"]), "usado_por": []}
        for d in vistos.values():
            if d["via"] in ("faltante", "outra_edicao", "cancelada"):
                citantes[d["codigo"]].add(e["id"])

    for nid, d in deps.items():
        for dep in d["depende"]:
            if dep["id"] and dep["id"] in deps and dep["via"] != "faltante":
                deps[dep["id"]]["usado_por"].append(nid)
            t = titulos.get(dep["codigo"])
            if t and dep["via"] != "acervo":
                dep["titulo"] = max(set(t), key=t.count)
            if dep["via"] == "cancelada":
                c = cancelada(canc, dep["_chave"])
                dep["cancelada"] = c["data"]
                dep["titulo"] = c["titulo"] or dep.get("titulo")
            dep.pop("_chave", None)
    for d in deps.values():
        d["usado_por"] = sorted(set(d["usado_por"]))

    # normas citadas nos planos de controle de serviço que não estão no acervo (sem sucessora)
    controle = defaultdict(set)
    for p in (ROOT / "data/controle").glob("*.json"):
        plano = json.loads(p.read_text(encoding="utf-8"))
        for it in plano["itens"]:
            if it.get("norma") or not it.get("citado"):
                continue
            for chave, rot, _ in codigos(it["citado"]):
                via, alvo = resolve(chave)
                if via != "acervo":
                    controle[rot].add(plano["es"])
                    citantes.setdefault(rot, set())

    faltantes = []
    for rot in sorted(citantes, key=lambda r: (r.split()[0], r)):
        m = re.match(r"(DNER|DNIT)[- ](?:(\w+) )?(\d{3})(?:/(\d{2,4}))?(?:-(\w+))?", rot)
        org, tipo = m.group(1), m.group(2) or m.group(5)
        chave = (org, tipo, int(m.group(3)), ano4(m.group(4)) if m.group(4) else None)
        via, alvo = resolve(chave)
        if via == "acervo":
            continue
        t = titulos.get(rot)
        c = cancelada(canc, chave) if via == "cancelada" else None
        faltantes.append({"codigo": rot, "tipo": tipo, "via": via, "alternativa": alvo,
                          "titulo": (c or {}).get("titulo") or (max(set(t), key=t.count) if t else ""),
                          "cancelada": {k: c[k] for k in ("data", "motivo", "pdf")} if c else None,
                          "citada_por_me": sorted(citantes[rot]), "citada_em_controle": sorted(controle.get(rot, ()))})

    out = dict(deps)
    out["_faltantes"] = faltantes
    (ROOT / "data/dependencias.json").write_text(json.dumps(out, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
    (ROOT / "site/data/dependencias_data.js").write_text(
        "window.DEPENDENCIAS = " + json.dumps(out, ensure_ascii=False) + ";\n", encoding="utf-8")
    pagina(faltantes, by_id)

    n_dep = sum(len(d["depende"]) for d in deps.values())
    por_via = defaultdict(int)
    for d in deps.values():
        for x in d["depende"]:
            por_via[x["via"]] += 1
    print(f"ME: {len(deps)}  dependências: {n_dep}  {dict(por_via)}")
    print(f"Normas citadas fora do acervo: {len(faltantes)} "
          f"({sum(1 for f in faltantes if f['via'] == 'faltante')} sem nada no acervo)")


def pagina(faltantes, by_id):
    def links(ids):
        return " ".join(f'<a href="index.html#norma:{html.escape(i)}" target="_blank">{html.escape(by_id[i]["codigo"])}</a>'
                        for i in ids)

    def ctl_links(ids):
        return " ".join(f'<a href="index.html#controle:{html.escape(i)}" target="_blank">{html.escape(by_id[i]["codigo"])}</a>'
                        for i in ids)

    SIT = {"cancelada": ("canc", "Cancelada pelo DNIT"),
           "faltante": ("falta", "Não há nada no acervo"),
           "substituida": ("subst", "Substituída por norma do acervo"),
           "outra_edicao": ("edicao", "Acervo tem outra edição")}
    linhas = []
    for f in sorted(faltantes, key=lambda f: (-(len(f["citada_por_me"]) + len(f["citada_em_controle"])), f["codigo"])):
        cls, rot = SIT[f["via"]]
        alt = ""
        if f.get("cancelada"):
            c = f["cancelada"]
            alt += f'<div class="alt canc">Cancelada em {html.escape(c["data"])} — {html.escape(c["motivo"])}' + \
                   (f' <a href="{html.escape(c["pdf"])}" target="_blank">PDF com tarja</a>' if c["pdf"] else "") + "</div>"
        if f["alternativa"]:
            a = by_id[f["alternativa"]]
            alt = f'<div class="alt">{"edição no acervo" if f["via"] == "outra_edicao" else "sucessora"}: ' \
                  f'<a href="index.html#norma:{html.escape(a["id"])}" target="_blank">{html.escape(a["codigo"])}</a> — {html.escape(a["titulo"])}</div>'
        n = len(f["citada_por_me"]) + len(f["citada_em_controle"])
        linhas.append(
            f'<tr data-sit="{cls}" data-tipo="{f["tipo"]}"><td class="cod">{html.escape(f["codigo"])}</td>'
            f'<td>{html.escape(f["titulo"]) or "<span class=dim>—</span>"}{alt}</td>'
            f'<td><span class="sit {cls}">{rot}</span></td><td class="n">{n}</td>'
            f'<td>{links(f["citada_por_me"])}</td><td>{ctl_links(f["citada_em_controle"])}</td></tr>')
    n_falta = sum(1 for f in faltantes if f["via"] == "faltante")
    page = f"""<!doctype html><html lang="pt-BR"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1"><title>Normas faltantes</title><style>
:root{{--bg:#0f1115;--panel:#171a21;--panel-2:#1e222b;--border:#2a2f3a;--text:#e6e8ec;--dim:#9aa3b2;--accent:#4f8cff}}
@media (prefers-color-scheme: light){{:root{{--bg:#f6f7f9;--panel:#fff;--panel-2:#eef0f4;--border:#d9dde5;--text:#1b1f27;--dim:#5b6475;--accent:#2f6fe0}}}}
*{{box-sizing:border-box}}body{{margin:0;background:var(--bg);color:var(--text);font:14px/1.5 -apple-system,Segoe UI,Roboto,Arial,sans-serif}}
header{{position:sticky;top:0;z-index:2;background:var(--panel);border-bottom:1px solid var(--border);padding:12px 20px}}
h1{{font-size:17px;margin:0 0 4px}}.sub{{color:var(--dim);font-size:12.5px;max-width:1100px}}
.bar{{display:flex;flex-wrap:wrap;gap:8px;margin-top:10px;align-items:center}}
.bar input{{flex:1 1 240px;min-width:0;padding:7px 10px;border-radius:6px;border:1px solid var(--border);background:var(--panel-2);color:var(--text)}}
.chip{{border:1px solid var(--border);background:var(--panel-2);color:var(--dim);border-radius:999px;padding:4px 11px;font-size:12px;cursor:pointer;user-select:none}}
.chip.on{{background:var(--accent);border-color:var(--accent);color:#fff}}
main{{padding:12px 20px 60px;overflow-x:auto}}table{{border-collapse:collapse;width:100%;min-width:900px}}
th{{text-align:left;font-size:11px;text-transform:uppercase;letter-spacing:.04em;color:var(--dim);padding:6px 8px;border-bottom:1px solid var(--border)}}
td{{padding:7px 8px;border-bottom:1px solid var(--border);vertical-align:top;font-size:13px}}
td.cod{{font-weight:600;white-space:nowrap}}td.n{{text-align:center;color:var(--dim)}}a{{color:var(--accent);text-decoration:none;white-space:nowrap}}
.alt{{font-size:12px;color:var(--dim);margin-top:3px}}.dim{{color:var(--dim)}}
.sit{{font-size:11px;font-weight:600;border-radius:4px;padding:1px 7px;color:#fff;white-space:nowrap}}
.sit.falta{{background:#e5534b}}.sit.canc{{background:#8b1e1e}}.alt.canc{{color:#e5534b}}.sit.subst{{background:#34c38f}}.sit.edicao{{background:#e0a13a}}
@media (max-width:600px){{header,main{{padding-left:16px;padding-right:16px}}}}
</style></head><body><header><h1>Normas citadas que não estão no acervo</h1>
<div class="sub">{len(faltantes)} códigos citados por métodos de ensaio (dependências) ou pelos planos de controle de serviço:
{sum(1 for f in faltantes if f["via"] == "cancelada")} canceladas pelo DNIT, {n_falta} sem nada no acervo, {sum(1 for f in faltantes if f["via"] == "substituida")} substituídos oficialmente por norma do acervo
("cancela e substitui") e {sum(1 for f in faltantes if f["via"] == "outra_edicao")} com outra edição no acervo. Ordenado pelo número de citações.
Títulos tirados das listas de referências das próprias normas.</div>
<div class="bar"><input id="q" type="search" placeholder="Filtrar por código, título, norma que cita...">
<span class="chip on" data-sit="canc">Cancelada</span><span class="chip on" data-sit="falta">Não há no acervo</span><span class="chip on" data-sit="edicao">Outra edição</span>
<span class="chip on" data-sit="subst">Substituída</span>
<span class="chip on" data-tipo="ME">ME</span><span class="chip on" data-tipo="outros">EM/ES/PRO…</span></div></header>
<main><table><thead><tr><th>Código</th><th>Título</th><th>Situação</th><th>Citações</th><th>Citada por ME</th><th>Citada no controle de serviços</th></tr></thead>
<tbody>{"".join(linhas)}</tbody></table></main>
<script>(function(){{var on={{canc:1,falta:1,edicao:1,subst:1,ME:1,outros:1}},q=document.getElementById('q');
function apply(){{var t=q.value.toLowerCase();document.querySelectorAll('tbody tr').forEach(function(r){{
var tp=r.dataset.tipo==='ME'?'ME':'outros';r.style.display=on[r.dataset.sit]&&on[tp]&&(!t||r.textContent.toLowerCase().indexOf(t)>=0)?'':'none';}});}}
document.querySelectorAll('.chip').forEach(function(c){{c.addEventListener('click',function(){{var k=c.dataset.sit||c.dataset.tipo;on[k]=!on[k];c.classList.toggle('on');apply();}});}});
q.addEventListener('input',apply);}})();</script></body></html>"""
    (ROOT / "site/normas_faltantes.html").write_text(page, encoding="utf-8")


if __name__ == "__main__":
    main()
