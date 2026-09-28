/*
 * Ficha: DNER-ME 397/99 — Agregados — Índice de degradação Washington (IDW).
 * Registra-se no motor de site/fichas.js (window.FE).
 */
(function () {
  "use strict";
  var FE = window.FE, num = FE.num, ok = FE.ok, fmt = FE.fmt, esc = FE.esc, media = FE.media;

  var FRACAO = 500;  // seção 5: 500 g de cada fração

  // H em polegadas (6.6: precisão de 0,1"); leitura em cm convertida (1" = 2,54 cm)
  function alturaPol(x, P) {
    var h = num(x.h);
    return ok(h) ? (P.unidade === "cm" ? h / 2.54 : h) : NaN;
  }
  // IDW = (15 − H) / (15 + 1,75 H) × 100   (seção 7)
  function idw(H) { return ok(H) && 15 + 1.75 * H > 0 ? (15 - H) / (15 + 1.75 * H) * 100 : NaN; }

  FE.FICHAS["dner-me-397-99"] = {
    titulo: "Índice de degradação Washington (IDW)",
    resumo: "Rocha britada em duas frações de 500 g (12,7–6,4 mm e 6,4–2,0 mm) agitada com 200 cm³ de água por 20 min; a água de lavagem (500 mℓ) é sedimentada na proveta de equivalente de areia com solução de cloreto de cálcio; IDW = (15 − H) / (15 + 1,75 H) × 100, H = altura de sedimento em polegadas após 20 min.",
    blocos: [],
    params: [
      { k: "material", r: "Rocha ensaiada", ph: "ex.: basalto, granito, gnaisse" },
      { k: "unidade", r: "Unidade da leitura da altura de sedimento", tipo: "select", recarrega: true,
        opcoes: [["pol", "Polegadas (6.6 — precisão de 0,1\")"], ["cm", "Centímetros (convertida: 1\" = 2,54 cm)"]] },
      { k: "minimo", r: "IDW mínimo exigido — opcional", dica: "da especificação ou do projeto; a norma não fixa limite (valores maiores = melhores materiais)" },
    ],
    padrao: { unidade: "pol" },
    tabelas: function (d) {
      var cm = (d.params || {}).unidade === "cm";
      return [{
        chave: "det", titulo: "Determinações", rotulo: "Det.", iniciais: 1, min: 1,
        dica: "a norma prevê uma determinação por amostra; com mais de uma coluna, o resultado é a média",
        linhas: [
          { grupo: "Amostra (seção 5) — britada, lavada na nº 10 e seca" },
          { k: "m1", r: "Fração passando 12,7 mm e retida 6,4 mm (5 a)", u: "g", ph: "500" },
          { k: "m2", r: "Fração passando 6,4 mm e retida na nº 10 — 2,0 mm (5 b)", u: "g", ph: "500" },
          { grupo: "Leitura após 20 min de repouso (6.6)" },
          { k: "h", r: "Altura da coluna de sedimento", u: cm ? "cm" : "pol" },
          { calc: "H", r: "H em polegadas", u: "pol", casas: 2 },
          { calc: "idwx", r: "IDW = (15 − H) / (15 + 1,75 H) × 100 (seção 7)", u: "", casas: 1 },
          { calc: "idw", r: "IDW arredondado (Tabela 1)", u: "", casas: 0, destaque: true },
        ],
      }];
    },
    calcular: function (d) {
      var P = d.params || {}, avisos = [];
      var dets = (d.det || []).map(function (x, i) {
        var R = "Determinação " + (i + 1) + ": ";
        var H = alturaPol(x, P), v = idw(H);
        [["m1", "5 a"], ["m2", "5 b"]].forEach(function (f) {
          var m = num(x[f[0]]);
          if (ok(m) && Math.abs(m - FRACAO) > 1) avisos.push(R + "fração com " + fmt(m, 1) + " g; a norma pede 500 g (" + f[1] + ").");
        });
        if (ok(H) && (H < 0 || H > 15)) avisos.push(R + "H = " + fmt(H, 2) + "\" fora do intervalo 0–15\" da fórmula (15\" = marca de 38,1 cm da proveta).");
        if (ok(H) && P.unidade !== "cm" && Math.abs(H * 10 - Math.round(H * 10)) > 1e-6) avisos.push(R + "a leitura é feita com precisão de 0,1\" (6.6).");
        return { H: H, idwx: v, idw: ok(v) ? Math.round(v) : NaN };
      });
      var vals = dets.map(function (o) { return o.idwx; }).filter(ok);
      var m = media(vals), final = ok(m) ? Math.round(m) : NaN;
      var minimo = num(P.minimo);
      if (ok(final) && ok(minimo) && final < minimo) avisos.push("IDW = " + final + ", abaixo do mínimo exigido de " + fmt(minimo, 0) + ".");
      return { tab: { det: dets }, resultados: { idw: final, idwExato: m, n: vals.length, H: media(dets.map(function (o) { return o.H; })),
        minimo: minimo, conforme: ok(final) && ok(minimo) ? final >= minimo : null }, avisos: avisos };
    },
    resultadosHtml: function (calc) {
      var r = calc.resultados;
      return '<div class="fe-res"><div class="fe-res-item"><div class="fe-res-v">' + (ok(r.idw) ? r.idw : "—") + "</div>" +
        '<div class="fe-res-r">Índice de degradação Washington' + (r.n > 1 ? " — média de " + r.n + " determinações" : "") +
        (ok(r.idwExato) ? " (" + fmt(r.idwExato, 1) + ")" : "") +
        (r.conforme === null ? "" : r.conforme ? ' · <span class="fe-ok">atende</span>' : ' · <span class="fe-nok">não atende</span>') + "</div></div>" +
        '<div class="fe-res-item"><div class="fe-res-v fe-res-p">' + fmt(r.H, 2) + ' <small>pol</small></div><div class="fe-res-r">Altura de sedimento H</div></div></div>';
    },
    relatorio: {
      notas: "IDW = (15 − H) / (15 + 1,75 H) × 100 (seção 7), H = altura da coluna de sedimento em polegadas lida 20 min após a agitação (6.6), com precisão de 0,1\" (0,254 cm). Escala de 0 a 100: valores maiores correspondem aos melhores materiais. Resultado arredondado ao inteiro, como na Tabela 1 do anexo. Agitação: 20 min a 300 ± 5 oscilações/min com 200 cm³ de água (6.1–6.2); 7 mℓ de solução de trabalho na proveta (6.3).",
      resultados: function (calc, d) {
        var r = calc.resultados, P = d.params || {}, rows = [];
        if (P.material) rows.push(["Rocha", P.material]);
        rows.push(["Altura de sedimento (H)", fmt(r.H, 2) + " pol (" + fmt(r.H * 2.54, 2) + " cm)"]);
        rows.push(["Índice de degradação Washington (IDW)", (ok(r.idw) ? String(r.idw) : "—") + (r.n > 1 ? " — média de " + r.n + " determinações" : "") +
          (r.conforme === null ? "" : r.conforme ? " — atende ao mínimo de " + fmt(r.minimo, 0) : " — NÃO ATENDE ao mínimo de " + fmt(r.minimo, 0))]);
        return rows;
      },
    },
    exemplos: [
      { nome: "Basalto — leitura em polegadas", dados: function () {
        return { ident: { registro: "EX-IDW-001", obra: "Obra A", origem: "Pedreira X", camada: "Brita para revestimento" },
          params: { material: "Basalto", unidade: "pol", minimo: "" },
          det: [{ m1: "500,0", m2: "500,1", h: "1,2" }] };
      } },
      { nome: "Granito alterado — leitura em cm, fração fora de 500 g, abaixo do mínimo", dados: function () {
        return { ident: { registro: "EX-IDW-002", origem: "Pedreira Y", camada: "Sub-base" },
          params: { material: "Granito alterado", unidade: "cm", minimo: "35" },
          det: [{ m1: "500,2", m2: "487,5", h: "17,5" }] };
      } },
    ],
  };
})();
