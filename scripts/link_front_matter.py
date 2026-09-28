"""
Grava o link oficial do PDF de cada norma (campo `url` de data/normas.json) na propriedade
`link` do front-matter do markdown, logo abaixo de `pdf_original`, para aparecer na tabela
de propriedades do Obsidian. Idempotente: atualiza o valor se já existir.
"""
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
NORMAS_JSON = ROOT / "data" / "normas.json"
LINK_RE = re.compile(r"^link:.*\n", re.M)


def main():
    entries = json.loads(NORMAS_JSON.read_text(encoding="utf-8"))
    alterados = sem_fm = 0
    for e in entries:
        md = ROOT / e["md"]
        if not e.get("url") or not md.exists():
            continue
        text = md.read_text(encoding="utf-8")
        if not text.startswith("---\n"):
            sem_fm += 1
            continue
        fim = text.find("\n---\n", 4)
        if fim == -1:
            sem_fm += 1
            continue
        fm, corpo = text[4:fim + 1], text[fim + 1:]
        linha = f"link: {e['url']}\n"
        novo = LINK_RE.sub("", fm)
        m = re.search(r"^pdf_original:.*\n", novo, re.M)
        novo = novo[:m.end()] + linha + novo[m.end():] if m else novo + linha
        if novo != fm:
            md.write_text("---\n" + novo + corpo, encoding="utf-8")
            alterados += 1
    print(f"Front-matter com link oficial: {alterados} arquivo(s) atualizados; sem front-matter: {sem_fm}")


if __name__ == "__main__":
    main()
