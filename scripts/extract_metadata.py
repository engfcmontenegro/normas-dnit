"""
Extrai metadados de cada norma (código, título, órgão, tipo, ano) a partir de
page.html (a página da coletânea de normas do DNIT já salva) e casa cada
entrada com o PDF correspondente já baixado em normas/.

Gera data/normas.json
"""
import json
import re
import unicodedata
from pathlib import Path
from html.parser import HTMLParser

ROOT = Path(__file__).resolve().parent.parent
PAGE_HTML = ROOT / "page.html"
NORMAS_DIR = ROOT / "normas"
OUT_JSON = ROOT / "data" / "normas.json"

TIPOS = ["PRO", "ES", "ME", "EM", "TER", "CLA", "IE", "PAD"]
TIPO_RE = "|".join(TIPOS)


class LinkTextExtractor(HTMLParser):
    """Extrai pares (href, texto_completo_do_link) de <a href="...pdf">texto</a> dentro de <main>."""

    def __init__(self):
        super().__init__()
        self.in_main = False
        self.main_depth = 0
        self.current_href = None
        self.current_text = []
        self.results = []

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag == "main":
            self.in_main = True
            self.main_depth = 1
            return
        if self.in_main and tag in ("div", "section", "article"):
            self.main_depth += 1
        if self.in_main and tag == "a":
            href = attrs.get("href", "")
            if href.lower().endswith(".pdf"):
                self.current_href = href
                self.current_text = []

    def handle_endtag(self, tag):
        if tag == "main" and self.in_main:
            self.in_main = False
        if self.in_main and tag in ("div", "section", "article"):
            self.main_depth -= 1
        if tag == "a" and self.current_href:
            text = " ".join("".join(self.current_text).split())
            self.results.append((self.current_href, text))
            self.current_href = None
            self.current_text = []

    def handle_data(self, data):
        if self.current_href is not None:
            self.current_text.append(data)


def slugify(text: str) -> str:
    text = unicodedata.normalize("NFKD", text).encode("ascii", "ignore").decode("ascii")
    text = text.lower()
    text = re.sub(r"[^a-z0-9]+", "-", text).strip("-")
    return text


def url_to_local_pdf(url: str) -> Path | None:
    marker = "coletanea-de-normas/coletanea-de-normas/"
    idx = url.find(marker)
    if idx == -1:
        return None
    rel = url[idx + len(marker):]
    return NORMAS_DIR / rel


def parse_codigo(text: str):
    """
    Extrai codigo, orgao, tipo, ano e titulo a partir do texto do link, ex:
    "DNER-ME 006/00 - Emulsões asfálticas - determinação da sedimentação"
    "DNIT 049/2013-ES - Pavimento rígido - ..."
    "DNIT 001/2023 – PRO – Estrutura ..."
    """
    t = text.strip()
    # normaliza travessão/hífen variantes para " - "
    t = re.sub(r"\s*[‒–—―]\s*", " - ", t)

    status = "vigente"
    if re.search(r"\(suspensa\)", t, re.IGNORECASE):
        status = "suspensa"

    orgao = "DNIT" if t.upper().startswith("DNIT") else ("DNER" if t.upper().startswith("DNER") else None)

    codigo = None
    tipo = None
    ano = None

    # Padrão DNER: DNER-XXX 123/94  ou DNER XXX 123/94
    m = re.match(rf"DNER[- ]?({TIPO_RE})\s*(\d{{2,3}})/(\d{{2,4}})", t, re.IGNORECASE)
    if m:
        tipo = m.group(1).upper()
        num = m.group(2)
        yy = m.group(3)
        ano = int(yy) if len(yy) == 4 else (1900 + int(yy) if int(yy) >= 50 else 2000 + int(yy))
        codigo = f"DNER-{tipo} {num}/{yy}"
    else:
        # Padrão DNIT: DNIT 049/2013-ES  ou DNIT 049/2013 - ES ou DNIT 049/2013 – PRO
        m = re.match(rf"DNIT\s*(\d{{3}})/(\d{{4}})\s*-?\s*({TIPO_RE})?", t, re.IGNORECASE)
        if m:
            num = m.group(1)
            ano = int(m.group(2))
            tipo = (m.group(3) or "").upper() or None
            codigo = f"DNIT {num}/{ano}" + (f"-{tipo}" if tipo else "")

    # título = tudo depois do primeiro " - " que vem depois do código/tipo
    titulo = t
    parts = t.split(" - ")
    if len(parts) > 1:
        # remove o primeiro segmento (código) e, se o segundo for só a sigla do tipo, remove também
        rest = parts[1:]
        if tipo and rest and rest[0].strip().upper() == tipo:
            rest = rest[1:]
        titulo = " - ".join(rest).strip()

    return codigo, orgao, tipo, ano, titulo, status


def main():
    html = PAGE_HTML.read_text(encoding="utf-8", errors="ignore")
    parser = LinkTextExtractor()
    parser.feed(html)

    seen_ids = set()
    entries = []
    unmatched = []

    for href, text in parser.results:
        if "coletanea-de-normas/coletanea-de-normas/" not in href:
            continue
        pdf_path = url_to_local_pdf(href)
        if pdf_path is None or not pdf_path.exists():
            unmatched.append((href, text))
            continue

        codigo, orgao, tipo, ano, titulo, status = parse_codigo(text)
        if codigo is None:
            # fallback: usa o nome do arquivo como código
            codigo = pdf_path.stem.upper()

        base_id = slugify(codigo)
        entry_id = base_id
        suffix = 2
        while entry_id in seen_ids:
            entry_id = f"{base_id}-{suffix}"
            suffix += 1
        seen_ids.add(entry_id)

        rel_pdf = pdf_path.relative_to(ROOT).as_posix()
        md_path = (ROOT / "markdown" / pdf_path.relative_to(NORMAS_DIR)).with_suffix(".md")
        rel_md = md_path.relative_to(ROOT).as_posix()

        entries.append({
            "id": entry_id,
            "codigo": codigo,
            "orgao": orgao,
            "tipo": tipo,
            "ano": ano,
            "titulo": titulo,
            "status": status,
            "pdf": rel_pdf,
            "md": rel_md,
        })

    OUT_JSON.parent.mkdir(parents=True, exist_ok=True)
    OUT_JSON.write_text(json.dumps(entries, ensure_ascii=False, indent=2), encoding="utf-8")

    print(f"Total de normas catalogadas: {len(entries)}")
    print(f"Links de PDF sem PDF local correspondente: {len(unmatched)}")
    for href, text in unmatched[:10]:
        print("  -", href, "|", text)
    sem_tipo = [e for e in entries if not e["tipo"]]
    print(f"Entradas sem tipo detectado: {len(sem_tipo)}")
    for e in sem_tipo[:10]:
        print("  -", e["codigo"], "|", e["titulo"])


if __name__ == "__main__":
    main()
