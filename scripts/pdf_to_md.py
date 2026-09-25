"""
Converte cada PDF listado em data/normas.json para Markdown.

Estratégia: extração de texto via PyMuPDF em modo "dict" (preserva espaços
corretamente, ao contrário de pymupdf4llm que corrompe a espacamento em
alguns PDFs antigos digitalizados ao tentar reconstruir tabelas). Linhas
cujo tamanho de fonte é sensivelmente maior que o "corpo do texto" da
página viram cabeçalhos Markdown (#, ##, ###), o restante vira parágrafos.

Grava em markdown/<mesma-subpasta-de-normas>/<mesmo-nome>.md com front-matter YAML.
"""
import json
import re
import sys
from collections import Counter
from pathlib import Path

import fitz  # PyMuPDF

ROOT = Path(__file__).resolve().parent.parent
NORMAS_JSON = ROOT / "data" / "normas.json"

# Nestas normas o número da seção ("1", "3.1", "5.2.1"...) e o título/texto
# que o segue quase sempre saem como duas linhas físicas separadas na
# extração (às vezes na mesma "linha de bloco", às vezes em blocos diferentes
# com uma linha em branco no meio - por isso o \n+ tolerante). Isso produzia
# títulos "quebrados" tipo:
#   1
#   OBJETIVO
# Este regex junta as duas linhas numa só. Números sem ponto (seções de
# 1º nível) viram cabeçalho; números com ponto (cláusulas/subseções) viram
# um parágrafo com o número em negrito, para não inflar a estrutura de
# cabeçalhos com uma entrada por cláusula numerada.
NUMBER_TITLE_RE = re.compile(
    r"^[ \t]*(?:#{1,3}[ \t]+)?(\d+(?:\.\d+){0,3})\.?[ \t]*\n+[ \t]*(?:#{1,3}[ \t]+)?(\S[^\n]*)$",
    re.MULTILINE,
)


def merge_numbering(text: str) -> str:
    def repl(m):
        number, title = m.group(1), m.group(2).strip()
        if "." in number:
            return f"**{number}** {title}"
        return f"## {number} {title}"

    # aplica repetidamente: o resultado de uma junção pode expor um novo par
    # número/título logo depois (ex.: sumário com vários pares seguidos);
    # limite de passes como rede de segurança contra qualquer ciclo inesperado
    for _ in range(5):
        new_text = NUMBER_TITLE_RE.sub(repl, text)
        if new_text == text:
            break
        text = new_text
    return text


def yaml_escape(s: str) -> str:
    return s.replace('"', '\\"')


def line_text(line) -> str:
    """Junta os spans de uma linha, preservando espaços entre eles."""
    parts = []
    for span in line["spans"]:
        t = span["text"]
        if not t:
            continue
        if parts and not parts[-1].endswith(" ") and not t.startswith(" "):
            parts.append(" ")
        parts.append(t)
    return "".join(parts).strip()


def line_max_size(line) -> float:
    sizes = [s["size"] for s in line["spans"] if s["text"].strip()]
    return max(sizes) if sizes else 0.0


def line_is_bold(line) -> bool:
    for s in line["spans"]:
        if s["text"].strip() and (s["flags"] & 2**4):  # bit 4 = bold
            return True
    return False


def convert_one(pdf_path: Path) -> str:
    doc = fitz.open(pdf_path)

    # descobre o tamanho de fonte mais comum (corpo do texto) no documento inteiro
    size_counts = Counter()
    for page in doc:
        d = page.get_text("dict")
        for block in d["blocks"]:
            for line in block.get("lines", []):
                for span in line["spans"]:
                    if span["text"].strip():
                        size_counts[round(span["size"], 1)] += len(span["text"])
    body_size = size_counts.most_common(1)[0][0] if size_counts else 10.0

    out_lines = []
    for page_num, page in enumerate(doc):
        d = page.get_text("dict")
        for block in d["blocks"]:
            block_lines = block.get("lines", [])
            if not block_lines:
                continue
            texts = []
            for line in block_lines:
                t = line_text(line)
                if not t:
                    continue
                size = line_max_size(line)
                bold = line_is_bold(line)
                ratio = size / body_size if body_size else 1.0
                if ratio >= 1.6:
                    t = f"# {t}"
                elif ratio >= 1.3:
                    t = f"## {t}"
                elif ratio >= 1.12 or (bold and ratio >= 1.0):
                    t = f"### {t}"
                texts.append(t)
            if texts:
                out_lines.append("\n".join(texts))
        out_lines.append("")  # separador entre páginas

    body = "\n\n".join(out_lines).strip() + "\n"
    return merge_numbering(body)


def main():
    force = "--force" in sys.argv
    entries = json.loads(NORMAS_JSON.read_text(encoding="utf-8"))
    total = len(entries)
    ok = 0
    fail = 0
    for i, e in enumerate(entries, 1):
        pdf_path = ROOT / e["pdf"]
        md_path = ROOT / e["md"]
        md_path.parent.mkdir(parents=True, exist_ok=True)

        if not force and md_path.exists() and md_path.stat().st_size > 0:
            ok += 1
            continue

        try:
            body = convert_one(pdf_path)
        except Exception as ex:
            print(f"FALHOU: {pdf_path} -> {ex}", file=sys.stderr)
            fail += 1
            continue

        front_matter = (
            "---\n"
            f'codigo: "{yaml_escape(e["codigo"])}"\n'
            f'titulo: "{yaml_escape(e["titulo"])}"\n'
            f'orgao: {e["orgao"]}\n'
            f'tipo: {e["tipo"]}\n'
            f'ano: {e["ano"]}\n'
            f'status: {e["status"]}\n'
            f'pdf_original: "../../{e["pdf"]}"\n'
            "---\n\n"
        )
        md_path.write_text(front_matter + body, encoding="utf-8")
        ok += 1

        if i % 25 == 0:
            print(f"Progresso: {i}/{total}")

    print(f"Concluído. OK: {ok}  Falhas: {fail}")


if __name__ == "__main__":
    main()
