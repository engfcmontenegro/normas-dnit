"""
Localiza no acervo (data/normas.json) a norma citada por um código como aparece no texto
das ES ("DNIT 172 – ME", "DNER-ME 035/98", "DNIT 031/2006-ES") ou por palavras do título.

Uso:
  python scripts/achar_norma.py "DNIT 172 – ME" "DNER – ME 035/98"
  python scripts/achar_norma.py -t "abrasão" "los angeles"     (busca no título, todas as palavras)
"""
import json
import re
import sys
import unicodedata
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
TIPOS = "PRO|ES|ME|EM|TER|CLA|IE|PAD"


def load():
    return json.loads((ROOT / "data" / "normas.json").read_text(encoding="utf-8"))


def _fold(s):
    return "".join(c for c in unicodedata.normalize("NFD", s.lower()) if unicodedata.category(c) != "Mn")


def resolver(texto, entries=None):
    """Lista de entradas do acervo compatíveis com o código citado (vazia se não houver)."""
    entries = entries or load()
    t = re.sub(r"[–—]", "-", texto).upper()
    m = re.search(rf"DNER[\s-]*({TIPOS})[\s-]*(?:N[ºO°]\.?\s*)?(\d{{2,3}})(?:[\s/-]+(\d{{2,4}}))?", t)
    if m:
        tipo, num, ano = m.group(1), int(m.group(2)), m.group(3)
        out = []
        for e in entries:
            if e["orgao"] != "DNER" or e["tipo"] != tipo:
                continue
            mm = re.search(r"(\d{2,3})/(\d{2,4})", e["codigo"])
            if mm and int(mm.group(1)) == num and (not ano or mm.group(2)[-2:] == ano[-2:]):
                out.append(e)
        return out
    m = re.search(rf"DNIT[\s-]*(?:N[ºO°]\.?\s*)?(\d{{2,3}})(?:[\s/-]+(\d{{4}}))?(?:[\s-]*({TIPOS}))?", t)
    if m:
        num, ano, tipo = int(m.group(1)), m.group(2), m.group(3)
        out = []
        for e in entries:
            if e["orgao"] != "DNIT" or (tipo and e["tipo"] != tipo):
                continue
            mm = re.search(r"(\d{2,3})/(\d{4})", e["codigo"])
            if mm and int(mm.group(1)) == num and (not ano or mm.group(2) == ano):
                out.append(e)
        return out
    return []


def main():
    sys.stdout.reconfigure(encoding="utf-8")
    entries = load()
    args = sys.argv[1:]
    if args and args[0] == "-t":
        palavras = [_fold(a) for a in args[1:]]
        for e in entries:
            if all(p in _fold(e["titulo"]) for p in palavras):
                print(f'{e["id"]:24} {e["codigo"]:20} {e["status"]:9} {e["titulo"]}')
        return
    for a in args:
        achados = resolver(a, entries)
        if not achados:
            print(f"{a!r}: NÃO está no acervo")
        for e in achados:
            print(f'{a!r}: {e["id"]}  ({e["codigo"]}, {e["status"]}) {e["titulo"]}')


if __name__ == "__main__":
    main()
