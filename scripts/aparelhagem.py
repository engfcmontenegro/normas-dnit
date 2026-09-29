"""
Extrai a seção "Aparelhagem" (ou "Equipamentos") dos métodos de ensaio (ME) e instruções de ensaio (IE) e
classifica cada item numa categoria de equipamento, para a aba "Equipamentos de laboratório" do site.

Gera:
  data/aparelhagem.json            -> {id: {secao, itens: [{texto, detalhes: [...], cat, grupo}]}}
  site/data/aparelhagem_data.js    -> window.APARELHAGEM = {...}; window.APARELHAGEM_CATS = [...]
Correções manuais: data/aparelhagem_extra.json -> {id: {"itens": [...]}} substitui a extração daquela norma.
"""
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
NORMAS = ROOT / "data" / "normas.json"
EXTRA = ROOT / "data" / "aparelhagem_extra.json"
OUT = ROOT / "data" / "aparelhagem.json"
OUT_JS = ROOT / "site" / "data" / "aparelhagem_data.js"

TIPOS = ("ME", "IE")
TITULO_RE = re.compile(
    r"^(?:#{1,4}\s*)?(?:\*\*)?\s*(\d+(?:\.\d+)*)\s*(?:\*\*)?\s*[-–]?\s*"
    r"(aparelhagem|equipamentos?|aparelhos|materiais e (?:aparelhagem|equipamentos)|aparelhagem e materiais"
    r"|material e aparelhagem|equipamentos? e (?:materiais|aparelhagem))\b[^\n]*$", re.I | re.M)
PROX_TITULO_RE = re.compile(r"^#{1,4}\s+\S|^(?:\*\*)?\s*\d+\s*(?:\*\*)?\s+[A-ZÁÉÍÓÚÂÊÔÃÕÇ][A-ZÁÉÍÓÚÂÊÔÃÕÇ ]{3,}$", re.M)
ALINEA_RE = re.compile(r"^(?:[a-z]\)|[a-z]\s*[-–]\s|\*\*\d+(?:\.\d+)+\*\*|\d+(?:\.\d+)+\s)\s*", re.I)

# categoria -> (grupo, regex); a primeira que casar vence (específicas antes das genéricas)
CATS = [
    ("Máquina Los Angeles", "Ensaios mecânicos", r"los angeles|máquina de abrasão"),
    ("Prensa / máquina de ensaio", "Ensaios mecânicos", r"\bprensa\b|máquina (?:universal )?de ensaio|atuador|macaco (?:hidráulico|de engrenagem)|servo"),
    ("Anel dinamométrico / célula de carga", "Ensaios mecânicos", r"anel dinamom|conjunto dinamom|célula de carga|transdutor de (?:carga|força)|dinamômetro"),
    ("Extensômetro / LVDT", "Medição", r"extensômetro|lvdt|transdutor(?:es)? de deslocamento|relógio comparador|defletômetro|deflectômetro"),
    ("Balança", "Pesagem", r"\bbalan[çc]a"),
    ("Estufa", "Secagem e aquecimento", r"\bestufa"),
    ("Mufla / forno", "Secagem e aquecimento", r"\bmufla|\bforno\b"),
    ("Banho (maria / termostatizado)", "Secagem e aquecimento", r"\bbanho\b|banho-maria|cuba termost|tanque de (?:água|imersão)"),
    ("Aquecedor / fogareiro / chapa", "Secagem e aquecimento", r"fogão|fonte de calor|panela|lâmpada|fogareiro|chapa (?:aquecedora|elétrica|de aquecimento)|placa (?:aquecedora|elétrica)|bico de bunsen|aquecedor|frigideira|maçarico"),
    ("Dessecador", "Secagem e aquecimento", r"dessecador"),
    ("Freezer / câmara climática", "Secagem e aquecimento", r"freezer|refrigera|congelador|câmara (?:de temperatura|climática|úmida)|geladeira"),
    ("Agitador / misturador", "Preparação", r"agitador|misturador|batedeira|homogeneizador|peneirador mecânico|vibrador"),
    ("Peneiras", "Peneiramento", r"\bpeneira"),
    ("Repartidor / quarteador", "Preparação", r"repartidor|quarteador|separador de amostras"),
    ("Almofariz e mão de gral", "Preparação", r"almofariz|mão de gral|pistilo|gral\b"),
    ("Molde / cilindro de moldagem", "Moldagem e compactação", r"\bmolde|cilindro (?:metálico|de compactação|de moldagem|complementar)|anel de moldagem|fôrma"),
    ("Soquete / compactador", "Moldagem e compactação", r"soquete|compactador|martelo|pilão"),
    ("Disco espaçador / placa-base", "Moldagem e compactação", r"disco espaçador|disco anelar|prato perfurado|placa[- ]base|base metálica|colarinho"),
    ("Extrator de corpo de prova", "Moldagem e compactação", r"extrator"),
    ("Paquímetro / micrômetro", "Medição", r"paquímetro|micrômetro"),
    ("Microscópio / lupa", "Medição", r"microscópio|\blupa\b|estereoscópio|câmera"),
    ("Termômetro", "Medição", r"termômetro|termopar|pirômetro|sensor de temperatura"),
    ("Cronômetro / relógio", "Medição", r"cronômetro|relógio|temporizador|timer"),
    ("Régua / trena / nível", "Medição", r"\brégua|\btrena|\bnível de bolha|esquadro"),
    ("Manômetro / vacuômetro / bomba de vácuo", "Medição", r"manômetro|vacuômetro|bomba de vácuo|\bvácuo"),
    ("Densímetro / hidrômetro", "Medição", r"densímetro|hidrômetro"),
    ("Picnômetro / frasco volumétrico", "Vidraria e recipientes", r"picnômetro|frasco (?:de chapman|volumétrico|le chatelier)|balão volumétrico"),
    ("Proveta / pipeta / bureta", "Vidraria e recipientes", r"proveta|pipeta|bureta"),
    ("Béquer / erlenmeyer / balão", "Vidraria e recipientes", r"b[ée]quer|b[ée]cher|becker|erlenmeyer|kitassato|\bbalão\b|cuba de vidro"),
    ("Funil", "Vidraria e recipientes", r"\bfunil"),
    ("Tubo de ensaio / bastão / placa de vidro", "Vidraria e recipientes", r"tubo de ensaio|bastão|baqueta|placa de vidro|vidro de relógio|lâmina de vidro|lamínula"),
    ("Cápsula / cadinho / recipiente de umidade", "Vidraria e recipientes", r"cápsula|cadinho|recipiente(?:s)? (?:de alumínio|para (?:a )?(?:determinação da )?umidade|com tampa)|lata(?:s)? de alumínio"),
    ("Bandeja / tabuleiro / bacia", "Vidraria e recipientes", r"bandeja|tabuleiro|bacia|travessa|\bbalde"),
    ("Frasco / recipiente", "Vidraria e recipientes", r"\bfrasco|recipiente|vasilha|tanque|garrafão|\blata\b|\bpote\b"),
    ("Espátula / colher / concha", "Ferramentas", r"espátula|colher|concha|pá\b|pincel|escova|rodo|\bcinzel|talhadeira"),
    ("Cesto / suporte para pesagem hidrostática", "Pesagem", r"cesto|pesagem hidrostática|suporte para (?:a )?pesagem"),
    ("Papel de filtro / filtro", "Consumíveis", r"papel de filtro|papel filtro|\bfiltro"),
    ("Água destilada", "Consumíveis e reagentes", r"água destilada|água deionizada"),
    ("Reagentes e soluções", "Consumíveis e reagentes", r"solução|reagente|ácido|hidróxido|cloreto|sulfato|nitrato|álcool|querosene|tricloroetileno|benzeno|glicerina|parafina|óleo|indicador"),
    ("Ferramentas diversas", "Ferramentas", r"martelo de borracha|faca|tesoura|serra|furadeira|broca|alicate|chave|pinça|estilete|lâmina cortante|desbastador|aparador|raspador|lixa|extensor|tripé"),
    ("Medidores e instrumentos", "Medição", r"medidor|calibrador|gabarito|sensor|geofone|receptor|voltímetro|multímetro|refratômetro|viscosímetro|reômetro|colorímetro|glossímetro|brilhômetro|retrorrefletômetro|espectrofotômetro|ph-?metro|potenciômetro|criptômetro|padrão de cor|esfera de aço|carga abrasiva|limitador"),
    ("Materiais consumíveis", "Consumíveis e reagentes", r"anti-?aderente|papel (?:alumínio|toalha|absorvente)|etiqueta|materiais? de limpeza|fita|\bsaco|plástico|vaselina|graxa|\bpano|algodão|luvas?\b|borracha"),
    ("Aparelhos específicos do ensaio", "Aparelhos específicos", r"aparelho|célula|dispositivo|equipamento|sistema|conjunto|guia|suporte|haste|placa|disco|\banel\b|cunho|marcador|fonte|circuito|unidade|cabeçote|\bmesa\b|bancada|câmara|reservatório|\btubo|amostra de referência"),
]
CATS_RX = [(n, g, re.compile(r, re.I)) for n, g, r in CATS]


def categoria(texto):
    cab = texto[:160]
    for n, g, rx in CATS_RX:
        if rx.search(cab):
            return n, g
    return "Outros equipamentos", "Outros"


def limpar(s):
    s = re.sub(r"\[\[[^|\]]*\|([^\]]*)\]\]", r"\1", s)       # [[stem|DNIT 412]] -> DNIT 412
    s = re.sub(r"!\[\[[^\]]*\]\]", "", s)                     # imagens
    s = re.sub(r"\*\*", "", s)
    return re.sub(r"\s+", " ", s).strip()


def extrair(md_text):
    m = TITULO_RE.search(md_text)
    if not m:
        return None
    ini = m.end()
    prox = PROX_TITULO_RE.search(md_text, ini)
    corpo = md_text[ini: prox.start() if prox else len(md_text)]
    itens, cur = [], None
    for par in re.split(r"\n\s*\n", corpo):
        par = par.strip()
        if not par or par.startswith("|") or par.startswith("!["):
            continue
        linhas = [l.strip() for l in par.split("\n") if l.strip()]
        for ln in linhas:
            if ALINEA_RE.match(ln):
                cur = {"texto": limpar(ALINEA_RE.sub("", ln, count=1)), "detalhes": []}
                itens.append(cur)
            elif re.match(r"^[-–‒•]\s", ln):
                t = limpar(re.sub(r"^[-–‒•]\s*", "", ln))
                if cur is None or not itens:
                    cur = {"texto": t, "detalhes": []}; itens.append(cur)
                else:
                    cur["detalhes"].append(t)
            elif re.match(r"^(nota|note|observação)", ln, re.I) or re.match(r"^a aparelhagem necessária|^são necessários|^utiliza-se", ln, re.I):
                continue
            elif cur is not None:
                cur["detalhes"].append(limpar(ln))
    # itens-lista soltos ("balança com capacidade...") sem alínea, quando não houve alíneas
    if not itens:
        for ln in corpo.split("\n"):
            ln = ln.strip()
            if re.match(r"^[-–‒•]\s", ln):
                itens.append({"texto": limpar(re.sub(r"^[-–‒•]\s*", "", ln)), "detalhes": []})
    out = []
    FRASE = re.compile(r"^(?:O|A|Os|As|Deve|Devem|Não|Adverte|Quando|Caso|Se|Esta?|Estes?|Essas?|Esses?|Para|Nota)\b|^[a-zà-ú]", re.U)
    SUBTIT = re.compile(r"^(?:materiais|ferramentas|aparelhagem|equipamentos?|requisitos básicos|acessórios)\s*:?$", re.I)
    for it in itens:
        if len(it["texto"]) < 3 or SUBTIT.match(it["texto"]):
            continue
        # frase de detalhe que o markdown separou do item: junta ao item anterior
        if out and FRASE.match(it["texto"]) and categoria(it["texto"])[0] == "Outros equipamentos":
            out[-1]["detalhes"].append(it["texto"])
            continue
        n, g = categoria(it["texto"])
        it["cat"], it["grupo"] = n, g
        # subitens com equipamento próprio (ex.: prensa "composta de: ... balança ...") viram itens também
        subs = []
        for dt in it["detalhes"]:
            n2, g2 = categoria(dt)
            if n2 != "Outros equipamentos" and n2 != n and len(dt) < 400:
                subs.append({"texto": dt, "detalhes": [], "cat": n2, "grupo": g2, "parte_de": it["texto"][:60]})
        out.append(it)
        out.extend(subs)
    return {"secao": limpar(m.group(0)), "itens": out}


def main():
    normas = json.loads(NORMAS.read_text(encoding="utf-8"))
    extra = json.loads(EXTRA.read_text(encoding="utf-8")) if EXTRA.exists() else {}
    dados, sem = {}, []
    for e in normas:
        if e["tipo"] not in TIPOS:
            continue
        md = ROOT / e["md"]
        if e["id"] in extra:
            dados[e["id"]] = extra[e["id"]]
            for it in dados[e["id"]]["itens"]:
                if "cat" not in it:
                    it["cat"], it["grupo"] = categoria(it["texto"])
            continue
        r = extrair(md.read_text(encoding="utf-8")) if md.exists() else None
        if r and r["itens"]:
            dados[e["id"]] = r
        else:
            sem.append(e["id"])
    OUT.write_text(json.dumps(dados, ensure_ascii=False, indent=1), encoding="utf-8")
    cats = [{"cat": n, "grupo": g} for n, g, _ in CATS] + [{"cat": "Outros equipamentos", "grupo": "Outros"}]
    OUT_JS.write_text("window.APARELHAGEM = " + json.dumps(dados, ensure_ascii=False) + ";\n"
                      "window.APARELHAGEM_CATS = " + json.dumps(cats, ensure_ascii=False) + ";\n", encoding="utf-8")
    n_it = sum(len(v["itens"]) for v in dados.values())
    outros = sum(1 for v in dados.values() for it in v["itens"] if it["cat"] == "Outros equipamentos")
    print(f"Aparelhagem: {len(dados)} normas, {n_it} itens ({outros} sem categoria); sem seção: {len(sem)} {' '.join(sem)}")


if __name__ == "__main__":
    main()
