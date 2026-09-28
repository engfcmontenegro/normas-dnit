/*
 * Ficha: DNER-ME 194/98 — Massa específica de agregados miúdos por meio do frasco Chapman.
 * Registra-se no motor de site/fichas.js (window.FE).
 */
(function () {
  "use strict";
  var FE = window.FE, num = FE.num, ok = FE.ok, fmt = FE.fmt, fmtSig = FE.fmtSig, esc = FE.esc, media = FE.media;

  var M_PADRAO = 500, NIVEL = 200;  // 500 g de agregado seco; água até o traço de 200 cm³ (seção 6)

  // γ = 500 / (L − 200)  (7.1); com massa diferente de 500 g usa-se a massa informada
  function gama(x) {
    var L = num(x.L), M = ok(num(x.M)) ? num(x.M) : M_PADRAO;
    return ok(L) && L > NIVEL ? M / (L - NIVEL) : NaN;
  }

  FE.FICHAS["dner-me-194-98"] = {
    titulo: "Massa específica do agregado miúdo — frasco Chapman",
    resumo: "500 g de agregado miúdo seco no frasco com água até 200 cm³; γ = 500 / (L − 200); duas determinações que não diferem mais de 0,05 g/cm³; resultado com três algarismos significativos.",
    blocos: [],
    params: [
      { k: "material", r: "Material", ph: "ex.: areia média, pó de pedra" },
      { k: "frasco", r: "Frasco nº / data da aferição (4.2)", ph: "ex.: F-02 · aferido em 03/2025",
        dica: "o frasco deve ser aferido: traço de 200 cm³ e gargalo graduado de 375 cm³ a 450 cm³" },
      { k: "minimo", r: "Massa específica mínima exigida (g/cm³) — opcional", dica: "da especificação do material, se houver" },
    ],
    padrao: {},
    tabelas: function () {
      return [{
        chave: "det", titulo: "Determinações", rotulo: "Det.", iniciais: 2, min: 1,
        dica: "duas determinações consecutivas com amostras do mesmo agregado (7.2); amostra seca em estufa a 105–110 °C (5.1.2)",
        linhas: [
          { k: "M", r: "Massa de agregado miúdo seco introduzida (seção 6)", u: "g", ph: "500" },
          { k: "L", r: "Leitura no gargalo — volume água + agregado (L)", u: "cm³" },
          { calc: "vol", r: "Volume dos grãos = L − 200", u: "cm³", casas: 1 },
          { calc: "g", r: "γ = 500 / (L − 200) (7.1)", u: "g/cm³", casas: 3, destaque: true },
        ],
      }];
    },
    calcular: function (d) {
      var P = d.params || {}, avisos = [];
      var dets = (d.det || []).map(function (x, i) {
        var L = num(x.L), M = num(x.M), n = "Determinação " + (i + 1) + ": ";
        if (ok(M) && Math.abs(M - M_PADRAO) > 0.5) avisos.push(n + "massa de " + fmt(M, 1) + " g; a norma usa 500 g (seção 6) — calculado com a massa informada.");
        if (ok(L) && L <= NIVEL) avisos.push(n + "leitura menor ou igual a 200 cm³ — confira.");
        else if (ok(L) && (L < 375 || L > 450)) avisos.push(n + "leitura de " + fmt(L, 1) + " cm³ fora do gargalo graduado do frasco (375 cm³ a 450 cm³, 4.2).");
        return { vol: ok(L) ? L - NIVEL : NaN, g: gama(x) };
      });
      var vals = dets.map(function (o) { return o.g; }).filter(ok);
      var R = { g: media(vals), n: vals.length, dif: NaN };
      if (vals.length >= 2) {
        R.dif = Math.max.apply(null, vals) - Math.min.apply(null, vals);
        if (R.dif > 0.05 + 1e-9) avisos.push("As determinações diferem " + fmt(R.dif, 3) + " g/cm³ (máximo 0,05 g/cm³ — 7.2): repita o ensaio.");
      } else if (vals.length === 1) avisos.push("A norma pede duas determinações consecutivas (7.2); há uma.");
      // 7.3: três algarismos significativos
      R.gFinal = ok(R.g) ? Number(fmtSig(R.g, 3).replace(",", ".")) : NaN;
      var minimo = num(P.minimo);
      R.minimo = minimo;
      R.conforme = ok(R.gFinal) && ok(minimo) ? R.gFinal >= minimo : null;
      if (R.conforme === false) avisos.push("Massa específica de " + fmtSig(R.g, 3) + " g/cm³, abaixo do mínimo exigido de " + fmt(minimo, 2) + " g/cm³.");
      return { tab: { det: dets }, resultados: R, avisos: avisos };
    },
    rotuloImportar: function (r) { return "γ " + (ok(r.g) ? fmtSig(r.g, 3) : "—") + " g/cm³"; },
    resultadosHtml: function (calc) {
      var r = calc.resultados;
      return '<div class="fe-res"><div class="fe-res-item"><div class="fe-res-v">' + (ok(r.g) ? fmtSig(r.g, 3) : "—") + ' <small>g/cm³</small></div>' +
        '<div class="fe-res-r">Massa específica do agregado miúdo — média de ' + r.n + " determinação(ões), três algarismos significativos (7.3)" +
        (r.conforme === null ? "" : r.conforme ? ' · <span class="fe-ok">atende</span>' : ' · <span class="fe-nok">não atende</span>') + "</div></div>" +
        '<div class="fe-res-item"><div class="fe-res-v fe-res-p">' + (ok(r.dif) ? fmt(r.dif, 3) + " g/cm³" : "—") + '</div>' +
        '<div class="fe-res-r">Diferença entre as determinações (máximo 0,05 g/cm³ — 7.2)' +
        (ok(r.dif) ? (r.dif <= 0.05 + 1e-9 ? ' · <span class="fe-ok">ok</span>' : ' · <span class="fe-nok">excede</span>') : "") + "</div></div></div>";
    },
    relatorio: {
      parametros: [["Procedimento", "água até o traço de 200 cm³; 500 g de agregado miúdo seco em estufa (105 °C a 110 °C); agitação para eliminar bolhas; leitura no gargalo"]],
      notas: "γ = 500 / (L − 200) (7.1), em g/cm³, com L = leitura no frasco (volume do conjunto água + agregado). Duas determinações consecutivas não devem diferir mais de 0,05 g/cm³ (7.2); resultado (média) com três algarismos significativos (7.3).",
      resultados: function (calc, d) {
        var r = calc.resultados, P = d.params || {}, rows = [];
        if (P.material) rows.push(["Material", P.material]);
        rows.push(["Massa específica do agregado miúdo", (ok(r.g) ? fmtSig(r.g, 3) + " g/cm³" : "—") +
          (r.conforme === null ? "" : r.conforme ? " — atende ao mínimo de " + fmt(r.minimo, 2) + " g/cm³" : " — NÃO ATENDE ao mínimo de " + fmt(r.minimo, 2) + " g/cm³")]);
        rows.push(["Diferença entre as determinações", ok(r.dif) ? fmt(r.dif, 3) + " g/cm³ (máximo 0,05 g/cm³)" : "—"]);
        return rows;
      },
    },
    exemplos: [
      { nome: "Areia — 2 determinações (planilha do laboratório)", dados: function () {
        return { ident: { registro: "EX-CH-001", obra: "Obra A", origem: "Fornecedor A", camada: "Areia", data: "2025-10-02" },
          params: { material: "Areia" },
          det: [{ M: "500", L: "395" }, { M: "500", L: "395" }],
          obs: "Planilha do laboratório: leituras de 500 ml para 695 ml (volume deslocado de 195 cm³) em proveta; lançado aqui como a leitura equivalente no frasco Chapman, 200 + 195 = 395 cm³." };
      } },
      { nome: "Pó de brita — 2 determinações (planilha do laboratório)", dados: function () {
        return { ident: { registro: "EX-CH-002", obra: "Obra A", camada: "Pó de brita", data: "2026-02-21" },
          params: { material: "Pó de brita" },
          det: [{ M: "500", L: "391" }, { M: "500", L: "389" }],
          obs: "Planilha do laboratório: leituras finais de 691 ml e 689 ml partindo de 500 ml (volumes de 191 e 189 cm³); lançadas como 391 e 389 cm³ no frasco Chapman." };
      } },
      { nome: "Areia artificial — determinações discordantes (repetir)", dados: function () {
        return { ident: { registro: "EX-CH-003", camada: "Areia artificial", origem: "Pedreira A" },
          params: { material: "Areia artificial", minimo: "2,60" },
          det: [{ M: "500", L: "388" }, { M: "500", L: "398,5" }] };
      } },
    ],
  };
})();
