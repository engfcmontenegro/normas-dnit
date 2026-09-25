"""
Empacota data/normas.json (+ conteúdo de cada markdown) e data/graph.json
em arquivos JS estáticos consumidos por site/index.html, evitando a
necessidade de fetch() (que falha em file:// por causa de CORS).

Gera:
  site/data/normas_data.js  -> window.NORMAS_DATA = [...]
  site/data/graph_data.js   -> window.GRAPH_DATA = {...}
"""
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
NORMAS_JSON = ROOT / "data" / "normas.json"
GRAPH_JSON = ROOT / "data" / "graph.json"
SITE_DATA_DIR = ROOT / "site" / "data"


def strip_front_matter(text: str) -> str:
    if text.startswith("---\n"):
        end = text.find("\n---\n", 4)
        if end != -1:
            return text[end + 5:].lstrip("\n")
    return text


def main():
    entries = json.loads(NORMAS_JSON.read_text(encoding="utf-8"))
    graph = json.loads(GRAPH_JSON.read_text(encoding="utf-8"))

    canc_path = ROOT / "data" / "canceladas.json"
    canceladas = json.loads(canc_path.read_text(encoding="utf-8")) if canc_path.exists() else []
    canc_por_id = {c["id"]: c for c in canceladas if c.get("id")}

    videos_path = ROOT / "data" / "videos.json"
    videos = json.loads(videos_path.read_text(encoding="utf-8")) if videos_path.exists() else {}

    bundled = []
    missing = 0
    for e in entries:
        md_path = ROOT / e["md"]
        conteudo, video = "", None
        if md_path.exists():
            text = md_path.read_text(encoding="utf-8")
            conteudo = strip_front_matter(text)
            # link do vídeo (campo `video` do front-matter) para o cabeçalho do site
            m = re.search(r"^video:[ \t]*(https?://\S+)", text.split("\n---\n", 1)[0], re.M)
            video = m.group(1).strip("\"'") if m else None
        else:
            missing += 1
        extra = {"video": video}
        info = videos.get(md_path.stem) or {}
        if video and info.get("url") == video:
            # título/canal do vídeo achado na busca (para a barra lateral do site)
            extra.update({"video_titulo": info.get("titulo_video"), "video_canal": info.get("canal"),
                          "video_auto": info.get("origem") == "busca",
                          "video_relacao_baixa": bool(info.get("relacao_baixa"))})
        c = canc_por_id.get(e["id"])
        if c:
            # norma cancelada pelo IPR (data/canceladas.json): o site mostra a tarja
            extra["status"] = "cancelada"
            extra["cancelada"] = {k: c.get(k) for k in ("data", "motivo", "pdf", "sucessoras")}
        bundled.append({**e, "conteudo": conteudo, **extra})

    SITE_DATA_DIR.mkdir(parents=True, exist_ok=True)
    (SITE_DATA_DIR / "normas_data.js").write_text(
        "window.NORMAS_DATA = " + json.dumps(bundled, ensure_ascii=False) + ";\n",
        encoding="utf-8",
    )
    (SITE_DATA_DIR / "canceladas_data.js").write_text(
        "window.CANCELADAS = " + json.dumps([{k: v for k, v in c.items() if not k.startswith("_")}
                                            for c in canceladas], ensure_ascii=False) + ";\n",
        encoding="utf-8",
    )
    # faixas granulométricas das especificações (ficha de granulometria, DNIT 412-ME)
    faixas_path = ROOT / "data" / "faixas_granulometricas.json"
    if faixas_path.exists():
        (SITE_DATA_DIR / "faixas_data.js").write_text(
            "window.FAIXAS_GRANULOMETRICAS = " + json.dumps(json.loads(faixas_path.read_text(encoding="utf-8")), ensure_ascii=False) + ";\n",
            encoding="utf-8")
    (SITE_DATA_DIR / "graph_data.js").write_text(
        "window.GRAPH_DATA = " + json.dumps(graph, ensure_ascii=False) + ";\n",
        encoding="utf-8",
    )

    total_chars = sum(len(b["conteudo"]) for b in bundled)
    print(f"Normas empacotadas: {len(bundled)} (sem markdown: {missing})")
    print(f"Tamanho total do conteúdo: {total_chars/1024:.0f} KB")
    print(f"Nós no grafo: {len(graph['nodes'])}  Arestas: {len(graph['edges'])}")


if __name__ == "__main__":
    main()
