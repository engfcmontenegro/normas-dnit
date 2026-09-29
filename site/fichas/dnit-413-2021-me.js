/*
 * Ficha: DNIT 413/2021-ME — Massa específica, densidade relativa e absorção de agregado graúdo
 * (pesagem hidrostática em cesto; amostra única ou ensaiada em frações, 7.3 e 7.5).
 * Registra-se no motor de site/fichas.js (window.FE).
 */
(function () {
  "use strict";
  var FE = window.FE, num = FE.num, ok = FE.ok, fmt = FE.fmt, esc = FE.esc, media = FE.media;

  // massa específica da água (g/cm³): 0,9971 a 25 °C; em outra temperatura, a da água nela (7.2)
  var AGUA = [[15, 0.99910], [16, 0.99895], [17, 0.99878], [18, 0.99860], [19, 0.99841], [20, 0.99821], [21, 0.99799],
    [22, 0.99777], [23, 0.99754], [24, 0.99730], [25, 0.99705], [26, 0.99679], [27, 0.99652], [28, 0.99624],
    [29, 0.99595], [30, 0.99565], [31, 0.99534], [32, 0.99503], [33, 0.99470], [34, 0.99437], [35, 0.99403]];
  function rhoAgua(T) {
    if (!ok(T)) return 0.9971;
    var v = FE.interpolar(AGUA, T);
    return ok(v) ? Math.round(v * 10000) / 10000 : NaN;
  }
  // Tabela 1 — massa mínima (kg) pelo tamanho nominal máximo
  var TAB1 = [["12,5", 2], ["19,0", 3], ["25,0", 4], ["37,5", 5], ["50", 8], ["63", 12], ["75", 18]];
  // Tabela 2 — massa mínima da fração (kg) pela peneira em que a fração fica retida (passa 50/63/75 mm)
  var TAB2 = [[37.5, 50, 3], [50, 63, 4], [63, 75, 6]];
  // precisão (Anexo A, informativo): faixa aceitável entre dois resultados de um operador (d2s)
  var D2S = { gsa: 0.025, gsb: 0.020 };

  function det(x, rho) {
    var A = num(x.A), B = num(x.B), C = num(x.C), o = {};
    if (ok(A) && ok(C) && A - C > 0) { o.gsa = A / (A - C); o.mesa = rho * o.gsa; }
    if (ok(A) && ok(B) && ok(C) && B - C > 0) { o.gsb = A / (B - C); o.mesb = rho * o.gsb; o.agua = B - C; }
    if (ok(A) && ok(B) && A > 0) o.abs = (B - A) / A * 100;
    return o;
  }
  function amplitude(v) { v = v.filter(ok); return v.length > 1 ? Math.max.apply(null, v) - Math.min.apply(null, v) : NaN; }
  function r3(x) { return ok(x) ? Math.round(x * 1000) / 1000 : NaN; }
  function r1(x) { return ok(x) ? Math.round(x * 10) / 10 : NaN; }
  function fracoes(d) { return (d.params || {}).fracoes === "sim"; }

  FE.FICHAS["dnit-413-2021-me"] = {
    titulo: "Massa específica, densidade relativa e absorção de agregado graúdo",
    rotuloImportar: function (r) { var F = window.FE; return "Gsb " + (F.ok(r.gsb) ? F.fmt(r.gsb, 3) : "—") + " · absorção " + (F.ok(r.abs) ? F.fmt(r.abs, 2) + " %" : "—"); },
    resumo: "Agregado graúdo (retido 4,75 mm) imerso (24 ± 4) h: massas seca (A), saturada superfície seca (B) e imersa (C); Gsa = A/(A−C), Gsb = A/(B−C), ME = 0,9971 × G, absorção = (B−A)/A × 100; frações combinadas pelas eq. 5 e 7.",
    blocos: [],
    params: [
      { k: "material", r: "Material", ph: "ex.: brita 1" },
      { k: "fracoes", r: "Amostra ensaiada em frações (5 c, 7.3)", tipo: "select", recarrega: true,
        opcoes: [["nao", "Não — amostra única"], ["sim", "Sim — uma coluna por fração (ou subamostra, 5 e)"]],
        dica: "obrigatório quando mais de 15 % fica retido na peneira de 37,5 mm" },
      { k: "tnm", r: "Tamanho nominal máximo — TNM (3.12)", tipo: "select",
        opcoes: [["", "—"]].concat(TAB1.map(function (t) { return [t[0], t[0] + " mm — mínimo " + t[1] + " kg (Tabela 1)"]; })),
        se: function (d) { return !fracoes(d); } },
      { k: "temperatura", r: "Temperatura da água do tanque (°C)", ph: "25", dica: "6 d): (25 ± 2) °C; a massa específica da água é tomada nesta temperatura (7.2)" },
    ],
    padrao: { fracoes: "nao", temperatura: "25" },
    tabelas: function (d) {
      var fr = fracoes(d);
      var linhas = [];
      if (fr) {
        linhas.push({ k: "ret", r: "Peneira em que a fração fica retida (mm)", ph: "ex.: 37,5" });
        linhas.push({ k: "P", r: "Porcentagem da fração na amostra original (P) (5 d)", u: "%" });
      }
      linhas = linhas.concat([
        { k: "B", r: "Massa saturada superfície seca, ao ar (B) (6 c)", u: "g" },
        { k: "C", r: "Massa imersa em água (C) — balança zerada com o cesto imerso (6 d)", u: "g" },
        { k: "A", r: "Massa seca em estufa, ao ar (A) (6 e)", u: "g" },
        { calc: "agua", r: "Massa de água deslocada B − C (NOTA 2)", u: "g", casas: 1 },
        { calc: "gsa", r: "Densidade relativa real Gsa = A / (A − C) (eq. 1)", u: "", casas: 3 },
        { calc: "gsb", r: "Densidade relativa aparente Gsb = A / (B − C) (eq. 2)", u: "", casas: 3 },
        { calc: "mesa", r: "Massa específica real MEsa = ρw × A / (A − C) (eq. 3)", u: "g/cm³", casas: 3, destaque: true },
        { calc: "mesb", r: "Massa específica aparente MEsb = ρw × A / (B − C) (eq. 4)", u: "g/cm³", casas: 3, destaque: true },
        { calc: "abs", r: "Absorção = (B − A) / A × 100 (eq. 6)", u: "%", casas: 2, destaque: true },
      ]);
      return [{
        chave: "det", titulo: fr ? "Frações" : "Determinações", rotulo: fr ? "Fração" : "Det.", iniciais: fr ? 2 : 1, min: 1,
        dica: fr ? "uma coluna por fração; o resultado combina as frações pelas eq. 5 (massas específicas e densidades) e 7 (absorção)"
          : "a norma prevê uma determinação; havendo mais de uma, o resultado é a média e a diferença é comparada à precisão do Anexo A",
        linhas: linhas,
      }];
    },
    calcular: function (d) {
      var P = d.params || {}, fr = fracoes(d), avisos = [];
      var T = num(P.temperatura), rho = rhoAgua(T);
      if (ok(T) && Math.abs(T - 25) > 2) avisos.push("Temperatura da água de " + fmt(T, 1) + " °C fora de (25 ± 2) °C (6 d).");
      if (!ok(rho)) { avisos.push("Temperatura fora da tabela de massa específica da água (15 °C a 35 °C): usado 0,9971 g/cm³."); rho = 0.9971; }
      var minTab1 = (TAB1.filter(function (t) { return t[0] === P.tnm; })[0] || [])[1];
      var rot = fr ? "Fração " : "Determinação ";
      var dets = (d.det || []).map(function (x, i) {
        var o = det(x, rho), n = rot + (i + 1) + ": ";
        var A = num(x.A), B = num(x.B), C = num(x.C);
        if (ok(A) && ok(B) && A > B) avisos.push(n + "massa seca (A) maior que a saturada superfície seca (B) — confira as pesagens.");
        if (ok(A) && ok(C) && C >= A) avisos.push(n + "massa imersa (C) deve ser menor que a massa seca (A).");
        var minimo = null, fonte = "";
        if (fr) {
          var ret = num(x.ret), t2 = TAB2.filter(function (t) { return ok(ret) && Math.abs(t[0] - ret) < 0.01; })[0];
          if (t2) { minimo = t2[2]; fonte = "Tabela 2 (passa " + fmt(t2[1], 0) + " mm, retida " + fmt(t2[0], 1) + " mm)"; }
        } else if (minTab1) { minimo = minTab1; fonte = "Tabela 1, TNM " + P.tnm + " mm"; }
        if (minimo && ok(A) && A < minimo * 1000) avisos.push(n + "amostra de " + fmt(A, 1) + " g (seca), abaixo do mínimo de " + fmt(minimo, 0) + " kg (" + fonte + ").");
        o.P = num(x.P);
        return o;
      });
      var R = { rho: rho, T: T, fr: fr, n: 0 };
      var chaves = ["gsa", "gsb", "mesa", "mesb", "abs"];
      if (!fr) {
        chaves.forEach(function (k) { R[k] = media(dets.map(function (o) { return o[k]; })); });
        var vals = function (k) { return dets.map(function (o) { return o[k]; }).filter(ok); };
        R.n = vals("gsa").length;
        R.dif = { gsa: amplitude(vals("gsa")), gsb: amplitude(vals("gsb")) };
        if (R.n > 1) {
          [["gsa", "Gsa"], ["gsb", "Gsb"]].forEach(function (q) {
            var v = R.dif[q[0]];
            if (ok(v) && v > D2S[q[0]] + 1e-9) avisos.push("Diferença de " + fmt(v, 3) + " entre determinações na " + q[1] +
              ", acima da faixa aceitável para um operador (d2s = " + fmt(D2S[q[0]], 3) + ", Anexo A — informativo): repita o ensaio.");
          });
        }
      } else {
        var us = dets.filter(function (o) { return ok(o.P) && ok(o.gsa) && ok(o.gsb) && ok(o.abs); });
        var soma = us.reduce(function (s, o) { return s + o.P; }, 0);
        R.n = us.length; R.somaP = soma;
        if (us.length && Math.abs(soma - 100) > 0.05) avisos.push("A soma das porcentagens das frações é " + fmt(soma, 1) + " % (deve ser 100 %, ignorando o material passante em 4,75 mm — 5 d).");
        if (us.length) {
          // eq. 5: G = 1 / Σ (Pi / (100 Gi)); eq. 7: absorção = Σ Pi Ai / 100
          ["gsa", "gsb", "mesa", "mesb"].forEach(function (k) {
            R[k] = 1 / us.reduce(function (s, o) { return s + o.P / (100 * o[k]); }, 0);
          });
          R.abs = us.reduce(function (s, o) { return s + o.P * o.abs / 100; }, 0);
        } else chaves.forEach(function (k) { R[k] = NaN; });
        if (dets.length && us.length < dets.length) avisos.push("Informe P (%) e as três massas de cada fração para combinar os resultados.");
      }
      return { tab: { det: dets }, resultados: R, avisos: avisos };
    },
    resultadosHtml: function (calc) {
      var r = calc.resultados;
      function item(v, u, rot, casas) {
        return '<div class="fe-res-item"><div class="fe-res-v">' + fmt(v, casas) + (u ? " <small>" + u + "</small>" : "") + '</div><div class="fe-res-r">' + rot + "</div></div>";
      }
      var base = r.fr ? "combinação de " + r.n + (r.n === 1 ? " fração" : " frações") + " — eq. 5 e 7" : r.n > 1 ? "média de " + r.n + " determinações" : "uma determinação";
      return '<div class="fe-res">' +
        item(r3(r.mesa), "g/cm³", "Massa específica real (MEsa)", 3) + item(r3(r.mesb), "g/cm³", "Massa específica aparente (MEsb)", 3) +
        item(r3(r.gsa), "", "Densidade relativa real (Gsa)", 3) + item(r3(r.gsb), "", "Densidade relativa aparente (Gsb)", 3) +
        item(r1(r.abs), "%", "Absorção", 1) +
        '<div class="fe-res-item"><div class="fe-res-v fe-res-p">' + fmt(r.rho, 4) + ' <small>g/cm³</small></div><div class="fe-res-r">Água a ' +
        (ok(r.T) ? fmt(r.T, 1) : "25") + " °C · " + esc(base) + "</div></div></div>";
    },
    relatorio: {
      notas: "Gsa = A/(A−C) (eq. 1); Gsb = A/(B−C) (eq. 2); MEsa = 0,9971 × A/(A−C) (eq. 3) e MEsb = 0,9971 × A/(B−C) (eq. 4), com 0,9971 g/cm³ = massa específica da água a 25 °C (em outra temperatura, a da água nela — 7.2); absorção = (B−A)/A × 100 (eq. 6). A = massa seca em estufa; B = massa saturada superfície seca; C = massa imersa. Frações: G = 1/Σ(Pi/(100 Gi)) (eq. 5) e absorção = Σ Pi Ai/100 (eq. 7). Resultados: massas específicas e densidades com 0,001 e absorção com 0,1 % (seção 8). A massa mínima (Tabelas 1 e 2) é conferida com a massa seca. Havendo mais de uma determinação, o resultado é a média e a diferença é comparada ao d2s de um operador (Anexo A, informativo).",
      resultados: function (calc, d) {
        var r = calc.resultados, P = d.params || {}, rows = [];
        if (P.material) rows.push(["Material", P.material]);
        rows.push(["Massa específica real (MEsa)", fmt(r3(r.mesa), 3) + " g/cm³"]);
        rows.push(["Massa específica aparente (MEsb)", fmt(r3(r.mesb), 3) + " g/cm³"]);
        rows.push(["Densidade relativa real (Gsa)", fmt(r3(r.gsa), 3)]);
        rows.push(["Densidade relativa aparente (Gsb)", fmt(r3(r.gsb), 3)]);
        rows.push(["Absorção", fmt(r1(r.abs), 1) + " %"]);
        rows.push(["Base do resultado", (r.fr ? "combinação de " + r.n + " frações (eq. 5 e 7)" : r.n > 1 ? "média de " + r.n + " determinações" : "uma determinação") +
          " — água a " + fmt(r.rho, 4) + " g/cm³"]);
        return rows;
      },
    },
    exemplos: [
      { nome: "Brita 1 — projeto de traço CBUQ (planilha do laboratório)", dados: function () {
        // PROJETO TRAÇO ASFALTO.xlsx, aba "Densidade B1" (a planilha repete a mesma determinação em 3 colunas)
        return { ident: { registro: "EX-413-001", obra: "Obra B", origem: "Pedreira Y", camada: "Brita 1 — CBUQ" },
          params: { material: "Brita 1 (3/4\")", fracoes: "nao", tnm: "19,0", temperatura: "25" },
          det: [{ B: "3046,22", C: "1940,98", A: "3033,09" }] };
      } },
      { nome: "Brita 0 — amostra abaixo da massa mínima (planilha do laboratório)", dados: function () {
        // PROJETO TRAÇO ASFALTO.xlsx, aba "Densidade B0": TNM 12,5 mm exige 2 kg; a amostra seca tem 1 963,55 g
        return { ident: { registro: "EX-413-002", obra: "Obra B", origem: "Pedreira Y", camada: "Brita 0 — CBUQ" },
          params: { material: "Brita 0 (3/8\")", fracoes: "nao", tnm: "12,5", temperatura: "25" },
          det: [{ B: "1978,38", C: "1242,68", A: "1963,55" }] };
      } },
      { nome: "Rachão para base — duas frações (7.3 e 7.5)", dados: function () {
        return { ident: { registro: "EX-413-003", origem: "Pedreira A", camada: "Base — pedra graduada" },
          params: { material: "Agregado graúdo com 22 % retido em 37,5 mm", fracoes: "sim", temperatura: "24" },
          det: [{ ret: "4,75", P: "78", B: "5042", C: "3178", A: "4991" },
            { ret: "37,5", P: "22", B: "3021", C: "1905", A: "2992" }] };
      } },
    ],
  };
})();
