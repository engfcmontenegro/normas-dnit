/*
 * Ficha de ES: DNER-ES 387/99 — Areia asfalto a quente com asfalto polímero — ACEITAÇÃO DE LOTE.
 * Motor comum: FE.aceitacaoG3.criar (es-dnit-112-2009-es.js); base das DNER-ES de asfalto polímero:
 * FE.aceitacaoG3.familiaDNER (es-dner-es-386-99.js).
 */
(function () {
  "use strict";
  var FE = window.FE, G3 = FE.aceitacaoG3, ok = FE.ok;

  G3.criar(G3.familiaDNER({
    id: "dner-es-387-99", codigo: "DNER-ES 387/99", sec: { lig: "5.3.2", agr: "5.3.3", comp: "5.3.6.4" }, ligTanque: true,
    titulo: "Areia asfalto a quente com asfalto polímero — aceitação de lote",
    resumo: "Reúne os ensaios do lote (importados das fichas ME ou digitados), confere o mínimo de 5 determinações por jornada e aplica os critérios da DNER-ES 387/99: teor de ligante ± 0,3 %, granulometria na faixa de trabalho e estabilidade Marshall ≥ 250 kgf (controle estatístico X̄ ± k·s, 7.4.2), Vv, RBV e fluência dos CPs, temperaturas ± 5 °C, grau de compactação ≥ 97 %, espessura ± 5 %, alinhamentos, réguas e QI < 35.",
    faixas: ["dner-es-387-99-A", "dner-es-387-99-B", "dner-es-387-99-C"], secFaixa: "5.1.4 (quadro)", retido4: "5.1.5",
    teorFaixa: function (P, fx) { return fx ? { A: [5, 8], B: [5, 8.5], C: [5, 9] }[fx.faixa] : null; },
    dicaTeor: "quadro de 5.1.4: A 5–8 %, B 5–8,5 %, C 5–9 %; tolerância ± 0,3 % (7.2.1.1)",
    padrao: { gcRef: "projeto" },
    marshall: function () {
      return { secao: "7.2.1.4, 5.1.5 a", dica: "médias de cada conjunto de CPs Marshall (75 golpes), amostras da saída da acabadora; mínimo 5 por jornada (7.2.1.5)",
        itens: [
          { k: "est", nome: "Estabilidade (75 golpes)", unid: "kgf", casas: 0, min: 250, modo: "estat", secao: "7.2.1.4, 7.4.2 b", obrig: true },
          { k: "vv", nome: "Porcentagem de vazios (dosagem)", unid: "%", casas: 1, min: 3, max: 8, modo: "ressalva", secao: "5.1.5 a" },
          { k: "rbv", nome: "Relação betume/vazios (dosagem)", unid: "%", casas: 1, min: 65, max: 82, modo: "ressalva", secao: "5.1.5 a" },
          { k: "flu", nome: "Fluência (dosagem)", unid: "mm", casas: 1, min: 2.4, max: 4.5, modo: "ressalva", secao: "5.1.5 a" },
        ],
        freq: function (L) { return { regra: "mín. 5 por jornada de 8 h (7.2.1.5)", exigido: ok(L.jor) ? 5 * L.jor : NaN }; } };
    },
    insumos: function (P, L) {
      return this.insumosLig(L).concat([
        ["gra", "Granulometria de cada silo quente (2 por silo por jornada)", ok(L.jor) ? 2 * L.silos * L.jor : NaN, "ressalva"],
        ["ea", "Equivalente de areia ≥ 55 % (por jornada)", G3.porJornada(L), "nao_conforme"],
        ["fil", "Granulometria do fíler (por jornada)", G3.porJornada(L), "ressalva"],
        ["ade", "Adesividade (por jornada)", G3.porJornada(L), "ressalva"],
      ]);
    },
    notas: "Critérios da DNER-ES 387/99. Aceitação estatística de 7.4.2 b para teor de ligante, granulometria (peneira a peneira), estabilidade Marshall (mínimo) e GC (mínimo), com a tabela de amostragem variável de 7.2.1.5 (n = 5: 1,55 … 21: 1,01 — sem n = 11: usa-se o k de n = 10) e no mínimo 5 determinações por jornada; n < 5: valores individuais. " +
      "Vv, RBV e fluência (requisitos de dosagem de 5.1.5 a, fora da lista de 7.4.2): valores individuais, fora → ressalva. Faixa de trabalho = projeto ± tolerâncias, sem ultrapassar a faixa (5.1.4). Temperaturas (7.4.2 a): ligante 150 °C + 3 °C/1 % de polímero (≤ 180 °C), agregados 10–15 °C acima e < 183 °C, compactação 140 °C + 3 °C/1 %, ± 5 °C — fora: ressalva. Espessura, alinhamentos, réguas e QI (7.3): valores individuais.",
    exemplos: [
      { nome: "Lote aceito — faixa B, 250 m, 1 jornada (dados gerados)", dados: function () {
        var pens = [4.8, 2.0, 0.42, 0.18, 0.075], proj = [100, 95, 60, 28, 7];
        return G3.montar({ ident: { registro: "LOTE-AAP-002", data: "2026-04-22", obra: "Obra C", trecho: "Rua A", local: "Est. 0+00 a 12+10", camada: "Revestimento — areia asfalto com asfalto polímero, faixa B",
            origem: "Usina C", laboratorista: "Equipe de controle" },
          params: { estIni: "0+00", estFim: "12+10", largura: "7,00", pista: "pista única", faixa: "dner-es-387-99-B", teorProj: "7,0", pctPol: "4", gmbProj: "2,205", espProj: "3,0",
            tMist: "160", dataIni: "2026-04-22", dataFim: "2026-04-22", jornadas: "1", massa: "115", nCarreg: "1", massaLig: "15", nSilos: "2", chuva: "nao", tAmb: "24", gcRef: "projeto",
            impUsina: [], impMar: [], impPista: [] },
          pens: pens, proj: proj, teores: [7.05, 6.92, 7.18, 6.88, 7.10], pref: "EXT-0422", data: "22/04/2026", escala: 0.7,
          mar: [["312", "4,8", "74", "3,1"], ["298", "5,2", "72", "3,4"], ["335", "4,5", "76", "3,0"], ["305", "5,0", "73", "3,3"], ["321", "4,7", "75", "3,2"]].map(function (x, i) {
            return { reg: "MAR-0422-" + (i + 1), data: "22/04/2026", teor: "7,0", est: x[0], vv: x[1], rbv: x[2], flu: x[3], ncp: "3" }; }),
          temp: [{ carga: "07h20", tagr: "174", tlig: "162", tsai: "160", tesp: "151" }, { carga: "12h10", tagr: "175", tlig: "163", tsai: "158", tesp: "153" }],
          estIni: "0+00", passoGC: 50, gc: [98.2, 99.0, 97.9, 98.6, 99.2], esp: [3.02, 2.97, 3.06, 2.95, 3.04], gmbRef: 2.205, nGeo: 13,
          sup: [{ est: "0+00 a 12+10", qi: "28" }],
          ins: [[1, 0], [1, 0], [1, 0], [1, 0], [1, 0], [1, 0], [1, 0], [4, 0], [1, 0], [1, 0], [1, 0]],
          obs: "Dados gerados para demonstração. Ligante com 4 % de polímero: 162 °C; compactação 152 °C." });
      } },
      { nome: "Lote rejeitado — faixa A, 1 jornada: estabilidade na estatística, granulometria fora na nº 80 e espessuras individuais baixas (dados gerados)", dados: function () {
        var pens = [4.8, 2.0, 0.42, 0.18, 0.075], proj = [100, 95, 62, 25, 5];
        var dv = [[0, 1, 2, 3.5, 0.5], [0, -1, 1, 4.2, 0.3], [0, 0.5, 2.5, 3.8, 0.8], [0, 1.2, 1.8, 4.5, 0.4], [0, -0.4, 2.2, 3.1, 0.6]];
        return G3.montar({ ident: { registro: "LOTE-AAP-009", data: "2026-05-19", obra: "Obra D", trecho: "Rua B", local: "Est. 40+00 a 52+10", camada: "Revestimento — areia asfalto com asfalto polímero, faixa A",
            origem: "Usina C", laboratorista: "Equipe de controle" },
          params: { estIni: "40+00", estFim: "52+10", largura: "7,00", pista: "pista única", faixa: "dner-es-387-99-A", teorProj: "6,8", pctPol: "4", gmbProj: "2,210", espProj: "3,0",
            tMist: "160", dataIni: "2026-05-19", dataFim: "2026-05-19", jornadas: "1", massa: "118", nCarreg: "1", massaLig: "12", nSilos: "2", chuva: "nao", tAmb: "21", gcRef: "projeto",
            impUsina: [], impMar: [], impPista: [] },
          pens: pens, proj: proj, teores: [6.75, 6.92, 6.70, 6.85, 6.81], desvGran: dv, pref: "EXT-0519", data: "19/05/2026",
          mar: [["262", "5,6", "70", "3,6"], ["241", "6,1", "68", "4,0"], ["275", "5,2", "72", "3,5"], ["238", "6,4", "66", "4,7"], ["255", "5,8", "69", "3,8"]].map(function (x, i) {
            return { reg: "MAR-0519-" + (i + 1), data: "19/05/2026", teor: "6,8", est: x[0], vv: x[1], rbv: x[2], flu: x[3], ncp: "3" }; }),
          temp: [{ carga: "07h30", tagr: "175", tlig: "161", tsai: "159", tesp: "150" }, { carga: "11h50", tagr: "174", tlig: "162", tsai: "161", tesp: "152" }],
          estIni: "40+00", passoGC: 50, gc: [98.0, 97.6, 98.8, 97.4, 98.3], esp: [2.91, 2.82, 3.02, 2.78, 2.95], gmbRef: 2.210, nGeo: 13,
          sup: [{ est: "40+00 a 52+10", qi: "30" }],
          ins: [[1, 0], [1, 0], [1, 0], [1, 0], [1, 0], [1, 0], [1, 0], [4, 0], [1, 0], [1, 0], [1, 0]],
          obs: "Dados gerados para demonstração: excesso de finos na peneira nº 80 em todas as extrações; estabilidade com média 254 kgf e dispersão alta." });
      } },
    ],
  }));
})();
