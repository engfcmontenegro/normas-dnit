"""
Aplica as fórmulas transcritas (LaTeX) nos markdowns das normas ME do DNER.

Os PDFs do DNER são, na maioria, escaneados: o OCR destrói frações, índices e
letras gregas, então cada fórmula foi transcrita olhando o PDF e guardada em
data/formulas/<norma>.json:

  "eq01": {
    "page": 4,                      # página do PDF (1 = primeira)
    "clip": [x0, y0, x1, y1],       # região da fórmula (recorte p/ conferência)
    "latex": ["h = ..."],           # blocos $$ ... $$ (validados no KaTeX)
    "de_inicio": "...",             # trecho do md a substituir: do início deste
    "de_fim": "...",                #   texto até o fim deste (inclusive)
    "para": "...",                  # markdown novo (contém os blocos $$ do latex)
    "nota": "..."                   # opcional
  }

Variantes: sem "de_inicio" = fórmula já incluída no "para" de outra entrada
(só recorte + conferência); "todas": true = troca todas as ocorrências de
"de_inicio" por "para" (símbolo errado no texto corrido, ex.: "(pa)" -> "(ρa)").

O trecho do md (texto quebrado do OCR, aviso [!warning], legenda "onde:" com
variáveis erradas) é trocado pelo markdown novo. Rodar de novo não muda nada:
se o trecho antigo não existe mais e o novo já está no md, a fórmula é pulada.

Também gera o recorte markdown/_formulas/<norma>_eqNN.png (conferência em
site/revisao_formulas.html via scripts/revisao_formulas.py).

Uso: python scripts/formulas_dner.py [norma ...]   (ex.: dner_me_162_94-1)
"""
import json
import sys
from pathlib import Path

import pymupdf

ROOT = Path(__file__).resolve().parent.parent
FORM_DIR = ROOT / "data" / "formulas"
FORM_IMG = ROOT / "markdown" / "_formulas"
NORMAS_JSON = ROOT / "data" / "normas.json"


def apply(stem, entry):
    store = json.loads((FORM_DIR / f"{stem}.json").read_text(encoding="utf-8"))
    md_path = ROOT / entry["md"]
    text = md_path.read_text(encoding="utf-8")
    doc = pymupdf.open(ROOT / entry["pdf"])
    done, skipped, missing = 0, 0, []
    for eq_id, eq in store.items():
        if eq.get("clip"):
            page = doc[eq["page"] - 1]
            FORM_IMG.mkdir(parents=True, exist_ok=True)
            page.get_pixmap(clip=pymupdf.Rect(eq["clip"]) & page.rect, dpi=200).save(
                str(FORM_IMG / f"{stem}_{eq_id}.png"))
        if eq.get("ignorar"):
            continue
        if "de_inicio" not in eq:
            # fórmula aplicada junto com outra entrada (mesmo trecho do md)
            if all(f"$$\n{b}\n$$" in text for b in eq.get("latex", [])):
                skipped += 1
            else:
                missing.append(eq_id)
            continue
        for block in eq.get("latex", []):
            assert f"$$\n{block}\n$$" in eq["para"], f"{stem} {eq_id}: latex fora do 'para'"
        if eq.get("todas"):
            # correção de símbolo no texto corrido (ρ lido como p, etc.)
            n = text.count(eq["de_inicio"])
            text = text.replace(eq["de_inicio"], eq["para"])
            done, skipped = (done + 1, skipped) if n else (done, skipped + 1)
            continue
        i = text.find(eq["de_inicio"])
        if i != -1 and eq["para"].strip() and text.startswith(eq["para"], i):
            skipped += 1  # o trecho novo começa igual ao antigo e já foi aplicado
            continue
        if eq["de_fim"] == "<<FIM>>":  # até o fim do documento (anexo reescrito)
            j = len(text) - len("<<FIM>>") if i != -1 else -1
        else:
            j = text.find(eq["de_fim"], i) if i != -1 else -1
        if i == -1 or j == -1:
            if eq["para"] in text:
                skipped += 1
            else:
                missing.append(eq_id)
            continue
        text = text[:i] + eq["para"] + text[j + len(eq["de_fim"]):]
        done += 1
    md_path.write_text(text, encoding="utf-8")
    return done, skipped, missing


def main():
    entries = {Path(e["md"]).stem: e for e in json.loads(NORMAS_JSON.read_text(encoding="utf-8"))}
    stems = sys.argv[1:] or sorted(p.stem for p in FORM_DIR.glob("dner*.json"))  # DNER: ME, ES, EM, PRO
    for stem in stems:
        done, skipped, missing = apply(stem, entries[stem])
        msg = f"{stem}: {done} aplicadas, {skipped} já estavam"
        if missing:
            msg += f"  NÃO ENCONTRADAS: {', '.join(missing)}"
        print(msg)


if __name__ == "__main__":
    main()
