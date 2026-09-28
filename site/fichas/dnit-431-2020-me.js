/*
 * Ficha: DNIT 431/2020-ME — Misturas asfálticas — Densidade in situ usando densímetro não nuclear.
 * Registra-se no motor de site/fichas.js (window.FE).
 * Calibração (7.4 e 7.5): 5 locais × 5 leituras, CP extraído de cada local (DNIT 428-ME); diferença CP − média do
 * densímetro com resolução de 0,001 g/cm³; se o desvio-padrão das diferenças ≤ 0,04 g/cm³, o fator de ajuste
 * (offset) é a diferença média; senão elimina-se o conjunto de maior diferença da média e recalcula-se (≥ 3 conjuntos).
 * Pontos: cinco leituras (8.4.4, Figura A2), média, densidade corrigida = média + offset, grau de compactação em
 * relação à massa específica aparente de projeto (3.3, 4.1). Opcional: número de passadas do rolo (8.5).
 */
(function () {
  "use strict";
  var FE = window.FE, num = FE.num, ok = FE.ok, fmt = FE.fmt, esc = FE.esc, media = FE.media;
  var NL = 5;
  function r3(x) { return ok(x) ? Math.round(x * 1000) / 1000 : NaN; }  // resolução de 0,001 g/cm³ (7.5.1, 9.3)
  function desvio(v) {
    var m = media(v);
    return v.length > 1 ? Math.sqrt(v.reduce(function (a, x) { return a + (x - m) * (x - m); }, 0) / (v.length - 1)) : NaN;
  }
  function lista(p, pref) {
    var v = [];
    for (var j = 1; j <= NL; j++) { var x = num(p[pref + j]); if (ok(x)) v.push(x); }
    return v;
  }
  function linhasLeituras(pref, rot) {
    var l = [];
    for (var j = 1; j <= NL; j++) l.push({ k: pref + j, r: rot + " " + j + (j === 1 ? " — centro" : " — borda") , u: "g/cm³" });
    return l;
  }

  // 7.5.1 a 7.5.3: offset com eliminação iterativa do conjunto de maior diferença da média
  function offset(itens) {  // itens: [{i, dif}]
    var rest = itens.slice(), elim = [];
    while (rest.length) {
      var ds = rest.map(function (x) { return x.dif; }), m = r3(media(ds)), s = r3(desvio(ds));
      if (rest.length < 3) return { n: rest.length, media: m, sd: s, elim: elim, valido: false };
      if (s <= 0.04 + 1e-12) return { n: rest.length, media: m, sd: s, elim: elim, valido: true };
      if (rest.length === 3) return { n: 3, media: m, sd: s, elim: elim, valido: false };
      var pior = rest.reduce(function (a, x) { return Math.abs(x.dif - m) > Math.abs(a.dif - m) ? x : a; });
      elim.push({ i: pior.i, dif: pior.dif, sd: s });
      rest = rest.filter(function (x) { return x !== pior; });
    }
    return null;
  }

  FE.FICHAS["dnit-431-2020-me"] = {
    titulo: "Misturas asfálticas — Densidade in situ com densímetro não nuclear",
    resumo: "Calibração por correlação com corpos de prova extraídos (fator de ajuste = diferença média CP − densímetro, desvio-padrão ≤ 0,04 g/cm³, 7.5), média de cinco leituras por ponto, densidade corrigida e grau de compactação; número de passadas do rolo opcional (8.5).",
    blocos: [],
    params: [
      { k: "equipamento", r: "Densímetro — marca, modelo e nº de série" },
      { k: "mistura", r: "Mistura asfáltica (tipo, faixa, ligante)", ph: "ex.: concreto asfáltico faixa C, CAP 50/70",
        dica: "a calibração vale para cada mistura (7.1); ligante modificado e agregados diferentes pedem nova calibração (10.1)" },
      { k: "modoOffset", r: "Fator de ajuste (offset)", tipo: "select", recarrega: true,
        opcoes: [["calib", "Calcular pela calibração com CPs extraídos (7.4 e 7.5)"], ["manual", "Informar o fator de uma calibração anterior"]] },
      { k: "offsetMan", r: "Fator de ajuste informado (g/cm³, somado às leituras)", se: function (d) { return (d.params || {}).modoOffset === "manual"; } },
      { k: "calRegistro", r: "Calibração de origem do fator", se: function (d) { return (d.params || {}).modoOffset === "manual"; } },
      { k: "ref", r: "Massa específica aparente de projeto (g/cm³)", dica: "referência do grau de compactação (3.3, 4.1)" },
      { k: "gcMin", r: "Grau de compactação mínimo (%) — opcional", dica: "da especificação de serviço" },
      { k: "gcMax", r: "Grau de compactação máximo (%) — opcional" },
      { k: "passadas", r: "Determinação do número de passadas do rolo (8.5)", tipo: "select", recarrega: true, opcoes: [["nao", "Não"], ["sim", "Sim"]] },
    ],
    padrao: { modoOffset: "calib", passadas: "nao" },
    tabelas: function (d) {
      var P = d.params || {}, tabs = [];
      if (P.modoOffset !== "manual") tabs.push({ chave: "cal", titulo: "Calibração — locais com corpo de prova extraído (7.4 e 7.5)", rotulo: "Local", iniciais: 5, min: 3,
        dica: "área homogênea de 3 m × 1 m recém-compactada, cinco círculos de 40 cm (Figura A1); CP extraído no núcleo do círculo e ensaiado pela DNIT 428-ME",
        linhas: [{ k: "local", r: "Local / círculo", texto: true }, { k: "temp", r: "Temperatura da mistura", u: "°C" }]
          .concat(linhasLeituras("l", "Leitura"))
          .concat([{ calc: "med", r: "Média das leituras do densímetro", u: "g/cm³", casas: 3 },
            { k: "cp", r: "Massa específica aparente do CP extraído (DNIT 428)", u: "g/cm³" },
            { calc: "dif", r: "Diferença = CP − média (7.5.1)", u: "g/cm³", casas: 3, destaque: true },
            { calc: "dm", r: "Afastamento da diferença média", u: "g/cm³", casas: 3 }]) });
      tabs.push({ chave: "pts", titulo: "Locais de ensaio (8.4)", rotulo: "Ponto", iniciais: 4, min: 1,
        dica: "cinco medidas por ponto no padrão da Figura A2 (8.4.4); superfície lisa, seca e varrida; evitar emendas",
        linhas: [{ k: "estaca", r: "Estaca / km (9.1)", texto: true }, { k: "posicao", r: "Posição / afastamento do eixo", texto: true },
          { k: "temp", r: "Temperatura da mistura (9.6, 0,5 °C)", u: "°C" }]
          .concat(linhasLeituras("l", "Leitura"))
          .concat([{ calc: "med", r: "Média das leituras (9.3)", u: "g/cm³", casas: 3 },
            { calc: "corr", r: "Densidade corrigida = média + fator de ajuste (7.5.4)", u: "g/cm³", casas: 3, destaque: true },
            { k: "outro", r: "Densidade por outro método (CP extraído / nuclear) — opcional (9.4)", u: "g/cm³" },
            { calc: "GC", r: "Grau de compactação = corrigida / projeto × 100", u: "%", casas: 1, destaque: true }]) });
      if (P.passadas === "sim") tabs.push({ chave: "pass", titulo: "Número de passadas do rolo (8.5)", rotulo: "Leitura", iniciais: 6, min: 2,
        dica: "1ª coluna: mistura não compactada saindo da vibroacabadora (0 passadas); depois, uma leitura após cada passada",
        linhas: [{ k: "n", r: "Passadas acumuladas", u: "nº" }, { k: "rolo", r: "Rolo (tipo)", texto: true }, { k: "l", r: "Leitura do densímetro", u: "g/cm³" },
          { calc: "corr", r: "Densidade corrigida", u: "g/cm³", casas: 3 }, { calc: "ganho", r: "Ganho em relação à leitura anterior", u: "g/cm³", casas: 3 },
          { calc: "GC", r: "Grau de compactação", u: "%", casas: 1 }] });
      return tabs;
    },
    calcular: function (d) {
      var P = d.params || {}, avisos = [], calib = P.modoOffset !== "manual";
      // ---- calibração ----
      var cal = [], ofs = null, off = NaN;
      if (calib) {
        cal = (d.cal || []).map(function (c, i) {
          var ls = lista(c, "l"), o = { med: ls.length ? r3(media(ls)) : NaN };
          var cp = num(c.cp);
          o.dif = ok(cp) && ok(o.med) ? r3(cp - o.med) : NaN;
          if (ls.length && ls.length < 5) avisos.push("Calibração, local " + (i + 1) + ": " + ls.length + " leitura(s); a norma pede cinco por local (7.4.2).");
          return o;
        });
        var itens = cal.map(function (o, i) { return { i: i, dif: o.dif }; }).filter(function (x) { return ok(x.dif); });
        if (itens.length && itens.length < 5) avisos.push("Calibração com " + itens.length + " locais; a norma marca cinco círculos na área de calibração (7.4.1).");
        if (itens.length) {
          ofs = offset(itens);
          cal.forEach(function (o) { o.dm = ok(o.dif) ? o.dif - ofs.media : NaN; });
          ofs.elim.forEach(function (x) {
            cal[x.i].elim = true;
            avisos.push("Calibração: desvio-padrão das diferenças de " + fmt(x.sd, 3) + " g/cm³ (> 0,04): eliminado o local " + (x.i + 1) +
              " (diferença " + fmt(x.dif, 3) + " g/cm³, a mais afastada da média) e refeito o cálculo (7.5.3).");
          });
          if (ofs.valido) off = ofs.media;
          else avisos.push("Calibração inválida: desvio-padrão das diferenças de " + fmt(ofs.sd, 3) + " g/cm³ com " + ofs.n +
            " conjuntos — são necessários pelo menos 3 conjuntos com desvio ≤ 0,04 g/cm³ (7.5.2 e 7.5.3). Refaça a calibração.");
        } else avisos.push("Preencha a calibração (leituras e massa específica dos CPs extraídos) para obter o fator de ajuste (7.4 e 7.5).");
      } else {
        off = num(P.offsetMan);
        if (!ok(off)) avisos.push("Informe o fator de ajuste (offset) da calibração desta mistura (7.5.4).");
      }
      // ---- pontos ----
      var ref = num(P.ref), gcMin = num(P.gcMin), gcMax = num(P.gcMax);
      if (!ok(ref)) avisos.push("Informe a massa específica aparente de projeto para o grau de compactação.");
      function gc(x) { return ok(x) && ok(ref) && ref > 0 ? x / ref * 100 : NaN; }
      var pts = (d.pts || []).map(function (p, i) {
        var ls = lista(p, "l"), o = { med: ls.length ? r3(media(ls)) : NaN }, msgs = [], rot = "Ponto " + (i + 1) + (p.estaca ? " (" + p.estaca + ")" : "");
        o.corr = ok(o.med) && ok(off) ? r3(o.med + off) : NaN;
        o.GC = gc(o.corr);
        o.outro = num(p.outro);
        if (ls.length && ls.length < 5) msgs.push(ls.length + " leitura(s); recomenda-se cinco por ponto (8.4.4)");
        if (ok(o.med) && !ok(num(p.temp))) msgs.push("anote a temperatura da mistura (9.6)");
        if (ok(o.GC) && ok(gcMin) && o.GC < gcMin) msgs.push("GC = " + fmt(o.GC, 1) + " %, abaixo do mínimo de " + fmt(gcMin, 1) + " %");
        if (ok(o.GC) && ok(gcMax) && o.GC > gcMax) msgs.push("GC = " + fmt(o.GC, 1) + " %, acima do máximo de " + fmt(gcMax, 1) + " %");
        if (msgs.length) avisos.push(rot + ": " + msgs.join("; ") + ".");
        o.estaca = p.estaca || ""; o.posicao = p.posicao || ""; o.temp = num(p.temp);
        o.conforme = ok(o.GC) && (ok(gcMin) || ok(gcMax)) ? (!ok(gcMin) || o.GC >= gcMin) && (!ok(gcMax) || o.GC <= gcMax) : null;
        return o;
      });
      // ---- passadas (8.5) ----
      var pass = [], nPass = null;
      if (P.passadas === "sim") {
        var ant = NaN;
        pass = (d.pass || []).map(function (x) {
          var l = num(x.l), o = { n: num(x.n), corr: ok(l) && ok(off) ? r3(l + off) : NaN };
          var base = ok(off) ? o.corr : l;
          o.ganho = ok(base) && ok(ant) ? base - ant : NaN;
          o.GC = gc(o.corr);
          if (ok(base)) ant = base;
          return o;
        });
        // a densidade "não mais aumenta": primeira leitura sem ganho → o número de passadas é o da leitura anterior (8.5.3)
        for (var k = 1; k < pass.length; k++) {
          if (ok(pass[k].ganho) && pass[k].ganho <= 0) { nPass = { n: pass[k - 1].n, conf: pass[k].n, dens: ok(pass[k - 1].corr) ? pass[k - 1].corr : num((d.pass[k - 1] || {}).l), GC: pass[k - 1].GC }; break; }
        }
        if (pass.filter(function (o) { return ok(o.ganho); }).length && !nPass) avisos.push("Passadas do rolo: a densidade ainda aumentava na última leitura — continue até que não aumente mais (8.5.3).");
      }
      var val = pts.map(function (o) { return o.corr; }).filter(ok);
      return { tab: { cal: cal, pts: pts, pass: pass }, pontos: pts,
        resultados: { off: off, ofs: ofs, calib: calib, ref: ref, gcMin: gcMin, gcMax: gcMax, pts: pts, nPass: nPass,
          dMedia: media(val), gcMedio: media(pts.map(function (o) { return o.GC; })), n: val.length }, avisos: avisos };
    },
    resultadosHtml: function (calc) {
      var r = calc.resultados, o = r.ofs;
      function cx(v, rot, p) { return '<div class="fe-res-item"><div class="fe-res-v' + (p ? " fe-res-p" : "") + '">' + v + '</div><div class="fe-res-r">' + rot + "</div></div>"; }
      var h = '<div class="fe-res">' +
        cx(ok(r.off) ? (r.off >= 0 ? "+" : "") + fmt(r.off, 3) + " <small>g/cm³</small>" : "—",
          "Fator de ajuste (offset)" + (r.calib ? (o ? " — " + o.n + " conjuntos, desvio-padrão " + fmt(o.sd, 3) + " g/cm³" +
            (o.valido ? ' · <span class="fe-ok">≤ 0,04</span>' : ' · <span class="fe-nok">calibração inválida</span>') : "") : " — informado"), true) +
        cx(fmt(r.dMedia, 3) + " <small>g/cm³</small>", "Densidade in situ corrigida — média de " + r.n + " ponto(s)") +
        cx(fmt(r.gcMedio, 1) + " <small>%</small>", "Grau de compactação médio (projeto " + fmt(r.ref, 3) + " g/cm³" +
          (ok(r.gcMin) || ok(r.gcMax) ? "; faixa " + (ok(r.gcMin) ? fmt(r.gcMin, 1) : "—") + " a " + (ok(r.gcMax) ? fmt(r.gcMax, 1) : "—") + " %" : "") + ")");
      if (r.nPass) h += cx(fmt(r.nPass.n, 0) + " <small>passadas</small>", "Densidade estabilizada em " + fmt(r.nPass.dens, 3) + " g/cm³ (sem ganho na passada " + fmt(r.nPass.conf, 0) + ", 8.5.3)", true);
      h += "</div>";
      var linhas = r.pts.map(function (p, i) {
        var s = p.conforme === null ? "—" : p.conforme ? '<span class="fe-ok">conforme</span>' : '<span class="fe-nok">fora</span>';
        return "<tr><td>" + (i + 1) + "</td><td>" + esc(p.estaca) + "</td><td>" + esc(p.posicao) + "</td><td>" + fmt(p.temp, 1) + "</td><td>" + fmt(p.med, 3) +
          "</td><td><b>" + fmt(p.corr, 3) + "</b></td><td>" + fmt(p.GC, 1) + "</td><td>" + s + "</td></tr>";
      }).join("");
      return h + '<table class="fe-resumo"><thead><tr><th>Ponto</th><th>Estaca</th><th>Posição</th><th>T (°C)</th><th>Média lida</th><th>Corrigida (g/cm³)</th><th>GC (%)</th><th>Situação</th></tr></thead><tbody>' +
        linhas + "</tbody></table>";
    },
    graficos: function (calc, d, opt) {
      var g = [grafCalib(calc, opt || {})];
      if ((d.params || {}).passadas === "sim") g.push(grafPassadas(calc, d, opt || {}));
      return g;
    },
    relatorio: {
      notas: "Diferenças, média e desvio-padrão (amostral, n − 1) com resolução de 0,001 g/cm³ (7.5.1); fator de ajuste = diferença média quando o desvio-padrão ≤ 0,04 g/cm³ (7.5.2), senão elimina-se o conjunto com maior diferença da média e recalcula-se, com no mínimo 3 conjuntos (7.5.3). " +
        "Densidade corrigida = média das leituras + fator de ajuste; grau de compactação = densidade corrigida / massa específica aparente de projeto × 100 (3.3). Comparações com CPs extraídos a cada 1.000 m³ ou 10 dias de serviço por frente (10.4).",
      resultados: function (calc, d) {
        var r = calc.resultados, P = d.params || {}, rows = [];
        if (P.mistura) rows.push(["Mistura", P.mistura]);
        rows.push(["Fator de ajuste (offset)", ok(r.off) ? (r.off >= 0 ? "+" : "") + fmt(r.off, 3) + " g/cm³" + (r.ofs ? " — " + r.ofs.n + " conjuntos, desvio-padrão " + fmt(r.ofs.sd, 3) + " g/cm³" +
          (r.ofs.elim.length ? "; eliminado(s): local " + r.ofs.elim.map(function (x) { return x.i + 1; }).join(", ") : "") : " — " + (P.calRegistro || "informado")) : "— (calibração inválida ou ausente)"]);
        rows.push(["Massa específica aparente de projeto", fmt(r.ref, 3) + " g/cm³"]);
        r.pts.forEach(function (p, i) {
          rows.push(["Ponto " + (i + 1) + (p.estaca ? " — " + p.estaca : "") + (p.posicao ? " (" + p.posicao + ")" : ""),
            "média " + fmt(p.med, 3) + " · corrigida " + fmt(p.corr, 3) + " g/cm³ · GC = " + fmt(p.GC, 1) + " %" + (ok(p.outro) ? " · outro método " + fmt(p.outro, 3) + " g/cm³" : "") +
            (p.conforme === null ? "" : p.conforme ? " · conforme" : " · FORA DO LIMITE")]);
        });
        rows.push(["Densidade corrigida média / GC médio", fmt(r.dMedia, 3) + " g/cm³ / " + fmt(r.gcMedio, 1) + " %"]);
        if (r.nPass) rows.push(["Número de passadas do rolo (8.5)", fmt(r.nPass.n, 0) + " passadas — densidade " + fmt(r.nPass.dens, 3) + " g/cm³"]);
        return rows;
      },
    },
    exemplos: [
      { nome: "Concreto asfáltico faixa C — calibração com 5 CPs e 6 pontos (dados gerados)", dados: function () {
        var OFF = 0.052;
        var dl = [[0.004, -0.006, 0.002, 0.008, -0.003], [-0.005, 0.003, 0.006, -0.002, -0.001], [0.002, 0.005, -0.007, 0.001, -0.004],
          [-0.003, -0.002, 0.004, 0.006, -0.005], [0.006, -0.004, -0.001, 0.003, 0.001]];
        // [local, T, média-alvo das leituras, massa específica do CP]
        var cal = [["C1", 62, 2.318, 2.371], ["C2", 61, 2.305, 2.349], ["C3", 60, 2.326, 2.384], ["C4", 60, 2.311, 2.366], ["C5", 59, 2.297, 2.345]];
        var pts = [["20+00", "LD, 1,0 m do eixo", 55.5, 2.338], ["20+10", "LE, 2,5 m", 54.0, 2.330], ["20+20", "LD, 2,5 m", 52.5, 2.345],
          ["20+30", "LE, 1,0 m", 51.0, 2.327], ["20+40", "LD, 1,0 m", 50.5, 2.341], ["20+50", "LE, 2,5 m", 49.0, 2.334]];
        function leit(m, k) { var o = {}; for (var j = 0; j < 5; j++) o["l" + (j + 1)] = fmt(m + dl[k % 5][j], 3); return o; }
        return { ident: { registro: "EX-DNN-001", data: "2026-09-10", obra: "Obra A", trecho: "BR-000 — km 40, faixa direita", camada: "Revestimento — concreto asfáltico 5 cm", origem: "Usina A", laboratorista: "Equipe de campo" },
          params: { equipamento: "Densímetro não nuclear — modelo Z, nº de série 0000", mistura: "Concreto asfáltico faixa C, CAP 50/70", modoOffset: "calib",
            ref: "2,391", gcMin: "97", gcMax: "101", passadas: "nao" },
          cal: cal.map(function (c, k) { return Object.assign({ local: c[0], temp: String(c[1]), cp: fmt(c[3], 3) }, leit(c[2], k)); }),
          pts: pts.map(function (p, k) { return Object.assign({ estaca: p[0], posicao: p[1], temp: fmt(p[2], 1) }, leit(p[3] - OFF, k + 2)); }) };
      } },
      { nome: "Camada de ligação — calibração com local discrepante, passadas do rolo, ponto abaixo do mínimo (dados gerados)", dados: function () {
        var dl = [[0.004, -0.006, 0.002, 0.008, -0.003], [-0.005, 0.003, 0.006, -0.002, -0.001], [0.002, 0.005, -0.007, 0.001, -0.004],
          [-0.003, -0.002, 0.004, 0.006, -0.005], [0.006, -0.004, -0.001, 0.003, 0.001]];
        // o local L4 teve o CP extraído sobre uma emenda: diferença muito maior que as demais
        var cal = [["L1", 70, 2.284, 2.321], ["L2", 68, 2.271, 2.312], ["L3", 69, 2.290, 2.325], ["L4", 67, 2.262, 2.401], ["L5", 66, 2.279, 2.318]];
        var pts = [["35+00", "LD, 1,5 m", 63.0, 2.301], ["35+10", "LE, 1,5 m", 61.5, 2.254], ["35+20", "LD, 1,5 m", 60.0, 2.298]];
        var pass = [[0, "vibroacabadora", 2.105], [2, "pneus", 2.196], [4, "pneus", 2.241], [6, "pneus", 2.262], [8, "liso vibratório", 2.268], [10, "liso vibratório", 2.266]];
        function leit(m, k) { var o = {}; for (var j = 0; j < 5; j++) o["l" + (j + 1)] = fmt(m + dl[k % 5][j], 3); return o; }
        return { ident: { registro: "EX-DNN-002", data: "2026-09-24", obra: "Obra B", trecho: "Rua A", camada: "Camada de ligação — binder 6 cm", origem: "Usina A" },
          params: { equipamento: "Densímetro não nuclear — modelo Z, nº de série 0000", mistura: "Binder faixa B, CAP 50/70", modoOffset: "calib",
            ref: "2,352", gcMin: "97", gcMax: "101", passadas: "sim" },
          obs: "CP do local L4 extraído sobre a emenda longitudinal (NOTA 5) — conjunto eliminado pelo critério de 7.5.3. Estaca 35+10: segregação visível; recompactar.",
          cal: cal.map(function (c, k) { return Object.assign({ local: c[0], temp: String(c[1]), cp: fmt(c[3], 3) }, leit(c[2], k)); }),
          pts: pts.map(function (p, k) { return Object.assign({ estaca: p[0], posicao: p[1], temp: fmt(p[2], 1) }, leit(p[3] - 0.039, k + 1)); }),
          pass: pass.map(function (x) { return { n: String(x[0]), rolo: x[1], l: fmt(x[2], 3) }; }) };
      } },
    ],
  };

  // ---------- gráficos ----------
  function cores(opt) {
    var imp = opt.imprimir;
    return { txt: imp ? "#222" : "var(--text-dim)", grade: imp ? "#ddd" : "var(--border)", a: imp ? "#1f5fbf" : "#4f8cff", b: imp ? "#c0392b" : "#e5534b", c: imp ? "#2e8b57" : "#34c38f" };
  }
  // correlação: média do densímetro × massa específica do CP, com a reta y = x + offset
  function grafCalib(calc, opt) {
    var cal = (calc.tab.cal || []).map(function (o, i) { return { o: o, i: i }; }).filter(function (x) { return ok(x.o.med) && ok(x.o.dif); });
    if (!cal.length) return '<div class="fe-graf-vazio">A correlação aparece com as leituras e os CPs da calibração.</div>';
    var c = cores(opt), W = opt.w || 560, H = opt.h || 300, m = { l: 56, r: 16, t: 16, b: 42 }, off = calc.resultados.off;
    var xs = cal.map(function (x) { return x.o.med; }), ys = cal.map(function (x) { return x.o.med + x.o.dif; });
    var all = xs.concat(ys), lo = Math.floor((Math.min.apply(null, all) - 0.02) * 100) / 100, hi = Math.ceil((Math.max.apply(null, all) + 0.02) * 100) / 100;
    function X(v) { return m.l + (v - lo) / (hi - lo) * (W - m.l - m.r); }
    function Y(v) { return H - m.b - (v - lo) / (hi - lo) * (H - m.t - m.b); }
    var s = '<svg class="fe-graf" viewBox="0 0 ' + W + " " + H + '" xmlns="http://www.w3.org/2000/svg" font-family="Arial, sans-serif" font-size="10.5">';
    var st = (hi - lo) > 0.2 ? 0.05 : 0.02;
    for (var v = Math.ceil(lo / st) * st; v <= hi + 1e-9; v += st) {
      s += '<line x1="' + X(v) + '" y1="' + m.t + '" x2="' + X(v) + '" y2="' + (H - m.b) + '" stroke="' + c.grade + '" stroke-width="0.6"/>';
      s += '<line x1="' + m.l + '" y1="' + Y(v) + '" x2="' + (W - m.r) + '" y2="' + Y(v) + '" stroke="' + c.grade + '" stroke-width="0.6"/>';
      s += '<text x="' + X(v) + '" y="' + (H - m.b + 14) + '" text-anchor="middle" fill="' + c.txt + '">' + fmt(v, 2) + "</text>";
      s += '<text x="' + (m.l - 5) + '" y="' + (Y(v) + 4) + '" text-anchor="end" fill="' + c.txt + '">' + fmt(v, 2) + "</text>";
    }
    s += '<text x="' + ((W + m.l) / 2) + '" y="' + (H - 8) + '" text-anchor="middle" fill="' + c.txt + '">Média das leituras do densímetro (g/cm³)</text>';
    s += '<text transform="translate(13 ' + ((H - m.b + m.t) / 2) + ') rotate(-90)" text-anchor="middle" fill="' + c.txt + '">CP extraído (g/cm³)</text>';
    s += '<line x1="' + X(lo) + '" y1="' + Y(lo) + '" x2="' + X(hi) + '" y2="' + Y(hi) + '" stroke="' + c.txt + '" stroke-dasharray="3 3"/>';
    if (ok(off)) {
      s += '<line x1="' + X(lo) + '" y1="' + Y(lo + off) + '" x2="' + X(hi - off) + '" y2="' + Y(hi) + '" stroke="' + c.a + '" stroke-width="1.6"/>';
      s += '<text x="' + (m.l + 8) + '" y="' + (m.t + 12) + '" fill="' + c.a + '">CP = leitura ' + (off >= 0 ? "+ " : "− ") + fmt(Math.abs(off), 3) + " (fator de ajuste)</text>";
    }
    cal.forEach(function (x) {
      var el = x.o.elim, cx = X(x.o.med), cy = Y(x.o.med + x.o.dif);
      s += '<circle cx="' + cx.toFixed(1) + '" cy="' + cy.toFixed(1) + '" r="4.5" fill="' + (el ? "none" : c.a) + '" stroke="' + (el ? c.b : c.a) + '" stroke-width="1.6"/>';
      s += '<text x="' + (cx + 7).toFixed(1) + '" y="' + (cy + 4).toFixed(1) + '" fill="' + (el ? c.b : c.txt) + '">' + (x.i + 1) + (el ? " (eliminado)" : "") + "</text>";
    });
    return s + "</svg>";
  }
  function grafPassadas(calc, d, opt) {
    var ps = (calc.tab.pass || []).map(function (o, i) { return { n: o.n, v: ok(o.corr) ? o.corr : num(((d.pass || [])[i] || {}).l) }; }).filter(function (x) { return ok(x.n) && ok(x.v); });
    if (ps.length < 2) return '<div class="fe-graf-vazio">A curva de compactação pelo rolo aparece com duas ou mais leituras.</div>';
    var c = cores(opt), W = opt.w || 560, H = opt.h || 260, m = { l: 56, r: 16, t: 16, b: 42 }, r = calc.resultados;
    var nMax = Math.max.apply(null, ps.map(function (x) { return x.n; })), vs = ps.map(function (x) { return x.v; });
    var lo = Math.floor((Math.min.apply(null, vs) - 0.01) * 50) / 50, hi = Math.ceil((Math.max.apply(null, vs.concat(ok(r.ref) ? [r.ref] : [])) + 0.01) * 50) / 50;
    function X(v) { return m.l + v / (nMax || 1) * (W - m.l - m.r); }
    function Y(v) { return H - m.b - (v - lo) / (hi - lo) * (H - m.t - m.b); }
    var s = '<svg class="fe-graf" viewBox="0 0 ' + W + " " + H + '" xmlns="http://www.w3.org/2000/svg" font-family="Arial, sans-serif" font-size="10.5">';
    for (var v = lo; v <= hi + 1e-9; v += 0.02) {
      s += '<line x1="' + m.l + '" y1="' + Y(v) + '" x2="' + (W - m.r) + '" y2="' + Y(v) + '" stroke="' + c.grade + '" stroke-width="0.6"/>';
      s += '<text x="' + (m.l - 5) + '" y="' + (Y(v) + 4) + '" text-anchor="end" fill="' + c.txt + '">' + fmt(v, 2) + "</text>";
    }
    ps.forEach(function (x) { s += '<text x="' + X(x.n) + '" y="' + (H - m.b + 14) + '" text-anchor="middle" fill="' + c.txt + '">' + fmt(x.n, 0) + "</text>"; });
    s += '<text x="' + ((W + m.l) / 2) + '" y="' + (H - 8) + '" text-anchor="middle" fill="' + c.txt + '">Passadas do rolo (acumuladas)</text>';
    s += '<text transform="translate(13 ' + ((H - m.b + m.t) / 2) + ') rotate(-90)" text-anchor="middle" fill="' + c.txt + '">Densidade (g/cm³)</text>';
    if (ok(r.ref)) {
      [[r.ref * (ok(r.gcMin) ? r.gcMin : 100) / 100, (ok(r.gcMin) ? "GC " + fmt(r.gcMin, 0) + " %" : "projeto")]].forEach(function (L) {
        s += '<line x1="' + m.l + '" y1="' + Y(L[0]) + '" x2="' + (W - m.r) + '" y2="' + Y(L[0]) + '" stroke="' + c.c + '" stroke-dasharray="6 3"/>';
        s += '<text x="' + (W - m.r - 4) + '" y="' + (Y(L[0]) - 4) + '" text-anchor="end" fill="' + c.c + '">' + L[1] + "</text>";
      });
    }
    s += '<path d="' + ps.map(function (x, k) { return (k ? "L" : "M") + X(x.n).toFixed(1) + " " + Y(x.v).toFixed(1); }).join(" ") + '" fill="none" stroke="' + c.a + '" stroke-width="1.8"/>';
    ps.forEach(function (x) { s += '<circle cx="' + X(x.n).toFixed(1) + '" cy="' + Y(x.v).toFixed(1) + '" r="3.5" fill="' + c.a + '"/>'; });
    if (r.nPass) s += '<line x1="' + X(r.nPass.n) + '" y1="' + m.t + '" x2="' + X(r.nPass.n) + '" y2="' + (H - m.b) + '" stroke="' + c.b + '" stroke-dasharray="3 3"/>' +
      '<text x="' + (X(r.nPass.n) - 4) + '" y="' + (m.t + 12) + '" text-anchor="end" fill="' + c.b + '">' + fmt(r.nPass.n, 0) + " passadas</text>";
    return s + "</svg>";
  }
})();
