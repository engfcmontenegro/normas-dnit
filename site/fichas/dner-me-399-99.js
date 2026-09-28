/*
 * Ficha: DNER-ME 399/99 — Agregados: perda ao choque no aparelho Treton.
 * Registra-se no motor de site/fichas.js (window.FE).
 */
(function () {
  "use strict";
  var FE = window.FE, num = FE.num, ok = FE.ok, fmt = FE.fmt, esc = FE.esc, media = FE.media;

  FE.FICHAS["dner-me-399-99"] = {
    titulo: "Perda ao choque — aparelho Treton",
    resumo: "15 a 20 partículas cúbicas entre 19 e 16 mm, massa = 50 × massa específica aparente (± 3 g); 10 quedas do martelo de 14,9 kg de 39,37 cm; perda = (M₁ − Mᵣ) / M₁ × 100 com Mᵣ retido na peneira de 1,7 mm; média de no mínimo três ensaios.",
    blocos: [],
    params: [
      { k: "material", r: "Material", ph: "ex.: brita granítica" },
      { k: "gama", r: "Massa específica aparente das partículas (g/cm³) (4)", dica: "DNER-ME 195 / DNIT 413; massa da amostra = 50 × este valor, ± 3 g" },
      { k: "maximo", r: "Perda ao choque máxima admitida (%) — opcional", dica: "da especificação de serviço pertinente" },
    ],
    padrao: {},
    tabelas: function () {
      return [{
        chave: "ens", titulo: "Ensaios", rotulo: "Ensaio", iniciais: 3, min: 3,
        dica: "no mínimo três ensaios (6); 10 quedas do martelo por ensaio (5)",
        linhas: [
          { k: "n", r: "Nº de partículas da amostra (4: entre 15 e 20)", u: "un" },
          { k: "M1", r: "Massa original da amostra (M₁) (4)", u: "g" },
          { k: "Mr", r: "Massa retida na peneira de 1,7 mm (Mᵣ) (5)", u: "g" },
          { calc: "Mp", r: "Massa que passa na 1,7 mm Mₚ = M₁ − Mᵣ (ficha do Anexo)", u: "g", casas: 1 },
          { calc: "T", r: "Perda ao choque T = (M₁ − Mᵣ) / M₁ × 100 (6)", u: "%", casas: 1, destaque: true },
        ],
      }];
    },
    calcular: function (d) {
      var P = d.params || {}, avisos = [];
      var gama = num(P.gama), alvo = ok(gama) ? 50 * gama : NaN;
      var rows = (d.ens || []).map(function (x, i) {
        var M1 = num(x.M1), Mr = num(x.Mr), n = num(x.n);
        var Mp = ok(M1) && ok(Mr) ? M1 - Mr : NaN;
        var T = ok(Mp) && M1 > 0 ? Mp / M1 * 100 : NaN;
        if (ok(Mp) && Mp < 0) avisos.push("Ensaio " + (i + 1) + ": massa retida maior que a original — confira.");
        if (ok(M1) && ok(alvo) && Math.abs(M1 - alvo) > 3)
          avisos.push("Ensaio " + (i + 1) + ": massa de " + fmt(M1, 1) + " g fora de 50 × " + fmt(gama, 3) + " = " + fmt(alvo, 1) + " ± 3 g (4).");
        if (ok(n) && (n < 15 || n > 20)) avisos.push("Ensaio " + (i + 1) + ": " + fmt(n, 0) + " partículas — a norma indica aproximadamente entre 15 e 20 (4).");
        return { Mp: Mp, T: T };
      });
      var Ts = rows.map(function (o) { return o.T; }).filter(ok);
      if (Ts.length && Ts.length < 3) avisos.push("A perda ao choque é a média de no mínimo três ensaios (6); há " + Ts.length + ".");
      if (!ok(gama)) avisos.push("Informe a massa específica aparente para conferir a massa da amostra (50 × γ ± 3 g, seção 4).");
      var T = media(Ts), max = num(P.maximo);
      if (ok(T) && ok(max) && T > max) avisos.push("Perda ao choque = " + fmt(T, 1) + " %, acima do máximo admitido de " + fmt(max, 0) + " %.");
      var amp = Ts.length > 1 ? Math.max.apply(null, Ts) - Math.min.apply(null, Ts) : NaN;
      return { tab: { ens: rows }, resultados: { T: T, n: Ts.length, alvo: alvo, amp: amp, max: max,
        conforme: ok(T) && ok(max) ? T <= max : null }, avisos: avisos };
    },
    resultadosHtml: function (calc) {
      var r = calc.resultados;
      return '<div class="fe-res"><div class="fe-res-item"><div class="fe-res-v">' + (ok(r.T) ? fmt(r.T, 1) : "—") + ' <small>%</small></div>' +
        '<div class="fe-res-r">Perda ao choque Treton — média de ' + r.n + " ensaio" + (r.n === 1 ? "" : "s") +
        (r.conforme === null ? "" : r.conforme ? ' · <span class="fe-ok">atende</span>' : ' · <span class="fe-nok">não atende</span>') + "</div></div>" +
        '<div class="fe-res-item"><div class="fe-res-v fe-res-p">' + (ok(r.alvo) ? fmt(r.alvo, 1) + " g" : "—") + '</div><div class="fe-res-r">Massa da amostra exigida (50 × γ, ± 3 g)</div></div>' +
        '<div class="fe-res-item"><div class="fe-res-v fe-res-p">' + (ok(r.amp) ? fmt(r.amp, 1) + " %" : "—") + '</div><div class="fe-res-r">Amplitude entre os ensaios (informativo)</div></div></div>';
    },
    relatorio: {
      parametros: [["Ensaio", "10 quedas do martelo de 14,9 kg, altura de 39,37 cm; partículas entre as peneiras de 19 mm e 16 mm; peneiramento na 1,7 mm"]],
      notas: "Perda ao choque de cada ensaio = diferença entre a massa original M₁ e a massa retida na peneira de 1,7 mm Mᵣ, em porcentagem de M₁ (texto da seção 6 e coluna \"material que passa\" da ficha do Anexo); resultado = média aritmética de no mínimo três ensaios. A fórmula impressa na norma, T = Mᵣ / M₁ × 100, contradiz o texto (daria a fração retida); adotou-se o texto. A norma não fixa arredondamento; resultado com uma decimal.",
      resultados: function (calc, d) {
        var r = calc.resultados, P = d.params || {}, rows = [];
        if (P.material) rows.push(["Material", P.material]);
        rows.push(["Perda ao choque Treton (T)", (ok(r.T) ? fmt(r.T, 1) + " %" : "—") + " — média de " + r.n + " ensaios" +
          (r.conforme === null ? "" : r.conforme ? " — atende ao máximo de " + fmt(r.max, 0) + " %" : " — NÃO ATENDE ao máximo de " + fmt(r.max, 0) + " %")]);
        if (ok(r.alvo)) rows.push(["Massa da amostra exigida", fmt(r.alvo, 1) + " g ± 3 g (50 × " + fmt(r.alvo / 50, 3) + " g/cm³)"]);
        return rows;
      },
    },
    exemplos: [
      { nome: "Brita granítica — três ensaios", dados: function () {
        return { ident: { registro: "EX-TRE-001", obra: "Obra A", camada: "Brita para macadame", origem: "Pedreira X", data: "2026-07-08" },
          params: { material: "Brita granítica 19–16 mm", gama: "2,652", maximo: "" },
          ens: [{ n: "17", M1: "132,4", Mr: "108,9" }, { n: "18", M1: "133,1", Mr: "110,6" }, { n: "16", M1: "131,8", Mr: "107,2" }] };
      } },
      { nome: "Basalto — quatro ensaios, dentro do máximo", dados: function () {
        return { ident: { registro: "EX-TRE-002", obra: "Obra B", camada: "Tratamento superficial", origem: "Pedreira Z", data: "2026-07-15" },
          params: { material: "Basalto 19–16 mm", gama: "2,871", maximo: "25" },
          ens: [{ n: "16", M1: "143,2", Mr: "124,5" }, { n: "15", M1: "144,0", Mr: "126,1" }, { n: "17", M1: "143,9", Mr: "124,8" }, { n: "16", M1: "143,5", Mr: "125,9" }] };
      } },
      { nome: "Calcário alterado — massa fora da tolerância e perda alta (reprovado)", dados: function () {
        return { ident: { registro: "EX-TRE-003", camada: "Revestimento primário", origem: "Jazida 1" },
          params: { material: "Calcário alterado", gama: "2,540", maximo: "25" },
          ens: [{ n: "22", M1: "131,9", Mr: "92,4" }, { n: "19", M1: "127,4", Mr: "90,3" }, { n: "18", M1: "126,6", Mr: "91,8" }] };
      } },
    ],
  };
})();
