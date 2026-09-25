"""
Lista de normas canceladas pelo IPR/DNIT (página "Normas canceladas IPR" do gov.br).

Baixa (ou lê de --html arquivo) a página, extrai cada norma cancelada — código,
título, motivação, data e link do PDF "com tarja" — e resolve contra o acervo:
  - "id": a norma cancelada, se estiver no acervo (o site mostra a tarja de cancelada);
  - "sucessoras": normas do acervo citadas na motivação ("cancelada pela publicação da
    DNIT 459/2025-ME", "conteúdo similar ao da DNIT 411/2021-ME").

Gera data/canceladas.json. Uso:
  python scripts/normas_canceladas.py            (baixa a página)
  python scripts/normas_canceladas.py --html x   (usa uma cópia salva)
"""
import html
import json
import re
import sys
import urllib.request
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from dependencias import codigos, ano4  # noqa: E402

ROOT = Path(__file__).resolve().parent.parent
URL = ("https://www.gov.br/dnit/pt-br/assuntos/planejamento-e-pesquisa/ipr/"
       "coletanea-de-normas/normas-canceladas-ipr")


def texto(frag):
    return re.sub(r"\s+", " ", html.unescape(re.sub(r"<[^>]+>", " ", frag))).strip()


def main():
    args = sys.argv[1:]
    if "--html" in args:
        pagina = Path(args[args.index("--html") + 1]).read_text(encoding="utf-8", errors="replace")
    else:
        try:
            req = urllib.request.Request(URL, headers={"User-Agent": "Mozilla/5.0"})
            pagina = urllib.request.urlopen(req, timeout=60).read().decode("utf-8", "replace")
        except OSError as ex:
            # sem rede: mantém a lista já salva em data/canceladas.json
            print(f"AVISO: não foi possível baixar a lista de canceladas ({ex}); mantida a lista atual")
            return

    entries = json.loads((ROOT / "data/normas.json").read_text(encoding="utf-8"))
    idx = {}
    for e in entries:
        m = re.search(r"(\d{2,3})/(\d{2,4})", e["codigo"])
        if m:
            idx.setdefault((e["orgao"], e["tipo"], int(m.group(1))), {})[ano4(m.group(2))] = e["id"]

    def no_acervo(chave, qualquer_ano=False):
        ed = idx.get(chave[:3], {})
        if chave[3] in ed:
            return ed[chave[3]]
        if (qualquer_ano or not chave[3]) and ed:
            return ed[max(ed)]
        return None

    canceladas = []
    for linha in re.findall(r"<tr>(.*?)</tr>", pagina, re.S):
        cels = re.findall(r"<td[^>]*>(.*?)</td>", linha, re.S)
        if len(cels) < 3:
            continue
        tit = re.sub(r"(\d{2,3})/19(\d{2})\b", r"\1/\2", texto(cels[0]))  # "088/1994" -> "088/94"
        cods = codigos(tit)
        if not cods:
            continue
        chave, rot, fim = cods[0]
        pdf = re.search(r'href="([^"]+\.pdf)"', cels[0])
        motivo = texto(cels[1])
        data = re.search(r"(\d{1,2}/\d{1,2}/\d{4})", texto(cels[2]))
        sucessoras = []
        for ch, r, _ in codigos(motivo):
            alvo = no_acervo(ch, qualquer_ano=True)
            if alvo and alvo not in sucessoras:
                sucessoras.append(alvo)
        canceladas.append({
            "codigo": rot,
            "titulo": re.sub(r"^\s*[-–:]\s*", "", tit[fim:]).strip() if fim < len(tit) else "",
            "motivo": motivo,
            "data": data.group(1) if data else texto(cels[2]),
            "pdf": pdf.group(1) if pdf else None,
            "id": no_acervo(chave),
            "sucessoras": sucessoras,
            "_chave": list(chave),
        })

    (ROOT / "data/canceladas.json").write_text(json.dumps(canceladas, ensure_ascii=False, indent=1) + "\n",
                                               encoding="utf-8")
    no = [c for c in canceladas if c["id"]]
    print(f"Canceladas: {len(canceladas)}  no acervo: {len(no)}  com sucessora no acervo: "
          f"{sum(1 for c in canceladas if c['sucessoras'])}")
    for c in no:
        print("  no acervo:", c["codigo"], "->", c["id"])


if __name__ == "__main__":
    main()
