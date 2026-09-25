"""
Valida os planos de controle (data/controle/<stem>.json, um por ES) e empacota em
site/data/controle_data.js -> window.CONTROLE_DATA = [...]

Cada plano:
  {"es": "<id da ES>", "servico": "...", "itens": [
     {"etapa": "materiais|execucao|produto", "grupo": "...", "ensaio": "...",
      "citado": "código como aparece na ES" | null,
      "norma": "<id no acervo>" | null, "norma_atual": "<id da sucessora no acervo>" (opcional),
      "outras": ["<id>", ...] (opcional, alternativas citadas também no acervo),
      "frequencia": "...", "criterio": "...", "condicao": "..." (opcional), "secao": "7.2.1"}],
   "notas": ["..."]}

Uso: python scripts/bundle_controle.py [--so-validar]
"""
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "scripts"))
from dependencias import cancelada, cancelamentos, codigos  # noqa: E402

CANC = cancelamentos()
DIR = ROOT / "data" / "controle"
ETAPAS = ("materiais", "execucao", "produto")
CHAVES = {"etapa", "grupo", "ensaio", "citado", "norma", "norma_atual", "outras",
          "frequencia", "criterio", "condicao", "secao", "obs", "canceladas"}


def main():
    sys.stdout.reconfigure(encoding="utf-8")
    entries = {e["id"]: e for e in json.loads((ROOT / "data" / "normas.json").read_text(encoding="utf-8"))}
    planos, erros = [], []
    for p in sorted(DIR.glob("*.json")):
        try:
            d = json.loads(p.read_text(encoding="utf-8"))
        except json.JSONDecodeError as ex:
            erros.append(f"{p.name}: JSON inválido: {ex}")
            continue
        es = entries.get(d.get("es"))
        if not es or es["tipo"] != "ES":
            erros.append(f"{p.name}: 'es' não é id de ES do acervo: {d.get('es')!r}")
            continue
        if Path(es["md"]).stem != p.stem:
            erros.append(f"{p.name}: nome do arquivo difere do md da ES ({Path(es['md']).stem})")
        for i, it in enumerate(d.get("itens", [])):
            onde = f"{p.name} item {i} ({it.get('ensaio')})"
            if it.get("etapa") not in ETAPAS:
                erros.append(f"{onde}: etapa inválida {it.get('etapa')!r}")
            if set(it) - CHAVES:
                erros.append(f"{onde}: chaves desconhecidas {sorted(set(it) - CHAVES)}")
            for k in ("ensaio", "frequencia", "criterio"):
                if not str(it.get(k) or "").strip():
                    erros.append(f"{onde}: '{k}' vazio")
            for k in ("norma", "norma_atual"):
                if it.get(k) and it[k] not in entries:
                    erros.append(f"{onde}: {k} {it[k]!r} não existe no acervo")
            for o in it.get("outras") or []:
                if o not in entries:
                    erros.append(f"{onde}: outras {o!r} não existe no acervo")
        for it in d.get("itens", []):
            canc = []
            for chave, rot, _ in codigos(it.get("citado") or ""):
                c = cancelada(CANC, chave)
                if c:
                    canc.append({"codigo": rot, "data": c["data"], "sucessoras": c["sucessoras"], "id": c.get("id")})
            if canc:
                it["canceladas"] = canc
            else:
                it.pop("canceladas", None)
        # área da ES (front-matter do markdown), usada no filtro da aba
        m = re.search(r'^area:[ \t]*"?([^"\n]*)', (ROOT / es["md"]).read_text(encoding="utf-8"), re.M)
        d["area"] = (m.group(1).strip() if m else "") or "Outras"
        planos.append(d)
    for e in erros:
        print("ERRO", e)
    n_itens = sum(len(d.get("itens", [])) for d in planos)
    print(f"Planos: {len(planos)}  itens: {n_itens}  erros: {len(erros)}")
    if "--so-validar" in sys.argv:
        return
    (ROOT / "site" / "data" / "controle_data.js").write_text(
        "window.CONTROLE_DATA = " + json.dumps(planos, ensure_ascii=False) + ";\n", encoding="utf-8")


if __name__ == "__main__":
    main()
