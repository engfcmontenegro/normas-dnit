/*
 * Ficha: DNIT 051/2004-ME — Pavimento rígido — Selante de juntas — Deformação permanente na tração em alongamento constante.
 * Usa o código comum de window.FE.selantes (definido em dnit-038-2004-me.js).
 */
(function () {
  "use strict";
  var FE = window.FE, num = FE.num, ok = FE.ok, fmt = FE.fmt, esc = FE.esc, media = FE.media, S = FE.selantes;

  FE.FICHAS["dnit-051-2004-me"] = {
    titulo: "Selante de juntas — deformação permanente na tração (alongamento constante)",
    rotuloImportar: function (r) { return r.conforme === true ? "atende à DNIT 046-EM" : r.conforme === false ? "não atende à DNIT 046-EM" : "sem verificação"; },
    resumo: "CP de tração (DNIT 039) alongado até 1,5 vez a distância inicial entre os traços, mantido 15 min e medido após 10 min de repouso; DP = (df − di) / di × 100 (seção 7).",
    blocos: [],
    params: [
      { k: "material", r: "Material", ph: "ex.: selante de poliuretano — Fornecedor A" },
      { k: "dpMax", r: "Deformação permanente máxima (%) — opcional", dica: "a DNIT 046/2004-EM não cita este ensaio; informe o limite do projeto, se houver" },
    ].concat(S.paramsCond("6 b"), [
      { k: "tMant", r: "Tempo com o alongamento mantido (min)", ph: "15", dica: "15 minutos (6 e)" },
      { k: "tRep", r: "Repouso antes da leitura final (min)", ph: "10", dica: "10 minutos (7)" },
    ]),
    padrao: {},
    tabelas: function () {
      return [{
        chave: "cp", titulo: "Corpos-de-prova", rotulo: "CP", iniciais: 3, min: 1,
        dica: "CPs moldados e marcados como na DNIT 039 (seção 5); a norma não fixa o número de CPs",
        linhas: [
          { k: "e", r: "Espessura média da seção central (6 a)", u: "mm", ph: "2,00" },
          { k: "l", r: "Largura média do cunho (6 a)", u: "mm", ph: "6,00" },
          { k: "di", r: "Distância inicial entre os traços — di", u: "mm", ph: "25,0" },
          { k: "dm", r: "Distância mantida por 15 min (1,5 × di, 6 d)", u: "mm" },
          { k: "df", r: "Distância após 10 min de repouso — df (7)", u: "mm" },
          { calc: "al", r: "Alongamento imposto = (dm − di) / di × 100", u: "%", casas: 1 },
          { calc: "dp", r: "DP = (df − di) / di × 100 (7)", u: "%", casas: 1, destaque: true },
        ],
      }];
    },
    calcular: function (d) {
      var P = d.params || {}, avisos = [];
      var cps = (d.cp || []).map(function (x, i) {
        var e = num(x.e), l = num(x.l), di = num(x.di), dm = num(x.dm), df = num(x.df), nm = "CP " + (i + 1) + ": ";
        var o = { al: ok(dm) && ok(di) && di > 0 ? (dm - di) / di * 100 : NaN, dp: ok(df) && ok(di) && di > 0 ? (df - di) / di * 100 : NaN };
        if (S.faixa(e, 2, 0.01)) avisos.push(nm + "espessura de " + fmt(e, 2) + " mm, fora de (2,00 ± 0,01) mm da moldagem (DNIT 039, 5.1 a).");
        if (S.faixa(l, 6, 0.5)) avisos.push(nm + "largura de " + fmt(l, 2) + " mm, fora da largura do cunho (6,00 ± 0,5) mm (DNIT 039, 4.7).");
        if (S.faixa(di, 25, 0.5)) avisos.push(nm + "traços a " + fmt(di, 1) + " mm, fora de (25,0 ± 0,5) mm do marcador (DNIT 039, 4.2).");
        // alongamento de 50 %: distância = 1,5 × di, lida com aproximação de ± 1 mm (DNIT 039, 4.1)
        if (ok(dm) && ok(di) && Math.abs(dm - 1.5 * di) > 1) avisos.push(nm + "distância mantida de " + fmt(dm, 1) + " mm; deveria ser 1,5 × di = " + fmt(1.5 * di, 1) + " mm (6 d).");
        if (ok(df) && ok(di) && df < di) avisos.push(nm + "distância final menor que a inicial — confira.");
        if (ok(df) && ok(dm) && df > dm) avisos.push(nm + "distância final maior que a mantida sob carga — confira.");
        return o;
      });
      S.avisosCond(P, avisos, "6 b");
      var tm = num(P.tMant), tr = num(P.tRep);
      if (ok(tm) && tm !== 15) avisos.push("Alongamento mantido por " + fmt(tm, 0) + " min; a norma fixa 15 minutos (6 e).");
      if (ok(tr) && tr !== 10) avisos.push("Leitura após " + fmt(tr, 0) + " min de repouso; a norma fixa 10 minutos (7).");
      var vals = cps.map(function (o) { return o.dp; }).filter(ok), m = media(vals), max = num(P.dpMax);
      var conforme = ok(max) && ok(m) ? m <= max : null;
      if (conforme === false) avisos.push("Deformação permanente média de " + fmt(m, 1) + " %, acima do máximo informado de " + fmt(max, 1) + " %.");
      return { tab: { cp: cps }, resultados: { dp: m, n: vals.length, max: max, conforme: conforme,
        dpMaior: vals.length ? Math.max.apply(null, vals) : NaN }, avisos: avisos };
    },
    resultadosHtml: function (calc) {
      var r = calc.resultados;
      return '<div class="fe-res">' +
        S.item(fmt(r.dp, 1), "%", "Deformação permanente após alongamento de 50 %" + (r.n > 1 ? " — média de " + r.n + " CPs" : ""), r.conforme) +
        (r.n > 1 ? S.item(fmt(r.dpMaior, 1), "%", "Maior valor individual", null, true) : "") +
        (ok(r.max) ? S.item("≤ " + fmt(r.max, 1), "%", "Limite informado", null, true) : "") + "</div>";
    },
    relatorio: {
      notas: "DP = (df − di) / di × 100, com df medida após 10 min de repouso, depois de manter por 15 min a distância entre os traços em 1,5 × di (alongamento de 50 %) (seções 6 e 7). A norma não fixa o número de CPs; o resultado é a média dos CPs ensaiados. A DNIT 046/2004-EM não estabelece requisito para este ensaio.",
      resultados: function (calc, d) {
        var r = calc.resultados, P = d.params || {}, rows = [];
        if (P.material) rows.push(["Material", P.material]);
        rows.push(["Deformação permanente após alongamento de 50 %" + (r.n > 1 ? " (média de " + r.n + " CPs)" : ""), fmt(r.dp, 1) + " %"]);
        if (r.n > 1) rows.push(["Maior valor individual", fmt(r.dpMaior, 1) + " %"]);
        if (r.conforme !== null) rows.push(["Parecer", (r.conforme ? "Atende" : "NÃO ATENDE") + " (≤ " + fmt(r.max, 1) + " % — limite informado)"]);
        return rows;
      },
    },
    exemplos: [
      { nome: "Poliuretano — 3 CPs, dentro do limite de projeto", dados: function () {
        return { ident: { registro: "EX-SEL-DT-01", obra: "Obra A", origem: "Fornecedor A", camada: "Selante — juntas transversais" },
          params: { material: "Selante de poliuretano monocomponente", dpMax: "10", temp: "23", horas: "2", tMant: "15", tRep: "10" },
          cp: [{ e: "2,00", l: "6,01", di: "25,0", dm: "37,5", df: "26,5" }, { e: "2,01", l: "6,00", di: "25,0", dm: "37,5", df: "26,0" },
            { e: "2,00", l: "6,00", di: "25,0", dm: "37,5", df: "26,5" }] };
      } },
      { nome: "Selante betuminoso — deformação residual elevada", dados: function () {
        return { ident: { registro: "EX-SEL-DT-02", obra: "Obra B", origem: "Fornecedor B", camada: "Selante — juntas longitudinais" },
          params: { material: "Selante betuminoso elastomérico", dpMax: "10", temp: "26", horas: "2", tMant: "15", tRep: "10" },
          cp: [{ e: "2,00", l: "6,00", di: "25,0", dm: "37,5", df: "29,0" }, { e: "2,00", l: "6,02", di: "25,0", dm: "39,0", df: "29,5" },
            { e: "2,01", l: "6,00", di: "25,0", dm: "37,5", df: "28,5" }] };
      } },
    ],
  };
})();
