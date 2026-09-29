/*
 * Ficha de ACEITAÇÃO DE LOTE: DNIT 421/2019-ES — Solo-cal: adição de cal para estabilização de camada de SUB-BASE.
 * Mesmo texto da DNIT 420/2019-ES (base), exceto 7.2.1 d: GC ≥ 100 % na energia NORMAL OU INTERMEDIÁRIA.
 * Usa FE.aceitacaoG2.soloCal (es-dnit-420-2019-es.js), que usa o construtor comum de es-dnit-140-2022-es.js.
 * Critérios: 5.2 (teor de cal × pH, ISC/RCS/MR do projeto), 5.4.1 b (pulverização ≥ 50 %), 5.4.3 (h ót ± 1 p.p.),
 * 5.4.5 (12 a 20 cm), 7.1.1 (CaO por carregamento), 7.1.2 (solo a cada 100 m; ≥ 5 se área ≤ 4000 m²), 7.2.1 (umidade,
 * cal, espessura solta a cada 50 m, ISC e expansão a cada 300 m, GC ≥ 100 %), 7.2.2 (deflexão, n ≥ 15), 7.3 (geometria),
 * 7.5 (X̄ ± k·s, tabela de amostragem variável sem n = 11).
 */
(function () {
  "use strict";
  var FE = window.FE, A = FE.aceitacao, G2 = FE.aceitacaoG2;
  G2.soloCal({
    id: "dnit-421-2019-es", codigo: "DNIT 421/2019-ES", energia: "normal ou intermediária", secRel: "8 e",
    titulo: "Sub-base de solo-cal — aceitação de lote",
    resumo: "Reúne os ensaios do lote (importados das fichas ME ou digitados), confere a frequência e aplica os critérios da DNIT 421/2019-ES: umidade (h ót ± 1 p.p.), " +
      "ISC e expansão do projeto (a cada 300 m), GC ≥ 100 % (energia normal ou intermediária), pulverização ≥ 50 %, teor de cal × pH (DNIT 419), CaO por carregamento, " +
      "caracterização do solo, deflexão (D̄ + K·S ≤ LSE) e controle geométrico, com o controle estatístico de 7.5.",
    exemplos: function (F) {
      var X = G2.ex;
      function base(reg, extra) {
        return { ident: Object.assign({ registro: reg, data: "2026-06-30", obra: "Obra E — Rua A", origem: "Jazida 6 + cal do Fornecedor C", camada: "Sub-base de solo-cal (4 %)" }, extra.ident || {}),
          params: Object.assign({}, F.padrao, extra.params), umid: [{}], comp: [{}], gc: [{}], pulv: [{}], cal: [{}], ph: [{}], cao: [{}], solo: [{}], obs: "" };
      }
      return [
        { nome: "Lote aceito — sub-base de solo-cal 5 %, 200 m, energia normal (pH da DNIT 419 importado)", dados: function () {
          var d = base("LOTE-SBCAL-01", { ident: { trecho: "Segmento único", local: "Est. 0 a 10" },
            params: { estIni: "0", estFim: "10", largura: "7,00", espessura: "15", lse: "110", iscProj: "25", teorProj: "5", flechaProj: "3,5", nCarreg: "1", recicladora: "sim" } });
          d.comp = X.cols(["gs", "hot", "isc", "exp"], [["5", 1.598, 22.8, 31, 0.34]], { reg: "ISC-201 · DNIT 172" });
          d.umid = X.cols(["w"], [["1", 22.5], ["3", 23.3], ["5", 22.9], ["7", 23.6], ["9", 22.4]], { reg: "Campo — Speedy" });
          d.gc = [["1", "LE", 100.8], ["2", "eixo", 101.5], ["4", "LD", 101.1], ["6", "LE", 102.0], ["8", "eixo", 100.9], ["9", "LD", 101.3]]
            .map(function (x, i) { return { est: x[0], pos: x[1], reg: "DNER-ME 036 — furo " + (i + 1), gc: A.nstr(x[2], 1) }; });
          d.cal = X.cols(["taxa", "solta"], [["0", 10.2, 19.1], ["2", null, 19.4], ["5", 10.5, 18.9], ["7", null, 19.6], ["10", null, 19.2]], { reg: "Campo" });
          X.importar(F, d, "impPH", [["dnit-419-2019-me", 0]]);
          d.cao = X.cols(["cao"], [["canteiro", 91.0]], { reg: "NBR 6473" });
          d.solo = X.cols(["ll", "ip", "p200"], [["1", 48, 21, 78], ["3", 47, 20, 76], ["5", 49, 22, 79], ["7", 46, 20, 75], ["9", 48, 21, 77]], { reg: "Caracterização" });
          d.defl = X.deflexoes(0, [96, 101, 92, 104, 98, 95, 100, 97, 103, 94, 99, 96, 102, 97, 100, 95]);
          d.defl.forEach(function (c, i) { c.est = A.fmtEstaca(i * 12.5, { simples: true }); });
          d.geo = X.secoes(0, [[7.04, 15.3, 3.7], [6.97, 14.8, 3.9], [7.06, 15.5, 3.8], [7.02, 14.6, 3.6], [6.95, 15.2, 4.0], [7.03, 15.4, 3.8], [7.00, 14.9, 3.7],
            [7.05, 15.1, 3.9], [6.98, 15.0, 3.8], [7.04, 14.7, 3.7], [7.01, 15.3, 3.9]], true);
          d.verif = X.verif(8);
          d.obs = "Exemplo: mistura com recicladora (pulverização prévia dispensável, 5.4.1 nota); teor mínimo pelo pH do exemplo do Anexo B da DNIT 419 (5 %).";
          return d;
        } },
        { nome: "Lote aceito com ressalva — um furo com GC abaixo de 100 % (estatística atendida)", dados: function () {
          var d = base("LOTE-SBCAL-02", { ident: { trecho: "Lote 2", local: "Est. 40 a 70" },
            params: { estIni: "40", estFim: "70", largura: "7,00", espessura: "15", lse: "110", iscProj: "25", teorProj: "6", flechaProj: "3,5", nCarreg: "3" } });
          d.comp = X.cols(["gs", "hot", "isc", "exp"], [["48", 1.604, 22.4, 33, 0.29], ["63", 1.611, 22.6, 36, 0.25]], { reg: function (i) { return "ISC-23" + (i + 3) + " · DNIT 172"; } });
          d.umid = X.cols(["w"], [["42", 22.0], ["47", 22.9], ["53", 23.1], ["58", 21.9], ["64", 22.6], ["68", 22.3]], { reg: "Campo — Speedy" });
          d.gc = [["41", "LE", 101.2], ["45", "eixo", 100.9], ["50", "LD", 101.6], ["55", "LE", 99.6], ["60", "eixo", 101.8], ["65", "LD", 101.0], ["69", "LE", 101.4]]
            .map(function (x, i) { return { est: x[0], pos: x[1], reg: "DNIT 458 — furo " + (i + 1), gc: A.nstr(x[2], 1) }; });
          d.pulv = X.cols(["p4"], [["44", 61], ["58", 57]], { reg: "Peneira nº 4" });
          d.cal = X.cols(["taxa", "solta"], [["40", 12.1, 19.3], ["42", null, 19.1], ["45", null, 19.6], ["47", null, 19.4], ["50", 12.4, 19.0], ["52", null, 19.5], ["55", null, 19.2],
            ["57", null, 19.7], ["60", 12.0, 19.3], ["62", null, 19.1], ["65", null, 19.6], ["67", null, 19.4], ["70", null, 19.2]], { reg: "Campo" });
          X.importar(F, d, "impPH", [["dnit-419-2019-me", 1]]);
          d.cao = X.cols(["cao"], [["canteiro", 89.2], ["canteiro", 90.4], ["canteiro", 88.9]], { reg: "NBR 6473" });
          d.solo = X.cols(["ll", "ip", "p200"], [["41", 47, 20, 76], ["46", 48, 21, 77], ["51", 46, 20, 74], ["56", 49, 22, 78], ["61", 47, 21, 76], ["66", 48, 20, 75], ["69", 47, 21, 77]], { reg: "Caracterização" });
          d.defl = X.deflexoes(40, [97, 102, 94, 99, 101, 96, 98, 100, 95, 103, 97, 99, 96, 101, 98, 94, 100, 97, 102, 95, 99, 98, 101, 96, 97, 100, 94, 99, 102, 96, 98]);
          d.geo = X.secoes(40, [[7.03, 15.2, 3.8], [7.05, 14.9, 3.7], [6.98, 15.4, 3.9], [7.02, 15.0, 3.8], [7.06, 14.7, 3.7], [7.01, 15.3, 3.9], [6.97, 15.1, 3.8], [7.04, 14.8, 3.7],
            [7.02, 15.5, 3.8], [7.00, 15.0, 3.9], [7.05, 14.9, 3.7], [6.99, 15.2, 3.8], [7.03, 15.1, 3.9], [7.01, 14.8, 3.7], [7.04, 15.4, 3.8], [7.02, 15.0, 3.9],
            [6.98, 15.2, 3.7], [7.03, 14.9, 3.8], [7.05, 15.3, 3.9], [7.00, 15.1, 3.8], [7.02, 14.8, 3.7], [7.04, 15.2, 3.9], [6.99, 15.0, 3.8], [7.03, 15.4, 3.7],
            [7.01, 14.9, 3.8], [7.05, 15.1, 3.9], [7.02, 15.3, 3.7], [6.98, 15.0, 3.8], [7.04, 14.8, 3.9], [7.01, 15.2, 3.8], [7.03, 15.1, 3.7]], true);
          d.verif = X.verif(8);
          d.obs = "Exemplo de ressalva: o furo da estaca 55 (GC 99,6 %) deve ser corrigido localmente, embora X̄ − k·s ≥ 100 % (7.5: todo detalhe mal executado deve ser corrigido).";
          return d;
        } },
      ];
    },
  });
})();
