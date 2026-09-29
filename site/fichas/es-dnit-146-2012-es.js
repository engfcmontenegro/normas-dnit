/*
 * Ficha de ACEITAÇÃO DE LOTE: DNIT 146/2012-ES — Tratamento superficial simples (TSS).
 * Motor comum do grupo: FE.aceitacaoG4a.tratamento (site/fichas/es-dnit-144-2014-es.js).
 *   5.1.1 CAP-150/200 ou RR-2C · 5.1.3 agregado: LA ≤ 40 %, índice de forma > 0,5, durabilidade < 12 %, faixa A ou B da Tabela 1
 *   5.1.4 Tabela 2: ligante 0,8–1,2 l/m², agregado 8–12 kg/m² (recomendadas) · 7.1 insumos · 7.2.1 temperatura
 *   7.2.2 taxas por bandeja: ligante ± 0,2 l/m², agregado ± 1,5 kg/m², mín. 5 por segmento < 3.000 m² · 7.3 réguas ≤ 0,5 cm, alinhamento ± 5 cm
 *   7.5 X̄ ± k·s (k "tabelado" — adotada a Tabela 1 da DNER-PRO 277/97, citada em 7.4)
 */
(function () {
  "use strict";
  var FE = window.FE, G = FE.aceitacaoG4a, fmt = FE.fmt;
  if (!G) { if (window.console) console.error("es-dnit-146-2012-es.js: carregue antes site/fichas/es-dnit-144-2014-es.js (motor FE.aceitacaoG4a)."); return; }
  var V = G.verif, B = G.bandejas;
  function geo(ini, lista) {
    return lista.map(function (x, i) { return { est: String(ini + i), r12: fmt(x[0], 1), r3: fmt(x[1], 1), ae: fmt(x[2], 0), ale: fmt(x[3], 0), ald: fmt(x[4], 0) }; });
  }

  G.tratamento({
    id: "dnit-146-2012-es", codigo: "DNIT 146/2012-ES", nome: "simples", nc: 1,
    rec: [[0.8, 1.2, 8, 12]],
    faixas: [["dnit-146-2012-es-A", "dnit-146-2012-es-B"]],
    resumo: "Reúne as taxas de ligante e de agregado por bandeja (importadas da ficha de taxa ou digitadas), o recebimento do ligante, a granulometria e a qualidade do agregado, " +
      "as temperaturas e o controle do produto; aplica o controle estatístico de 7.5 (projeto ± 0,2 l/m² e ± 1,5 kg/m²) e confere as frequências (7.1.2, 7.2.2 d, 7.3).",
    exemplos: [
      { nome: "Lote aceito — TSS com CAP-150/200 e agregado da faixa B, 1.400 m²", importar: [["impAgq", [["dnit-451-2024-me", 1], ["dnit-424-2020-me", 0], ["dnit-452-2024-me", 0]]]],
        dados: function () {
          return { ident: { registro: "LOTE-TSS-001", data: "2026-05-06", obra: "Obra A — BR-000", trecho: "Acostamento direito", local: "Est. 200 a 210", camada: "TSS — CAP-150/200", origem: "Pedreira X" },
            params: { estIni: "200", estFim: "210", largura: "7,00", ligante: "cap", projL1: "1,00", projA1: "10", faixa1: "dnit-146-2012-es-B", tMin: "150", tMax: "175",
              nAplic: "2", nCarreg: "1", ton: "2", jornadas: "2", volAgr: "12" },
            lig1: B([[200, "LE", 0.98], [202, "eixo", 1.05], [204, "LD", 0.96], [206, "LE", 1.03], [208, "eixo", 1.01], [209, "LD", 0.99]]),
            agr1: B([[200, "LE", 10.4], [202, "eixo", 9.6], [204, "LD", 10.1], [206, "LE", 10.8], [208, "eixo", 9.9], [209, "LD", 10.3]], 1),
            rec: [{ reg: "REC-CAP-01 · DNIT 095 (digitado)", classe: "150/200", sit: "aprovado" }],
            temp: [{ est: "200", t: "162" }, { est: "205", t: "165" }],
            gran1: [{ est: "06/05", reg: "GR-101", p9_5: "100", p4_8: "92,4", p2: "24,8", p0_074: "0,9" }, { est: "07/05", reg: "GR-102", p9_5: "100", p4_8: "90,1", p2: "27,3", p0_074: "1,1" }],
            proj: [{ p9_5: "100", p4_8: "92", p2: "25", p0_074: "1" }],
            geo: geo(200, [[0.2, 0.3, 1, -2, 2], [0.1, 0.4, 0, 1, -1], [0.3, 0.2, -1, 2, 1], [0.2, 0.3, 2, 0, -2], [0.2, 0.4, 1, -1, 0], [0.1, 0.3, 0, 2, 1],
              [0.3, 0.2, -2, 1, -1], [0.2, 0.3, 1, 0, 2], [0.2, 0.4, 0, -2, 1], [0.1, 0.3, -1, 1, 0], [0.2, 0.2, 1, 0, -1]]),
            verif: V(["S", "S", ["S", 1, 0], ["", 0, 0, "sem melhorador"], "S"]),
            obs: "Agregado: Los Angeles, índice de forma e adesividade importados dos exemplos das fichas ME; durabilidade não ensaiada neste lote." };
        },
        depois: function (d) { d.agq.push({ reg: "DUR-07 · DNER-ME 089 (digitado)", dur: "5,8" }); } },
      { nome: "Lote rejeitado — RR-2C com taxas dispersas (planilha da ficha de taxa), carregamento reprovado, agregado fora da faixa e lamelar",
        importar: [["impTaxa", [["dnit-144-2014-es", 2]]], ["impReceb", [["dnit-165-2013-em", 0]]], ["impGran1", [["dnit-412-2025-me", 0]]],
          ["impAgq", [["dnit-451-2024-me", 0], ["dnit-424-2020-me", 2]]]],
        dados: function () {
          return { ident: { registro: "LOTE-TSS-002", data: "2026-02-10", obra: "Obra A", trecho: "Rua C", local: "Est. 0 a 6", camada: "TSS — RR-2C e brita 0" },
            params: { estIni: "0", estFim: "6", largura: "7,00", ligante: "rr2c", projL1: "1,00", projA1: "10", faixa1: "dnit-146-2012-es-B", tMin: "50", tMax: "80", nCarreg: "1", ton: "3" },
            temp: [{ est: "0", t: "68" }],
            geo: geo(0, [[0.4, 0.6, 1, 3, -2], [0.3, 0.8, 2, 4, 6], [0.5, 0.7, 0, 2, 3]]),
            verif: V(["S", "S", "", ["", 0, 0], ["N", 1, 1, "excesso de ligante nas juntas transversais"]]),
            obs: "Exemplo de reprovação: taxas das bandejas e granulometria importadas dos exemplos das fichas de taxa e DNIT 412." };
        } },
    ],
  });
})();
