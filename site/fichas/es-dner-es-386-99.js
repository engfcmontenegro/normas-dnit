/*
 * Ficha de ES: DNER-ES 386/99 — Pré-misturado a quente com asfalto polímero — camada porosa de atrito — ACEITAÇÃO DE LOTE.
 * Motor comum: FE.aceitacaoG3.criar (es-dnit-112-2009-es.js). Este arquivo também define FE.aceitacaoG3.familiaDNER(o),
 * base comum das DNER-ES 386, 387 e 388/99 (mesma estrutura de inspeção): 7.1 materiais; 7.2.1 usinagem (teor ± 0,3 %,
 * granulometria, temperaturas ± 5 °C, características da mistura); 7.2.1.5 tabela de amostragem variável (sem n = 11) e
 * mínimo de 5 determinações por jornada de 8 h; 7.2.2 GC ≥ 97 % (ou ≥ 100 % dos CPs moldados no local); 7.3 espessura
 * ± 5 %, alinhamentos ± 5 cm, réguas 0,5 cm, QI < 35; 7.4.2 aceitação estatística; 9.2 campo a cada 700 m².
 */
(function () {
  "use strict";
  var FE = window.FE, A = FE.aceitacao, G3 = FE.aceitacaoG3, num = FE.num, ok = FE.ok, fmt = FE.fmt;

  // temperaturas das DNER-ES de asfalto polímero: ligante 150 °C + 3 °C por 1 % de polímero (máx. 180 °C);
  // agregados 10–15 °C acima do ligante e < 183 °C; compactação 140 °C + 3 °C por 1 % de polímero
  function alvoLig(P) { var t = num(P.tLig), p = num(P.pctPol); return ok(t) ? t : ok(p) ? Math.min(150 + 3 * p, 180) : NaN; }
  function alvoComp(P) { var t = num(P.tComp), p = num(P.pctPol); return ok(t) ? t : ok(p) ? 140 + 3 * p : NaN; }

  function familiaDNER(o) {
    var s = o.sec;  // seções de execução: {lig, agr, comp}
    var cfg = {
      estat: "dner", secK: "7.2.1.5",
      refs: { reprova: "7.4.2 b", atende: "7.4.2 b", corrige: "7.4.3", regra: "7.4.2" },
      secTeor: "7.2.1.1, 7.4.2 b", secGran: "7.2.1.2, 7.4.2 b", secTemp: s.lig + ", " + s.agr + ", " + s.comp + ", 7.2.1.3, 7.2.2.1", secGC: "7.2.2.2", secEsp: "7.3.1",
      secGeo: "7.3.2, 7.3.3", secAlin: "7.3.2", secRegua: "7.3.3", secChuva: "4.2", secIns: "7.1", secInsAceite: "7.4.1",
      modoGeo: "indiv", modoEsp: "indiv", polimero: true, gcMoldados: true, silos: true,
      phTLig: "150 + 3 × % polímero", dicaTLig: s.lig + ": 150 °C + 3 °C por 1 % de polímero, máx. 180 °C (vazio = calculada pelo teor de polímero); ± 5 °C (7.2.1.3)",
      phTComp: "140 + 3 × % polímero", dicaTComp: s.comp + ": 140 °C + 3 °C por 1 % de polímero (vazio = calculada); ± 5 °C (7.2.2.1)",
      tCompPadrao: alvoComp,
      dicaJornada: "7.2.1.5: no mínimo 5 determinações de cada controle da usinagem por jornada de 8 h",
      dicaMassaLig: "teor de polímero por infravermelho a cada 500 t (7.1.1 b)",
      dicaUsina: "extrações de amostras coletadas na saída da acabadora (7.2.1.1); mínimo 5 por jornada de 8 h (7.2.1.5)",
      freqTeor: function (L) { return { regra: "mín. 5 por jornada de 8 h (7.2.1.5)", exigido: ok(L.jor) ? 5 * L.jor : NaN }; },
      gc: function (P) {
        var mold = P.gcRef === "moldados";
        return { min: mold ? 100 : 97, secao: "7.2.2.2, 7.4.2 b", exigido: mold ? "≥ 100 % dos CPs moldados no local" : "≥ 97 % da densidade de projeto",
          freq: function (L) { return { regra: "tabela de 7.2.1.5 (mín. 5); a cada 700 m² de pista (9.2)", exigido: ok(L.area) ? Math.max(5, Math.ceil(L.area / 700 - 1e-9)) : 5 }; } };
      },
      qi: { aplica: function () { return true; }, secao: "7.3.3", estrito: true, exigido: "QI < 35 contagens/km", modo: "indiv" },
      temps: function (P) {
        return [
          { k: "tagr", nome: "Agregados no silo quente", secao: s.agr + ", 7.2.1.3", lim: function (p) {
            var tl = ok(num(p.tlig)) ? num(p.tlig) : alvoLig(P), ta = num(P.tAgr);
            var a = ok(ta) ? ta - 5 : ok(tl) ? tl + 10 : NaN, b = ok(ta) ? ta + 5 : ok(tl) ? tl + 15 : NaN;
            return [a, ok(b) ? Math.min(b, 182) : 182];
          }, exigido: "10 a 15 °C acima do ligante e < 183 °C" },
          { k: "tlig", nome: "Ligante (asfalto polímero)" + (o.ligTanque ? " no tanque de estocagem" : " na usina"), secao: s.lig + ", 7.2.1.3", lim: function () {
            var t = alvoLig(P); return [ok(t) ? t - 5 : NaN, ok(t) ? Math.min(t + 5, 180) : 180];
          }, exigido: (ok(alvoLig(P)) ? fmt(alvoLig(P), 0) + " ± 5 °C" : "150 °C + 3 °C/1 % de polímero ± 5 °C") + "; máx. 180 °C" },
          { k: "tsai", nome: "Mistura na saída do misturador", secao: "7.2.1.3", lim: function () { return G3.faixaPM5(P, "tMist", NaN, NaN); }, exigido: G3.txtPM5(P, "tMist") },
          { k: "tesp", nome: "Mistura antes da compactação", secao: s.comp + ", 7.2.2.1", lim: function () {
            var t = alvoComp(P); return [ok(t) ? t - 5 : NaN, ok(t) ? t + 5 : NaN];
          }, exigido: ok(alvoComp(P)) ? fmt(alvoComp(P), 0) + " ± 5 °C" : "140 °C + 3 °C/1 % de polímero ± 5 °C" },
        ];
      },
      insumosLig: function (L) {
        return [
          ["pen", "Asfalto polímero — penetração a 25 °C (por carregamento)", G3.porCarreg(L), "nao_conforme"],
          ["ful", "Asfalto polímero — ponto de fulgor (por carregamento)", G3.porCarreg(L), "nao_conforme"],
          ["amo", "Asfalto polímero — ponto de amolecimento (por carregamento)", G3.porCarreg(L), "nao_conforme"],
          ["rec", "Asfalto polímero — recuperação elástica a 25 °C (por carregamento)", G3.porCarreg(L), "nao_conforme"],
          ["esp", "Asfalto polímero — espuma (por carregamento)", G3.porCarreg(L), "nao_conforme"],
          ["arm", "Asfalto polímero — estabilidade ao armazenamento (por carregamento)", G3.porCarreg(L), "nao_conforme"],
          ["iv", "Teor de polímero por infravermelho, ± 0,4 % do projeto (a cada 500 t)", G3.porMassa(L, 500), "nao_conforme"],
        ];
      },
      provRejeito: ["Os serviços rejeitados devem ser corrigidos, complementados ou refeitos (7.4.3); podem ser corrigidos segundo as Instruções para Controle Tecnológico de Serviços de Pavimentação (resolução 1715/87 do Conselho Administrativo do DNER), com as adaptações cabíveis (9.1)."],
      provMedicao: "Os resultados do controle estatístico devem ser registrados em relatórios periódicos de acompanhamento e associados à medição dos serviços (7.4.4).",
    };
    Object.keys(o).forEach(function (k) { if (k !== "sec") cfg[k] = o[k]; });
    return cfg;
  }
  G3.familiaDNER = familiaDNER;
  G3.alvoLigPol = alvoLig; G3.alvoCompPol = alvoComp;

  // =====================================================================================
  var TEOR = [4.0, 6.0];
  G3.criar(familiaDNER({
    id: "dner-es-386-99", codigo: "DNER-ES 386/99", sec: { lig: "5.4.2", agr: "5.4.3", comp: "5.4.6.4" },
    titulo: "Camada porosa de atrito com asfalto polímero — aceitação de lote",
    resumo: "Reúne os ensaios do lote (importados das fichas ME ou digitados), confere o mínimo de 5 determinações por jornada e aplica os critérios da DNER-ES 386/99: teor de ligante ± 0,3 %, granulometria na faixa de trabalho, desgaste Cantabro ≤ 25 % e RT ≥ 0,55 MPa (controle estatístico X̄ ± k·s, 7.4.2), temperaturas ± 5 °C, grau de compactação ≥ 97 %, espessura ± 5 %, alinhamentos, réguas e QI < 35.",
    faixas: ["dner-es-386-99-I", "dner-es-386-99-II", "dner-es-386-99-III", "dner-es-386-99-IV", "dner-es-386-99-V"], secFaixa: "5.2.1 (quadro)", retido4: "5.2.2",
    teorFaixa: function () { return TEOR; },
    espFaixa: function (fx, esp) {
      if (!ok(esp)) return "";
      if ((fx.faixa === "I" || fx.faixa === "II") && Math.abs(esp - 3) > 0.05) return "Faixas I e II são recomendadas para camadas de 3,0 cm (5.2.1); espessura de projeto " + fmt(esp, 1) + " cm.";
      if (/^(III|IV|V)$/.test(fx.faixa) && esp > 4 + 1e-9) return "Faixas III, IV e V são recomendadas para espessuras de até 4,0 cm (5.2.1); espessura de projeto " + fmt(esp, 1) + " cm.";
      return "";
    },
    dicaTeor: "quadro de 5.2.1: ligante polimerizado solúvel no tricloroetileno 4,0 a 6,0 %; tolerância ± 0,3 % (7.2.1.1)",
    padrao: { gcRef: "projeto" },
    rt: { secao: "7.2.1.4, 5.2.2 a, 7.4.2 b", min: function () { return 0.55; }, exigido: function () { return "≥ 0,55 MPa (5,5 kgf/cm²)"; },
      dica: "CPs Marshall com amostras da saída da acabadora; mínimo 5 por jornada de 8 h (7.2.1.5)",
      freq: function (L) { return { regra: "mín. 5 por jornada de 8 h (7.2.1.5)", exigido: ok(L.jor) ? 5 * L.jor : NaN }; } },
    cantabro: { secao: "7.2.1.4, 5.2.2 a, 7.4.2 b", max: 25, dica: "CPs Marshall no tambor Los Angeles (DNER-ME 383); mínimo 5 por jornada de 8 h (7.2.1.5)",
      freq: function (L) { return { regra: "mín. 5 por jornada de 8 h (7.2.1.5)", exigido: ok(L.jor) ? 5 * L.jor : NaN }; } },
    insumos: function (P, L) {
      return this.insumosLig(L).concat([
        ["gra", "Granulometria de cada silo quente (2 por silo por jornada)", ok(L.jor) ? 2 * L.silos * L.jor : NaN, "ressalva"],
        ["la", "Desgaste Los Angeles ≤ 30 % (por mês)", 1, "nao_conforme"],
        ["if", "Índice de forma > 0,5 (por mês)", 1, "nao_conforme"],
        ["ea", "Equivalente de areia ≥ 55 % (por mês)", 1, "nao_conforme"],
        ["fil", "Granulometria do fíler (por mês)", 1, "ressalva"],
        ["ade", "Adesividade (por jornada)", G3.porJornada(L), "ressalva"],
      ]);
    },
    notas: "Critérios da DNER-ES 386/99. Aceitação estatística de 7.4.2 b para teor de ligante, granulometria (peneira a peneira), Cantabro (máximo), resistência à tração (mínimo) e GC (mínimo), com a tabela de amostragem variável de 7.2.1.5 (n = 5: 1,55; 6: 1,41; 7: 1,36; 8: 1,31; 9: 1,25; 10: 1,21; 12: 1,16; … 21: 1,01 — sem n = 11: usa-se o k de n = 10) e no mínimo 5 determinações por jornada; n < 5: valores individuais. " +
      "Cantabro: X̄ + k·s ≤ 25 % (a ES imprime \"X̄ − ks\" para o máximo). Faixa de trabalho = projeto ± tolerâncias, sem ultrapassar a faixa (5.2.1). Temperaturas (7.4.2 a): ligante 150 °C + 3 °C/1 % de polímero (≤ 180 °C), agregados 10–15 °C acima e < 183 °C, compactação 140 °C + 3 °C/1 %, ± 5 °C — fora: ressalva. Espessura, alinhamentos, réguas e QI (7.3): valores individuais. GC = Gmb da pista / referência × 100 (densímetro: Gmb = densidade / 0,9971).",
    exemplos: [
      { nome: "Lote aceito — faixa III, 300 m, 1 jornada (um Cantabro importado do exemplo da DNER-ME 383)", dados: function () {
        var pens = [12.5, 9.5, 4.8, 2.0, 0.42, 0.075], proj = [100, 85, 45, 14, 9, 4.5];
        var gc = [98.4, 99.1, 97.9, 98.8, 99.3], esp = [3.02, 2.96, 3.08, 3.04, 2.95];
        return G3.montar({ ident: { registro: "LOTE-CPA-001", data: "2026-05-12", obra: "Obra A", trecho: "BR-000 — km 30", local: "Est. 30+00 a 45+00",
            camada: "Camada porosa de atrito — asfalto polímero SBS, faixa III", origem: "Usina A", laboratorista: "Equipe de controle" },
          params: { estIni: "30+00", estFim: "45+00", largura: "7,00", pista: "pista direita", faixa: "dner-es-386-99-III", teorProj: "4,5", pctPol: "4", gmbProj: "1,985", espProj: "3,0",
            tMist: "160", dataIni: "2026-05-12", dataFim: "2026-05-12", jornadas: "1", massa: "125", nCarreg: "1", massaLig: "20", nSilos: "3", chuva: "nao", tAmb: "25", gcRef: "projeto" },
          pens: pens, proj: proj, teores: [4.42, 4.61, 4.55, 4.38, 4.49], pref: "EXT-0512", data: "12/05/2026", escala: 0.6,
          rt: [0.68, 0.72, 0.66, 0.70, 0.74], cant: [18, 20, 16, 19],
          temp: [{ carga: "07h30", tagr: "174", tlig: "163", tsai: "161", tesp: "153" }, { carga: "10h00", tagr: "176", tlig: "161", tsai: "158", tesp: "150" },
            { carga: "13h30", tagr: "175", tlig: "164", tsai: "162", tesp: "155" }],
          estIni: "30+00", passoGC: 60, gc: gc, esp: esp, gmbRef: 1.985, nGeo: 16,
          sup: [{ est: "30+00 a 45+00", qi: "24" }],
          ins: [[1, 0], [1, 0], [1, 0], [1, 0], [1, 0], [1, 0], [1, 0], [6, 0], [1, 0], [1, 0], [1, 0], [1, 0], [1, 0]],
          obs: "Lote de demonstração: um ensaio Cantabro importado do exemplo da DNER-ME 383 (17 %); demais valores gerados. Ligante com 4 % de polímero: 162 °C; compactação 152 °C." });
      }, depois: function (d, params) { A.exemplos.importar(params, d, "impCant", [["dner-me-383-99", 0]]); d.params.impUsina = []; d.params.impRt = []; d.params.impPista = []; } },
      { nome: "Lote rejeitado — faixa IV, 1 jornada: Cantabro e GC na estatística, teor abaixo do projeto (um Cantabro importado do exemplo da DNER-ME 383)", dados: function () {
        var pens = [12.5, 9.5, 4.8, 2.0, 0.42, 0.075], proj = [100, 80, 22, 15, 9, 4.5];
        var gc = [97.2, 96.4, 97.8, 96.9, 97.5], esp = [3.95, 4.02, 3.88, 3.97, 4.05];
        return G3.montar({ ident: { registro: "LOTE-CPA-006", data: "2026-06-03", obra: "Obra B", trecho: "BR-000 — km 72", local: "Est. 80+00 a 95+00",
            camada: "Camada porosa de atrito — asfalto polímero SBS, faixa IV", origem: "Usina B", laboratorista: "Equipe de controle" },
          params: { estIni: "80+00", estFim: "95+00", largura: "7,00", pista: "pista esquerda", faixa: "dner-es-386-99-IV", teorProj: "4,3", pctPol: "3,5", gmbProj: "1,960", espProj: "4,0",
            tMist: "158", dataIni: "2026-06-03", dataFim: "2026-06-03", jornadas: "1", massa: "150", nCarreg: "1", massaLig: "10", nSilos: "3", chuva: "nao", tAmb: "19", gcRef: "projeto", impUsina: [], impRt: [], impPista: [] },
          pens: pens, proj: proj, teores: [4.02, 4.15, 3.96, 4.21, 4.08], pref: "EXT-0603", data: "03/06/2026", escala: 0.6,
          rt: [0.58, 0.61, 0.57, 0.63, 0.60], cant: [24, 22, 26, 23],
          temp: [{ carga: "07h40", tagr: "170", tlig: "161", tsai: "157", tesp: "149" }, { carga: "11h20", tagr: "172", tlig: "160", tsai: "159", tesp: "146" }],
          estIni: "80+00", passoGC: 60, gc: gc, esp: esp, gmbRef: 1.960, nGeo: 16,
          sup: [{ est: "80+00 a 95+00", qi: "26" }],
          ins: [[1, 0], [1, 0], [1, 0], [1, 0], [1, 0], [1, 0], [1, 0], [6, 0], [1, 0], [1, 0], [1, 0], [1, 0], [1, 0]],
          obs: "Dados gerados para demonstração, com um ensaio Cantabro importado do exemplo reprovado da DNER-ME 383 (27 %). Ligante com 3,5 % de polímero: 160,5 °C; compactação 150,5 °C." });
      }, depois: function (d, params) { A.exemplos.importar(params, d, "impCant", [["dner-me-383-99", 1]]); d.params.impUsina = []; d.params.impRt = []; d.params.impPista = []; } },
    ],
  }));
})();
