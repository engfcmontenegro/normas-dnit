"""
Preenche o campo `video` das normas ME com o primeiro vídeo do YouTube para o
título da norma (ex.: "Solos - Determinação da massa específica aparente, in
situ, com emprego do frasco de areia"). O sufixo "- Método de ensaio" sai da
busca.

- Só preenche `video` vazio: link posto à mão não é trocado.
- "Primeiro vídeo" = primeiro resultado do tipo vídeo na busca (Shorts,
  playlists, canais e anúncios são pulados).
- Registro em data/videos.json (busca usada, link, título e canal do vídeo),
  que também é a fonte do campo quando a norma é regenerada.
  Para trocar um vídeo: edite o link no .md (ou em data/videos.json) — o
  script não sobrescreve.

Uso: python scripts/videos_youtube.py [--refazer stem ...]
"""
import json
import re
import sys
import time
import urllib.parse
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
ME_DIR = ROOT / "markdown" / "metodo-de-ensaio-me"
STORE = ROOT / "data" / "videos.json"

sys.path.insert(0, str(Path(__file__).resolve().parent))
from normalizar_me_dner import parse_front_matter  # noqa: E402


def query_for(titulo):
    q = re.sub(r"\s*[-–—]\s*M[ée]todo de ensaio\s*$", "", titulo or "", flags=re.I)
    return re.sub(r"\s+", " ", q).strip()


def first_video(q):
    url = "https://www.youtube.com/results?hl=pt-BR&gl=BR&search_query=" + urllib.parse.quote(q)
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0", "Accept-Language": "pt-BR,pt;q=0.9"})
    html = urllib.request.urlopen(req, timeout=30).read().decode("utf-8", "replace")
    m = re.search(r"var ytInitialData = (\{.*?\});</script>", html)
    if not m:
        return None
    data = json.loads(m.group(1))

    def walk(o):
        if isinstance(o, dict):
            if "videoRenderer" in o:
                yield o["videoRenderer"]
            for v in o.values():
                yield from walk(v)
        elif isinstance(o, list):
            for v in o:
                yield from walk(v)
    for v in walk(data):
        if v.get("videoId"):
            return {"url": f"https://www.youtube.com/watch?v={v['videoId']}",
                    "titulo_video": "".join(r.get("text", "") for r in v.get("title", {}).get("runs", [])),
                    "canal": (v.get("ownerText", {}).get("runs") or [{}])[0].get("text")}
    return None


def set_video(md_path, url):
    text = md_path.read_text(encoding="utf-8")
    end = text.find("\n---\n", 4)
    fm = text[:end]
    if re.search(r"^video:[ \t]*\S", fm, re.M):
        return False  # já tem link
    if re.search(r"^video:[ \t]*$", fm, re.M):
        fm = re.sub(r"^video:[ \t]*$", f"video: {url}", fm, count=1, flags=re.M)
    else:
        fm = re.sub(r"^(pdf_original:.*)$", rf"\1\nvideo: {url}", fm, count=1, flags=re.M)
    md_path.write_text(fm + text[end:], encoding="utf-8")
    return True


def main():
    args = sys.argv[1:]
    refazer = set(args[args.index("--refazer") + 1:]) if "--refazer" in args else set()
    store = json.loads(STORE.read_text(encoding="utf-8")) if STORE.exists() else {}
    novos = 0
    for md in sorted(ME_DIR.glob("*.md")):
        stem = md.stem
        fm, _ = parse_front_matter(md.read_text(encoding="utf-8"))
        atual = (fm.get("video") or "").strip()
        if atual and stem not in refazer:
            store.setdefault(stem, {"url": atual, "origem": "manual"})
            continue
        if stem in store and stem not in refazer and store[stem].get("url"):
            if set_video(md, store[stem]["url"]):
                novos += 1
            continue
        q = query_for(fm.get("titulo"))
        try:
            r = first_video(q)
        except Exception as e:  # rede / bloqueio: tenta de novo numa próxima execução
            print(f"ERRO {stem}: {e}")
            continue
        if not r:
            print(f"SEM RESULTADO {stem}: {q}")
            continue
        store[stem] = {"busca": q, **r, "origem": "busca"}
        if stem in refazer:
            text = md.read_text(encoding="utf-8")
            md.write_text(re.sub(r"^video:.*$", "video:", text, count=1, flags=re.M), encoding="utf-8")
        set_video(md, r["url"])
        novos += 1
        print(f"{stem}: {r['titulo_video'][:70]} ({r['canal']})")
        STORE.write_text(json.dumps(store, ensure_ascii=False, indent=2), encoding="utf-8")
        time.sleep(1.5)
    STORE.write_text(json.dumps(store, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"{novos} vídeos gravados; {len(store)} normas em {STORE.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
