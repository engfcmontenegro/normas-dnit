"""Orquestra o pipeline completo: metadados -> PDF->MD -> grafo -> pacote do site."""
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
STEPS = ["extract_metadata.py", "pdf_to_md.py", "build_graph.py", "normalizar_me_dner.py", "formulas_dner.py", "tabelas_dner.py", "figuras_dner.py", "bundle_site.py", "bundle_controle.py"]


def main():
    for step in STEPS:
        print(f"\n=== Rodando {step} ===")
        result = subprocess.run([sys.executable, str(ROOT / "scripts" / step)])
        if result.returncode != 0:
            print(f"Falhou em {step}, abortando.")
            sys.exit(result.returncode)
    print("\nBuild completo. Abra site/index.html no navegador.")


if __name__ == "__main__":
    main()
