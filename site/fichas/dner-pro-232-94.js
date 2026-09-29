/*
 * Ficha: DNER-PRO 232/94 — Tinta para demarcação viária — avaliação do comportamento na pista de rolamento.
 * Trecho de ≈ 1 000 m em tangente, pavimento em boas condições (4.1, 4.2); leituras de desgaste com a grade de madeira
 * adequada à largura da faixa (3.1: 10 cm → 20 quadrados de 5 %; 12 e 15 cm → 30 retículos de 3,3 %): faixas
 * interrompidas — início, meio e fim de cada faixa (7.2 a); contínuas — pontos espaçados de 7 m (7.2 b); retículo com
 * desgaste ≥ 50 % conta inteiro (7.3). Resultado: média das leituras (8.1), comparada com 5.1 (até a metade da vida
 * útil: desgaste ≤ 25 %, cor branca inalterada, amarela com ligeiro escurecimento) e 5.2 (até o fim da vida útil:
 * desgaste ≤ 50 %). Registro da aplicação (6.5) e observações visuais (7.4); histórico das inspeções × idade.
 * Registra-se em window.FE.
 */
(function () {
  "use strict";
  var FE = window.FE, num = FE.num, ok = FE.ok, fmt = FE.fmt, esc = FE.esc;
  var MES = 30.4375;          // dias por mês (idade em meses)
  var TOL_EXT = 0.2;          // "extensão de 1 000 m aproximadamente" (4.2): ± 20 % (critério da ficha)
  var TOL_ESP = 0.5;          // espaçamento de 7 m entre leituras nas faixas contínuas (7.2 b): ± 0,5 m (critério da ficha)
  var SN = [["", "— não informado"], ["sim", "Sim"], ["nao", "Não"]];
  var GRADE = { "10": { n: 20, txt: "50 × 10 cm, 20 quadrados de 5 cm (5 % cada) — 3.1 a" },
    "12": { n: 30, txt: "50 × 12 cm, 30 retângulos de 4 × 5 cm (3,3 % cada) — 3.1 b" },
    "15": { n: 30, txt: "50 × 15 cm, 30 quadrados de 5 cm (3,3 % cada) — 3.1 c" } };
  // registro da aplicação (6.5) — a numeração da norma salta de g) para j)
  var REG = [["a", "a) nome do produto", ""], ["b", "b) nome comercial", ""], ["c", "c) cor da tinta", ""], ["d", "d) natureza química da resina", ""],
    ["e", "e) data de fabricação", ""], ["f", "f) partida de fabricação", ""], ["g", "g) data e hora de aplicação", ""],
    ["tamb", "temperatura ambiente (6.3 — de preferência 15 a 35 °C)", "°C", 1], ["j", "j) umidade relativa do ar (6.3 — ≤ 80 %)", "%", 1],
    ["k", "k) temperatura do pavimento", "°C", 1], ["l", "l) tempo de secagem ao tráfego (6.3 — ≤ 30 min)", "min", 1],
    ["m", "m) velocidade de aplicação da máquina", "km/h", 1], ["n", "n) pressão de aplicação", "", 0], ["o", "o) espessura da película", "µm", 1],
    ["p", "p) quantidade de microesferas de vidro", "g/m²", 1], ["q", "q) contagem de tráfego", "veíc./dia", 1], ["r", "r) tempo de secagem ao toque", "min", 1]];

  function grade(d) { return GRADE[((d && d.params) || {}).largura] || GRADE["10"]; }
  function cont(d) { return ((d && d.params) || {}).tipoFaixa === "continua"; }
  function data(s) {
    s = String(s || "").trim(); var m;
    if ((m = /^(\d{4})-(\d{1,2})-(\d{1,2})/.exec(s))) return Date.UTC(+m[1], m[2] - 1, +m[3]);
    if ((m = /^(\d{1,2})\/(\d{1,2})\/(\d{4})/.exec(s))) return Date.UTC(+m[3], m[2] - 1, +m[1]);
    return NaN;
  }
  function idadeMeses(a, b) { var x = data(a), y = data(b); return ok(x) && ok(y) ? (y - x) / 864e5 / MES : NaN; }
  // limite de desgaste pela idade: {lim, secao, fase} ou null
  function criterio(idade, vida) {
    if (!ok(idade) || !ok(vida) || vida <= 0) return null;
    if (idade <= vida / 2 + 1e-9) return { lim: 25, secao: "5.1", fase: "até a metade da vida útil" };
    if (idade <= vida + 1e-9) return { lim: 50, secao: "5.2", fase: "até o fim da vida útil" };
    return { lim: null, secao: "5.2", fase: "após a vida útil prevista" };
  }

  function graficoHist(pts, vida, opt) {
    opt = opt || {};
    pts = pts.filter(function (p) { return ok(p.x) && ok(p.y); });
    if (!pts.length) return "";
    var W = opt.w || 560, H = opt.h || 240, m = { l: 46, r: 14, t: 22, b: 36 }, imp = opt.imprimir;
    var txt = imp ? "#222" : "var(--text-dim)", grd = imp ? "#ddd" : "var(--border)", cor = imp ? "#1f5fbf" : "#4f8cff", vm = imp ? "#c0392b" : "#e5534b";
    var x1 = Math.max.apply(null, pts.map(function (p) { return p.x; }).concat(ok(vida) ? [vida] : [])) * 1.08 || 1;
    var y1 = Math.max(60, Math.max.apply(null, pts.map(function (p) { return p.y; })) * 1.1);
    function X(v) { return m.l + v / x1 * (W - m.l - m.r); }
    function Y(v) { return H - m.b - v / y1 * (H - m.t - m.b); }
    var s = '<svg class="fe-graf" viewBox="0 0 ' + W + " " + H + '" xmlns="http://www.w3.org/2000/svg" font-family="Arial, sans-serif" font-size="10">' +
      '<text x="' + m.l + '" y="13" fill="' + txt + '" font-weight="bold" font-size="11">Desgaste médio × idade da pintura</text>';
    for (var gy = 0; gy <= y1 + 1e-9; gy += 10) s += '<line x1="' + m.l + '" y1="' + Y(gy) + '" x2="' + (W - m.r) + '" y2="' + Y(gy) + '" stroke="' + grd + '" stroke-width="0.6"/><text x="' + (m.l - 5) + '" y="' + (Y(gy) + 3) + '" text-anchor="end" fill="' + txt + '">' + gy + "</text>";
    var px = x1 > 30 ? 6 : x1 > 12 ? 3 : 1;
    for (var gx = 0; gx <= x1 + 1e-9; gx += px) s += '<line x1="' + X(gx) + '" y1="' + (H - m.b) + '" x2="' + X(gx) + '" y2="' + (H - m.b + 3) + '" stroke="' + txt + '"/><text x="' + X(gx) + '" y="' + (H - m.b + 13) + '" text-anchor="middle" fill="' + txt + '">' + gx + "</text>";
    s += '<rect x="' + m.l + '" y="' + m.t + '" width="' + (W - m.l - m.r) + '" height="' + (H - m.t - m.b) + '" fill="none" stroke="' + txt + '" stroke-width="0.6"/>';
    if (ok(vida) && vida > 0) {
      s += '<path d="M' + X(0) + " " + Y(25) + " H" + X(vida / 2) + " V" + Y(50) + " H" + X(vida) + '" fill="none" stroke="' + vm + '" stroke-width="1.4" stroke-dasharray="6 3"/>' +
        '<text x="' + (X(0) + 4) + '" y="' + (Y(25) - 3) + '" fill="' + vm + '">25 % (5.1)</text><text x="' + (X(vida / 2) + 4) + '" y="' + (Y(50) - 3) + '" fill="' + vm + '">50 % (5.2)</text>' +
        '<line x1="' + X(vida) + '" y1="' + m.t + '" x2="' + X(vida) + '" y2="' + (H - m.b) + '" stroke="' + txt + '" stroke-dasharray="2 3"/><text x="' + (X(vida) - 3) + '" y="' + (m.t + 10) + '" text-anchor="end" fill="' + txt + '">vida útil</text>';
    }
    var ord = pts.slice().sort(function (a, b) { return a.x - b.x; });
    s += '<path d="' + ord.map(function (p, i) { return (i ? "L" : "M") + X(p.x).toFixed(1) + " " + Y(p.y).toFixed(1); }).join(" ") + '" fill="none" stroke="' + cor + '" stroke-width="1" opacity="0.6"/>';
    ord.forEach(function (p) { s += '<circle cx="' + X(p.x).toFixed(1) + '" cy="' + Y(p.y).toFixed(1) + '" r="' + (p.atual ? 4.5 : 3.5) + '" fill="' + (p.fora ? vm : cor) + '"/>'; });
    s += '<text x="' + ((W + m.l) / 2) + '" y="' + (H - 5) + '" text-anchor="middle" fill="' + txt + '">Idade (meses)</text>';
    return s + "</svg>";
  }

  FE.FICHAS["dner-pro-232-94"] = {
    titulo: "Tinta para demarcação viária — Comportamento na pista",
    resumo: "Avaliação do desgaste da pintura na pista com a grade de madeira (20 ou 30 retículos): leituras no início, meio e fim das faixas interrompidas ou a cada 7 m nas contínuas, retículo com ≥ 50 % de desgaste contando inteiro (7.3); resultado = média das leituras (8.1), comparada com 25 % até a metade da vida útil (5.1) e 50 % até o fim (5.2).",
    params: [
      { k: "largura", r: "Largura da faixa de pintura / grade (3.1)", tipo: "select", recarrega: true, opcoes: [["10", "10 cm — grade de 20 quadrados (5 %)"], ["12", "12 cm — grade de 30 retângulos (3,3 %)"], ["15", "15 cm — grade de 30 quadrados (3,3 %)"]] },
      { k: "tipoFaixa", r: "Tipo de faixa (7.2)", tipo: "select", recarrega: true, opcoes: [["interrompida", "Interrompida — início, meio e fim de cada faixa (7.2 a)"], ["continua", "Contínua — leituras a cada 7 m (7.2 b)"]] },
      { k: "cor", r: "Cor da tinta", tipo: "select", opcoes: [["branca", "Branca"], ["amarela", "Amarela"]] },
      { k: "extensao", r: "Extensão do trecho avaliado (m) — ≈ 1 000 m (4.2)" },
      { k: "tangente", r: "Trecho em tangente (4.1 a)", tipo: "select", opcoes: SN },
      { k: "pavBom", r: "Pavimento em boas condições (4.1 b)", tipo: "select", opcoes: SN },
      { k: "represent", r: "Trecho representativo de toda a obra, faixas amostradas ao acaso (4.2 e 7.1)", tipo: "select", opcoes: SN },
      { k: "dataAplic", r: "Data da aplicação (6.5 g)", ph: "aaaa-mm-dd" },
      { k: "dataInsp", r: "Data desta inspeção", ph: "aaaa-mm-dd" },
      { k: "vida", r: "Vida útil prevista (meses) (5.1 e 5.2)", dica: "fixada no projeto/contrato ou na especificação da tinta" },
      { k: "corObs", r: "Coloração (5.1 e 7.4)", tipo: "select", opcoes: [["", "— não observada"], ["inalterada", "Inalterada"], ["ligeiro", "Ligeiro escurecimento"], ["alterada", "Alteração acentuada de cor"]] },
      { k: "microObs", r: "Retenção de microesferas de vidro (7.4)", tipo: "select", opcoes: [["", "— não observada"], ["boa", "Boa"], ["regular", "Regular"], ["deficiente", "Deficiente"]] },
      { k: "outrosObs", r: "Outras modificações de comportamento (7.4 e 6.6)", ph: "descolamento, sujeira, etc." },
    ],
    padrao: { largura: "10", tipoFaixa: "interrompida", cor: "branca" },
    tabelas: function (d) {
      var G = grade(d), T = [];
      if (cont(d)) T.push({ chave: "lei", titulo: "Leituras — faixa contínua, a cada 7 m (7.2 b)", rotulo: "Ponto", iniciais: 6, min: 1,
        linhas: [{ k: "pos", r: "Posição ao longo da faixa", u: "m" }, { k: "n", r: "Retículos desgastados (de " + G.n + "; ≥ 50 % conta inteiro, 7.3)", u: "nº" },
          { calc: "pct", r: "Desgaste", u: "%", casas: 1, destaque: true }],
        dica: "grade " + G.txt });
      else T.push({ chave: "lei", titulo: "Leituras — faixas interrompidas: início, meio e fim (7.2 a)", rotulo: "Faixa", iniciais: 4, min: 1,
        linhas: [{ k: "id", r: "Identificação / posição da faixa", texto: true },
          { grupo: "Retículos desgastados (de " + G.n + "; ≥ 50 % conta inteiro, 7.3)" },
          { k: "ni", r: "Início", u: "nº" }, { k: "nm", r: "Meio", u: "nº" }, { k: "nf", r: "Fim", u: "nº" },
          { grupo: "Desgaste" }, { calc: "pi", r: "Início", u: "%", casas: 1 }, { calc: "pm", r: "Meio", u: "%", casas: 1 }, { calc: "pf", r: "Fim", u: "%", casas: 1 },
          { calc: "med", r: "Média da faixa", u: "%", casas: 1, destaque: true }],
        dica: "grade " + G.txt });
      T.push({ chave: "apl", titulo: "Registro da aplicação (6.3 a 6.5)", rotulo: "Aplicação", iniciais: 1, min: 1, fixo: true, nomes: ["Valor"],
        linhas: REG.map(function (x) { return x[3] ? { k: x[0], r: x[1], u: x[2] } : { k: x[0], r: x[1], u: x[2], texto: true }; }),
        dica: "a numeração de 6.5 salta de g) para j) no original; a temperatura ambiente vem de 6.3" });
      T.push({ chave: "hist", titulo: "Inspeções anteriores do mesmo trecho (opcional)", rotulo: "Inspeção", iniciais: 1, min: 1,
        linhas: [{ k: "data", r: "Data da inspeção", texto: true, ph: "aaaa-mm-dd" }, { k: "des", r: "Desgaste médio (8.1)", u: "%" },
          { calc: "idade", r: "Idade da pintura", u: "meses", casas: 1 }],
        dica: "para acompanhar o desgaste ao longo da vida útil" });
      return T;
    },
    calcular: function (d) {
      var P = d.params || {}, avisos = [], G = grade(d), un = 100 / G.n, vals = [], tab = [], C = cont(d);
      function pct(v, rot) {
        var n = num(v);
        if (!ok(n)) return NaN;
        if (n < 0 || n > G.n) avisos.push(rot + ": " + fmt(n, 1) + " retículos — a grade tem " + G.n + " (3.1).");
        else if (Math.abs(n - Math.round(n)) > 1e-9) avisos.push(rot + ": conte retículos inteiros — desgaste ≥ 50 % do retículo conta inteiro, < 50 % não conta (7.3).");
        return n * un;
      }
      if (C) {
        var posAnt = NaN;
        (d.lei || []).forEach(function (x, i) {
          var o = { pct: pct(x.n, "Ponto " + (i + 1)) }, p = num(x.pos);
          if (ok(o.pct)) vals.push({ v: o.pct, rot: "P" + (i + 1) });
          if (ok(p) && ok(posAnt) && Math.abs(Math.abs(p - posAnt) - 7) > TOL_ESP) avisos.push("Pontos " + i + " e " + (i + 1) + ": espaçamento de " + fmt(Math.abs(p - posAnt), 1) + " m — as leituras são espaçadas de 7 m (7.2 b).");
          if (ok(p)) posAnt = p;
          tab.push(o);
        });
      } else {
        (d.lei || []).forEach(function (x, i) {
          var rot = "Faixa " + (x.id || i + 1), o = { pi: pct(x.ni, rot + " (início)"), pm: pct(x.nm, rot + " (meio)"), pf: pct(x.nf, rot + " (fim)") };
          var tem = [o.pi, o.pm, o.pf].filter(ok);
          o.med = FE.media(tem);
          if (tem.length && tem.length < 3) avisos.push(rot + ": " + tem.length + " leitura(s) — são 3 por faixa, no início, meio e fim (7.2 a).");
          [["pi", "início"], ["pm", "meio"], ["pf", "fim"]].forEach(function (k) { if (ok(o[k[0]])) vals.push({ v: o[k[0]], rot: rot + " " + k[1] }); });
          tab.push(o);
        });
      }
      var r = { G: G, C: C, n: vals.length, vals: vals };
      r.des = FE.media(vals.map(function (x) { return x.v; }));
      r.max = vals.length ? Math.max.apply(null, vals.map(function (x) { return x.v; })) : NaN;
      r.idade = idadeMeses(P.dataAplic, P.dataInsp); r.vida = num(P.vida);
      r.crit = criterio(r.idade, r.vida);
      if (!vals.length) avisos.push("Registre as leituras de desgaste com a grade (7.2).");
      if (ok(r.idade) && r.idade < 0) avisos.push("Data da inspeção anterior à da aplicação — confira.");
      // trecho (capítulo 4)
      var ext = num(P.extensao);
      if (ok(ext) && Math.abs(ext - 1000) > 1000 * TOL_EXT) avisos.push("Trecho de " + fmt(ext, 0) + " m — a norma pede extensão de aproximadamente 1 000 m (4.2; critério da ficha ± 20 %).");
      if (P.tangente === "nao") avisos.push("Trecho fora de tangente — a condição ideal é trecho em tangente (4.1 a).");
      if (P.pavBom === "nao") avisos.push("Pavimento em más condições — a condição ideal é pavimento em boas condições (4.1 b).");
      if (P.represent === "nao") avisos.push("O trecho deve ser representativo de toda a obra e as faixas amostradas ao acaso (4.2 e 7.1).");
      // aplicação (6.3 a 6.5)
      var A = (d.apl || [])[0] || {}, ur = num(A.j), sec = num(A.l), ta = num(A.tamb);
      if (ok(ur) && ur > 80) avisos.push("Umidade relativa do ar de " + fmt(ur, 0) + " % na aplicação — não superior a 80 % (6.3).");
      if (ok(sec) && sec > 30) avisos.push("Tempo de secagem ao tráfego de " + fmt(sec, 0) + " min — a tinta deve secar em 30 minutos, no máximo (6.3).");
      if (ok(ta) && (ta < 15 || ta > 35)) avisos.push("Temperatura ambiente de " + fmt(ta, 0) + " °C na aplicação — de preferência entre 15 °C e 35 °C (6.3).");
      var falta = REG.filter(function (x) { return !String(A[x[0]] || "").trim(); }).map(function (x) { return x[0].length === 1 ? x[0] + ")" : "temp. ambiente"; });
      if (falta.length) avisos.push("Registro da aplicação incompleto (6.5): " + falta.join(", ") + ".");
      // critério (5.1 e 5.2)
      r.sit = "PENDENTE"; r.motivo = "";
      if (!ok(r.des)) r.motivo = "sem leituras de desgaste";
      else if (!r.crit) r.motivo = "informe as datas de aplicação e de inspeção e a vida útil prevista para comparar com 5.1/5.2";
      else if (r.crit.lim === null) { r.sit = "INFORMATIVO"; r.motivo = "idade " + fmt(r.idade, 1) + " meses, além da vida útil prevista de " + fmt(r.vida, 0) + " meses"; }
      else {
        var falhas = [];
        if (r.des > r.crit.lim) falhas.push("desgaste médio " + fmt(r.des, 1) + " % > " + r.crit.lim + " % (" + r.crit.secao + ")");
        if (r.crit.lim === 25) {
          if (P.corObs === "alterada" || (P.cor !== "amarela" && P.corObs === "ligeiro")) falhas.push("cor " + (P.cor === "amarela" ? "amarela com alteração além de ligeiro escurecimento" : "branca alterada") + " (5.1)");
          if (!P.corObs) avisos.push("Registre a coloração: até a metade da vida útil a tinta branca deve permanecer inalterada e a amarela admite ligeiro escurecimento (5.1).");
        }
        r.sit = falhas.length ? "NÃO ATENDE" : "ATENDE";
        r.motivo = "idade " + fmt(r.idade, 1) + " de " + fmt(r.vida, 0) + " meses (" + r.crit.fase + "): " + (falhas.length ? falhas.join("; ") : "desgaste médio " + fmt(r.des, 1) + " % ≤ " + r.crit.lim + " % (" + r.crit.secao + ")");
        if (falhas.length) avisos.push("Não atende: " + falhas.join("; ") + ".");
      }
      if (P.microObs === "deficiente") avisos.push("Retenção de microesferas deficiente (7.4) — registre nas observações.");
      // histórico
      var hist = (d.hist || []).map(function (x) {
        var o = { idade: idadeMeses(P.dataAplic, x.data) }, v = num(x.des);
        if (String(x.data || "").trim() && !ok(data(x.data))) avisos.push("Data \"" + x.data + "\" nas inspeções anteriores: use aaaa-mm-dd ou dd/mm/aaaa.");
        o.des = v;
        return o;
      });
      r.hist = hist;
      r.nAvisos = avisos.length;
      return { tab: { lei: tab, hist: hist }, resultados: r, avisos: avisos };
    },
    resultadosHtml: function (calc) {
      var r = calc.resultados;
      function cx(v, rot, cls) { return '<div class="fe-res-item' + (cls ? " " + cls : "") + '"><div class="fe-res-v">' + v + '</div><div class="fe-res-r">' + rot + "</div></div>"; }
      var cls = r.sit === "ATENDE" ? "fe-ok" : r.sit === "NÃO ATENDE" ? "fe-nok" : "";
      return '<div class="fe-res">' + cx(fmt(r.des, 1) + " <small>%</small>", "Desgaste médio — média de " + r.n + " leitura(s) (8.1)") +
        cx('<span class="' + cls + '">' + esc(r.sit) + "</span>", esc(r.motivo)) +
        cx(fmt(r.max, 1) + " <small>%</small>", "Maior leitura de desgaste", "fe-res-p") +
        cx(ok(r.idade) ? fmt(r.idade, 1) + " <small>meses</small>" : "—", "Idade da pintura" + (ok(r.vida) ? " · vida útil prevista " + fmt(r.vida, 0) + " meses" : ""), "fe-res-p") + "</div>";
    },
    graficos: function (calc, d, opt) {
      var r = calc.resultados, A = FE.aceitacao, out = [];
      if (A && r.vals.length) {
        var lin = [{ y: r.des, tipo: "med", txt: "média " + fmt(r.des, 1) + " %" }];
        if (r.crit && r.crit.lim) lin.push({ y: r.crit.lim, tipo: "lim", txt: "máx. " + r.crit.lim + " % (" + r.crit.secao + ")" });
        var g = A.grafico("Desgaste por leitura (%) — nº da leitura", r.vals.map(function (x, i) { return { x: i + 1, y: x.v, fora: r.crit && r.crit.lim && x.v > r.crit.lim }; }), lin, Object.assign({ linha: false }, opt || {}), "idx");
        if (g) out.push(g);
      }
      var pts = r.hist.map(function (h) { var c = criterio(h.idade, r.vida); return { x: h.idade, y: h.des, fora: c && c.lim && h.des > c.lim }; });
      pts.push({ x: r.idade, y: r.des, atual: true, fora: r.sit === "NÃO ATENDE" });
      var h = graficoHist(pts, r.vida, opt);
      if (h && pts.filter(function (p) { return ok(p.x) && ok(p.y); }).length) out.push(h);
      return out;
    },
    relatorio: {
      notas: "Avaliação conforme a DNER-PRO 232/94. Grade de madeira (3.1): faixa de 10 cm → 20 quadrados de 5 cm (5 % cada); 12 cm → 30 retângulos de 4 × 5 cm; 15 cm → 30 quadrados de 5 cm (3,3 % cada — a ficha usa 100/30 = 3,33 %). Retículo com desgaste ≥ 50 % conta como desgaste total (7.3). Faixas interrompidas: leituras no início, meio e fim de cada faixa (7.2 a); contínuas: a cada 7 m (7.2 b). Resultado: média das leituras no trecho (8.1). Critérios: até a metade da vida útil prevista, desgaste ≤ 25 %, cor branca inalterada e amarela com ligeiro escurecimento admissível (5.1); até o fim da vida útil, desgaste da ordem de 50 %, no máximo (5.2). Critérios da ficha: extensão ≈ 1 000 m = ± 20 %; espaçamento 7 ± 0,5 m; idade em meses de 30,44 dias.",
      resultados: function (calc, d) {
        var r = calc.resultados, P = d.params || {};
        return [["Desgaste médio do trecho (8.1)", (ok(r.des) ? fmt(r.des, 1) + " %" : "—") + " — " + r.n + " leitura(s), faixa " + (r.C ? "contínua" : "interrompida") + ", grade de " + r.G.n + " retículos"],
          ["Avaliação (5.1 / 5.2)", r.sit + (r.motivo ? " — " + r.motivo : "")],
          ["Maior leitura", ok(r.max) ? fmt(r.max, 1) + " %" : "—"],
          ["Coloração (7.4)", ({ inalterada: "inalterada", ligeiro: "ligeiro escurecimento", alterada: "alteração acentuada" })[P.corObs] || "não registrada"],
          ["Retenção de microesferas (7.4)", P.microObs || "não registrada"],
          ["Outras observações (7.4)", P.outrosObs || "—"]];
      },
    },
    exemplos: [
      { nome: "Faixa interrompida de 10 cm, branca, aos 5 meses de 12 — atende (5.1)", dados: function () {
        return { ident: { registro: "EX-PRO232-01", data: "2025-08-12", obra: "Obra A", local: "BR-000, km 10 ao km 11, bordo direito", origem: "Fornecedor A" },
          params: { largura: "10", tipoFaixa: "interrompida", cor: "branca", extensao: "1000", tangente: "sim", pavBom: "sim", represent: "sim",
            dataAplic: "2025-03-10", dataInsp: "2025-08-12", vida: "12", corObs: "inalterada", microObs: "boa", outrosObs: "" },
          lei: [{ id: "km 10+040", ni: "2", nm: "1", nf: "3" }, { id: "km 10+280", ni: "3", nm: "2", nf: "2" }, { id: "km 10+520", ni: "1", nm: "2", nf: "4" },
            { id: "km 10+760", ni: "2", nm: "3", nf: "2" }, { id: "km 10+960", ni: "4", nm: "2", nf: "3" }],
          apl: [{ a: "Tinta para demarcação viária", b: "Produto T-1", c: "Branca", d: "Acrílica base solvente", e: "02/2025", f: "P-0225-07", g: "2025-03-10 09:30",
            tamb: "24", j: "62", k: "31", l: "18", m: "8", n: "90 psi", o: "400", p: "250", q: "4 800", r: "6" }],
          hist: [{ data: "2025-05-12", des: "4,0" }, { data: "2025-06-30", des: "7,5" }] };
      } },
      { nome: "Faixa contínua de 12 cm, amarela, aos 8 meses de 12 — desgaste acima de 50 % (não atende)", dados: function () {
        return { ident: { registro: "EX-PRO232-02", data: "2025-11-20", obra: "Obra B", local: "BR-000, km 52 ao km 52,8, eixo", origem: "Fornecedor B" },
          params: { largura: "12", tipoFaixa: "continua", cor: "amarela", extensao: "800", tangente: "sim", pavBom: "nao", represent: "sim",
            dataAplic: "2025-03-20", dataInsp: "2025-11-20", vida: "12", corObs: "ligeiro", microObs: "deficiente", outrosObs: "Descolamento em placas nas trilhas de roda" },
          lei: [{ pos: "0", n: "15" }, { pos: "7", n: "17" }, { pos: "14", n: "14" }, { pos: "21", n: "18" }, { pos: "28", n: "16" }, { pos: "35", n: "19" },
            { pos: "42", n: "15" }, { pos: "52", n: "17" }, { pos: "59", n: "16,5" }, { pos: "66", n: "18" }],
          apl: [{ a: "Tinta para demarcação viária", b: "Produto T-2", c: "Amarela", d: "Estireno-acrilato base solvente", e: "01/2025", f: "L-12", g: "2025-03-20 14:00",
            tamb: "38", j: "85", k: "52", l: "42", m: "", n: "", o: "380", p: "200", q: "9 500", r: "15" }],
          hist: [{ data: "2025-06-20", des: "21,0" }] };
      } },
    ],
  };
})();
