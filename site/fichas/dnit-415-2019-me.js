/*
 * Ficha: DNIT 415/2019-ME — Teor de vazios de agregados miúdos não compactados (angularidade do agregado miúdo, FAA).
 * Calibração da proveta (5): V = M / D (M = massa de água, D = densidade da água na temperatura).
 * U = (V − F / Gsb) / V × 100 (eq. 1); média de duas determinações; Método A → Us, Método B → U1, U2, U3 e
 * Um = (U1 + U2 + U3) / 3, Método C → UR; resultados com 0,1 % (9).
 * Registra-se no motor de site/fichas.js (window.FE).
 */
(function () {
  "use strict";
  var FE = window.FE, num = FE.num, ok = FE.ok, fmt = FE.fmt, esc = FE.esc, media = FE.media;

  // densidade da água (g/cm³) entre 18 °C e 24 °C (faixa de 5 a)
  var AGUA = [[18, 0.998595], [19, 0.998405], [20, 0.998203], [21, 0.997992], [22, 0.997770], [23, 0.997538], [24, 0.997296]];
  function densAgua(t) { return ok(t) ? FE.interpolar(AGUA, Math.max(18, Math.min(24, t))) : NaN; }
  // Tabela 1 (Método A): frações e massas (± 0,2 g)
  var TAB1 = [["2,36 → 1,18 mm", 44], ["1,18 → 0,600 mm", 57], ["0,600 → 0,300 mm", 72], ["0,300 → 0,150 mm", 17]];
  var FRAC_B = ["2,36 → 1,18 mm", "1,18 → 0,600 mm", "0,600 → 0,300 mm"];
  var METODOS = [["A", "A — granulometria padrão (Tabela 1)"], ["B", "B — frações individuais (Tabela 2)"], ["C", "C — graduação como recebida (passa 4,75, retido 0,075 mm)"]];
  var LIM_REP = 0.94;  // Tabela 3: faixa entre duas determinações do mesmo operador (valor dos EUA, Método C)

  function metodo(d) { var m = (d.params || {}).metodo; return m === "A" || m === "B" ? m : "C"; }
  function r1(x) { return ok(x) ? Math.round(x * 10) / 10 : NaN; }

  FE.FICHAS["dnit-415-2019-me"] = {
    titulo: "Teor de vazios de agregado miúdo não compactado (angularidade)",
    resumo: "Amostra de 190 g cai livremente do funil na proveta de ~100 ml calibrada; U = (V − F / Gsb) / V × 100; média de duas determinações (Us no Método A, U1, U2, U3 e Um no Método B, UR no Método C), com 0,1 %.",
    blocos: [],
    params: [
      { k: "metodo", r: "Método (6)", tipo: "select", recarrega: true, opcoes: METODOS },
      { k: "gsb", r: "Densidade aparente Gsb do agregado miúdo (DNIT 411)", ph: "ex.: 2,650",
        dica: "usada em todas as determinações, salvo Gsb por fração informada na tabela (6.5)" },
      { k: "volume", r: "Volume da proveta já calibrada (ml) — opcional", dica: "usado se a calibração abaixo não for preenchida" },
      { k: "minimo", r: "Teor de vazios mínimo exigido (%) — opcional", dica: "da especificação de projeto (ex.: ≥ 45 %)" },
    ],
    padrao: { metodo: "C" },
    tabelas: function (d) {
      var met = metodo(d), n = met === "B" ? 6 : 2;
      if (Array.isArray(d.det)) { while (d.det.length < n) d.det.push({}); if (d.det.length > n) d.det.length = n; }
      var tabs = [{
        chave: "calib", titulo: "Calibração da proveta (5)", rotulo: "", iniciais: 1, min: 1, fixo: true, nomes: ["Proveta"],
        dica: "água destilada a 18–24 °C; placa de vidro sem bolhas",
        linhas: [
          { k: "m0", r: "Proveta + vaselina + placa de vidro", u: "g" },
          { k: "m1", r: "Proveta + vaselina + placa + água", u: "g" },
          { k: "t", r: "Temperatura da água", u: "°C" },
          { calc: "M", r: "Massa de água M", u: "g", casas: 1 },
          { calc: "D", r: "Densidade da água D", u: "g/cm³", casas: 5 },
          { calc: "V", r: "Volume V = M / D (0,1 ml)", u: "ml", casas: 1, destaque: true },
          { k: "mp", r: "Proveta limpa, seca e vazia", u: "g" },
        ],
      }];
      if (met === "A") {
        if (Array.isArray(d.comp)) { while (d.comp.length < 4) d.comp.push({}); if (d.comp.length > 4) d.comp.length = 4; }
        tabs.push({ chave: "comp", titulo: "Composição da amostra — Método A (Tabela 1)", rotulo: "Fração", iniciais: 4, min: 4, fixo: true,
          nomes: TAB1.map(function (f) { return f[0]; }), dica: "tolerância de ± 0,2 g em cada fração (6.4.1)",
          linhas: [{ calc: "alvo", r: "Massa da Tabela 1", u: "g", casas: 0 }, { k: "m", r: "Massa pesada", u: "g" }, { calc: "dif", r: "Diferença", u: "g", casas: 1 }] });
      }
      var nomes = met === "B" ? [].concat.apply([], FRAC_B.map(function (f, i) { return ["U" + (i + 1) + " — " + f + " (1)", "U" + (i + 1) + " (2)"]; })) : ["1", "2"];
      var L = [];
      if (met !== "A") L.push({ k: "ma", r: "Massa da amostra ensaiada (190 ± 1 g)", u: "g" });
      if (met === "B") L.push({ k: "gsb", r: "Gsb da fração — opcional (6.5)", u: "", padrao: "gsb" });
      L.push({ k: "mt", r: "Proveta + agregado (7 a)", u: "g" }, { calc: "F", r: "Massa do agregado F = bruta − proveta", u: "g", casas: 1 },
        { calc: "U", r: "U = (V − F / Gsb) / V × 100 (eq. 1)", u: "%", casas: 2, destaque: true });
      tabs.push({ chave: "det", titulo: "Determinações (7 e 8)", rotulo: "Det.", iniciais: n, min: n, fixo: true, nomes: nomes,
        dica: "recombine a amostra e repita; massas com precisão de 0,1 g", linhas: L });
      return tabs;
    },
    calcular: function (d) {
      var P = d.params || {}, met = metodo(d), avisos = [];
      var c = (d.calib || [])[0] || {}, m0 = num(c.m0), m1 = num(c.m1), t = num(c.t), mp = num(c.mp);
      var M = ok(m0) && ok(m1) ? m1 - m0 : NaN, D = densAgua(t), V = ok(M) && ok(D) ? r1(M / D) : NaN;
      if (ok(t) && (t < 18 || t > 24)) avisos.push("Água de calibração a " + fmt(t, 1) + " °C, fora de 18 a 24 °C (5 a).");
      if (!ok(V) && ok(num(P.volume))) V = num(P.volume);
      if (ok(V) && (V < 90 || V > 110)) avisos.push("Volume da proveta de " + fmt(V, 1) + " ml — a proveta tem aproximadamente 100 ml (4 a); confira.");
      if (!ok(V)) avisos.push("Informe a calibração da proveta (ou o volume já calibrado) para calcular U.");
      if (!ok(mp)) avisos.push("Informe a massa da proveta limpa, seca e vazia (5 a, 7 c).");
      var gsb = num(P.gsb);
      if (!ok(gsb)) avisos.push("Informe a densidade aparente Gsb do agregado miúdo (DNIT 411/2019-ME, 6.5).");
      else if (gsb < 2 || gsb > 3.2) avisos.push("Gsb = " + fmt(gsb, 3) + " fora do usual para agregado mineral — confira.");
      var comp = null;
      if (met === "A") {
        var soma = 0, nC = 0;
        comp = TAB1.map(function (f, i) {
          var m = num(((d.comp || [])[i] || {}).m), dif = ok(m) ? m - f[1] : NaN;
          if (ok(dif) && Math.abs(dif) > 0.2 + 1e-9) avisos.push("Fração " + f[0] + ": " + fmt(m, 1) + " g (Tabela 1: " + f[1] + " ± 0,2 g).");
          if (ok(m)) { soma += m; nC++; }
          return { alvo: f[1], dif: dif };
        });
        if (nC === 4 && Math.abs(soma - 190) > 0.8 + 1e-9) avisos.push("Soma das frações = " + fmt(soma, 1) + " g (190 g, Tabela 1).");
      }
      var gsbFr = [];
      var det = (d.det || []).map(function (x, i) {
        var mt = num(x.mt), ma = num(x.ma), g = met === "B" && ok(num(x.gsb)) ? num(x.gsb) : gsb;
        if (met === "B") gsbFr.push(g);
        var F = ok(mt) && ok(mp) ? mt - mp : NaN;
        var U = ok(F) && ok(V) && ok(g) && g > 0 ? (V - F / g) / V * 100 : NaN;
        if (ok(ma) && Math.abs(ma - 190) > 1 + 1e-9) avisos.push("Determinação " + (met === "B" ? nomeB(i) : i + 1) + ": amostra de " + fmt(ma, 1) + " g (190 ± 1 g, " + (met === "B" ? "6.4.2" : "6.4.3") + ").");
        if (ok(U) && (U < 30 || U > 60)) avisos.push("Determinação " + (met === "B" ? nomeB(i) : i + 1) + ": U = " + fmt(U, 1) + " % fora do usual (30 a 60 %) — confira massas, volume e Gsb.");
        return { F: F, U: U };
      });
      function nomeB(i) { return "U" + (Math.floor(i / 2) + 1) + " (" + (i % 2 + 1) + ")"; }
      function par(i, rot) {
        var a = (det[i] || {}).U, b = (det[i + 1] || {}).U;
        if (ok(a) && ok(b) && Math.abs(a - b) > LIM_REP) avisos.push(rot + ": as duas determinações diferem " + fmt(Math.abs(a - b), 2) + " pontos — acima da faixa de " + fmt(LIM_REP, 2) + " % sugerida para o mesmo operador (Tabela 3, referência dos EUA).");
        return media([a, b]);
      }
      var res = { met: met, V: V, gsb: gsb, minimo: num(P.minimo) }, valor;
      if (met === "B") {
        res.U1 = par(0, "U1"); res.U2 = par(2, "U2"); res.U3 = par(4, "U3");
        res.Um = ok(res.U1) && ok(res.U2) && ok(res.U3) ? (res.U1 + res.U2 + res.U3) / 3 : NaN;
        valor = res.Um; res.rot = "Um";
        var gs = gsbFr.filter(ok);
        res.gsbFr = gs.some(function (x) { return x !== gsb; });
        [0, 2, 4].forEach(function (i, k) {
          var g = gsbFr[i];
          if (ok(g) && ok(gsb) && g !== gsb && Math.abs(g - gsb) <= 0.05) avisos.push("Fração U" + (k + 1) + ": Gsb da fração (" + fmt(g, 3) + ") difere ≤ 0,05 do Gsb da amostra — pela seção 6.5 bastaria o Gsb da amostra completa.");
        });
      } else {
        valor = par(0, met === "A" ? "Us" : "UR");
        res.rot = met === "A" ? "Us" : "UR";
      }
      res.valor = valor;
      res.final = r1(valor);
      res.conforme = ok(res.final) && ok(res.minimo) ? res.final >= res.minimo : null;
      if (res.conforme === false) avisos.push(res.rot + " = " + fmt(res.final, 1) + " %, abaixo do mínimo exigido de " + fmt(res.minimo, 1) + " %.");
      var tab = { calib: [{ M: M, D: D, V: V }], det: det };
      if (comp) tab.comp = comp;
      return { tab: tab, resultados: res, avisos: avisos };
    },
    resultadosHtml: function (calc) {
      var r = calc.resultados;
      var h = '<div class="fe-res"><div class="fe-res-item"><div class="fe-res-v">' + fmt(r.final, 1) + ' <small>%</small></div><div class="fe-res-r">' +
        r.rot + " — teor de vazios não compactado (Método " + r.met + ")" +
        (r.conforme === null ? "" : r.conforme ? ' · <span class="fe-ok">atende (mín. ' + fmt(r.minimo, 1) + ' %)</span>' : ' · <span class="fe-nok">não atende (mín. ' + fmt(r.minimo, 1) + ' %)</span>') + "</div></div>";
      if (r.met === "B") ["U1", "U2", "U3"].forEach(function (k, i) {
        h += '<div class="fe-res-item"><div class="fe-res-v fe-res-p">' + fmt(r1(r[k]), 1) + ' %</div><div class="fe-res-r">' + k + " — " + FRAC_B[i] + "</div></div>";
      });
      h += '<div class="fe-res-item"><div class="fe-res-v fe-res-p">' + fmt(r.V, 1) + ' ml</div><div class="fe-res-r">Volume da proveta · Gsb ' + fmt(r.gsb, 3) + (r.gsbFr ? " (e Gsb por fração)" : "") + "</div></div>";
      return h + "</div>";
    },
    relatorio: {
      notas: "Calibração: V = M / D, com M a massa de água que enche a proveta e D a densidade da água na temperatura de ensaio (18 a 24 °C), arredondado a 0,1 ml (5 b; a norma imprime V = 1000 M / D, coerente só com D em kg/m³). U = (V − F / Gsb) / V × 100 (eq. 1), F = massa do agregado na proveta. Média de duas determinações; Método A: Us; Método B: U1, U2, U3 e Um = (U1 + U2 + U3) / 3; Método C: UR; resultados com precisão de 0,1 % (9). Faixa de 0,94 % entre determinações do mesmo operador tomada da Tabela 3 (valores dos EUA, apenas referência — 10).",
      resultados: function (calc) {
        var r = calc.resultados, rows = [["Método", (METODOS.filter(function (m) { return m[0] === r.met; })[0] || ["", ""])[1]]];
        rows.push(["Densidade aparente Gsb utilizada", fmt(r.gsb, 3) + (r.met === "B" ? (r.gsbFr ? " (amostra) e Gsb por fração informado" : " (amostra completa)") : "")]);
        rows.push(["Volume da proveta", fmt(r.V, 1) + " ml"]);
        if (r.met === "B") ["U1", "U2", "U3"].forEach(function (k, i) { rows.push([k + " — " + FRAC_B[i], fmt(r1(r[k]), 1) + " %"]); });
        rows.push([r.rot + " — vazios não compactados", fmt(r.final, 1) + " %" + (r.conforme === null ? "" : r.conforme ? " — atende ao mínimo de " + fmt(r.minimo, 1) + " %" : " — NÃO ATENDE ao mínimo de " + fmt(r.minimo, 1) + " %")]);
        return rows;
      },
    },
    exemplos: [
      { nome: "Método C — exemplo do Anexo D da norma (UR = 46,7 %)", dados: function () {
        // Tabela D1: Gsb 2,7; proveta 93,1 g; V 99,9 ml; 236,8 e 237,0 g → 46,72 e 46,65 %
        return { ident: { registro: "EX-FAA-001", data: "2025-05-06", obra: "Obra A", origem: "Pedreira X", camada: "Pó de pedra para CBUQ" },
          params: { metodo: "C", gsb: "2,700", minimo: "45" },
          calib: [{ m0: "138,4", m1: "238,1", t: "22", mp: "93,1" }],
          det: [{ ma: "190,0", mt: "236,8" }, { ma: "190,0", mt: "237,0" }] };
      } },
      { nome: "Método A — areia natural, fração fora da tolerância e abaixo do mínimo", dados: function () {
        return { ident: { registro: "EX-FAA-002", data: "2025-05-13", obra: "Obra B", origem: "Fornecedor A", camada: "Areia natural de rio" },
          params: { metodo: "A", gsb: "2,652", minimo: "45" },
          calib: [{ m0: "139,0", m1: "239,0", t: "21", mp: "92,8" }],
          comp: [{ m: "44,1" }, { m: "57,4" }, { m: "71,9" }, { m: "17,0" }],
          det: [{ mt: "241,6" }, { mt: "241,4" }] };
      } },
      { nome: "Método B — frações individuais, duplicata dispersa", dados: function () {
        return { ident: { registro: "EX-FAA-003", data: "2025-05-20", obra: "Obra C", origem: "Pedreira Y", camada: "Areia de britagem" },
          params: { metodo: "B", gsb: "2,680", minimo: "45" },
          calib: [{ m0: "138,4", m1: "238,1", t: "22", mp: "93,1" }],
          det: [{ ma: "190,0", mt: "230,9" }, { ma: "190,2", mt: "231,1" }, { ma: "189,8", mt: "234,9" }, { ma: "190,0", mt: "232,0" },
            { ma: "188,5", mt: "237,5" }, { ma: "190,1", mt: "237,2" }] };
      } },
    ],
  };
})();
