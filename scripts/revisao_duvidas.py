"""
Gera site/revisao_duvidas.html: as dúvidas registradas durante a transcrição
(campo "nota" de data/formulas, data/tabelas e data/figuras) que pedem
conferência humana — possíveis erros no próprio PDF e leituras incertas
(trecho ilegível, sinal deduzido pelo contexto). Notas puramente técnicas
("variável de legenda", "título partido", "tarja lateral"...) ficam de fora.

Cada item traz a norma, a página, o recorte (quando existe), o link para o PDF
na página e para a norma no site, e uma caixa "conferido" (guardada no
navegador).

Uso: python scripts/revisao_duvidas.py
"""
import html
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "site" / "revisao_duvidas.html"

ERRO_RE = re.compile(
    r"poss[ií]ve(l|is) erros?|erro (d[oe] |no )?(pdf|digita)|prov[aá]vel(mente)?|\bseria\b|deveria|n[ãa]o existe"
    r"|inconsist|diverg|contradi|aparece (duas|tr[êe]s) vezes|colunas (possivelmente )?trocadas|sem o fator|n[ãa]o fecha|fora da sequ|erro do pdf"
    # estilo usado nas notas: "transcrito como no PDF", "o PDF traz X (a equação traz Y)"
    r"|transcrit[oa]s? como (est[áa]|no pdf|impresso)|mantid[oa]s? como (est[áa]|no pdf)|como est[áa] no pdf"
    r"|no pr[óo]prio pdf|implica[mr]?\b|(a|o) (equa[çc][ãa]o|tabela|texto|legenda|[áa]baco) \S+ traz|embora",
    re.I)
INCERTO_RE = re.compile(
    r"\[\?\]|\[\s*(…|\.\.\.)\s*\]|rasgad|quase ileg|pouco leg|mal leg|desbotad|apagad|dedu[zç]|interpret"
    r"|leitura incerta|incert|conferir|vale conferir|decis[ãa]o minha|sem glifo|caixa vazia|pelo contexto"
    r"|glifo perdido|perdeu os sinais|restaurad[oa]s? conforme|lid[oa]s? pelo contexto|\bli (o|a|como)\b",
    re.I)
LABEL = {"erro": "possível erro no PDF", "incerto": "leitura incerta", "contradicao": "contradição na norma"}
ORIGEM = {"formulas": "fórmulas/texto", "tabelas": "tabela", "figuras": "figura", "duvidas": "relato"}
PAGE_RE = re.compile(r"p(?:ág)?\.\s*(\d{1,3})")


def load_items():
    entries = {Path(e["md"]).stem: e for e in json.loads((ROOT / "data/normas.json").read_text(encoding="utf-8"))}
    items = []
    for kind in ("formulas", "tabelas", "figuras"):
        for f in sorted((ROOT / "data" / kind).glob("*.json")):
            stem = f.stem
            if stem not in entries:
                continue
            for key, v in json.loads(f.read_text(encoding="utf-8")).items():
                nota = v.get("nota") if isinstance(v, dict) else None
                if not nota:
                    continue
                if ERRO_RE.search(nota):
                    cat = "erro"
                elif INCERTO_RE.search(nota):
                    cat = "incerto"
                else:
                    continue
                page = v.get("page")
                if not page:
                    m = PAGE_RE.search(nota)
                    page = int(m.group(1)) if m else None
                img = None
                for d, name in (("_formulas", f"{stem}_{key}.png"), ("_figuras", f"{stem}_{key}.png")):
                    if (ROOT / "markdown" / d / name).exists():
                        img = f"../markdown/{d}/{name}"
                        break
                items.append({"stem": stem, "entry": entries[stem], "kind": kind, "key": key,
                              "nota": nota, "cat": cat, "page": page, "img": img})
    # dúvidas relatadas que não ficaram em nenhuma nota
    extra = ROOT / "data" / "duvidas_extra.json"
    if extra.exists():
        for stem, lst in json.loads(extra.read_text(encoding="utf-8")).items():
            if stem not in entries or not isinstance(lst, list):
                continue
            for n, d in enumerate(lst, 1):
                items.append({"stem": stem, "entry": entries[stem], "kind": "duvidas", "key": f"extra{n:02d}",
                              "nota": d["texto"], "cat": d.get("cat", "erro"), "page": d.get("page"), "img": None})
    return items


CSS = """
:root{--bg:#0f1115;--panel:#171a21;--panel-2:#1e222b;--border:#2a2f3a;--text:#e6e8ec;--dim:#9aa3b2;
--accent:#4f8cff;--erro:#e5534b;--incerto:#e0a13a;--contradicao:#b58cff;--ok:#34c38f}
@media (prefers-color-scheme: light){:root{--bg:#f6f7f9;--panel:#fff;--panel-2:#eef0f4;--border:#d9dde5;
--text:#1b1f27;--dim:#5b6475;--accent:#2f6fe0}}
*{box-sizing:border-box}
body{margin:0;background:var(--bg);color:var(--text);font:14px/1.55 -apple-system,Segoe UI,Roboto,Arial,sans-serif}
header{position:sticky;top:0;z-index:2;background:var(--panel);border-bottom:1px solid var(--border);padding:12px 20px}
h1{font-size:17px;margin:0 0 4px}
.sub{color:var(--dim);font-size:12.5px}
.bar{display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin-top:10px}
.bar input[type=search]{flex:1 1 260px;min-width:0;padding:7px 10px;border-radius:6px;border:1px solid var(--border);
background:var(--panel-2);color:var(--text)}
.chip{border:1px solid var(--border);background:var(--panel-2);color:var(--dim);border-radius:999px;padding:4px 11px;
font-size:12px;cursor:pointer;user-select:none}
.chip.on{background:var(--accent);border-color:var(--accent);color:#fff}
main{max-width:1100px;margin:0 auto;padding:16px 20px 60px}
.norma{background:var(--panel);border:1px solid var(--border);border-radius:10px;margin:14px 0;overflow:hidden}
.norma > h2{font-size:14.5px;margin:0;padding:10px 14px;background:var(--panel-2);display:flex;gap:10px;
flex-wrap:wrap;align-items:baseline}
.norma > h2 .t{color:var(--dim);font-weight:400;font-size:12.5px}
.norma > h2 a{color:var(--accent);font-weight:400;font-size:12.5px;text-decoration:none}
.item{display:grid;grid-template-columns:22px 1fr;gap:10px;padding:10px 14px;border-top:1px solid var(--border)}
.item.done{opacity:.45}
.item input{margin-top:4px}
.meta{display:flex;gap:8px;flex-wrap:wrap;align-items:center;font-size:12px;color:var(--dim)}
.badge{border-radius:4px;padding:1px 7px;font-size:11px;font-weight:600;color:#fff}
.badge.erro{background:var(--erro)}.badge.incerto{background:var(--incerto)}.badge.contradicao{background:var(--contradicao)}
.meta a{color:var(--accent);text-decoration:none}
.nota{margin:4px 0 0;overflow-wrap:anywhere}
.item img{display:block;max-width:100%;max-height:220px;margin-top:8px;background:#fff;border-radius:6px;padding:4px}
.vazio{color:var(--dim);text-align:center;padding:40px}
@media (max-width:600px){header,main{padding-left:16px;padding-right:16px}}
"""

JS = """
(function(){
  var KEY='revisao_duvidas_conferidas', done={};
  try{ done=JSON.parse(localStorage.getItem(KEY)||'{}'); }catch(e){}
  var q=document.getElementById('q'), cats={erro:true,incerto:true,contradicao:true}, soPend=false;
  function save(){ try{ localStorage.setItem(KEY, JSON.stringify(done)); }catch(e){} }
  document.querySelectorAll('.item').forEach(function(it){
    var cb=it.querySelector('input'); var id=it.dataset.id;
    cb.checked=!!done[id]; it.classList.toggle('done', cb.checked);
    cb.addEventListener('change', function(){ done[id]=cb.checked; if(!cb.checked) delete done[id];
      it.classList.toggle('done', cb.checked); save(); apply(); });
  });
  document.querySelectorAll('.chip[data-cat]').forEach(function(c){
    c.addEventListener('click', function(){ cats[c.dataset.cat]=!cats[c.dataset.cat]; c.classList.toggle('on'); apply(); });
  });
  var pend=document.getElementById('pend');
  pend.addEventListener('click', function(){ soPend=!soPend; pend.classList.toggle('on'); apply(); });
  q.addEventListener('input', apply);
  function apply(){
    var term=q.value.toLowerCase().trim(), total=0, feitos=0;
    document.querySelectorAll('.norma').forEach(function(n){
      var vis=0;
      n.querySelectorAll('.item').forEach(function(it){
        var ok=cats[it.dataset.cat] && (!soPend || !done[it.dataset.id]) &&
               (!term || (n.dataset.busca+' '+it.textContent).toLowerCase().indexOf(term)>=0);
        it.style.display=ok?'':'none'; if(ok) vis++;
      });
      n.style.display=vis?'':'none';
    });
    document.querySelectorAll('.item').forEach(function(it){ total++; if(done[it.dataset.id]) feitos++; });
    document.getElementById('prog').textContent=feitos+' de '+total+' conferidas';
  }
  apply();
})();
"""


def main():
    items = load_items()
    by = {}
    for it in items:
        by.setdefault(it["stem"], []).append(it)
    order = sorted(by, key=lambda s: (by[s][0]["entry"]["tipo"], by[s][0]["entry"]["codigo"]))
    n_erro = sum(1 for i in items if i["cat"] == "erro")
    n_con = sum(1 for i in items if i["cat"] == "contradicao")
    n_inc = len(items) - n_erro - n_con
    blocks = []
    for stem in order:
        e = by[stem][0]["entry"]
        pdf = "../" + e["pdf"]
        rows = []
        for it in by[stem]:
            pg = f"#page={it['page']}" if it["page"] else ""
            label = LABEL[it["cat"]]
            img = f'<img loading="lazy" src="{html.escape(it["img"])}" alt="recorte {it["key"]}">' if it["img"] else ""
            rows.append(
                f'<div class="item" data-cat="{it["cat"]}" data-id="{html.escape(stem)}/{it["kind"]}/{it["key"]}">'
                f'<input type="checkbox" aria-label="conferido">'
                f'<div><div class="meta"><span class="badge {it["cat"]}">{label}</span>'
                f'<span>{ORIGEM[it["kind"]]} {html.escape(it["key"])}</span>'
                + (f'<a href="{html.escape(pdf)}{pg}" target="_blank">PDF p. {it["page"]}</a>' if it["page"]
                   else f'<a href="{html.escape(pdf)}" target="_blank">PDF</a>')
                + f'</div><p class="nota">{html.escape(it["nota"])}</p>{img}</div></div>')
        busca = html.escape(f'{e["codigo"]} {e["titulo"]} {stem}')
        blocks.append(
            f'<section class="norma" data-busca="{busca}"><h2>{html.escape(e["codigo"])}'
            f'<span class="t">{html.escape(e["titulo"])}</span>'
            f'<a href="index.html#norma:{html.escape(e["id"])}" target="_blank">abrir no site</a>'
            f'<a href="{html.escape(pdf)}" target="_blank">PDF</a></h2>{"".join(rows)}</section>')
    page = f"""<!doctype html><html lang="pt-BR"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Revisão de dúvidas</title><style>{CSS}</style></head><body>
<header><h1>Revisão de dúvidas das normas</h1>
<div class="sub">{len(items)} itens em {len(by)} normas: {n_erro} possíveis erros no próprio PDF (transcritos como impressos),
{n_con} contradições internas da norma (achadas ao montar o controle de serviços)
e {n_inc} leituras incertas. Marque "conferido" à medida que revisar (fica salvo neste navegador). <span id="prog"></span></div>
<div class="bar"><input id="q" type="search" placeholder="Filtrar por norma, termo, página...">
<span class="chip on" data-cat="erro">Possíveis erros no PDF</span>
<span class="chip on" data-cat="contradicao">Contradições na norma</span>
<span class="chip on" data-cat="incerto">Leituras incertas</span>
<span class="chip" id="pend">Só pendentes</span></div></header>
<main>{"".join(blocks) or '<p class="vazio">Nenhuma dúvida registrada.</p>'}</main>
<script>{JS}</script></body></html>"""
    OUT.write_text(page, encoding="utf-8")
    print(f"{OUT.relative_to(ROOT)}: {len(items)} itens ({n_erro} erros, {n_con} contradições, {n_inc} incertos) em {len(by)} normas")


if __name__ == "__main__":
    main()
