/*
 * Ficha de ACEITAÇÃO DE LOTE: DNER-ES 392/99 — Tratamento superficial duplo com asfalto polímero.
 * Montagem comum G4.ts / G4.tsBase (site/fichas/es-dner-es-391-99.js, carregado antes): as seções de controle e
 * aceitação são as da DNER-ES 391/99 (7.1 a 7.4), com duas camadas:
 *   5.1.1 a emulsão só é permitida se empregada em todas as camadas (a ficha usa um único tipo de ligante no lote);
 *   5.1.3 e faixas A (1ª camada), B (1ª ou 2ª) e C (2ª); 5.1.4.4 taxas recomendadas: 1ª 1,20–1,80 l/m² e 20–25 kg/m²,
 *   2ª 0,80–1,20 l/m² e 10–12 kg/m²; 7.2.2 tolerâncias ± 0,2 l/m² e ± 1,5 kg/m² por camada; 7.2.3 k com n = 11.
 */
(function () {
  "use strict";
  var FE = window.FE, A = FE.aceitacao, G4 = FE.aceitacaoG4b;
  if (!G4 || !G4.ts) { if (window.console) console.error("es-dner-es-392-99.js: carregue antes es-dnit-150-2010-es.js e es-dner-es-391-99.js."); return; }
  var ID = "dner-es-392-99";
  var F = G4.ts(Object.assign(G4.tsBase("392"), {
    id: ID, titulo: "Tratamento superficial duplo com asfalto polímero — aceitação de lote",
    resumo: "Duas camadas: taxas de ligante residual e de agregado por bandeja e granulometria do agregado de cada camada, temperatura, acabamento e alinhamentos, recebimento do ligante e controle do agregado; aceitação estatística da 7.4.2 com a tabela de 7.2.3.",
    camadas: [
      { nome: "1ª camada", faixaPadrao: "dner-es-392-99-A", faixas: function (f) { return /1ª/.test(f.condicao); }, rec: { lig: [1.2, 1.8], agr: [20, 25] } },
      { nome: "2ª camada", faixaPadrao: "dner-es-392-99-C", faixas: function (f) { return /2ª/.test(f.condicao); }, rec: { lig: [0.8, 1.2], agr: [10, 12] } },
    ],
    padrao: { projL1: "1,50", projA1: "22", projL2: "1,00", projA2: "11" },
    notas: "Critérios da DNER-ES 392/99 (7.4.2), por camada: taxa de ligante residual (projeto ± 0,2 l/m², 7.2.2.1), taxa de agregado (projeto ± 1,5 kg/m², 7.2.2.2) e granulometria do agregado (curva de projeto ± 7/5/2 %, faixas A/B/C de 5.1.3 e) pelo controle estatístico X̄ − ks ≥ mín. e X̄ + ks ≤ máx.; mínimo de 5 determinações por segmento de área < 3.000 m² (7.2.3; por camada, adotado); temperatura do CAP ≤ 180 °C (5.3.2); réguas ≤ 0,5 cm (7.3.1) e alinhamentos ± 5 cm (7.3.2); materiais conforme 5.1 (7.4.1). A emulsão só é admitida se empregada nas duas camadas (5.1.1).",
  }));
  function importa(d, k, refs) { A.exemplos.importar(F.params, d, k, refs); }
  function tx(lista, pref) { return lista.map(function (x, j) { return { est: x[0], pos: x[1], reg: pref + "-" + (j + 1), lig: A.nstr(x[2], 2), agr: A.nstr(x[3], 1) }; }); }
  F.exemplos = [
    { nome: "Lote aceito — TSD com emulsão RR-2C polímero; 2ª camada importada do exemplo da ficha de taxa (bandejas após ruptura)", dados: function () {
      var d = { ident: { registro: "LOTE-TSDP-001", data: "2026-09-03", obra: "Obra A — BR-000", trecho: "Pista direita", local: "Est. 120 a 135", camada: "TSD — emulsão RR-2C polímero" },
        params: Object.assign({}, F.padrao, { estIni: "120", estFim: "135", largura: "3,50", jornadas: "1", ligante: "emu", projL1: "1,30", projA1: "22", projL2: "0,80", projA2: "11", volAgr: "20" }),
        tx1: tx([["121", "LE", 1.34, 22.6], ["123", "eixo", 1.27, 21.4], ["125", "LD", 1.31, 23.1], ["128", "LE", 1.36, 22.2], ["131", "eixo", 1.25, 21.8], ["134", "LD", 1.29, 22.9]], "BAND-1"),
        proj1: G4.tsProj("dner-es-392-99-A", [100, 95, 38, 8, 2, 1]),
        gr1: G4.tsGran("dner-es-392-99-A", [["03/09", [100, 96.1, 36.4, 8.6, 2.4, 0.8]], ["03/09", [100, 94.2, 40.1, 7.1, 1.8, 1.1]]], "GR-1"),
        proj2: G4.tsProj("dner-es-392-99-C", [100, 92, 25, 1]),
        gr2: G4.tsGran("dner-es-392-99-C", [["04/09", [100, 93.5, 23.8, 1.2]], ["04/09", [100, 90.9, 26.7, 0.9]]], "GR-2"),
        geo: G4.tsGeo(120, 16, [0.8, -1.4, 1.9, -0.5], [0.2, 0.3, 0.1]),
        verif: [{ atende: "S" }, { atende: "S" }, { atende: "S" }, { atende: "S", obs: "SF a 50 °C: 64 s" }, { atende: "S" }, { atende: "S" }],
        obs: "Exemplo: bandejas da 2ª camada importadas do exemplo da ficha de taxa de aplicação (TSD, 2ª camada, RR-2C pesada após ruptura, resíduo 67 %) — taxa residual; 1ª camada e granulometrias digitadas; emulsão (exemplo da ficha DNIT 165, ensaios de polímero completados à mão), adesividade e LA dos exemplos das fichas 452 e 451." };
      importa(d, "impTx2", [["dnit-144-2014-es", 3]]);
      importa(d, "impLig", [["dnit-165-2013-em", 2]]);
      Object.assign(d.lig[0], { tipo: "RR-2C polímero", ensC: "S", ens100: "S", ens500: "S", obs: "exemplo da ficha 165; RE e IV conferidos no certificado" });
      importa(d, "impAgr", [["dnit-452-2024-me", 0], ["dnit-451-2024-me", 1]]);
      d.agr.push({ reg: "IF-01", data: "03/09/2026", if: "0,66", dur: "5" });
      return d;
    } },
    { nome: "Lote rejeitado — 2ª camada com nº 10 fora da faixa de trabalho e taxa de agregado baixa; tráfego liberado cedo", dados: function () {
      var d = { ident: { registro: "LOTE-TSDP-002", data: "2026-09-11", obra: "Obra B — BR-000", trecho: "Pista esquerda", local: "Est. 10 a 25", camada: "TSD — CAP polímero" },
        params: Object.assign({}, F.padrao, { estIni: "10", estFim: "25", largura: "3,50", jornadas: "1", polimero: "4", projL1: "1,50", projA1: "22", projL2: "1,00", projA2: "11" }),
        tx1: tx([["11", "LE", 1.52, 22.4], ["14", "eixo", 1.46, 21.7], ["17", "LD", 1.55, 22.9], ["20", "LE", 1.49, 21.9], ["23", "eixo", 1.51, 22.3]], "BAND-1"),
        tx2: tx([["12", "LE", 0.98, 9.4], ["15", "eixo", 1.03, 9.9], ["18", "LD", 0.96, 9.1], ["21", "LE", 1.01, 10.2], ["24", "eixo", 0.99, 9.6]], "BAND-2"),
        proj1: G4.tsProj("dner-es-392-99-A", [100, 95, 38, 8, 2, 1]),
        gr1: G4.tsGran("dner-es-392-99-A", [["11/09", [100, 95.6, 37.2, 7.8, 2.1, 0.9]], ["11/09", [100, 94.8, 39.3, 8.4, 2.6, 1.0]]], "GR-1"),
        proj2: G4.tsProj("dner-es-392-99-C", [100, 92, 25, 1]),
        gr2: G4.tsGran("dner-es-392-99-C", [["12/09", [100, 91.4, 33.6, 1.4]], ["12/09", [100, 92.8, 35.2, 1.7]]], "GR-2"),
        temp: [{ est: "", pos: "1ª camada 07h40", reg: "T-1", v: "164" }, { est: "", pos: "2ª camada 13h20", reg: "T-2", v: "166" }],
        geo: G4.tsGeo(10, 16, [1.1, -0.9, 2.2], [0.3, 0.2, 0.4]),
        verif: [{ atende: "S" }, { atende: "S" }, { atende: "S" }, {}, { atende: "S" }, { atende: "N", obs: "tráfego liberado antes do fim da compressão na est. 18" }],
        obs: "Exemplo de reprovação: nº 10 do agregado da 2ª camada acima da faixa de trabalho (25 ± 5 %), taxa de agregado da 2ª camada com X̄ − ks < 9,5 kg/m², tráfego liberado antes da hora (ressalva); ligante sem ensaios de recebimento registrados." };
      importa(d, "impAgr", [["dnit-452-2024-me", 0], ["dnit-451-2024-me", 2]]);
      return d;
    } },
  ];
})();
