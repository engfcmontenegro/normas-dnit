/*
 * Ficha de ACEITAÇÃO DE LOTE: DNIT 407/2017-ES — Sub-base estabilizada granulometricamente com Açobrita®
 * (montagem comum FE.aceitacaoG1.escoria, em es-dnit-406-2017-es.js).
 *   5.1.1 (p. 3)   Açobrita®: faixa da Tabela 1; ISC ≥ 20 % (Método B); LA < 55 %; potencial de expansão < 3,0 %; MR ≥ 300 MPa;
 *                  índice de forma > 0,5 e lamelares ≤ 10 %.
 *   5.1.2 (p. 3)   mistura: ISC > 20 % e expansão ≤ 1 % (DNIT 164, Método B); potencial de expansão ≤ 1,5 %. (Não cita faixa
 *                  granulométrica — mas 7.4.2 manda controlar a granulometria e o Anexo A, normativo, traz a Tabela 2.)
 *   5.3.4–5.3.6 (p. 4–5) GC mínimo de 100 %.   7.1 (p. 5–6): 1 por camada a cada 200 m ou jornada (400 m); mín. 5 (Tabela 3).
 *   7.2 (p. 6)     umidade ± 2 %; GC a cada 100 m, "GC > 100 %".   7.3.1 (p. 6): largura ± 10 cm; flecha +20 %; espessura ± 10 %.
 *   7.4.1 (p. 6)   expansão < 0,5 % — conflita com 5.1.2 (≤ 1 %): a ficha deixa escolher; padrão 7.4.1 (critério de aceitação).
 */
(function () {
  "use strict";
  var FE = window.FE, A = FE.aceitacao, G1 = FE.aceitacaoG1, num = FE.num, ok = FE.ok, fmt = FE.fmt, X = G1.ex, E = G1.exEsc, PEN7 = G1.PEN_ESC7;
  var FX = [["", "— sem faixa (só a curva de projeto ± tolerância) —"]].concat(["A", "B", "C", "D", "E", "F"].map(function (f) {
    return ["dnit-407-2017-es-misturas-" + f, "Faixa " + f + " da Tabela 2 (Anexo A)" + (f < "E" ? " — N > 5 × 10⁶" : " — N < 5 × 10⁶")]; }));
  var F = G1.escoria({
    id: "dnit-407-2017-es", codigo: "DNIT 407/2017-ES", mat: "Açobrita®", pen: PEN7, faixas: FX, faixaPadrao: "", insFaixa: "dnit-407-2017-es-acobrita",
    titulo: "Sub-base com Açobrita® (agregado siderúrgico) — aceitação de lote",
    resumo: "Reúne os ensaios do lote (importados das fichas ME ou digitados), confere a frequência (7.1, 7.2; mín. 5 pela Tabela 3) e aplica os critérios da ES: " +
      "mistura (granulometria com X̄ ± k·s, ISC > 20 %, expansão < 0,5 % pela 7.4.1 ou ≤ 1 % pela 5.1.2, potencial de expansão ≤ 1,5 %), GC ≥ 100 %, umidade ± 2 %, " +
      "Açobrita® (Tabela 1, ISC ≥ 20 %, LA < 55 %, expansão < 3 %, MR ≥ 300 MPa, forma) e controle geométrico.",
    tabela: "Tabela 3", metodo: "DNIT 164, Método B", metodoFreq: "DNIT 164, Método B", a_cada: 200, a_cadaH: 400,
    sec: { ins: "5.1.1", mix: "5.1.2", faixa: "Anexo A, Tabela 2", aceGran: "7.4.2", ace: "7.4", corr: "7.4.4", tab: "7.1.2, p. 5", freq: "7.1.1, 7.1.2", nexec: "7.2.3",
      umid: "7.2.1 a", gc: "5.3.4–5.3.6; 7.2.2", gcFreq: "7.2.2", gcAce: "7.2.2; 7.4.3", gcMin: "5.3.4–5.3.6", gc2: "7.2.2", aceIsc: "7.4.3", geo: "7.3.1", esp: "5.3.3", med: "8.1–8.3" },
    ins: { isc: 20, la: 55, fi: true },
    mix: {
      isc: function () { return 20; }, iscTxt: function () { return "> 20 %"; },
      exp: function (P) { return P.expCrit === "512" ? 1.0 + 1e-6 : 0.5; },
      expTxt: function (P) { return P.expCrit === "512" ? "≤ 1 % (5.1.2)" : "< 0,5 % (7.4.1)"; },
      expSec: function (P) { return P.expCrit === "512" ? "5.1.2" : "7.4.1"; },
      pexp: function () { return 1.5; }, pexpTxt: function () { return "≤ 1,5 %"; }, pexpSec: "5.1.2",
    },
    params: [{ k: "expCrit", r: "Limite de expansão da mistura (a ES se contradiz)", tipo: "select",
      opcoes: [["741", "< 0,5 % — 7.4.1 (condição de conformidade)"], ["512", "≤ 1 % — 5.1.2 (característica da mistura)"]] }],
    padrao: { expCrit: "741" },
    notas: "DNIT 407/2017-ES. Métodos citados e substituídos: DNER-ME 080 → DNIT 412; DNER-ME 129 → DNIT 164; DNER-ME 049 → DNIT 172; DNER-ME 035 → DNIT 451; " +
      "DNER-ME 086 → DNIT 424; DNER-ME 052/088 → DNIT 456; DNER-ME 092 → DNIT 458. Granulometria da mistura: a 5.1.2 não exige faixa; usa-se a curva de projeto ± tolerância " +
      "e, se escolhida, a faixa da Tabela 2 (Anexo A). GC: mínimo de 100 % (5.3.4–5.3.6); 7.2.2 escreve \"> 100 %\". Umidade: tolerância de execução (fora dela, ressalva).",
  });
  F.exemplos = [
    { nome: "Lote aceito — sub-base com Açobrita®, 300 m, curva de projeto ± tolerância", dados: function () {
      var d = { ident: { registro: "LOTE-SA-001", data: "2026-07-29", obra: "Obra A — BR-000", trecho: "Lote 3", local: "Est. 120 a 135", camada: "Sub-base — Açobrita® + solo", origem: "Fornecedor A + Jazida 2" },
        params: Object.assign({}, F.padrao, { estIni: "120", estFim: "135", largura: "9,00", espessura: "18", flechaProj: "9" }), obs: "" };
      var ests = [121, 124, 127, 130, 133];
      d.gran = E.granCols(PEN7, ests, [[100, 96, 72, 58, 44, 29, 15.2], [100, 95, 70, 56, 42, 28, 14.6], [100, 97, 73, 59, 45, 30, 15.8], [100, 96, 71, 57, 43, 28, 14.9], [100, 95, 72, 58, 44, 29, 15.4]], "GR");
      d.granP = [E.projDe(PEN7, [100, 96, 72, 57, 43, 29, 15])];
      d.comp = E.comp(ests, [["2,215", "10,4", "46", "0,21", "0,62"], ["2,208", "10,7", "41", "0,28", "0,71"], ["2,221", "10,2", "52", "0,18", "0,55"], ["2,211", "10,5", "44", "0,25", "0,68"], ["2,217", "10,3", "49", "0,22", "0,60"]], "CP");
      d.ins = [{ reg: "INS-01 (digitado)", isc: "96", la: "28", pexp: "1,42", mr: "360", fi: "0,68", lam: "7,5" }];
      d.granI = E.granCols(PEN7, [120], [[100, 90, 65, 47, 34, 17, 6.9]], "GR-A");
      d.umid = X.colunas([[121, 10.1], [124, 11.3], [127, 9.6], [130, 11.8], [133, 10.4]], "w", "Campo — Speedy");
      d.gc = E.gcCols([[120, 101.1], [123, 100.8], [126, 101.9], [129, 100.6], [132, 101.4], [134, 101.0]]);
      d.geo = X.secoes(120, 16, function (i) { return { larg: 9.04 + X.onda(i, 0.05), esp: 18.3 + X.onda(i, 1.0), flecha: 9.8 + X.onda(i, 0.5) }; });
      d.obs = "Exemplo gerado: sem faixa da Tabela 2 (a 5.1.2 da sub-base não a exige): granulometria contra a curva de projeto ± tolerância.";
      return d;
    } },
    { nome: "Lote rejeitado pela 7.4.1 — expansão entre 0,5 e 1 % (atenderia à 5.1.2) e potencial de expansão do Açobrita® importado > 3 %", dados: function () {
      var d = { ident: { registro: "LOTE-SA-002", data: "2026-08-12", obra: "Obra B — BR-000", trecho: "Lote 4", local: "Est. 30 a 45", camada: "Sub-base — Açobrita® + solo", origem: "Fornecedor B + Jazida 3" },
        params: Object.assign({}, F.padrao, { estIni: "30", estFim: "45", largura: "9,00", espessura: "18", flechaProj: "9" }), obs: "" };
      var ests = [31, 34, 37, 40, 43];
      d.gran = E.granCols(PEN7, ests, [[100, 96, 72, 58, 44, 29, 15.2], [100, 95, 70, 56, 42, 28, 14.6], [100, 97, 73, 59, 45, 30, 15.8], [100, 96, 71, 57, 43, 28, 14.9], [100, 95, 72, 58, 44, 29, 15.4]], "GR");
      d.granP = [E.projDe(PEN7, [100, 96, 72, 57, 43, 29, 15])];
      d.comp = E.comp(ests, [["2,204", "10,8", "38", "0,62", "0,92"], ["2,198", "11,0", "33", "0,74", "1,05"], ["2,210", "10,6", "41", "0,48", "0,81"], ["2,201", "10,9", "36", "0,69", "0,98"], ["2,206", "10,7", "39", "0,55", "0,88"]], "CP");
      X.importar(F, d, "imp_ins", [["dnit-113-2009-me", 1]]);
      d.ins.push({ reg: "INS-02 (digitado)", isc: "88", la: "31", mr: "340", fi: "0,64", lam: "8,1" });
      d.granI = E.granCols(PEN7, [30], [[100, 91, 66, 48, 36, 18, 7.2]], "GR-A");
      d.umid = X.colunas([[31, 10.9], [34, 11.9], [37, 10.2], [40, 12.1], [43, 11.4]], "w", "Campo — Speedy");
      d.gc = E.gcCols([[30, 100.9], [33, 101.4], [36, 100.6], [39, 101.8], [42, 101.1], [44, 100.7]]);
      d.geo = X.secoes(30, 16, function (i) { return { larg: 9.03 + X.onda(i, 0.05), esp: 18.2 + X.onda(i, 1.0), flecha: 9.7 + X.onda(i, 0.5) }; });
      d.obs = "Exemplo: expansões de 0,48 a 0,74 % — não conformes pela 7.4.1 (< 0,5 %), conformes pela 5.1.2 (≤ 1 %): troque o parâmetro \"Limite de expansão\" para ver a diferença. " +
        "Potencial de expansão do Açobrita® de 4,00 % importado do exemplo DNIT 113 (> 3,0 %).";
      return d;
    } },
  ];
})();
