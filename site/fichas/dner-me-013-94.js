/*
 * Ficha: DNER-ME 013/94 — Microesferas de vidro — Massa específica.
 * Registra-se no motor de site/fichas.js (window.FE); usa o código comum de FE.sinalizacao2 (dner-me-011-94.js).
 *
 * Massa específica = massa da amostra / volume das microesferas (7); volume = leitura final da proveta − 50 cm³ (6.6).
 * Limites opcionais: DNER-EM 373/2000 (5.9: 2,3 a 2,6 g/cm³) e DNER-EM 379/98 (5.8: 2,4 a 2,6 g/cm³).
 */
(function () {
  "use strict";
  var FE = window.FE, S = FE.sinalizacao2, num = FE.num, ok = FE.ok, fmt = FE.fmt, esc = FE.esc, media = FE.media;
  var ESPEC = [
    ["373", "DNER-EM 373/2000 — microesferas: 2,3 a 2,6 g/cm³ (5.9)", 2.3, 2.6, "DNER-EM 373/2000, 5.9"],
    ["379", "DNER-EM 379/98 — esferas de vidro: 2,4 a 2,6 g/cm³ (5.8)", 2.4, 2.6, "DNER-EM 379/98, 5.8"],
  ];
  var PREP = [
    { k: "tEstufa", r: "Temperatura da estufa (6.2 — 110 ± 5 °C)", u: "°C", min: 105, max: 115, casas: 0 },
    { k: "tSec", r: "Tempo de secagem (6.2 — 2 h)", u: "h", min: 2, casas: 1 },
    { k: "tDess", r: "Resfriamento em dessecador (6.3 — 2 h)", u: "h", min: 2, casas: 1 },
  ];

  FE.FICHAS["dner-me-013-94"] = {
    titulo: "Microesferas de vidro — massa específica",
    resumo: "Amostra seca a (110 ± 5) °C por 2 h e resfriada 2 h em dessecador; cerca de 60 g vertidos em proveta de 100 cm³ com 50 cm³ de álcool isopropílico ou xilol; massa específica = massa / (leitura final − 50 cm³).",
    blocos: [],
    params: [
      { k: "material", r: "Material", ph: "ex.: microesferas tipo I B (premix)" },
      { k: "liquido", r: "Líquido da proveta (4)", tipo: "select", opcoes: [["isopropilico", "Álcool isopropílico"], ["xilol", "Xilol"]] },
    ].concat(PREP.map(function (c) { return { k: c.k, r: c.r + " — registrado (" + c.u + ")" }; }),
      S.paramsLimite(ESPEC, "g/cm³", "DNER-EM 373/2000 (5.9) ou DNER-EM 379/98 (5.8)")),
    padrao: { liquido: "isopropilico", espec: "" },
    tabelas: function () {
      return [{
        chave: "det", titulo: "Determinações", rotulo: "Determinação", iniciais: 1, min: 1,
        dica: "cuidado para as microesferas não aderirem à parede da proveta e para eliminar o ar preso entre elas (6.5)",
        linhas: [
          { k: "m", r: "Massa das microesferas (6.4 — aprox. 60 g)", u: "g" },
          { k: "v0", r: "Volume inicial de líquido na proveta (6.5 — 50 cm³)", u: "cm³", ph: "50" },
          { k: "vf", r: "Volume total lido na proveta (6.6)", u: "cm³" },
          { calc: "v", r: "Volume das microesferas = leitura − 50 cm³ (6.6)", u: "cm³", casas: 1 },
          { calc: "me", r: "Massa específica = massa / volume (7)", u: "g/cm³", casas: 2, destaque: true },
        ],
      }];
    },
    calcular: function (d) {
      var P = d.params || {}, avisos = [];
      PREP.forEach(function (c) { var a = S.condicao(c, num(P[c.k])); if (a) avisos.push(a); });
      var dets = (d.det || []).map(function (x, i) {
        var m = num(x.m), v0 = ok(num(x.v0)) ? num(x.v0) : 50, vf = num(x.vf), rot = "Determinação " + (i + 1) + ": ";
        var v = ok(vf) ? vf - v0 : NaN, o = { v: v, me: ok(m) && ok(v) && v > 0 ? m / v : NaN };
        if (ok(m) && (m < 54 || m > 66)) avisos.push(rot + "massa de " + fmt(m, 2) + " g; a norma pede aproximadamente 60 g (6.4) — aviso fora de ±10 %.");
        if (ok(num(x.v0)) && Math.abs(num(x.v0) - 50) > 0.5) avisos.push(rot + "a proveta deve conter 50 cm³ de líquido (6.5).");
        if (ok(vf) && vf > 100) avisos.push(rot + "leitura acima da capacidade da proveta de 100 cm³ (3 e).");
        if (ok(v) && v <= 0) avisos.push(rot + "leitura final menor ou igual ao volume inicial — confira.");
        return o;
      });
      var vals = dets.map(function (o) { return o.me; }).filter(ok);
      var me = vals.length ? Math.round(media(vals) * 100) / 100 : NaN;
      var lim = S.limite(P, ESPEC), conf = S.confere(me, lim);
      if (conf === false) avisos.unshift("Massa específica de " + fmt(me, 2) + " g/cm³, fora do limite de " + S.textoLim(lim, 1, "g/cm³") + " (" + lim.ref + ").");
      var amp = vals.length > 1 ? Math.max.apply(null, vals) - Math.min.apply(null, vals) : NaN;
      return { tab: { det: dets }, resultados: { me: me, n: vals.length, amp: amp, lim: lim, conforme: conf }, avisos: avisos };
    },
    resultadosHtml: function (calc) {
      var r = calc.resultados;
      return '<div class="fe-res">' + S.card((ok(r.me) ? fmt(r.me, 2) : "—") + " <small>g/cm³</small>",
        "Massa específica" + (r.n > 1 ? " — média de " + r.n + " determinações" : "") + (r.lim ? " · limite " + esc(S.textoLim(r.lim, 1, "g/cm³")) + S.sit(r.conforme) : ""), true) +
        (ok(r.amp) ? S.card(fmt(r.amp, 2) + " g/cm³", "Diferença entre determinações (a norma não fixa tolerância)") : "") + "</div>";
    },
    relatorio: {
      notas: "Massa específica (g/cm³) = massa da amostra (g) / volume das microesferas (cm³) (7); volume = volume total lido na proveta − 50 cm³ de álcool isopropílico ou xilol (6.6). " +
        "Resultado com duas casas decimais (a norma não fixa o arredondamento). Com mais de uma determinação, a ficha relata a média.",
      resultados: function (calc, d) {
        var r = calc.resultados, P = d.params || {}, rows = [];
        if (P.material) rows.push(["Material", P.material]);
        rows.push(["Massa específica", (ok(r.me) ? fmt(r.me, 2) + " g/cm³" : "—") + (r.n > 1 ? " (média de " + r.n + " determinações)" : "")]);
        if (r.lim) rows.push(["Especificação", S.textoLim(r.lim, 1, "g/cm³") + " (" + r.lim.ref + ")" + S.sitTxt(r.conforme)]);
        return rows;
      },
    },
    exemplos: [
      { nome: "Microesferas tipo I B — duas determinações", dados: function () {
        return { ident: { registro: "EX-MV013-01", data: "2026-03-09", obra: "Obra A", local: "Lote 12", origem: "Fornecedor A", camada: "Microesferas tipo I B (premix)" },
          params: { material: "Microesferas de vidro tipo I B", liquido: "isopropilico", tEstufa: "110", tSec: "2", tDess: "2", espec: "373" },
          det: [{ m: "60,12", v0: "50", vf: "74,0" }, { m: "59,87", v0: "50", vf: "74,0" }] };
      } },
      { nome: "Esferas de vidro — massa específica baixa (reprovado)", dados: function () {
        return { ident: { registro: "EX-MV013-02", data: "2026-03-10", obra: "Obra C", local: "Lote 21", origem: "Fornecedor C", camada: "Esferas de vidro (DNER-EM 379)" },
          params: { material: "Esferas de vidro", liquido: "xilol", tEstufa: "110", tSec: "1,5", tDess: "2", espec: "379" },
          det: [{ m: "60,05", v0: "50", vf: "76,5" }] };
      } },
    ],
  };
  window.FE.FICHAS["dner-me-013-94"].rotuloImportar = function (r) { return "massa específica " + window.FE.fmt(r.me, 2) + " g/cm³"; };
})();
