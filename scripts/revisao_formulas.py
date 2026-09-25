"""
Gera site/revisao_formulas.html: para cada fórmula de data/formulas/*.json,
o recorte do PDF original ao lado do LaTeX transcrito (renderizado com KaTeX),
para conferência visual. Abrir via `python scripts/serve.py`:
http://localhost:8124/site/revisao_formulas.html
"""
import html
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
FORMULAS_DIR = ROOT / "data" / "formulas"
OUT = ROOT / "site" / "revisao_formulas.html"

PAGE = """<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<title>Revisão de fórmulas</title>
<link rel="stylesheet" href="vendor/katex/katex.min.css">
<style>
  :root {{ --bg:#0f1115; --panel:#171a21; --border:#2a2f3a; --text:#e6e8ec; --dim:#9aa3b2; --ok:#34c38f; --warn:#e0a13a; }}
  body {{ margin:0; background:var(--bg); color:var(--text); font-family:-apple-system,Segoe UI,Roboto,Arial,sans-serif; }}
  header {{ padding:16px 24px; border-bottom:1px solid var(--border); background:var(--panel); position:sticky; top:0; z-index:2; }}
  header h1 {{ margin:0; font-size:18px; }}
  header p {{ margin:4px 0 0; color:var(--dim); font-size:13px; }}
  label {{ font-size:13px; color:var(--dim); }}
  main {{ padding:8px 24px 40px; max-width:1200px; }}
  h2 {{ font-size:15px; margin:28px 0 10px; }}
  .row {{ display:grid; grid-template-columns:70px 1fr 1fr; gap:16px; align-items:center;
          border:1px solid var(--border); border-radius:8px; padding:10px 14px; margin-bottom:8px; background:var(--panel); }}
  .id {{ font-weight:600; font-size:13px; }}
  .id small {{ display:block; color:var(--dim); font-weight:400; }}
  .pdf {{ background:#fff; border-radius:6px; padding:6px; text-align:center; }}
  .pdf img {{ max-width:100%; max-height:140px; }}
  .tex {{ background:#fff; color:#111; border-radius:6px; padding:10px; overflow-x:auto; min-height:40px; }}
  .tex .katex {{ color:#111; }}
  code {{ display:block; margin-top:6px; font-size:11px; color:var(--dim); white-space:pre-wrap; word-break:break-all; }}
  .pend {{ border-color:var(--warn); }}
  .pend .tex {{ background:#2a2410; color:var(--warn); }}
  .err {{ outline:2px solid #d9534f; }}
  .ign {{ opacity:0.45; }}
  .ign .tex {{ background:#222; color:var(--dim); font-size:12px; }}
</style>
</head>
<body>
<header>
  <h1>Revisão de fórmulas — PDF original × LaTeX transcrito</h1>
  <p>{resumo} · <label><input type="checkbox" id="so-pendentes"> mostrar só pendentes</label></p>
</header>
<main>
{secoes}
</main>
<script src="vendor/katex/katex.min.js"></script>
<script>
  document.querySelectorAll('.tex[data-latex]').forEach(function (el) {{
    var latex = el.getAttribute('data-latex');
    try {{ katex.render(latex, el, {{ displayMode: true, throwOnError: true }}); }}
    catch (e) {{ el.textContent = 'ERRO: ' + e.message; el.parentElement.classList.add('err'); }}
  }});
  document.getElementById('so-pendentes').addEventListener('change', function (e) {{
    document.querySelectorAll('.row').forEach(function (r) {{
      r.style.display = (e.target.checked && !r.classList.contains('pend')) ? 'none' : '';
    }});
  }});
</script>
</body>
</html>
"""


def main():
    secoes, total, pend, ignored = [], 0, 0, 0
    for f in sorted(FORMULAS_DIR.glob("*.json")):
        stem = f.stem
        data = json.loads(f.read_text(encoding="utf-8"))
        rows = []
        for eq_id, eq in data.items():
            if eq.get("todas") or eq.get("texto"):
                continue  # correção de texto (DNER), não é fórmula
            latex = eq.get("latex", "")
            img = f"../markdown/_formulas/{stem}_{eq_id}.png"
            if eq.get("ignorar"):
                ignored += 1
                rows.append(
                    f'<div class="row ign"><div class="id">{eq_id}<small>pág. {eq.get("page", "?")}</small></div>'
                    f'<div class="pdf"><img src="{img}" alt="{stem} {eq_id}"></div>'
                    f'<div class="tex">ignorado: {html.escape(eq.get("nota", "não é fórmula"))}</div></div>'
                )
                continue
            total += 1
            if latex:
                parts = latex if isinstance(latex, list) else [latex]
                tex = "".join(
                    f'<div class="tex" data-latex="{html.escape(x)}"></div><code>{html.escape(x)}</code>'
                    if isinstance(x, str) else f'<code>texto: {html.escape(x.get("texto", ""))}</code>'
                    for x in parts)
                if eq.get("manual"):
                    tex += "<code>cadastrada manualmente (o detector não achou)</code>"
                cls = "row"
            else:
                pend += 1
                tex = '<div class="tex">pendente de transcrição</div>'
                cls = "row pend"
            rows.append(
                f'<div class="{cls}"><div class="id">{eq_id}<small>pág. {eq.get("page", "?")}</small></div>'
                f'<div class="pdf"><img src="{img}" alt="{stem} {eq_id}"></div><div>{tex}</div></div>'
            )
        secoes.append(f"<h2>{stem} ({len(data)})</h2>\n" + "\n".join(rows))
    resumo = (f"{total} fórmulas em {len(secoes)} normas · {total - pend} transcritas · {pend} pendentes"
              f" · {ignored} trechos descartados (não eram fórmula)")
    OUT.write_text(PAGE.format(resumo=resumo, secoes="\n".join(secoes)), encoding="utf-8")
    print(f"{OUT.relative_to(ROOT)}: {resumo}")


if __name__ == "__main__":
    main()
