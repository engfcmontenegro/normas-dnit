/*
 * Ficha: DNER-EM 367/97 — Material de enchimento (fíler) para misturas betuminosas — recebimento.
 * Motor FE.recebimentoMaterialEM (site/fichas/dner-em-036-95.js; RM.passaEm em dner-em-260-94.js).
 */
(function () {
  "use strict";
  var FE = window.FE, RM = FE.recebimentoMaterialEM, ok = FE.ok, fmt = FE.fmt;
  var ID = "dner-em-367-97";
  var GR = [[0.42, "0,42 mm", { min: 100, casas: 0, texto: "100 %" }], [0.18, "0,18 mm", { min: 95, max: 100, casas: 0 }], [0.075, "0,075 mm", { min: 65, max: 100, casas: 0 }]];
  function tipo(P) { return P.classe || "calcario"; }
  var SIT = [["ok", "atende", /^(atende|aceito|conforme|ok|sim)/i, true], ["nao", "não atende", /^(n[aã]o|rejeitado|reprovado)/i, false], ["pend", "pendente", /^pend/i, null]];

  FE.FICHAS[ID] = RM.criar({
    titulo: "Recebimento de material de enchimento (fíler)",
    resumo: "Fíler (cimento Portland, pó calcário, cal hidratada, pó de pedra, cinza volante): granulometria da Tabela (5.1), massas específicas real e aparente (4.3), exigências do tipo (5.2 a 5.5), condições gerais e embalagem (4.1, 4.4); parecer (6.1).",
    tabela: "DNER-EM 367/97",
    classes: [["cimento", "Cimento Portland"], ["calcario", "Pó calcário"], ["cal", "Cal hidratada"], ["pedra", "Pó de pedra"], ["cinza", "Cinza volante"], ["outro", "Outro material mineral"]],
    rotuloClasse: "Tipo de material de enchimento (4.2)",
    padrao: { classe: "calcario" },
    lote: { unid: "kg", rotuloQtd: "Quantidade do lote (kg — unidade de compra, 4.5)" },
    rotuloDet: "Amostra",
    ensaios: [
      { id: "p042", grupo: "Granulometria — Tabela (5.1)", r: "Passando na peneira de " + GR[0][1], metodo: "DNER-ME 083 (DNIT 412-ME)", secao: "5.1", u: "%", casas: 1, lim: GR[0][2] },
      { id: "p018", grupo: "Granulometria — Tabela (5.1)", r: "Passando na peneira de " + GR[1][1], metodo: "DNER-ME 083 (DNIT 412-ME)", secao: "5.1", u: "%", casas: 1, lim: GR[1][2] },
      { id: "p0075", grupo: "Granulometria — Tabela (5.1)", r: "Passando na peneira de " + GR[2][1], metodo: "DNER-ME 083 (DNIT 412-ME)", secao: "5.1 / 3", u: "%", casas: 1, lim: GR[2][2] },
      { id: "mer", grupo: "Massas específicas (4.3)", r: "Massa específica real", metodo: "DNER-ME 085/94", secao: "4.3", u: "g/cm³", casas: 2, lim: { texto: "determinar (sem limite)", info: true } },
      { id: "mea", grupo: "Massas específicas (4.3)", r: "Massa específica aparente (densidade real, picnômetro)", metodo: "DNER-ME 084/95", secao: "4.3", u: "g/cm³", casas: 2,
        lim: { texto: "determinar (sem limite)", info: true } },
      { id: "cim", grupo: "Exigências do tipo de material (5.2 a 5.5)", r: "Cimento Portland atende à DNER-EM 036/95", metodo: "DNER-EM 036/95", secao: "5.2", tipo: "qual",
        se: function (P) { return tipo(P) === "cimento"; }, lim: { texto: "atende" }, opcoes: SIT, ph: "atende / não atende" },
      { id: "carb", grupo: "Exigências do tipo de material (5.2 a 5.5)", r: "Teor de carbonatos, em CaCO₃", metodo: "análise química", secao: "5.3", u: "%", casas: 1,
        se: function (P) { return tipo(P) === "calcario"; }, lim: { min: 70, casas: 0 } },
      { id: "cal", grupo: "Exigências do tipo de material (5.2 a 5.5)", r: "Cal hidratada atende à NBR 7175", metodo: "NBR 7175/92", secao: "5.4", tipo: "qual",
        se: function (P) { return tipo(P) === "cal"; }, lim: { texto: "atende" }, opcoes: SIT, ph: "atende / não atende" },
      { id: "rcs", grupo: "Exigências do tipo de material (5.2 a 5.5)", r: "Cinza volante — resistência à compressão simples (solo-cinza-cal)", metodo: "DNER-ME 180/94", secao: "5.5", u: "MPa", casas: 2,
        se: function (P) { return tipo(P) === "cinza"; }, lim: { texto: "ensaio exigido (a EM não fixa limite)", info: true } },
      { id: "rcd", grupo: "Exigências do tipo de material (5.2 a 5.5)", r: "Cinza volante — resistência à tração por compressão diametral", metodo: "DNER-ME 181/94", secao: "5.5", u: "MPa", casas: 2,
        se: function (P) { return tipo(P) === "cinza"; }, lim: { texto: "ensaio exigido (a EM não fixa limite)", info: true } },
    ],
    inspecao: [
      { k: "iHomog", r: "Homogêneo, seco e livre de grumos", secao: "4.1", exigido: "atende" },
      { k: "iEmb", r: "Sacos vedados e protegidos da umidade, com etiqueta (tipo, peso, fabricante)", secao: "4.4", exigido: "atende", falha: "ressalva" },
      { k: "iInerte", r: "Material mineral inerte em relação aos demais componentes da mistura", secao: "3", exigido: "atende", opcional: true },
    ],
    importar: [
      { k: "impGr", r: "Importar granulometria (DNIT 412-ME)", de: "dnit-412-2025-me", ensaios: ["p042", "p018", "p0075"],
        valores: function (e) { var m = e.resultados.media; return { p042: RM.passaEm(m, 0.42), p018: RM.passaEm(m, 0.18), p0075: RM.passaEm(m, 0.075) }; } },
      { k: "impMer", r: "Importar massa específica real (DNER-ME 085)", de: "dner-me-085-94", ensaios: ["mer"], valores: function (e) { return { mer: e.resultados.mu }; } },
      { k: "impMea", r: "Importar massa específica aparente (DNER-ME 084)", de: "dner-me-084-95", ensaios: ["mea"], valores: function (e) { return { mea: e.resultados.Dr }; } },
      { k: "impCim", r: "Importar parecer do cimento (DNER-EM 036/95)", de: "dner-em-036-95", ensaios: ["cim"],
        valores: function (e) { var p = (e.resultados.parecer || {}).parecer; return { cim: p === "REJEITADO" ? "não atende" : p === "PENDENTE" ? "pendente" : p ? "atende" : "" }; },
        rot: function (e) { return (e.resultados.parecer || {}).titulo || ""; } },
      { k: "impCinza", r: "Importar ensaios da cinza volante (DNER-ME 180 e 181)", de: ["dner-me-180-94", "dner-me-181-94"], ensaios: ["rcs", "rcd"],
        valores: function (e) {
          var r = e.resultados.rcs || {}, idades = Object.keys(r).map(Number).sort(function (a, b) { return a - b; }), ult = idades[idades.length - 1];
          var v = ok(ult) && r[ult].max ? r[ult].max.y : NaN, o = {};
          o[e.ficha === "dner-me-181-94" ? "rcd" : "rcs"] = v;
          return o;
        },
        rot: function (e) { var r = e.resultados.rcs || {}, id = Object.keys(r).map(Number).sort(function (a, b) { return a - b; }).pop(); return ok(id) ? id + " dias" : ""; } },
    ],
    extra: function (ctx) {
      var V = ctx.V, P = ctx.P;
      if (ok(V.mer) && ok(V.mea) && V.mea > V.mer + 0.02) ctx.avisos.push("Massa específica aparente (" + fmt(V.mea, 2) + ") maior que a real (" + fmt(V.mer, 2) + " g/cm³) — confira os ensaios (4.3).");
      if (P.classe === "cinza") ctx.avisos.push("5.5: a EM manda a cinza volante \"obedecer às exigências\" das DNER-ME 180/94 e 181/94, que são métodos de ensaio sem limites; os resultados entram como informativos — compare com o projeto.");
      ctx.extraRes = { curva: [{ mm: 0.42, pass: V.p042 }, { mm: 0.18, pass: V.p018 }, { mm: 0.075, pass: V.p0075 }] };
    },
    graficos: function (calc, d, opt) {
      var c = (calc.resultados.ctx || {}).curva || [];
      return [RM.graficoGran("Granulometria do fíler × Tabela (5.1)", [{ pts: c.map(function (p, i) { return { mm: p.mm, pass: p.pass, fora: ok(p.pass) && !RM.atende(p.pass, GR[i][2]) }; }) }],
        GR.map(function (g) { return { mm: g[0], min: g[2].min, max: 100 }; }), opt)];
    },
    notas: "DNER-EM 367/97: fíler = material mineral inerte, finamente dividido, com ≥ 65 % passando na peneira de 0,075 mm (3). Granulometria (5.1): 100 % passando em 0,42 mm, 95–100 % em 0,18 mm e " +
      "65–100 % em 0,075 mm (resultado = média das amostras; na importação da DNIT 412-ME o % passando é interpolado em escala log quando a série não tem a peneira). Massas específicas real e aparente " +
      "determinadas pelas DNER-ME 085/94 e 084/95 (4.3), sem limite (a DNER-ME 084/95 determina a densidade real do agregado miúdo, embora a EM a associe à massa específica aparente). Cimento Portland: DNER-EM 036/95 (5.2); pó calcário: ≥ 70 % de carbonatos em CaCO₃ (5.3); cal hidratada: NBR 7175 (5.4); " +
      "cinza volante: DNER-ME 180 e 181 (5.5). Aceitação (6.1): atendidas as seções 4 e 5, aceito; caso contrário, rejeitado (6.1.2).",
    exemplos: [
      { nome: "Pó calcário — lote aceito (massa específica real importada da DNER-ME 085)", dados: function () {
        var d = { ident: { registro: "REC-FIL-01", data: "2026-03-18", obra: "Obra A — usina de asfalto", origem: "Fornecedor A", camada: "Fíler para CBUQ" },
          params: { classe: "calcario", fornecedor: "Fornecedor A", nf: "7781", quantidade: "12000", dataReceb: "18/03/2026", dataAmostra: "18/03/2026", iHomog: "S", iEmb: "S", iInerte: "S" },
          det: [{ p042: "100", p018: "98,6", p0075: "82,4", mea: "2,70", carb: "88,5" }, { p042: "100", p018: "98,1", p0075: "80,9" }] };
        RM.importarEx(ID, d, "impMer", [["dner-me-085-94", 1]]);
        return d;
      } },
      { nome: "Pó de pedra como fíler — rejeitado (granulometria grossa, grumos, embalagem)", dados: function () {
        return { ident: { registro: "REC-FIL-02", data: "2026-04-22", obra: "Obra B", origem: "Pedreira Y", camada: "Fíler para microrrevestimento" },
          params: { classe: "pedra", fornecedor: "Pedreira Y", quantidade: "8000", dataReceb: "22/04/2026", dataAmostra: "22/04/2026", iHomog: "N", iEmb: "N" },
          det: [{ p042: "99,2", p018: "88,4", p0075: "58,7", mer: "2,74", mea: "2,69" }, { p042: "98,8", p018: "87,1", p0075: "57,2" }] };
      } },
    ],
  });
})();
