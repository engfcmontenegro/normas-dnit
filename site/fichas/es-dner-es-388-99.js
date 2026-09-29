/*
 * Ficha de ES: DNER-ES 388/99 — Micro pré-misturado a quente com asfalto polímero — ACEITAÇÃO DE LOTE.
 * Motor comum: FE.aceitacaoG3.criar (es-dnit-112-2009-es.js); base das DNER-ES de asfalto polímero:
 * FE.aceitacaoG3.familiaDNER (es-dner-es-386-99.js). A 388 não exige QI (7.3.3 só tem as réguas).
 */
(function () {
  "use strict";
  var FE = window.FE, G3 = FE.aceitacaoG3, ok = FE.ok;

  G3.criar(G3.familiaDNER({
    id: "dner-es-388-99", codigo: "DNER-ES 388/99", sec: { lig: "5.4.2", agr: "5.4.3", comp: "5.4.6.4" },
    titulo: "Micro pré-misturado a quente com asfalto polímero — aceitação de lote",
    resumo: "Reúne os ensaios do lote (importados das fichas ME ou digitados), confere o mínimo de 5 determinações por jornada e aplica os critérios da DNER-ES 388/99: teor de ligante ± 0,3 %, granulometria na faixa de trabalho e estabilidade Marshall de 200 a 700 kgf (controle estatístico X̄ ± k·s, 7.4.2), Vv e fluência dos CPs, temperaturas ± 5 °C, grau de compactação ≥ 97 %, espessura ± 5 %, alinhamentos e réguas.",
    faixas: ["dner-es-388-99-A", "dner-es-388-99-B"], secFaixa: "5.2.1 (quadro)", retido4: "5.2.2",
    teorFaixa: function () { return [4, 7]; },
    dicaTeor: "quadro de 5.2.1: ligante polimerizado 4 a 7 % (impresso só na coluna A); tolerância ± 0,3 % (7.2.1.1)",
    padrao: { gcRef: "projeto" },
    qi: null,
    marshall: function () {
      return { secao: "7.2.1.4, 5.2.2 a", dica: "médias de cada conjunto de CPs Marshall (75 golpes), amostras da saída da acabadora; mínimo 5 por jornada (7.2.1.5)",
        itens: [
          { k: "est", nome: "Estabilidade (75 golpes)", unid: "kgf", casas: 0, min: 200, max: 700, modo: "estat", secao: "7.2.1.4, 7.4.2 b", obrig: true },
          { k: "vv", nome: "Porcentagem de vazios (dosagem)", unid: "%", casas: 1, min: 8, max: 14, modo: "ressalva", secao: "5.2.2 a" },
          { k: "flu", nome: "Fluência (dosagem)", unid: "mm", casas: 1, min: 2.0, max: 5.0, modo: "ressalva", secao: "5.2.2 a" },
        ],
        freq: function (L) { return { regra: "mín. 5 por jornada de 8 h (7.2.1.5)", exigido: ok(L.jor) ? 5 * L.jor : NaN }; } };
    },
    insumos: function (P, L) {
      return this.insumosLig(L).concat([
        ["gra", "Granulometria de cada silo quente (2 por silo por jornada)", ok(L.jor) ? 2 * L.silos * L.jor : NaN, "ressalva"],
        ["ea", "Equivalente de areia ≥ 55 % (por mês)", 1, "nao_conforme"],
        ["fil", "Granulometria do fíler (por mês)", 1, "ressalva"],
      ]);
    },
    notas: "Critérios da DNER-ES 388/99. Aceitação estatística de 7.4.2 b para teor de ligante, granulometria (peneira a peneira) e estabilidade Marshall (faixa 200–700 kgf) e GC (mínimo), com a tabela de amostragem variável de 7.2.1.5 (n = 5: 1,55 … 21: 1,01 — sem n = 11: usa-se o k de n = 10) e no mínimo 5 determinações por jornada; n < 5: valores individuais. " +
      "Vv e fluência (dosagem, 5.2.2 a): valores individuais, fora → ressalva. Temperaturas (7.4.2 a): ligante 150 °C + 3 °C/1 % de polímero (≤ 180 °C), agregados 10–15 °C acima e < 183 °C, compactação 140 °C + 3 °C/1 %, ± 5 °C — fora: ressalva. Espessura, alinhamentos e réguas (7.3): valores individuais.",
    exemplos: [
      { nome: "Lote aceito — faixa A, camada de 2,5 cm, 1 jornada (dados gerados)", dados: function () {
        var pens = [9.5, 4.8, 2.0, 0.42, 0.18, 0.075], proj = [100, 72, 50, 26, 16, 7];
        return G3.montar({ ident: { registro: "LOTE-MPM-001", data: "2026-03-18", obra: "Obra A", trecho: "BR-000 — km 5", local: "Est. 10+00 a 25+00", camada: "Regularização — micro pré-misturado com asfalto polímero, faixa A",
            origem: "Usina A", laboratorista: "Equipe de controle" },
          params: { estIni: "10+00", estFim: "25+00", largura: "7,00", pista: "pista única", faixa: "dner-es-388-99-A", teorProj: "5,5", pctPol: "3", gmbProj: "2,120", espProj: "2,5",
            tMist: "158", dataIni: "2026-03-18", dataFim: "2026-03-18", jornadas: "1", massa: "118", nCarreg: "1", massaLig: "7", nSilos: "2", chuva: "nao", tAmb: "27", gcRef: "projeto",
            impUsina: [], impMar: [], impPista: [] },
          pens: pens, proj: proj, teores: [5.46, 5.61, 5.38, 5.55, 5.50], pref: "EXT-0318", data: "18/03/2026", escala: 0.8,
          mar: [["452", "10,8", "3,4"], ["488", "11,5", "3,1"], ["431", "10,2", "3,6"], ["470", "11,0", "3,3"], ["495", "12,1", "3,0"]].map(function (x, i) {
            return { reg: "MAR-0318-" + (i + 1), data: "18/03/2026", teor: "5,5", est: x[0], vv: x[1], flu: x[2], ncp: "3" }; }),
          temp: [{ carga: "07h10", tagr: "171", tlig: "159", tsai: "157", tesp: "149" }, { carga: "12h30", tagr: "172", tlig: "160", tsai: "159", tesp: "147" }],
          estIni: "10+00", passoGC: 60, gc: [98.5, 97.8, 99.0, 98.2, 98.7], esp: [2.52, 2.47, 2.55, 2.49, 2.53], gmbRef: 2.120, nGeo: 16,
          ins: [[1, 0], [1, 0], [1, 0], [1, 0], [1, 0], [1, 0], [1, 0], [4, 0], [1, 0], [1, 0]],
          obs: "Dados gerados para demonstração. Ligante com 3 % de polímero: 159 °C; compactação 149 °C." });
      } },
      { nome: "Lote rejeitado — faixa B, 1 jornada: estabilidade acima de 700 kgf na estatística e GC abaixo de 97 % (dados gerados)", dados: function () {
        var pens = [9.5, 4.8, 2.0, 0.42, 0.18, 0.075], proj = [100, 80, 60, 30, 18, 8];
        return G3.montar({ ident: { registro: "LOTE-MPM-004", data: "2026-04-09", obra: "Obra B", trecho: "BR-000 — km 18", local: "Est. 60+00 a 75+00", camada: "Camada inibidora de reflexão de trincas — micro pré-misturado, faixa B",
            origem: "Usina A", laboratorista: "Equipe de controle" },
          params: { estIni: "60+00", estFim: "75+00", largura: "7,00", pista: "pista única", faixa: "dner-es-388-99-B", teorProj: "5,8", pctPol: "3", gmbProj: "2,135", espProj: "2,5",
            tMist: "158", dataIni: "2026-04-09", dataFim: "2026-04-09", jornadas: "1", massa: "120", nCarreg: "1", massaLig: "7", nSilos: "2", chuva: "nao", tAmb: "23", gcRef: "projeto",
            impUsina: [], impMar: [], impPista: [] },
          pens: pens, proj: proj, teores: [5.72, 5.85, 5.90, 5.66, 5.81], pref: "EXT-0409", data: "09/04/2026", escala: 0.8,
          mar: [["655", "9,1", "2,6"], ["712", "8,6", "2,4"], ["688", "8,9", "2,5"], ["731", "7,8", "2,2"], ["676", "9,4", "2,7"]].map(function (x, i) {
            return { reg: "MAR-0409-" + (i + 1), data: "09/04/2026", teor: "5,8", est: x[0], vv: x[1], flu: x[2], ncp: "3" }; }),
          temp: [{ carga: "07h00", tagr: "170", tlig: "160", tsai: "158", tesp: "150" }, { carga: "12h00", tagr: "173", tlig: "158", tsai: "157", tesp: "148" }],
          estIni: "60+00", passoGC: 60, gc: [96.8, 97.4, 96.1, 97.2, 96.5], esp: [2.48, 2.55, 2.51, 2.46, 2.52], gmbRef: 2.135, nGeo: 16,
          ins: [[1, 0], [1, 0], [1, 0], [1, 0], [1, 0], [1, 0], [1, 0], [4, 0], [1, 0], [1, 0]],
          obs: "Dados gerados para demonstração: mistura rígida (estabilidade alta, Vv abaixo de 8 % num conjunto) e compactação insuficiente." });
      } },
    ],
  }));
})();
