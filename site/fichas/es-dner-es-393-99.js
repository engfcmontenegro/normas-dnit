/*
 * Ficha de ACEITAÇÃO DE LOTE: DNER-ES 393/99 — Tratamento superficial triplo com asfalto polímero.
 * Montagem comum G4.ts / G4.tsBase (site/fichas/es-dner-es-391-99.js, carregado antes): mesmas seções de controle e
 * aceitação da DNER-ES 391/99 (7.1 a 7.4), com três camadas:
 *   5.1.3 e faixas A (1ª camada), B (2ª) e C (3ª) — a abertura da 1 ½" está impressa "28,1" (é 38,1 mm);
 *   5.1.4.4 taxas recomendadas: 1ª 1,00–1,50 l/m² e 20–25 kg/m², 2ª 0,60–0,90 l/m² e 10–12 kg/m², 3ª 0,40–0,60 l/m² e
 *   5–7 kg/m²; 7.2.2 tolerâncias ± 0,2 l/m² e ± 1,5 kg/m² por camada; 7.2.3 k com n = 11.
 */
(function () {
  "use strict";
  var FE = window.FE, A = FE.aceitacao, G4 = FE.aceitacaoG4b;
  if (!G4 || !G4.ts) { if (window.console) console.error("es-dner-es-393-99.js: carregue antes es-dnit-150-2010-es.js e es-dner-es-391-99.js."); return; }
  var ID = "dner-es-393-99";
  var F = G4.ts(Object.assign(G4.tsBase("393"), {
    id: ID, titulo: "Tratamento superficial triplo com asfalto polímero — aceitação de lote",
    resumo: "Três camadas: taxas de ligante residual e de agregado por bandeja e granulometria do agregado de cada camada, temperatura, acabamento e alinhamentos, recebimento do ligante e controle do agregado; aceitação estatística da 7.4.2 com a tabela de 7.2.3.",
    camadas: [
      { nome: "1ª camada", faixaPadrao: "dner-es-393-99-A", rec: { lig: [1.0, 1.5], agr: [20, 25] } },
      { nome: "2ª camada", faixaPadrao: "dner-es-393-99-B", rec: { lig: [0.6, 0.9], agr: [10, 12] } },
      { nome: "3ª camada", faixaPadrao: "dner-es-393-99-C", rec: { lig: [0.4, 0.6], agr: [5, 7] } },
    ],
    padrao: { projL1: "1,20", projA1: "22", projL2: "0,75", projA2: "11", projL3: "0,50", projA3: "6" },
    notas: "Critérios da DNER-ES 393/99 (7.4.2), por camada: taxa de ligante residual (projeto ± 0,2 l/m², 7.2.2.1), taxa de agregado (projeto ± 1,5 kg/m², 7.2.2.2) e granulometria do agregado (curva de projeto ± 7/5/2 %, faixas A/B/C de 5.1.3 e) pelo controle estatístico X̄ − ks ≥ mín. e X̄ + ks ≤ máx.; mínimo de 5 determinações por segmento de área < 3.000 m² (7.2.3; por camada, adotado); temperatura do CAP ≤ 180 °C (5.3.2); réguas ≤ 0,5 cm (7.3.1) e alinhamentos ± 5 cm (7.3.2); materiais conforme 5.1 (7.4.1). A emulsão só é admitida se empregada nas três camadas (5.1.1).",
  }));
  // bandejas geradas em torno do alvo: [posição, desvio ligante, desvio agregado]
  var POS = [["LE", 0.03, 0.6], ["eixo", -0.04, -0.5], ["LD", 0.02, 0.9], ["LE", -0.02, -0.8], ["eixo", 0.04, 0.3], ["LD", -0.03, -0.4]];
  function tx(ini, alvoL, alvoA, pref, fL, fA) {
    return POS.map(function (x, j) { return { est: String(ini + 2 * j), pos: x[0], reg: pref + "-" + (j + 1), lig: A.nstr(alvoL + x[1] * (fL || 1), 2), agr: A.nstr(alvoA + x[2] * (fA || 1), 1) }; });
  }
  function base(reg, data, ini, fim) {
    return { ident: { registro: reg, data: data, obra: "Obra A — BR-000", trecho: "Pista direita", local: "Est. " + ini + " a " + fim, camada: "TST — CAP polímero SBS" },
      params: Object.assign({}, F.padrao, { estIni: String(ini), estFim: String(fim), largura: "3,50", jornadas: "2", polimero: "4", volAgr: "30" }),
      proj1: G4.tsProj("dner-es-393-99-A", [100, 95, 38, 8, 6, 1]), proj2: G4.tsProj("dner-es-393-99-B", [100, 92, 20, 5, 1]),
      proj3: G4.tsProj("dner-es-393-99-C", [100, 92, 25, 1]) };
  }
  F.exemplos = [
    { nome: "Lote aceito — TST com CAP polímero, 3 camadas, 2 jornadas", dados: function () {
      var d = base("LOTE-TSTP-001", "2026-09-01", 700, 715);
      Object.assign(d, {
        tx1: tx(700, 1.20, 22, "BAND-1"), tx2: tx(701, 0.75, 11, "BAND-2"), tx3: tx(700, 0.50, 6, "BAND-3", 0.8, 0.6),
        gr1: G4.tsGran("dner-es-393-99-A", [["01/09", [100, 96, 36.5, 8.8, 5.4, 0.9]], ["01/09", [100, 94.1, 39.6, 7.2, 6.6, 1.2]], ["02/09", [100, 95.5, 37.9, 8.1, 6.2, 1.0]], ["02/09", [100, 94.8, 38.8, 7.7, 5.8, 1.1]]], "GR-1"),
        gr2: G4.tsGran("dner-es-393-99-B", [["01/09", [100, 93.1, 21.2, 4.6, 0.8]], ["01/09", [100, 91.2, 18.9, 5.5, 1.1]], ["02/09", [100, 92.5, 20.6, 5.2, 0.9]], ["02/09", [100, 91.8, 19.4, 4.8, 1.2]]], "GR-2"),
        gr3: G4.tsGran("dner-es-393-99-C", [["02/09", [100, 93.4, 24.1, 1.1]], ["02/09", [100, 90.8, 26.2, 0.8]], ["02/09", [100, 91.7, 25.3, 1.3]], ["02/09", [100, 92.6, 24.8, 0.9]]], "GR-3"),
        temp: [{ pos: "1ª camada 01/09 07h50", reg: "T-1", v: "161" }, { pos: "2ª camada 01/09 14h10", reg: "T-2", v: "165" }, { pos: "3ª camada 02/09 08h05", reg: "T-3", v: "163" }],
        geo: G4.tsGeo(700, 16, [0.7, -1.2, 1.5, -0.4], [0.2, 0.3, 0.1]),
        lig: [{ reg: "NF-1021 · CAP polímero", tipo: "CAP polímero SBS", massa: "29,8", ensC: "S", ens500: "S", res: "aprovado" }],
        agr: [{ reg: "AG-01", data: "01/09/2026", ades: "S", la: "27", if: "0,64", dur: "5" }],
        verif: [{ atende: "S" }, { atende: "S" }, { atende: "S" }, {}, { atende: "S" }, { atende: "S" }],
        obs: "Exemplo com valores digitados (bandejas geradas em torno das taxas de projeto)." });
      return d;
    } },
    { nome: "Lote rejeitado — 3ª camada com excesso de ligante e 1ª camada com agregado grosso na 3/4\"", dados: function () {
      var d = base("LOTE-TSTP-002", "2026-09-19", 800, 815);
      Object.assign(d, {
        tx1: tx(800, 1.22, 22.5, "BAND-1"), tx2: tx(801, 0.78, 11.2, "BAND-2"), tx3: tx(800, 0.68, 6.1, "BAND-3"),
        gr1: G4.tsGran("dner-es-393-99-A", [["19/09", [100, 95.2, 47.5, 9.1, 6.0, 1.0]], ["19/09", [100, 94.6, 46.1, 8.7, 5.7, 1.2]], ["20/09", [100, 95.8, 48.2, 9.4, 6.3, 0.9]], ["20/09", [100, 94.9, 46.8, 8.8, 5.9, 1.1]]], "GR-1"),
        gr2: G4.tsGran("dner-es-393-99-B", [["19/09", [100, 92.2, 20.4, 5.1, 0.9]], ["20/09", [100, 91.6, 19.7, 4.9, 1.0]]], "GR-2"),
        gr3: G4.tsGran("dner-es-393-99-C", [["20/09", [100, 92.1, 25.4, 1.0]]], "GR-3"),
        temp: [{ pos: "1ª camada", reg: "T-1", v: "162" }, { pos: "2ª camada", reg: "T-2", v: "166" }],
        geo: G4.tsGeo(800, 16, [0.9, -1.1, 1.6], [0.3, 0.2, 0.4]),
        lig: [{ reg: "NF-1188 · CAP polímero", tipo: "CAP polímero SBS", massa: "30,1", ensC: "S", ens500: "S", res: "aprovado" }],
        agr: [{ reg: "AG-02", data: "19/09/2026", ades: "S", la: "27", if: "0,61" }],
        verif: [{ atende: "S" }, { atende: "S" }, { atende: "S" }, {}, { atende: "S" }, { atende: "S" }],
        obs: "Exemplo de reprovação: taxa de ligante da 3ª camada com X̄ + ks > 0,70 l/m², 3/4\" da 1ª camada acima da faixa de trabalho (38 ± 7 %), temperatura da 3ª aplicação e granulometrias da 2ª jornada faltando." });
      return d;
    } },
  ];
})();
