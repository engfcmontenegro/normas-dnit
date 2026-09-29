/*
 * Ficha de ACEITAÇÃO DE LOTE: DNIT 147/2012-ES — Tratamento superficial duplo (TSD).
 * Motor comum do grupo: FE.aceitacaoG4a.tratamento (site/fichas/es-dnit-144-2014-es.js).
 *   5.1.1 CAP-150/200 ou RR-2C (emulsão só se empregada em todas as camadas) · 5.1.3 agregado: LA ≤ 40 %, índice de forma > 0,5,
 *   durabilidade < 12 %, Tabela 1: faixa A (1ª camada), B ou C (2ª camada) · 5.1.4 Tabela 2: 1ª camada 1,2–1,8 l/m² e 20–25 kg/m²;
 *   2ª camada 0,8–1,2 l/m² e 10–12 kg/m² · 7.2.2 taxas por bandeja em cada camada: ± 0,2 l/m² e ± 1,5 kg/m²; mín. 5 por segmento
 *   < 3.000 m² · 7.3 réguas ≤ 0,5 cm, alinhamento ± 5 cm · 7.5 X̄ ± k·s (Tabela 1 da DNER-PRO 277/97)
 */
(function () {
  "use strict";
  var FE = window.FE, G = FE.aceitacaoG4a, fmt = FE.fmt;
  if (!G) { if (window.console) console.error("es-dnit-147-2012-es.js: carregue antes site/fichas/es-dnit-144-2014-es.js (motor FE.aceitacaoG4a)."); return; }
  var V = G.verif, B = G.bandejas;
  function geo(ini, lista) {
    return lista.map(function (x, i) { return { est: String(ini + i), r12: fmt(x[0], 1), r3: fmt(x[1], 1), ae: fmt(x[2], 0), ale: fmt(x[3], 0), ald: fmt(x[4], 0) }; });
  }

  G.tratamento({
    id: "dnit-147-2012-es", codigo: "DNIT 147/2012-ES", nome: "duplo", nc: 2, ligUnico: "5.1.1",
    rec: [[1.2, 1.8, 20, 25], [0.8, 1.2, 10, 12]],
    faixas: [["dnit-147-2012-es-A"], ["dnit-147-2012-es-B", "dnit-147-2012-es-C"]],
    resumo: "Reúne, para a 1ª e a 2ª camada, as taxas de ligante e de agregado por bandeja (importadas da ficha de taxa — cada bandeja na camada da ficha de origem — ou digitadas), " +
      "o recebimento do ligante, a granulometria e a qualidade do agregado, as temperaturas e o controle do produto; aplica 7.5 (projeto ± 0,2 l/m² e ± 1,5 kg/m²) e as frequências.",
    exemplos: [
      { nome: "Lote aceito — TSD com RR-2C, 2ª camada importada da ficha de taxa, 1.500 m²", importar: [["impTaxa", [["dnit-144-2014-es", 3]]]],
        dados: function () {
          return { ident: { registro: "LOTE-TSD-001", data: "2026-06-02", obra: "Obra B — BR-000", trecho: "Pista esquerda", local: "Est. 120 a 135", camada: "TSD — RR-2C", origem: "Pedreira Y" },
            params: { estIni: "120", estFim: "135", largura: "5,00", ligante: "rr2c", projL1: "1,50", projA1: "22", projL2: "1,00", projA2: "11", faixa1: "dnit-147-2012-es-A",
              faixa2: "dnit-147-2012-es-B", tMin: "50", tMax: "80", nAplic: "2", nCarreg: "1", ton: "4", jornadas: "1", volAgr: "40" },
            lig1: B([[121, "LE", 1.46], [123, "eixo", 1.55], [125, "LD", 1.52], [128, "LE", 1.43], [131, "eixo", 1.58], [134, "LD", 1.49]]),
            agr1: B([[121, "LE", 22.4], [123, "eixo", 21.6], [125, "LD", 22.9], [128, "LE", 21.8], [131, "eixo", 22.3], [134, "LD", 22.0]], 1),
            rec: [{ reg: "REC-RR2C-05 · DNIT 165 (digitado)", classe: "RR-2C", sit: "aprovado", res: "67,4" }],
            temp: [{ est: "120", t: "62" }, { est: "128", t: "65" }],
            gran1: [{ est: "02/06", reg: "GR-201", p25_4: "100", p19: "95,2", p12_7: "38,5", p9_5: "8,1", p4_8: "1,9", p0_074: "0,6" }],
            gran2: [{ est: "03/06", reg: "GR-202", p12_7: "100", p9_5: "92,7", p4_8: "21,4", p2: "4,2", p0_074: "0,8" }],
            proj: [{ p25_4: "100", p19: "95", p12_7: "37", p9_5: "8", p4_8: "2", p0_074: "0,5" }, { p12_7: "100", p9_5: "93", p4_8: "20", p2: "5", p0_074: "1" }],
            agq: [{ reg: "AG-31 · caracterização (digitado)", la: "28", fi: "0,68", dur: "4,5", ades: "satisfatória" }],
            geo: geo(120, [[0.2, 0.3, 1, -1, 2], [0.1, 0.2, 0, 2, -1], [0.3, 0.4, -1, 1, 0], [0.2, 0.3, 2, -2, 1], [0.2, 0.3, 0, 1, -2], [0.1, 0.4, 1, 0, 1],
              [0.3, 0.2, -2, 1, 0], [0.2, 0.3, 1, -1, 2], [0.2, 0.4, 0, 2, -1], [0.1, 0.3, -1, 0, 1], [0.2, 0.2, 1, 1, 0], [0.3, 0.3, 0, -1, 2],
              [0.2, 0.4, 2, 0, -1], [0.1, 0.3, -1, 1, 1], [0.2, 0.2, 0, -2, 0], [0.2, 0.3, 1, 0, -1]]),
            verif: V(["S", "S", ["S", 1, 0], "", "S"]),
            obs: "2ª camada: bandejas importadas do exemplo da ficha de taxa (RR-2C pesada após a ruptura, resíduo de 67 %); 1ª camada digitada." };
        } },
      { nome: "Lote rejeitado — 1ª camada com agregado em excesso, CAP 85/100 (não admitido) e 2ª camada fora da faixa C",
        importar: [["impReceb", [["dnit-095-2006-em", 2]]], ["impAgq", [["dnit-452-2024-me", 2]]]],
        dados: function () {
          return { ident: { registro: "LOTE-TSD-002", data: "2026-06-20", obra: "Obra C", trecho: "Lote 3", local: "Est. 300 a 310", camada: "TSD — CAP" },
            params: { estIni: "300", estFim: "310", largura: "7,00", ligante: "cap", projL1: "1,50", projA1: "22", projL2: "1,00", projA2: "11", faixa1: "dnit-147-2012-es-A",
              faixa2: "dnit-147-2012-es-C", tMin: "150", tMax: "175", nAplic: "2", nCarreg: "1", ton: "3", jornadas: "1" },
            lig1: B([[300, "LE", 1.52], [302, "eixo", 1.44], [304, "LD", 1.61], [306, "LE", 1.39], [308, "eixo", 1.57]]),
            agr1: B([[300, "LE", 23.9], [302, "eixo", 24.6], [304, "LD", 22.8], [306, "LE", 25.1], [308, "eixo", 23.5]], 1),
            lig2: B([[301, "LE", 0.95], [303, "eixo", 1.08], [305, "LD", 1.02], [307, "LE", 0.97], [309, "eixo", 1.04]]),
            agr2: B([[301, "LE", 11.2], [303, "eixo", 10.6], [305, "LD", 11.5], [307, "LE", 10.9], [309, "eixo", 11.3]], 1),
            temp: [{ est: "300", t: "168" }, { est: "305", t: "171" }],
            gran1: [{ est: "20/06", reg: "GR-301", p25_4: "100", p19: "93,0", p12_7: "41,2", p9_5: "10,4", p4_8: "3,1", p0_074: "0,9" }],
            gran2: [{ est: "20/06", reg: "GR-302", p9_5: "100", p4_8: "78,5", p2: "14,0", p0_074: "3,4" }],
            geo: geo(300, [[0.2, 0.3, 1, -1, 2], [0.3, 0.5, 0, 2, -1], [0.2, 0.4, -1, 1, 0], [0.3, 0.6, 2, -2, 1], [0.2, 0.3, 0, 1, -2], [0.1, 0.4, 1, 0, 1],
              [0.3, 0.2, -2, 1, 0], [0.2, 0.3, 1, -1, 2], [0.2, 0.4, 0, 2, -1], [0.1, 0.3, -1, 0, 1], [0.2, 0.2, 1, 1, 0]]),
            verif: V(["S", "S", ["S", 1, 0], "", "S"]),
            obs: "Exemplo de reprovação: X̄ + k·s da taxa de agregado da 1ª camada acima de 23,5 kg/m², CAP 85/100 (a ES admite CAP-150/200), 2ª camada fora da faixa C e agregado com adesividade não satisfatória." };
        } },
    ],
  });
})();
