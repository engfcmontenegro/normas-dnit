/*
 * Ficha de ES: DNIT 034/2005-ES — Concreto asfáltico reciclado a quente no local — ACEITAÇÃO DE LOTE.
 * Motor comum: FE.aceitacaoG3.criar (es-dnit-112-2009-es.js); base das ES do DNIT de 2005: FE.aceitacaoG3.familiaDNIT
 * (es-dnit-032-2005-es.js).
 */
(function () {
  "use strict";
  var FE = window.FE, A = FE.aceitacao, G3 = FE.aceitacaoG3, ok = FE.ok;

  // quadro de 5.2 e (p. 5): VAM mínimo por tamanho nominal máximo (não depende do Vv)
  var VAM034 = { "38.1": 13, "25.4": 14, "19.1": 15, "12.7": 16, "9.5": 18 };
  var NOMES = { "38.1": "1 ½\" — 38,1 mm (VAM ≥ 13 %)", "25.4": "1\" — 25,4 mm (VAM ≥ 14 %)", "19.1": "¾\" — 19,1 mm (VAM ≥ 15 %)", "12.7": "½\" — 12,7 mm (VAM ≥ 16 %)", "9.5": "⅜\" — 9,5 mm (VAM ≥ 18 %)" };
  var LIM = { rolamento: { vv: [3, 5], rbv: [75, 82], nome: "rolamento" }, ligacao: { vv: [4, 6], rbv: [65, 72], nome: "ligação (binder)" } };
  function lim(P) { return LIM[P.camada === "rolamento" ? "rolamento" : "ligacao"]; }
  var REV = function (P) { return P.camada === "rolamento"; };

  G3.criar(G3.familiaDNIT({
    id: "dnit-034-2005-es", codigo: "DNIT 034/2005-ES",
    titulo: "Concreto asfáltico reciclado a quente no local — aceitação de lote",
    resumo: "Reúne os ensaios do lote (importados das fichas ME ou digitados), confere a frequência e aplica os critérios da DNIT 034/2005-ES: teor de ligante ± 0,3 %, granulometria na faixa de trabalho, Vv, RBV ou VAM, estabilidade ≥ 500 kgf e RT ≥ 0,65 MPa, temperaturas ± 5 °C, grau de compactação 97–101 % a cada 700 m², espessura ± 5 %, alinhamentos, réguas, QI < 35 e condições de segurança — controle estatístico X̄ ± k·s (7.4, 7.5).",
    revestimento: REV,
    camadas: [["rolamento", "Revestimento — camada de rolamento"], ["ligacao", "Camada de ligação (binder)"], ["base", "Base, regularização ou reforço (limites do binder)"]],
    dicaCamada: "quadro de 5.2 c: rolamento Vv 3–5 %, RBV 75–82 %; ligação Vv 4–6 %, RBV 65–72 %; base/regularização/reforço (4): a ES não dá coluna — usados os limites do binder",
    faixas: ["dnit-034-2005-es-A", "dnit-034-2005-es-B", "dnit-034-2005-es-C"], secFaixa: "5.2 (quadro)", retido4: "5.2", dmax: "5.2",
    teorFaixa: function (P, fx) { return fx ? { A: [4.0, 7.0], B: [4.5, 7.5], C: [4.5, 9.0] }[fx.faixa] : null; },
    dicaTeor: "quadro de 5.2: A 4,0–7,0; B 4,5–7,5; C 4,5–9,0 % (asfalto solúvel no CS2, % da mistura de agregados); tolerância ± 0,3 % (7.2.1 a)",
    dicaUsina: "extrações de amostras da mistura coletada na usina móvel (7.2.1 a); a ES não fixa a frequência (plano de amostragem, 7.4) — adotado no mínimo 1 por jornada",
    vam: { secao: "5.2 e", tab: VAM034, nomes: NOMES, dica: "5.2 e: a mistura atende se a RBV estiver na faixa OU o VAM for ≥ o mínimo do tamanho nominal máximo" },
    padrao: { camada: "rolamento" },
    marshall: function (P) {
      var c = lim(P);
      return { secao: "7.2.1 d, 5.2 c (" + c.nome + ")", dica: "médias de cada conjunto de 3 CPs Marshall (75 golpes), amostras retiradas na saída do misturador; 1 conjunto por jornada de 8 h",
        vam: function (P) { return VAM034[P.tnm] || NaN; },
        itens: [
          { k: "vv", nome: "Porcentagem de vazios", unid: "%", casas: 1, min: c.vv[0], max: c.vv[1], modo: "estat", secao: "5.2 c" },
          { k: "rbv", nome: "Relação betume/vazios", unid: "%", casas: 1, min: c.rbv[0], max: c.rbv[1], modo: "estat", secao: "5.2 c, e" },
          { k: "est", nome: "Estabilidade (75 golpes)", unid: "kgf", casas: 0, min: 500, modo: "estat", secao: "7.2.1 d, 5.2 c", obrig: true },
        ],
        freq: function (L) { return { regra: "3 CPs por jornada de 8 h", exigido: ok(L.jor) ? L.jor : NaN }; } };
    },
    rt: { secao: "7.2.1 d, 5.2 c", min: function () { return 0.65; }, dica: "CPs Marshall da mistura da usina móvel; 1 por jornada de 8 h",
      freq: function (L) { return { regra: "1 por jornada de 8 h", exigido: ok(L.jor) ? L.jor : NaN }; } },
    temps: function (P) {
      return [
        { k: "tlig", nome: "Ligante na usina móvel", secao: "5.4.2, 7.2.1 c", lim: function () { return G3.faixaPM5(P, "tLig", 107, 177); }, exigido: G3.txtPM5(P, "tLig", "entre 107 e 177 °C") },
        { k: "tsai", nome: "Mistura na saída da usina móvel", secao: "7.2.1 c", lim: function () { return G3.faixaPM5(P, "tMist", NaN, NaN); }, exigido: G3.txtPM5(P, "tMist") },
        { k: "tesp", nome: "Mistura no espalhamento (início da compressão)", secao: "7.2.2", lim: function () { return G3.faixaPM5(P, "tComp", NaN, NaN); }, exigido: G3.txtPM5(P, "tComp") },
      ];
    },
    insumos: function (P, L) {
      return [
        ["pen", "Ligante — penetração a 25 °C (por carregamento)", G3.porCarreg(L), "nao_conforme"],
        ["ful", "Ligante — ponto de fulgor (por carregamento)", G3.porCarreg(L), "nao_conforme"],
        ["esp", "Ligante — ensaio de espuma (por carregamento)", G3.porCarreg(L), "nao_conforme"],
        ["sf", "Ligante — viscosidade Saybolt-Furol (por carregamento)", G3.porCarreg(L), "nao_conforme"],
        ["ist", "Ligante — índice de suscetibilidade térmica (a cada 100 t)", G3.porMassa(L, 100), "nao_conforme"],
        ["vis", "Ligante — curva viscosidade × temperatura (a cada 100 t)", G3.porMassa(L, 100), "nao_conforme"],
        ["gra", "Granulometria do agregado adicional (2 por jornada)", G3.porJornada(L, 2), "ressalva"],
        ["ea", "Equivalente de areia do miúdo adicional ≥ 55 % (por jornada)", G3.porJornada(L), "ressalva"],
        ["fil", "Granulometria do fíler (por jornada)", G3.porJornada(L), "ressalva"],
      ];
    },
    notas: "Critérios da DNIT 034/2005-ES. Controle estatístico de 7.5 com a tabela de amostragem variável de 7.4 (n = 5: 1,55 … n = 21: 1,01): X̄ − k·s ≥ mínimo e/ou X̄ + k·s ≤ máximo (s com n − 1; a ES imprime \"=\" na condição de conformidade — lido como ≥ / ≤); n < 5: cada valor individual deve atender; estatística atendida com valor individual fora: ressalva (corrigir o local). " +
      "Faixa de trabalho = curva de projeto ± tolerâncias do quadro de 5.2, sem ultrapassar a faixa. RBV fora da faixa é aceita se o VAM atender ao mínimo de 5.2 e. GC = Gmb da pista / Gmb de projeto × 100 (a ES diz \"massa específica aparente máxima do projeto\" — adotada a densidade aparente de projeto, como no parágrafo anterior de 7.2.2). VDR ≥ 45 e 0,60 ≤ HS ≤ 1,20 mm (impressos com \"=\"). QI = 13 × IRI quando só o IRI é informado. Frequência de extrações: a ES não a fixa — adotada 1 por jornada.",
    exemplos: [
      { nome: "Lote aceito — binder faixa B, 60 m (CPs Marshall, RT e densímetro importados dos exemplos das fichas ME)", dados: function () {
        var pens = [38.1, 25.4, 19.1, 9.5, 4.8, 2.0, 0.42, 0.18, 0.075], proj = [100, 97, 88, 62, 44, 32, 20, 13, 5.5];
        return G3.montar({ ident: { registro: "LOTE-RQL-002", data: "2026-07-14", obra: "Obra A", trecho: "BR-000 — km 12", local: "Est. 20+00 a 23+00",
            camada: "Camada de ligação — CA reciclado a quente no local, faixa B", origem: "Usina móvel A", laboratorista: "Equipe de controle" },
          params: { estIni: "20+00", estFim: "23+00", largura: "3,60", pista: "pista direita", camada: "ligacao", faixa: "dnit-034-2005-es-B", teorProj: "4,7", tnm: "25.4",
            gmbProj: "2,380", espProj: "6,0", tLig: "150", tMist: "150", tComp: "145", dataIni: "2026-07-14", dataFim: "2026-07-14", jornadas: "1", massa: "31",
            nCarreg: "1", massaLig: "12", chuva: "nao", tAmb: "25" },
          pens: pens, proj: proj, teores: [4.62], pref: "EXT-0714", data: "14/07/2026",
          temp: [{ carga: "08h00", tlig: "151", tsai: "149", tesp: "146" }, { carga: "13h30", tlig: "148", tsai: "152", tesp: "143" }],
          estIni: "20+00", gc: [], gmbRef: 2.380, nGeo: 4,
          ins: [[1, 0], [1, 0], [1, 0], [1, 0], [1, 0], [1, 0], [2, 0], [1, 0], [1, 0]],
          obs: "Lote de demonstração: CPs Marshall (controle, 3 CPs, binder), RT (DNIT 136) e grau de compactação pelo densímetro (DNIT 431) importados dos exemplos das fichas ME; extração, espessuras, temperaturas e geometria digitadas." });
      }, depois: function (d, params) {
        A.exemplos.importar(params, d, "impMar", [["dnit-385-2026-es", 1]]);
        A.exemplos.importar(params, d, "impRt", [["dnit-136-2018-me", 0]]);
        A.exemplos.importar(params, d, "impPista", [["dnit-431-2020-me", 0]]);
        ["6,04", "5,95", "6,10", "6,01", "5,93", "6,07"].forEach(function (e, i) { if (d.pista[i]) d.pista[i].esp = e; });
        d.params.impUsina = [];
      } },
      { nome: "Lote rejeitado — rolamento faixa C, 300 m: RBV e VAM abaixo, RT baixa, GC acima de 101 % (dados gerados)", dados: function () {
        var pens = [19.1, 12.7, 9.5, 4.8, 2.0, 0.42, 0.18, 0.075], proj = [100, 90, 80, 56, 35, 17, 10, 6];
        var gc = [100.4, 101.2, 100.8, 101.5, 100.9, 101.3], esp = [4.96, 5.08, 4.91, 5.03, 5.12, 4.98];
        return G3.montar({ ident: { registro: "LOTE-RQL-009", data: "2026-08-05", obra: "Obra B", trecho: "BR-000 — km 40", local: "Est. 200+00 a 215+00",
            camada: "Revestimento — CA reciclado a quente no local, faixa C", origem: "Usina móvel A", laboratorista: "Equipe de controle" },
          params: { estIni: "200+00", estFim: "215+00", largura: "3,60", pista: "pista esquerda", camada: "rolamento", faixa: "dnit-034-2005-es-C", teorProj: "5,4", tnm: "12.7",
            gmbProj: "2,366", espProj: "5,0", tLig: "150", tMist: "150", tComp: "145", dataIni: "2026-08-04", dataFim: "2026-08-05", jornadas: "2", massa: "130",
            nCarreg: "1", massaLig: "8", chuva: "nao", tAmb: "22", impUsina: [], impMar: [], impRt: [], impPista: [] },
          pens: pens, proj: proj, teores: [5.31, 5.52], porJ: 1, pref: "EXT-0804", data: "04/08/2026",
          mar: [{ reg: "MAR-0804", data: "04/08/2026", teor: "5,35", gmb: "2,372", vv: "4,8", rbv: "71,5", vam: "15,1", est: "820", ncp: "3" },
            { reg: "MAR-0805", data: "05/08/2026", teor: "5,50", gmb: "2,368", vv: "4,5", rbv: "73,0", vam: "15,4", est: "790", ncp: "3" }],
          rt: [0.62, 0.66],
          temp: [{ carga: "04/08 08h10", tlig: "152", tsai: "151", tesp: "147" }, { carga: "05/08 08h05", tlig: "149", tsai: "148", tesp: "144" }],
          estIni: "200+00", passoGC: 50, gc: gc, esp: esp, gmbRef: 2.366, nGeo: 16,
          sup: [{ est: "200+00 a 215+00", qi: "30", hs: "0,71", vdr: "55" }],
          ins: [[1, 0], [1, 0], [1, 0], [1, 0], [1, 0], [1, 0], [4, 0], [2, 0], [2, 0]],
          obs: "Dados gerados para demonstração: mistura reciclada com RBV e VAM abaixo dos limites do rolamento; compactação excessiva." });
      } },
    ],
  }));
})();
