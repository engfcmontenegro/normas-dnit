"""Servidor HTTP local simples, sem cache, para rodar o site em site/index.html.

Também expõe POST /api/save para o modo de edição do site gravar o markdown
editado de volta no disco (só aceita caminhos dentro de markdown/*.md).

Uso: python scripts/serve.py [porta]  (padrão: 8124)
Depois abra http://localhost:8124/site/index.html
"""
import json
import sys
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent


class NoCacheHandler(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-store, no-cache, must-revalidate")
        super().end_headers()

    def do_POST(self):
        if self.path != "/api/save":
            self.send_error(404, "Not found")
            return

        length = int(self.headers.get("Content-Length", 0))
        try:
            payload = json.loads(self.rfile.read(length).decode("utf-8"))
            rel_path = payload["path"]
            content = payload["content"]
        except Exception as ex:
            self._json_response(400, {"ok": False, "error": f"payload inválido: {ex}"})
            return

        target = (ROOT / rel_path).resolve()
        markdown_root = (ROOT / "markdown").resolve()
        if markdown_root not in target.parents or target.suffix != ".md":
            self._json_response(403, {"ok": False, "error": "caminho não permitido"})
            return

        try:
            # preserva o front-matter YAML (metadados) que já existe no
            # arquivo; o editor do site só edita o corpo do markdown
            front_matter = ""
            if target.exists():
                existing = target.read_text(encoding="utf-8")
                if existing.startswith("---\n"):
                    end = existing.find("\n---\n", 4)
                    if end != -1:
                        front_matter = existing[: end + 5] + "\n"
            target.write_text(front_matter + content, encoding="utf-8")
        except Exception as ex:
            self._json_response(500, {"ok": False, "error": str(ex)})
            return

        self._json_response(200, {"ok": True})

    def _json_response(self, status, obj):
        body = json.dumps(obj).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)


def main():
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8124
    handler = partial(NoCacheHandler, directory=str(ROOT))
    server = ThreadingHTTPServer(("localhost", port), handler)  # várias conexões simultâneas
    print(f"Servindo {ROOT} em http://localhost:{port}/site/index.html")
    server.serve_forever()


if __name__ == "__main__":
    main()
