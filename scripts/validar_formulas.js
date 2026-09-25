// Valida o LaTeX de data/formulas/*.json com o mesmo KaTeX do site.
// Uso: node scripts/validar_formulas.js [stem ...]
const path = require('path'), fs = require('fs');
const ROOT = path.resolve(__dirname, '..');
const katex = require(path.join(ROOT, 'site/vendor/katex/katex.min.js'));
const dir = path.join(ROOT, 'data/formulas');
const only = process.argv.slice(2);
let ok = 0, bad = 0, pend = 0, ign = 0, noImg = 0;
for (const f of fs.readdirSync(dir).filter(f => f.endsWith('.json'))) {
  const stem = f.replace(/\.json$/, '');
  if (only.length && !only.includes(stem)) continue;
  const data = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'));
  for (const [id, eq] of Object.entries(data)) {
    if (!eq.todas && !eq.texto && !fs.existsSync(path.join(ROOT, `markdown/_formulas/${stem}_${id}.png`))) { noImg++; console.log('SEM IMAGEM', stem, id); }
    if (eq.todas || eq.texto) continue;  // correção de texto (DNER), não é fórmula
    if (eq.ignorar) { ign++; continue; }
    // itens {"texto": ...} são frases do texto, não LaTeX
    const parts = (Array.isArray(eq.latex) ? eq.latex : (eq.latex ? [eq.latex] : []))
      .filter(p => typeof p === 'string');
    if (!parts.length) { pend++; continue; }
    for (const p of parts) {
      try { katex.renderToString(p, { displayMode: true, throwOnError: true, strict: 'ignore' }); ok++; }
      catch (e) { bad++; console.log('ERRO', stem, id, e.message.slice(0, 160)); }
    }
  }
}
console.log(`ok=${ok} erro=${bad} pendentes=${pend} ignorados=${ign} sem_imagem=${noImg}`);
